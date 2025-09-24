import { useQuery } from "@tanstack/react-query";
import { getKpis, getAiQueries } from "@/lib/api";
import KpiCard from "@/components/dashboard/kpi-card";
import ChartContainer from "@/components/dashboard/chart-container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Upload, TrendingUp, Brain, Mic } from "lucide-react";
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

  return (
    <div className="p-6 space-y-6">
      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Button className="bg-primary hover:bg-primary/90" data-testid="button-new-dataset">
          <Plus className="mr-2 h-4 w-4" />
          New Dataset
        </Button>
        <Button className="bg-secondary hover:bg-secondary/90" data-testid="button-create-chart">
          <TrendingUp className="mr-2 h-4 w-4" />
          Create Chart
        </Button>
        <Button variant="outline" data-testid="button-upload-data">
          <Upload className="mr-2 h-4 w-4" />
          Upload Data
        </Button>
      </div>

      {/* KPI Grid */}
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

      {/* Charts Grid */}
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
