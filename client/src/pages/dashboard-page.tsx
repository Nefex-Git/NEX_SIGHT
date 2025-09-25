import { useQuery } from "@tanstack/react-query";
import { getKpis, getAiQueries } from "@/lib/api";
import KpiCard from "@/components/dashboard/kpi-card";
import ChartContainer from "@/components/dashboard/chart-container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Brain, Mic, Eye, MoreHorizontal, Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const { data: kpis = [], isLoading: kpisLoading } = useQuery({
    queryKey: ["/api/kpis"],
    queryFn: () => getKpis(),
  });

  const { data: recentQueries = [], isLoading: queriesLoading } = useQuery({
    queryKey: ["/api/ai/queries"],
    queryFn: () => getAiQueries(5),
  });

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

  // Mock dashboard data - in real implementation, this would come from API
  const dashboards = [
    {
      id: "1",
      name: "Sales Overview",
      description: "Revenue trends and sales KPIs",
      createdAt: "2024-01-15T10:30:00Z",
      lastViewed: "2024-01-20T15:45:00Z",
      chartCount: 4,
      kpiCount: 6,
      thumbnail: "/api/dashboards/1/thumbnail" // placeholder path
    },
    {
      id: "2", 
      name: "Product Analytics",
      description: "Product performance and inventory insights",
      createdAt: "2024-01-18T14:20:00Z",
      lastViewed: "2024-01-22T09:15:00Z",
      chartCount: 3,
      kpiCount: 4,
      thumbnail: "/api/dashboards/2/thumbnail"
    },
    {
      id: "3",
      name: "Customer Insights", 
      description: "Customer behavior and satisfaction metrics",
      createdAt: "2024-01-20T16:45:00Z",
      lastViewed: "2024-01-21T11:30:00Z",
      chartCount: 5,
      kpiCount: 3,
      thumbnail: "/api/dashboards/3/thumbnail"
    }
  ];

  const handleDashboardClick = (dashboardId: string) => {
    // In a real implementation, this would navigate to the specific dashboard
    console.log(`Opening dashboard: ${dashboardId}`);
    // For now, we'll just show an alert - in reality this would navigate to the dashboard
    alert(`Opening dashboard: ${dashboards.find(d => d.id === dashboardId)?.name}`);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Dashboard Previews */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">Your Dashboards</h2>
            <p className="text-muted-foreground">
              Click on any dashboard to open it
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {dashboards.map((dashboard) => (
            <Card 
              key={dashboard.id} 
              className="group cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105"
              onClick={() => handleDashboardClick(dashboard.id)}
              data-testid={`dashboard-preview-${dashboard.id}`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-1">{dashboard.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{dashboard.description}</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log(`Dashboard options: ${dashboard.id}`);
                    }}
                    data-testid={`dashboard-options-${dashboard.id}`}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Dashboard thumbnail/preview area */}
                <div className="w-full h-32 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg mb-4 flex items-center justify-center border-2 border-dashed border-border">
                  <div className="text-center">
                    <Eye className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Dashboard Preview</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                  <span>{dashboard.chartCount} charts</span>
                  <span>{dashboard.kpiCount} KPIs</span>
                </div>
                
                <div className="text-xs text-muted-foreground">
                  <p>Created: {formatTimeAgo(dashboard.createdAt)}</p>
                  <p>Last viewed: {formatTimeAgo(dashboard.lastViewed)}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Current Dashboard KPIs */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Current Dashboard KPIs</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpisLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-8 w-8 mb-4" />
              <Skeleton className="h-8 w-24 mb-2" />
              <Skeleton className="h-4 w-32" />
            </Card>
          ))
        ) : kpis.length > 0 ? (
          kpis.map((kpi) => (
            <KpiCard key={kpi.id} kpi={kpi} />
          ))
        ) : (
          <Card className="col-span-full p-8 text-center">
            <div className="text-muted-foreground">
              <TrendingUp className="mx-auto h-8 w-8 mb-4" />
              <p>No KPIs yet. Create some by asking questions to the AI assistant.</p>
            </div>
          </Card>
        )}
      </div>
      </div>

      {/* Current Dashboard Charts */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Current Dashboard Charts</h3>
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
          title="Top Products"
          type="bar"
          data={[
            { name: "SKU-AX910", value: 245000 },
            { name: "SKU-BX820", value: 189500 },
            { name: "SKU-CX730", value: 152200 },
            { name: "SKU-DX640", value: 98750 },
          ]}
        />
      </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent AI Queries */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Recent AI Queries
                <Button variant="link" size="sm" data-testid="link-view-all-queries">
                  View All
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {queriesLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex gap-4 p-4 border rounded-lg">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentQueries.length > 0 ? (
                <div className="space-y-4">
                  {recentQueries.map((query) => (
                    <div key={query.id} className="flex gap-4 p-4 rounded-lg bg-muted/30 border border-border/50">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                        {query.isVoiceQuery === 'true' ? (
                          <Mic className="h-4 w-4 text-white" />
                        ) : (
                          <Brain className="h-4 w-4 text-white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-muted-foreground">Q: {query.question}</p>
                        <p className="text-sm font-medium mt-1">
                          A: {query.answer.slice(0, 100)}
                          {query.answer.length > 100 && "..."}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {formatTimeAgo(query.createdAt)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <Brain className="mx-auto h-8 w-8 mb-4" />
                  <p>No questions yet. Ask something in NEX Assistant.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Data Sources</span>
                <span className="text-lg font-semibold" data-testid="text-data-sources-count">
                  {/* This would be populated from actual data */}
                  0
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Active Dashboards</span>
                <span className="text-lg font-semibold" data-testid="text-dashboards-count">1</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Queries Today</span>
                <span className="text-lg font-semibold" data-testid="text-queries-count">
                  {recentQueries.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Voice Queries</span>
                <span className="text-lg font-semibold" data-testid="text-voice-queries-count">
                  {recentQueries.filter(q => q.isVoiceQuery === 'true').length}
                </span>
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-border">
              <Button className="w-full bg-primary/20 text-primary hover:bg-primary/30" data-testid="button-quick-setup">
                <Plus className="mr-2 h-4 w-4" />
                Quick Setup
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
