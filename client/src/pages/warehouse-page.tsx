import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getDataSources, uploadDataSource, deleteDataSource } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Database, 
  Upload, 
  FileText, 
  Trash2, 
  Plus,
  Cloud,
  HardDrive,
  AlertCircle
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import ConnectorModal from "@/components/connectors/connector-modal";

export default function WarehousePage() {
  const [isDragging, setIsDragging] = useState(false);
  const [isConnectorModalOpen, setIsConnectorModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: dataSources = [], isLoading } = useQuery({
    queryKey: ["/api/data-sources"],
    queryFn: () => getDataSources(),
  });

  // Separate datasets (uploaded CSV files) from external data sources
  const datasets = dataSources.filter(source => source.type === 'csv');
  const externalDataSources = dataSources.filter(source => source.type !== 'csv');

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

  const handleFileUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    if (!file.name.endsWith('.csv')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a CSV file.",
        variant: "destructive",
      });
      return;
    }

    uploadMutation.mutate(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const formatFileSize = (bytes: number | undefined) => {
    if (!bytes) return "—";
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
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

  const renderDataSourceCards = (sources: typeof dataSources, emptyMessage: string) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {isLoading ? (
        Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-12 w-12 mb-4" />
              <Skeleton className="h-5 w-32 mb-2" />
              <Skeleton className="h-4 w-40 mb-4" />
              <div className="flex justify-between">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16" />
              </div>
            </CardContent>
          </Card>
        ))
      ) : sources.length > 0 ? (
        sources.map((source) => (
          <Card 
            key={source.id} 
            className="hover:border-primary/30 transition-all cursor-pointer"
            data-testid={`card-data-source-${source.id}`}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-primary/20">
                  {source.type === 'csv' ? (
                    <FileText className="text-primary text-xl" />
                  ) : source.type === 'mysql' ? (
                    <Database className="text-primary text-xl" />
                  ) : (
                    <Cloud className="text-primary text-xl" />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded ${
                    source.status === 'ready' 
                      ? 'bg-green-500/20 text-green-400'
                      : source.status === 'processing'
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {source.status}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteMutation.mutate(source.id)}
                    disabled={deleteMutation.isPending}
                    data-testid={`button-delete-${source.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <h3 className="font-semibold mb-2">{source.name}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {source.type.toUpperCase()} {source.type === 'csv' ? 'dataset' : 'data source'}
              </p>
              
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  {source.rowCount ? `${source.rowCount.toLocaleString()} rows` : '—'}
                </span>
                <span>{formatFileSize(source.size)}</span>
              </div>
              
              {source.columnCount && (
                <div className="mt-2 text-xs text-muted-foreground">
                  {source.columnCount} columns
                </div>
              )}
            </CardContent>
          </Card>
        ))
      ) : (
        <Card className="col-span-full p-8 text-center">
          <div className="text-muted-foreground">
            <FileText className="mx-auto h-12 w-12 mb-4" />
            <p className="text-lg font-medium mb-2">{emptyMessage}</p>
            <p>Start by uploading CSV files or connecting to external data sources.</p>
          </div>
        </Card>
      )}
    </div>
  );

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Data Warehouse</h2>
          <p className="text-muted-foreground">
            Manage your datasets and external data sources
          </p>
        </div>
      </div>

      <Tabs defaultValue="datasets" className="space-y-4">
        <TabsList>
          <TabsTrigger value="datasets" data-testid="tab-datasets">
            <FileText className="mr-2 h-4 w-4" />
            Datasets ({datasets.length})
          </TabsTrigger>
          <TabsTrigger value="sources" data-testid="tab-data-sources">
            <Database className="mr-2 h-4 w-4" />
            Data Sources ({externalDataSources.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="datasets" className="space-y-4">
          {/* Upload Area */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload CSV Files
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  Drop your CSV files here, or click to browse
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Supports CSV files up to 10MB
                </p>
                <Input
                  type="file"
                  accept=".csv"
                  onChange={(e) => handleFileUpload(e.target.files)}
                  className="max-w-xs mx-auto"
                  disabled={uploadMutation.isPending}
                  data-testid="input-file-upload"
                />
                {uploadMutation.isPending && (
                  <p className="text-sm text-primary mt-2">Uploading and processing...</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Datasets Grid */}
          {renderDataSourceCards(datasets, "No datasets yet")}
        </TabsContent>

        <TabsContent value="sources" className="space-y-4">
          {/* Connect Source Button */}
          <div className="flex justify-end">
            <Button 
              className="bg-primary hover:bg-primary/90" 
              onClick={() => setIsConnectorModalOpen(true)}
              data-testid="button-connect-source"
            >
              <Plus className="mr-2 h-4 w-4" />
              Connect Source
            </Button>
          </div>

          {/* Data Sources Grid */}
          {renderDataSourceCards(externalDataSources, "No external data sources yet")}
        </TabsContent>
      </Tabs>

      {/* Recent Activity */}
      {dataSources.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border">
              {dataSources
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, 5)
                .map((source) => (
                  <div key={source.id} className="py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded bg-primary/20">
                        <FileText className="text-primary text-sm" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{source.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {source.rowCount?.toLocaleString()} rows • {source.columnCount} columns • {formatFileSize(source.size)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">{formatTimeAgo(source.createdAt)}</p>
                      <span className={`text-xs ${
                        source.status === 'ready' 
                          ? 'text-green-400'
                          : source.status === 'processing'
                          ? 'text-yellow-400'
                          : 'text-red-400'
                      }`}>
                        {source.status}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      <ConnectorModal
        isOpen={isConnectorModalOpen}
        onClose={() => setIsConnectorModalOpen(false)}
        onConnectorAdded={() => {
          queryClient.invalidateQueries({ queryKey: ["/api/data-sources"] });
          setIsConnectorModalOpen(false);
        }}
      />
    </div>
  );
}