import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, DollarSign, Users, ShoppingCart, Activity, MoreVertical } from "lucide-react";
import { KPI } from "@/lib/api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface KpiCardProps {
  kpi: KPI;
  onEdit?: (kpi: KPI) => void;
  onDelete?: (id: string) => void;
}

export default function KpiCard({ kpi, onEdit, onDelete }: KpiCardProps) {
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const getKpiIcon = (question: string, unit?: string) => {
    const lowerQuestion = question.toLowerCase();
    const lowerUnit = unit?.toLowerCase() || '';
    
    if (lowerQuestion.includes('revenue') || lowerQuestion.includes('sales') || lowerUnit.includes('inr') || lowerQuestion.includes('₹')) {
      return DollarSign;
    }
    if (lowerQuestion.includes('user') || lowerQuestion.includes('customer')) {
      return Users;
    }
    if (lowerQuestion.includes('order') || lowerQuestion.includes('purchase')) {
      return ShoppingCart;
    }
    return Activity;
  };

  const getChangeIcon = (changePercent?: string) => {
    if (!changePercent) return null;
    const change = parseFloat(changePercent.replace('%', ''));
    return change >= 0 ? TrendingUp : TrendingDown;
  };

  const getChangeColor = (changePercent?: string) => {
    if (!changePercent) return 'text-muted-foreground';
    const change = parseFloat(changePercent.replace('%', ''));
    return change >= 0 ? 'text-green-500' : 'text-red-500';
  };

  const Icon = getKpiIcon(kpi.question, kpi.unit);
  const ChangeIcon = getChangeIcon(kpi.changePercent);

  return (
    <Card className="hover:border-primary/30 transition-all duration-300 group">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="p-2 rounded-lg bg-primary/20">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div className="flex items-center gap-2">
            {kpi.changePercent && (
              <Badge 
                variant="outline" 
                className={`${getChangeColor(kpi.changePercent)} border-current`}
              >
                {ChangeIcon && <ChangeIcon className="h-3 w-3 mr-1" />}
                {kpi.changePercent}
              </Badge>
            )}
            {(onEdit || onDelete) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onEdit && (
                    <DropdownMenuItem onClick={() => onEdit(kpi)}>
                      Edit KPI
                    </DropdownMenuItem>
                  )}
                  {onDelete && (
                    <DropdownMenuItem 
                      onClick={() => onDelete(kpi.id)}
                      className="text-destructive"
                    >
                      Delete KPI
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
        
        <div className="space-y-1">
          <h3 className="text-2xl font-bold" data-testid={`kpi-value-${kpi.id}`}>
            {kpi.value}
            {kpi.unit && <span className="text-lg text-muted-foreground ml-1">{kpi.unit}</span>}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2" data-testid={`kpi-question-${kpi.id}`}>
            {kpi.question}
          </p>
        </div>
        
        <div className="mt-4 text-xs text-muted-foreground">
          Last updated {formatTimeAgo(kpi.lastUpdated)}
        </div>
      </CardContent>
    </Card>
  );
}
