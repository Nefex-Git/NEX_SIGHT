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

interface LineChartConfigProps {
  config: Record<string, any>;
  onChange: (config: Record<string, any>) => void;
  columns?: string[];
}

export function LineChartConfig({ config, onChange, columns = [] }: LineChartConfigProps) {
  const updateConfig = (key: string, value: any) => {
    onChange({ ...config, [key]: value });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="xAxis">X-Axis (Time/Category)</Label>
        {columns.length > 0 ? (
          <Select
            value={config.xAxis || ""}
            onValueChange={(value) => updateConfig("xAxis", value)}
          >
            <SelectTrigger id="xAxis" data-testid="select-x-axis">
              <SelectValue placeholder="Select time/category column" />
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
          Column for time series or categories
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
          Metric to plot over time
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="groupBy">Group By (Optional)</Label>
        {columns.length > 0 ? (
          <Select
            value={config.groupBy || ""}
            onValueChange={(value) => updateConfig("groupBy", value)}
          >
            <SelectTrigger id="groupBy" data-testid="select-group-by">
              <SelectValue placeholder="Select group column (optional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">None</SelectItem>
              {columns.filter(col => col && col.trim()).map((col) => (
                <SelectItem key={col} value={col}>
                  {col}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            id="groupBy"
            placeholder="Select a dataset first"
            value={config.groupBy || ""}
            disabled
            data-testid="input-group-by"
          />
        )}
        <p className="text-xs text-muted-foreground">
          Create multiple lines by grouping
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="lineStyle">Line Style</Label>
        <Select
          value={config.lineStyle || "linear"}
          onValueChange={(value) => updateConfig("lineStyle", value)}
        >
          <SelectTrigger id="lineStyle" data-testid="select-line-style">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="linear">Linear</SelectItem>
            <SelectItem value="smooth">Smooth</SelectItem>
            <SelectItem value="step">Step</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="showDataPoints">Show Data Points</Label>
          <p className="text-xs text-muted-foreground">
            Display markers at each data point
          </p>
        </div>
        <Switch
          id="showDataPoints"
          checked={config.showDataPoints || false}
          onCheckedChange={(checked) => updateConfig("showDataPoints", checked)}
          data-testid="switch-show-data-points"
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="showArea">Fill Area</Label>
          <p className="text-xs text-muted-foreground">
            Fill area under the line
          </p>
        </div>
        <Switch
          id="showArea"
          checked={config.showArea || false}
          onCheckedChange={(checked) => updateConfig("showArea", checked)}
          data-testid="switch-show-area"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="labelDisplay">Label Display</Label>
        <Select
          value={config.labelDisplay || "hover"}
          onValueChange={(value) => updateConfig("labelDisplay", value)}
        >
          <SelectTrigger id="labelDisplay" data-testid="select-label-display">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Hidden</SelectItem>
            <SelectItem value="hover">Show on Hover</SelectItem>
            <SelectItem value="always">Always Visible</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          How to display data labels
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
            <SelectItem value="abbreviated">Abbreviated (K, M, B)</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          How to format displayed values
        </p>
      </div>
    </div>
  );
}
