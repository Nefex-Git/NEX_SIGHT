import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ScatterChartConfigProps {
  config: Record<string, any>;
  onChange: (config: Record<string, any>) => void;
  columns?: string[];
}

export function ScatterChartConfig({ config, onChange, columns = [] }: ScatterChartConfigProps) {
  const updateConfig = (key: string, value: any) => {
    onChange({ ...config, [key]: value });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="xAxis">X-Axis</Label>
        {columns.length > 0 ? (
          <Select
            value={config.xAxis || ""}
            onValueChange={(value) => updateConfig("xAxis", value)}
          >
            <SelectTrigger id="xAxis" data-testid="select-xaxis">
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
            id="xAxis"
            placeholder="Select a dataset first"
            value={config.xAxis || ""}
            onChange={(e) => updateConfig("xAxis", e.target.value)}
            data-testid="input-xaxis"
            disabled
          />
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="yAxis">Y-Axis</Label>
        {columns.length > 0 ? (
          <Select
            value={config.yAxis || ""}
            onValueChange={(value) => updateConfig("yAxis", value)}
          >
            <SelectTrigger id="yAxis" data-testid="select-yaxis">
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
            id="yAxis"
            placeholder="Select a dataset first"
            value={config.yAxis || ""}
            onChange={(e) => updateConfig("yAxis", e.target.value)}
            data-testid="input-yaxis"
            disabled
          />
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="size">Size (Optional)</Label>
        {columns.length > 0 ? (
          <Select
            value={config.size || ""}
            onValueChange={(value) => updateConfig("size", value)}
          >
            <SelectTrigger id="size" data-testid="select-size">
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
            id="size"
            placeholder="Select a dataset first"
            value={config.size || ""}
            onChange={(e) => updateConfig("size", e.target.value)}
            data-testid="input-size"
            disabled
          />
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="color">Color By (Optional)</Label>
        {columns.length > 0 ? (
          <Select
            value={config.color || ""}
            onValueChange={(value) => updateConfig("color", value)}
          >
            <SelectTrigger id="color" data-testid="select-color">
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
            id="color"
            placeholder="Select a dataset first"
            value={config.color || ""}
            onChange={(e) => updateConfig("color", e.target.value)}
            data-testid="input-color"
            disabled
          />
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="limit">Point Limit</Label>
        <Input
          id="limit"
          type="number"
          placeholder="e.g., 1000"
          value={config.limit || ""}
          onChange={(e) => updateConfig("limit", e.target.value)}
          data-testid="input-limit"
        />
      </div>
    </div>
  );
}
