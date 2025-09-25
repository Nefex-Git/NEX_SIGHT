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
  insertChartSchema,
  insertViewSchema,
  DatabaseConnectionConfig 
} from "@shared/schema";
import { DatabaseConnectorService } from './services/database-connectors';

/**
 * Execute a user's SQL query by determining the appropriate database connection
 */
async function executeUserSQLQuery(sqlQuery: string, userId: string): Promise<any> {
  console.log('Executing user SQL query:', sqlQuery);

  // Get all table datasets for this user
  const dataSources = await storage.getDataSources(userId);
  const tableDatasets = dataSources.filter((ds: any) => ds.metadata?.isTableDataset);

  if (tableDatasets.length === 0) {
    throw new Error('No table datasets available for query execution');
  }

  // For now, use the first table dataset's connection (we can improve this later with query parsing)
  // In a real implementation, we would parse the SQL to identify which tables are being queried
  // and select the appropriate connection(s)
  const firstTableDataset = tableDatasets[0];
  const metadata = firstTableDataset.metadata as any;

  // Get connection configuration from metadata
  const connectionConfig = {
    host: metadata.host,
    port: metadata.port,
    database: metadata.database,
    username: metadata.username,
    password: metadata.password
  };

  // Execute query using DatabaseConnectorService
  const result = await DatabaseConnectorService.executeQuery(
    metadata.connectionType || firstTableDataset.type,
    connectionConfig,
    sqlQuery
  );

  return result;
}

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
      console.log(`Testing ${validatedConfig.type} connection to ${(validatedConfig as any).host}:${(validatedConfig as any).port || 'default'}`);
      const result = await testConnection(validatedConfig);
      
      if (result.success) {
        console.log('Connection test successful:', result.metadata);
        res.json({ 
          success: true, 
          message: 'Connection successful',
          metadata: result.metadata 
        });
      } else {
        console.log('Connection test failed:', result.error);
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

  // Data preview endpoint
  app.get('/api/data-sources/:id/preview', requireAuth, async (req: any, res) => {
    try {
      const dataSource = await storage.getDataSource(req.params.id);
      
      if (!dataSource || dataSource.userId !== req.user.id) {
        return res.status(404).json({ message: 'Data source not found' });
      }

      const limit = parseInt(req.query.limit as string) || 10;
      
      if (dataSource.type === 'csv' && dataSource.filename) {
        const filePath = path.join(process.cwd(), 'uploads', dataSource.filename);
        if (fs.existsSync(filePath)) {
          const csvData = await parseCSVFile(filePath);
          
          const previewData = {
            name: dataSource.name,
            columns: csvData.length > 0 ? Object.keys(csvData[0]) : [],
            rows: csvData.slice(0, limit).map(row => Object.values(row)),
            totalRows: csvData.length,
            type: dataSource.type
          };
          
          res.json(previewData);
        } else {
          res.status(404).json({ message: 'Data file not found' });
        }
      } else if (dataSource.metadata && (dataSource.metadata as any).isTableDataset) {
        // For table datasets, query the actual database
        try {
          const metadata = dataSource.metadata as any;
          const { parentConnection, schemaName, tableName } = metadata;
          
          // Build the SQL query with proper schema qualification
          const qualifiedTableName = schemaName ? `${schemaName}.${tableName}` : tableName;
          const query = `SELECT TOP ${limit} * FROM ${qualifiedTableName}`;
          
          // Get connection configuration from metadata
          const connectionConfig = {
            host: metadata.host,
            port: metadata.port,
            database: metadata.database,
            username: metadata.username,
            password: metadata.password
          };
          
          // Execute query using DatabaseConnectorService
          const result = await DatabaseConnectorService.executeQuery(
            metadata.connectionType || dataSource.type, 
            connectionConfig, 
            query
          );
          
          res.json({
            name: dataSource.name,
            columns: result.columns || [],
            rows: result.rows || [],
            totalRows: result.rowCount || 0,
            type: dataSource.type,
            message: `Preview from ${parentConnection} • ${schemaName}.${tableName}`
          });
          
        } catch (error) {
          console.error('Database preview error:', error);
          // Fallback to mock data if database query fails
          res.json({
            name: dataSource.name,
            columns: ['Error'],
            rows: [['Failed to connect to database']],
            totalRows: 0,
            type: dataSource.type,
            message: `Connection error: ${error instanceof Error ? error.message : 'Unknown error'}`
          });
        }
      } else {
        // For other non-CSV data sources, return mock data
        res.json({
          name: dataSource.name,
          columns: ['ID', 'Name', 'Value', 'Status'],
          rows: [
            ['1', 'Sample Data', '123.45', 'Active'],
            ['2', 'Example Row', '67.89', 'Inactive'],
            ['3', 'Test Entry', '45.67', 'Active'],
          ],
          totalRows: 150,
          type: dataSource.type,
          message: 'Preview from external data source (simulated)'
        });
      }
    } catch (error) {
      console.error('Data preview error:', error);
      res.status(500).json({ message: 'Failed to preview data' });
    }
  });

  // View endpoints
  app.get('/api/views', requireAuth, async (req: any, res) => {
    try {
      const views = await storage.getViews(req.user.id);
      res.json(views);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch views' });
    }
  });

  app.post('/api/views', requireAuth, async (req: any, res) => {
    try {
      const validation = insertViewSchema.safeParse({
        ...req.body,
        userId: req.user.id
      });

      if (!validation.success) {
        return res.status(400).json({ message: 'Invalid view data', errors: validation.error.errors });
      }

      const view = await storage.createView(validation.data);
      res.json(view);
    } catch (error) {
      res.status(500).json({ message: 'Failed to create view' });
    }
  });

  app.get('/api/views/:id', requireAuth, async (req: any, res) => {
    try {
      const view = await storage.getView(req.params.id);
      
      if (!view || view.userId !== req.user.id) {
        return res.status(404).json({ message: 'View not found' });
      }

      res.json(view);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch view' });
    }
  });

  app.put('/api/views/:id', requireAuth, async (req: any, res) => {
    try {
      const view = await storage.getView(req.params.id);
      
      if (!view || view.userId !== req.user.id) {
        return res.status(404).json({ message: 'View not found' });
      }

      const updated = await storage.updateView(req.params.id, {
        ...req.body,
        lastExecuted: new Date()
      });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update view' });
    }
  });

  app.delete('/api/views/:id', requireAuth, async (req: any, res) => {
    try {
      const view = await storage.getView(req.params.id);
      
      if (!view || view.userId !== req.user.id) {
        return res.status(404).json({ message: 'View not found' });
      }

      await storage.deleteView(req.params.id);
      res.json({ message: 'View deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete view' });
    }
  });

  // Execute view query endpoint
  app.post('/api/views/:id/execute', requireAuth, async (req: any, res) => {
    try {
      const view = await storage.getView(req.params.id);
      
      if (!view || view.userId !== req.user.id) {
        return res.status(404).json({ message: 'View not found' });
      }

      const startTime = Date.now();
      let results;

      try {
        // Execute the actual SQL query
        results = await executeUserSQLQuery(view.sqlQuery, req.user.id);
      } catch (queryError) {
        console.error('SQL query execution error:', queryError);
        // Fallback to error result
        results = {
          columns: ['Error'],
          rows: [['Query execution failed: ' + (queryError instanceof Error ? queryError.message : 'Unknown error')]],
          rowCount: 0
        };
      }

      const executionTime = Date.now() - startTime;
      const finalResults = {
        ...results,
        executionTime
      };

      // Update view with execution metadata
      await storage.updateView(req.params.id, {
        lastExecuted: new Date(),
        resultData: finalResults,
        rowCount: results.rowCount
      });

      res.json(finalResults);
    } catch (error) {
      console.error('View execution error:', error);
      res.status(500).json({ message: 'Failed to execute view' });
    }
  });

  // Direct SQL execution endpoint for SQL Engine
  app.post('/api/sql/execute', requireAuth, async (req: any, res) => {
    try {
      const { query } = req.body;

      if (!query || typeof query !== 'string') {
        return res.status(400).json({ message: 'SQL query is required' });
      }

      const startTime = Date.now();
      let results;

      try {
        // Execute the SQL query
        results = await executeUserSQLQuery(query, req.user.id);
      } catch (queryError) {
        console.error('Direct SQL execution error:', queryError);
        return res.status(400).json({ 
          message: 'Query execution failed',
          error: queryError instanceof Error ? queryError.message : 'Unknown error'
        });
      }

      const executionTime = Date.now() - startTime;
      const finalResults = {
        ...results,
        executionTime
      };

      res.json(finalResults);
    } catch (error) {
      console.error('SQL execution endpoint error:', error);
      res.status(500).json({ message: 'Failed to execute SQL query' });
    }
  });

  // Database connector endpoints
  app.get('/api/database-connectors', requireAuth, async (req: any, res) => {
    try {
      const connectors = DatabaseConnectorService.getAvailableConnectors();
      res.json(connectors);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch database connectors' });
    }
  });

  app.get('/api/database-connectors/:type', requireAuth, async (req: any, res) => {
    try {
      const connector = DatabaseConnectorService.getConnector(req.params.type);
      if (!connector) {
        return res.status(404).json({ message: 'Connector not found' });
      }
      res.json(connector);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch connector details' });
    }
  });

  app.post('/api/database-connectors/test', requireAuth, async (req: any, res) => {
    try {
      const { type, config } = req.body;
      
      if (!type || !config) {
        return res.status(400).json({ message: 'Type and config are required' });
      }

      const result = await DatabaseConnectorService.testConnection(type, config);
      res.json(result);
    } catch (error) {
      res.status(500).json({ 
        message: 'Connection test failed', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  app.post('/api/database-connectors/schema', requireAuth, async (req: any, res) => {
    try {
      const { type, config } = req.body;
      
      if (!type || !config) {
        return res.status(400).json({ message: 'Type and config are required' });
      }

      const schemaInfo = await DatabaseConnectorService.getSchemaInfo(type, config);
      res.json(schemaInfo);
    } catch (error) {
      res.status(500).json({ 
        message: 'Failed to fetch schema information', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  app.post('/api/data-sources/database', requireAuth, async (req: any, res) => {
    try {
      const { name, type, config } = req.body;
      
      if (!name || !type || !config) {
        return res.status(400).json({ message: 'Name, type, and config are required' });
      }

      // Test connection first
      const testResult = await DatabaseConnectorService.testConnection(type, config);
      if (!testResult.success) {
        return res.status(400).json({ 
          message: 'Database connection test failed', 
          error: testResult.message 
        });
      }

      // Encrypt configuration before storing
      const encryptedConfig = DatabaseConnectorService.encryptConfig(config);
      
      const dataSource = await storage.createDataSource({
        userId: req.user.id,
        name,
        type,
        status: 'connected',
        connectionConfig: encryptedConfig,
        metadata: {
          connector: DatabaseConnectorService.getConnector(type),
          connectionTest: testResult,
        },
      });

      res.json(dataSource);
    } catch (error) {
      res.status(500).json({ 
        message: 'Failed to create database connection', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // Create data source from specific database table
  app.post('/api/data-sources/table', requireAuth, async (req: any, res) => {
    try {
      const { 
        connectionName, 
        databaseType, 
        connectionConfig, 
        tableName, 
        schemaName, 
        tableMetadata 
      } = req.body;
      
      if (!connectionName || !databaseType || !connectionConfig || !tableName || !schemaName) {
        return res.status(400).json({ 
          message: 'Connection name, database type, config, table name, and schema name are required' 
        });
      }

      // Check if connection already exists for this user and name
      let connection = await storage.getConnectionByNameAndUser(req.user.id, connectionName);
      
      if (!connection) {
        // Create new connection if it doesn't exist
        const encryptedConfig = DatabaseConnectorService.encryptConfig(connectionConfig);
        
        connection = await storage.createConnection({
          userId: req.user.id,
          name: connectionName,
          type: databaseType,
          status: 'connected',
          connectionConfig: encryptedConfig,
          metadata: {
            host: connectionConfig.host,
            port: connectionConfig.port,
            database: connectionConfig.database,
            username: connectionConfig.username,
            // Don't store password in metadata
            lastTested: new Date().toISOString(),
          }
        });
      }

      // Create a data source for this specific table, referencing the connection
      const dataSource = await storage.createDataSource({
        userId: req.user.id,
        name: `${schemaName}.${tableName}`, // Simpler name without connection prefix
        type: databaseType,
        status: 'ready',
        connectionId: connection.id, // Reference to parent connection
        rowCount: tableMetadata?.rowCount,
        columnCount: tableMetadata?.columns?.length || 0,
        metadata: {
          isTableDataset: true, // Flag to identify table-based datasets
          connectorType: databaseType,
          connectionName,
          tableName,
          schemaName,
          tableType: tableMetadata?.type || 'table',
          columns: tableMetadata?.columns || [],
          parentConnection: connectionName,
          // Store connection details for backwards compatibility during transition
          host: connectionConfig.host,
          port: connectionConfig.port,
          database: connectionConfig.database,
          username: connectionConfig.username,
          password: connectionConfig.password,
          connectionType: databaseType,
        }
      });

      res.json(dataSource);
    } catch (error) {
      console.error('Table data source creation error:', error);
      res.status(500).json({ 
        message: 'Failed to create table data source',
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // Connection management endpoints
  app.get('/api/connections', requireAuth, async (req: any, res) => {
    try {
      const connections = await storage.getConnections(req.user.id);
      res.json(connections);
    } catch (error) {
      console.error('Failed to fetch connections:', error);
      res.status(500).json({ message: 'Failed to fetch connections' });
    }
  });

  app.get('/api/connections/:id', requireAuth, async (req: any, res) => {
    try {
      const connection = await storage.getConnection(req.params.id);
      
      if (!connection || connection.userId !== req.user.id) {
        return res.status(404).json({ message: 'Connection not found' });
      }

      res.json(connection);
    } catch (error) {
      console.error('Failed to fetch connection:', error);
      res.status(500).json({ message: 'Failed to fetch connection' });
    }
  });

  app.get('/api/connections/:id/tables', requireAuth, async (req: any, res) => {
    try {
      const connection = await storage.getConnection(req.params.id);
      
      if (!connection || connection.userId !== req.user.id) {
        return res.status(404).json({ message: 'Connection not found' });
      }

      // Get all table datasets for this connection
      const dataSources = await storage.getDataSources(req.user.id);
      const connectionTables = dataSources.filter((ds: any) => 
        ds.connectionId === req.params.id && ds.metadata?.isTableDataset
      );

      res.json(connectionTables);
    } catch (error) {
      console.error('Failed to fetch connection tables:', error);
      res.status(500).json({ message: 'Failed to fetch connection tables' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
