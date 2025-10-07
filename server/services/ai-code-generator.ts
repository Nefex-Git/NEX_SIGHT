/**
 * AI Code Generator Service
 * 
 * Uses OpenAI to generate Python/analysis code based on masked data schemas.
 * This code is then executed locally on real data to preserve privacy.
 */

import OpenAI from "openai";
import { DataSchema, createPrivacySafeDataSummary } from "./data-masking";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

export interface CodeGenerationRequest {
  question: string;
  dataSchema: DataSchema;
  dummyDataSummary: string;
}

export interface CodeGenerationResponse {
  code: string;
  explanation: string;
  outputType: 'value' | 'dataframe' | 'chart';
  chartConfig?: any;
}

/**
 * Generate Python analysis code using OpenAI
 */
export async function generateAnalysisCode(request: CodeGenerationRequest): Promise<CodeGenerationResponse> {
  const { question, dummyDataSummary } = request;
  
  const systemPrompt = `You are an expert data analyst and Python developer. Your task is to generate Python code that analyzes data based on the user's question.

IMPORTANT PRIVACY RULE: You will receive DUMMY DATA for context, not real data. Generate code that works with the data structure shown in the dummy data.

Your code should:
1. Work with a pandas DataFrame named 'df' (this will contain the real data at runtime)
2. Perform the requested analysis
3. Return results in a specific format
4. Be safe and efficient

Return your response in JSON format with:
- "code": The Python code as a string
- "explanation": Brief explanation of what the code does
- "outputType": One of "value" (single number/string), "dataframe" (table), or "chart" (visualization)
- "chartConfig": If outputType is "chart", include configuration for the chart (type, x_axis, y_axis, etc.)`;

  const userPrompt = `${dummyDataSummary}

User Question: ${question}

Generate Python code that:
1. Analyzes the data to answer the question
2. Stores the result in a variable called 'result'
3. For numeric results, return a single value
4. For tabular results, return a DataFrame
5. For visualizations, include chart configuration

Remember: The sample data above is DUMMY DATA. Write code that works with the structure, not the specific values.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 4096
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      code: result.code || "",
      explanation: result.explanation || "Analysis code generated",
      outputType: result.outputType || "value",
      chartConfig: result.chartConfig
    };
  } catch (error) {
    console.error("Code generation error:", error);
    throw new Error(`Failed to generate analysis code: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Generate chart configuration JSON (Superset-style)
 */
export async function generateChartConfig(
  question: string,
  dataSchema: DataSchema,
  analysisResult: any
): Promise<any> {
  const systemPrompt = `You are an expert in data visualization. Generate a chart configuration in Apache Superset style (JSON format) based on the user's request and data.

Return JSON with:
- "chartType": "bar", "line", "pie", "area", or "scatter"
- "title": Chart title
- "xAxis": { "field": "column_name", "label": "X Axis Label" }
- "yAxis": { "field": "column_name", "label": "Y Axis Label" }
- "data": The processed data array
- "options": Additional chart options (colors, legend, etc.)`;

  const columns = dataSchema.columns.map(c => c.name).join(', ');
  const userPrompt = `Data columns: ${columns}

User Question: ${question}

Analysis Result: ${JSON.stringify(analysisResult).substring(0, 500)}

Generate a chart configuration that best visualizes this data to answer the user's question.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 2048
    });

    return JSON.parse(response.choices[0].message.content || "{}");
  } catch (error) {
    console.error("Chart config generation error:", error);
    return null;
  }
}

/**
 * Generate natural language answer from analysis results
 */
export async function generateNaturalLanguageAnswer(
  question: string,
  analysisResult: any,
  chartConfig?: any
): Promise<string> {
  const systemPrompt = `You are a helpful business intelligence assistant. Provide clear, concise answers based on data analysis results.`;

  const resultSummary = typeof analysisResult === 'object' 
    ? JSON.stringify(analysisResult).substring(0, 1000)
    : String(analysisResult);

  const userPrompt = `User Question: ${question}

Analysis Result: ${resultSummary}

Provide a clear, conversational answer to the user's question based on these results. Be specific and include key numbers or insights.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_completion_tokens: 512
    });

    return response.choices[0].message.content || "I've analyzed the data for you.";
  } catch (error) {
    console.error("Answer generation error:", error);
    return "I've completed the analysis based on your data.";
  }
}
