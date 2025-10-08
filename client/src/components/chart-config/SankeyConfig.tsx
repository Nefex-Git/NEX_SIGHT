import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SankeyConfigProps {
  config: Record<string, any>;
  onChange: (config: Record<string, any>) => void;
  columns?: string[];
}

export function SankeyConfig({ config, onChange, columns = [] }: SankeyConfigProps) {
  const updateConfig = (key: string, value: any) => {
    onChange({ ...config, [key]: value });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="source">Source Column</Label>
        {columns.length > 0 ? (
          <Select
            value={config.source || ""}
            onValueChange={(value) => updateConfig("source", value)}
          >
            <SelectTrigger id="source" data-testid="select-source">
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
            id="source"
            placeholder="Select a dataset first"
            value={config.source || ""}
            onChange={(e) => updateConfig("source", e.target.value)}
            data-testid="input-source"
            disabled
          />
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="target">Target Column</Label>
        {columns.length > 0 ? (
          <Select
            value={config.target || ""}
            onValueChange={(value) => updateConfig("target", value)}
          >
            <SelectTrigger id="target" data-testid="select-target">
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
            id="target"
            placeholder="Select a dataset first"
            value={config.target || ""}
            onChange={(e) => updateConfig("target", e.target.value)}
            data-testid="input-target"
            disabled
          />
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="value">Value Metric</Label>
        {columns.length > 0 ? (
          <Select
            value={config.value || ""}
            onValueChange={(value) => updateConfig("value", value)}
          >
            <SelectTrigger id="value" data-testid="select-value">
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
            id="value"
            placeholder="Select a dataset first"
            value={config.value || ""}
            onChange={(e) => updateConfig("value", e.target.value)}
            data-testid="input-value"
            disabled
          />
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="nodeAlign">Node Alignment</Label>
        <Input
          id="nodeAlign"
          placeholder="left, right, center, justify"
          value={config.nodeAlign || "justify"}
          onChange={(e) => updateConfig("nodeAlign", e.target.value)}
          data-testid="input-node-align"
        />
      </div>
    </div>
  );
}
