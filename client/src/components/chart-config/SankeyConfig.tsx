import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface SankeyConfigProps {
  config: Record<string, any>;
  onChange: (config: Record<string, any>) => void;
}

export function SankeyConfig({ config, onChange }: SankeyConfigProps) {
  const updateConfig = (key: string, value: any) => {
    onChange({ ...config, [key]: value });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="source">Source Column</Label>
        <Input
          id="source"
          placeholder="e.g., from_state, origin"
          value={config.source || ""}
          onChange={(e) => updateConfig("source", e.target.value)}
          data-testid="input-source"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="target">Target Column</Label>
        <Input
          id="target"
          placeholder="e.g., to_state, destination"
          value={config.target || ""}
          onChange={(e) => updateConfig("target", e.target.value)}
          data-testid="input-target"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="value">Value Metric</Label>
        <Input
          id="value"
          placeholder="e.g., SUM(flow), COUNT(*)"
          value={config.value || ""}
          onChange={(e) => updateConfig("value", e.target.value)}
          data-testid="input-value"
        />
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
