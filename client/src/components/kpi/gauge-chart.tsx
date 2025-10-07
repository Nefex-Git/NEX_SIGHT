import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface GaugeChartProps {
  title: string;
  value: number;
  target: number;
  min?: number;
  max?: number;
  unit?: string;
  showPercentage?: boolean;
  thresholds?: {
    good: number; // percentage of target
    warning: number; // percentage of target
  };
}

export function GaugeChart({
  title,
  value,
  target,
  min = 0,
  max,
  unit = '',
  showPercentage = true,
  thresholds = { good: 80, warning: 50 },
}: GaugeChartProps) {
  
  const maxValue = max || target * 1.2; // Default max is 120% of target
  const percentage = Math.min((value / target) * 100, 100);
  const progressAngle = (percentage / 100) * 180; // Semi-circle (180 degrees)
  
  const getColor = (): string => {
    if (percentage >= thresholds.good) {
      return '#10b981'; // Green
    } else if (percentage >= thresholds.warning) {
      return '#f59e0b'; // Amber
    } else {
      return '#ef4444'; // Red
    }
  };

  const color = getColor();
  
  // SVG path for gauge arc
  const radius = 80;
  const strokeWidth = 12;
  const center = 100;
  const circumference = Math.PI * radius;
  
  const backgroundArc = `
    M ${center - radius} ${center}
    A ${radius} ${radius} 0 0 1 ${center + radius} ${center}
  `;
  
  const progressArcLength = (progressAngle / 180) * circumference;
  
  return (
    <Card className="w-full" data-testid="kpi-gauge-chart">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-4">
        {/* SVG Gauge */}
        <div className="relative" style={{ width: 200, height: 120 }}>
          <svg width="200" height="120" viewBox="0 0 200 120">
            {/* Background arc */}
            <path
              d={backgroundArc}
              fill="none"
              stroke="#e5e7eb"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
            
            {/* Progress arc */}
            <path
              d={backgroundArc}
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={`${progressArcLength} ${circumference}`}
              style={{ transition: 'stroke-dasharray 0.3s ease' }}
            />
            
            {/* Center value */}
            <text
              x="100"
              y="85"
              textAnchor="middle"
              className="text-3xl font-bold fill-current"
              data-testid="gauge-value"
            >
              {value.toLocaleString()}{unit}
            </text>
            
            {showPercentage && (
              <text
                x="100"
                y="105"
                textAnchor="middle"
                className="text-sm fill-muted-foreground"
                data-testid="gauge-percentage"
              >
                {percentage.toFixed(0)}% of target
              </text>
            )}
          </svg>
        </div>
        
        {/* Target information */}
        <div className="flex items-center justify-between w-full text-sm">
          <div className="text-muted-foreground">
            <span className="font-medium">Target:</span> {target.toLocaleString()}{unit}
          </div>
          <div className={cn(
            "font-medium",
            percentage >= thresholds.good ? 'text-green-600 dark:text-green-400' :
            percentage >= thresholds.warning ? 'text-amber-600 dark:text-amber-400' :
            'text-red-600 dark:text-red-400'
          )} data-testid="gauge-status">
            {percentage >= thresholds.good ? 'On Track' :
             percentage >= thresholds.warning ? 'At Risk' :
             'Below Target'}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
