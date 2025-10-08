import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface BigNumberConfigProps {
  config: Record<string, any>;
  onChange: (config: Record<string, any>) => void;
  columns?: string[];
  chartType?: string;
}

export function BigNumberConfig({ config, onChange, columns = [], chartType }: BigNumberConfigProps) {
  const updateConfig = (key: string, value: any) => {
    onChange({ ...config, [key]: value });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="metric">Metric Column</Label>
        {columns.length > 0 ? (
          <Select
            value={config.metric || ""}
            onValueChange={(value) => updateConfig("metric", value)}
          >
            <SelectTrigger id="metric" data-testid="select-metric">
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
            id="metric"
            placeholder="Select a dataset first"
            value={config.metric || ""}
            onChange={(e) => updateConfig("metric", e.target.value)}
            data-testid="input-metric"
            disabled
          />
        )}
        <p className="text-xs text-muted-foreground">
          Column to aggregate (e.g., revenue, price, count)
        </p>
      </div>

      {chartType === "big_number_trendline" && (
        <div className="space-y-2">
          <Label htmlFor="timeColumn">Trend Column (Time/Date)</Label>
          {columns.length > 0 ? (
            <Select
              value={config.timeColumn || ""}
              onValueChange={(value) => updateConfig("timeColumn", value)}
            >
              <SelectTrigger id="timeColumn" data-testid="select-trend">
                <SelectValue placeholder="Select a time column" />
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
              id="timeColumn"
              placeholder="Select a dataset first"
              value={config.timeColumn || ""}
              onChange={(e) => updateConfig("timeColumn", e.target.value)}
              data-testid="input-trend"
              disabled
            />
          )}
          <p className="text-xs text-muted-foreground">
            Column with date/time values for the trendline
          </p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="format">Format</Label>
        <Select
          value={config.format || "number"}
          onValueChange={(value) => updateConfig("format", value)}
        >
          <SelectTrigger id="format" data-testid="select-format">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="number">Number</SelectItem>
            <SelectItem value="currency">Currency</SelectItem>
            <SelectItem value="percentage">Percentage</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {config.format === "currency" && (
        <div className="space-y-2">
          <Label htmlFor="currency">Currency</Label>
          <Select
            value={config.currency || "USD"}
            onValueChange={(value) => updateConfig("currency", value)}
          >
            <SelectTrigger id="currency" data-testid="select-currency">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">USD ($)</SelectItem>
              <SelectItem value="EUR">EUR (€)</SelectItem>
              <SelectItem value="GBP">GBP (£)</SelectItem>
              <SelectItem value="JPY">JPY (¥)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="decimals">Decimal Places</Label>
        <Input
          id="decimals"
          type="number"
          min="0"
          max="4"
          value={config.decimals || "0"}
          onChange={(e) => updateConfig("decimals", e.target.value)}
          data-testid="input-decimals"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="prefix">Prefix (Optional)</Label>
        <Input
          id="prefix"
          placeholder="e.g., $, Total:"
          value={config.prefix || ""}
          onChange={(e) => updateConfig("prefix", e.target.value)}
          data-testid="input-prefix"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="suffix">Suffix (Optional)</Label>
        <Input
          id="suffix"
          placeholder="e.g., %, items"
          value={config.suffix || ""}
          onChange={(e) => updateConfig("suffix", e.target.value)}
          data-testid="input-suffix"
        />
      </div>
    </div>
  );
}
