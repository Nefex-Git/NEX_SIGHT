import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Database, 
  Table, 
  Search, 
  CheckSquare, 
  Square,
  Loader2,
  Info,
  BarChart3
} from "lucide-react";

interface TableSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  connectionName: string;
  databaseType: string;
  connectionConfig: any;
  onTablesSelected: (selectedTables: string[]) => void;
}

interface DatabaseTable {
  name: string;
  schema: string;
  type: 'table' | 'view';
  rowCount?: number;
  columns: Array<{
    name: string;
    type: string;
    nullable: boolean;
    isPrimaryKey: boolean;
  }>;
}

interface SchemaInfo {
  schemas: string[];
  tables: DatabaseTable[];
}

export default function TableSelectionModal({
  isOpen,
  onClose,
  connectionName,
  databaseType,
  connectionConfig,
  onTablesSelected
}: TableSelectionModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTables, setSelectedTables] = useState<Set<string>>(new Set());
  const [isCreatingDatasets, setIsCreatingDatasets] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch schema information
  const { data: schemaInfo, isLoading: isLoadingSchema, error } = useQuery({
    queryKey: ['/api/database-connectors/schema', databaseType, connectionConfig],
    queryFn: async () => {
      const response = await apiRequest('POST', '/api/database-connectors/schema', {
        type: databaseType,
        config: connectionConfig
      });
      return response.json() as Promise<SchemaInfo>;
    },
    enabled: isOpen && !!databaseType && !!connectionConfig,
  });

  // Reset selection when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedTables(new Set());
      setSearchTerm("");
    }
  }, [isOpen]);

  const createDatasetsMutation = useMutation({
    mutationFn: async (tableIds: string[]) => {
      const results = await Promise.all(
        tableIds.map(async (tableId) => {
          const table = schemaInfo?.tables.find(t => `${t.schema}.${t.name}` === tableId);
          if (!table) throw new Error(`Table ${tableId} not found`);

          return apiRequest('POST', '/api/data-sources/table', {
            connectionName,
            databaseType,
            connectionConfig,
            tableName: table.name,
            schemaName: table.schema,
            tableMetadata: table
          });
        })
      );
      return results;
    },
    onSuccess: (results) => {
      toast({
        title: "Tables imported successfully",
        description: `${results.length} table(s) have been added to your datasets.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/data-sources"] });
      onTablesSelected(Array.from(selectedTables));
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : 'Failed to import tables',
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsCreatingDatasets(false);
    },
  });

  const handleTableToggle = (tableId: string) => {
    const newSelection = new Set(selectedTables);
    if (newSelection.has(tableId)) {
      newSelection.delete(tableId);
    } else {
      newSelection.add(tableId);
    }
    setSelectedTables(newSelection);
  };

  const handleSelectAll = () => {
    if (!schemaInfo) return;
    
    const filteredTableIds = schemaInfo.tables
      .filter(table => 
        table.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        table.schema.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .map(table => `${table.schema}.${table.name}`);

    if (selectedTables.size === filteredTableIds.length) {
      // Deselect all filtered tables
      const newSelection = new Set(selectedTables);
      filteredTableIds.forEach(id => newSelection.delete(id));
      setSelectedTables(newSelection);
    } else {
      // Select all filtered tables
      const newSelection = new Set(selectedTables);
      filteredTableIds.forEach(id => newSelection.add(id));
      setSelectedTables(newSelection);
    }
  };

  const handleImportSelected = () => {
    if (selectedTables.size === 0) {
      toast({
        title: "No tables selected",
        description: "Please select at least one table to import.",
        variant: "destructive",
      });
      return;
    }
    
    setIsCreatingDatasets(true);
    createDatasetsMutation.mutate(Array.from(selectedTables));
  };

  const filteredTables = schemaInfo?.tables.filter(table => 
    table.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    table.schema.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const groupedBySchema = filteredTables.reduce((acc, table) => {
    if (!acc[table.schema]) {
      acc[table.schema] = [];
    }
    acc[table.schema].push(table);
    return acc;
  }, {} as Record<string, DatabaseTable[]>);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Select Tables from {connectionName}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Choose the tables you want to import as datasets. Each selected table will become an individual dataset in NEX House.
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col space-y-4">
          {/* Search and Controls */}
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tables..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search-tables"
              />
            </div>
            <Button
              variant="outline"
              onClick={handleSelectAll}
              disabled={isLoadingSchema || filteredTables.length === 0}
              data-testid="button-select-all"
            >
              {selectedTables.size === filteredTables.length && filteredTables.length > 0 ? (
                <>
                  <Square className="h-4 w-4 mr-2" />
                  Deselect All
                </>
              ) : (
                <>
                  <CheckSquare className="h-4 w-4 mr-2" />
                  Select All
                </>
              )}
            </Button>
          </div>

          {/* Loading State */}
          {isLoadingSchema && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Loading database schema...</span>
            </div>
          )}

          {/* Error State */}
          {error && (
            <Card className="border-destructive">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-destructive">
                  <Info className="h-4 w-4" />
                  <span>Failed to load database schema: {error instanceof Error ? error.message : 'Unknown error'}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tables List */}
          {schemaInfo && !isLoadingSchema && (
            <div className="flex-1 overflow-y-auto space-y-4">
              {Object.entries(groupedBySchema).map(([schema, tables]) => (
                <Card key={schema}>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Database className="h-4 w-4" />
                      Schema: {schema}
                      <Badge variant="secondary">{tables.length} table(s)</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {tables.map((table) => {
                        const tableId = `${table.schema}.${table.name}`;
                        const isSelected = selectedTables.has(tableId);
                        
                        return (
                          <div
                            key={tableId}
                            className={`
                              p-3 border rounded-lg cursor-pointer transition-all
                              ${isSelected 
                                ? 'border-primary bg-primary/5 shadow-sm' 
                                : 'border-border hover:border-primary/50 hover:bg-muted/50'
                              }
                            `}
                            onClick={() => handleTableToggle(tableId)}
                            data-testid={`table-${tableId}`}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <Checkbox 
                                checked={isSelected}
                                onChange={() => handleTableToggle(tableId)}
                                className="pointer-events-none"
                              />
                              <Table className="h-4 w-4 text-primary" />
                              <span className="font-medium text-sm">{table.name}</span>
                              <Badge variant={table.type === 'view' ? 'outline' : 'secondary'} className="text-xs">
                                {table.type}
                              </Badge>
                            </div>
                            
                            <div className="text-xs text-muted-foreground space-y-1">
                              <div className="flex items-center gap-1">
                                <BarChart3 className="h-3 w-3" />
                                {table.columns.length} column(s)
                                {table.rowCount && (
                                  <span className="ml-1">• {table.rowCount.toLocaleString()} rows</span>
                                )}
                              </div>
                              <div className="truncate">
                                Columns: {table.columns.slice(0, 3).map(col => col.name).join(', ')}
                                {table.columns.length > 3 && '...'}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {filteredTables.length === 0 && !isLoadingSchema && (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm ? 'No tables match your search.' : 'No tables found in this database.'}
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              {selectedTables.size} table(s) selected
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} disabled={isCreatingDatasets}>
                Cancel
              </Button>
              <Button 
                onClick={handleImportSelected}
                disabled={selectedTables.size === 0 || isCreatingDatasets}
                data-testid="button-import-tables"
              >
                {isCreatingDatasets ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Importing...
                  </>
                ) : (
                  `Import ${selectedTables.size} Table(s)`
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}