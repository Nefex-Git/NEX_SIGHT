import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MapConfigProps {
  config: Record<string, any>;
  onChange: (config: Record<string, any>) => void;
}

export function MapConfig({ config, onChange }: MapConfigProps) {
  const updateConfig = (key: string, value: any) => {
    onChange({ ...config, [key]: value });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="location">Location Column</Label>
        <Input
          id="location"
          placeholder="e.g., country_code, state, city"
          value={config.location || ""}
          onChange={(e) => updateConfig("location", e.target.value)}
          data-testid="input-location"
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
        <Label htmlFor="mapType">Map Type</Label>
        <Select
          value={config.mapType || "country"}
          onValueChange={(value) => updateConfig("mapType", value)}
        >
          <SelectTrigger id="mapType" data-testid="select-map-type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="country">Country</SelectItem>
            <SelectItem value="us_state">US State</SelectItem>
            <SelectItem value="world">World</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="colorScheme">Color Scheme</Label>
        <Select
          value={config.colorScheme || "sequential"}
          onValueChange={(value) => updateConfig("colorScheme", value)}
        >
          <SelectTrigger id="colorScheme" data-testid="select-color-scheme">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sequential">Sequential</SelectItem>
            <SelectItem value="diverging">Diverging</SelectItem>
            <SelectItem value="categorical">Categorical</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
