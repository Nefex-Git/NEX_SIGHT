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
}

export function BarChartConfig({ config, onChange }: BarChartConfigProps) {
  const updateConfig = (key: string, value: any) => {
    onChange({ ...config, [key]: value });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="xAxis">X-Axis (Category)</Label>
        <Input
          id="xAxis"
          placeholder="e.g., product_name, category"
          value={config.xAxis || ""}
          onChange={(e) => updateConfig("xAxis", e.target.value)}
          data-testid="input-x-axis"
        />
        <p className="text-xs text-muted-foreground">
          Column to use for categories
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="yAxis">Y-Axis (Value)</Label>
        <Input
          id="yAxis"
          placeholder="e.g., SUM(revenue), COUNT(*)"
          value={config.yAxis || ""}
          onChange={(e) => updateConfig("yAxis", e.target.value)}
          data-testid="input-y-axis"
        />
        <p className="text-xs text-muted-foreground">
          Metric or column to measure
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
