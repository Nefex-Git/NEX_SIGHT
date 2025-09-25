import { DatabaseConnectorType, DatabaseConnectionConfig, ConnectionTestResult } from "@shared/schema";
import crypto from 'crypto';
import sql from 'mssql';

/**
 * Database Connector Service - Inspired by Apache Superset's BaseEngineSpec
 * Provides connection management, testing, and query execution for various databases
 */

export interface DatabaseConnectorSpec {
  name: string;
  displayName: string;
  description: string;
  icon: string;
  category: 'relational' | 'warehouse' | 'nosql' | 'timeseries' | 'file' | 'api';
  requiresHost: boolean;
  requiresPort: boolean;
  requiresDatabase: boolean;
  requiresCredentials: boolean;
  defaultPort?: number;
  connectionStringTemplate: string;
  npmPackages: string[];
  testQuery: string;
  schemaQuery?: string;
  tablesQuery?: string;
  supportsSchema: boolean;
  supportsSSL: boolean;
  timeGrainExpressions?: Record<string, string>;
}

// Database connector specifications (similar to Apache Superset)
export const DATABASE_CONNECTORS: Record<string, DatabaseConnectorSpec> = {
  [DatabaseConnectorType.MYSQL]: {
    name: 'mysql',
    displayName: 'MySQL',
    description: 'Popular open-source relational database',
    icon: 'database',
    category: 'relational',
    requiresHost: true,
    requiresPort: true,
    requiresDatabase: true,
    requiresCredentials: true,
    defaultPort: 3306,
    connectionStringTemplate: 'mysql://{username}:{password}@{host}:{port}/{database}',
    npmPackages: ['mysql2'],
    testQuery: 'SELECT 1 as test',
    schemaQuery: 'SHOW DATABASES',
    tablesQuery: 'SHOW TABLES FROM {database}',
    supportsSchema: true,
    supportsSSL: true,
    timeGrainExpressions: {
      'PT1S': 'DATE_FORMAT({col}, "%Y-%m-%d %H:%i:%S")',
      'PT1M': 'DATE_FORMAT({col}, "%Y-%m-%d %H:%i:00")',
      'PT1H': 'DATE_FORMAT({col}, "%Y-%m-%d %H:00:00")',
      'P1D': 'DATE_FORMAT({col}, "%Y-%m-%d")',
      'P1W': 'DATE_FORMAT(DATE_SUB({col}, INTERVAL WEEKDAY({col}) DAY), "%Y-%m-%d")',
      'P1M': 'DATE_FORMAT({col}, "%Y-%m-01")',
      'P1Y': 'DATE_FORMAT({col}, "%Y-01-01")',
    }
  },

  [DatabaseConnectorType.POSTGRESQL]: {
    name: 'postgresql',
    displayName: 'PostgreSQL',
    description: 'Advanced open-source relational database',
    icon: 'database',
    category: 'relational',
    requiresHost: true,
    requiresPort: true,
    requiresDatabase: true,
    requiresCredentials: true,
    defaultPort: 5432,
    connectionStringTemplate: 'postgresql://{username}:{password}@{host}:{port}/{database}',
    npmPackages: ['pg', '@types/pg'],
    testQuery: 'SELECT 1 as test',
    schemaQuery: 'SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT IN (\'information_schema\', \'pg_catalog\', \'pg_toast\')',
    tablesQuery: 'SELECT table_name FROM information_schema.tables WHERE table_schema = \'{schema}\'',
    supportsSchema: true,
    supportsSSL: true,
    timeGrainExpressions: {
      'PT1S': 'DATE_TRUNC(\'second\', {col})',
      'PT1M': 'DATE_TRUNC(\'minute\', {col})',
      'PT1H': 'DATE_TRUNC(\'hour\', {col})',
      'P1D': 'DATE_TRUNC(\'day\', {col})',
      'P1W': 'DATE_TRUNC(\'week\', {col})',
      'P1M': 'DATE_TRUNC(\'month\', {col})',
      'P3M': 'DATE_TRUNC(\'quarter\', {col})',
      'P1Y': 'DATE_TRUNC(\'year\', {col})',
    }
  },

  [DatabaseConnectorType.SQLSERVER]: {
    name: 'sqlserver',
    displayName: 'Microsoft SQL Server',
    description: 'Microsoft\'s enterprise database platform',
    icon: 'server',
    category: 'relational',
    requiresHost: true,
    requiresPort: true,
    requiresDatabase: true,
    requiresCredentials: true,
    defaultPort: 1433,
    connectionStringTemplate: 'mssql://{username}:{password}@{host}:{port}/{database}',
    npmPackages: ['mssql'],
    testQuery: 'SELECT 1 as test',
    schemaQuery: 'SELECT name FROM sys.databases WHERE database_id > 4',
    tablesQuery: 'SELECT table_name FROM information_schema.tables WHERE table_schema = \'{schema}\'',
    supportsSchema: true,
    supportsSSL: true,
    timeGrainExpressions: {
      'PT1S': 'FORMAT({col}, \'yyyy-MM-dd HH:mm:ss\')',
      'PT1M': 'FORMAT(DATEADD(minute, DATEDIFF(minute, 0, {col}), 0), \'yyyy-MM-dd HH:mm:00\')',
      'PT1H': 'FORMAT(DATEADD(hour, DATEDIFF(hour, 0, {col}), 0), \'yyyy-MM-dd HH:00:00\')',
      'P1D': 'FORMAT({col}, \'yyyy-MM-dd\')',
      'P1W': 'FORMAT(DATEADD(week, DATEDIFF(week, 0, {col}), 0), \'yyyy-MM-dd\')',
      'P1M': 'FORMAT(DATEFROMPARTS(YEAR({col}), MONTH({col}), 1), \'yyyy-MM-01\')',
      'P1Y': 'FORMAT(DATEFROMPARTS(YEAR({col}), 1, 1), \'yyyy-01-01\')',
    }
  },

  [DatabaseConnectorType.ORACLE]: {
    name: 'oracle',
    displayName: 'Oracle Database',
    description: 'Enterprise-grade relational database',
    icon: 'database',
    category: 'relational',
    requiresHost: true,
    requiresPort: true,
    requiresDatabase: true,
    requiresCredentials: true,
    defaultPort: 1521,
    connectionStringTemplate: 'oracle://{username}:{password}@{host}:{port}/{database}',
    npmPackages: ['oracledb'],
    testQuery: 'SELECT 1 FROM DUAL',
    supportsSchema: true,
    supportsSSL: true,
    timeGrainExpressions: {
      'PT1S': 'TO_CHAR({col}, \'YYYY-MM-DD HH24:MI:SS\')',
      'PT1M': 'TO_CHAR(TRUNC({col}, \'MI\'), \'YYYY-MM-DD HH24:MI:00\')',
      'PT1H': 'TO_CHAR(TRUNC({col}, \'HH\'), \'YYYY-MM-DD HH24:00:00\')',
      'P1D': 'TO_CHAR(TRUNC({col}), \'YYYY-MM-DD\')',
      'P1W': 'TO_CHAR(TRUNC({col}, \'IW\'), \'YYYY-MM-DD\')',
      'P1M': 'TO_CHAR(TRUNC({col}, \'MM\'), \'YYYY-MM-01\')',
      'P1Y': 'TO_CHAR(TRUNC({col}, \'YYYY\'), \'YYYY-01-01\')',
    }
  },

  [DatabaseConnectorType.BIGQUERY]: {
    name: 'bigquery',
    displayName: 'Google BigQuery',
    description: 'Serverless data warehouse by Google',
    icon: 'cloud',
    category: 'warehouse',
    requiresHost: false,
    requiresPort: false,
    requiresDatabase: false,
    requiresCredentials: true,
    connectionStringTemplate: 'bigquery://{projectId}',
    npmPackages: ['@google-cloud/bigquery'],
    testQuery: 'SELECT 1 as test',
    supportsSchema: true,
    supportsSSL: true,
    timeGrainExpressions: {
      'PT1S': 'DATETIME_TRUNC({col}, SECOND)',
      'PT1M': 'DATETIME_TRUNC({col}, MINUTE)',
      'PT1H': 'DATETIME_TRUNC({col}, HOUR)',
      'P1D': 'DATE_TRUNC({col}, DAY)',
      'P1W': 'DATE_TRUNC({col}, WEEK)',
      'P1M': 'DATE_TRUNC({col}, MONTH)',
      'P3M': 'DATE_TRUNC({col}, QUARTER)',
      'P1Y': 'DATE_TRUNC({col}, YEAR)',
    }
  },

  [DatabaseConnectorType.SNOWFLAKE]: {
    name: 'snowflake',
    displayName: 'Snowflake',
    description: 'Cloud-native data warehouse',
    icon: 'snowflake',
    category: 'warehouse',
    requiresHost: true,
    requiresPort: false,
    requiresDatabase: true,
    requiresCredentials: true,
    connectionStringTemplate: 'snowflake://{username}:{password}@{account}.{region}/{database}?warehouse={warehouse}&role={role}',
    npmPackages: ['snowflake-sdk'],
    testQuery: 'SELECT 1 as test',
    supportsSchema: true,
    supportsSSL: true,
    timeGrainExpressions: {
      'PT1S': 'DATE_TRUNC(\'second\', {col})',
      'PT1M': 'DATE_TRUNC(\'minute\', {col})',
      'PT1H': 'DATE_TRUNC(\'hour\', {col})',
      'P1D': 'DATE_TRUNC(\'day\', {col})',
      'P1W': 'DATE_TRUNC(\'week\', {col})',
      'P1M': 'DATE_TRUNC(\'month\', {col})',
      'P3M': 'DATE_TRUNC(\'quarter\', {col})',
      'P1Y': 'DATE_TRUNC(\'year\', {col})',
    }
  },

  [DatabaseConnectorType.CLICKHOUSE]: {
    name: 'clickhouse',
    displayName: 'ClickHouse',
    description: 'Fast columnar database for analytics',
    icon: 'zap',
    category: 'warehouse',
    requiresHost: true,
    requiresPort: true,
    requiresDatabase: true,
    requiresCredentials: true,
    defaultPort: 9000,
    connectionStringTemplate: 'clickhouse://{username}:{password}@{host}:{port}/{database}',
    npmPackages: ['@clickhouse/client'],
    testQuery: 'SELECT 1 as test',
    supportsSchema: true,
    supportsSSL: true,
    timeGrainExpressions: {
      'PT1S': 'toStartOfSecond({col})',
      'PT1M': 'toStartOfMinute({col})',
      'PT1H': 'toStartOfHour({col})',
      'P1D': 'toStartOfDay({col})',
      'P1W': 'toMonday({col})',
      'P1M': 'toStartOfMonth({col})',
      'P3M': 'toStartOfQuarter({col})',
      'P1Y': 'toStartOfYear({col})',
    }
  },

  [DatabaseConnectorType.MONGODB]: {
    name: 'mongodb',
    displayName: 'MongoDB (via Drill)',
    description: 'Document database via Apache Drill',
    icon: 'database',
    category: 'nosql',
    requiresHost: true,
    requiresPort: true,
    requiresDatabase: false,
    requiresCredentials: false,
    defaultPort: 8047,
    connectionStringTemplate: 'drill+sadrill://{drillHost}:{drillPort}',
    npmPackages: ['drill-sqlalchemy-proxy'],
    testQuery: 'SELECT 1 as test FROM (VALUES(1))',
    supportsSchema: false,
    supportsSSL: false,
  },

  [DatabaseConnectorType.SQLITE]: {
    name: 'sqlite',
    displayName: 'SQLite',
    description: 'Lightweight file-based database',
    icon: 'file-database',
    category: 'relational',
    requiresHost: false,
    requiresPort: false,
    requiresDatabase: false,
    requiresCredentials: false,
    connectionStringTemplate: 'sqlite:///{filePath}',
    npmPackages: ['sqlite3'],
    testQuery: 'SELECT 1 as test',
    supportsSchema: false,
    supportsSSL: false,
  },

  [DatabaseConnectorType.CSV]: {
    name: 'csv',
    displayName: 'CSV File',
    description: 'Comma-separated values file',
    icon: 'file-text',
    category: 'file',
    requiresHost: false,
    requiresPort: false,
    requiresDatabase: false,
    requiresCredentials: false,
    connectionStringTemplate: 'file://{filePath}',
    npmPackages: ['csv-parser'],
    testQuery: '',
    supportsSchema: false,
    supportsSSL: false,
  },
};

/**
 * Database Connection Service
 */
export class DatabaseConnectorService {
  private static readonly ENCRYPTION_KEY = process.env.DATABASE_ENCRYPTION_KEY || 'default-key-change-in-production';

  /**
   * Get all available database connectors
   */
  static getAvailableConnectors(): DatabaseConnectorSpec[] {
    return Object.values(DATABASE_CONNECTORS);
  }

  /**
   * Get connector specification by type
   */
  static getConnector(type: string): DatabaseConnectorSpec | null {
    return DATABASE_CONNECTORS[type] || null;
  }

  /**
   * Build connection string from configuration
   */
  static buildConnectionString(type: string, config: DatabaseConnectionConfig): string {
    const connector = this.getConnector(type);
    if (!connector) {
      throw new Error(`Unknown database connector type: ${type}`);
    }

    let connectionString = connector.connectionStringTemplate;

    // Replace template variables
    const replacements: Record<string, string> = {
      username: config.username || '',
      password: config.password || '',
      host: config.host || '',
      port: (config.port || connector.defaultPort || '').toString(),
      database: config.database || '',
      projectId: config.projectId || '',
      account: config.account || '',
      region: config.region || '',
      warehouse: config.warehouse || '',
      role: config.role || '',
      drillHost: config.drillHost || config.host || '',
      drillPort: (config.drillPort || 8047).toString(),
      filePath: config.filePath || '',
    };

    Object.entries(replacements).forEach(([key, value]) => {
      connectionString = connectionString.replace(new RegExp(`{${key}}`, 'g'), encodeURIComponent(value));
    });

    // Add SSL options if supported
    if (connector.supportsSSL && config.sslMode) {
      const separator = connectionString.includes('?') ? '&' : '?';
      connectionString += `${separator}sslmode=${config.sslMode}`;
    }

    // Add additional options
    if (config.options && Object.keys(config.options).length > 0) {
      const separator = connectionString.includes('?') ? '&' : '?';
      const optionString = Object.entries(config.options)
        .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
        .join('&');
      connectionString += `${separator}${optionString}`;
    }

    return connectionString;
  }

  /**
   * Encrypt connection configuration for storage
   */
  static encryptConfig(config: DatabaseConnectionConfig): string {
    const cipher = crypto.createCipher('aes-256-cbc', this.ENCRYPTION_KEY);
    let encrypted = cipher.update(JSON.stringify(config), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  /**
   * Decrypt connection configuration from storage
   */
  static decryptConfig(encryptedConfig: string): DatabaseConnectionConfig {
    try {
      const decipher = crypto.createDecipher('aes-256-cbc', this.ENCRYPTION_KEY);
      let decrypted = decipher.update(encryptedConfig, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return JSON.parse(decrypted);
    } catch (error) {
      throw new Error('Failed to decrypt connection configuration');
    }
  }

  /**
   * Test database connection
   */
  static async testConnection(type: string, config: DatabaseConnectionConfig): Promise<ConnectionTestResult> {
    const startTime = Date.now();
    const connector = this.getConnector(type);
    
    if (!connector) {
      return {
        success: false,
        message: `Unknown database connector type: ${type}`,
      };
    }

    try {
      // For file-based sources, check file existence
      if (connector.category === 'file') {
        // This would check file existence in a real implementation
        return {
          success: true,
          message: 'File connection successful',
          latency: Date.now() - startTime,
        };
      }

      // For now, simulate connection testing
      // In a real implementation, this would use the appropriate database drivers
      await new Promise(resolve => setTimeout(resolve, 100)); // Simulate network delay

      // Mock successful connection
      const latency = Date.now() - startTime;
      
      return {
        success: true,
        message: `Successfully connected to ${connector.displayName}`,
        latency,
        metadata: {
          serverVersion: 'Mock Server v1.0',
          schemas: ['public', 'information_schema'],
        },
      };
      
    } catch (error) {
      return {
        success: false,
        message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        latency: Date.now() - startTime,
      };
    }
  }

  /**
   * Execute query on database connection
   */
  static async executeQuery(type: string, config: DatabaseConnectionConfig, query: string): Promise<any[]> {
    const connector = this.getConnector(type);
    
    if (!connector) {
      throw new Error(`Unknown database connector type: ${type}`);
    }

    // For now, return mock data
    // In a real implementation, this would execute the query using the appropriate driver
    return [
      { id: 1, name: 'Sample Data', value: 100 },
      { id: 2, name: 'Test Record', value: 200 },
    ];
  }

  /**
   * Get database schema information
   */
  static async getSchemaInfo(type: string, config: DatabaseConnectionConfig): Promise<{
    schemas: string[];
    tables: Array<{
      name: string;
      schema: string;
      type: 'table' | 'view';
      rowCount?: number;
      columns: Array<{
        name: string;
        type: string;
        nullable: boolean;
        isPrimaryKey: boolean;
        defaultValue?: string;
      }>;
    }>;
  }> {
    const connector = this.getConnector(type);
    
    if (!connector) {
      throw new Error(`Unknown database connector type: ${type}`);
    }

    try {
      // Generate tables and schema information based on database type
      switch (type) {
        case 'mysql':
          return await this.getMySQLSchema(config);
        case 'postgresql':
          return await this.getPostgreSQLSchema(config);
        case 'sqlserver':
          return await this.getSQLServerSchema(config);
        case 'oracle':
          return await this.getOracleSchema(config);
        case 'sqlite':
          return await this.getSQLiteSchema(config);
        default:
          // For other databases, return mock data for now
          return {
            schemas: ['public'],
            tables: [
              {
                name: 'sample_table_1',
                schema: 'public',
                type: 'table',
                rowCount: 1000,
                columns: [
                  { name: 'id', type: 'integer', nullable: false, isPrimaryKey: true },
                  { name: 'name', type: 'varchar', nullable: true, isPrimaryKey: false },
                  { name: 'created_at', type: 'timestamp', nullable: true, isPrimaryKey: false }
                ]
              },
              {
                name: 'sample_table_2',
                schema: 'public',
                type: 'table',
                rowCount: 500,
                columns: [
                  { name: 'id', type: 'integer', nullable: false, isPrimaryKey: true },
                  { name: 'value', type: 'decimal', nullable: true, isPrimaryKey: false }
                ]
              }
            ]
          };
      }
    } catch (error) {
      console.error('Schema introspection error:', error);
      throw new Error(`Failed to retrieve schema: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private static async getMySQLSchema(config: DatabaseConnectionConfig): Promise<any> {
    // Mock MySQL schema - in real implementation, would use mysql2 driver
    return {
      schemas: [config.database || 'default'],
      tables: [
        {
          name: 'customers',
          schema: config.database,
          type: 'table' as const,
          rowCount: 2500,
          columns: [
            { name: 'customer_id', type: 'int', nullable: false, isPrimaryKey: true },
            { name: 'first_name', type: 'varchar(50)', nullable: false, isPrimaryKey: false },
            { name: 'last_name', type: 'varchar(50)', nullable: false, isPrimaryKey: false },
            { name: 'email', type: 'varchar(100)', nullable: true, isPrimaryKey: false },
            { name: 'created_at', type: 'datetime', nullable: true, isPrimaryKey: false }
          ]
        },
        {
          name: 'orders',
          schema: config.database,
          type: 'table' as const,
          rowCount: 15000,
          columns: [
            { name: 'order_id', type: 'int', nullable: false, isPrimaryKey: true },
            { name: 'customer_id', type: 'int', nullable: false, isPrimaryKey: false },
            { name: 'order_date', type: 'datetime', nullable: false, isPrimaryKey: false },
            { name: 'total_amount', type: 'decimal(10,2)', nullable: false, isPrimaryKey: false },
            { name: 'status', type: 'varchar(20)', nullable: false, isPrimaryKey: false }
          ]
        },
        {
          name: 'products',
          schema: config.database,
          type: 'table' as const,
          rowCount: 800,
          columns: [
            { name: 'product_id', type: 'int', nullable: false, isPrimaryKey: true },
            { name: 'product_name', type: 'varchar(255)', nullable: false, isPrimaryKey: false },
            { name: 'price', type: 'decimal(10,2)', nullable: false, isPrimaryKey: false },
            { name: 'category', type: 'varchar(50)', nullable: true, isPrimaryKey: false }
          ]
        }
      ]
    };
  }

  private static async getPostgreSQLSchema(config: DatabaseConnectionConfig): Promise<any> {
    // Mock PostgreSQL schema - in real implementation, would use pg driver
    return {
      schemas: ['public', 'analytics'],
      tables: [
        {
          name: 'users',
          schema: 'public',
          type: 'table' as const,
          rowCount: 1200,
          columns: [
            { name: 'id', type: 'serial', nullable: false, isPrimaryKey: true },
            { name: 'username', type: 'varchar(255)', nullable: false, isPrimaryKey: false },
            { name: 'email', type: 'varchar(255)', nullable: false, isPrimaryKey: false },
            { name: 'created_at', type: 'timestamp', nullable: true, isPrimaryKey: false }
          ]
        },
        {
          name: 'products',
          schema: 'public',
          type: 'table' as const,
          rowCount: 800,
          columns: [
            { name: 'id', type: 'serial', nullable: false, isPrimaryKey: true },
            { name: 'name', type: 'varchar(255)', nullable: false, isPrimaryKey: false },
            { name: 'price', type: 'numeric(10,2)', nullable: false, isPrimaryKey: false },
            { name: 'description', type: 'text', nullable: true, isPrimaryKey: false }
          ]
        },
        {
          name: 'sales_summary',
          schema: 'analytics',
          type: 'view' as const,
          columns: [
            { name: 'month', type: 'date', nullable: false, isPrimaryKey: false },
            { name: 'total_sales', type: 'numeric', nullable: true, isPrimaryKey: false },
            { name: 'order_count', type: 'integer', nullable: true, isPrimaryKey: false }
          ]
        }
      ]
    };
  }

  private static async getSQLServerSchema(config: DatabaseConnectionConfig): Promise<any> {
    let pool: sql.ConnectionPool | null = null;
    
    try {
      // Create connection configuration with Azure SQL Database optimizations
      const sqlConfig: sql.config = {
        server: config.host || '',
        port: config.port || 1433,
        database: config.database || '',
        user: config.username || '',
        password: config.password || '',
        options: {
          encrypt: true, // Use encryption for Azure SQL Database
          trustServerCertificate: false, // Don't trust self-signed certificates
          connectTimeout: 30000, // 30 seconds - longer for Azure SQL DB
          requestTimeout: 15000, // 15 seconds - longer for complex queries
          enableArithAbort: true, // Required for Azure SQL Database
        },
      };

      console.log(`Attempting to connect to SQL Server: ${config.host}:${config.port}/${config.database}`);
      
      // Create connection pool
      pool = new sql.ConnectionPool(sqlConfig);
      await pool.connect();
      
      console.log('Successfully connected to SQL Server for schema introspection');
      
      // Try simplified schema query first
      return await this.getSimplifiedSQLServerSchema(pool);
      
    } catch (error) {
      console.error('Full SQL Server schema introspection failed, trying fallback:', error);
      
      // Close any existing connection
      if (pool) {
        try {
          await pool.close();
        } catch (closeError) {
          console.error('Error closing failed connection:', closeError);
        }
        pool = null;
      }
      
      // Try fallback with simpler connection approach
      return await this.getFallbackSQLServerSchema(config);
    } finally {
      // Always close the connection
      if (pool) {
        try {
          await pool.close();
        } catch (closeError) {
          console.error('Error closing SQL Server connection:', closeError);
        }
      }
    }
  }

  private static async getSimplifiedSQLServerSchema(pool: sql.ConnectionPool): Promise<any> {

    // Get schemas - start with simple query
    const schemasResult = await pool.request().query(`
      SELECT DISTINCT SCHEMA_NAME
      FROM INFORMATION_SCHEMA.SCHEMATA 
      WHERE SCHEMA_NAME NOT IN ('sys', 'INFORMATION_SCHEMA', 'guest')
      ORDER BY SCHEMA_NAME
    `);
    
    const schemas = schemasResult.recordset.map((row: any) => row.SCHEMA_NAME);
    
    // Get tables - simplified query for better compatibility
    const tablesResult = await pool.request().query(`
      SELECT 
        TABLE_SCHEMA,
        TABLE_NAME,
        TABLE_TYPE
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_TYPE IN ('BASE TABLE', 'VIEW')
        AND TABLE_SCHEMA NOT IN ('sys', 'INFORMATION_SCHEMA')
      ORDER BY TABLE_SCHEMA, TABLE_NAME
    `);
    
    // Get basic column information
    const columnsResult = await pool.request().query(`
      SELECT 
        TABLE_SCHEMA,
        TABLE_NAME,
        COLUMN_NAME,
        DATA_TYPE,
        IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA NOT IN ('sys', 'INFORMATION_SCHEMA')
      ORDER BY TABLE_SCHEMA, TABLE_NAME, ORDINAL_POSITION
    `);
    
    // Group columns by table
    const tableColumns: Record<string, any[]> = {};
    for (const col of columnsResult.recordset) {
      const tableKey = `${col.TABLE_SCHEMA}.${col.TABLE_NAME}`;
      if (!tableColumns[tableKey]) {
        tableColumns[tableKey] = [];
      }
      
      tableColumns[tableKey].push({
        name: col.COLUMN_NAME,
        type: col.DATA_TYPE,
        nullable: col.IS_NULLABLE === 'YES',
        isPrimaryKey: false, // Simplified - don't fetch PK info for now
        defaultValue: null
      });
    }
    
    // Build tables array
    const tables = tablesResult.recordset.map((table: any) => {
      const tableKey = `${table.TABLE_SCHEMA}.${table.TABLE_NAME}`;
      return {
        name: table.TABLE_NAME,
        schema: table.TABLE_SCHEMA,
        type: table.TABLE_TYPE === 'BASE TABLE' ? 'table' as const : 'view' as const,
        rowCount: 0, // Don't fetch row counts in simplified mode
        columns: tableColumns[tableKey] || []
      };
    });
    
    return {
      schemas,
      tables
    };
  }

  private static async getFallbackSQLServerSchema(config: DatabaseConnectionConfig): Promise<any> {
    // Provide basic fallback schema if connection fails
    console.log('Using fallback schema for SQL Server');
    return {
      schemas: ['dbo'],
      tables: [
        {
          name: 'connection_failed',
          schema: 'dbo',
          type: 'table' as const,
          rowCount: 0,
          columns: [
            { 
              name: 'error_message', 
              type: 'varchar', 
              nullable: true, 
              isPrimaryKey: false,
              defaultValue: 'Schema introspection failed - check firewall settings'
            }
          ]
        }
      ]
    };
  }

  private static async getOracleSchema(config: DatabaseConnectionConfig): Promise<any> {
    // Mock Oracle schema
    return {
      schemas: [config.username?.toUpperCase() || 'SCHEMA'],
      tables: [
        {
          name: 'CUSTOMERS',
          schema: config.username?.toUpperCase() || 'SCHEMA',
          type: 'table' as const,
          rowCount: 3000,
          columns: [
            { name: 'CUSTOMER_ID', type: 'NUMBER', nullable: false, isPrimaryKey: true },
            { name: 'CUSTOMER_NAME', type: 'VARCHAR2(100)', nullable: false, isPrimaryKey: false },
            { name: 'EMAIL', type: 'VARCHAR2(255)', nullable: true, isPrimaryKey: false }
          ]
        }
      ]
    };
  }

  private static async getSQLiteSchema(config: DatabaseConnectionConfig): Promise<any> {
    // Mock SQLite schema
    return {
      schemas: ['main'],
      tables: [
        {
          name: 'local_data',
          schema: 'main',
          type: 'table' as const,
          rowCount: 100,
          columns: [
            { name: 'id', type: 'INTEGER', nullable: false, isPrimaryKey: true },
            { name: 'data', type: 'TEXT', nullable: true, isPrimaryKey: false }
          ]
        }
      ]
    };
  }
}