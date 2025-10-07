import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface PieChartConfigProps {
  config: Record<string, any>;
  onChange: (config: Record<string, any>) => void;
}

export function PieChartConfig({ config, onChange }: PieChartConfigProps) {
  const updateConfig = (key: string, value: any) => {
    onChange({ ...config, [key]: value });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="category">Category Field</Label>
        <Input
          id="category"
          placeholder="e.g., product_category, region"
          value={config.category || ""}
          onChange={(e) => updateConfig("category", e.target.value)}
          data-testid="input-category"
        />
        <p className="text-xs text-muted-foreground">
          Column for slice labels
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="value">Value Field</Label>
        <Input
          id="value"
          placeholder="e.g., SUM(sales), COUNT(*)"
          value={config.value || ""}
          onChange={(e) => updateConfig("value", e.target.value)}
          data-testid="input-value"
        />
        <p className="text-xs text-muted-foreground">
          Metric for slice sizes
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="limit">Limit (Top N)</Label>
        <Input
          id="limit"
          type="number"
          min="1"
          max="20"
          placeholder="10"
          value={config.limit || ""}
          onChange={(e) => updateConfig("limit", e.target.value)}
          data-testid="input-limit"
        />
        <p className="text-xs text-muted-foreground">
          Show top N slices (leave empty for all)
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="donutMode">Chart Style</Label>
        <Select
          value={config.donutMode ? "donut" : "pie"}
          onValueChange={(value) => updateConfig("donutMode", value === "donut")}
        >
          <SelectTrigger id="donutMode" data-testid="select-chart-style">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pie">Pie Chart</SelectItem>
            <SelectItem value="donut">Donut Chart</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="showLabels">Show Labels</Label>
          <p className="text-xs text-muted-foreground">
            Display labels on slices
          </p>
        </div>
        <Switch
          id="showLabels"
          checked={config.showLabels !== false}
          onCheckedChange={(checked) => updateConfig("showLabels", checked)}
          data-testid="switch-show-labels"
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="showPercentages">Show Percentages</Label>
          <p className="text-xs text-muted-foreground">
            Display percentage values
          </p>
        </div>
        <Switch
          id="showPercentages"
          checked={config.showPercentages || false}
          onCheckedChange={(checked) => updateConfig("showPercentages", checked)}
          data-testid="switch-show-percentages"
        />
      </div>
    </div>
  );
}
