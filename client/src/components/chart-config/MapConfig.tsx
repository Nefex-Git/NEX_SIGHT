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
  columns?: string[];
}

export function MapConfig({ config, onChange, columns = [] }: MapConfigProps) {
  const updateConfig = (key: string, value: any) => {
    onChange({ ...config, [key]: value });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="location">Location Column</Label>
        {columns.length > 0 ? (
          <Select
            value={config.location || ""}
            onValueChange={(value) => updateConfig("location", value)}
          >
            <SelectTrigger id="location" data-testid="select-location">
              <SelectValue placeholder="Select a column" />
            </SelectTrigger>
            <SelectContent>
              {columns.map((col) => (
                <SelectItem key={col} value={col}>
                  {col}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            id="location"
            placeholder="Select a dataset first"
            value={config.location || ""}
            onChange={(e) => updateConfig("location", e.target.value)}
            data-testid="input-location"
            disabled
          />
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="metric">Value Metric</Label>
        {columns.length > 0 ? (
          <Select
            value={config.metric || ""}
            onValueChange={(value) => updateConfig("metric", value)}
          >
            <SelectTrigger id="metric" data-testid="select-metric">
              <SelectValue placeholder="Select a column" />
            </SelectTrigger>
            <SelectContent>
              {columns.map((col) => (
                <SelectItem key={col} value={col}>
                  {col}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            id="metric"
            placeholder="Select a dataset first"
            value={config.metric || ""}
            onChange={(e) => updateConfig("metric", e.target.value)}
            data-testid="input-metric"
            disabled
          />
        )}
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
