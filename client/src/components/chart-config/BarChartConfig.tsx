import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface BarChartConfigProps {
  config: Record<string, any>;
  onChange: (config: Record<string, any>) => void;
  columns?: string[];
}

export function BarChartConfig({ config, onChange, columns = [] }: BarChartConfigProps) {
  const updateConfig = (key: string, value: any) => {
    onChange({ ...config, [key]: value });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="xAxis">X-Axis (Category)</Label>
        {columns.length > 0 ? (
          <Select
            value={config.xAxis || ""}
            onValueChange={(value) => updateConfig("xAxis", value)}
          >
            <SelectTrigger id="xAxis" data-testid="select-x-axis">
              <SelectValue placeholder="Select category column" />
            </SelectTrigger>
            <SelectContent>
              {columns.filter(col => col && col.trim()).map((col) => (
                <SelectItem key={col} value={col}>
                  {col}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            id="xAxis"
            placeholder="Select a dataset first"
            value={config.xAxis || ""}
            disabled
            data-testid="input-x-axis"
          />
        )}
        <p className="text-xs text-muted-foreground">
          Column to use for categories
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="yAxis">Y-Axis (Value)</Label>
        {columns.length > 0 ? (
          <Select
            value={config.yAxis || ""}
            onValueChange={(value) => updateConfig("yAxis", value)}
          >
            <SelectTrigger id="yAxis" data-testid="select-y-axis">
              <SelectValue placeholder="Select value column" />
            </SelectTrigger>
            <SelectContent>
              {columns.filter(col => col && col.trim()).map((col) => (
                <SelectItem key={col} value={col}>
                  {col}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            id="yAxis"
            placeholder="Select a dataset first"
            value={config.yAxis || ""}
            disabled
            data-testid="input-y-axis"
          />
        )}
        <p className="text-xs text-muted-foreground">
          Column to measure
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="aggregation">Aggregation</Label>
        <Select
          value={config.aggregation || "sum"}
          onValueChange={(value) => updateConfig("aggregation", value)}
        >
          <SelectTrigger id="aggregation" data-testid="select-aggregation">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sum">Sum</SelectItem>
            <SelectItem value="count">Count</SelectItem>
            <SelectItem value="avg">Average</SelectItem>
            <SelectItem value="min">Minimum</SelectItem>
            <SelectItem value="max">Maximum</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="limit">Limit (Top N)</Label>
        <Input
          id="limit"
          type="number"
          min="1"
          max="100"
          placeholder="10"
          value={config.limit || ""}
          onChange={(e) => updateConfig("limit", e.target.value)}
          data-testid="input-limit"
        />
        <p className="text-xs text-muted-foreground">
          Show top N items (leave empty for all)
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="sortOrder">Sort Order</Label>
        <Select
          value={config.sortOrder || "desc"}
          onValueChange={(value) => updateConfig("sortOrder", value)}
        >
          <SelectTrigger id="sortOrder" data-testid="select-sort-order">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="asc">Ascending</SelectItem>
            <SelectItem value="desc">Descending</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
