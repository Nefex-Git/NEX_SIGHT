import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface HeatmapCell {
  x: string;
  y: string;
  value: number;
}

interface HeatmapProps {
  data: any[];
  title?: string;
  xKey?: string;
  yKey?: string;
  valueKey?: string;
}

export function Heatmap({ data, title, xKey, yKey, valueKey }: HeatmapProps) {
  if (!data || data.length === 0) {
    return <div className="text-muted-foreground">No data available</div>;
  }

  // Auto-detect keys if not provided
  const keys = Object.keys(data[0]);
  const detectedXKey = xKey || keys[0];
  const detectedYKey = yKey || keys[1];
  const detectedValueKey = valueKey || keys[2] || keys[1];

  // Extract unique x and y values
  const xValues = Array.from(new Set(data.map(d => d[detectedXKey])));
  const yValues = Array.from(new Set(data.map(d => d[detectedYKey])));

  // Create a map for quick lookup
  const valueMap = new Map<string, number>();
  data.forEach(d => {
    const key = `${d[detectedXKey]}-${d[detectedYKey]}`;
    valueMap.set(key, Number(d[detectedValueKey]) || 0);
  });

  // Find min and max values for color scaling
  const allValues = Array.from(valueMap.values());
  const minValue = Math.min(...allValues);
  const maxValue = Math.max(...allValues);

  // Color scale function
  const getColor = (value: number): string => {
    if (maxValue === minValue) return '#60a5fa'; // Blue-400
    
    const normalized = (value - minValue) / (maxValue - minValue);
    
    // Color gradient from light blue to dark blue
    const colors = [
      '#eff6ff', // Blue-50
      '#dbeafe', // Blue-100
      '#bfdbfe', // Blue-200
      '#93c5fd', // Blue-300
      '#60a5fa', // Blue-400
      '#3b82f6', // Blue-500
      '#2563eb', // Blue-600
      '#1d4ed8', // Blue-700
      '#1e40af', // Blue-800
      '#1e3a8a', // Blue-900
    ];
    
    const index = Math.floor(normalized * (colors.length - 1));
    return colors[index];
  };

  // Determine if text should be light or dark based on background
  const getTextColor = (value: number): string => {
    if (maxValue === minValue) return 'text-white';
    const normalized = (value - minValue) / (maxValue - minValue);
    return normalized > 0.5 ? 'text-white' : 'text-gray-900';
  };

  return (
    <div className="w-full overflow-auto">
      {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}
      
      <div className="inline-block min-w-full">
        <table className="border-collapse">
          <thead>
            <tr>
              <th className="p-2 text-sm font-medium text-muted-foreground border border-border bg-muted/50">
                {detectedYKey} / {detectedXKey}
              </th>
              {xValues.map((xVal) => (
                <th
                  key={xVal}
                  className="p-2 text-sm font-medium text-foreground border border-border bg-muted/50 min-w-[100px]"
                >
                  {String(xVal)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {yValues.map((yVal) => (
              <tr key={yVal}>
                <td className="p-2 text-sm font-medium text-foreground border border-border bg-muted/50 whitespace-nowrap">
                  {String(yVal)}
                </td>
                {xValues.map((xVal) => {
                  const key = `${xVal}-${yVal}`;
                  const value = valueMap.get(key) || 0;
                  const bgColor = getColor(value);
                  const textColor = getTextColor(value);
                  
                  return (
                    <td
                      key={key}
                      className={cn(
                        "p-3 text-center border border-border transition-all hover:ring-2 hover:ring-primary/50",
                        textColor
                      )}
                      style={{ backgroundColor: bgColor }}
                      data-testid={`heatmap-cell-${xVal}-${yVal}`}
                    >
                      <div className="font-semibold">{value}</div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Legend */}
      <div className="mt-4 flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Low</span>
        <div className="flex h-4 rounded overflow-hidden" style={{ width: '200px' }}>
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => {
            const value = minValue + ((maxValue - minValue) * i / 9);
            return (
              <div
                key={i}
                style={{ 
                  backgroundColor: getColor(value),
                  flex: 1
                }}
              />
            );
          })}
        </div>
        <span className="text-sm text-muted-foreground">High</span>
        <span className="ml-2 text-sm text-muted-foreground">
          ({minValue} - {maxValue})
        </span>
      </div>
    </div>
  );
}
