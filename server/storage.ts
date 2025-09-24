import { 
  type User, 
  type InsertUser,
  type DataSource,
  type InsertDataSource,
  type AiQuery,
  type InsertAiQuery,
  type KPI,
  type InsertKPI,
  type Chart,
  type InsertChart
} from "@shared/schema";
import { randomUUID } from "crypto";
import session from "express-session";
import createMemoryStore from "memorystore";
import type { Store } from "express-session";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Data source operations
  getDataSources(userId: string): Promise<DataSource[]>;
  getDataSource(id: string): Promise<DataSource | undefined>;
  createDataSource(dataSource: InsertDataSource): Promise<DataSource>;
  updateDataSource(id: string, updates: Partial<DataSource>): Promise<DataSource | undefined>;
  deleteDataSource(id: string): Promise<boolean>;
  
  // AI query operations
  getAiQueries(userId: string, limit?: number): Promise<AiQuery[]>;
  createAiQuery(query: InsertAiQuery): Promise<AiQuery>;
  
  // KPI operations
  getKpis(userId: string): Promise<KPI[]>;
  createKpi(kpi: InsertKPI): Promise<KPI>;
  updateKpi(id: string, updates: Partial<KPI>): Promise<KPI | undefined>;
  deleteKpi(id: string): Promise<boolean>;
  
  // Chart operations
  getCharts(userId: string): Promise<Chart[]>;
  getChart(id: string): Promise<Chart | undefined>;
  createChart(chart: InsertChart): Promise<Chart>;
  updateChart(id: string, updates: Partial<Chart>): Promise<Chart | undefined>;
  deleteChart(id: string): Promise<boolean>;
  
  // Session store
  sessionStore: Store;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private dataSources: Map<string, DataSource>;
  private aiQueries: Map<string, AiQuery>;
  private kpis: Map<string, KPI>;
  private charts: Map<string, Chart>;
  public sessionStore: Store;

  constructor() {
    this.users = new Map();
    this.dataSources = new Map();
    this.aiQueries = new Map();
    this.kpis = new Map();
    this.charts = new Map();
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // 24 hours
    });
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      name: insertUser.name || null,
      id, 
      createdAt: now, 
      updatedAt: now 
    };
    this.users.set(id, user);
    return user;
  }

  // Data source operations
  async getDataSources(userId: string): Promise<DataSource[]> {
    return Array.from(this.dataSources.values()).filter(ds => ds.userId === userId);
  }

  async getDataSource(id: string): Promise<DataSource | undefined> {
    return this.dataSources.get(id);
  }

  async createDataSource(insertDataSource: InsertDataSource): Promise<DataSource> {
    const id = randomUUID();
    const now = new Date();
    const dataSource: DataSource = {
      ...insertDataSource,
      status: insertDataSource.status || 'processing',
      filename: insertDataSource.filename || null,
      size: insertDataSource.size || null,
      rowCount: insertDataSource.rowCount || null,
      columnCount: insertDataSource.columnCount || null,
      connectionConfig: insertDataSource.connectionConfig || null,
      metadata: insertDataSource.metadata || null,
      lastSyncedAt: insertDataSource.lastSyncedAt || null,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.dataSources.set(id, dataSource);
    return dataSource;
  }

  async updateDataSource(id: string, updates: Partial<DataSource>): Promise<DataSource | undefined> {
    const dataSource = this.dataSources.get(id);
    if (!dataSource) return undefined;
    
    const updated = { ...dataSource, ...updates, updatedAt: new Date() };
    this.dataSources.set(id, updated);
    return updated;
  }

  async deleteDataSource(id: string): Promise<boolean> {
    return this.dataSources.delete(id);
  }

  // AI query operations
  async getAiQueries(userId: string, limit = 10): Promise<AiQuery[]> {
    return Array.from(this.aiQueries.values())
      .filter(query => query.userId === userId)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
      .slice(0, limit);
  }

  async createAiQuery(insertQuery: InsertAiQuery): Promise<AiQuery> {
    const id = randomUUID();
    const query: AiQuery = {
      ...insertQuery,
      metadata: insertQuery.metadata || null,
      isVoiceQuery: insertQuery.isVoiceQuery || null,
      dataSourceId: insertQuery.dataSourceId || null,
      id,
      createdAt: new Date()
    };
    this.aiQueries.set(id, query);
    return query;
  }

  // KPI operations
  async getKpis(userId: string): Promise<KPI[]> {
    return Array.from(this.kpis.values()).filter(kpi => kpi.userId === userId);
  }

  async createKpi(insertKpi: InsertKPI): Promise<KPI> {
    const id = randomUUID();
    const now = new Date();
    const kpi: KPI = {
      ...insertKpi,
      unit: insertKpi.unit || null,
      changePercent: insertKpi.changePercent || null,
      id,
      lastUpdated: now,
      createdAt: now
    };
    this.kpis.set(id, kpi);
    return kpi;
  }

  async updateKpi(id: string, updates: Partial<KPI>): Promise<KPI | undefined> {
    const kpi = this.kpis.get(id);
    if (!kpi) return undefined;
    
    const updated = { ...kpi, ...updates, lastUpdated: new Date() };
    this.kpis.set(id, updated);
    return updated;
  }

  async deleteKpi(id: string): Promise<boolean> {
    return this.kpis.delete(id);
  }

  // Chart operations
  async getCharts(userId: string): Promise<Chart[]> {
    return Array.from(this.charts.values()).filter(chart => chart.userId === userId);
  }

  async getChart(id: string): Promise<Chart | undefined> {
    return this.charts.get(id);
  }

  async createChart(insertChart: InsertChart): Promise<Chart> {
    const id = randomUUID();
    const now = new Date();
    const chart: Chart = {
      ...insertChart,
      dataSourceId: insertChart.dataSourceId || null,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.charts.set(id, chart);
    return chart;
  }

  async updateChart(id: string, updates: Partial<Chart>): Promise<Chart | undefined> {
    const chart = this.charts.get(id);
    if (!chart) return undefined;
    
    const updated = { ...chart, ...updates, updatedAt: new Date() };
    this.charts.set(id, updated);
    return updated;
  }

  async deleteChart(id: string): Promise<boolean> {
    return this.charts.delete(id);
  }
}

export const storage = new MemStorage();
