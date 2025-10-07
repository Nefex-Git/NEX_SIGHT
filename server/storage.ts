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
  type InsertChart,
  type View,
  type InsertView,
  type Connection,
  type InsertConnection,
  type Dashboard,
  type InsertDashboard
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
  createDataSource(dataSource: InsertDataSource & { connectionConfig?: any }): Promise<DataSource>;
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
  
  // View operations
  getViews(userId: string): Promise<View[]>;
  getView(id: string): Promise<View | undefined>;
  createView(view: InsertView): Promise<View>;
  updateView(id: string, updates: Partial<View>): Promise<View | undefined>;
  deleteView(id: string): Promise<boolean>;
  
  // Connection operations
  getConnections(userId: string): Promise<Connection[]>;
  getConnection(id: string): Promise<Connection | undefined>;
  createConnection(connection: InsertConnection): Promise<Connection>;
  updateConnection(id: string, updates: Partial<Connection>): Promise<Connection | undefined>;
  deleteConnection(id: string): Promise<boolean>;
  getConnectionByNameAndUser(userId: string, name: string): Promise<Connection | undefined>;
  
  // Dashboard operations
  getDashboards(userId: string): Promise<Dashboard[]>;
  getDashboard(id: string): Promise<Dashboard | undefined>;
  createDashboard(dashboard: InsertDashboard): Promise<Dashboard>;
  updateDashboard(id: string, updates: Partial<Dashboard>): Promise<Dashboard | undefined>;
  deleteDashboard(id: string): Promise<boolean>;
  
  // Session store
  sessionStore: Store;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private dataSources: Map<string, DataSource>;
  private aiQueries: Map<string, AiQuery>;
  private kpis: Map<string, KPI>;
  private charts: Map<string, Chart>;
  private views: Map<string, View>;
  private connections: Map<string, Connection>;
  private dashboards: Map<string, Dashboard>;
  public sessionStore: Store;

  constructor() {
    this.users = new Map();
    this.dataSources = new Map();
    this.aiQueries = new Map();
    this.kpis = new Map();
    this.charts = new Map();
    this.views = new Map();
    this.connections = new Map();
    this.dashboards = new Map();
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

  async createDataSource(insertDataSource: InsertDataSource & { connectionConfig?: any }): Promise<DataSource> {
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
      connectionId: insertDataSource.connectionId || null,
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

  // View operations
  async getViews(userId: string): Promise<View[]> {
    return Array.from(this.views.values()).filter(view => view.userId === userId);
  }

  async getView(id: string): Promise<View | undefined> {
    return this.views.get(id);
  }

  async createView(insertView: InsertView): Promise<View> {
    const id = randomUUID();
    const now = new Date();
    const view: View = {
      ...insertView,
      description: insertView.description || null,
      dataSourceId: insertView.dataSourceId || null,
      resultData: insertView.resultData || null,
      columns: insertView.columns || null,
      rowCount: insertView.rowCount || null,
      lastExecuted: null,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.views.set(id, view);
    return view;
  }

  async updateView(id: string, updates: Partial<View>): Promise<View | undefined> {
    const view = this.views.get(id);
    if (!view) return undefined;
    
    const updated = { ...view, ...updates, updatedAt: new Date() };
    this.views.set(id, updated);
    return updated;
  }

  async deleteView(id: string): Promise<boolean> {
    return this.views.delete(id);
  }

  // Connection operations
  async getConnections(userId: string): Promise<Connection[]> {
    return Array.from(this.connections.values()).filter(connection => connection.userId === userId);
  }

  async getConnection(id: string): Promise<Connection | undefined> {
    return this.connections.get(id);
  }

  async createConnection(insertConnection: InsertConnection): Promise<Connection> {
    const id = randomUUID();
    const now = new Date();
    const connection: Connection = {
      ...insertConnection,
      status: insertConnection.status || 'connected',
      metadata: insertConnection.metadata || null,
      id,
      createdAt: now,
      updatedAt: now,
      lastTestedAt: null,
    };
    this.connections.set(id, connection);
    return connection;
  }

  async updateConnection(id: string, updates: Partial<Connection>): Promise<Connection | undefined> {
    const connection = this.connections.get(id);
    if (!connection) return undefined;
    
    const updated: Connection = {
      ...connection,
      ...updates,
      updatedAt: new Date()
    };
    this.connections.set(id, updated);
    return updated;
  }

  async deleteConnection(id: string): Promise<boolean> {
    return this.connections.delete(id);
  }

  async getConnectionByNameAndUser(userId: string, name: string): Promise<Connection | undefined> {
    return Array.from(this.connections.values()).find(
      connection => connection.userId === userId && connection.name === name
    );
  }

  // Dashboard operations
  async getDashboards(userId: string): Promise<Dashboard[]> {
    return Array.from(this.dashboards.values()).filter(dashboard => dashboard.userId === userId);
  }

  async getDashboard(id: string): Promise<Dashboard | undefined> {
    return this.dashboards.get(id);
  }

  async createDashboard(insertDashboard: InsertDashboard): Promise<Dashboard> {
    const id = randomUUID();
    const now = new Date();
    const dashboard: Dashboard = {
      ...insertDashboard,
      description: insertDashboard.description || null,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.dashboards.set(id, dashboard);
    return dashboard;
  }

  async updateDashboard(id: string, updates: Partial<Dashboard>): Promise<Dashboard | undefined> {
    const dashboard = this.dashboards.get(id);
    if (!dashboard) return undefined;
    
    const updated = { ...dashboard, ...updates, updatedAt: new Date() };
    this.dashboards.set(id, updated);
    return updated;
  }

  async deleteDashboard(id: string): Promise<boolean> {
    return this.dashboards.delete(id);
  }
}

export const storage = new MemStorage();
