import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, LayoutDashboard, Eye, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import type { Dashboard } from "@shared/schema";

interface DashboardWithCount extends Dashboard {
  kpiCount: number;
}

interface DashboardPageProps {
  onNavigateToDashboard?: (dashboardId: string) => void;
}

export default function DashboardPage({ onNavigateToDashboard }: DashboardPageProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingDashboard, setEditingDashboard] = useState<Dashboard | null>(null);
  const [newDashboardName, setNewDashboardName] = useState("");
  const [newDashboardDescription, setNewDashboardDescription] = useState("");
  const { toast } = useToast();

  const { data: dashboards = [], isLoading } = useQuery<DashboardWithCount[]>({
    queryKey: ["/api/dashboards"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      return apiRequest("POST", "/api/dashboards", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboards"] });
      setCreateDialogOpen(false);
      setNewDashboardName("");
      setNewDashboardDescription("");
      toast({
        title: "Success",
        description: "Dashboard created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create dashboard",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Dashboard> }) => {
      return apiRequest("PUT", `/api/dashboards/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboards"] });
      setEditingDashboard(null);
      setNewDashboardName("");
      setNewDashboardDescription("");
      toast({
        title: "Success",
        description: "Dashboard updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update dashboard",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/dashboards/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboards"] });
      toast({
        title: "Success",
        description: "Dashboard deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete dashboard",
        variant: "destructive",
      });
    },
  });

  const handleCreateDashboard = () => {
    if (!newDashboardName.trim()) {
      toast({
        title: "Error",
        description: "Dashboard name is required",
        variant: "destructive",
      });
      return;
    }
    createMutation.mutate({
      name: newDashboardName,
      description: newDashboardDescription || undefined,
    });
  };

  const handleUpdateDashboard = () => {
    if (!editingDashboard || !newDashboardName.trim()) {
      toast({
        title: "Error",
        description: "Dashboard name is required",
        variant: "destructive",
      });
      return;
    }
    updateMutation.mutate({
      id: editingDashboard.id,
      data: {
        name: newDashboardName,
        description: newDashboardDescription || null,
      },
    });
  };

  const openEditDialog = (dashboard: Dashboard) => {
    setEditingDashboard(dashboard);
    setNewDashboardName(dashboard.name);
    setNewDashboardDescription(dashboard.description || "");
  };

  const formatTimeAgo = (dateString: string | Date) => {
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Dashboards</h2>
          <p className="text-muted-foreground">
            Create and manage your custom dashboards
          </p>
        </div>
        <Dialog 
          open={createDialogOpen || editingDashboard !== null} 
          onOpenChange={(open) => {
            if (!open) {
              setCreateDialogOpen(false);
              setEditingDashboard(null);
              setNewDashboardName("");
              setNewDashboardDescription("");
            } else {
              setCreateDialogOpen(true);
            }
          }}
        >
          <DialogTrigger asChild>
            <Button data-testid="button-create-dashboard">
              <Plus className="mr-2 h-4 w-4" />
              Create Dashboard
            </Button>
          </DialogTrigger>
          <DialogContent data-testid="dialog-create-dashboard">
            <DialogHeader>
              <DialogTitle>
                {editingDashboard ? "Edit Dashboard" : "Create New Dashboard"}
              </DialogTitle>
              <DialogDescription>
                {editingDashboard 
                  ? "Update your dashboard details" 
                  : "Add a new dashboard to organize your KPIs"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="dashboard-name">Dashboard Name</Label>
                <Input
                  id="dashboard-name"
                  data-testid="input-dashboard-name"
                  placeholder="e.g., Sales Overview"
                  value={newDashboardName}
                  onChange={(e) => setNewDashboardName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dashboard-description">Description (Optional)</Label>
                <Textarea
                  id="dashboard-description"
                  data-testid="input-dashboard-description"
                  placeholder="Describe what this dashboard tracks..."
                  value={newDashboardDescription}
                  onChange={(e) => setNewDashboardDescription(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setCreateDialogOpen(false);
                  setEditingDashboard(null);
                  setNewDashboardName("");
                  setNewDashboardDescription("");
                }}
                data-testid="button-cancel-dashboard"
              >
                Cancel
              </Button>
              <Button
                onClick={editingDashboard ? handleUpdateDashboard : handleCreateDashboard}
                disabled={createMutation.isPending || updateMutation.isPending}
                data-testid="button-save-dashboard"
              >
                {editingDashboard ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Dashboards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-32 w-full mb-4" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : dashboards.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dashboards.map((dashboard) => (
            <Card 
              key={dashboard.id} 
              className="group cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105"
              onClick={() => onNavigateToDashboard?.(dashboard.id)}
              data-testid={`dashboard-card-${dashboard.id}`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-1">{dashboard.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {dashboard.description || "No description"}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                        data-testid={`button-dashboard-options-${dashboard.id}`}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditDialog(dashboard);
                        }}
                        data-testid={`button-edit-dashboard-${dashboard.id}`}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm("Are you sure you want to delete this dashboard?")) {
                            deleteMutation.mutate(dashboard.id);
                          }
                        }}
                        className="text-destructive"
                        data-testid={`button-delete-dashboard-${dashboard.id}`}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                {/* Dashboard preview area */}
                <div className="w-full h-32 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg mb-4 flex items-center justify-center border-2 border-dashed border-border">
                  <div className="text-center">
                    <LayoutDashboard className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {dashboard.kpiCount} {dashboard.kpiCount === 1 ? "KPI" : "KPIs"}
                    </p>
                  </div>
                </div>
                
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>Created: {dashboard.createdAt ? formatTimeAgo(dashboard.createdAt) : 'N/A'}</p>
                  <p>Updated: {dashboard.updatedAt ? formatTimeAgo(dashboard.updatedAt) : 'N/A'}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <div className="text-muted-foreground">
            <LayoutDashboard className="mx-auto h-12 w-12 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Dashboards Yet</h3>
            <p className="mb-4">Create your first dashboard to start organizing your KPIs</p>
            <Button onClick={() => setCreateDialogOpen(true)} data-testid="button-create-first-dashboard">
              <Plus className="mr-2 h-4 w-4" />
              Create Dashboard
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
