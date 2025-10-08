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

interface RadarConfigProps {
  config: Record<string, any>;
  onChange: (config: Record<string, any>) => void;
  columns?: string[];
}

export function RadarConfig({ config, onChange, columns = [] }: RadarConfigProps) {
  const updateConfig = (key: string, value: any) => {
    onChange({ ...config, [key]: value });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="category">Category (Axes)</Label>
        {columns.length > 0 ? (
          <Select
            value={config.category || ""}
            onValueChange={(value) => updateConfig("category", value)}
          >
            <SelectTrigger id="category" data-testid="select-category">
              <SelectValue placeholder="Select a column" />
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
            onChange={(e) => updateConfig("category", e.target.value)}
            data-testid="input-category"
            disabled
          />
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="series">Series (Optional)</Label>
        {columns.length > 0 ? (
          <Select
            value={config.series || ""}
            onValueChange={(value) => updateConfig("series", value)}
          >
            <SelectTrigger id="series" data-testid="select-series">
              <SelectValue placeholder="Select a column" />
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
            id="series"
            placeholder="Select a dataset first"
            value={config.series || ""}
            onChange={(e) => updateConfig("series", e.target.value)}
            data-testid="input-series"
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
              {columns.filter(col => col && col.trim()).map((col) => (
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
