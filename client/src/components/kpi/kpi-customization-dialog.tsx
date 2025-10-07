import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getDashboards, type Dashboard } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BigNumber } from "./big-number";
import { Sparkles, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface KPICustomizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  question: string;
  answer: string;
  onSave: (config: KPIConfig) => void;
  isPending?: boolean;
}

export interface KPIConfig {
  dashboardId: string | null;
  visualType: 'big-number' | 'big-number-trendline';
  format: 'number' | 'currency' | 'percentage';
  decimalPlaces: number;
  currencyCode: string;
  prefix: string;
  suffix: string;
}

const CURRENCY_OPTIONS = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
];

export function KPICustomizationDialog({
  open,
  onOpenChange,
  question,
  answer,
  onSave,
  isPending = false,
}: KPICustomizationDialogProps) {
  const [config, setConfig] = useState<KPIConfig>({
    dashboardId: null,
    visualType: 'big-number',
    format: 'number',
    decimalPlaces: 0,
    currencyCode: 'USD',
    prefix: '',
    suffix: '',
  });

  const { data: dashboards = [] } = useQuery<Dashboard[]>({
    queryKey: ["/api/dashboards"],
    queryFn: getDashboards,
  });

  // Extract numeric value from answer
  const extractValue = (): string => {
    const numMatch = answer.match(/[\d,]+\.?\d*/);
    return numMatch ? numMatch[0].replace(/,/g, '') : '0';
  };

  const value = extractValue();

  // Auto-detect format from answer
  useEffect(() => {
    if (answer.includes('$') || answer.includes('USD') || answer.toLowerCase().includes('dollar')) {
      setConfig(prev => ({ ...prev, format: 'currency', prefix: '$' }));
    } else if (answer.includes('%') || answer.toLowerCase().includes('percent')) {
      setConfig(prev => ({ ...prev, format: 'percentage', suffix: '%' }));
    }
  }, [answer]);

  const formatPreviewValue = (val: string): string => {
    const numVal = parseFloat(val);
    if (isNaN(numVal)) return val;

    switch (config.format) {
      case 'currency':
        const currencySymbol = CURRENCY_OPTIONS.find(c => c.code === config.currencyCode)?.symbol || '$';
        return `${currencySymbol}${numVal.toFixed(config.decimalPlaces)}`;
      case 'percentage':
        return `${numVal.toFixed(config.decimalPlaces)}%`;
      case 'number':
      default:
        return numVal.toFixed(config.decimalPlaces);
    }
  };

  const handleSave = () => {
    onSave(config);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="dialog-kpi-customization">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Pin as KPI - Customize Your Card
          </DialogTitle>
          <DialogDescription>
            Configure how your KPI will appear on the dashboard
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          {/* Configuration Panel */}
          <div className="space-y-6">
            {/* Dashboard Selection */}
            <div className="space-y-2">
              <Label htmlFor="dashboard" className="text-base font-semibold">
                Select Dashboard
              </Label>
              <Select
                value={config.dashboardId || ""}
                onValueChange={(value) => setConfig({ ...config, dashboardId: value })}
              >
                <SelectTrigger id="dashboard" data-testid="select-dashboard">
                  <SelectValue placeholder="Choose a dashboard..." />
                </SelectTrigger>
                <SelectContent>
                  {dashboards.map((dashboard) => (
                    <SelectItem key={dashboard.id} value={dashboard.id} data-testid={`option-dashboard-${dashboard.id}`}>
                      {dashboard.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {dashboards.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No dashboards available. Create one first!
                </p>
              )}
            </div>

            {/* Visual Type */}
            <div className="space-y-2">
              <Label className="text-base font-semibold">Visual Style</Label>
              <Tabs
                value={config.visualType}
                onValueChange={(value: any) => setConfig({ ...config, visualType: value })}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="big-number" data-testid="visual-type-big-number">
                    Simple Card
                  </TabsTrigger>
                  <TabsTrigger value="big-number-trendline" data-testid="visual-type-trendline">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    With Trend
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Format Type */}
            <div className="space-y-2">
              <Label htmlFor="format" className="text-base font-semibold">
                Format Type
              </Label>
              <Select
                value={config.format}
                onValueChange={(value: any) => {
                  const newConfig = { ...config, format: value };
                  if (value === 'currency') {
                    newConfig.prefix = CURRENCY_OPTIONS.find(c => c.code === config.currencyCode)?.symbol || '$';
                  } else if (value === 'percentage') {
                    newConfig.suffix = '%';
                  } else {
                    if (config.prefix === '$' || CURRENCY_OPTIONS.some(c => c.symbol === config.prefix)) {
                      newConfig.prefix = '';
                    }
                    if (config.suffix === '%') {
                      newConfig.suffix = '';
                    }
                  }
                  setConfig(newConfig);
                }}
              >
                <SelectTrigger id="format" data-testid="select-format">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="number" data-testid="format-number">Number</SelectItem>
                  <SelectItem value="currency" data-testid="format-currency">Currency</SelectItem>
                  <SelectItem value="percentage" data-testid="format-percentage">Percentage</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Currency Selection (if currency) */}
            {config.format === 'currency' && (
              <div className="space-y-2">
                <Label htmlFor="currency" className="text-base font-semibold">
                  Currency
                </Label>
                <Select
                  value={config.currencyCode}
                  onValueChange={(value) => {
                    const symbol = CURRENCY_OPTIONS.find(c => c.code === value)?.symbol || '$';
                    setConfig({ ...config, currencyCode: value, prefix: symbol });
                  }}
                >
                  <SelectTrigger id="currency" data-testid="select-currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCY_OPTIONS.map((currency) => (
                      <SelectItem 
                        key={currency.code} 
                        value={currency.code}
                        data-testid={`currency-${currency.code}`}
                      >
                        {currency.symbol} {currency.name} ({currency.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Decimal Places */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="decimals" className="text-base font-semibold">
                  Decimal Places
                </Label>
                <span className="text-sm font-medium text-muted-foreground" data-testid="decimal-value">
                  {config.decimalPlaces}
                </span>
              </div>
              <Slider
                id="decimals"
                min={0}
                max={4}
                step={1}
                value={[config.decimalPlaces]}
                onValueChange={([value]) => setConfig({ ...config, decimalPlaces: value })}
                data-testid="slider-decimals"
              />
            </div>

            {/* Custom Prefix/Suffix */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="prefix" className="text-sm font-semibold">
                  Prefix
                </Label>
                <Input
                  id="prefix"
                  value={config.prefix}
                  onChange={(e) => setConfig({ ...config, prefix: e.target.value })}
                  placeholder="e.g., $"
                  data-testid="input-prefix"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="suffix" className="text-sm font-semibold">
                  Suffix
                </Label>
                <Input
                  id="suffix"
                  value={config.suffix}
                  onChange={(e) => setConfig({ ...config, suffix: e.target.value })}
                  placeholder="e.g., %"
                  data-testid="input-suffix"
                />
              </div>
            </div>
          </div>

          {/* Preview Panel */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-base font-semibold">Live Preview</Label>
              <p className="text-sm text-muted-foreground">
                See how your KPI card will look
              </p>
            </div>

            <Card className="border-2 border-dashed border-primary/50 bg-gradient-to-br from-background to-muted/20">
              <CardContent className="pt-6">
                <BigNumber
                  title={question}
                  value={formatPreviewValue(value)}
                  prefix={config.format === 'currency' ? '' : config.prefix}
                  suffix={config.format === 'percentage' ? '' : config.suffix}
                  format={config.format}
                  showComparison={false}
                />
              </CardContent>
            </Card>

            <div className="p-4 bg-muted/50 rounded-lg space-y-2">
              <p className="text-sm font-medium">Preview Details:</p>
              <div className="space-y-1 text-xs text-muted-foreground">
                <p>• Question: <span className="text-foreground">{question}</span></p>
                <p>• Value: <span className="text-foreground">{config.prefix}{formatPreviewValue(value)}{config.suffix}</span></p>
                <p>• Style: <span className="text-foreground">{config.visualType === 'big-number' ? 'Simple Card' : 'With Trendline'}</span></p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
            data-testid="button-cancel-kpi"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!config.dashboardId || isPending}
            data-testid="button-save-kpi"
            className="bg-gradient-to-r from-primary to-primary/80"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            {isPending ? 'Adding...' : 'Add to Dashboard'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
