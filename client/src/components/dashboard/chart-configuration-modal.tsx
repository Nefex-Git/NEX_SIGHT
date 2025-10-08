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

interface ChartConfigurationModalProps {
  isOpen: boolean;
  onClose: () => void;
  chartType: ChartType;
  dashboardId: string;
  onBack: () => void;
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

  // Fetch all available datasets
  const { data: dataSources = [], isLoading: dataSourcesLoading } = useQuery<DataSource[]>({
    queryKey: ["/api/data-sources"],
    enabled: isOpen,
  });

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
              return data.columns || [];
            }
            return [];
          })
        );

        const allColumns = Array.from(new Set(columnSets.flat()));
        setAvailableColumns(allColumns);
      } catch (error) {
        console.error("Failed to fetch columns:", error);
        setAvailableColumns([]);
      }
    };

    fetchColumns();
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
      <DialogContent className="max-w-4xl max-h-[90vh] p-0" data-testid="dialog-chart-configuration">
        <div className="flex flex-col h-[80vh]">
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
              <div>
                <DialogTitle>Configure {chartType.name}</DialogTitle>
                <DialogDescription>{chartType.description}</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <ScrollArea className="flex-1 p-6">
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
