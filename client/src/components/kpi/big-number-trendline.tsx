import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";

interface TrendData {
  value: number;
  date?: string;
}

interface BigNumberTrendlineProps {
  title: string;
  value: string | number;
  trendData: TrendData[];
  prefix?: string;
  suffix?: string;
  subheader?: string;
  showComparison?: boolean;
  comparisonPeriod?: string;
  format?: 'number' | 'currency' | 'percentage';
  trendColor?: string;
}

export function BigNumberTrendline({
  title,
  value,
  trendData,
  prefix = '',
  suffix = '',
  subheader,
  showComparison = true,
  comparisonPeriod = 'vs. previous period',
  format = 'number',
  trendColor = '#3b82f6',
}: BigNumberTrendlineProps) {
  
  const formatValue = (val: string | number): string => {
    const numVal = typeof val === 'string' ? parseFloat(val) : val;
    
    if (isNaN(numVal)) return String(val);
    
    switch (format) {
      case 'currency':
        return `$${numVal.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
      case 'percentage':
        return `${numVal.toFixed(1)}%`;
      case 'number':
      default:
        if (numVal >= 1000000) {
          return `${(numVal / 1000000).toFixed(1)}M`;
        }
        if (numVal >= 1000) {
          return `${(numVal / 1000).toFixed(1)}K`;
        }
        return numVal.toLocaleString();
    }
  };

  const calculateTrend = (): { percentChange: number; trend: 'up' | 'down' | 'neutral' } => {
    if (!trendData || trendData.length < 2) {
      return { percentChange: 0, trend: 'neutral' };
    }

    const latest = trendData[trendData.length - 1].value;
    const previous = trendData[trendData.length - 2].value;
    
    if (previous === 0) return { percentChange: 0, trend: 'neutral' };
    
    const percentChange = ((latest - previous) / previous) * 100;
    
    return {
      percentChange,
      trend: percentChange > 0 ? 'up' : percentChange < 0 ? 'down' : 'neutral'
    };
  };

  const trend = calculateTrend();

  return (
    <Card className="w-full bg-white dark:bg-white" data-testid="kpi-big-number-trendline">
      <CardHeader className="pb-1">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 p-4 pt-0">
        <div className="text-4xl font-bold" data-testid="kpi-trendline-value">
          {prefix}{formatValue(value)}{suffix}
        </div>
        
        {/* Sparkline Chart */}
        {trendData && trendData.length > 0 && (
          <div className="h-16 -mx-2" data-testid="kpi-sparkline">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={trendColor}
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        
        {/* Comparison */}
        {showComparison && (
          <div className="flex items-center justify-between text-sm">
            <div className={cn(
              "flex items-center gap-1 font-medium",
              trend.trend === 'up' ? 'text-green-600 dark:text-green-400' :
              trend.trend === 'down' ? 'text-red-600 dark:text-red-400' :
              'text-muted-foreground'
            )} data-testid="kpi-trendline-comparison">
              {trend.trend === 'up' && <TrendingUp className="h-4 w-4" />}
              {trend.trend === 'down' && <TrendingDown className="h-4 w-4" />}
              <span>{trend.percentChange >= 0 ? '+' : ''}{trend.percentChange.toFixed(1)}%</span>
            </div>
            {subheader && (
              <span className="text-muted-foreground">{subheader}</span>
            )}
            {!subheader && (
              <span className="text-muted-foreground">{comparisonPeriod}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
