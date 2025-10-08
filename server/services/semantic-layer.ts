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
      // Bar charts
      case 'bar':
      case 'stacked_bar':
      case 'grouped_bar':
      case 'horizontal_bar':
        if (config.xAxis || config.dimension) querySpec.dimensions.push(config.xAxis || config.dimension);
        if (config.yAxis || config.metric) {
          querySpec.metrics.push(config.yAxis || config.metric);
          querySpec.sortBy = config.yAxis || config.metric;
        }
        if (config.metrics && Array.isArray(config.metrics)) {
          querySpec.metrics.push(...config.metrics);
        }
        if (config.groupBy) querySpec.dimensions.push(config.groupBy);
        break;

      // Line/Area charts
      case 'line':
      case 'area':
      case 'multi_line':
      case 'stacked_area':
      case 'smooth_line':
      case 'stepped_line':
      case 'big_number_trendline':
        if (config.xAxis || config.timeColumn) querySpec.dimensions.push(config.xAxis || config.timeColumn);
        if (config.yAxis || config.metric) querySpec.metrics.push(config.yAxis || config.metric);
        if (config.metrics && Array.isArray(config.metrics)) {
          querySpec.metrics.push(...config.metrics);
        }
        if (config.groupBy) querySpec.dimensions.push(config.groupBy);
        break;

      // Pie/Donut charts
      case 'pie':
      case 'donut':
        if (config.category || config.dimension) querySpec.dimensions.push(config.category || config.dimension);
        if (config.value || config.metric) {
          querySpec.metrics.push(config.value || config.metric);
          querySpec.sortBy = config.value || config.metric;
        }
        break;

      // KPI charts
      case 'big_number':
      case 'gauge':
      case 'multi_value_card':
        if (config.metric) querySpec.metrics.push(config.metric);
        if (config.values && Array.isArray(config.values)) {
          querySpec.metrics.push(...config.values);
        }
        querySpec.limit = 1;
        break;

      // Scatter/Bubble
      case 'scatter':
      case 'bubble':
        if (config.xAxis) querySpec.metrics.push(config.xAxis);
        if (config.yAxis) querySpec.metrics.push(config.yAxis);
        if (config.size) querySpec.metrics.push(config.size);
        if (config.color || config.groupBy) querySpec.dimensions.push(config.color || config.groupBy);
        break;

      // Heatmaps
      case 'heatmap':
      case 'calendar_heatmap':
        if (config.xAxis || config.dateColumn) querySpec.dimensions.push(config.xAxis || config.dateColumn);
        if (config.yAxis) querySpec.dimensions.push(config.yAxis);
        if (config.metric) querySpec.metrics.push(config.metric);
        break;

      // Distribution
      case 'boxplot':
        if (config.dimension) querySpec.dimensions.push(config.dimension);
        if (config.metric) querySpec.metrics.push(config.metric);
        break;

      case 'histogram':
        if (config.metric) querySpec.metrics.push(config.metric);
        break;

      // Flow charts
      case 'funnel':
      case 'waterfall':
      case 'treemap':
        if (config.dimension) querySpec.dimensions.push(config.dimension);
        if (config.metric) querySpec.metrics.push(config.metric);
        if (config.groupBy) querySpec.dimensions.push(config.groupBy);
        break;

      case 'sankey':
        if (config.source) querySpec.dimensions.push(config.source);
        if (config.target) querySpec.dimensions.push(config.target);
        if (config.value) querySpec.metrics.push(config.value);
        break;

      // Hierarchical
      case 'sunburst':
        if (config.hierarchy && Array.isArray(config.hierarchy)) {
          querySpec.dimensions.push(...config.hierarchy);
        }
        if (config.metric) querySpec.metrics.push(config.metric);
        break;

      // Multi-dimensional
      case 'radar':
        if (config.dimensions && Array.isArray(config.dimensions)) {
          querySpec.dimensions.push(...config.dimensions);
        }
        if (config.metrics && Array.isArray(config.metrics)) {
          querySpec.metrics.push(...config.metrics);
        }
        break;

      // Table/Pivot
      case 'table':
      case 'pivot_table':
        if (config.columns) {
          const cols = typeof config.columns === 'string' 
            ? config.columns.split(',').map((c: string) => c.trim())
            : config.columns;
          querySpec.dimensions.push(...cols);
        }
        if (config.rows && Array.isArray(config.rows)) {
          querySpec.dimensions.push(...config.rows);
        }
        if (config.metrics && Array.isArray(config.metrics)) {
          querySpec.metrics.push(...config.metrics);
        }
        querySpec.limit = config.limit ? parseInt(config.limit) : 50;
        break;

      // Map charts
      case 'country_map':
      case 'geojson_map':
        if (config.countryColumn || config.geojsonColumn) {
          querySpec.dimensions.push(config.countryColumn || config.geojsonColumn);
        }
        if (config.metric) querySpec.metrics.push(config.metric);
        break;

      default:
        // Generic fallback
        if (config.xAxis) querySpec.dimensions.push(config.xAxis);
        if (config.yAxis) querySpec.metrics.push(config.yAxis);
    }

    // Remove duplicates and filter out undefined
    querySpec.dimensions = Array.from(new Set(querySpec.dimensions.filter(Boolean)));
    querySpec.metrics = Array.from(new Set(querySpec.metrics.filter(Boolean)));

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
      metadata.columns.forEach((col: any) => {
        // Handle both string columns and object columns
        const colName = typeof col === 'string' ? col : (col.name || col.column_name || String(col));
        
        // Assume numeric-looking columns are metrics
        dimensions.push({
          name: colName,
          field: colName,
          type: 'string'
        });
        
        // Add as metric if it looks numeric (only if colName is a string)
        if (typeof colName === 'string') {
          const lowerCol = colName.toLowerCase();
          if (lowerCol.includes('total') || 
              lowerCol.includes('amount') ||
              lowerCol.includes('price') ||
              lowerCol.includes('quantity')) {
            metrics.push({
              name: colName,
              field: colName,
              aggregation: 'sum',
              format: 'number'
            });
          }
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
