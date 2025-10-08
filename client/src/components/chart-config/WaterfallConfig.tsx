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
}

export function WaterfallConfig({ config, onChange }: WaterfallConfigProps) {
  const updateConfig = (key: string, value: any) => {
    onChange({ ...config, [key]: value });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="category">Category (Steps)</Label>
        <Input
          id="category"
          placeholder="e.g., month, step_name"
          value={config.category || ""}
          onChange={(e) => updateConfig("category", e.target.value)}
          data-testid="input-category"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="metric">Value Metric</Label>
        <Input
          id="metric"
          placeholder="e.g., SUM(change), value"
          value={config.metric || ""}
          onChange={(e) => updateConfig("metric", e.target.value)}
          data-testid="input-metric"
        />
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
