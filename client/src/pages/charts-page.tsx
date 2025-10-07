import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  TrendingUp,
  Brain,
  MoreHorizontal,
  Search,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Trophy,
  Box,
} from "lucide-react";
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
  getTags,
  searchCharts,
  getChartsByCategory,
  type ChartCategory,
  type ChartType,
} from "@/lib/chart-catalog";

const categoryIcons: Record<string, any> = {
  Popular: Sparkles,
  KPI: GaugeIcon,
  Distribution: BarChartIcon,
  Evolution: TrendingUp,
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

export default function ChartsPage() {
  const [, setLocation] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState<string>("All charts");
  const [searchQuery, setSearchQuery] = useState("");
  const [tagsExpanded, setTagsExpanded] = useState(false);

  const categories = useMemo(() => getCategories(), []);
  const tags = useMemo(() => getTags(), []);

  // Get chart counts for each category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { "All charts": CHART_CATALOG.length };
    categories.forEach((cat) => {
      counts[cat] = getChartsByCategory(cat).length;
    });
    return counts;
  }, [categories]);

  // Filter charts based on selected category and search query
  const filteredCharts = useMemo(() => {
    let charts = CHART_CATALOG;

    // Filter by category
    if (selectedCategory !== "All charts") {
      charts = getChartsByCategory(selectedCategory as ChartCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      charts = searchCharts(searchQuery).filter((chart) => {
        if (selectedCategory === "All charts") return true;
        return chart.category.includes(selectedCategory as ChartCategory);
      });
    }

    return charts;
  }, [selectedCategory, searchQuery]);

  const handleChartClick = (chart: ChartType) => {
    setLocation(`/chart-builder?type=${chart.id}`);
  };

  const getChartIcon = (chartId: string) => {
    return chartTypeIcons[chartId] || BarChartIcon;
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Left Sidebar */}
      <div className="w-64 border-r border-border bg-card">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-4">
            {/* All Charts Button */}
            <Button
              variant={selectedCategory === "All charts" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setSelectedCategory("All charts")}
              data-testid="button-category-all-charts"
            >
              <Box className="mr-2 h-4 w-4" />
              All charts
              <span className="ml-auto text-xs opacity-70">
                {categoryCounts["All charts"]}
              </span>
            </Button>

            {/* Recommended Tags Section */}
            <div className="space-y-2">
              <Collapsible open={tagsExpanded} onOpenChange={setTagsExpanded}>
                <CollapsibleTrigger
                  className="flex items-center w-full text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="button-toggle-tags"
                >
                  {tagsExpanded ? (
                    <ChevronDown className="mr-2 h-3 w-3" />
                  ) : (
                    <ChevronRight className="mr-2 h-3 w-3" />
                  )}
                  Recommended tags
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 space-y-1">
                  {tags.map((tag) => (
                    <Button
                      key={tag}
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-xs pl-6"
                      data-testid={`button-tag-${tag}`}
                    >
                      # {tag}
                    </Button>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            </div>

            {/* Category Section */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground px-2">Category</h3>
              <div className="space-y-1">
                {categories.map((category) => {
                  const IconComponent = categoryIcons[category] || MoreHorizontal;
                  return (
                    <Button
                      key={category}
                      variant={selectedCategory === category ? "secondary" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => setSelectedCategory(category)}
                      data-testid={`button-category-${category.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      <IconComponent className="mr-2 h-4 w-4" />
                      {category}
                      <span className="ml-auto text-xs opacity-70">
                        {categoryCounts[category] || 0}
                      </span>
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Search Bar */}
        <div className="p-6 border-b border-border bg-card">
          <div className="relative max-w-2xl">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search all charts"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-chart-search"
            />
          </div>
        </div>

        {/* Chart Grid */}
        <ScrollArea className="flex-1">
          <div className="p-6">
            {filteredCharts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredCharts.map((chart) => {
                  const IconComponent = getChartIcon(chart.id);
                  return (
                    <Card
                      key={chart.id}
                      className="group cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all duration-200"
                      onClick={() => handleChartClick(chart)}
                      data-testid={`card-chart-${chart.id}`}
                    >
                      <CardContent className="p-4 space-y-3">
                        {/* Chart Icon/Thumbnail */}
                        <div className="aspect-square bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg flex items-center justify-center group-hover:from-primary/20 group-hover:to-secondary/20 transition-colors">
                          <IconComponent className="h-12 w-12 text-primary/70" />
                        </div>

                        {/* Chart Info */}
                        <div className="space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="text-sm font-medium leading-tight line-clamp-2">
                              {chart.name}
                            </h3>
                            {chart.isDeprecated && (
                              <Badge
                                variant="outline"
                                className="text-xs shrink-0 border-orange-500 text-orange-500"
                                data-testid={`badge-deprecated-${chart.id}`}
                              >
                                DEPRECATED
                              </Badge>
                            )}
                          </div>
                          {chart.requiresPlugin && (
                            <Badge
                              variant="outline"
                              className="text-xs border-blue-500 text-blue-500"
                            >
                              Plugin
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Search className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">
                  No charts found
                </h3>
                <p className="text-sm text-muted-foreground">
                  Try adjusting your search or selecting a different category
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
