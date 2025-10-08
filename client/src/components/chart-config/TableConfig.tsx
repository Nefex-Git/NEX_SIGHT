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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface TableConfigProps {
  config: Record<string, any>;
  onChange: (config: Record<string, any>) => void;
  columns?: string[];
}

export function TableConfig({ config, onChange, columns = [] }: TableConfigProps) {
  const updateConfig = (key: string, value: any) => {
    onChange({ ...config, [key]: value });
  };

  const selectedColumns: string[] = config.columns || [];

  const toggleColumn = (column: string) => {
    const updated = selectedColumns.includes(column)
      ? selectedColumns.filter(col => col !== column)
      : [...selectedColumns, column];
    updateConfig("columns", updated);
  };

  const removeColumn = (column: string) => {
    updateConfig("columns", selectedColumns.filter(col => col !== column));
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Columns to Display</Label>
        {columns.length > 0 ? (
          <>
            <div className="border rounded-md p-3 space-y-2 max-h-48 overflow-y-auto">
              {columns.filter(col => col && col.trim()).map((col) => (
                <div key={col} className="flex items-center space-x-2">
                  <Checkbox
                    id={`col-${col}`}
                    checked={selectedColumns.includes(col)}
                    onCheckedChange={() => toggleColumn(col)}
                    data-testid={`checkbox-column-${col}`}
                  />
                  <label
                    htmlFor={`col-${col}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                  >
                    {col}
                  </label>
                </div>
              ))}
            </div>
            {selectedColumns.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedColumns.map((col) => (
                  <Badge key={col} variant="secondary" className="gap-1">
                    {col}
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-destructive"
                      onClick={() => removeColumn(col)}
                      data-testid={`button-remove-column-${col}`}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="border rounded-md p-3 text-sm text-muted-foreground">
            Select a dataset first to see available columns
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          Select which columns to display in the table
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="orderBy">Order By</Label>
        {columns.length > 0 ? (
          <Select
            value={config.orderBy || ""}
            onValueChange={(value) => updateConfig("orderBy", value)}
          >
            <SelectTrigger id="orderBy" data-testid="select-order-by">
              <SelectValue placeholder="Select column to order by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">None</SelectItem>
              {columns.filter(col => col && col.trim()).map((col) => (
                <SelectItem key={col} value={col}>
                  {col}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            id="orderBy"
            placeholder="Select a dataset first"
            value={config.orderBy || ""}
            disabled
            data-testid="input-order-by"
          />
        )}
        <p className="text-xs text-muted-foreground">
          Column to sort the table by
        </p>
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
