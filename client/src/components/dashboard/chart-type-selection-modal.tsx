import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Sparkles, Trophy, Brain, MoreHorizontal, Box } from "lucide-react";
import {
  BigNumberIcon,
  TrendlineIcon,
  GaugeIcon,
  BarChartIcon,
  StackedBarIcon,
  GroupedBarIcon,
  LineChartIcon,
  MultiLineIcon,
  AreaChartIcon,
  PieChartIcon,
  DonutChartIcon,
  ScatterPlotIcon,
  BubbleChartIcon,
  HeatmapIcon,
  TableIcon,
  FunnelIcon,
  SankeyIcon,
  TreemapIcon,
  RadarIcon,
  MapIcon,
  WaterfallIcon,
  BoxPlotIcon,
  HistogramIcon,
  SunburstIcon,
  MultiValueCardIcon,
} from "@/components/icons/chart-icons";
import {
  CHART_CATALOG,
  getCategories,
  searchCharts,
  getChartsByCategory,
  type ChartCategory,
  type ChartType,
} from "@/lib/chart-catalog";

const categoryIcons: Record<string, any> = {
  Popular: Sparkles,
  KPI: GaugeIcon,
  Distribution: BarChartIcon,
  Evolution: LineChartIcon,
  Correlation: ScatterPlotIcon,
  "Part of a Whole": PieChartIcon,
  Ranking: Trophy,
  Map: MapIcon,
  Flow: FunnelIcon,
  Table: TableIcon,
  "Advanced-Analytics": Brain,
  Other: MoreHorizontal,
};

const chartTypeIcons: Record<string, any> = {
  big_number: BigNumberIcon,
  big_number_trendline: TrendlineIcon,
  gauge: GaugeIcon,
  bar: BarChartIcon,
  stacked_bar: StackedBarIcon,
  grouped_bar: GroupedBarIcon,
  line: LineChartIcon,
  multi_line: MultiLineIcon,
  smooth_line: LineChartIcon,
  stepped_line: LineChartIcon,
  area: AreaChartIcon,
  stacked_area: AreaChartIcon,
  pie: PieChartIcon,
  donut: DonutChartIcon,
  scatter: ScatterPlotIcon,
  bubble: BubbleChartIcon,
  heatmap: HeatmapIcon,
  calendar_heatmap: HeatmapIcon,
  boxplot: BoxPlotIcon,
  histogram: HistogramIcon,
  table: TableIcon,
  pivot_table: TableIcon,
  country_map: MapIcon,
  geojson_map: MapIcon,
  funnel: FunnelIcon,
  sankey: SankeyIcon,
  treemap: TreemapIcon,
  sunburst: SunburstIcon,
  waterfall: WaterfallIcon,
  radar: RadarIcon,
  multi_value_card: MultiValueCardIcon,
};

interface ChartTypeSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectChartType: (chartType: ChartType) => void;
}

export function ChartTypeSelectionModal({
  isOpen,
  onClose,
  onSelectChartType,
}: ChartTypeSelectionModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("All charts");
  const [searchQuery, setSearchQuery] = useState("");

  const categories = useMemo(() => getCategories(), []);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { "All charts": CHART_CATALOG.length };
    categories.forEach((cat) => {
      counts[cat] = getChartsByCategory(cat).length;
    });
    return counts;
  }, [categories]);

  const filteredCharts = useMemo(() => {
    let charts = CHART_CATALOG;

    if (selectedCategory !== "All charts") {
      charts = getChartsByCategory(selectedCategory as ChartCategory);
    }

    if (searchQuery.trim()) {
      charts = searchCharts(searchQuery).filter((chart) => {
        if (selectedCategory === "All charts") return true;
        return chart.category.includes(selectedCategory as ChartCategory);
      });
    }

    return charts;
  }, [selectedCategory, searchQuery]);

  const getChartIcon = (chartId: string) => {
    return chartTypeIcons[chartId] || BarChartIcon;
  };

  const handleChartClick = (chart: ChartType) => {
    onSelectChartType(chart);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] p-0" data-testid="dialog-chart-type-selection">
        <div className="flex h-[80vh]">
          {/* Left Sidebar */}
          <div className="w-64 border-r border-border bg-card">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Categories</h3>
                  <Button
                    variant={selectedCategory === "All charts" ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setSelectedCategory("All charts")}
                    data-testid="button-category-all-charts"
                  >
                    <Box className="mr-2 h-4 w-4" />
                    All charts
                    <span className="ml-auto text-xs">{categoryCounts["All charts"]}</span>
                  </Button>
                </div>

                <div className="space-y-1">
                  {categories.map((category) => {
                    const Icon = categoryIcons[category] || MoreHorizontal;
                    return (
                      <Button
                        key={category}
                        variant={selectedCategory === category ? "default" : "ghost"}
                        className="w-full justify-start"
                        onClick={() => setSelectedCategory(category)}
                        data-testid={`button-category-${category.toLowerCase().replace(/\s+/g, "-")}`}
                      >
                        <Icon className="mr-2 h-4 w-4" />
                        {category}
                        <span className="ml-auto text-xs">{categoryCounts[category]}</span>
                      </Button>
                    );
                  })}
                </div>
              </div>
            </ScrollArea>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            <DialogHeader className="px-6 py-4 border-b">
              <DialogTitle>Choose a Chart Type</DialogTitle>
              <DialogDescription>
                Select a visualization type for your data
              </DialogDescription>
            </DialogHeader>

            {/* Search Bar */}
            <div className="px-6 py-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search chart types..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-charts"
                />
              </div>
            </div>

            {/* Charts Grid */}
            <ScrollArea className="flex-1 p-6">
              {filteredCharts.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredCharts.map((chart) => {
                    const ChartIcon = getChartIcon(chart.id);
                    return (
                      <Card
                        key={chart.id}
                        className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
                        onClick={() => handleChartClick(chart)}
                        data-testid={`chart-type-card-${chart.id}`}
                      >
                        <CardContent className="p-4 text-center">
                          <div className="flex justify-center mb-3">
                            <ChartIcon className="h-12 w-12" />
                          </div>
                          <h3 className="font-semibold text-sm mb-1">{chart.name}</h3>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {chart.description}
                          </p>
                          <div className="flex flex-wrap gap-1 justify-center mt-2">
                            {chart.category.slice(0, 2).map((cat) => (
                              <Badge key={cat} variant="secondary" className="text-xs">
                                {cat}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                  <Search className="h-12 w-12 mb-4" />
                  <p>No charts found matching your search</p>
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
