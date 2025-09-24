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
  type: text("type").notNull(), // 'csv', 'mysql', 'postgresql', 'sqlserver', 'sqlite', 'mongodb', 'redis', 'rest', 'graphql', 'sftp', etc.
  filename: text("filename"), // For file-based sources
  size: integer("size"),
  rowCount: integer("row_count"),
  columnCount: integer("column_count"),
  status: text("status").notNull().default('processing'), // 'processing', 'ready', 'error', 'connected'
  connectionConfig: jsonb("connection_config"), // Store encrypted connection details
  metadata: jsonb("metadata"), // Additional metadata like schema info, file paths, etc.
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  lastSyncedAt: timestamp("last_synced_at"),
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

// KPIs table
export const kpis = pgTable("kpis", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  question: text("question").notNull(),
  value: text("value").notNull(),
  unit: text("unit"),
  changePercent: text("change_percent"),
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

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type DataSource = typeof dataSources.$inferSelect;
export type InsertDataSource = z.infer<typeof insertDataSourceSchema>;
export type AiQuery = typeof aiQueries.$inferSelect;
export type InsertAiQuery = z.infer<typeof insertAiQuerySchema>;
export type KPI = typeof kpis.$inferSelect;
export type InsertKPI = z.infer<typeof insertKpiSchema>;
export type Chart = typeof charts.$inferSelect;
export type InsertChart = z.infer<typeof insertChartSchema>;
