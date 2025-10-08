import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

interface MultiValueConfigProps {
  config: Record<string, any>;
  onChange: (config: Record<string, any>) => void;
}

export function MultiValueConfig({ config, onChange }: MultiValueConfigProps) {
  const updateConfig = (key: string, value: any) => {
    onChange({ ...config, [key]: value });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="metrics">Metrics (comma-separated)</Label>
        <Input
          id="metrics"
          placeholder="e.g., COUNT(*), SUM(revenue), AVG(rating)"
          value={config.metrics || ""}
          onChange={(e) => updateConfig("metrics", e.target.value)}
          data-testid="input-metrics"
        />
        <p className="text-xs text-muted-foreground">
          Each metric will be displayed as a card
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="labels">Labels (comma-separated)</Label>
        <Input
          id="labels"
          placeholder="e.g., Total Orders, Revenue, Avg Rating"
          value={config.labels || ""}
          onChange={(e) => updateConfig("labels", e.target.value)}
          data-testid="input-labels"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="format">Number Format</Label>
        <Input
          id="format"
          placeholder="e.g., 0,0 or $0,0.00"
          value={config.format || ""}
          onChange={(e) => updateConfig("format", e.target.value)}
          data-testid="input-format"
        />
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="showTrend">Show Trend</Label>
        <Switch
          id="showTrend"
          checked={config.showTrend || false}
          onCheckedChange={(checked) => updateConfig("showTrend", checked)}
          data-testid="switch-show-trend"
        />
      </div>
    </div>
  );
}
