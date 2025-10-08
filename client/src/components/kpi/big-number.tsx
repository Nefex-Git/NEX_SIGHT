import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface BigNumberProps {
  title: string;
  value: string | number;
  prefix?: string;
  suffix?: string;
  subheader?: string;
  previousValue?: string | number;
  showComparison?: boolean;
  comparisonType?: 'percentage' | 'absolute';
  colorThresholds?: {
    good?: number;
    warning?: number;
    bad?: number;
  };
  format?: 'number' | 'currency' | 'percentage';
  showTrend?: boolean;
}

export function BigNumber({
  title,
  value,
  prefix = '',
  suffix = '',
  subheader,
  previousValue,
  showComparison = false,
  comparisonType = 'percentage',
  colorThresholds,
  format = 'number',
  showTrend = true,
}: BigNumberProps) {
  
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

  const calculateChange = (): { value: number; display: string; trend: 'up' | 'down' | 'neutral' } => {
    if (!previousValue) return { value: 0, display: '0', trend: 'neutral' };
    
    const current = typeof value === 'string' ? parseFloat(value) : value;
    const previous = typeof previousValue === 'string' ? parseFloat(previousValue) : previousValue;
    
    if (isNaN(current) || isNaN(previous) || previous === 0) {
      return { value: 0, display: '0', trend: 'neutral' };
    }
    
    const diff = current - previous;
    
    if (comparisonType === 'percentage') {
      const percentChange = (diff / previous) * 100;
      return {
        value: percentChange,
        display: `${percentChange >= 0 ? '+' : ''}${percentChange.toFixed(1)}%`,
        trend: percentChange > 0 ? 'up' : percentChange < 0 ? 'down' : 'neutral'
      };
    } else {
      return {
        value: diff,
        display: `${diff >= 0 ? '+' : ''}${formatValue(diff)}`,
        trend: diff > 0 ? 'up' : diff < 0 ? 'down' : 'neutral'
      };
    }
  };

  const getColorClass = (): string => {
    if (!colorThresholds) return 'text-foreground';
    
    const numVal = typeof value === 'string' ? parseFloat(value) : value;
    
    if (isNaN(numVal)) return 'text-foreground';
    
    if (colorThresholds.good && numVal >= colorThresholds.good) {
      return 'text-green-600 dark:text-green-400';
    }
    if (colorThresholds.bad && numVal <= colorThresholds.bad) {
      return 'text-red-600 dark:text-red-400';
    }
    if (colorThresholds.warning) {
      return 'text-amber-600 dark:text-amber-400';
    }
    
    return 'text-foreground';
  };

  const change = showComparison ? calculateChange() : null;
  const colorClass = getColorClass();

  return (
    <Card className="w-full" data-testid="kpi-big-number">
      <CardHeader className="pb-1">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 p-4 pt-0">
        <div className={cn("text-4xl font-bold", colorClass)} data-testid="kpi-value">
          {prefix}{formatValue(value)}{suffix}
        </div>
        
        {(subheader || showComparison) && (
          <div className="flex items-center gap-2 text-sm">
            {showComparison && change && showTrend && (
              <div className={cn(
                "flex items-center gap-1",
                change.trend === 'up' ? 'text-green-600 dark:text-green-400' :
                change.trend === 'down' ? 'text-red-600 dark:text-red-400' :
                'text-muted-foreground'
              )} data-testid="kpi-comparison">
                {change.trend === 'up' && <TrendingUp className="h-4 w-4" />}
                {change.trend === 'down' && <TrendingDown className="h-4 w-4" />}
                {change.trend === 'neutral' && <Minus className="h-4 w-4" />}
                <span>{change.display}</span>
              </div>
            )}
            {subheader && (
              <span className="text-muted-foreground" data-testid="kpi-subheader">
                {subheader}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
