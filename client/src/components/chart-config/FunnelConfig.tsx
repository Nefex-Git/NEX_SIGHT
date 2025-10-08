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
}

export function FunnelConfig({ config, onChange }: FunnelConfigProps) {
  const updateConfig = (key: string, value: any) => {
    onChange({ ...config, [key]: value });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="stage">Stage Column</Label>
        <Input
          id="stage"
          placeholder="e.g., funnel_stage, step"
          value={config.stage || ""}
          onChange={(e) => updateConfig("stage", e.target.value)}
          data-testid="input-stage"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="metric">Value Metric</Label>
        <Input
          id="metric"
          placeholder="e.g., COUNT(*), SUM(users)"
          value={config.metric || ""}
          onChange={(e) => updateConfig("metric", e.target.value)}
          data-testid="input-metric"
        />
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
