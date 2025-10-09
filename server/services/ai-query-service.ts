/**
 * AI Query Service
 * 
 * Handles multi-table queries with automatic relationship detection and JOIN generation
 */

import path from 'path';
import fs from 'fs';
import { storage } from '../storage';
import { parseCSVFile } from '../ai';
import { analyzeDataWithPrivacy } from '../ai-privacy';
import { generateSQLQuery } from './sql-generator';
import { SchemaAnalyzer, type TableSchema, type TableRelationship } from './schema-analyzer';
import { DatabaseConnectorService } from './database-connectors';

interface AiQueryRequest {
  question: string;
  dataSourceIds: string[];
  userId: string;
  isVoiceQuery?: boolean;
}

interface AiQueryResponse {
  answer: string;
  chartData?: any;
  chartType?: string;
  kpiValue?: string;
  unit?: string;
  sqlQuery?: string;
  relationships?: TableRelationship[];
  metadata?: any;
}

export class AiQueryService {
  /**
   * Process AI query with automatic multi-table joining
   */
  static async processQuery(request: AiQueryRequest): Promise<AiQueryResponse> {
    const { question, dataSourceIds, userId } = request;

    // Load and validate all data sources
    const dataSources = await this.loadDataSources(dataSourceIds, userId);

    if (dataSources.length === 0) {
      throw new Error('No valid data sources found');
    }

    // Handle CSV files (single source only)
    const csvSource = dataSources.find(ds => ds.filename);
    if (csvSource) {
      return await this.processCsvQuery(question, csvSource);
    }

    // Handle database table queries
    const tableSources = dataSources.filter(ds => (ds.metadata as any)?.isTableDataset);
    
    if (tableSources.length === 0) {
      throw new Error('No table datasets found');
    }

    if (tableSources.length === 1) {
      // Single table query
      return await this.processSingleTableQuery(question, tableSources[0]);
    } else {
      // Multi-table query with auto-join
      return await this.processMultiTableQuery(question, tableSources);
    }
  }

  /**
   * Load and authorize data sources
   */
  private static async loadDataSources(dataSourceIds: string[], userId: string): Promise<any[]> {
    const sources = await Promise.all(
      dataSourceIds.map(async (id) => {
        const ds = await storage.getDataSource(id);
        if (ds && ds.userId === userId) {
          return ds;
        }
        return null;
      })
    );

    return sources.filter(ds => ds !== null);
  }

  /**
   * Process CSV file query using Python sandbox
   */
  private static async processCsvQuery(question: string, dataSource: any): Promise<AiQueryResponse> {
    const filePath = path.join(process.cwd(), 'uploads', dataSource.filename);
    
    if (!fs.existsSync(filePath)) {
      throw new Error('CSV file not found');
    }

    const csvData = await parseCSVFile(filePath);

    // Use Python sandbox for advanced analysis
    const { analyzeDataWithPythonSandbox } = await import('../ai-privacy');
    
    const analysis = await analyzeDataWithPythonSandbox({
      question,
      csvData,
      dataSourceMetadata: {
        name: dataSource.name,
        type: dataSource.type
      }
    });

    return {
      answer: analysis.answer,
      chartData: analysis.chartData,
      chartType: analysis.chartType,
      kpiValue: analysis.kpiValue,
      unit: analysis.unit
    };
  }

  /**
   * Process single table database query
   */
  private static async processSingleTableQuery(question: string, dataSource: any): Promise<AiQueryResponse> {
    const metadata = dataSource.metadata as any;
    
    const connectionConfig = {
      host: metadata.host,
      port: metadata.port,
      database: metadata.database,
      username: metadata.username,
      password: metadata.password
    };

    // Get schema information
    const tableName = `${metadata.schemaName}.${metadata.tableName}`;
    const sampleQuery = metadata.connectionType === 'sqlserver' 
      ? `SELECT TOP 10 * FROM ${tableName}`
      : `SELECT * FROM ${tableName} LIMIT 10`;

    const sampleResult = await DatabaseConnectorService.executeQuery(
      metadata.connectionType || dataSource.type,
      connectionConfig,
      sampleQuery
    );

    // Extract column information
    const columns = this.extractColumns(sampleResult);

    // Generate SQL query
    const sqlGeneration = await generateSQLQuery({
      question,
      tableName: metadata.tableName,
      schemaName: metadata.schemaName,
      columns,
      databaseType: metadata.connectionType || dataSource.type
    });

    console.log('Generated SQL query:', sqlGeneration.sql);

    // Execute the generated SQL
    const queryResult = await DatabaseConnectorService.executeQuery(
      metadata.connectionType || dataSource.type,
      connectionConfig,
      sqlGeneration.sql
    );

    // Convert results to CSV format for analysis
    const csvData = this.convertResultsToCsvFormat(queryResult);

    // Analyze results
    const analysis = await analyzeDataWithPrivacy({
      question,
      csvData,
      dataSourceMetadata: {
        name: dataSource.name,
        type: dataSource.type,
        tableName: metadata.tableName,
        schemaName: metadata.schemaName
      }
    });

    return {
      answer: analysis.answer,
      chartData: analysis.chartData,
      chartType: analysis.chartType,
      kpiValue: analysis.kpiValue,
      unit: analysis.unit,
      sqlQuery: sqlGeneration.sql,
      metadata: {
        sqlResults: queryResult ? { rowCount: queryResult.rowCount } : null
      }
    };
  }

  /**
   * Process multi-table query with auto-joining
   */
  private static async processMultiTableQuery(question: string, dataSources: any[]): Promise<AiQueryResponse> {
    // Gather schema information for all tables
    const schemas: TableSchema[] = [];
    const connectionConfigs = new Map<string, any>();

    for (const dataSource of dataSources) {
      const metadata = dataSource.metadata as any;
      
      const connectionConfig = {
        host: metadata.host,
        port: metadata.port,
        database: metadata.database,
        username: metadata.username,
        password: metadata.password
      };

      connectionConfigs.set(dataSource.id, {
        config: connectionConfig,
        type: metadata.connectionType || dataSource.type
      });

      // Get schema information
      const tableName = `${metadata.schemaName}.${metadata.tableName}`;
      const sampleQuery = metadata.connectionType === 'sqlserver' 
        ? `SELECT TOP 10 * FROM ${tableName}`
        : `SELECT * FROM ${tableName} LIMIT 10`;

      const sampleResult = await DatabaseConnectorService.executeQuery(
        metadata.connectionType || dataSource.type,
        connectionConfig,
        sampleQuery
      );

      const columns = this.extractColumns(sampleResult);

      schemas.push({
        dataSourceId: dataSource.id,
        tableName: metadata.tableName,
        schemaName: metadata.schemaName,
        columns
      });
    }

    // Detect relationships between tables
    const relationships = SchemaAnalyzer.detectRelationships(schemas);

    console.log('Detected relationships:', JSON.stringify(relationships, null, 2));

    // Generate SQL with JOINs
    const sqlWithJoins = await this.generateMultiTableSQL(question, schemas, relationships, dataSources);

    console.log('Generated multi-table SQL:', sqlWithJoins);

    // Execute on the first data source's connection (all tables should be in same database)
    const firstSource = dataSources[0];
    const firstMetadata = firstSource.metadata as any;
    const connInfo = connectionConfigs.get(firstSource.id)!;

    const queryResult = await DatabaseConnectorService.executeQuery(
      connInfo.type,
      connInfo.config,
      sqlWithJoins
    );

    // Convert results
    const csvData = this.convertResultsToCsvFormat(queryResult);

    // Analyze results
    const analysis = await analyzeDataWithPrivacy({
      question,
      csvData,
      dataSourceMetadata: {
        name: dataSources.map(ds => ds.name).join(', '),
        type: 'multi-table',
        tables: dataSources.map(ds => (ds.metadata as any).tableName)
      }
    });

    return {
      answer: analysis.answer,
      chartData: analysis.chartData,
      chartType: analysis.chartType,
      kpiValue: analysis.kpiValue,
      unit: analysis.unit,
      sqlQuery: sqlWithJoins,
      relationships,
      metadata: {
        sqlResults: queryResult ? { rowCount: queryResult.rowCount } : null,
        tablesUsed: dataSources.map(ds => ({
          name: (ds.metadata as any).tableName,
          schema: (ds.metadata as any).schemaName
        }))
      }
    };
  }

  /**
   * Generate SQL query for multiple tables with JOINs
   */
  private static async generateMultiTableSQL(
    question: string,
    schemas: TableSchema[],
    relationships: TableRelationship[],
    dataSources: any[]
  ): Promise<string> {
    // Build schema description for all tables
    const schemaDescriptions = schemas.map(schema => {
      const fullTableName = schema.schemaName ? `${schema.schemaName}.${schema.tableName}` : schema.tableName;
      const columnList = schema.columns.map(col => `  - ${col.name} (${col.type})`).join('\n');
      return `Table: ${fullTableName}\nColumns:\n${columnList}`;
    }).join('\n\n');

    // Build relationship descriptions
    const relationshipDescriptions = relationships.map(rel => 
      `${rel.leftTable}.${rel.leftColumn} = ${rel.rightTable}.${rel.rightColumn} (confidence: ${rel.confidence})`
    ).join('\n');

    const firstMetadata = dataSources[0].metadata as any;
    const databaseType = firstMetadata.connectionType || dataSources[0].type;

    // Use OpenAI to generate SQL with JOINs
    const OpenAI = (await import('openai')).default;
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const systemPrompt = `You are an expert SQL query generator. Generate SQL queries that JOIN multiple tables based on detected relationships.

IMPORTANT RULES:
1. Generate ONLY valid SQL for ${databaseType} databases
2. Use the detected relationships to JOIN tables
3. Select relevant columns from all tables that answer the question
4. Use proper table aliases for clarity
5. Return ONLY executable SQL - no explanations in the SQL itself
6. For SQL Server, use TOP N instead of LIMIT N
7. Handle NULL values appropriately

Return your response in JSON format:
{
  "sql": "The complete SQL query with JOINs",
  "explanation": "Brief explanation of the query and joins used"
}`;

    const userPrompt = `${schemaDescriptions}

Detected Relationships:
${relationshipDescriptions}

User Question: ${question}

Generate a SQL query that JOINs the necessary tables to answer this question. Use the detected relationships to join tables correctly.`;

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result.sql || "";
  }

  /**
   * Extract columns from query result
   */
  private static extractColumns(sampleResult: any): Array<{ name: string; type: string }> {
    const columns: Array<{ name: string; type: string }> = [];

    if (sampleResult.rows && sampleResult.rows.length > 0 && sampleResult.columns) {
      const sampleRow = sampleResult.rows[0];
      sampleResult.columns.forEach((colName: string, idx: number) => {
        const value = sampleRow[idx];
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

        columns.push({ name: colName, type });
      });
    }

    return columns;
  }

  /**
   * Convert database results to CSV format
   */
  private static convertResultsToCsvFormat(queryResult: any): any[] {
    if (!queryResult.rows || !queryResult.columns) {
      return [];
    }

    return queryResult.rows.map((row: any[]) => {
      const obj: any = {};
      queryResult.columns.forEach((col: string, idx: number) => {
        obj[col] = row[idx];
      });
      return obj;
    });
  }
}
