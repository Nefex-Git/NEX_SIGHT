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

interface TableConfigProps {
  config: Record<string, any>;
  onChange: (config: Record<string, any>) => void;
  columns?: string[];
}

export function TableConfig({ config, onChange, columns = [] }: TableConfigProps) {
  const updateConfig = (key: string, value: any) => {
    onChange({ ...config, [key]: value });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="columns">Columns (comma-separated)</Label>
        <Input
          id="columns"
          placeholder="e.g., name, email, revenue"
          value={config.columns || ""}
          onChange={(e) => updateConfig("columns", e.target.value)}
          data-testid="input-columns"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="orderBy">Order By</Label>
        <Input
          id="orderBy"
          placeholder="e.g., revenue DESC"
          value={config.orderBy || ""}
          onChange={(e) => updateConfig("orderBy", e.target.value)}
          data-testid="input-order-by"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="limit">Row Limit</Label>
        <Input
          id="limit"
          type="number"
          placeholder="e.g., 100"
          value={config.limit || ""}
          onChange={(e) => updateConfig("limit", e.target.value)}
          data-testid="input-limit"
        />
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="pagination">Enable Pagination</Label>
        <Switch
          id="pagination"
          checked={config.pagination || false}
          onCheckedChange={(checked) => updateConfig("pagination", checked)}
          data-testid="switch-pagination"
        />
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="search">Enable Search</Label>
        <Switch
          id="search"
          checked={config.search || false}
          onCheckedChange={(checked) => updateConfig("search", checked)}
          data-testid="switch-search"
        />
      </div>
    </div>
  );
}
