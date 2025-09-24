import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getDataSources, deleteDataSource } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  Filter,
  Trash2, 
  Eye,
  Download,
  Calendar,
  FileText,
  MoreVertical
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function DatasetsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: dataSources = [], isLoading } = useQuery({
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
    const matchesFilter = filterType === "all" || source.type === filterType;
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'csv':
        return <FileText className="h-4 w-4" />;
      case 'mysql':
      case 'postgres':
        return <Database className="h-4 w-4" />;
      default:
        return <Database className="h-4 w-4" />;
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Datasets</h2>
          <p className="text-muted-foreground">
            Browse and manage your data tables and sources
          </p>
        </div>
        <Button className="bg-primary hover:bg-primary/90" data-testid="button-add-dataset">
          <Database className="mr-2 h-4 w-4" />
          Add Dataset
        </Button>
      </div>

      {/* Search and Filter Bar */}
      <Card className="mb-6">
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
                CSV
              </Button>
              <Button
                variant={filterType === "mysql" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType("mysql")}
                data-testid="filter-mysql"
              >
                Database
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Datasets Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>All Datasets ({filteredDataSources.length})</span>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Filter className="h-4 w-4" />
              <span>Filter & Sort</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                  <Skeleton className="h-10 w-10" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-8 w-8" />
                </div>
              ))}
            </div>
          ) : filteredDataSources.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Rows</TableHead>
                  <TableHead>Columns</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDataSources.map((source) => (
                  <TableRow key={source.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/20">
                          {getTypeIcon(source.type)}
                        </div>
                        <div>
                          <div className="font-medium">{source.name}</div>
                          {source.filename && (
                            <div className="text-sm text-muted-foreground">
                              {source.filename}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {source.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={getStatusColor(source.status)}
                      >
                        {source.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatFileSize(source.size)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {source.rowCount?.toLocaleString() || '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {source.columnCount || '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(source.createdAt)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            data-testid={`button-actions-${source.id}`}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Download className="mr-2 h-4 w-4" />
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => deleteMutation.mutate(source.id)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <Database className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {searchTerm || filterType !== "all" 
                  ? "No datasets found" 
                  : "No datasets yet"
                }
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || filterType !== "all"
                  ? "Try adjusting your search or filter criteria."
                  : "Upload your first dataset to get started with data analysis."
                }
              </p>
              {(!searchTerm && filterType === "all") && (
                <Button data-testid="button-upload-first-dataset">
                  <Database className="mr-2 h-4 w-4" />
                  Upload Dataset
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
