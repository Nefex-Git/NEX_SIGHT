# Semantic Layer Architecture

## Overview

NEX Sight implements a production-grade semantic layer for business intelligence, following industry standards from Apache Superset, Domo, Power BI, and Tableau. The semantic layer provides a business-friendly abstraction over raw data, enabling reliable chart creation with built-in caching and type-safe query generation.

## Architecture Components

### 1. Semantic Layer (`server/services/semantic-layer.ts`)

The semantic layer defines business metrics and dimensions as reusable semantic objects:

- **Metrics**: Quantitative measures that can be aggregated (revenue, count, average price)
- **Dimensions**: Categorical attributes used for grouping (category, region, date)
- **Datasets**: Collections of metrics and dimensions from data sources

#### Key Features:
- Auto-discovery of metrics and dimensions from data source schema
- Support for multiple aggregation types (sum, avg, count, min, max, count_distinct)
- Chart-type-aware configuration translation
- Type-safe SQL query generation preventing injection attacks
- Database-specific query optimization (PostgreSQL, MySQL, MS SQL)

### 2. Query Cache (`server/services/query-cache.ts`)

Redis-backed caching system with intelligent invalidation:

- **Primary Cache**: Redis (when available) for distributed caching
- **Fallback Cache**: In-memory Map for development/testing
- **Cache Keys**: Content-based hashing of queries + config + data sources
- **Invalidation**: Automatic cache clearing when data sources change
- **Statistics**: Hit/miss tracking, cache size monitoring
- **TTL Management**: Different cache durations per chart type

#### Cache TTL Strategy:
- KPIs (big_number, gauge): 60 seconds
- Tables: 180 seconds (3 minutes)
- Charts (bar, line, pie, etc.): 300 seconds (5 minutes)

### 3. Chart Query Service (`server/services/chart-query-service.ts`)

Orchestrates the complete query execution pipeline:

1. **Semantic Translation**: Chart config → Semantic QuerySpec
2. **Cache Check**: Query Redis/memory cache first
3. **Query Execution**: Generate and run SQL or process CSV
4. **Result Caching**: Store results with appropriate TTL
5. **Return Data**: Serve to client

#### Supported Data Sources:
- **CSV Files**: In-memory aggregation with semantic query application
- **Database Tables**: SQL generation and execution (PostgreSQL, MySQL, MS SQL, MongoDB)

## Supported Chart Types

The semantic layer supports 25+ chart types across all BI categories:

### KPI / Metrics
- `big_number` - Single metric display
- `big_number_trendline` - Metric with trend sparkline
- `gauge` - Gauge chart with min/max
- `multi_value_card` - Multiple metrics card

### Bar Charts
- `bar` - Vertical bar chart
- `stacked_bar` - Stacked bars
- `grouped_bar` - Grouped comparison
- `horizontal_bar` - Horizontal orientation

### Line/Area Charts
- `line` - Time series line
- `multi_line` - Multiple lines
- `smooth_line` - Bezier curves
- `stepped_line` - Step transitions
- `area` - Filled area chart
- `stacked_area` - Stacked areas

### Pie/Donut
- `pie` - Pie chart
- `donut` - Donut chart

### Scatter/Bubble
- `scatter` - X-Y correlation
- `bubble` - 3D scatter with size

### Heatmaps
- `heatmap` - Value matrix
- `calendar_heatmap` - Calendar layout

### Distribution
- `boxplot` - Statistical distribution
- `histogram` - Frequency distribution

### Flow
- `funnel` - Conversion funnel
- `waterfall` - Cumulative flow
- `sankey` - Flow diagram

### Hierarchical
- `treemap` - Nested rectangles
- `sunburst` - Hierarchical circles

### Other
- `radar` - Multi-variate comparison
- `table` - Data table
- `pivot_table` - Cross-tabulation

### Maps
- `country_map` - Geographic choropleth
- `geojson_map` - Custom boundaries

## API Endpoints

### Chart Data
```
GET /api/charts/:id/data?limit=100
```
Returns aggregated chart data using semantic layer with caching.

### Data Preview
```
GET /api/data-sources/:id/preview?limit=50
```
Returns preview data using semantic layer (raw or aggregated based on chart type).

### Cache Management
```
GET /api/cache/stats
```
Returns cache statistics:
```json
{
  "type": "redis",
  "hits": 142,
  "misses": 23,
  "hitRate": "86.06%",
  "size": 15,
  "keyCount": 15
}
```

```
POST /api/cache/clear
```
Clears all cached queries.

## Query Specification (QuerySpec)

The semantic layer uses a structured query specification:

```typescript
interface QuerySpec {
  dataset: SemanticDataset;
  metrics: string[];        // Metrics to aggregate
  dimensions: string[];     // Dimensions to group by
  filters?: Filter[];       // WHERE conditions
  sortBy?: string;          // ORDER BY column
  sortOrder?: 'asc' | 'desc';
  limit?: number;           // Result limit
  offset?: number;          // Result offset
}
```

### Filter Operators:
- `eq` - Equal
- `ne` - Not equal
- `gt` - Greater than
- `lt` - Less than
- `gte` - Greater than or equal
- `lte` - Less than or equal
- `in` - In list
- `like` - Pattern match

## SQL Query Generation

The semantic layer generates optimized, type-safe SQL:

### Example 1: Bar Chart
**Config:**
```json
{
  "chartType": "bar",
  "xAxis": "category",
  "yAxis": "revenue"
}
```

**Generated SQL (PostgreSQL):**
```sql
SELECT category, SUM(revenue) as revenue 
FROM sales_data 
GROUP BY category 
ORDER BY revenue DESC 
LIMIT 100
```

### Example 2: Time Series
**Config:**
```json
{
  "chartType": "line",
  "timeColumn": "date",
  "metric": "sales",
  "groupBy": "region"
}
```

**Generated SQL:**
```sql
SELECT date, region, SUM(sales) as sales 
FROM sales_data 
GROUP BY date, region 
ORDER BY sales DESC 
LIMIT 100
```

### Example 3: Scatter Plot
**Config:**
```json
{
  "chartType": "scatter",
  "xAxis": "price",
  "yAxis": "quantity",
  "groupBy": "category"
}
```

**Generated SQL:**
```sql
SELECT category, price, quantity 
FROM products 
LIMIT 100
```

## CSV Query Processing

For CSV files, the semantic layer applies aggregation in-memory:

1. **Parse CSV**: Stream parse to array of objects
2. **Apply Filters**: Filter rows based on conditions
3. **Group By Dimensions**: Create grouped map by dimension values
4. **Aggregate Metrics**: Apply sum/avg/count/min/max
5. **Sort & Limit**: Order results and apply limit

This allows CSV files to behave identically to database sources from the chart's perspective.

## Frontend Integration

### Live Preview Aggregation

The frontend applies the same semantic logic for live preview:

```typescript
// In chart-configuration-modal.tsx
const aggregatedData = aggregatePreviewData(rawData, config, chartType);

// Backend uses identical logic:
const data = await ChartQueryService.executeChartQuery({
  chartId: chart.id,
  chartType: chart.type,
  config: chart.config,
  dataSource,
  limit: 100
});
```

This ensures preview matches production exactly.

### Configuration Mapping

Chart configurations map to semantic concepts:

| Chart Config | Semantic Concept |
|--------------|------------------|
| `xAxis`, `dimension`, `category` | Dimension (GROUP BY) |
| `yAxis`, `metric`, `value` | Metric (with aggregation) |
| `timeColumn` | Time Dimension |
| `groupBy` | Additional Dimension |
| `aggregation` | Metric aggregation type |

## Performance Optimization

### Caching Strategy

1. **Query-based keys**: Same query = same cache key
2. **Config-aware**: Different chart configs = different keys
3. **Source-aware**: Changes to data sources invalidate related queries
4. **Automatic TTL**: Different expiry for different chart types

### Query Optimization

1. **Only necessary columns**: SELECT only required fields
2. **Pushed-down filters**: WHERE clauses applied at database
3. **Appropriate aggregation**: Use correct aggregation per metric type
4. **Database-specific syntax**: Optimized for each database type

## Security

### SQL Injection Prevention

1. **Identifier Sanitization**: Remove special characters from column/table names
2. **Value Escaping**: Properly escape string values
3. **Type-Safe Construction**: Build queries programmatically, never concatenate
4. **No Dynamic SQL**: All queries use parameterized structure

### Example Sanitization:

```typescript
// Input: "users'; DROP TABLE users; --"
// Output: "users"

sanitizeIdentifier(input: string): string {
  return input.replace(/[^a-zA-Z0-9_.]/g, '');
}
```

## Usage Examples

### Creating a Chart with Semantic Layer

```typescript
// 1. User selects chart type and configuration
const config = {
  xAxis: 'category',
  yAxis: 'revenue',
  aggregation: 'sum'
};

// 2. Frontend saves chart
await fetch('/api/charts', {
  method: 'POST',
  body: JSON.stringify({
    type: 'bar',
    config,
    dataSourceIds: [dataSourceId]
  })
});

// 3. Backend uses semantic layer
const data = await ChartQueryService.executeChartQuery({
  chartType: 'bar',
  config,
  dataSource,
  limit: 100
});

// 4. Results cached automatically
// 5. Subsequent requests served from cache (< 100ms)
```

### Invalidating Cache on Data Update

```typescript
// When user uploads new CSV or refreshes data source
await storage.updateDataSource(id, { /* new data */ });

// Cache automatically invalidated by data source ID
await queryCache.invalidateByDataSource(id);
```

## Monitoring

### Cache Statistics

Monitor cache performance:

```bash
curl http://localhost:5000/api/cache/stats
```

Response:
```json
{
  "type": "redis",
  "hits": 450,
  "misses": 50,
  "hitRate": "90.00%",
  "size": 25,
  "keyCount": 25
}
```

### Performance Metrics

- **Cache Hit Rate**: Target > 80%
- **Query Response Time**: 
  - Cache hit: < 100ms
  - Cache miss (database): < 2s
  - Cache miss (CSV): < 500ms

## Best Practices

### 1. Define Clear Metrics

```typescript
const metrics: Metric[] = [
  {
    field: 'revenue',
    name: 'Total Revenue',
    aggregation: 'sum',
    type: 'currency'
  },
  {
    field: 'orders',
    name: 'Order Count',
    aggregation: 'count',
    type: 'number'
  }
];
```

### 2. Use Appropriate Aggregations

- Revenue, Total: `sum`
- Average Price: `avg`
- Record Count: `count`
- Unique Users: `count_distinct`
- Date Range: `min`, `max`

### 3. Optimize Cache TTL

- Real-time dashboards: 30-60 seconds
- Hourly reports: 5-10 minutes
- Daily reports: 30-60 minutes

### 4. Monitor Cache Performance

Regularly check cache hit rates and adjust TTL accordingly.

## Troubleshooting

### Issue: Cache not working

**Check:**
1. Redis connection: `redis-cli ping`
2. Cache stats: `GET /api/cache/stats`
3. Logs for cache errors

### Issue: Wrong aggregation results

**Check:**
1. Metric definition in dataset
2. Chart config mapping to semantic spec
3. SQL query in logs (search for "Executing semantic query")

### Issue: Slow query performance

**Solutions:**
1. Check if query is cached
2. Add database indexes on commonly grouped columns
3. Increase cache TTL
4. Review query complexity in logs

## Future Enhancements

1. **Calculated Metrics**: Define metrics as formulas (revenue/orders = AOV)
2. **Metric Families**: Group related metrics (all revenue metrics)
3. **Time Intelligence**: Built-in time comparisons (YoY, MoM)
4. **Query Planning**: Optimize join strategies for multi-source charts
5. **Incremental Refresh**: Update only changed data in cache
