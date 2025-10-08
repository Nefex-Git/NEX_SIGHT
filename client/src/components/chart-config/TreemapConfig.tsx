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
}

export function TreemapConfig({ config, onChange }: TreemapConfigProps) {
  const updateConfig = (key: string, value: any) => {
    onChange({ ...config, [key]: value });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <Input
          id="category"
          placeholder="e.g., department, region"
          value={config.category || ""}
          onChange={(e) => updateConfig("category", e.target.value)}
          data-testid="input-category"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="subcategory">Subcategory (Optional)</Label>
        <Input
          id="subcategory"
          placeholder="e.g., product, team"
          value={config.subcategory || ""}
          onChange={(e) => updateConfig("subcategory", e.target.value)}
          data-testid="input-subcategory"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="metric">Size Metric</Label>
        <Input
          id="metric"
          placeholder="e.g., SUM(revenue), COUNT(*)"
          value={config.metric || ""}
          onChange={(e) => updateConfig("metric", e.target.value)}
          data-testid="input-metric"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="colorMetric">Color Metric (Optional)</Label>
        <Input
          id="colorMetric"
          placeholder="e.g., AVG(profit_margin)"
          value={config.colorMetric || ""}
          onChange={(e) => updateConfig("colorMetric", e.target.value)}
          data-testid="input-color-metric"
        />
      </div>
    </div>
  );
}
