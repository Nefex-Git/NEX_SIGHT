import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface HeatmapConfigProps {
  config: Record<string, any>;
  onChange: (config: Record<string, any>) => void;
}

export function HeatmapConfig({ config, onChange }: HeatmapConfigProps) {
  const updateConfig = (key: string, value: any) => {
    onChange({ ...config, [key]: value });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="xAxis">X-Axis (Categories)</Label>
        <Input
          id="xAxis"
          placeholder="e.g., month, region"
          value={config.xAxis || ""}
          onChange={(e) => updateConfig("xAxis", e.target.value)}
          data-testid="input-xaxis"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="yAxis">Y-Axis (Categories)</Label>
        <Input
          id="yAxis"
          placeholder="e.g., product, category"
          value={config.yAxis || ""}
          onChange={(e) => updateConfig("yAxis", e.target.value)}
          data-testid="input-yaxis"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="metric">Value Metric</Label>
        <Input
          id="metric"
          placeholder="e.g., SUM(sales), COUNT(*)"
          value={config.metric || ""}
          onChange={(e) => updateConfig("metric", e.target.value)}
          data-testid="input-metric"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="colorScheme">Color Scheme</Label>
        <Select
          value={config.colorScheme || "blues"}
          onValueChange={(value) => updateConfig("colorScheme", value)}
        >
          <SelectTrigger id="colorScheme" data-testid="select-color-scheme">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="blues">Blues</SelectItem>
            <SelectItem value="greens">Greens</SelectItem>
            <SelectItem value="reds">Reds</SelectItem>
            <SelectItem value="rainbow">Rainbow</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
