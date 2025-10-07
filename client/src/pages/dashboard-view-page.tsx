import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, ArrowLeft, LayoutDashboard, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import KpiCard from "@/components/dashboard/kpi-card";
import type { Dashboard, KPI } from "@shared/schema";

interface DashboardWithKpis extends Dashboard {
  kpis: KPI[];
}

interface DashboardViewPageProps {
  dashboardId: string;
  onBack: () => void;
}

export default function DashboardViewPage({ dashboardId, onBack }: DashboardViewPageProps) {
  const [addKpiDialogOpen, setAddKpiDialogOpen] = useState(false);
  const [kpiQuestion, setKpiQuestion] = useState("");
  const [kpiValue, setKpiValue] = useState("");
  const [kpiUnit, setKpiUnit] = useState("");
  const { toast } = useToast();

  const { data: dashboard, isLoading } = useQuery<DashboardWithKpis>({
    queryKey: ["/api/dashboards", dashboardId],
    queryFn: async () => {
      const response = await fetch(`/api/dashboards/${dashboardId}`);
      if (!response.ok) throw new Error("Failed to fetch dashboard");
      return response.json();
    },
  });

  const addKpiMutation = useMutation({
    mutationFn: async (data: { question: string; value: string; unit?: string; dashboardId: string }) => {
      return apiRequest("POST", "/api/kpis", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboards", dashboardId] });
      queryClient.invalidateQueries({ queryKey: ["/api/kpis"] });
      setAddKpiDialogOpen(false);
      setKpiQuestion("");
      setKpiValue("");
      setKpiUnit("");
      toast({
        title: "Success",
        description: "KPI added successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add KPI",
        variant: "destructive",
      });
    },
  });

  const handleAddKpi = () => {
    if (!kpiQuestion.trim() || !kpiValue.trim()) {
      toast({
        title: "Error",
        description: "Question and value are required",
        variant: "destructive",
      });
      return;
    }
    addKpiMutation.mutate({
      question: kpiQuestion,
      value: kpiValue,
      unit: kpiUnit || undefined,
      dashboardId: dashboardId,
    });
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="flex-1">
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-8 w-8 mb-4" />
              <Skeleton className="h-8 w-24 mb-2" />
              <Skeleton className="h-4 w-32" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="p-6">
        <Card className="p-12 text-center">
          <div className="text-muted-foreground">
            <LayoutDashboard className="mx-auto h-12 w-12 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Dashboard Not Found</h3>
            <p className="mb-4">The dashboard you're looking for doesn't exist</p>
            <Button onClick={onBack} data-testid="button-back-to-dashboards">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboards
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold">{dashboard.name}</h2>
            <p className="text-muted-foreground">
              {dashboard.description || "No description"}
            </p>
          </div>
        </div>
        <Dialog open={addKpiDialogOpen} onOpenChange={setAddKpiDialogOpen}>
          <Button onClick={() => setAddKpiDialogOpen(true)} data-testid="button-add-kpi">
            <Plus className="mr-2 h-4 w-4" />
            Add KPI
          </Button>
          <DialogContent data-testid="dialog-add-kpi">
            <DialogHeader>
              <DialogTitle>Add New KPI</DialogTitle>
              <DialogDescription>
                Add a new KPI to track on this dashboard
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="kpi-question">KPI Name/Question</Label>
                <Input
                  id="kpi-question"
                  data-testid="input-kpi-question"
                  placeholder="e.g., Total Revenue"
                  value={kpiQuestion}
                  onChange={(e) => setKpiQuestion(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="kpi-value">Value</Label>
                <Input
                  id="kpi-value"
                  data-testid="input-kpi-value"
                  placeholder="e.g., 125000"
                  value={kpiValue}
                  onChange={(e) => setKpiValue(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="kpi-unit">Unit (Optional)</Label>
                <Input
                  id="kpi-unit"
                  data-testid="input-kpi-unit"
                  placeholder="e.g., USD, users, etc."
                  value={kpiUnit}
                  onChange={(e) => setKpiUnit(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setAddKpiDialogOpen(false);
                  setKpiQuestion("");
                  setKpiValue("");
                  setKpiUnit("");
                }}
                data-testid="button-cancel-kpi"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddKpi}
                disabled={addKpiMutation.isPending}
                data-testid="button-save-kpi"
              >
                Add KPI
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPIs Grid */}
      {dashboard.kpis && dashboard.kpis.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {dashboard.kpis.map((kpi) => (
            <KpiCard key={kpi.id} kpi={kpi as KPI} />
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <div className="text-muted-foreground">
            <TrendingUp className="mx-auto h-12 w-12 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No KPIs Yet</h3>
            <p className="mb-4">Add your first KPI to start tracking metrics</p>
            <Button onClick={() => setAddKpiDialogOpen(true)} data-testid="button-add-first-kpi">
              <Plus className="mr-2 h-4 w-4" />
              Add KPI
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
