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

interface HistogramConfigProps {
  config: Record<string, any>;
  onChange: (config: Record<string, any>) => void;
  columns?: string[];
}

export function HistogramConfig({ config, onChange, columns = [] }: HistogramConfigProps) {
  const updateConfig = (key: string, value: any) => {
    onChange({ ...config, [key]: value });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="column">Data Column</Label>
        {columns.length > 0 ? (
          <Select
            value={config.column || ""}
            onValueChange={(value) => updateConfig("column", value)}
          >
            <SelectTrigger id="column" data-testid="select-column">
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
            id="column"
            placeholder="Select a dataset first"
            value={config.column || ""}
            onChange={(e) => updateConfig("column", e.target.value)}
            data-testid="input-column"
            disabled
          />
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="bins">Number of Bins</Label>
        <Input
          id="bins"
          type="number"
          placeholder="e.g., 20"
          value={config.bins || ""}
          onChange={(e) => updateConfig("bins", e.target.value)}
          data-testid="input-bins"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="binRange">Bin Range (Optional)</Label>
        <Input
          id="binRange"
          placeholder="e.g., 0-100"
          value={config.binRange || ""}
          onChange={(e) => updateConfig("binRange", e.target.value)}
          data-testid="input-bin-range"
        />
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="cumulative">Cumulative</Label>
        <Switch
          id="cumulative"
          checked={config.cumulative || false}
          onCheckedChange={(checked) => updateConfig("cumulative", checked)}
          data-testid="switch-cumulative"
        />
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="normalized">Normalized</Label>
        <Switch
          id="normalized"
          checked={config.normalized || false}
          onCheckedChange={(checked) => updateConfig("normalized", checked)}
          data-testid="switch-normalized"
        />
      </div>
    </div>
  );
}
