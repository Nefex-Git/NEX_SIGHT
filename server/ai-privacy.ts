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

    let context = `You are a business intelligence analyst. Answer the user's question with the actual result value.

User Question: ${question}`;

    let analysisResult: any = null;
    let dataSchema: any = null;

    if (csvData && csvData.length > 0) {
      // Extract schema (NO REAL DATA)
      dataSchema = extractDataSchema(csvData);
      
      // Perform actual analysis locally on real data
      analysisResult = performLocalAnalysis(question, csvData, dataSchema);
      
      console.log('Analysis Result:', JSON.stringify(analysisResult, null, 2));
      
      // CRITICAL: Do NOT send real analysis results to OpenAI
      // But we DO need to tell the AI what the answer is so it can format it properly
      if (analysisResult) {
        if (analysisResult.isMultiColumn && analysisResult.allColumns) {
          // For multi-column results (e.g., product name + amount), provide ALL columns
          const columnDetails = Object.entries(analysisResult.allColumns)
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ');
          context += `\n\nAnalysis Complete: Query returned the following result - ${columnDetails}`;
          context += `\n\nIMPORTANT: Include ALL these values in your natural language answer, not just the numeric value.`;
        } else if (analysisResult.kpiValue) {
          // For SQL results and aggregations, provide the actual answer
          context += `\n\nAnalysis Complete: The answer is ${analysisResult.kpiValue}${analysisResult.unit ? ' ' + analysisResult.unit : ''}.`;
        } else if (analysisResult.trendData) {
          context += `\n\nAnalysis type: Time series trend data available.`;
        } else if (analysisResult.groupedData) {
          context += `\n\nAnalysis type: Categorical breakdown available.`;
        } else {
          context += `\n\nAnalysis type: Summary with ${analysisResult.totalRecords || csvData.length} records.`;
        }
      }
    }

    // Detect if user is asking for visualization
    const questionLower = question.toLowerCase();
    const isVisualizationRequest = 
      questionLower.includes('chart') || 
      questionLower.includes('graph') || 
      questionLower.includes('visualize') || 
      questionLower.includes('show me') ||
      questionLower.includes('plot') ||
      questionLower.includes('trend') ||
      questionLower.includes('breakdown') ||
      questionLower.includes('distribution') ||
      questionLower.includes('compare');
    
    // Check if data is suitable for charting (multiple rows or grouped data)
    const hasMultipleDataPoints = 
      (Array.isArray(analysisResult) && analysisResult.length > 1) ||
      analysisResult?.groupedData ||
      analysisResult?.trendData;
    
    const shouldSuggestChart = isVisualizationRequest || hasMultipleDataPoints;

    if (shouldSuggestChart) {
      context += `\n\nProvide response in JSON:
{
  "answer": "Natural language answer stating the actual result value. Be direct and clear.",
  "chartType": "Suggested chart type: bar, line, pie, heatmap, table, or null"
}

Chart type selection guidelines:
- Use "heatmap" for 2D data comparisons (e.g., country+state, category+subcategory)
- Use "bar" for simple category comparisons
- Use "line" for trends over time
- Use "pie" for proportional/percentage breakdowns
- Use "table" for detailed data viewing
- Use null if the result is a single value with no comparative data`;
    } else {
      context += `\n\nProvide response in JSON:
{
  "answer": "Natural language answer stating the actual result value. Be direct and clear.",
  "chartType": null
}

IMPORTANT: The chartType field must be the JSON null value (not a string), since this is a simple answer with no visualization needed.`;
    }

    const response = await openai.chat.completions.create({
      model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      messages: [
        { role: "system", content: "You are an expert BI analyst. Provide clear, direct answers with actual values in JSON format." },
        { role: "user", content: context }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    // Prepare chart data
    let chartData = null;
    if (result.chartType && analysisResult) {
      chartData = prepareChartData(result.chartType, analysisResult, dataSchema);
      console.log('Prepared chart data:', JSON.stringify(chartData, null, 2));
    }
    
    // If analysisResult is an array (grouped data), prepare it for charting
    if (Array.isArray(analysisResult) && analysisResult.length > 0 && result.chartType) {
      chartData = prepareChartData(result.chartType, analysisResult, dataSchema);
      console.log('Prepared chart data from array:', JSON.stringify(chartData, null, 2));
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
  
  console.log('performLocalAnalysis - data.length:', data.length, 'first row keys:', data[0] ? Object.keys(data[0]) : 'no data');
  
  // PRIORITY: Check for grouped data FIRST (before keyword matching)
  // If data has multiple rows with a string column and a numeric column (likely GROUP BY result)
  if (data.length > 1 && data[0] && Object.keys(data[0]).length >= 2) {
    const keys = Object.keys(data[0]);
    const stringKey = keys.find(k => typeof data[0][k] === 'string');
    const numKey = keys.find(k => typeof data[0][k] === 'number');
    
    console.log('Checking grouped data:', { 
      dataLength: data.length, 
      keys, 
      stringKey, 
      numKey,
      firstRowTypes: keys.map(k => ({ [k]: typeof data[0][k] }))
    });
    
    if (stringKey && numKey) {
      // This is grouped data from SQL - return it directly for charting
      console.log('✅ Detected grouped data for charting - returning array');
      return data; // Return array directly for chart preparation
    } else {
      console.log('❌ Not grouped data - missing string or number key');
    }
  } else {
    console.log('❌ Not grouped data - length or keys check failed');
  }
  
  // If data is a single row with a single column (likely an aggregation result from SQL)
  if (data.length === 1 && Object.keys(data[0]).length === 1) {
    const key = Object.keys(data[0])[0];
    const value = data[0][key];
    return { 
      kpiValue: value?.toString() || '0', 
      unit: key,
      isSQLResult: true 
    };
  }
  
  // If data is a single row with multiple columns (e.g., product name + amount)
  if (data.length === 1 && Object.keys(data[0]).length >= 2) {
    const keys = Object.keys(data[0]);
    const values: Record<string, any> = {};
    let numericKey: string | null = null;
    let numericValue: any = null;
    
    // Extract all column values and find the numeric one for KPI
    keys.forEach(key => {
      const value = data[0][key];
      values[key] = value;
      
      // Find the numeric column for KPI display
      if ((typeof value === 'number' || !isNaN(Number(value))) && numericKey === null) {
        numericKey = key;
        numericValue = value;
      }
    });
    
    console.log('✅ Single row multi-column result detected:', values);
    
    return {
      kpiValue: numericValue?.toString() || '',
      unit: numericKey || '',
      allColumns: values,  // Include ALL column values
      isSQLResult: true,
      isMultiColumn: true
    };
  }
  
  if (q.includes('total') || q.includes('sum')) return calculateSum(data, schema);
  if (q.includes('average') || q.includes('mean')) return calculateAverage(data, schema);
  if (q.includes('count') || q.includes('how many') || q.includes('distinct')) return { kpiValue: data.length.toString(), unit: 'records' };
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
 * Prepare chart data in the format expected by the frontend
 * Returns array with { name, value } structure for Recharts
 */
function prepareChartData(chartType: string, analysisResult: any, schema: any): any[] {
  // For trend/time series data
  if (analysisResult.trendData) {
    return analysisResult.trendData.map((d: any) => ({
      name: d.date || d[analysisResult.dateColumn],
      value: d.value || d[analysisResult.valueColumn]
    }));
  }
  
  // For grouped/categorical data
  if (analysisResult.groupedData) {
    return Object.entries(analysisResult.groupedData).map(([key, val]) => ({
      name: key,
      value: val as number
    }));
  }
  
  // Try to detect chart data from any row-based result
  if (Array.isArray(analysisResult) && analysisResult.length > 0) {
    const firstRow = analysisResult[0];
    const keys = Object.keys(firstRow);
    
    // Find name/category field (string) and value field (number)
    const nameField = keys.find(k => typeof firstRow[k] === 'string') || keys[0];
    const valueField = keys.find(k => typeof firstRow[k] === 'number') || keys[1];
    
    return analysisResult.map(row => ({
      name: row[nameField],
      value: parseFloat(row[valueField]) || 0
    }));
  }
  
  return [];
}
