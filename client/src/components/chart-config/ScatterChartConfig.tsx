import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ScatterChartConfigProps {
  config: Record<string, any>;
  onChange: (config: Record<string, any>) => void;
}

export function ScatterChartConfig({ config, onChange }: ScatterChartConfigProps) {
  const updateConfig = (key: string, value: any) => {
    onChange({ ...config, [key]: value });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="xAxis">X-Axis</Label>
        <Input
          id="xAxis"
          placeholder="e.g., column_name"
          value={config.xAxis || ""}
          onChange={(e) => updateConfig("xAxis", e.target.value)}
          data-testid="input-xaxis"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="yAxis">Y-Axis</Label>
        <Input
          id="yAxis"
          placeholder="e.g., column_name"
          value={config.yAxis || ""}
          onChange={(e) => updateConfig("yAxis", e.target.value)}
          data-testid="input-yaxis"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="size">Size (Optional)</Label>
        <Input
          id="size"
          placeholder="e.g., column_name for bubble size"
          value={config.size || ""}
          onChange={(e) => updateConfig("size", e.target.value)}
          data-testid="input-size"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="color">Color By (Optional)</Label>
        <Input
          id="color"
          placeholder="e.g., category column"
          value={config.color || ""}
          onChange={(e) => updateConfig("color", e.target.value)}
          data-testid="input-color"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="limit">Point Limit</Label>
        <Input
          id="limit"
          type="number"
          placeholder="e.g., 1000"
          value={config.limit || ""}
          onChange={(e) => updateConfig("limit", e.target.value)}
          data-testid="input-limit"
        />
      </div>
    </div>
  );
}
