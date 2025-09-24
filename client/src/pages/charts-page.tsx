import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCharts, createChart, deleteChart } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ChartContainer from "@/components/dashboard/chart-container";
import { Plus, Trash2, BarChart3, LineChart, PieChart } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

export default function ChartsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: charts = [], isLoading } = useQuery({
    queryKey: ["/api/charts"],
    queryFn: () => getCharts(),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteChart,
    onSuccess: () => {
      toast({
        title: "Chart deleted",
        description: "The chart has been removed successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/charts"] });
    },
    onError: (error) => {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getChartIcon = (type: string) => {
    switch (type) {
      case 'line':
        return LineChart;
      case 'bar':
        return BarChart3;
      case 'pie':
        return PieChart;
      default:
        return BarChart3;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) return "just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Charts</h2>
          <p className="text-muted-foreground">
            Create and manage your data visualizations
          </p>
        </div>
        <Button className="bg-primary hover:bg-primary/90" data-testid="button-create-chart">
          <Plus className="mr-2 h-4 w-4" />
          Create Chart
        </Button>
      </div>

      {/* Quick Chart Templates */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Quick Templates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center gap-2"
              data-testid="button-template-line"
            >
              <LineChart className="h-6 w-6" />
              <span className="text-sm">Line Chart</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center gap-2"
              data-testid="button-template-bar"
            >
              <BarChart3 className="h-6 w-6" />
              <span className="text-sm">Bar Chart</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center gap-2"
              data-testid="button-template-pie"
            >
              <PieChart className="h-6 w-6" />
              <span className="text-sm">Pie Chart</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-48 w-full" />
              </CardContent>
            </Card>
          ))
        ) : charts.length > 0 ? (
          charts.map((chart) => {
            const IconComponent = getChartIcon(chart.type);
            return (
              <Card key={chart.id} className="hover:border-primary/30 transition-all">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <IconComponent className="h-5 w-5" />
                      {chart.title}
                    </CardTitle>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteMutation.mutate(chart.id)}
                      disabled={deleteMutation.isPending}
                      data-testid={`button-delete-chart-${chart.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Created {formatTimeAgo(chart.createdAt)}
                  </div>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    title=""
                    type={chart.type as any}
                    data={chart.config.data || []}
                    showTitle={false}
                  />
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card className="col-span-full p-8 text-center">
            <div className="text-muted-foreground">
              <BarChart3 className="mx-auto h-12 w-12 mb-4" />
              <p className="text-lg font-medium mb-2">No charts yet</p>
              <p>Create your first chart to visualize your data.</p>
              <Button className="mt-4" data-testid="button-create-first-chart">
                <Plus className="mr-2 h-4 w-4" />
                Create Chart
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* Sample Charts for Demo */}
      {charts.length === 0 && !isLoading && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Sample Visualizations</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartContainer
              title="Revenue Trends"
              type="line"
              data={[
                { name: "Jan", value: 400000 },
                { name: "Feb", value: 650000 },
                { name: "Mar", value: 800000 },
                { name: "Apr", value: 550000 },
                { name: "May", value: 1245000 },
                { name: "Jun", value: 750000 },
              ]}
            />
            
            <ChartContainer
              title="Product Categories"
              type="bar"
              data={[
                { name: "Electronics", value: 245000 },
                { name: "Clothing", value: 189500 },
                { name: "Home & Garden", value: 152200 },
                { name: "Sports", value: 98750 },
              ]}
            />
          </div>
        </div>
      )}
    </div>
  );
}
