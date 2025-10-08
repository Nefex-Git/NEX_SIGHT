import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Database, X, Loader2, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { ChartType } from "@/lib/chart-catalog";
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
import { ChartRenderer } from "./chart-renderer";

interface ChartConfigurationModalProps {
  isOpen: boolean;
  onClose: () => void;
  chartType: ChartType;
  dashboardId: string;
  onBack: () => void;
}

// Helper function to aggregate preview data
function aggregatePreviewData(rawData: any[], config: Record<string, any>, chartType: string): any[] {
  if (!rawData || rawData.length === 0) return [];

  // For bar/line charts with aggregation
  if (['bar', 'stacked_bar', 'grouped_bar', 'line', 'multi_line', 'area', 'stacked_area'].includes(chartType)) {
    const { xAxis, yAxis, aggregation = 'sum', limit, sortOrder = 'desc' } = config;
    
    if (!xAxis || !yAxis) return rawData;

    // Group by xAxis and aggregate yAxis
    const grouped: Record<string, number> = {};
    const counts: Record<string, number> = {};

    rawData.forEach((row) => {
      const key = String(row[xAxis] || 'Unknown');
      const value = parseFloat(row[yAxis]) || 0;

      if (!grouped[key]) {
        grouped[key] = 0;
        counts[key] = 0;
      }

      switch (aggregation) {
        case 'sum':
          grouped[key] += value;
          break;
        case 'avg':
          grouped[key] += value;
          counts[key] += 1;
          break;
        case 'count':
          grouped[key] += 1;
          break;
        case 'min':
          grouped[key] = grouped[key] === 0 ? value : Math.min(grouped[key], value);
          break;
        case 'max':
          grouped[key] = Math.max(grouped[key], value);
          break;
        default:
          grouped[key] += value;
      }
    });

    // Convert to array and apply avg calculation if needed
    let aggregated = Object.entries(grouped).map(([key, value]) => ({
      [xAxis]: key,
      [yAxis]: aggregation === 'avg' && counts[key] > 0 ? value / counts[key] : value,
    }));

    // Sort
    aggregated.sort((a, b) => {
      const aVal = Number(a[yAxis]) || 0;
      const bVal = Number(b[yAxis]) || 0;
      const diff = bVal - aVal;
      return sortOrder === 'desc' ? diff : -diff;
    });

    // Apply limit
    if (limit && parseInt(limit) > 0) {
      aggregated = aggregated.slice(0, parseInt(limit));
    }

    return aggregated;
  }

  // For pie/donut charts
  if (['pie', 'donut'].includes(chartType)) {
    const { category, value, limit, sortOrder = 'desc' } = config;
    
    if (!category || !value) return rawData;

    // Group by category and sum values
    const grouped: Record<string, number> = {};

    rawData.forEach((row) => {
      const key = String(row[category] || 'Unknown');
      const val = parseFloat(row[value]) || 0;
      grouped[key] = (grouped[key] || 0) + val;
    });

    // Convert to array
    let aggregated = Object.entries(grouped).map(([key, val]) => ({
      [category]: key,
      [value]: val,
    }));

    // Sort
    aggregated.sort((a, b) => {
      const aVal = Number(a[value]) || 0;
      const bVal = Number(b[value]) || 0;
      const diff = bVal - aVal;
      return sortOrder === 'desc' ? diff : -diff;
    });

    // Apply limit
    if (limit && parseInt(limit) > 0) {
      aggregated = aggregated.slice(0, parseInt(limit));
    }

    return aggregated;
  }

  return rawData;
}

export function ChartConfigurationModal({
  isOpen,
  onClose,
  chartType,
  dashboardId,
  onBack,
}: ChartConfigurationModalProps) {
  const { toast } = useToast();
  const [title, setTitle] = useState(`New ${chartType.name}`);
  const [selectedDatasets, setSelectedDatasets] = useState<string[]>([]);
  const [config, setConfig] = useState<Record<string, any>>({});
  const [availableColumns, setAvailableColumns] = useState<string[]>([]);
  const [previewData, setPreviewData] = useState<any[]>([]);

  // Fetch all available datasets
  const { data: dataSources = [], isLoading: dataSourcesLoading } = useQuery<DataSource[]>({
    queryKey: ["/api/data-sources"],
    enabled: isOpen,
  });

  // Fetch columns and preview data from selected datasets
  useEffect(() => {
    const fetchColumnsAndPreview = async () => {
      if (selectedDatasets.length === 0) {
        setAvailableColumns([]);
        setPreviewData([]);
        return;
      }

      try {
        const [columnSets, previewSets] = await Promise.all([
          Promise.all(
            selectedDatasets.map(async (datasetId) => {
              const response = await fetch(`/api/data-sources/${datasetId}/columns`, {
                credentials: "include",
              });
              if (response.ok) {
                const data = await response.json();
                const columns = data.columns || [];
                return columns.map((col: any) => typeof col === 'string' ? col : col.name);
              }
              return [];
            })
          ),
          Promise.all(
            selectedDatasets.map(async (datasetId) => {
              const response = await fetch(`/api/data-sources/${datasetId}/preview?limit=50`, {
                credentials: "include",
              });
              if (response.ok) {
                const data = await response.json();
                return data.data || [];
              }
              return [];
            })
          )
        ]);

        const allColumns = Array.from(new Set(columnSets.flat()));
        setAvailableColumns(allColumns);
        
        // Use preview data from first selected dataset
        setPreviewData(previewSets[0] || []);
      } catch (error) {
        console.error("Failed to fetch columns and preview:", error);
        setAvailableColumns([]);
        setPreviewData([]);
      }
    };

    fetchColumnsAndPreview();
  }, [selectedDatasets]);

  // Initialize config with defaults
  useEffect(() => {
    const getDefaultConfig = () => {
      const baseConfig: Record<string, any> = {};
      
      // Add common defaults based on chart type
      if (['bar', 'stacked_bar', 'grouped_bar'].includes(chartType.id)) {
        return { xAxis: "", yAxis: "", aggregation: "sum", limit: "", sortOrder: "desc" };
      } else if (['line', 'multi_line', 'area', 'stacked_area'].includes(chartType.id)) {
        return { xAxis: "", yAxis: "", groupBy: "", lineStyle: "linear", showDataPoints: false };
      } else if (['pie', 'donut'].includes(chartType.id)) {
        return { category: "", value: "", limit: "", donutMode: chartType.id === "donut" };
      } else if (['big_number', 'big_number_trendline', 'gauge'].includes(chartType.id)) {
        return { metric: "", format: "number", decimals: "0" };
      } else if (['table', 'pivot_table'].includes(chartType.id)) {
        return { columns: [], orderBy: "", limit: "" };
      }
      
      return baseConfig;
    };

    setConfig(getDefaultConfig());
  }, [chartType.id]);

  const createChartMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/charts", data);
    },
    onSuccess: async (response) => {
      const chartData = await response.json();
      
      // Link chart to dashboard
      await apiRequest("POST", `/api/dashboards/${dashboardId}/charts`, {
        chartId: chartData.id,
        x: 0,
        y: 0,
        w: 6,
        h: 4,
      });

      queryClient.invalidateQueries({ queryKey: ["/api/dashboards", dashboardId] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboards", dashboardId, "charts"] });
      
      toast({
        title: "Success",
        description: "Chart created successfully",
      });
      
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create chart",
        variant: "destructive",
      });
    },
  });

  const validateChartConfig = (): { valid: boolean; error?: string } => {
    const type = chartType.id;
    
    // Validate based on chart type
    if (['big_number', 'gauge'].includes(type)) {
      if (!config.metric) {
        return { valid: false, error: "Metric column is required for this chart type" };
      }
    } else if (['big_number_trendline'].includes(type)) {
      if (!config.metric || !config.timeColumn) {
        return { valid: false, error: "Both metric and time column are required for trendline" };
      }
    } else if (['bar', 'stacked_bar', 'grouped_bar', 'horizontal_bar'].includes(type)) {
      if (!config.xAxis || !config.yAxis) {
        return { valid: false, error: "Both X-Axis and Y-Axis columns are required" };
      }
    } else if (['line', 'multi_line', 'smooth_line', 'stepped_line', 'area', 'stacked_area'].includes(type)) {
      if (!config.xAxis || !config.yAxis) {
        return { valid: false, error: "Both X-Axis and Y-Axis columns are required" };
      }
    } else if (['pie', 'donut'].includes(type)) {
      if (!config.category || !config.value) {
        return { valid: false, error: "Both category and value columns are required" };
      }
    } else if (['scatter', 'bubble'].includes(type)) {
      if (!config.xAxis || !config.yAxis) {
        return { valid: false, error: "Both X-Axis and Y-Axis columns are required" };
      }
    } else if (['heatmap', 'calendar_heatmap'].includes(type)) {
      if (!config.xAxis || !config.yAxis || !config.metric) {
        return { valid: false, error: "X-Axis, Y-Axis, and metric columns are required" };
      }
    } else if (['table', 'pivot_table'].includes(type)) {
      if (!Array.isArray(config.columns) || config.columns.length === 0) {
        return { valid: false, error: "At least one column must be selected" };
      }
    } else if (['funnel'].includes(type)) {
      if (!config.stage || !config.metric) {
        return { valid: false, error: "Stage and metric columns are required" };
      }
    } else if (['treemap', 'sunburst'].includes(type)) {
      if (!Array.isArray(config.dimensions) || config.dimensions.length === 0 || !config.metric) {
        return { valid: false, error: "At least one dimension and a metric column are required" };
      }
    } else if (['radar'].includes(type)) {
      if (!Array.isArray(config.dimensions) || config.dimensions.length === 0 || 
          !Array.isArray(config.metrics) || config.metrics.length === 0) {
        return { valid: false, error: "At least one dimension and one metric are required" };
      }
    } else if (['multi_value_card'].includes(type)) {
      if (!Array.isArray(config.metrics) || config.metrics.length === 0) {
        return { valid: false, error: "At least one metric must be selected" };
      }
    } else if (['sankey'].includes(type)) {
      if (!config.source || !config.target || !config.value) {
        return { valid: false, error: "Source, target, and value columns are required" };
      }
    } else if (['waterfall'].includes(type)) {
      if (!config.category || !config.value) {
        return { valid: false, error: "Category and value columns are required" };
      }
    } else if (['boxplot', 'histogram'].includes(type)) {
      if (!config.metric) {
        return { valid: false, error: "Metric column is required" };
      }
    } else if (['country_map', 'geojson_map'].includes(type)) {
      if (!config.location || !config.metric) {
        return { valid: false, error: "Location and metric columns are required" };
      }
    }
    
    return { valid: true };
  };

  const handleSave = () => {
    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Chart title is required",
        variant: "destructive",
      });
      return;
    }

    if (selectedDatasets.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one dataset",
        variant: "destructive",
      });
      return;
    }

    const validation = validateChartConfig();
    if (!validation.valid) {
      toast({
        title: "Configuration Error",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }

    createChartMutation.mutate({
      title,
      type: chartType.id,
      config,
      dataSourceIds: selectedDatasets,
      query: null,
    });
  };

  const toggleDataset = (datasetId: string) => {
    setSelectedDatasets(prev =>
      prev.includes(datasetId)
        ? prev.filter(id => id !== datasetId)
        : [...prev, datasetId]
    );
  };

  const removeDataset = (datasetId: string) => {
    setSelectedDatasets(prev => prev.filter(id => id !== datasetId));
  };

  const renderChartConfig = () => {
    const commonProps = {
      config,
      onChange: setConfig,
      columns: availableColumns,
    };

    switch (chartType.id) {
      case "big_number":
      case "big_number_trendline":
      case "gauge":
      case "multi_value_card":
        return chartType.id === "multi_value_card" ? (
          <MultiValueConfig {...commonProps} />
        ) : (
          <BigNumberConfig {...commonProps} />
        );
      
      case "bar":
      case "stacked_bar":
      case "grouped_bar":
      case "horizontal_bar":
        return <BarChartConfig {...commonProps} />;
      
      case "line":
      case "multi_line":
      case "smooth_line":
      case "stepped_line":
      case "area":
      case "stacked_area":
        return <LineChartConfig {...commonProps} />;
      
      case "pie":
      case "donut":
        return <PieChartConfig {...commonProps} />;
      
      case "scatter":
      case "bubble":
        return <ScatterChartConfig {...commonProps} />;
      
      case "heatmap":
      case "calendar_heatmap":
        return <HeatmapConfig {...commonProps} />;
      
      case "table":
      case "pivot_table":
        return <TableConfig {...commonProps} />;
      
      case "funnel":
        return <FunnelConfig {...commonProps} />;
      
      case "treemap":
      case "sunburst":
        return <TreemapConfig {...commonProps} />;
      
      case "radar":
        return <RadarConfig {...commonProps} />;
      
      case "country_map":
      case "geojson_map":
        return <MapConfig {...commonProps} />;
      
      case "waterfall":
        return <WaterfallConfig {...commonProps} />;
      
      case "sankey":
        return <SankeyConfig {...commonProps} />;
      
      case "boxplot":
      case "histogram":
        return <HistogramConfig {...commonProps} />;
      
      default:
        return (
          <div className="text-center text-muted-foreground py-8">
            Configuration for {chartType.name} will be available soon
          </div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] p-0" data-testid="dialog-chart-configuration">
        <div className="flex flex-col h-[85vh]">
          <DialogHeader className="px-6 py-4 border-b">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={onBack}
                data-testid="button-back-to-chart-types"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex-1">
                <DialogTitle>Configure {chartType.name}</DialogTitle>
                <DialogDescription>{chartType.description}</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex flex-1 overflow-hidden">
            {/* Configuration Panel - Left Side */}
            <ScrollArea className="flex-1 border-r p-6">
            <div className="space-y-6">
              {/* Chart Title */}
              <div className="space-y-2">
                <Label htmlFor="chart-title">Chart Title</Label>
                <Input
                  id="chart-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter chart title"
                  data-testid="input-chart-title"
                />
              </div>

              <Separator />

              {/* Dataset Selection */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Select Dataset(s)
                </Label>
                
                {dataSourcesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : dataSources.length > 0 ? (
                  <>
                    <Select onValueChange={toggleDataset}>
                      <SelectTrigger data-testid="select-dataset">
                        <SelectValue placeholder="Choose a dataset" />
                      </SelectTrigger>
                      <SelectContent>
                        {dataSources.map((ds) => (
                          <SelectItem 
                            key={ds.id} 
                            value={ds.id}
                            disabled={selectedDatasets.includes(ds.id)}
                          >
                            {ds.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {selectedDatasets.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {selectedDatasets.map((dsId) => {
                          const ds = dataSources.find(d => d.id === dsId);
                          return (
                            <Badge key={dsId} variant="secondary" className="gap-1">
                              {ds?.name || dsId}
                              <X
                                className="h-3 w-3 cursor-pointer hover:text-destructive"
                                onClick={() => removeDataset(dsId)}
                                data-testid={`button-remove-dataset-${dsId}`}
                              />
                            </Badge>
                          );
                        })}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center text-muted-foreground py-8 border-2 border-dashed rounded-lg">
                    <Database className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No datasets available</p>
                    <p className="text-sm">Upload data or connect a database first</p>
                  </div>
                )}
              </div>

              <Separator />

              {/* Chart-specific Configuration */}
              {selectedDatasets.length > 0 && (
                <div className="space-y-3">
                  <Label>Chart Configuration</Label>
                  {renderChartConfig()}
                </div>
              )}
            </div>
            </ScrollArea>

            {/* Preview Panel - Right Side */}
            <div className="w-1/2 p-6 bg-muted/30 flex flex-col">
              <h3 className="text-sm font-semibold mb-4">Live Preview</h3>
              <div className="flex-1 border rounded-lg bg-background p-4">
                {selectedDatasets.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-muted-foreground text-sm">Select a dataset to see preview</p>
                  </div>
                ) : !config.xAxis && !config.yAxis && !config.metric && !config.category ? (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-muted-foreground text-sm">Configure chart columns to see preview</p>
                  </div>
                ) : previewData.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <ChartRenderer
                    chart={{
                      id: "preview",
                      createdAt: null,
                      updatedAt: null,
                      title: title,
                      type: chartType.id,
                      config: config,
                      dataSourceIds: selectedDatasets,
                      userId: "",
                      query: null
                    }}
                    data={aggregatePreviewData(previewData, config, chartType.id)}
                    isPreview={true}
                  />
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="px-6 py-4 border-t">
            <Button
              variant="outline"
              onClick={onClose}
              data-testid="button-cancel-chart"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={createChartMutation.isPending || selectedDatasets.length === 0}
              data-testid="button-save-chart"
            >
              {createChartMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Chart"
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
