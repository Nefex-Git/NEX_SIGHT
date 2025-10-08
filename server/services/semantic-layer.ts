import { sql } from 'drizzle-orm';

// Metric types matching BI industry standards
export type AggregationType = 'sum' | 'avg' | 'count' | 'min' | 'max' | 'count_distinct';

export interface Metric {
  name: string;
  field: string;
  aggregation: AggregationType;
  format?: 'number' | 'currency' | 'percentage';
}

export interface Dimension {
  name: string;
  field: string;
  type: 'string' | 'number' | 'date' | 'boolean';
}

export interface SemanticDataset {
  id: string;
  name: string;
  connectionType: string;
  tableName: string;
  schemaName?: string;
  metrics: Metric[];
  dimensions: Dimension[];
}

export interface QuerySpec {
  dataset: SemanticDataset;
  metrics: string[];
  dimensions: string[];
  filters?: Array<{
    field: string;
    operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'like';
    value: any;
  }>;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class SemanticLayer {
  /**
   * Translate chart configuration to semantic query
   * This is the key method that abstracts business logic from SQL
   */
  static translateChartConfig(
    chartType: string,
    config: Record<string, any>,
    dataset: SemanticDataset
  ): QuerySpec {
    const querySpec: QuerySpec = {
      dataset,
      metrics: [],
      dimensions: [],
      limit: config.limit ? parseInt(config.limit) : 100,
      sortOrder: config.sortOrder || 'desc'
    };

    switch (chartType) {
      case 'bar':
      case 'stacked_bar':
      case 'grouped_bar':
      case 'horizontal_bar':
        // Bar charts: dimension on x-axis, aggregated metric on y-axis
        if (config.xAxis) querySpec.dimensions.push(config.xAxis);
        if (config.yAxis) {
          querySpec.metrics.push(config.yAxis);
          querySpec.sortBy = config.yAxis;
        }
        break;

      case 'line':
      case 'area':
      case 'multi_line':
      case 'stacked_area':
        // Time series: time dimension + metric + optional groupBy
        if (config.xAxis) querySpec.dimensions.push(config.xAxis);
        if (config.yAxis) querySpec.metrics.push(config.yAxis);
        if (config.groupBy) querySpec.dimensions.push(config.groupBy);
        break;

      case 'pie':
      case 'donut':
        // Pie charts: category dimension + value metric
        if (config.category) querySpec.dimensions.push(config.category);
        if (config.value) {
          querySpec.metrics.push(config.value);
          querySpec.sortBy = config.value;
        }
        break;

      case 'big_number':
      case 'gauge':
        // Single metric, no dimensions
        if (config.metric) querySpec.metrics.push(config.metric);
        querySpec.limit = 1;
        break;

      case 'scatter':
      case 'bubble':
        // Scatter: two metrics, optional dimensions
        if (config.xAxis) querySpec.metrics.push(config.xAxis);
        if (config.yAxis) querySpec.metrics.push(config.yAxis);
        if (config.size) querySpec.metrics.push(config.size);
        if (config.color) querySpec.dimensions.push(config.color);
        break;

      case 'table':
        // Table: all requested columns
        if (config.columns) {
          const cols = config.columns.split(',').map((c: string) => c.trim());
          querySpec.dimensions.push(...cols);
        }
        querySpec.limit = config.limit ? parseInt(config.limit) : 50;
        break;

      default:
        // Generic fallback
        if (config.xAxis) querySpec.dimensions.push(config.xAxis);
        if (config.yAxis) querySpec.metrics.push(config.yAxis);
    }

    return querySpec;
  }

  /**
   * Build SQL query from semantic query spec
   * Generates type-safe, optimized SQL with proper aggregations
   */
  static buildQuery(spec: QuerySpec, connectionType: string): string {
    const { dataset, metrics, dimensions, filters, limit, offset, sortBy, sortOrder } = spec;
    
    // Build SELECT clause
    const selectParts: string[] = [];
    
    // Add dimensions
    dimensions.forEach(dim => {
      selectParts.push(this.sanitizeIdentifier(dim));
    });

    // Add metrics with aggregations
    metrics.forEach(metric => {
      const aggregation = spec.dataset.metrics.find(m => m.field === metric)?.aggregation || 'sum';
      selectParts.push(`${aggregation.toUpperCase()}(${this.sanitizeIdentifier(metric)}) as ${this.sanitizeIdentifier(metric)}`);
    });

    // If no specific columns, select all
    if (selectParts.length === 0) {
      selectParts.push('*');
    }

    // Build table name
    const tableName = dataset.schemaName 
      ? `${this.sanitizeIdentifier(dataset.schemaName)}.${this.sanitizeIdentifier(dataset.tableName)}`
      : this.sanitizeIdentifier(dataset.tableName);

    // Start building query
    let query = `SELECT ${selectParts.join(', ')} FROM ${tableName}`;

    // Add WHERE clause
    if (filters && filters.length > 0) {
      const whereClauses = filters.map(f => {
        const field = this.sanitizeIdentifier(f.field);
        switch (f.operator) {
          case 'eq': return `${field} = ${this.sanitizeValue(f.value)}`;
          case 'ne': return `${field} != ${this.sanitizeValue(f.value)}`;
          case 'gt': return `${field} > ${this.sanitizeValue(f.value)}`;
          case 'lt': return `${field} < ${this.sanitizeValue(f.value)}`;
          case 'gte': return `${field} >= ${this.sanitizeValue(f.value)}`;
          case 'lte': return `${field} <= ${this.sanitizeValue(f.value)}`;
          case 'in': return `${field} IN (${f.value.map((v: any) => this.sanitizeValue(v)).join(', ')})`;
          case 'like': return `${field} LIKE ${this.sanitizeValue(`%${f.value}%`)}`;
          default: return `${field} = ${this.sanitizeValue(f.value)}`;
        }
      });
      query += ` WHERE ${whereClauses.join(' AND ')}`;
    }

    // Add GROUP BY if we have dimensions and metrics
    if (dimensions.length > 0 && metrics.length > 0) {
      query += ` GROUP BY ${dimensions.map(d => this.sanitizeIdentifier(d)).join(', ')}`;
    }

    // Add ORDER BY
    if (sortBy) {
      query += ` ORDER BY ${this.sanitizeIdentifier(sortBy)} ${sortOrder?.toUpperCase() || 'DESC'}`;
    }

    // Add LIMIT based on connection type
    if (limit) {
      if (connectionType === 'mssql' || connectionType === 'sqlserver') {
        // For SQL Server, use TOP at the beginning
        query = query.replace('SELECT', `SELECT TOP ${limit}`);
      } else {
        // For MySQL, PostgreSQL, etc.
        query += ` LIMIT ${limit}`;
      }
    }

    // Add OFFSET
    if (offset) {
      query += ` OFFSET ${offset}`;
    }

    return query;
  }

  /**
   * Sanitize SQL identifiers to prevent injection
   */
  private static sanitizeIdentifier(identifier: string): string {
    return identifier.replace(/[^a-zA-Z0-9_.]/g, '');
  }

  /**
   * Sanitize values for SQL
   */
  private static sanitizeValue(value: any): string {
    if (typeof value === 'string') {
      return `'${value.replace(/'/g, "''")}'`;
    }
    if (typeof value === 'number') {
      return value.toString();
    }
    if (value === null || value === undefined) {
      return 'NULL';
    }
    return `'${String(value)}'`;
  }

  /**
   * Create semantic dataset from data source metadata
   * This auto-discovers metrics and dimensions from schema
   */
  static createDatasetFromMetadata(
    dataSource: any
  ): SemanticDataset {
    const metadata = dataSource.metadata as any;
    const metrics: Metric[] = [];
    const dimensions: Dimension[] = [];

    // Auto-detect metrics and dimensions from schema
    if (metadata.schema && Array.isArray(metadata.schema)) {
      metadata.schema.forEach((col: any) => {
        const colName = col.name || col.column_name;
        const colType = col.type || col.data_type || '';

        // Numeric columns are potential metrics
        if (this.isNumericType(colType)) {
          metrics.push({
            name: colName,
            field: colName,
            aggregation: 'sum',
            format: 'number'
          });
        }

        // All columns are dimensions
        dimensions.push({
          name: colName,
          field: colName,
          type: this.mapColumnType(colType)
        });
      });
    } else if (metadata.columns && Array.isArray(metadata.columns)) {
      // For CSV files
      metadata.columns.forEach((col: string) => {
        // Assume numeric-looking columns are metrics
        dimensions.push({
          name: col,
          field: col,
          type: 'string'
        });
        
        // Add as metric if it looks numeric
        if (col.toLowerCase().includes('total') || 
            col.toLowerCase().includes('amount') ||
            col.toLowerCase().includes('price') ||
            col.toLowerCase().includes('quantity')) {
          metrics.push({
            name: col,
            field: col,
            aggregation: 'sum',
            format: 'number'
          });
        }
      });
    }

    return {
      id: dataSource.id,
      name: dataSource.name,
      connectionType: metadata.connectionType || dataSource.type,
      tableName: metadata.tableName || '',
      schemaName: metadata.schemaName,
      metrics,
      dimensions
    };
  }

  private static isNumericType(type: string): boolean {
    const numericTypes = ['int', 'integer', 'bigint', 'decimal', 'numeric', 'float', 'double', 'real', 'money'];
    return numericTypes.some(t => type.toLowerCase().includes(t));
  }

  private static mapColumnType(sqlType: string): 'string' | 'number' | 'date' | 'boolean' {
    const type = sqlType.toLowerCase();
    if (this.isNumericType(type)) return 'number';
    if (type.includes('date') || type.includes('time')) return 'date';
    if (type.includes('bool')) return 'boolean';
    return 'string';
  }
}
