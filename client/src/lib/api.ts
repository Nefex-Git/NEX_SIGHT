import { apiRequest } from "./queryClient";

export interface DataSource {
  id: string;
  name: string;
  type: string;
  filename?: string;
  size?: number;
  rowCount?: number;
  columnCount?: number;
  status: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

export interface AiQuery {
  id: string;
  question: string;
  answer: string;
  isVoiceQuery: string;
  chartData?: any;
  chartType?: string;
  kpiValue?: string;
  unit?: string;
  sqlQuery?: string;
  createdAt: string;
}

export interface KPI {
  id: string;
  question: string;
  value: string;
  unit?: string;
  changePercent?: string;
  dashboardId?: string;
  visualType?: string;
  format?: string;
  decimalPlaces?: number;
  currencyCode?: string;
  prefix?: string;
  suffix?: string;
  lastUpdated: string;
}

export interface Dashboard {
  id: string;
  name: string;
  description?: string;
  kpiCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Chart {
  id: string;
  title: string;
  type: string;
  config: any;
  dataSourceId?: string;
  createdAt: string;
  updatedAt: string;
}

// Data Source API
export async function uploadDataSource(file: File): Promise<DataSource> {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch('/api/data-sources/upload', {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Upload failed');
  }
  
  return response.json();
}

export async function getDataSources(): Promise<DataSource[]> {
  const response = await apiRequest('GET', '/api/data-sources');
  return response.json();
}

export async function deleteDataSource(id: string): Promise<void> {
  await apiRequest('DELETE', `/api/data-sources/${id}`);
}

// AI Query API
export async function submitAiQuery(question: string, dataSourceIds?: string[], isVoiceQuery = false): Promise<AiQuery> {
  const response = await apiRequest('POST', '/api/ai/query', {
    question,
    dataSourceIds,
    isVoiceQuery
  });
  return response.json();
}

export async function transcribeAudio(audioBlob: Blob): Promise<{ transcription: string }> {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'recording.wav');
  
  const response = await fetch('/api/ai/voice', {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error('Failed to transcribe audio');
  }
  
  return response.json();
}

export async function getAiQueries(limit = 10): Promise<AiQuery[]> {
  const response = await apiRequest('GET', `/api/ai/queries?limit=${limit}`);
  return response.json();
}

// KPI API
export async function getKpis(): Promise<KPI[]> {
  const response = await apiRequest('GET', '/api/kpis');
  return response.json();
}

export async function createKpi(kpi: Omit<KPI, 'id' | 'lastUpdated'>): Promise<KPI> {
  const response = await apiRequest('POST', '/api/kpis', kpi);
  return response.json();
}

export async function createKpiFromQuery(question: string, answer: string): Promise<KPI> {
  const response = await apiRequest('POST', '/api/kpis/from-query', {
    question,
    answer
  });
  return response.json();
}

export async function updateKpi(id: string, updates: Partial<KPI>): Promise<KPI> {
  const response = await apiRequest('PUT', `/api/kpis/${id}`, updates);
  return response.json();
}

export async function deleteKpi(id: string): Promise<void> {
  await apiRequest('DELETE', `/api/kpis/${id}`);
}

// Chart API
export async function getCharts(): Promise<Chart[]> {
  const response = await apiRequest('GET', '/api/charts');
  return response.json();
}

export async function getChart(id: string): Promise<Chart> {
  const response = await apiRequest('GET', `/api/charts/${id}`);
  return response.json();
}

export async function createChart(chart: Omit<Chart, 'id' | 'createdAt' | 'updatedAt'>): Promise<Chart> {
  const response = await apiRequest('POST', '/api/charts', chart);
  return response.json();
}

export async function updateChart(id: string, updates: Partial<Chart>): Promise<Chart> {
  const response = await apiRequest('PUT', `/api/charts/${id}`, updates);
  return response.json();
}

export async function deleteChart(id: string): Promise<void> {
  await apiRequest('DELETE', `/api/charts/${id}`);
}

// Data Preview API
export async function previewDataSource(id: string, limit = 10): Promise<any> {
  const response = await apiRequest('GET', `/api/data-sources/${id}/preview?limit=${limit}`);
  return response.json();
}

// Views API
export interface View {
  id: string;
  name: string;
  description?: string;
  sqlQuery: string;
  dataSourceId?: string;
  resultData?: any;
  columns?: any;
  rowCount?: number;
  createdAt: string;
  updatedAt: string;
  lastExecuted?: string;
}

export async function getViews(): Promise<View[]> {
  const response = await apiRequest('GET', '/api/views');
  return response.json();
}

export async function getView(id: string): Promise<View> {
  const response = await apiRequest('GET', `/api/views/${id}`);
  return response.json();
}

export async function createView(view: Omit<View, 'id' | 'createdAt' | 'updatedAt' | 'lastExecuted'>): Promise<View> {
  const response = await apiRequest('POST', '/api/views', view);
  return response.json();
}

export async function updateView(id: string, updates: Partial<View>): Promise<View> {
  const response = await apiRequest('PUT', `/api/views/${id}`, updates);
  return response.json();
}

export async function deleteView(id: string): Promise<void> {
  await apiRequest('DELETE', `/api/views/${id}`);
}

export async function executeView(id: string): Promise<any> {
  const response = await apiRequest('POST', `/api/views/${id}/execute`);
  return response.json();
}

export async function executeSQLQuery(query: string): Promise<any> {
  const response = await apiRequest('POST', '/api/sql/execute', { query });
  return response.json();
}

// Connection API
export interface Connection {
  id: string;
  name: string;
  type: string;
  status: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
  lastTestedAt?: string;
}

export async function getConnections(): Promise<Connection[]> {
  const response = await apiRequest('GET', '/api/connections');
  return response.json();
}

export async function getConnection(id: string): Promise<Connection> {
  const response = await apiRequest('GET', `/api/connections/${id}`);
  return response.json();
}

export async function getConnectionTables(connectionId: string): Promise<DataSource[]> {
  const response = await apiRequest('GET', `/api/connections/${connectionId}/tables`);
  return response.json();
}

// Dashboard API
export async function getDashboards(): Promise<Dashboard[]> {
  const response = await apiRequest('GET', '/api/dashboards');
  return response.json();
}

export async function getDashboard(id: string): Promise<Dashboard> {
  const response = await apiRequest('GET', `/api/dashboards/${id}`);
  return response.json();
}

export async function createDashboard(dashboard: Omit<Dashboard, 'id' | 'createdAt' | 'updatedAt' | 'kpiCount'>): Promise<Dashboard> {
  const response = await apiRequest('POST', '/api/dashboards', dashboard);
  return response.json();
}

export async function updateDashboard(id: string, updates: Partial<Dashboard>): Promise<Dashboard> {
  const response = await apiRequest('PUT', `/api/dashboards/${id}`, updates);
  return response.json();
}

export async function deleteDashboard(id: string): Promise<void> {
  await apiRequest('DELETE', `/api/dashboards/${id}`);
}
