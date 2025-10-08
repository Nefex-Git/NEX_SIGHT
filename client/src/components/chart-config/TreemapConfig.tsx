import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TreemapConfigProps {
  config: Record<string, any>;
  onChange: (config: Record<string, any>) => void;
  columns?: string[];
}

export function TreemapConfig({ config, onChange, columns = [] }: TreemapConfigProps) {
  const updateConfig = (key: string, value: any) => {
    onChange({ ...config, [key]: value });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        {columns.length > 0 ? (
          <Select
            value={config.category || ""}
            onValueChange={(value) => updateConfig("category", value)}
          >
            <SelectTrigger id="category" data-testid="select-category">
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
        <Label htmlFor="subcategory">Subcategory (Optional)</Label>
        {columns.length > 0 ? (
          <Select
            value={config.subcategory || ""}
            onValueChange={(value) => updateConfig("subcategory", value)}
          >
            <SelectTrigger id="subcategory" data-testid="select-subcategory">
              <SelectValue placeholder="Select a column" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">None</SelectItem>
              {columns.map((col) => (
                <SelectItem key={col} value={col}>
                  {col}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            id="subcategory"
            placeholder="Select a dataset first"
            value={config.subcategory || ""}
            onChange={(e) => updateConfig("subcategory", e.target.value)}
            data-testid="input-subcategory"
            disabled
          />
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="metric">Size Metric</Label>
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
        <Label htmlFor="colorMetric">Color Metric (Optional)</Label>
        {columns.length > 0 ? (
          <Select
            value={config.colorMetric || ""}
            onValueChange={(value) => updateConfig("colorMetric", value)}
          >
            <SelectTrigger id="colorMetric" data-testid="select-color-metric">
              <SelectValue placeholder="Select a column" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">None</SelectItem>
              {columns.map((col) => (
                <SelectItem key={col} value={col}>
                  {col}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            id="colorMetric"
            placeholder="Select a dataset first"
            value={config.colorMetric || ""}
            onChange={(e) => updateConfig("colorMetric", e.target.value)}
            data-testid="input-color-metric"
            disabled
          />
        )}
      </div>
    </div>
  );
}
