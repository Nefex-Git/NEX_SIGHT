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
      
      {visualType === 'big-number-trendline' ? (
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
