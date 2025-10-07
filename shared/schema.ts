import { sql } from "drizzle-orm";
import { 
  pgTable, 
  text, 
  varchar, 
  timestamp, 
  integer, 
  jsonb,
  index 
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Data sources table
export const dataSources = pgTable("data_sources", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  type: text("type").notNull(), // Database connector types: see DatabaseConnectorType
  filename: text("filename"), // For file-based sources
  size: integer("size"),
  rowCount: integer("row_count"),
  columnCount: integer("column_count"),
  status: text("status").notNull().default('processing'), // 'processing', 'ready', 'error', 'connected'
  connectionConfig: jsonb("connection_config"), // Store encrypted connection details
  metadata: jsonb("metadata"), // Additional metadata like schema info, file paths, etc.
  connectionId: varchar("connection_id").references(() => connections.id), // Reference to parent connection for table datasets
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  lastSyncedAt: timestamp("last_synced_at"),
});

// Database connections table - stores unique database connections
export const connections = pgTable("connections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: text("name").notNull(), // User-friendly connection name
  type: text("type").notNull(), // Database connector type (mysql, postgresql, sqlserver, etc.)
  status: text("status").notNull().default('connected'), // 'connected', 'disconnected', 'error'
  connectionConfig: jsonb("connection_config").notNull(), // Store encrypted connection details
  metadata: jsonb("metadata"), // Additional metadata like available schemas, last tested, etc.
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  lastTestedAt: timestamp("last_tested_at"),
});

// AI queries table
export const aiQueries = pgTable("ai_queries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  isVoiceQuery: varchar("is_voice_query").default('false'),
  dataSourceId: varchar("data_source_id").references(() => dataSources.id),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Dashboards table
export const dashboards = pgTable("dashboards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// KPIs table
export const kpis = pgTable("kpis", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  dashboardId: varchar("dashboard_id").references(() => dashboards.id),
  question: text("question").notNull(),
  value: text("value").notNull(),
  unit: text("unit"),
  changePercent: text("change_percent"),
  visualType: text("visual_type").default('big-number'), // 'big-number' | 'big-number-trendline'
  format: text("format").default('number'), // 'number' | 'currency' | 'percentage'
  decimalPlaces: integer("decimal_places").default(0),
  currencyCode: text("currency_code").default('USD'),
  prefix: text("prefix"),
  suffix: text("suffix"),
  lastUpdated: timestamp("last_updated").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Charts table
export const charts = pgTable("charts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  type: text("type").notNull(), // 'line', 'bar', 'pie', etc.
  config: jsonb("config").notNull(),
  dataSourceId: varchar("data_source_id").references(() => dataSources.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Views table - for SQL Engine created views
export const views = pgTable("views", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  description: text("description"),
  sqlQuery: text("sql_query").notNull(),
  dataSourceId: varchar("data_source_id").references(() => dataSources.id),
  resultData: jsonb("result_data"), // Cache query results
  columns: jsonb("columns"), // Column metadata for the view
  rowCount: integer("row_count"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  lastExecuted: timestamp("last_executed"),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  name: true,
});

export const insertDataSourceSchema = createInsertSchema(dataSources).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAiQuerySchema = createInsertSchema(aiQueries).omit({
  id: true,
  createdAt: true,
});

export const insertKpiSchema = createInsertSchema(kpis).omit({
  id: true,
  createdAt: true,
  lastUpdated: true,
});

export const insertChartSchema = createInsertSchema(charts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertViewSchema = createInsertSchema(views).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastExecuted: true,
});

export const insertConnectionSchema = createInsertSchema(connections).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastTestedAt: true,
});

export const insertDashboardSchema = createInsertSchema(dashboards).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Database connector types (similar to Apache Superset)
export const DatabaseConnectorType = {
  // Relational Databases
  MYSQL: 'mysql',
  POSTGRESQL: 'postgresql', 
  SQLSERVER: 'sqlserver',
  ORACLE: 'oracle',
  SQLITE: 'sqlite',
  
  // Cloud Data Warehouses
  BIGQUERY: 'bigquery',
  SNOWFLAKE: 'snowflake',
  REDSHIFT: 'redshift',
  DATABRICKS: 'databricks',
  AZURE_SYNAPSE: 'azure_synapse',
  
  // Columnar & OLAP
  CLICKHOUSE: 'clickhouse',
  VERTICA: 'vertica',
  DRUID: 'druid',
  
  // Big Data & Analytics
  PRESTO: 'presto',
  TRINO: 'trino',
  SPARK: 'spark',
  HIVE: 'hive',
  
  // Document & NoSQL (via proxy)
  MONGODB: 'mongodb', // via Apache Drill
  ELASTICSEARCH: 'elasticsearch',
  
  // Time Series
  INFLUXDB: 'influxdb',
  
  // File-based
  CSV: 'csv',
  EXCEL: 'excel',
  JSON: 'json',
  
  // APIs
  REST_API: 'rest_api',
  GRAPHQL: 'graphql',
} as const;

export type DatabaseConnectorTypeValues = typeof DatabaseConnectorType[keyof typeof DatabaseConnectorType];

// Database connection configuration interface
export interface DatabaseConnectionConfig {
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  
  // SSL/TLS Configuration
  sslMode?: 'require' | 'prefer' | 'allow' | 'disable';
  sslCert?: string;
  sslKey?: string;
  sslRootCert?: string;
  
  // Cloud-specific configs
  projectId?: string; // BigQuery
  keyFile?: string; // BigQuery Service Account
  account?: string; // Snowflake
  region?: string; // AWS, etc.
  warehouse?: string; // Snowflake
  role?: string; // Snowflake, Redshift
  
  // MongoDB specific (via Drill)
  drillHost?: string;
  drillPort?: number;
  
  // Connection options
  options?: Record<string, any>;
  
  // File upload configs
  filePath?: string;
  
  // API configs
  baseUrl?: string;
  apiKey?: string;
  headers?: Record<string, string>;
}

// Connection test result
export interface ConnectionTestResult {
  success: boolean;
  message: string;
  latency?: number;
  metadata?: {
    serverVersion?: string;
    schemas?: string[];
    tables?: Array<{ schema: string; table: string; }>;
  };
}

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type DataSource = typeof dataSources.$inferSelect;
export type InsertDataSource = z.infer<typeof insertDataSourceSchema>;

// Table dataset metadata type for type safety
export interface TableDatasetMetadata {
  isTableDataset: true;
  connectorType: string;
  connectionName: string;
  tableName: string;
  schemaName: string;
  tableType: 'table' | 'view';
  columns: Array<{
    name: string;
    type: string;
    nullable: boolean;
    isPrimaryKey: boolean;
    defaultValue?: string;
  }>;
  parentConnection: string;
}

// Standard dataset metadata type  
export interface StandardDatasetMetadata {
  isTableDataset?: false;
  connectorType?: string;
  columns?: string[];
  sampleData?: any[];
  [key: string]: any;
}
export type AiQuery = typeof aiQueries.$inferSelect;
export type InsertAiQuery = z.infer<typeof insertAiQuerySchema>;
export type KPI = typeof kpis.$inferSelect;
export type InsertKPI = z.infer<typeof insertKpiSchema>;
export type Chart = typeof charts.$inferSelect;
export type InsertChart = z.infer<typeof insertChartSchema>;
export type View = typeof views.$inferSelect;
export type InsertView = z.infer<typeof insertViewSchema>;
export type Connection = typeof connections.$inferSelect;
export type InsertConnection = z.infer<typeof insertConnectionSchema>;
export type Dashboard = typeof dashboards.$inferSelect;
export type InsertDashboard = z.infer<typeof insertDashboardSchema>;
