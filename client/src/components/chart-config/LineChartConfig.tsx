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
}

export function LineChartConfig({ config, onChange }: LineChartConfigProps) {
  const updateConfig = (key: string, value: any) => {
    onChange({ ...config, [key]: value });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="xAxis">X-Axis (Time/Category)</Label>
        <Input
          id="xAxis"
          placeholder="e.g., date, month, category"
          value={config.xAxis || ""}
          onChange={(e) => updateConfig("xAxis", e.target.value)}
          data-testid="input-x-axis"
        />
        <p className="text-xs text-muted-foreground">
          Column for time series or categories
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="yAxis">Y-Axis (Value)</Label>
        <Input
          id="yAxis"
          placeholder="e.g., SUM(sales), COUNT(*)"
          value={config.yAxis || ""}
          onChange={(e) => updateConfig("yAxis", e.target.value)}
          data-testid="input-y-axis"
        />
        <p className="text-xs text-muted-foreground">
          Metric to plot over time
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="groupBy">Group By (Optional)</Label>
        <Input
          id="groupBy"
          placeholder="e.g., category, region"
          value={config.groupBy || ""}
          onChange={(e) => updateConfig("groupBy", e.target.value)}
          data-testid="input-group-by"
        />
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
    </div>
  );
}
