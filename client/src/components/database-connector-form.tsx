import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, CheckCircle, XCircle, Database, Cloud, FileText, Zap, Server } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface DatabaseConnectorSpec {
  name: string;
  displayName: string;
  description: string;
  icon: string;
  category: 'relational' | 'warehouse' | 'nosql' | 'timeseries' | 'file' | 'api';
  requiresHost: boolean;
  requiresPort: boolean;
  requiresDatabase: boolean;
  requiresCredentials: boolean;
  defaultPort?: number;
  connectionStringTemplate: string;
  npmPackages: string[];
  testQuery: string;
  supportsSchema: boolean;
  supportsSSL: boolean;
}

interface DatabaseConnectionConfig {
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  sslMode?: 'require' | 'prefer' | 'allow' | 'disable';
  projectId?: string;
  account?: string;
  region?: string;
  warehouse?: string;
  role?: string;
  filePath?: string;
  baseUrl?: string;
  apiKey?: string;
  options?: Record<string, any>;
}

interface ConnectionTestResult {
  success: boolean;
  message: string;
  latency?: number;
  metadata?: {
    serverVersion?: string;
    schemas?: string[];
  };
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'relational': return Database;
    case 'warehouse': return Cloud;
    case 'file': return FileText;
    case 'nosql': return Zap;
    case 'api': return Server;
    default: return Database;
  }
};

// Dynamic schema based on connector requirements
const createConnectionSchema = (connector: DatabaseConnectorSpec | null) => {
  if (!connector) return z.object({});

  const schema: any = {};

  if (connector.requiresHost) {
    schema.host = z.string().min(1, 'Host is required');
  }
  if (connector.requiresPort) {
    schema.port = z.number().min(1).max(65535);
  }
  if (connector.requiresDatabase) {
    schema.database = z.string().min(1, 'Database is required');
  }
  if (connector.requiresCredentials) {
    schema.username = z.string().min(1, 'Username is required');
    schema.password = z.string().min(1, 'Password is required');
  }

  // Cloud-specific fields
  if (connector.name === 'bigquery') {
    schema.projectId = z.string().min(1, 'Project ID is required');
  }
  if (connector.name === 'snowflake') {
    schema.account = z.string().min(1, 'Account is required');
    schema.warehouse = z.string().min(1, 'Warehouse is required');
    schema.role = z.string().optional();
  }

  // File-based
  if (connector.category === 'file') {
    schema.filePath = z.string().min(1, 'File path is required');
  }

  // SSL support
  if (connector.supportsSSL) {
    schema.sslMode = z.enum(['require', 'prefer', 'allow', 'disable']).optional();
  }

  return z.object(schema);
};

interface DatabaseConnectorFormProps {
  onSubmit: (name: string, type: string, config: DatabaseConnectionConfig) => void;
  isLoading?: boolean;
}

export default function DatabaseConnectorForm({ onSubmit, isLoading }: DatabaseConnectorFormProps) {
  const [selectedConnector, setSelectedConnector] = useState<DatabaseConnectorSpec | null>(null);
  const [connectionTest, setConnectionTest] = useState<ConnectionTestResult | null>(null);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionName, setConnectionName] = useState('');
  const { toast } = useToast();

  // Fetch available connectors
  const { data: connectors = [], isLoading: loadingConnectors } = useQuery({
    queryKey: ['/api/database-connectors'],
  });

  // Group connectors by category
  const connectorsByCategory = (connectors as DatabaseConnectorSpec[]).reduce((acc: Record<string, DatabaseConnectorSpec[]>, connector: DatabaseConnectorSpec) => {
    if (!acc[connector.category]) {
      acc[connector.category] = [];
    }
    acc[connector.category].push(connector);
    return acc;
  }, {});

  // Dynamic form schema based on selected connector
  const connectionSchema = createConnectionSchema(selectedConnector);
  const form = useForm({
    resolver: zodResolver(connectionSchema),
    defaultValues: selectedConnector?.defaultPort ? { port: selectedConnector.defaultPort } : {},
  });

  // Reset form when connector changes
  useEffect(() => {
    if (selectedConnector) {
      const defaultValues: any = {};
      if (selectedConnector.defaultPort) {
        defaultValues.port = selectedConnector.defaultPort;
      }
      if (selectedConnector.supportsSSL) {
        defaultValues.sslMode = 'prefer';
      }
      form.reset(defaultValues);
      setConnectionTest(null);
    }
  }, [selectedConnector, form]);

  // Test connection mutation
  const testConnectionMutation = useMutation({
    mutationFn: async (config: DatabaseConnectionConfig) => {
      const response = await fetch('/api/database-connectors/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: selectedConnector?.name, config }),
      });
      return response.json();
    },
    onSuccess: (result: ConnectionTestResult) => {
      setConnectionTest(result);
      if (result.success) {
        toast({
          title: 'Connection Successful',
          description: result.message,
        });
      } else {
        toast({
          title: 'Connection Failed',
          description: result.message,
          variant: 'destructive',
        });
      }
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Connection test failed';
      setConnectionTest({
        success: false,
        message: errorMessage,
      });
      toast({
        title: 'Connection Error',
        description: errorMessage,
        variant: 'destructive',
      });
    },
    onSettled: () => {
      setIsTestingConnection(false);
    },
  });

  const handleTestConnection = () => {
    if (!selectedConnector) return;
    
    const config = form.getValues();
    setIsTestingConnection(true);
    testConnectionMutation.mutate(config);
  };

  const handleSubmit = (config: DatabaseConnectionConfig) => {
    if (!selectedConnector || !connectionName.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please select a connector and provide a connection name',
        variant: 'destructive',
      });
      return;
    }

    if (!connectionTest?.success) {
      toast({
        title: 'Test Connection First',
        description: 'Please test the connection before saving',
        variant: 'destructive',
      });
      return;
    }

    onSubmit(connectionName, selectedConnector.name, config);
  };

  const renderConnectionFields = () => {
    if (!selectedConnector) return null;

    return (
      <div className="space-y-4">
        {/* Basic connection fields */}
        {selectedConnector.requiresHost && (
          <FormField
            control={form.control}
            name="host" as any
            render={({ field }) => (
              <FormItem>
                <FormLabel>Host</FormLabel>
                <FormControl>
                  <Input
                    placeholder="localhost"
                    {...field}
                    data-testid="input-host"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {selectedConnector.requiresPort && (
          <FormField
            control={form.control}
            name="port"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Port</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder={selectedConnector.defaultPort?.toString() || "3306"}
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || selectedConnector.defaultPort)}
                    data-testid="input-port"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {selectedConnector.requiresDatabase && (
          <FormField
            control={form.control}
            name="database" as any
            render={({ field }) => (
              <FormItem>
                <FormLabel>Database</FormLabel>
                <FormControl>
                  <Input
                    placeholder="my_database"
                    {...field}
                    data-testid="input-database"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {selectedConnector.requiresCredentials && (
          <>
            <FormField
              control={form.control}
              name="username" as any
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="user"
                      {...field}
                      data-testid="input-username"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password" as any
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      {...field}
                      data-testid="input-password"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        {/* Cloud-specific fields */}
        {selectedConnector.name === 'bigquery' && (
          <FormField
            control={form.control}
            name="projectId" as any
            render={({ field }) => (
              <FormItem>
                <FormLabel>Project ID</FormLabel>
                <FormControl>
                  <Input
                    placeholder="my-project-id"
                    {...field}
                    data-testid="input-project-id"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {selectedConnector.name === 'snowflake' && (
          <>
            <FormField
              control={form.control}
              name="account" as any
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="your-account"
                      {...field}
                      data-testid="input-account"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="warehouse" as any
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Warehouse</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="COMPUTE_WH"
                      {...field}
                      data-testid="input-warehouse"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role" as any
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="SYSADMIN"
                      {...field}
                      data-testid="input-role"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        {/* File path for file-based connectors */}
        {selectedConnector.category === 'file' && (
          <FormField
            control={form.control}
            name="filePath" as any
            render={({ field }) => (
              <FormItem>
                <FormLabel>File Path</FormLabel>
                <FormControl>
                  <Input
                    placeholder="/path/to/file.csv"
                    {...field}
                    data-testid="input-file-path"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* SSL Configuration */}
        {selectedConnector.supportsSSL && (
          <FormField
            control={form.control}
            name="sslMode" as any
            render={({ field }) => (
              <FormItem>
                <FormLabel>SSL Mode</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-ssl-mode">
                      <SelectValue placeholder="Select SSL mode" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="require">Require</SelectItem>
                    <SelectItem value="prefer">Prefer</SelectItem>
                    <SelectItem value="allow">Allow</SelectItem>
                    <SelectItem value="disable">Disable</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
      </div>
    );
  };

  if (loadingConnectors) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading connectors...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Connector Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Database Connector</CardTitle>
          <CardDescription>
            Choose your database type to get started with the connection
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={Object.keys(connectorsByCategory)[0]} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              {Object.keys(connectorsByCategory).map((category) => (
                <TabsTrigger key={category} value={category} className="capitalize">
                  {category}
                </TabsTrigger>
              ))}
            </TabsList>

            {Object.entries(connectorsByCategory).map(([category, categoryConnectors]) => (
              <TabsContent key={category} value={category} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categoryConnectors.map((connector) => {
                    const IconComponent = getCategoryIcon(connector.category);
                    const isSelected = selectedConnector?.name === connector.name;

                    return (
                      <Card
                        key={connector.name}
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          isSelected ? 'ring-2 ring-primary' : ''
                        }`}
                        onClick={() => setSelectedConnector(connector)}
                        data-testid={`connector-${connector.name}`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start space-x-3">
                            <div className="p-2 rounded-lg bg-muted">
                              <IconComponent className="h-5 w-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-sm">{connector.displayName}</h3>
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {connector.description}
                              </p>
                              <div className="mt-2">
                                <span className="inline-block px-2 py-1 text-xs rounded-md bg-secondary text-secondary-foreground">
                                  {connector.category}
                                </span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Connection Configuration */}
      {selectedConnector && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {(() => {
                const IconComponent = getCategoryIcon(selectedConnector.category);
                return <IconComponent className="h-5 w-5" />;
              })()}
              Configure {selectedConnector.displayName} Connection
            </CardTitle>
            <CardDescription>
              {selectedConnector.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                {/* Connection Name */}
                <div className="space-y-2">
                  <Label htmlFor="connection-name">Connection Name *</Label>
                  <Input
                    id="connection-name"
                    placeholder="My Database Connection"
                    value={connectionName}
                    onChange={(e) => setConnectionName(e.target.value)}
                    data-testid="input-connection-name"
                  />
                </div>

                {/* Dynamic connection fields */}
                {renderConnectionFields()}

                {/* Connection Test */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium">Connection Test</Label>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleTestConnection}
                      disabled={isTestingConnection}
                      data-testid="button-test-connection"
                    >
                      {isTestingConnection ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Testing...
                        </>
                      ) : (
                        'Test Connection'
                      )}
                    </Button>
                  </div>

                  {connectionTest && (
                    <Alert className={connectionTest.success ? 'border-green-500' : 'border-red-500'}>
                      <div className="flex items-center gap-2">
                        {connectionTest.success ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                        <AlertDescription className="flex-1">
                          {connectionTest.message}
                          {connectionTest.latency && (
                            <span className="ml-2 text-muted-foreground">
                              ({connectionTest.latency}ms)
                            </span>
                          )}
                        </AlertDescription>
                      </div>
                    </Alert>
                  )}
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading || !connectionTest?.success || !connectionName.trim()}
                  data-testid="button-save-connection"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Connection...
                    </>
                  ) : (
                    'Save Connection'
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}