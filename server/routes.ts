import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import { setupAuth, requireAuth } from "./auth";
import { 
  analyzeDataWithAI, 
  transcribeAudio, 
  parseCSVFile, 
  generateKPIFromQuestion 
} from "./ai";
import {
  testConnection,
  encryptConnectionConfig,
  sanitizeConnectionConfig,
  DatabaseConnectionSchema,
  ApiConnectionSchema,
  SftpConnectionSchema
} from "./connectors";
import { 
  insertDataSourceSchema, 
  insertAiQuerySchema, 
  insertKpiSchema, 
  insertChartSchema 
} from "@shared/schema";

// Configure multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(process.cwd(), 'uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, `${uniqueSuffix}-${file.originalname}`);
    }
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || 
        file.mimetype === 'application/vnd.ms-excel' ||
        file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  setupAuth(app);

  // Data source endpoints
  app.get('/api/data-sources', requireAuth, async (req: any, res) => {
    try {
      const dataSources = await storage.getDataSources(req.user.id);
      res.json(dataSources);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch data sources' });
    }
  });

  app.post('/api/data-sources/upload', requireAuth, upload.single('file'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const filePath = req.file.path;
      
      // Parse CSV to get metadata
      const csvData = await parseCSVFile(filePath);
      const columns = csvData.length > 0 ? Object.keys(csvData[0]) : [];

      const dataSource = await storage.createDataSource({
        userId: req.user.id,
        name: req.file.originalname,
        type: 'csv',
        filename: req.file.filename,
        size: req.file.size,
        rowCount: csvData.length,
        columnCount: columns.length,
        status: 'ready',
        metadata: {
          columns,
          sampleData: csvData.slice(0, 3)
        }
      });

      res.json(dataSource);
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ message: 'Failed to upload file' });
    }
  });

  app.delete('/api/data-sources/:id', requireAuth, async (req: any, res) => {
    try {
      const dataSource = await storage.getDataSource(req.params.id);
      
      if (!dataSource || dataSource.userId !== req.user.id) {
        return res.status(404).json({ message: 'Data source not found' });
      }

      // Delete physical file if it exists
      if (dataSource.filename) {
        const filePath = path.join(process.cwd(), 'uploads', dataSource.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      await storage.deleteDataSource(req.params.id);
      res.json({ message: 'Data source deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete data source' });
    }
  });

  // Connector endpoints
  app.post('/api/connectors/test', requireAuth, async (req: any, res) => {
    try {
      const config = req.body;
      
      // Validate configuration based on type
      let validatedConfig;
      try {
        if (config.type === 'sftp') {
          validatedConfig = SftpConnectionSchema.parse(config);
        } else if (['rest', 'graphql', 'webhook'].includes(config.type)) {
          validatedConfig = ApiConnectionSchema.parse(config);
        } else {
          validatedConfig = DatabaseConnectionSchema.parse(config);
          
          // Additional validation for database types requiring specific fields
          const dbType = validatedConfig.type;
          if (['mysql', 'postgresql', 'sqlserver'].includes(dbType)) {
            if (!validatedConfig.host) {
              return res.status(400).json({ message: `Host is required for ${dbType}` });
            }
            if (!validatedConfig.username) {
              return res.status(400).json({ message: `Username is required for ${dbType}` });
            }
            if (!validatedConfig.password) {
              return res.status(400).json({ message: `Password is required for ${dbType}` });
            }
            if (['mysql', 'postgresql'].includes(dbType) && !validatedConfig.database) {
              return res.status(400).json({ message: `Database name is required for ${dbType}` });
            }
          } else if (dbType === 'sqlite') {
            if (!validatedConfig.database) {
              return res.status(400).json({ message: 'Database file path is required for SQLite' });
            }
          } else if (['mongodb', 'redis'].includes(dbType)) {
            if (!validatedConfig.host) {
              return res.status(400).json({ message: `Host is required for ${dbType}` });
            }
          }
        }
      } catch (validationError: any) {
        return res.status(400).json({ 
          message: 'Invalid configuration',
          errors: validationError.errors 
        });
      }

      // Test the connection
      const result = await testConnection(validatedConfig);
      
      if (result.success) {
        res.json({ 
          success: true, 
          message: 'Connection successful',
          metadata: result.metadata 
        });
      } else {
        res.status(400).json({ 
          success: false, 
          message: result.error || 'Connection failed' 
        });
      }
    } catch (error: any) {
      console.error('Connection test error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error while testing connection' 
      });
    }
  });

  app.post('/api/connectors', requireAuth, async (req: any, res) => {
    try {
      const config = req.body;
      
      // Validate configuration
      let validatedConfig;
      try {
        if (config.type === 'sftp') {
          validatedConfig = SftpConnectionSchema.parse(config);
        } else if (['rest', 'graphql', 'webhook'].includes(config.type)) {
          validatedConfig = ApiConnectionSchema.parse(config);
        } else {
          validatedConfig = DatabaseConnectionSchema.parse(config);
          
          // Additional validation for database types requiring specific fields
          const dbType = validatedConfig.type;
          if (['mysql', 'postgresql', 'sqlserver'].includes(dbType)) {
            if (!validatedConfig.host) {
              return res.status(400).json({ message: `Host is required for ${dbType}` });
            }
            if (!validatedConfig.username) {
              return res.status(400).json({ message: `Username is required for ${dbType}` });
            }
            if (!validatedConfig.password) {
              return res.status(400).json({ message: `Password is required for ${dbType}` });
            }
            if (['mysql', 'postgresql'].includes(dbType) && !validatedConfig.database) {
              return res.status(400).json({ message: `Database name is required for ${dbType}` });
            }
          } else if (dbType === 'sqlite') {
            if (!validatedConfig.database) {
              return res.status(400).json({ message: 'Database file path is required for SQLite' });
            }
          } else if (['mongodb', 'redis'].includes(dbType)) {
            if (!validatedConfig.host) {
              return res.status(400).json({ message: `Host is required for ${dbType}` });
            }
          }
        }
      } catch (validationError: any) {
        return res.status(400).json({ 
          message: 'Invalid configuration',
          errors: validationError.errors 
        });
      }

      // Create data source with connector configuration
      const dataSource = await storage.createDataSource({
        userId: req.user.id,
        name: validatedConfig.name,
        type: validatedConfig.type,
        status: 'connected',
        connectionConfig: encryptConnectionConfig(validatedConfig),
        metadata: {
          connectorType: validatedConfig.type,
          createdVia: 'connector'
        }
      });

      // Return sanitized response (no sensitive data)
      res.json({
        ...dataSource,
        connectionConfig: sanitizeConnectionConfig(validatedConfig)
      });
    } catch (error: any) {
      console.error('Connector save error:', error);
      res.status(500).json({ message: 'Failed to save connector' });
    }
  });

  // AI query endpoints
  app.post('/api/ai/query', requireAuth, async (req: any, res) => {
    try {
      const { question, dataSourceId, isVoiceQuery } = req.body;

      if (!question) {
        return res.status(400).json({ message: 'Question is required' });
      }

      let csvData = [];
      let dataSourceMetadata = {};

      // Load data if data source is specified
      if (dataSourceId) {
        const dataSource = await storage.getDataSource(dataSourceId);
        if (dataSource && dataSource.userId === req.user.id && dataSource.filename) {
          const filePath = path.join(process.cwd(), 'uploads', dataSource.filename);
          if (fs.existsSync(filePath)) {
            csvData = await parseCSVFile(filePath);
            dataSourceMetadata = dataSource.metadata || {};
          }
        }
      }

      // Analyze with AI
      const analysis = await analyzeDataWithAI({
        question,
        csvData,
        dataSourceMetadata
      });

      // Save the query
      const aiQuery = await storage.createAiQuery({
        userId: req.user.id,
        question,
        answer: analysis.answer,
        isVoiceQuery: isVoiceQuery ? 'true' : 'false',
        dataSourceId: dataSourceId || null,
        metadata: {
          chartData: analysis.chartData,
          chartType: analysis.chartType
        }
      });

      res.json({
        id: aiQuery.id,
        question: aiQuery.question,
        answer: aiQuery.answer,
        chartData: analysis.chartData,
        chartType: analysis.chartType,
        kpiValue: analysis.kpiValue,
        unit: analysis.unit,
        createdAt: aiQuery.createdAt
      });

    } catch (error) {
      console.error('AI query error:', error);
      res.status(500).json({ message: 'Failed to process AI query' });
    }
  });

  app.post('/api/ai/voice', requireAuth, upload.single('audio'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No audio file uploaded' });
      }

      const audioBuffer = fs.readFileSync(req.file.path);
      const transcription = await transcribeAudio(audioBuffer);
      
      // Clean up temp file
      fs.unlinkSync(req.file.path);

      res.json({ transcription });
    } catch (error) {
      console.error('Voice transcription error:', error);
      res.status(500).json({ message: 'Failed to transcribe audio' });
    }
  });

  app.get('/api/ai/queries', requireAuth, async (req: any, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const queries = await storage.getAiQueries(req.user.id, limit);
      res.json(queries);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch AI queries' });
    }
  });

  // KPI endpoints
  app.get('/api/kpis', requireAuth, async (req: any, res) => {
    try {
      const kpis = await storage.getKpis(req.user.id);
      res.json(kpis);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch KPIs' });
    }
  });

  app.post('/api/kpis', requireAuth, async (req: any, res) => {
    try {
      const validation = insertKpiSchema.safeParse({
        ...req.body,
        userId: req.user.id
      });

      if (!validation.success) {
        return res.status(400).json({ message: 'Invalid KPI data' });
      }

      const kpi = await storage.createKpi(validation.data);
      res.json(kpi);
    } catch (error) {
      res.status(500).json({ message: 'Failed to create KPI' });
    }
  });

  app.post('/api/kpis/from-query', requireAuth, async (req: any, res) => {
    try {
      const { question, answer } = req.body;
      
      if (!question || !answer) {
        return res.status(400).json({ message: 'Question and answer are required' });
      }

      const kpiData = generateKPIFromQuestion(question, answer);
      
      const kpi = await storage.createKpi({
        userId: req.user.id,
        question,
        value: kpiData.value,
        unit: kpiData.unit || null,
        changePercent: null
      });

      res.json(kpi);
    } catch (error) {
      res.status(500).json({ message: 'Failed to create KPI from query' });
    }
  });

  app.put('/api/kpis/:id', requireAuth, async (req: any, res) => {
    try {
      const kpi = await storage.getKpis(req.user.id);
      const targetKpi = kpi.find(k => k.id === req.params.id);
      
      if (!targetKpi) {
        return res.status(404).json({ message: 'KPI not found' });
      }

      const updated = await storage.updateKpi(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update KPI' });
    }
  });

  app.delete('/api/kpis/:id', requireAuth, async (req: any, res) => {
    try {
      const kpi = await storage.getKpis(req.user.id);
      const targetKpi = kpi.find(k => k.id === req.params.id);
      
      if (!targetKpi) {
        return res.status(404).json({ message: 'KPI not found' });
      }

      await storage.deleteKpi(req.params.id);
      res.json({ message: 'KPI deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete KPI' });
    }
  });

  // Chart endpoints
  app.get('/api/charts', requireAuth, async (req: any, res) => {
    try {
      const charts = await storage.getCharts(req.user.id);
      res.json(charts);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch charts' });
    }
  });

  app.post('/api/charts', requireAuth, async (req: any, res) => {
    try {
      const validation = insertChartSchema.safeParse({
        ...req.body,
        userId: req.user.id
      });

      if (!validation.success) {
        return res.status(400).json({ message: 'Invalid chart data' });
      }

      const chart = await storage.createChart(validation.data);
      res.json(chart);
    } catch (error) {
      res.status(500).json({ message: 'Failed to create chart' });
    }
  });

  app.get('/api/charts/:id', requireAuth, async (req: any, res) => {
    try {
      const chart = await storage.getChart(req.params.id);
      
      if (!chart || chart.userId !== req.user.id) {
        return res.status(404).json({ message: 'Chart not found' });
      }

      res.json(chart);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch chart' });
    }
  });

  app.put('/api/charts/:id', requireAuth, async (req: any, res) => {
    try {
      const chart = await storage.getChart(req.params.id);
      
      if (!chart || chart.userId !== req.user.id) {
        return res.status(404).json({ message: 'Chart not found' });
      }

      const updated = await storage.updateChart(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update chart' });
    }
  });

  app.delete('/api/charts/:id', requireAuth, async (req: any, res) => {
    try {
      const chart = await storage.getChart(req.params.id);
      
      if (!chart || chart.userId !== req.user.id) {
        return res.status(404).json({ message: 'Chart not found' });
      }

      await storage.deleteChart(req.params.id);
      res.json({ message: 'Chart deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete chart' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
