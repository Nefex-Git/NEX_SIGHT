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
  columns?: string[];
}

export function PieChartConfig({ config, onChange, columns = [] }: PieChartConfigProps) {
  const updateConfig = (key: string, value: any) => {
    onChange({ ...config, [key]: value });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="category">Category Field</Label>
        {columns.length > 0 ? (
          <Select
            value={config.category || ""}
            onValueChange={(value) => updateConfig("category", value)}
          >
            <SelectTrigger id="category" data-testid="select-category">
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
            id="category"
            placeholder="Select a dataset first"
            value={config.category || ""}
            disabled
            data-testid="input-category"
          />
        )}
        <p className="text-xs text-muted-foreground">
          Column for slice labels
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="value">Value Field</Label>
        {columns.length > 0 ? (
          <Select
            value={config.value || ""}
            onValueChange={(value) => updateConfig("value", value)}
          >
            <SelectTrigger id="value" data-testid="select-value">
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
            id="value"
            placeholder="Select a dataset first"
            value={config.value || ""}
            disabled
            data-testid="input-value"
          />
        )}
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

      <div className="space-y-2">
        <Label htmlFor="labelDisplay">Label Position</Label>
        <Select
          value={config.labelDisplay || "outside"}
          onValueChange={(value) => updateConfig("labelDisplay", value)}
        >
          <SelectTrigger id="labelDisplay" data-testid="select-label-display">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="outside">Outside Slices</SelectItem>
            <SelectItem value="inside">Inside Slices</SelectItem>
            <SelectItem value="hover">Show on Hover Only</SelectItem>
            <SelectItem value="none">Hidden</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Where to display slice labels
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="valueFormat">Value Format</Label>
        <Select
          value={config.valueFormat || "value"}
          onValueChange={(value) => updateConfig("valueFormat", value)}
        >
          <SelectTrigger id="valueFormat" data-testid="select-value-format">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="value">Actual Values</SelectItem>
            <SelectItem value="percentage">Percentages Only</SelectItem>
            <SelectItem value="both">Values & Percentages</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          How to format displayed values
        </p>
      </div>
    </div>
  );
}
