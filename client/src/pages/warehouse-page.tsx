import { useState } from "react";
import DatabaseConnectorForm from "@/components/database-connector-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getDataSources, uploadDataSource, deleteDataSource, getConnections, getConnectionTables, type Connection } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { 
  Database, 
  FileText, 
  Trash2, 
  Plus,
  Edit2,
  Settings,
  ChevronDown,
  ChevronRight,
  AlertCircle
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import TableSelectionModal from "@/components/table-selection-modal";

export default function WarehousePage() {
  const [isConnectorModalOpen, setIsConnectorModalOpen] = useState(false);
  const [isCreatingConnection, setIsCreatingConnection] = useState(false);
  const [isTableSelectionOpen, setIsTableSelectionOpen] = useState(false);
  const [editingConnection, setEditingConnection] = useState<Connection | null>(null);
  const [pendingConnection, setPendingConnection] = useState<{
    id?: string;
    name: string;
    type: string;
    config: any;
  } | null>(null);
  const [expandedConnections, setExpandedConnections] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: dataSources = [], isLoading: dataSourcesLoading } = useQuery({
    queryKey: ["/api/data-sources"],
    queryFn: () => getDataSources(),
  });

  const { data: connections = [], isLoading: connectionsLoading } = useQuery({
    queryKey: ["/api/connections"],
    queryFn: () => getConnections(),
  });

  // Filter only CSV datasets
  const csvDatasets = dataSources.filter(source => source.type === 'csv');

  const uploadMutation = useMutation({
    mutationFn: uploadDataSource,
    onSuccess: () => {
      toast({
        title: "Upload successful",
        description: "Your data has been uploaded and processed.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/data-sources"] });
    },
    onError: (error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDataSource,
    onSuccess: () => {
      toast({
        title: "Data source deleted",
        description: "The data source has been removed successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/data-sources"] });
    },
    onError: (error) => {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDatabaseConnectionSubmit = (name: string, type: string, config: any) => {
    // Store the connection details and show table selection modal
    setPendingConnection({ 
      id: editingConnection?.id, 
      name, 
      type, 
      config 
    });
    setIsConnectorModalOpen(false);
    setIsTableSelectionOpen(true);
  };

  const handleTablesSelected = async (selectedTables: string[], deselectedTableIds?: number[]) => {
    try {
      // If editing and there are deselected tables, delete them first
      if (editingConnection && deselectedTableIds && deselectedTableIds.length > 0) {
        await Promise.all(deselectedTableIds.map(id => deleteMutation.mutateAsync(id)));
      }

      toast({
        title: editingConnection ? "Connection updated" : "Tables imported successfully",
        description: `${selectedTables.length} table(s) have been added to your datasets.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/data-sources"] });
      queryClient.invalidateQueries({ queryKey: ["/api/connections"] });
      setIsTableSelectionOpen(false);
      setPendingConnection(null);
      setEditingConnection(null);
    } catch (error) {
      toast({
        title: "Error updating connection",
        description: "Failed to update connection. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleTableSelectionClose = () => {
    setIsTableSelectionOpen(false);
    setPendingConnection(null);
    setEditingConnection(null);
  };

  const handleEditConnection = (connection: Connection) => {
    setEditingConnection(connection);
    setIsConnectorModalOpen(true);
  };

  const formatFileSize = (bytes: number | undefined) => {
    if (!bytes) return "—";
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const toggleConnectionExpanded = (connectionId: string) => {
    const newExpanded = new Set(expandedConnections);
    if (newExpanded.has(connectionId)) {
      newExpanded.delete(connectionId);
    } else {
      newExpanded.add(connectionId);
    }
    setExpandedConnections(newExpanded);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
      case 'ready':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'disconnected':
      case 'error':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">NEX Connect</h2>
          <p className="text-muted-foreground">
            Manage your data sources and connections
          </p>
        </div>
        <Button 
          className="bg-primary hover:bg-primary/90" 
          onClick={() => {
            setEditingConnection(null);
            setIsConnectorModalOpen(true);
          }}
          data-testid="button-connect-source"
        >
          <Plus className="mr-2 h-4 w-4" />
          Connect Source
        </Button>
      </div>

      {/* Database Connections Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Database Connections</h3>
          {connections.length > 0 && (
            <Badge variant="secondary">{connections.length}</Badge>
          )}
        </div>

        {connectionsLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : connections.length > 0 ? (
          <div className="space-y-3">
            {connections.map((connection) => (
              <ConnectionCard
                key={connection.id}
                connection={connection}
                dataSources={dataSources}
                isExpanded={expandedConnections.has(connection.id)}
                onToggleExpand={() => toggleConnectionExpanded(connection.id)}
                onEdit={() => handleEditConnection(connection)}
                onDelete={(tableId: string) => deleteMutation.mutate(tableId)}
                getStatusColor={getStatusColor}
              />
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <Database className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No database connections yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Click "Connect Source" to add your first connection
            </p>
          </Card>
        )}
      </div>

      {/* CSV Datasets Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          <h3 className="text-lg font-semibold">CSV Datasets</h3>
          {csvDatasets.length > 0 && (
            <Badge variant="secondary">{csvDatasets.length}</Badge>
          )}
        </div>

        {/* CSV Datasets Grid */}
        {dataSourcesLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : csvDatasets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {csvDatasets.map((dataset) => (
              <Card 
                key={dataset.id} 
                className="hover:border-primary/30 transition-all"
                data-testid={`card-dataset-${dataset.id}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 rounded-lg bg-primary/20">
                      <FileText className="text-primary h-5 w-5" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(dataset.status)}>
                        {dataset.status}
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteMutation.mutate(dataset.id)}
                        disabled={deleteMutation.isPending}
                        data-testid={`button-delete-${dataset.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <h4 className="font-semibold mb-1">{dataset.name}</h4>
                  <p className="text-xs text-muted-foreground mb-3">CSV dataset</p>
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {dataset.rowCount ? `${dataset.rowCount.toLocaleString()} rows` : '—'}
                    </span>
                    <span>{formatFileSize(dataset.size)}</span>
                  </div>
                  
                  {dataset.columnCount && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      {dataset.columnCount} columns
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No CSV datasets yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Upload CSV files to get started
            </p>
          </Card>
        )}
      </div>
      
      <Dialog open={isConnectorModalOpen} onOpenChange={setIsConnectorModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingConnection ? 'Edit Connection' : 'Connect Data Source'}
            </DialogTitle>
          </DialogHeader>
          <DatabaseConnectorForm
            onSubmit={handleDatabaseConnectionSubmit}
            onFileUpload={(file, name) => {
              uploadMutation.mutate(file);
              setIsConnectorModalOpen(false);
            }}
            isLoading={isCreatingConnection || uploadMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Table Selection Modal */}
      {pendingConnection && (
        <TableSelectionModal
          isOpen={isTableSelectionOpen}
          onClose={handleTableSelectionClose}
          connectionName={pendingConnection.name}
          databaseType={pendingConnection.type}
          connectionConfig={pendingConnection.config}
          onTablesSelected={handleTablesSelected}
          connectionId={pendingConnection.id}
        />
      )}
    </div>
  );
}

// Connection Card Component
interface ConnectionCardProps {
  connection: Connection;
  dataSources: any[];
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onDelete: (tableId: string) => void;
  getStatusColor: (status: string) => string;
}

function ConnectionCard({ 
  connection, 
  dataSources, 
  isExpanded, 
  onToggleExpand, 
  onEdit,
  onDelete,
  getStatusColor 
}: ConnectionCardProps) {
  // Get tables for this connection
  const connectionTables = dataSources.filter(
    ds => ds.connectionId === connection.id
  );

  return (
    <Card className="hover:bg-muted/50 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleExpand}
              data-testid={`button-expand-${connection.id}`}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
            
            <div className="p-2 rounded-lg bg-primary/20">
              <Database className="h-5 w-5 text-primary" />
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold" data-testid={`text-connection-name-${connection.id}`}>
                  {connection.name}
                </h4>
                <Badge variant="outline" className="capitalize text-xs">
                  {connection.type}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {connectionTables.length} table(s) imported
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(connection.status)}>
              {connection.status}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={onEdit}
              data-testid={`button-edit-${connection.id}`}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {isExpanded && (
          <div className="mt-4 ml-9 space-y-2">
            {connectionTables.length === 0 ? (
              <div className="text-sm text-muted-foreground py-4 text-center">
                No tables imported from this connection
              </div>
            ) : (
              connectionTables.map((table) => (
                <div 
                  key={table.id} 
                  className="flex items-center justify-between p-2 rounded border bg-background"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-sm" data-testid={`text-table-name-${table.id}`}>
                      {table.name}
                    </span>
                    {table.rowCount && (
                      <Badge variant="outline" className="text-xs">
                        {table.rowCount.toLocaleString()} rows
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(table.id)}
                    data-testid={`button-delete-table-${table.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
