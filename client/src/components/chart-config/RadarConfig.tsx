import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

interface RadarConfigProps {
  config: Record<string, any>;
  onChange: (config: Record<string, any>) => void;
}

export function RadarConfig({ config, onChange }: RadarConfigProps) {
  const updateConfig = (key: string, value: any) => {
    onChange({ ...config, [key]: value });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="category">Category (Axes)</Label>
        <Input
          id="category"
          placeholder="e.g., skill, metric"
          value={config.category || ""}
          onChange={(e) => updateConfig("category", e.target.value)}
          data-testid="input-category"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="series">Series (Optional)</Label>
        <Input
          id="series"
          placeholder="e.g., team, person"
          value={config.series || ""}
          onChange={(e) => updateConfig("series", e.target.value)}
          data-testid="input-series"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="metric">Value Metric</Label>
        <Input
          id="metric"
          placeholder="e.g., AVG(score), SUM(value)"
          value={config.metric || ""}
          onChange={(e) => updateConfig("metric", e.target.value)}
          data-testid="input-metric"
        />
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="fillArea">Fill Area</Label>
        <Switch
          id="fillArea"
          checked={config.fillArea !== false}
          onCheckedChange={(checked) => updateConfig("fillArea", checked)}
          data-testid="switch-fill-area"
        />
      </div>
    </div>
  );
}
