/**
 * Privacy-Preserving AI Analysis Service
 * 
 * This service NEVER sends real data to OpenAI.
 * Only schema/dummy data is shared to generate analysis guidance.
 */

import OpenAI from "openai";
import { extractDataSchema, createPrivacySafeDataSummary } from "./services/data-masking";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY
});

interface DataAnalysisRequest {
  question: string;
  csvData?: any[];
  dataSourceMetadata?: any;
}

interface DataAnalysisResponse {
  answer: string;
  chartData?: any;
  chartType?: string;
  kpiValue?: string;
  unit?: string;
}

/**
 * Analyze data with privacy protection
 */
export async function analyzeDataWithPrivacy(request: DataAnalysisRequest): Promise<DataAnalysisResponse> {
  try {
    const { question, csvData, dataSourceMetadata } = request;

    let context = `You are a business intelligence analyst. Answer the user's question based on analysis results.

User Question: ${question}`;

    let analysisResult: any = null;
    let dataSchema: any = null;

    if (csvData && csvData.length > 0) {
      // Extract schema (NO REAL DATA)
      dataSchema = extractDataSchema(csvData);
      const privacySafeSummary = createPrivacySafeDataSummary(csvData);
      
      context += `\n\n${privacySafeSummary}`;
      
      // Perform actual analysis locally on real data
      analysisResult = performLocalAnalysis(question, csvData, dataSchema);
      
      // CRITICAL: Do NOT send real analysis results to OpenAI
      // Only provide aggregation type hints, no actual values
      if (analysisResult) {
        const safeHint = analysisResult.kpiValue ? 'Analysis type: KPI value' : 
                        analysisResult.trendData ? 'Analysis type: Time series trend' :
                        analysisResult.groupedData ? 'Analysis type: Categorical breakdown' :
                        'Analysis type: Summary';
        context += `\n\n${safeHint}`;
      }
    }

    context += `\n\nProvide response in JSON:
{
  "answer": "Natural language answer incorporating the analysis results",
  "chartType": "Suggested chart type: bar, line, pie, area, or null"
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      messages: [
        { role: "system", content: "You are an expert BI analyst. Provide clear insights in JSON format." },
        { role: "user", content: context }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    // Prepare chart data
    let chartData = null;
    if (result.chartType && analysisResult) {
      chartData = prepareChartData(result.chartType, analysisResult, dataSchema);
    }
    
    return {
      answer: result.answer || "I've analyzed your data.",
      chartData,
      chartType: result.chartType,
      kpiValue: analysisResult?.kpiValue,
      unit: analysisResult?.unit
    };

  } catch (error) {
    console.error("Privacy-preserving AI analysis error:", error);
    return {
      answer: "Sorry, I encountered an error while analyzing your data."
    };
  }
}

/**
 * Local analysis on real data (NEVER sent to OpenAI)
 */
function performLocalAnalysis(question: string, data: any[], schema: any): any {
  const q = question.toLowerCase();
  
  if (q.includes('total') || q.includes('sum')) return calculateSum(data, schema);
  if (q.includes('average') || q.includes('mean')) return calculateAverage(data, schema);
  if (q.includes('count') || q.includes('how many')) return { kpiValue: data.length.toString(), unit: 'records' };
  if (q.includes('max') || q.includes('highest')) return calculateMax(data, schema);
  if (q.includes('min') || q.includes('lowest')) return calculateMin(data, schema);
  if (q.includes('trend') || q.includes('over time')) return calculateTrend(data, schema);
  if (q.includes('group') || q.includes('by')) return calculateGroupBy(data, schema);
  
  return { totalRecords: data.length };
}

function calculateSum(data: any[], schema: any): any {
  const numCol = schema.columns.find((c: any) => c.type === 'integer' || c.type === 'float');
  if (!numCol) return null;
  
  const sum = data.reduce((acc, row) => acc + (parseFloat(row[numCol.name]) || 0), 0);
  return { kpiValue: sum.toFixed(2), unit: numCol.name, sum, column: numCol.name };
}

function calculateAverage(data: any[], schema: any): any {
  const numCol = schema.columns.find((c: any) => c.type === 'integer' || c.type === 'float');
  if (!numCol) return null;
  
  const sum = data.reduce((acc, row) => acc + (parseFloat(row[numCol.name]) || 0), 0);
  const avg = sum / data.length;
  return { kpiValue: avg.toFixed(2), unit: numCol.name, average: avg, column: numCol.name };
}

function calculateMax(data: any[], schema: any): any {
  const numCol = schema.columns.find((c: any) => c.type === 'integer' || c.type === 'float');
  if (!numCol) return null;
  
  const max = Math.max(...data.map(row => parseFloat(row[numCol.name]) || 0));
  return { kpiValue: max.toString(), unit: numCol.name };
}

function calculateMin(data: any[], schema: any): any {
  const numCol = schema.columns.find((c: any) => c.type === 'integer' || c.type === 'float');
  if (!numCol) return null;
  
  const min = Math.min(...data.map(row => parseFloat(row[numCol.name]) || 0));
  return { kpiValue: min.toString(), unit: numCol.name };
}

function calculateTrend(data: any[], schema: any): any {
  const dateCol = schema.columns.find((c: any) => c.type === 'date');
  const numCol = schema.columns.find((c: any) => c.type === 'integer' || c.type === 'float');
  
  if (!dateCol || !numCol) return null;
  
  const trendData = data.map(row => ({
    date: row[dateCol.name],
    value: parseFloat(row[numCol.name]) || 0
  }));
  
  return { trendData, dateColumn: dateCol.name, valueColumn: numCol.name };
}

function calculateGroupBy(data: any[], schema: any): any {
  const catCol = schema.columns.find((c: any) => c.type === 'string');
  const numCol = schema.columns.find((c: any) => c.type === 'integer' || c.type === 'float');
  
  if (!catCol || !numCol) return null;
  
  const grouped: any = {};
  data.forEach(row => {
    const cat = row[catCol.name];
    if (!grouped[cat]) grouped[cat] = 0;
    grouped[cat] += parseFloat(row[numCol.name]) || 0;
  });
  
  return { groupedData: grouped, categoryColumn: catCol.name, valueColumn: numCol.name };
}

/**
 * Prepare Superset-style chart configuration
 * Following Apache Superset's JSON chart specification format
 */
function prepareChartData(chartType: string, analysisResult: any, schema: any): any {
  // Superset-style chart configuration
  const chartConfig: any = {
    type: chartType,
    datasource: 'analysis_result',
    viz_type: chartType,
    metrics: [],
    groupby: [],
    time_range: 'No filter',
    granularity_sqla: null,
    show_legend: true,
    rich_tooltip: true,
  };

  // For trend/time series data
  if (analysisResult.trendData) {
    chartConfig.datasource = {
      type: 'table',
      data: analysisResult.trendData
    };
    chartConfig.x_axis = analysisResult.dateColumn;
    chartConfig.metrics = [analysisResult.valueColumn];
    chartConfig.time_grain_sqla = 'P1D';
    
    // Chart.js compatible format
    chartConfig.chartData = {
      labels: analysisResult.trendData.map((d: any) => d.date),
      datasets: [{
        label: analysisResult.valueColumn,
        data: analysisResult.trendData.map((d: any) => d.value),
        borderColor: '#1f77b4',
        backgroundColor: 'rgba(31, 119, 180, 0.2)',
        tension: 0.4
      }]
    };
    
    return chartConfig;
  }
  
  // For grouped/categorical data
  if (analysisResult.groupedData) {
    const categories = Object.keys(analysisResult.groupedData);
    const values = Object.values(analysisResult.groupedData);
    
    chartConfig.datasource = {
      type: 'table',
      data: categories.map((cat, idx) => ({
        [analysisResult.categoryColumn]: cat,
        [analysisResult.valueColumn]: values[idx]
      }))
    };
    chartConfig.groupby = [analysisResult.categoryColumn];
    chartConfig.metrics = [analysisResult.valueColumn];
    
    // Chart.js compatible format
    chartConfig.chartData = {
      labels: categories,
      datasets: [{
        label: analysisResult.valueColumn,
        data: values,
        backgroundColor: [
          'rgba(31, 119, 180, 0.8)',
          'rgba(255, 127, 14, 0.8)',
          'rgba(44, 160, 44, 0.8)',
          'rgba(214, 39, 40, 0.8)',
          'rgba(148, 103, 189, 0.8)',
          'rgba(140, 86, 75, 0.8)',
          'rgba(227, 119, 194, 0.8)',
          'rgba(127, 127, 127, 0.8)'
        ],
        borderWidth: 1
      }]
    };
    
    return chartConfig;
  }
  
  // For single value/KPI
  if (analysisResult.kpiValue) {
    chartConfig.viz_type = 'big_number';
    chartConfig.metric = analysisResult.unit || 'value';
    chartConfig.chartData = {
      value: analysisResult.kpiValue,
      unit: analysisResult.unit,
      type: 'kpi'
    };
    
    return chartConfig;
  }
  
  return null;
}
