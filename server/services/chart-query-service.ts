import { SemanticLayer, SemanticDataset, QuerySpec } from './semantic-layer';
import { queryCache } from './query-cache';
import { DatabaseConnectorService } from './database-connector';
import * as fs from 'fs';
import * as path from 'path';
import csvParser from 'csv-parser';

interface ChartDataRequest {
  chartId: string;
  chartType: string;
  config: Record<string, any>;
  dataSource: any;
  limit?: number;
}

export class ChartQueryService {
  /**
   * Execute chart query with semantic layer and caching
   * This is the main entry point for getting chart data
   */
  static async executeChartQuery(request: ChartDataRequest): Promise<any[]> {
    const { chartType, config, dataSource, limit } = request;

    // 1. Create semantic dataset from data source
    const semanticDataset = SemanticLayer.createDatasetFromMetadata(dataSource);

    // 2. Translate chart config to query spec
    const querySpec = SemanticLayer.translateChartConfig(chartType, config, semanticDataset);
    
    // Apply limit
    if (limit) {
      querySpec.limit = Math.min(limit, querySpec.limit || 1000);
    }

    // 3. Check cache first
    const connectionType = semanticDataset.connectionType;
    const query = SemanticLayer.buildQuery(querySpec, connectionType);
    
    const cachedResult = await queryCache.get(
      query,
      config,
      [dataSource.id]
    );

    if (cachedResult) {
      console.log(`✨ Serving from cache for chart type: ${chartType}`);
      return cachedResult;
    }

    // 4. Execute query based on data source type
    let result: any[] = [];

    if (dataSource.type === 'csv' && dataSource.filename) {
      result = await this.executeCSVQuery(dataSource, querySpec);
    } else if (dataSource.metadata && dataSource.metadata.isTableDataset) {
      result = await this.executeDatabaseQuery(query, connectionType, dataSource.metadata);
    } else {
      console.error('Unknown data source type:', dataSource.type);
      return [];
    }

    // 5. Cache the result
    await queryCache.set(
      query,
      result,
      config,
      [dataSource.id],
      this.getCacheTTL(chartType)
    );

    console.log(`📊 Executed query for ${chartType}, returned ${result.length} rows`);
    return result;
  }

  /**
   * Execute query on CSV file
   * Applies filtering, grouping, and aggregation in memory
   */
  private static async executeCSVQuery(
    dataSource: any,
    querySpec: QuerySpec
  ): Promise<any[]> {
    const filePath = path.join(process.cwd(), 'uploads', dataSource.filename);
    
    if (!fs.existsSync(filePath)) {
      return [];
    }

    // Read CSV
    const rawData = await this.parseCSVFile(filePath);

    // Apply semantic query to in-memory data
    return this.applyQuerySpec(rawData, querySpec);
  }

  /**
   * Execute SQL query on database
   */
  private static async executeDatabaseQuery(
    query: string,
    connectionType: string,
    metadata: any
  ): Promise<any[]> {
    const connectionConfig = {
      host: metadata.host,
      port: metadata.port,
      database: metadata.database,
      username: metadata.username,
      password: metadata.password
    };

    console.log(`Executing semantic query on ${connectionType}:`, query);

    try {
      const result = await DatabaseConnectorService.executeQuery(
        connectionType,
        connectionConfig,
        query
      );

      return result.rows || [];
    } catch (error) {
      console.error('Database query error:', error);
      return [];
    }
  }

  /**
   * Apply query spec to in-memory data (for CSV)
   * Implements grouping, aggregation, filtering, sorting
   */
  private static applyQuerySpec(data: any[], spec: QuerySpec): any[] {
    let result = [...data];

    // Apply filters
    if (spec.filters && spec.filters.length > 0) {
      result = result.filter(row => {
        return spec.filters!.every(filter => {
          const value = row[filter.field];
          switch (filter.operator) {
            case 'eq': return value === filter.value;
            case 'ne': return value !== filter.value;
            case 'gt': return Number(value) > Number(filter.value);
            case 'lt': return Number(value) < Number(filter.value);
            case 'gte': return Number(value) >= Number(filter.value);
            case 'lte': return Number(value) <= Number(filter.value);
            case 'in': return filter.value.includes(value);
            case 'like': return String(value).includes(filter.value);
            default: return true;
          }
        });
      });
    }

    // If we have metrics, apply grouping and aggregation
    if (spec.metrics.length > 0 && spec.dimensions.length > 0) {
      const grouped: Map<string, any> = new Map();

      result.forEach(row => {
        // Create group key from dimensions
        const groupKey = spec.dimensions.map(dim => row[dim]).join('|');

        if (!grouped.has(groupKey)) {
          const groupRow: any = {};
          // Add dimensions
          spec.dimensions.forEach(dim => {
            groupRow[dim] = row[dim];
          });
          // Initialize metrics
          spec.metrics.forEach(metric => {
            const metricDef = spec.dataset.metrics.find(m => m.field === metric);
            const aggregation = metricDef?.aggregation || 'sum';
            
            if (aggregation === 'count') {
              groupRow[metric] = 0;
            } else if (aggregation === 'min') {
              groupRow[metric] = Infinity;
            } else if (aggregation === 'max') {
              groupRow[metric] = -Infinity;
            } else {
              groupRow[metric] = 0;
            }
            groupRow[`_${metric}_count`] = 0;
          });
          grouped.set(groupKey, groupRow);
        }

        const groupRow = grouped.get(groupKey)!;

        // Aggregate metrics
        spec.metrics.forEach(metric => {
          const metricDef = spec.dataset.metrics.find(m => m.field === metric);
          const aggregation = metricDef?.aggregation || 'sum';
          const value = parseFloat(row[metric]) || 0;

          switch (aggregation) {
            case 'sum':
              groupRow[metric] += value;
              break;
            case 'avg':
              groupRow[metric] += value;
              groupRow[`_${metric}_count`]++;
              break;
            case 'count':
              groupRow[metric]++;
              break;
            case 'min':
              groupRow[metric] = Math.min(groupRow[metric], value);
              break;
            case 'max':
              groupRow[metric] = Math.max(groupRow[metric], value);
              break;
            case 'count_distinct':
              if (!groupRow[`_${metric}_set`]) {
                groupRow[`_${metric}_set`] = new Set();
              }
              groupRow[`_${metric}_set`].add(value);
              groupRow[metric] = groupRow[`_${metric}_set`].size;
              break;
          }
        });
      });

      // Convert map to array and finalize averages
      result = Array.from(grouped.values()).map(row => {
        spec.metrics.forEach(metric => {
          const metricDef = spec.dataset.metrics.find(m => m.field === metric);
          if (metricDef?.aggregation === 'avg' && row[`_${metric}_count`] > 0) {
            row[metric] = row[metric] / row[`_${metric}_count`];
          }
          // Clean up temporary fields
          delete row[`_${metric}_count`];
          delete row[`_${metric}_set`];
        });
        return row;
      });
    } else if (spec.metrics.length > 0) {
      // Just metrics, no dimensions - single row result
      const aggregated: any = {};
      
      spec.metrics.forEach(metric => {
        const metricDef = spec.dataset.metrics.find(m => m.field === metric);
        const aggregation = metricDef?.aggregation || 'sum';
        
        const values = result.map(r => parseFloat(r[metric]) || 0);
        
        switch (aggregation) {
          case 'sum':
            aggregated[metric] = values.reduce((a, b) => a + b, 0);
            break;
          case 'avg':
            aggregated[metric] = values.reduce((a, b) => a + b, 0) / values.length;
            break;
          case 'count':
            aggregated[metric] = values.length;
            break;
          case 'min':
            aggregated[metric] = Math.min(...values);
            break;
          case 'max':
            aggregated[metric] = Math.max(...values);
            break;
          case 'count_distinct':
            aggregated[metric] = new Set(values).size;
            break;
        }
      });
      
      result = [aggregated];
    }

    // Sort
    if (spec.sortBy && result.length > 0) {
      result.sort((a, b) => {
        const aVal = Number(a[spec.sortBy!]) || 0;
        const bVal = Number(b[spec.sortBy!]) || 0;
        return spec.sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      });
    }

    // Limit
    if (spec.limit) {
      result = result.slice(0, spec.limit);
    }

    // Offset
    if (spec.offset) {
      result = result.slice(spec.offset);
    }

    return result;
  }

  /**
   * Parse CSV file
   */
  private static parseCSVFile(filePath: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const results: any[] = [];
      fs.createReadStream(filePath)
        .pipe(csvParser())
        .on('data', (data) => results.push(data))
        .on('end', () => resolve(results))
        .on('error', reject);
    });
  }

  /**
   * Get cache TTL based on chart type
   * Different chart types have different cache durations
   */
  private static getCacheTTL(chartType: string): number {
    switch (chartType) {
      case 'big_number':
      case 'gauge':
        return 60; // 1 minute for KPIs
      case 'table':
        return 180; // 3 minutes for tables
      default:
        return 300; // 5 minutes for charts
    }
  }
}
