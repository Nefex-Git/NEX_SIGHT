import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface WaterfallConfigProps {
  config: Record<string, any>;
  onChange: (config: Record<string, any>) => void;
  columns?: string[];
}

export function WaterfallConfig({ config, onChange, columns = [] }: WaterfallConfigProps) {
  const updateConfig = (key: string, value: any) => {
    onChange({ ...config, [key]: value });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="category">Category (Steps)</Label>
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
        <Label htmlFor="sortOrder">Sort Order</Label>
        <Select
          value={config.sortOrder || "none"}
          onValueChange={(value) => updateConfig("sortOrder", value)}
        >
          <SelectTrigger id="sortOrder" data-testid="select-sort-order">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            <SelectItem value="asc">Ascending</SelectItem>
            <SelectItem value="desc">Descending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="totalLabel">Total Label</Label>
        <Input
          id="totalLabel"
          placeholder="e.g., Total, Final"
          value={config.totalLabel || "Total"}
          onChange={(e) => updateConfig("totalLabel", e.target.value)}
          data-testid="input-total-label"
        />
      </div>
    </div>
  );
}
