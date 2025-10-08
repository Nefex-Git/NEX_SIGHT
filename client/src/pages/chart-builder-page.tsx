import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Save, 
  Database, 
  BarChart3, 
  X,
  Loader2 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { CHART_CATALOG, type ChartType } from "@/lib/chart-catalog";
import type { DataSource } from "@shared/schema";
import { BigNumberConfig } from "@/components/chart-config/BigNumberConfig";
import { BarChartConfig } from "@/components/chart-config/BarChartConfig";
import { LineChartConfig } from "@/components/chart-config/LineChartConfig";
import { PieChartConfig } from "@/components/chart-config/PieChartConfig";
import { ScatterChartConfig } from "@/components/chart-config/ScatterChartConfig";
import { HeatmapConfig } from "@/components/chart-config/HeatmapConfig";
import { TableConfig } from "@/components/chart-config/TableConfig";
import { FunnelConfig } from "@/components/chart-config/FunnelConfig";
import { TreemapConfig } from "@/components/chart-config/TreemapConfig";
import { RadarConfig } from "@/components/chart-config/RadarConfig";
import { MapConfig } from "@/components/chart-config/MapConfig";
import { WaterfallConfig } from "@/components/chart-config/WaterfallConfig";
import { SankeyConfig } from "@/components/chart-config/SankeyConfig";
import { HistogramConfig } from "@/components/chart-config/HistogramConfig";
import { MultiValueConfig } from "@/components/chart-config/MultiValueConfig";

interface ChartBuilderPageProps {
  chartType?: string;
  onBack?: () => void;
}

export default function ChartBuilderPage({ chartType: chartTypeProp, onBack }: ChartBuilderPageProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Get chart type from props (or fallback to URL params for standalone access)
  const urlParams = new URLSearchParams(window.location.search);
  const chartTypeId = chartTypeProp || urlParams.get("type") || "bar";
  
  const chartType = CHART_CATALOG.find((c) => c.id === chartTypeId);
  
  // Form state
  const [title, setTitle] = useState(`New ${chartType?.name || "Chart"}`);
  const [selectedDatasets, setSelectedDatasets] = useState<string[]>([]);
  const [config, setConfig] = useState<Record<string, any>>({});
  const [availableColumns, setAvailableColumns] = useState<string[]>([]);
  
  // Fetch columns from selected datasets
  useEffect(() => {
    const fetchColumns = async () => {
      if (selectedDatasets.length === 0) {
        setAvailableColumns([]);
        return;
      }

      try {
        const columnSets = await Promise.all(
          selectedDatasets.map(async (datasetId) => {
            const response = await fetch(`/api/data-sources/${datasetId}/columns`, {
              credentials: "include",
            });
            if (response.ok) {
              const data = await response.json();
              const columns = data.columns || [];
              // Extract column names from column objects
              return columns.map((col: any) => typeof col === 'string' ? col : col.name);
            }
            return [];
          })
        );

        // Combine and deduplicate columns from all datasets
        const allColumns = Array.from(new Set(columnSets.flat()));
        setAvailableColumns(allColumns);
      } catch (error) {
        console.error("Failed to fetch columns:", error);
        setAvailableColumns([]);
      }
    };

    fetchColumns();
  }, [selectedDatasets]);
  
  // Initialize config with defaults based on chart type
  useEffect(() => {
    const getDefaultConfig = (type: string) => {
      switch (type) {
        case "big_number":
        case "big_number_trendline":
        case "gauge":
          return {
            metric: "",
            format: "number",
            decimals: "0",
            currency: "USD",
            prefix: "",
            suffix: "",
          };
        case "bar":
        case "stacked_bar":
        case "grouped_bar":
        case "horizontal_bar":
          return {
            xAxis: "",
            yAxis: "",
            aggregation: "sum",
            limit: "",
            sortOrder: "desc",
          };
        case "line":
        case "multi_line":
        case "smooth_line":
        case "stepped_line":
        case "area":
        case "stacked_area":
          return {
            xAxis: "",
            yAxis: "",
            groupBy: "",
            lineStyle: "linear",
            showDataPoints: false,
            showArea: false,
          };
        case "pie":
        case "donut":
          return {
            category: "",
            value: "",
            limit: "",
            donutMode: type === "donut",
            showLabels: true,
            showPercentages: false,
          };
        case "scatter":
        case "bubble":
          return {
            xAxis: "",
            yAxis: "",
            size: "",
            color: "",
            limit: "",
          };
        case "heatmap":
        case "calendar_heatmap":
          return {
            xAxis: "",
            yAxis: "",
            metric: "",
            colorScheme: "blues",
          };
        case "table":
        case "pivot_table":
          return {
            columns: "",
            orderBy: "",
            limit: "",
            pagination: true,
            search: true,
          };
        case "funnel":
          return {
            stage: "",
            metric: "",
            orientation: "vertical",
            labelPosition: "inside",
          };
        case "treemap":
        case "sunburst":
          return {
            category: "",
            subcategory: "",
            metric: "",
            colorMetric: "",
          };
        case "radar":
          return {
            category: "",
            series: "",
            metric: "",
            fillArea: true,
          };
        case "country_map":
        case "geojson_map":
          return {
            location: "",
            metric: "",
            mapType: "country",
            colorScheme: "sequential",
          };
        case "waterfall":
          return {
            category: "",
            metric: "",
            sortOrder: "none",
            totalLabel: "Total",
          };
        case "sankey":
          return {
            source: "",
            target: "",
            value: "",
            nodeAlign: "justify",
          };
        case "histogram":
        case "boxplot":
          return {
            column: "",
            bins: "",
            binRange: "",
            cumulative: false,
            normalized: false,
          };
        case "multi_value_card":
          return {
            metrics: "",
            labels: "",
            format: "",
            showTrend: false,
          };
        default:
          return {};
      }
    };
    
    setConfig(getDefaultConfig(chartTypeId));
  }, [chartTypeId]);
  
  // Fetch data sources
  const { data: dataSources = [], isLoading: isLoadingDataSources } = useQuery<DataSource[]>({
    queryKey: ["/api/data-sources"],
  });
  
  // Create chart mutation
  const createChartMutation = useMutation({
    mutationFn: async (chartData: any) => {
      const response = await fetch("/api/charts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(chartData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create chart");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/charts"] });
      toast({
        title: "Chart created",
        description: "Your chart has been created successfully.",
      });
      if (onBack) {
        onBack();
      } else {
        setLocation("/");
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const handleDatasetToggle = (datasetId: string) => {
    setSelectedDatasets((prev) =>
      prev.includes(datasetId)
        ? prev.filter((id) => id !== datasetId)
        : [...prev, datasetId]
    );
  };
  
  const handleRemoveDataset = (datasetId: string) => {
    setSelectedDatasets((prev) => prev.filter((id) => id !== datasetId));
  };
  
  const handleSave = () => {
    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a chart title.",
        variant: "destructive",
      });
      return;
    }
    
    if (selectedDatasets.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one dataset.",
        variant: "destructive",
      });
      return;
    }
    
    createChartMutation.mutate({
      title,
      type: chartTypeId,
      config,
      dataSourceIds: selectedDatasets,
    });
  };
  
  const renderChartConfig = () => {
    const configMap: Record<string, any> = {
      big_number: BigNumberConfig,
      big_number_trendline: BigNumberConfig,
      gauge: BigNumberConfig,
      bar: BarChartConfig,
      stacked_bar: BarChartConfig,
      grouped_bar: BarChartConfig,
      horizontal_bar: BarChartConfig,
      line: LineChartConfig,
      multi_line: LineChartConfig,
      smooth_line: LineChartConfig,
      stepped_line: LineChartConfig,
      area: LineChartConfig,
      stacked_area: LineChartConfig,
      pie: PieChartConfig,
      donut: PieChartConfig,
      scatter: ScatterChartConfig,
      bubble: ScatterChartConfig,
      heatmap: HeatmapConfig,
      calendar_heatmap: HeatmapConfig,
      table: TableConfig,
      pivot_table: TableConfig,
      funnel: FunnelConfig,
      treemap: TreemapConfig,
      sunburst: TreemapConfig,
      radar: RadarConfig,
      country_map: MapConfig,
      geojson_map: MapConfig,
      waterfall: WaterfallConfig,
      sankey: SankeyConfig,
      histogram: HistogramConfig,
      boxplot: HistogramConfig,
      multi_value_card: MultiValueConfig,
    };
    
    const ConfigComponent = configMap[chartTypeId];
    
    if (!ConfigComponent) {
      return (
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">
              Configuration options for this chart type are coming soon.
            </p>
          </CardContent>
        </Card>
      );
    }
    
    return <ConfigComponent config={config} onChange={setConfig} columns={availableColumns} />;
  };
  
  return (
    <div className="flex h-screen bg-background">
      {/* Left Panel - Configuration */}
      <div className="w-[400px] border-r border-border bg-card">
        <ScrollArea className="h-full">
          <div className="p-6 space-y-6">
            {/* Header */}
            <div className="space-y-4">
              <Button
                variant="ghost"
                onClick={() => {
                  if (onBack) {
                    onBack();
                  } else {
                    setLocation("/");
                  }
                }}
                className="pl-0"
                data-testid="button-back-to-charts"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Charts
              </Button>
              
              <div>
                <h1 className="text-2xl font-bold">Chart Builder</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Configure your {chartType?.name || "chart"}
                </p>
              </div>
            </div>
            
            <Separator />
            
            {/* Chart Type Info */}
            <div className="space-y-2">
              <Label>Chart Type</Label>
              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg flex items-center justify-center shrink-0">
                      <BarChart3 className="h-6 w-6 text-primary/70" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm">{chartType?.name}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {chartType?.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Separator />
            
            {/* Chart Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Chart Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter chart title"
                data-testid="input-chart-title"
              />
            </div>
            
            <Separator />
            
            {/* Dataset Selection */}
            <div className="space-y-3">
              <Label>Select Datasets</Label>
              
              {/* Selected Datasets */}
              {selectedDatasets.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedDatasets.map((datasetId) => {
                    const dataset = dataSources.find((ds) => ds.id === datasetId);
                    return (
                      <Badge
                        key={datasetId}
                        variant="secondary"
                        className="pr-1"
                        data-testid={`badge-selected-dataset-${datasetId}`}
                      >
                        <Database className="mr-1 h-3 w-3" />
                        {dataset?.name || "Unknown"}
                        <button
                          onClick={() => handleRemoveDataset(datasetId)}
                          className="ml-1 hover:bg-destructive/20 rounded-sm p-0.5"
                          data-testid={`button-remove-dataset-${datasetId}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    );
                  })}
                </div>
              )}
              
              {/* Dataset Selector */}
              <Select onValueChange={handleDatasetToggle}>
                <SelectTrigger data-testid="select-dataset">
                  <SelectValue placeholder="Choose a dataset" />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingDataSources ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  ) : dataSources.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      No datasets available
                    </div>
                  ) : (
                    dataSources
                      .filter((ds) => !selectedDatasets.includes(ds.id))
                      .map((ds) => (
                        <SelectItem key={ds.id} value={ds.id} data-testid={`option-dataset-${ds.id}`}>
                          <div className="flex items-center gap-2">
                            <Database className="h-4 w-4" />
                            <span>{ds.name}</span>
                            <Badge variant="outline" className="ml-auto">
                              {ds.type}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))
                  )}
                </SelectContent>
              </Select>
              
              {selectedDatasets.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Select one or more datasets to visualize
                </p>
              )}
            </div>
            
            <Separator />
            
            {/* Chart Configuration */}
            <div className="space-y-3">
              <Label>Chart Configuration</Label>
              {renderChartConfig()}
            </div>
          </div>
        </ScrollArea>
        
        {/* Save Button */}
        <div className="p-4 border-t border-border">
          <Button
            onClick={handleSave}
            className="w-full"
            disabled={createChartMutation.isPending}
            data-testid="button-save-chart"
          >
            {createChartMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Create Chart
              </>
            )}
          </Button>
        </div>
      </div>
      
      {/* Right Panel - Preview */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-6 border-b border-border bg-card">
          <h2 className="text-lg font-semibold">Preview</h2>
          <p className="text-sm text-muted-foreground">
            Chart preview will appear here
          </p>
        </div>
        
        <div className="flex-1 flex items-center justify-center p-6 bg-muted/10">
          <Card className="w-full max-w-4xl">
            <CardHeader>
              <CardTitle>{title}</CardTitle>
              <CardDescription>
                {selectedDatasets.length > 0
                  ? `Visualizing ${selectedDatasets.length} dataset${selectedDatasets.length > 1 ? "s" : ""}`
                  : "Select datasets to see preview"}
              </CardDescription>
            </CardHeader>
            <CardContent className="h-96 flex items-center justify-center">
              <div className="text-center space-y-2">
                <BarChart3 className="h-16 w-16 mx-auto text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  Chart preview will be displayed here
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
