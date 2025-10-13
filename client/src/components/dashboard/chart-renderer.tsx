import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Loader2, AlertCircle } from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  AreaChart,
  Area,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { BigNumber } from "@/components/kpi/big-number";
import { BigNumberTrendline } from "@/components/kpi/big-number-trendline";
import { GaugeChart } from "@/components/kpi/gauge-chart";
import { Heatmap } from "@/components/charts/heatmap";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Chart } from "@shared/schema";

interface ChartRendererProps {
  chartId?: string;
  chart?: Chart;
  data?: any[];
  isPreview?: boolean;
}

const COLORS = [
  "#3b82f6", // Blue
  "#10b981", // Green
  "#f59e0b", // Amber
  "#ef4444", // Red
  "#8b5cf6", // Purple
  "#ec4899", // Pink
  "#06b6d4", // Cyan
  "#84cc16", // Lime
];

export function ChartRenderer({ chartId, chart: chartProp, data: dataProp, isPreview = false }: ChartRendererProps) {
  // Fetch chart data only if not in preview mode
  const { data: chart, isLoading, error } = useQuery<Chart>({
    queryKey: ["/api/charts", chartId],
    queryFn: async () => {
      const response = await fetch(`/api/charts/${chartId}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch chart");
      return response.json();
    },
    enabled: !isPreview && !!chartId,
  });

  // Fetch chart data (from data sources) only if not in preview mode
  const { data: chartData, isLoading: dataLoading } = useQuery({
    queryKey: ["/api/charts", chartId, "data"],
    queryFn: async () => {
      const response = await fetch(`/api/charts/${chartId}/data`, {
        credentials: "include",
      });
      if (!response.ok) return [];
      const result = await response.json();
      return result.data || [];
    },
    enabled: !isPreview && !!chart,
  });

  // Use preview data or fetched data
  const activeChart = isPreview ? chartProp : chart;
  const activeData = isPreview ? (dataProp || []) : (chartData || []);

  if (!isPreview && (isLoading || dataLoading)) {
    return (
      <div className="flex items-center justify-center h-full min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isPreview && (error || !activeChart)) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-muted-foreground">
        <AlertCircle className="h-8 w-8 mb-2" />
        <p>Failed to load chart</p>
      </div>
    );
  }

  if (!activeChart) {
    return null;
  }

  const renderChart = () => {
    const data = activeData || [];
    const config = (activeChart.config || {}) as Record<string, any>;

    if (!data || data.length === 0) {
      return (
        <div className="flex items-center justify-center h-full min-h-[200px] text-muted-foreground">
          <p>No data available</p>
        </div>
      );
    }

    switch (activeChart.type) {
      // KPI Charts
      case "big_number":
        const metric = config.metric;
        if (!metric) {
          return (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p>Metric column not configured</p>
            </div>
          );
        }
        const value = data[0]?.[metric] || 0;
        return (
          <BigNumber
            title={activeChart.title}
            value={value}
            prefix={config.prefix}
            suffix={config.suffix}
            format={config.format || "number"}
          />
        );

      case "big_number_trendline":
        const metricTrend = config.metric;
        const timeColumn = config.timeColumn;
        if (!metricTrend || !timeColumn) {
          return (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p>Metric and time column not configured</p>
            </div>
          );
        }
        const trendData = data.map((d: any) => ({
          value: d[metricTrend] || 0,
          date: d[timeColumn],
        }));
        const currentValue = data[data.length - 1]?.[metricTrend] || 0;
        return (
          <BigNumberTrendline
            title={activeChart.title}
            value={currentValue}
            trendData={trendData}
            prefix={config.prefix}
            suffix={config.suffix}
            format={config.format || "number"}
          />
        );

      case "gauge":
        const gaugeMetric = config.metric;
        const gaugeValue = data[0]?.[gaugeMetric] || 0;
        return (
          <GaugeChart
            title={activeChart.title}
            value={gaugeValue}
            target={config.maxValue || 100}
            min={config.minValue || 0}
            max={config.maxValue || 100}
          />
        );

      // Bar Charts with customization options
      case "bar":
      case "stacked_bar":
      case "grouped_bar":
      case "horizontal_bar":
        if (!config.xAxis || !config.yAxis) {
          return (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p>X-Axis and Y-Axis columns not configured</p>
            </div>
          );
        }
        
        const isHorizontal = config.orientation === "horizontal" || activeChart.type === "horizontal_bar";
        const labelDisplay = config.labelDisplay || "hover";
        const valueFormat = config.valueFormat || "value";
        
        // Calculate total for percentage display
        const total = data.reduce((sum: number, item: any) => sum + (Number(item[config.yAxis]) || 0), 0);
        
        // Format label based on valueFormat
        const formatLabel = (value: number) => {
          if (valueFormat === "percentage") {
            return `${((value / total) * 100).toFixed(1)}%`;
          } else if (valueFormat === "both") {
            return `${value} (${((value / total) * 100).toFixed(1)}%)`;
          }
          return value;
        };
        
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={data} 
              layout={isHorizontal ? "vertical" : "horizontal"}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              {isHorizontal ? (
                <>
                  <XAxis type="number" stroke="#6b7280" fontSize={12} />
                  <YAxis 
                    type="category" 
                    dataKey={config.xAxis} 
                    stroke="#6b7280" 
                    fontSize={11}
                    width={100}
                    tick={{ fill: "#374151" }}
                  />
                </>
              ) : (
                <>
                  <XAxis 
                    dataKey={config.xAxis} 
                    stroke="#6b7280" 
                    fontSize={11}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    tick={{ fill: "#374151" }}
                  />
                  <YAxis stroke="#6b7280" fontSize={12} />
                </>
              )}
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "6px",
                }}
                formatter={(value: number) => formatLabel(value)}
              />
              <Legend />
              <Bar
                dataKey={config.yAxis}
                fill={COLORS[0]}
                radius={isHorizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]}
                label={labelDisplay === "always" || labelDisplay === "inside" ? {
                  position: labelDisplay === "inside" ? "inside" : "top",
                  fill: labelDisplay === "inside" ? "#ffffff" : "#374151",
                  fontSize: 11,
                  formatter: formatLabel
                } : false}
              />
            </BarChart>
          </ResponsiveContainer>
        );

      // Line Charts
      case "line":
      case "multi_line":
      case "smooth_line":
      case "stepped_line":
        if (!config.xAxis || !config.yAxis) {
          return (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p>X-Axis and Y-Axis columns not configured</p>
            </div>
          );
        }
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey={config.xAxis} stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "6px",
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey={config.yAxis}
                stroke={COLORS[0]}
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case "area":
      case "stacked_area":
        if (!config.xAxis || !config.yAxis) {
          return (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p>X-Axis and Y-Axis columns not configured</p>
            </div>
          );
        }
        return (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey={config.xAxis} stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "6px",
                }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey={config.yAxis}
                stroke={COLORS[0]}
                fill={COLORS[0]}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      // Pie Charts
      case "pie":
      case "donut":
        if (!config.category || !config.value) {
          return (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p>Category and value columns not configured</p>
            </div>
          );
        }
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey={config.value}
                nameKey={config.category}
                cx="50%"
                cy="50%"
                outerRadius={activeChart.type === "donut" ? 80 : 100}
                innerRadius={activeChart.type === "donut" ? 50 : 0}
                label
              >
                {data.map((_: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );

      // Scatter Charts
      case "scatter":
      case "bubble":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey={config.xAxis} stroke="#6b7280" fontSize={12} />
              <YAxis dataKey={config.yAxis} stroke="#6b7280" fontSize={12} />
              <Tooltip cursor={{ strokeDasharray: "3 3" }} />
              <Legend />
              <Scatter name={activeChart.title} data={data} fill={COLORS[0]} />
            </ScatterChart>
          </ResponsiveContainer>
        );

      // Heatmap
      case "heatmap":
        return (
          <Heatmap
            data={data}
            xKey={config.xAxis}
            yKey={config.yAxis}
            valueKey={config.metric}
          />
        );

      // Radar Chart
      case "radar":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={data}>
              <PolarGrid />
              <PolarAngleAxis dataKey={config.dimensions?.[0]} />
              <PolarRadiusAxis />
              <Radar
                name={activeChart.title}
                dataKey={config.metrics?.[0]}
                stroke={COLORS[0]}
                fill={COLORS[0]}
                fillOpacity={0.6}
              />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        );

      // Table
      case "table":
      case "pivot_table":
        const columns = config.columns || Object.keys(data[0] || {});
        return (
          <div className="overflow-auto max-h-full">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((col: string) => (
                    <TableHead key={col}>{col}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.slice(0, 50).map((row: any, idx: number) => (
                  <TableRow key={idx}>
                    {columns.map((col: string) => (
                      <TableCell key={col}>{row[col]}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        );

      default:
        return (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>Chart type "{activeChart.type}" not yet supported</p>
          </div>
        );
    }
  };

  return (
    <div className="w-full h-full bg-white dark:bg-white rounded-lg p-4">
      {renderChart()}
    </div>
  );
}
