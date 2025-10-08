import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FunnelConfigProps {
  config: Record<string, any>;
  onChange: (config: Record<string, any>) => void;
  columns?: string[];
}

export function FunnelConfig({ config, onChange, columns = [] }: FunnelConfigProps) {
  const updateConfig = (key: string, value: any) => {
    onChange({ ...config, [key]: value });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="stage">Stage Column</Label>
        {columns.length > 0 ? (
          <Select
            value={config.stage || ""}
            onValueChange={(value) => updateConfig("stage", value)}
          >
            <SelectTrigger id="stage" data-testid="select-stage">
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
            id="stage"
            placeholder="Select a dataset first"
            value={config.stage || ""}
            onChange={(e) => updateConfig("stage", e.target.value)}
            data-testid="input-stage"
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
        <Label htmlFor="orientation">Orientation</Label>
        <Select
          value={config.orientation || "vertical"}
          onValueChange={(value) => updateConfig("orientation", value)}
        >
          <SelectTrigger id="orientation" data-testid="select-orientation">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="vertical">Vertical</SelectItem>
            <SelectItem value="horizontal">Horizontal</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="labelPosition">Label Position</Label>
        <Select
          value={config.labelPosition || "inside"}
          onValueChange={(value) => updateConfig("labelPosition", value)}
        >
          <SelectTrigger id="labelPosition" data-testid="select-label-position">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="inside">Inside</SelectItem>
            <SelectItem value="outside">Outside</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
