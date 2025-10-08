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
import { analyzeDataWithPrivacy } from "./ai-privacy";
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
  insertDashboardChartSchema,
  insertViewSchema,
  insertDashboardSchema,
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

  app.get('/api/data-sources/:id/columns', requireAuth, async (req: any, res) => {
    try {
      const dataSource = await storage.getDataSource(req.params.id);
      
      if (!dataSource || dataSource.userId !== req.user.id) {
        return res.status(404).json({ message: 'Data source not found' });
      }

      // Extract columns from metadata
      const metadata = dataSource.metadata as any;
      let columns: string[] = [];

      if (metadata?.columns) {
        columns = metadata.columns;
      } else if (metadata?.schema) {
        // For database tables, extract column names from schema
        columns = metadata.schema.map((col: any) => col.name || col.column_name);
      }

      res.json({ columns });
    } catch (error) {
      console.error('Get columns error:', error);
      res.status(500).json({ message: 'Failed to fetch columns' });
    }
  });

  app.get('/api/data-sources/:id/preview', requireAuth, async (req: any, res) => {
    try {
      const dataSource = await storage.getDataSource(req.params.id);
      
      if (!dataSource || dataSource.userId !== req.user.id) {
        return res.status(404).json({ message: 'Data source not found' });
      }

      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);

      // Use semantic layer - just get raw data without aggregation for preview
      const { ChartQueryService } = await import('./services/chart-query-service');
      
      const data = await ChartQueryService.executeChartQuery({
        chartId: 'preview',
        chartType: 'table', // Use table type to get raw data
        config: { limit: limit.toString() },
        dataSource,
        limit
      });

      res.json({ data });
    } catch (error) {
      console.error('Preview data fetch error:', error);
      res.status(500).json({ message: 'Failed to fetch preview data' });
    }
  });

  // Cache management endpoints
  app.get('/api/cache/stats', requireAuth, async (req: any, res) => {
    try {
      const { queryCache } = await import('./services/query-cache');
      const stats = await queryCache.getStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get cache stats' });
    }
  });

  app.post('/api/cache/clear', requireAuth, async (req: any, res) => {
    try {
      const { queryCache } = await import('./services/query-cache');
      await queryCache.clear();
      res.json({ message: 'Cache cleared successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to clear cache' });
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
      const { question, dataSourceIds, dataSourceId, isVoiceQuery } = req.body;

      if (!question) {
        return res.status(400).json({ message: 'Question is required' });
      }

      // Handle backward compatibility: convert single dataSourceId to array
      let sourceIds: string[] = [];
      if (dataSourceIds && Array.isArray(dataSourceIds)) {
        sourceIds = dataSourceIds;
      } else if (dataSourceId) {
        // Backward compatibility with old API
        sourceIds = [dataSourceId];
      }

      // Import and use the AI Query Service
      const { AiQueryService } = await import('./services/ai-query-service');
      
      const result = await AiQueryService.processQuery({
        question,
        dataSourceIds: sourceIds,
        userId: req.user.id,
        isVoiceQuery
      });

      // Save the query to history
      const aiQuery = await storage.createAiQuery({
        userId: req.user.id,
        question,
        answer: result.answer,
        isVoiceQuery: isVoiceQuery ? 'true' : 'false',
        dataSourceId: sourceIds.length > 0 ? sourceIds[0] : null,
        metadata: {
          chartData: result.chartData,
          chartType: result.chartType,
          sqlQuery: result.sqlQuery,
          relationships: result.relationships,
          ...(result.metadata || {})
        }
      });

      res.json({
        id: aiQuery.id,
        question: aiQuery.question,
        answer: aiQuery.answer,
        chartData: result.chartData,
        chartType: result.chartType,
        kpiValue: result.kpiValue,
        unit: result.unit,
        sqlQuery: result.sqlQuery,
        relationships: result.relationships,
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

  // Dashboard endpoints
  app.get('/api/dashboards', requireAuth, async (req: any, res) => {
    try {
      const dashboards = await storage.getDashboards(req.user.id);
      
      // Get KPI counts for each dashboard
      const dashboardsWithCounts = await Promise.all(dashboards.map(async (dashboard) => {
        const allKpis = await storage.getKpis(req.user.id);
        const kpiCount = allKpis.filter(kpi => kpi.dashboardId === dashboard.id).length;
        return {
          ...dashboard,
          kpiCount
        };
      }));
      
      res.json(dashboardsWithCounts);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch dashboards' });
    }
  });

  app.get('/api/dashboards/:id', requireAuth, async (req: any, res) => {
    try {
      const dashboard = await storage.getDashboard(req.params.id);
      
      if (!dashboard || dashboard.userId !== req.user.id) {
        return res.status(404).json({ message: 'Dashboard not found' });
      }

      // Get KPIs for this dashboard
      const allKpis = await storage.getKpis(req.user.id);
      const dashboardKpis = allKpis.filter(kpi => kpi.dashboardId === dashboard.id);

      res.json({
        ...dashboard,
        kpis: dashboardKpis
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch dashboard' });
    }
  });

  app.post('/api/dashboards', requireAuth, async (req: any, res) => {
    try {
      const validation = insertDashboardSchema.safeParse({
        ...req.body,
        userId: req.user.id
      });

      if (!validation.success) {
        return res.status(400).json({ message: 'Invalid dashboard data' });
      }

      const dashboard = await storage.createDashboard(validation.data);
      res.json(dashboard);
    } catch (error) {
      res.status(500).json({ message: 'Failed to create dashboard' });
    }
  });

  app.put('/api/dashboards/:id', requireAuth, async (req: any, res) => {
    try {
      const dashboard = await storage.getDashboard(req.params.id);
      
      if (!dashboard || dashboard.userId !== req.user.id) {
        return res.status(404).json({ message: 'Dashboard not found' });
      }

      const updated = await storage.updateDashboard(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update dashboard' });
    }
  });

  app.delete('/api/dashboards/:id', requireAuth, async (req: any, res) => {
    try {
      const dashboard = await storage.getDashboard(req.params.id);
      
      if (!dashboard || dashboard.userId !== req.user.id) {
        return res.status(404).json({ message: 'Dashboard not found' });
      }

      await storage.deleteDashboard(req.params.id);
      res.json({ message: 'Dashboard deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete dashboard' });
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

  app.get('/api/charts/:id/data', requireAuth, async (req: any, res) => {
    try {
      const chart = await storage.getChart(req.params.id);
      
      if (!chart || chart.userId !== req.user.id) {
        return res.status(404).json({ message: 'Chart not found' });
      }

      const dataSourceIds = chart.dataSourceIds || [];
      if (dataSourceIds.length === 0) {
        return res.json({ data: [] });
      }

      // Fetch data from the first data source (simplified version)
      // In a full implementation, would support joins across multiple sources
      const dataSource = await storage.getDataSource(dataSourceIds[0]);
      if (!dataSource || dataSource.userId !== req.user.id) {
        return res.json({ data: [] });
      }

      // Use semantic layer to execute query with caching
      const { ChartQueryService } = await import('./services/chart-query-service');
      
      const data = await ChartQueryService.executeChartQuery({
        chartId: chart.id,
        chartType: chart.type,
        config: chart.config as Record<string, any>,
        dataSource,
        limit: Math.min(parseInt(req.query.limit as string) || 100, 1000)
      });

      res.json({ data });
    } catch (error) {
      console.error('Chart data fetch error:', error);
      res.status(500).json({ message: 'Failed to fetch chart data' });
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

  // Dashboard Chart endpoints
  app.get('/api/dashboards/:dashboardId/charts', requireAuth, async (req: any, res) => {
    try {
      const dashboard = await storage.getDashboard(req.params.dashboardId);
      
      if (!dashboard || dashboard.userId !== req.user.id) {
        return res.status(404).json({ message: 'Dashboard not found' });
      }

      const dashboardCharts = await storage.getDashboardCharts(req.params.dashboardId);
      
      const chartsWithDetails = [];
      
      for (const dc of dashboardCharts) {
        const chart = await storage.getChart(dc.chartId);
        if (!chart || chart.userId !== req.user.id) {
          await storage.deleteDashboardChart(dc.id);
          continue;
        }
        chartsWithDetails.push({ ...dc, chart });
      }

      res.json(chartsWithDetails);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch dashboard charts' });
    }
  });

  app.post('/api/dashboards/:dashboardId/charts', requireAuth, async (req: any, res) => {
    try {
      const dashboard = await storage.getDashboard(req.params.dashboardId);
      
      if (!dashboard || dashboard.userId !== req.user.id) {
        return res.status(404).json({ message: 'Dashboard not found' });
      }

      const validation = insertDashboardChartSchema.safeParse({
        ...req.body,
        dashboardId: req.params.dashboardId
      });

      if (!validation.success) {
        return res.status(400).json({ message: 'Invalid dashboard chart data', errors: validation.error.issues });
      }

      const chart = await storage.getChart(validation.data.chartId);
      if (!chart || chart.userId !== req.user.id) {
        return res.status(403).json({ message: 'Chart not found or unauthorized' });
      }

      const dashboardChart = await storage.createDashboardChart(validation.data);
      res.json(dashboardChart);
    } catch (error) {
      res.status(500).json({ message: 'Failed to add chart to dashboard' });
    }
  });

  app.put('/api/dashboard-charts/:id', requireAuth, async (req: any, res) => {
    try {
      const dashboardChart = await storage.getDashboardChart(req.params.id);
      
      if (!dashboardChart) {
        return res.status(404).json({ message: 'Dashboard chart not found' });
      }

      const dashboard = await storage.getDashboard(dashboardChart.dashboardId);
      if (!dashboard || dashboard.userId !== req.user.id) {
        return res.status(403).json({ message: 'Unauthorized' });
      }

      const updated = await storage.updateDashboardChart(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update dashboard chart' });
    }
  });

  app.delete('/api/dashboard-charts/:id', requireAuth, async (req: any, res) => {
    try {
      const dashboardChart = await storage.getDashboardChart(req.params.id);
      
      if (!dashboardChart) {
        return res.status(404).json({ message: 'Dashboard chart not found' });
      }

      const dashboard = await storage.getDashboard(dashboardChart.dashboardId);
      if (!dashboard || dashboard.userId !== req.user.id) {
        return res.status(403).json({ message: 'Unauthorized' });
      }

      await storage.deleteDashboardChart(req.params.id);
      res.json({ message: 'Chart removed from dashboard successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to remove chart from dashboard' });
    }
  });

  // Chart drill-down endpoint - fetches detailed data for a chart
  app.post('/api/charts/:id/drill-down', requireAuth, async (req: any, res) => {
    try {
      const chart = await storage.getChart(req.params.id);
      
      if (!chart || chart.userId !== req.user.id) {
        return res.status(404).json({ message: 'Chart not found' });
      }

      if (!chart.query) {
        return res.status(400).json({ message: 'Chart does not have an associated query' });
      }

      const result = await executeUserSQLQuery(chart.query, req.user.id);
      
      res.json({
        data: result,
        query: chart.query,
        chartTitle: chart.title
      });
    } catch (error: any) {
      res.status(500).json({ message: 'Failed to fetch drill-down data', error: error.message });
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
