import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExpandIcon } from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface ChartContainerProps {
  title: string;
  type: "line" | "bar" | "pie" | "table";
  data: any[];
  showTitle?: boolean;
  onExpand?: () => void;
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--secondary))', 
  'hsl(var(--accent))',
  'hsl(var(--destructive))',
  'hsl(var(--muted))',
];

export default function ChartContainer({ 
  title, 
  type, 
  data, 
  showTitle = true,
  onExpand 
}: ChartContainerProps) {
  const formatValue = (value: any) => {
    if (typeof value === 'number') {
      if (value >= 1000000) {
        return `₹${(value / 1000000).toFixed(1)}M`;
      }
      if (value >= 1000) {
        return `₹${(value / 1000).toFixed(0)}K`;
      }
      return `₹${value.toLocaleString()}`;
    }
    return value;
  };

  const renderChart = () => {
    if (!data || data.length === 0) {
      return (
        <div className="h-64 flex items-center justify-center text-muted-foreground">
          No data available
        </div>
      );
    }

    switch (type) {
      case "line":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="name" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickFormatter={formatValue}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                }}
                formatter={(value: any) => [formatValue(value), 'Value']}
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: "hsl(var(--primary))", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case "bar":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="name" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickFormatter={formatValue}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                }}
                formatter={(value: any) => [formatValue(value), 'Value']}
              />
              <Bar 
                dataKey="value" 
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        );

      case "pie":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: any) => [formatValue(value), 'Value']} />
            </PieChart>
          </ResponsiveContainer>
        );

      case "table":
        return (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {Object.keys(data[0] || {}).map((key) => (
                    <th key={key} className="text-left p-2 font-medium">
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, index) => (
                  <tr key={index} className="border-b border-border/50">
                    {Object.values(row).map((value: any, i) => (
                      <td key={i} className="p-2">
                        {typeof value === 'number' ? formatValue(value) : String(value)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      default:
        return (
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            Unsupported chart type
          </div>
        );
    }
  };

  return (
    <Card className="w-full">
      {showTitle && (
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{title}</CardTitle>
            {onExpand && (
              <Button 
                size="sm" 
                variant="ghost"
                onClick={onExpand}
                data-testid="button-expand-chart"
              >
                <ExpandIcon className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
      )}
      <CardContent className={showTitle ? "pt-2" : "p-6"}>
        {renderChart()}
        {showTitle && (
          <div className="mt-3 text-sm text-muted-foreground">
            Last updated 2 minutes ago
          </div>
        )}
      </CardContent>
    </Card>
  );
}
