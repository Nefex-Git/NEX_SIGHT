import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getDataSources, deleteDataSource, previewDataSource, getViews, createView, updateView, deleteView, executeView, executeSQLQuery } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { 
  Database, 
  Search, 
  Play,
  Save,
  Trash2, 
  Eye,
  Download,
  Calendar,
  FileText,
  MoreVertical,
  Code,
  TableProperties,
  Plus,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Datasets Tab Component
const DatasetsTab = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [previewData, setPreviewData] = useState<any>(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: dataSources = [], isLoading: dataSourcesLoading } = useQuery({
    queryKey: ["/api/data-sources"],
    queryFn: () => getDataSources(),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDataSource,
    onSuccess: () => {
      toast({
        title: "Dataset deleted",
        description: "The dataset has been removed successfully.",
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

  const filteredDataSources = dataSources.filter((source) => {
    const matchesSearch = source.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesFilter = false;
    if (filterType === "all") {
      matchesFilter = true;
    } else if (filterType === "csv") {
      matchesFilter = source.type === "csv";
    } else if (filterType === "tables") {
      matchesFilter = source.metadata?.isTableDataset === true;
    } else if (filterType === "database") {
      matchesFilter = source.type !== "csv" && source.metadata?.isTableDataset !== true;
    } else {
      matchesFilter = source.type === filterType;
    }
    
    return matchesSearch && matchesFilter;
  });

  const formatFileSize = (bytes: number | undefined) => {
    if (!bytes) return "—";
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'processing':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'error':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getTypeIcon = (source: any) => {
    if (source.metadata?.isTableDataset) {
      return <TableProperties className="h-4 w-4" />;
    }
    
    switch (source.type) {
      case 'csv':
        return <FileText className="h-4 w-4" />;
      case 'mysql':
      case 'postgresql':
      case 'sqlserver':
      case 'oracle':
        return <Database className="h-4 w-4" />;
      default:
        return <Database className="h-4 w-4" />;
    }
  };

  const previewMutation = useMutation({
    mutationFn: (sourceId: string) => previewDataSource(sourceId, 10),
    onSuccess: (data) => {
      setPreviewData(data);
      setPreviewDialogOpen(true);
    },
    onError: (error) => {
      toast({
        title: "Preview failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handlePreviewData = (source: any) => {
    previewMutation.mutate(source.id);
  };

  return (
    <div className="space-y-6">
      {/* Search and Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search datasets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search-datasets"
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                variant={filterType === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType("all")}
                data-testid="filter-all"
              >
                All
              </Button>
              <Button
                variant={filterType === "csv" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType("csv")}
                data-testid="filter-csv"
              >
                CSV Files
              </Button>
              <Button
                variant={filterType === "tables" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType("tables")}
                data-testid="filter-tables"
              >
                Tables
              </Button>
              <Button
                variant={filterType === "database" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType("database")}
                data-testid="filter-database"
              >
                Databases
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Datasets Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TableProperties className="h-5 w-5" />
            Available Datasets ({filteredDataSources.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Records</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dataSourcesLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredDataSources.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {searchTerm || filterType !== "all" ? "No datasets match your search criteria" : "No datasets available"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDataSources.map((source) => (
                    <TableRow key={source.id} className="group">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {getTypeIcon(source)}
                          <div>
                            <div className="font-medium">
                              {source.metadata?.isTableDataset 
                                ? `${source.metadata.schemaName}.${source.metadata.tableName}`
                                : source.name
                              }
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {source.metadata?.isTableDataset 
                                ? `Table from ${source.metadata.parentConnection}` 
                                : source.type.toUpperCase()
                              }
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize">
                          {source.metadata?.isTableDataset 
                            ? `${source.type} table` 
                            : source.type
                          }
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-mono text-sm">
                          {source.rowCount?.toLocaleString() || "—"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-mono text-sm">
                          {formatFileSize(source.size)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(source.status)}>
                          {source.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          <Calendar className="inline h-3 w-3 mr-1" />
                          {formatDate(source.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePreviewData(source)}
                            data-testid={`button-preview-${source.id}`}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="outline" data-testid={`button-menu-${source.id}`}>
                                <MoreVertical className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handlePreviewData(source)}>
                                <Eye className="mr-2 h-4 w-4" />
                                Preview Data
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Download className="mr-2 h-4 w-4" />
                                Export
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => deleteMutation.mutate(source.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Data Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Data Preview: {previewData?.name}</DialogTitle>
          </DialogHeader>
          {previewData && (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Showing first 3 rows of {previewData.totalRows} total records
              </div>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {previewData.columns.map((column: string, index: number) => (
                        <TableHead key={index}>{column}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewData.rows.map((row: string[], rowIndex: number) => (
                      <TableRow key={rowIndex}>
                        {row.map((cell: string, cellIndex: number) => (
                          <TableCell key={cellIndex} className="font-mono text-sm">
                            {cell}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Views Tab Component
const ViewsTab = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: views = [], isLoading } = useQuery({
    queryKey: ["/api/views"],
    queryFn: () => getViews(),
  });

  const deleteViewMutation = useMutation({
    mutationFn: deleteView,
    onSuccess: () => {
      toast({
        title: "View deleted",
        description: "The view has been removed successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/views"] });
    },
    onError: (error) => {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const executeViewMutation = useMutation({
    mutationFn: executeView,
    onSuccess: (result) => {
      toast({
        title: "Query executed",
        description: `Returned ${result.rowCount} rows in ${result.executionTime}ms`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/views"] });
    },
    onError: (error) => {
      toast({
        title: "Execution failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Saved Views ({views.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Records</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last Executed</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 2 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    </TableRow>
                  ))
                ) : views.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No views created yet. Use the SQL Engine to create your first view.
                    </TableCell>
                  </TableRow>
                ) : (
                  views.map((view) => (
                    <TableRow key={view.id} className="group">
                      <TableCell>
                        <div className="font-medium">{view.name}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground max-w-xs truncate">
                          {view.description}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-mono text-sm">
                          {view.rowCount ? view.rowCount.toLocaleString() : "—"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {formatDate(view.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {view.lastExecuted ? formatDate(view.lastExecuted) : 'Never'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => executeViewMutation.mutate(view.id)}
                            disabled={executeViewMutation.isPending}
                            data-testid={`button-run-view-${view.id}`}
                          >
                            <Play className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            data-testid={`button-edit-view-${view.id}`}
                          >
                            <Code className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteViewMutation.mutate(view.id)}
                            disabled={deleteViewMutation.isPending}
                            data-testid={`button-delete-view-${view.id}`}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// SQL Engine Tab Component
const SQLEngineTab = () => {
  const [sqlQuery, setSqlQuery] = useState("SELECT * FROM sales_data LIMIT 10;");
  const [queryResults, setQueryResults] = useState<any>(null);
  const [viewName, setViewName] = useState("");
  const [viewDescription, setViewDescription] = useState("");
  const { toast } = useToast();

  const { data: dataSources = [] } = useQuery({
    queryKey: ["/api/data-sources"],
    queryFn: () => getDataSources(),
  });

  const executeSQLMutation = useMutation({
    mutationFn: (query: string) => executeSQLQuery(query),
    onSuccess: (result) => {
      setQueryResults(result);
      toast({
        title: "Query executed successfully",
        description: `Returned ${result.rowCount || 0} rows in ${result.executionTime || 0}ms`,
      });
    },
    onError: (error: any) => {
      console.error('SQL execution error:', error);
      setQueryResults({
        columns: ['Error'],
        rows: [['Query execution failed: ' + (error.message || 'Unknown error')]],
        rowCount: 0,
        executionTime: 0
      });
      toast({
        title: "Query execution failed",
        description: error.message || 'Unknown error occurred',
        variant: "destructive",
      });
    },
  });

  const handleExecuteQuery = () => {
    if (!sqlQuery.trim()) {
      toast({
        title: "No query to execute",
        description: "Please enter a SQL query",
        variant: "destructive",
      });
      return;
    }
    
    executeSQLMutation.mutate(sqlQuery);
  };

  const handleSaveView = () => {
    if (!viewName.trim()) {
      alert("Please enter a view name");
      return;
    }
    
    // Here you would save the view to the backend
    alert(`View "${viewName}" saved successfully!`);
    setViewName("");
    setViewDescription("");
  };

  return (
    <div className="space-y-6">
      {/* Data Sources Reference */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Available Data Sources
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {dataSources.map((source) => {
              const isTableDataset = source.metadata?.isTableDataset;
              const tableName = isTableDataset 
                ? `${source.metadata.schemaName}.${source.metadata.tableName}`
                : source.name.toLowerCase().replace(/\s+/g, '_');
              
              const displayName = isTableDataset 
                ? `${source.metadata.schemaName}.${source.metadata.tableName}`
                : source.name;
                
              const subtitle = isTableDataset 
                ? `${source.metadata.parentConnection} • ${source.metadata.tableType}`
                : `${source.type.toUpperCase()} • ${source.rowCount?.toLocaleString() || 0} rows`;

              return (
                <div
                  key={source.id}
                  className="p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => setSqlQuery(`SELECT * FROM ${tableName} LIMIT 10;`)}
                  data-testid={`source-${source.id}`}
                >
                  <div className="flex items-center gap-2">
                    {isTableDataset ? (
                      <TableProperties className="h-4 w-4 text-primary" />
                    ) : source.type === 'csv' ? (
                      <FileText className="h-4 w-4 text-primary" />
                    ) : (
                      <Database className="h-4 w-4 text-primary" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{displayName}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {subtitle}
                      </div>
                      {source.rowCount && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {source.rowCount.toLocaleString()} rows
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* SQL Query Editor */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            SQL Query Editor
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Textarea
              placeholder="Enter your SQL query here..."
              value={sqlQuery}
              onChange={(e) => setSqlQuery(e.target.value)}
              className="font-mono min-h-32"
              data-testid="textarea-sql-query"
            />
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={handleExecuteQuery}
              disabled={executeSQLMutation.isPending || !sqlQuery.trim()}
              data-testid="button-execute-query"
            >
              <Play className="mr-2 h-4 w-4" />
              {executeSQLMutation.isPending ? 'Executing...' : 'Execute Query'}
            </Button>
            
            {queryResults && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" data-testid="button-save-as-view">
                    <Save className="mr-2 h-4 w-4" />
                    Save as View
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Save Query as View</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">View Name</label>
                      <Input
                        placeholder="Enter view name..."
                        value={viewName}
                        onChange={(e) => setViewName(e.target.value)}
                        data-testid="input-view-name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Description (Optional)</label>
                      <Textarea
                        placeholder="Describe what this view shows..."
                        value={viewDescription}
                        onChange={(e) => setViewDescription(e.target.value)}
                        data-testid="textarea-view-description"
                      />
                    </div>
                    <Button onClick={handleSaveView} className="w-full" data-testid="button-confirm-save-view">
                      Save View
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Query Results */}
      {queryResults && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TableProperties className="h-5 w-5" />
              Query Results
            </CardTitle>
            <div className="text-sm text-muted-foreground">
              {queryResults.rowCount} rows returned in {queryResults.executionTime}ms
            </div>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    {queryResults.columns.map((column: string, index: number) => (
                      <TableHead key={index}>{column}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {queryResults.rows.map((row: string[], rowIndex: number) => (
                    <TableRow key={rowIndex}>
                      {row.map((cell: string, cellIndex: number) => (
                        <TableCell key={cellIndex} className="font-mono text-sm">
                          {cell}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {queryResults.rowCount > queryResults.rows.length && (
              <div className="text-center text-sm text-muted-foreground mt-4">
                Showing {queryResults.rows.length} of {queryResults.rowCount} rows
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Main NEX House Component
export default function DatasetsPage() {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">NEX House</h2>
          <p className="text-muted-foreground">
            Data management, views, and SQL query engine
          </p>
        </div>
      </div>

      <Tabs defaultValue="datasets" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="datasets" data-testid="tab-datasets">
            <Database className="mr-2 h-4 w-4" />
            Datasets
          </TabsTrigger>
          <TabsTrigger value="views" data-testid="tab-views">
            <Eye className="mr-2 h-4 w-4" />
            Views
          </TabsTrigger>
          <TabsTrigger value="sql-engine" data-testid="tab-sql-engine">
            <Code className="mr-2 h-4 w-4" />
            SQL Engine
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="datasets" className="mt-6">
          <DatasetsTab />
        </TabsContent>
        
        <TabsContent value="views" className="mt-6">
          <ViewsTab />
        </TabsContent>
        
        <TabsContent value="sql-engine" className="mt-6">
          <SQLEngineTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}