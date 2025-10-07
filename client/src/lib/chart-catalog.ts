/**
 * Chart Type Catalog
 * Comprehensive catalog of all available chart types, similar to Apache Superset
 */

export interface ChartType {
  id: string;
  name: string;
  description: string;
  category: ChartCategory[];
  tags: string[];
  thumbnail?: string;
  isDeprecated?: boolean;
  requiresPlugin?: boolean;
  configSchema?: any; // Configuration schema for this chart type
}

export type ChartCategory = 
  | 'Popular'
  | 'KPI'
  | 'Distribution'
  | 'Evolution'
  | 'Correlation'
  | 'Part of a Whole'
  | 'Ranking'
  | 'Map'
  | 'Flow'
  | 'Table'
  | 'Advanced-Analytics'
  | 'Other';

export const CHART_CATALOG: ChartType[] = [
  // KPI / Big Number Charts
  {
    id: 'big_number',
    name: 'Big Number',
    description: 'Display a single metric value prominently',
    category: ['KPI', 'Popular'],
    tags: ['2D', 'metric', 'kpi'],
    configSchema: {
      metric: { type: 'column', required: true, numeric: true },
      comparisonType: { type: 'select', options: ['none', 'value', 'percentage'] },
      prefix: { type: 'text' },
      suffix: { type: 'text' },
      decimals: { type: 'number', default: 2 }
    }
  },
  {
    id: 'big_number_trendline',
    name: 'Big Number with Trendline',
    description: 'Display a metric with a small trend visualization',
    category: ['KPI', 'Popular', 'Evolution'],
    tags: ['2D', 'metric', 'trend'],
    configSchema: {
      metric: { type: 'column', required: true, numeric: true },
      timeColumn: { type: 'column', required: true, temporal: true },
      prefix: { type: 'text' },
      suffix: { type: 'text' }
    }
  },
  {
    id: 'gauge',
    name: 'Gauge Chart',
    description: 'Display a metric as a gauge with min/max values',
    category: ['KPI'],
    tags: ['2D', 'metric'],
    configSchema: {
      metric: { type: 'column', required: true, numeric: true },
      minValue: { type: 'number', default: 0 },
      maxValue: { type: 'number', default: 100 },
      thresholds: { type: 'array' }
    }
  },

  // Bar Charts
  {
    id: 'bar',
    name: 'Bar Chart',
    description: 'Compare values across categories',
    category: ['Popular', 'Ranking', 'Distribution'],
    tags: ['2D', 'comparison'],
    configSchema: {
      dimension: { type: 'column', required: true },
      metric: { type: 'column', required: true, numeric: true },
      orientation: { type: 'select', options: ['vertical', 'horizontal'], default: 'vertical' },
      sort: { type: 'select', options: ['none', 'ascending', 'descending'] }
    }
  },
  {
    id: 'stacked_bar',
    name: 'Stacked Bar Chart',
    description: 'Compare multiple metrics stacked in bars',
    category: ['Popular', 'Part of a Whole'],
    tags: ['2D', 'comparison', 'additive'],
    configSchema: {
      dimension: { type: 'column', required: true },
      metrics: { type: 'columns', required: true, numeric: true, multiple: true },
      stackType: { type: 'select', options: ['normal', 'percentage'] }
    }
  },
  {
    id: 'grouped_bar',
    name: 'Grouped Bar Chart',
    description: 'Compare multiple metrics side by side',
    category: ['Ranking', 'Distribution'],
    tags: ['2D', 'comparison'],
    configSchema: {
      dimension: { type: 'column', required: true },
      metrics: { type: 'columns', required: true, numeric: true, multiple: true },
      groupBy: { type: 'column' }
    }
  },

  // Line Charts
  {
    id: 'line',
    name: 'Line Chart',
    description: 'Show trends over time',
    category: ['Popular', 'Evolution'],
    tags: ['2D', 'trend', 'time-series'],
    configSchema: {
      timeColumn: { type: 'column', required: true, temporal: true },
      metric: { type: 'column', required: true, numeric: true },
      smoothing: { type: 'boolean', default: false }
    }
  },
  {
    id: 'multi_line',
    name: 'Multi-Line Chart',
    description: 'Compare multiple trends over time',
    category: ['Evolution', 'Correlation'],
    tags: ['2D', 'trend', 'time-series'],
    configSchema: {
      timeColumn: { type: 'column', required: true, temporal: true },
      metrics: { type: 'columns', required: true, numeric: true, multiple: true },
      groupBy: { type: 'column' }
    }
  },
  {
    id: 'smooth_line',
    name: 'Smooth Line Chart',
    description: 'Line chart with smooth curves',
    category: ['Evolution'],
    tags: ['2D', 'aesthetic', 'trend'],
    configSchema: {
      timeColumn: { type: 'column', required: true, temporal: true },
      metric: { type: 'column', required: true, numeric: true }
    }
  },
  {
    id: 'stepped_line',
    name: 'Stepped Line Chart',
    description: 'Line chart with stepped transitions',
    category: ['Evolution'],
    tags: ['2D', 'trend'],
    configSchema: {
      timeColumn: { type: 'column', required: true, temporal: true },
      metric: { type: 'column', required: true, numeric: true }
    }
  },

  // Area Charts
  {
    id: 'area',
    name: 'Area Chart',
    description: 'Show volume over time with filled area',
    category: ['Popular', 'Evolution'],
    tags: ['2D', 'trend', 'additive'],
    configSchema: {
      timeColumn: { type: 'column', required: true, temporal: true },
      metric: { type: 'column', required: true, numeric: true }
    }
  },
  {
    id: 'stacked_area',
    name: 'Stacked Area Chart',
    description: 'Compare multiple metrics with stacked areas',
    category: ['Evolution', 'Part of a Whole'],
    tags: ['2D', 'trend', 'additive'],
    configSchema: {
      timeColumn: { type: 'column', required: true, temporal: true },
      metrics: { type: 'columns', required: true, numeric: true, multiple: true },
      stackType: { type: 'select', options: ['normal', 'percentage'] }
    }
  },

  // Pie Charts
  {
    id: 'pie',
    name: 'Pie Chart',
    description: 'Show proportions of a whole',
    category: ['Popular', 'Part of a Whole'],
    tags: ['2D', 'percentage'],
    configSchema: {
      dimension: { type: 'column', required: true },
      metric: { type: 'column', required: true, numeric: true },
      showLabels: { type: 'boolean', default: true },
      showLegend: { type: 'boolean', default: true }
    }
  },
  {
    id: 'donut',
    name: 'Donut Chart',
    description: 'Pie chart with a hollow center',
    category: ['Part of a Whole'],
    tags: ['2D', 'percentage'],
    configSchema: {
      dimension: { type: 'column', required: true },
      metric: { type: 'column', required: true, numeric: true },
      innerRadius: { type: 'number', default: 50 }
    }
  },

  // Scatter & Bubble
  {
    id: 'scatter',
    name: 'Scatter Plot',
    description: 'Show correlation between two variables',
    category: ['Popular', 'Correlation'],
    tags: ['2D', 'correlation'],
    configSchema: {
      xAxis: { type: 'column', required: true, numeric: true },
      yAxis: { type: 'column', required: true, numeric: true },
      groupBy: { type: 'column' }
    }
  },
  {
    id: 'bubble',
    name: 'Bubble Chart',
    description: 'Scatter plot with size representing a third dimension',
    category: ['Correlation', 'Advanced-Analytics'],
    tags: ['2D', 'correlation', '3D-data'],
    configSchema: {
      xAxis: { type: 'column', required: true, numeric: true },
      yAxis: { type: 'column', required: true, numeric: true },
      size: { type: 'column', required: true, numeric: true },
      groupBy: { type: 'column' }
    }
  },

  // Heatmaps
  {
    id: 'heatmap',
    name: 'Heatmap',
    description: 'Show values as colors in a matrix',
    category: ['Popular', 'Correlation', 'Distribution'],
    tags: ['2D', 'correlation', 'dense'],
    configSchema: {
      xAxis: { type: 'column', required: true },
      yAxis: { type: 'column', required: true },
      metric: { type: 'column', required: true, numeric: true },
      colorScheme: { type: 'select', options: ['blue', 'red', 'green', 'rainbow'] }
    }
  },
  {
    id: 'calendar_heatmap',
    name: 'Calendar Heatmap',
    description: 'Display values on a calendar layout',
    category: ['Evolution', 'Distribution'],
    tags: ['2D', 'time-series', 'calendar'],
    configSchema: {
      dateColumn: { type: 'column', required: true, temporal: true },
      metric: { type: 'column', required: true, numeric: true }
    }
  },

  // Box Plot & Distribution
  {
    id: 'boxplot',
    name: 'Box Plot',
    description: 'Show distribution statistics',
    category: ['Distribution', 'Advanced-Analytics'],
    tags: ['2D', 'statistical'],
    configSchema: {
      dimension: { type: 'column', required: true },
      metric: { type: 'column', required: true, numeric: true }
    }
  },
  {
    id: 'histogram',
    name: 'Histogram',
    description: 'Show frequency distribution',
    category: ['Distribution'],
    tags: ['2D', 'statistical'],
    configSchema: {
      metric: { type: 'column', required: true, numeric: true },
      bins: { type: 'number', default: 10 }
    }
  },

  // Table
  {
    id: 'table',
    name: 'Table',
    description: 'Display data in a tabular format',
    category: ['Table', 'Popular'],
    tags: ['detailed', 'sortable'],
    configSchema: {
      columns: { type: 'columns', required: true, multiple: true },
      pageSize: { type: 'number', default: 10 },
      sortable: { type: 'boolean', default: true }
    }
  },
  {
    id: 'pivot_table',
    name: 'Pivot Table',
    description: 'Cross-tabulation with aggregations',
    category: ['Table', 'Advanced-Analytics'],
    tags: ['detailed', 'aggregation'],
    configSchema: {
      rows: { type: 'columns', required: true, multiple: true },
      columns: { type: 'columns', required: true, multiple: true },
      metrics: { type: 'columns', required: true, numeric: true, multiple: true },
      aggregation: { type: 'select', options: ['sum', 'avg', 'count', 'min', 'max'] }
    }
  },

  // Map Charts
  {
    id: 'country_map',
    name: 'Country Map',
    description: 'Display metrics on a country map',
    category: ['Map'],
    tags: ['geographic', '2D'],
    requiresPlugin: true,
    configSchema: {
      countryColumn: { type: 'column', required: true },
      metric: { type: 'column', required: true, numeric: true },
      colorScheme: { type: 'select' }
    }
  },
  {
    id: 'geojson_map',
    name: 'GeoJSON Map',
    description: 'Visualize geographic data with custom boundaries',
    category: ['Map', 'Advanced-Analytics'],
    tags: ['geographic', '2D'],
    requiresPlugin: true,
    configSchema: {
      geojsonColumn: { type: 'column', required: true },
      metric: { type: 'column', required: true, numeric: true }
    }
  },

  // Other Charts
  {
    id: 'funnel',
    name: 'Funnel Chart',
    description: 'Show progressive reduction of data',
    category: ['Flow', 'Ranking'],
    tags: ['2D', 'funnel'],
    configSchema: {
      dimension: { type: 'column', required: true },
      metric: { type: 'column', required: true, numeric: true },
      sort: { type: 'select', options: ['none', 'ascending', 'descending'] }
    }
  },
  {
    id: 'sankey',
    name: 'Sankey Diagram',
    description: 'Visualize flow between entities',
    category: ['Flow', 'Advanced-Analytics'],
    tags: ['flow', 'relationship'],
    requiresPlugin: true,
    configSchema: {
      source: { type: 'column', required: true },
      target: { type: 'column', required: true },
      value: { type: 'column', required: true, numeric: true }
    }
  },
  {
    id: 'treemap',
    name: 'Treemap',
    description: 'Display hierarchical data as nested rectangles',
    category: ['Part of a Whole', 'Ranking'],
    tags: ['hierarchical', '2D'],
    configSchema: {
      dimension: { type: 'column', required: true },
      metric: { type: 'column', required: true, numeric: true },
      groupBy: { type: 'column' }
    }
  },
  {
    id: 'sunburst',
    name: 'Sunburst Chart',
    description: 'Hierarchical data in concentric circles',
    category: ['Part of a Whole', 'Advanced-Analytics'],
    tags: ['hierarchical', '2D'],
    configSchema: {
      hierarchy: { type: 'columns', required: true, multiple: true },
      metric: { type: 'column', required: true, numeric: true }
    }
  },
  {
    id: 'waterfall',
    name: 'Waterfall Chart',
    description: 'Show cumulative effect of sequential values',
    category: ['Flow', 'Evolution'],
    tags: ['2D', 'cumulative'],
    configSchema: {
      dimension: { type: 'column', required: true },
      metric: { type: 'column', required: true, numeric: true },
      showTotal: { type: 'boolean', default: true }
    }
  },
  {
    id: 'radar',
    name: 'Radar Chart',
    description: 'Compare multiple variables on axes from a center point',
    category: ['Correlation'],
    tags: ['2D', 'comparison', 'multivariate'],
    configSchema: {
      dimensions: { type: 'columns', required: true, multiple: true },
      metrics: { type: 'columns', required: true, numeric: true, multiple: true }
    }
  }
];

/**
 * Get all unique categories
 */
export function getCategories(): ChartCategory[] {
  const categories = new Set<ChartCategory>();
  CHART_CATALOG.forEach(chart => {
    chart.category.forEach(cat => categories.add(cat));
  });
  return Array.from(categories).sort();
}

/**
 * Get all unique tags
 */
export function getTags(): string[] {
  const tags = new Set<string>();
  CHART_CATALOG.forEach(chart => {
    chart.tags.forEach(tag => tags.add(tag));
  });
  return Array.from(tags).sort();
}

/**
 * Filter charts by category
 */
export function getChartsByCategory(category: ChartCategory): ChartType[] {
  return CHART_CATALOG.filter(chart => chart.category.includes(category));
}

/**
 * Filter charts by tag
 */
export function getChartsByTag(tag: string): ChartType[] {
  return CHART_CATALOG.filter(chart => chart.tags.includes(tag));
}

/**
 * Search charts by name or description
 */
export function searchCharts(query: string): ChartType[] {
  const lowerQuery = query.toLowerCase();
  return CHART_CATALOG.filter(chart => 
    chart.name.toLowerCase().includes(lowerQuery) ||
    chart.description.toLowerCase().includes(lowerQuery) ||
    chart.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
}

/**
 * Get chart by ID
 */
export function getChartById(id: string): ChartType | undefined {
  return CHART_CATALOG.find(chart => chart.id === id);
}
