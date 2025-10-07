import { Button } from "@/components/ui/button";
import { MoreVertical } from "lucide-react";
import { KPI } from "@/lib/api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BigNumber } from "@/components/kpi/big-number";
import { BigNumberTrendline } from "@/components/kpi/big-number-trendline";
import { MultiValueCard } from "@/components/kpi/multi-value-card";

interface KpiCardProps {
  kpi: KPI;
  onEdit?: (kpi: KPI) => void;
  onDelete?: (id: string) => void;
}

export default function KpiCard({ kpi, onEdit, onDelete }: KpiCardProps) {
  const formatValue = (val: string): string => {
    const numVal = parseFloat(val);
    if (isNaN(numVal)) return val;
    
    const format = kpi.format || 'number';
    const decimalPlaces = kpi.decimalPlaces ?? 0;
    
    switch (format) {
      case 'currency':
        return numVal.toFixed(decimalPlaces);
      case 'percentage':
        return numVal.toFixed(decimalPlaces);
      case 'number':
      default:
        return numVal.toFixed(decimalPlaces);
    }
  };

  const visualType = kpi.visualType || 'big-number';
  const format = (kpi.format || 'number') as 'number' | 'currency' | 'percentage';
  
  const formattedValue = formatValue(kpi.value);
  const prefix = kpi.prefix || '';
  const suffix = kpi.suffix || '';

  // Parse multi-value data if present
  const parseMultiValue = (): Array<{label: string, value: string}> | null => {
    try {
      // Check if value contains labeled data (e.g., "Product: XYZ, Units: 100, Amount: $500")
      const labeledPattern = /([^:]+):\s*([^,\n]+)/g;
      const matches = Array.from(kpi.value.matchAll(labeledPattern));
      
      if (matches.length > 1) {
        return matches.map(match => ({
          label: match[1].trim(),
          value: match[2].trim()
        }));
      }
      
      // Check if it's a comma/newline separated list
      const lines = kpi.value.split(/[,\n]/).map(l => l.trim()).filter(l => l);
      if (lines.length > 1 && lines.length <= 5) {
        return lines.map((line, i) => ({
          label: `Value ${i + 1}`,
          value: line
        }));
      }
    } catch (e) {
      console.error('Error parsing multi-value:', e);
    }
    return null;
  };

  const multiValues = visualType === 'multi-value' ? parseMultiValue() : null;

  const cardContent = (
    <div className="relative group">
      {(onEdit || onDelete) && (
        <div className="absolute top-2 right-2 z-10">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                data-testid={`button-kpi-menu-${kpi.id}`}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(kpi)} data-testid={`button-edit-kpi-${kpi.id}`}>
                  Edit KPI
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem 
                  onClick={() => onDelete(kpi.id)}
                  className="text-destructive"
                  data-testid={`button-delete-kpi-${kpi.id}`}
                >
                  Delete KPI
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
      
      {visualType === 'multi-value' && multiValues ? (
        <MultiValueCard
          title={kpi.question}
          values={multiValues.map(v => {
            const numVal = parseFloat(v.value);
            const isNumeric = !isNaN(numVal);
            
            return {
              label: v.label,
              value: isNumeric ? formatValue(v.value) : v.value,
              prefix: isNumeric ? prefix : '',
              suffix: isNumeric ? suffix : '',
              highlight: false
            };
          })}
        />
      ) : visualType === 'big-number-trendline' ? (
        <BigNumberTrendline
          title={kpi.question}
          value={formattedValue}
          trendData={[]} 
          prefix={prefix}
          suffix={suffix}
          format={format}
          showComparison={!!kpi.changePercent}
        />
      ) : (
        <BigNumber
          title={kpi.question}
          value={formattedValue}
          prefix={prefix}
          suffix={suffix}
          format={format}
          showComparison={false}
        />
      )}
    </div>
  );

  return cardContent;
}
