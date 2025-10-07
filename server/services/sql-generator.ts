/**
 * SQL Query Generator Service
 * 
 * Generates SQL queries from natural language using AI
 * PRIVACY: Only uses schema information, never real data
 */

import OpenAI from "openai";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY
});

interface SQLGenerationRequest {
  question: string;
  tableName: string;
  schemaName?: string;
  columns: Array<{ name: string; type: string }>;
  databaseType: string;
}

interface SQLGenerationResponse {
  sql: string;
  explanation: string;
  resultType: 'single_value' | 'table' | 'aggregation';
}

/**
 * Generate SQL query from natural language question
 * Only uses schema information - no real data exposure
 */
export async function generateSQLQuery(request: SQLGenerationRequest): Promise<SQLGenerationResponse> {
  const { question, tableName, schemaName, columns, databaseType } = request;
  
  // Build fully qualified table name
  const fullTableName = schemaName ? `${schemaName}.${tableName}` : tableName;
  
  // Create schema description (NO REAL DATA)
  const schemaDescription = `Table: ${fullTableName}
Columns:
${columns.map(col => `  - ${col.name} (${col.type})`).join('\n')}

Database Type: ${databaseType}`;

  const systemPrompt = `You are an expert SQL query generator. Generate SQL queries based on natural language questions and table schemas.

IMPORTANT RULES:
1. Generate ONLY valid SQL for ${databaseType} databases
2. Use proper syntax for ${databaseType} (e.g., TOP for SQL Server, LIMIT for others)
3. Return ONLY executable SQL - no explanations in the SQL itself
4. For SQL Server, use TOP N instead of LIMIT N
5. Always use fully qualified table names
6. Be precise with aggregations (COUNT, SUM, AVG, etc.)
7. Use DISTINCT when counting unique values
8. Handle NULL values appropriately

Return your response in JSON format:
{
  "sql": "The complete SQL query",
  "explanation": "Brief explanation of what the query does",
  "resultType": "single_value" (for COUNT, SUM, etc.) or "table" (for SELECT with rows) or "aggregation" (for GROUP BY)",
  "visualizationHint": "bar" or "line" or "pie" or "table" (suggest best visualization for the data)
}

Note: If user requests "heatmap", generate a GROUP BY query and suggest "table" or "bar" visualization as we don't support heatmaps yet.`;

  const userPrompt = `${schemaDescription}

User Question: ${question}

Generate the SQL query that answers this question. Be precise and use the correct ${databaseType} syntax.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      sql: result.sql || "",
      explanation: result.explanation || "SQL query generated",
      resultType: result.resultType || "table"
    };
  } catch (error) {
    console.error("SQL generation error:", error);
    throw new Error(`Failed to generate SQL query: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Extract column information from database query results
 */
export function extractColumnInfo(sampleData: any[]): Array<{ name: string; type: string }> {
  if (!sampleData || sampleData.length === 0) {
    return [];
  }
  
  const firstRow = sampleData[0];
  const columns: Array<{ name: string; type: string }> = [];
  
  for (const [key, value] of Object.entries(firstRow)) {
    let type = 'string';
    
    if (value === null || value === undefined) {
      type = 'unknown';
    } else if (typeof value === 'number') {
      type = Number.isInteger(value) ? 'integer' : 'float';
    } else if (value instanceof Date) {
      type = 'date';
    } else if (typeof value === 'boolean') {
      type = 'boolean';
    }
    
    columns.push({ name: key, type });
  }
  
  return columns;
}
