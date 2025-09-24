import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Database, 
  Server, 
  Globe, 
  FolderOpen,
  TestTube,
  Loader2,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff
} from "lucide-react";

interface ConnectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectorAdded: () => void;
}

interface ConnectionConfig {
  name: string;
  type: string;
  host?: string;
  port?: string;
  database?: string;
  username?: string;
  password?: string;
  url?: string;
  apiKey?: string;
  authType?: string;
  headers?: string;
  sftpPath?: string;
}

export default function ConnectorModal({ isOpen, onClose, onConnectorAdded }: ConnectorModalProps) {
  const [activeTab, setActiveTab] = useState("database");
  const [config, setConfig] = useState<ConnectionConfig>({
    name: "",
    type: "",
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "testing" | "success" | "error">("idle");
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const databaseTypes = [
    { value: "mysql", label: "MySQL", port: "3306" },
    { value: "postgresql", label: "PostgreSQL", port: "5432" },
    { value: "sqlserver", label: "SQL Server", port: "1433" },
    { value: "sqlite", label: "SQLite", port: "" },
    { value: "mongodb", label: "MongoDB", port: "27017" },
    { value: "redis", label: "Redis", port: "6379" },
  ];

  const apiTypes = [
    { value: "rest", label: "REST API" },
    { value: "graphql", label: "GraphQL API" },
    { value: "webhook", label: "Webhook" },
  ];

  const authTypes = [
    { value: "none", label: "No Authentication" },
    { value: "apikey", label: "API Key" },
    { value: "bearer", label: "Bearer Token" },
    { value: "basic", label: "Basic Auth" },
  ];

  const handleTestConnection = async () => {
    if (!config.name || !config.type) {
      toast({
        title: "Missing configuration",
        description: "Please fill in the required fields",
        variant: "destructive",
      });
      return;
    }

    setIsConnecting(true);
    setConnectionStatus("testing");

    try {
      const response = await fetch("/api/connectors/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
        credentials: "include",
      });

      if (response.ok) {
        setConnectionStatus("success");
        toast({
          title: "Connection successful",
          description: "Successfully connected to the data source",
        });
      } else {
        const error = await response.text();
        setConnectionStatus("error");
        toast({
          title: "Connection failed",
          description: error || "Failed to connect to the data source",
          variant: "destructive",
        });
      }
    } catch (error) {
      setConnectionStatus("error");
      toast({
        title: "Connection failed",
        description: "Network error occurred while testing connection",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSaveConnector = async () => {
    if (connectionStatus !== "success") {
      toast({
        title: "Test connection first",
        description: "Please test the connection before saving",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch("/api/connectors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
        credentials: "include",
      });

      if (response.ok) {
        toast({
          title: "Connector saved",
          description: "Data source connector has been added successfully",
        });
        onConnectorAdded();
        onClose();
        // Reset form
        setConfig({ name: "", type: "" });
        setConnectionStatus("idle");
      } else {
        const error = await response.text();
        toast({
          title: "Save failed",
          description: error || "Failed to save the connector",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Save failed",
        description: "Network error occurred while saving connector",
        variant: "destructive",
      });
    }
  };

  const updateConfig = (field: string, value: string) => {
    setConfig(prev => ({ ...prev, [field]: value }));
    setConnectionStatus("idle");
  };

  const renderDatabaseTab = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="db-name">Connection Name *</Label>
          <Input
            id="db-name"
            placeholder="My Database Connection"
            value={config.name}
            onChange={(e) => updateConfig("name", e.target.value)}
            data-testid="input-connection-name"
          />
        </div>
        <div>
          <Label htmlFor="db-type">Database Type *</Label>
          <Select value={config.type} onValueChange={(value) => {
            updateConfig("type", value);
            const dbType = databaseTypes.find(t => t.value === value);
            if (dbType?.port) updateConfig("port", dbType.port);
          }}>
            <SelectTrigger data-testid="select-database-type">
              <SelectValue placeholder="Select database type" />
            </SelectTrigger>
            <SelectContent>
              {databaseTypes.map(type => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {config.type !== "sqlite" && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="db-host">Host *</Label>
            <Input
              id="db-host"
              placeholder="localhost"
              value={config.host || ""}
              onChange={(e) => updateConfig("host", e.target.value)}
              data-testid="input-host"
            />
          </div>
          <div>
            <Label htmlFor="db-port">Port</Label>
            <Input
              id="db-port"
              placeholder="3306"
              value={config.port || ""}
              onChange={(e) => updateConfig("port", e.target.value)}
              data-testid="input-port"
            />
          </div>
        </div>
      )}

      <div>
        <Label htmlFor="db-database">Database Name</Label>
        <Input
          id="db-database"
          placeholder="mydb"
          value={config.database || ""}
          onChange={(e) => updateConfig("database", e.target.value)}
          data-testid="input-database"
        />
      </div>

      {config.type !== "sqlite" && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="db-username">Username</Label>
            <Input
              id="db-username"
              placeholder="admin"
              value={config.username || ""}
              onChange={(e) => updateConfig("username", e.target.value)}
              data-testid="input-username"
            />
          </div>
          <div>
            <Label htmlFor="db-password">Password</Label>
            <div className="relative">
              <Input
                id="db-password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={config.password || ""}
                onChange={(e) => updateConfig("password", e.target.value)}
                data-testid="input-password"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                data-testid="button-toggle-password"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      )}

      {config.type === "sqlite" && (
        <div>
          <Label htmlFor="sqlite-path">SQLite File Path *</Label>
          <Input
            id="sqlite-path"
            placeholder="/path/to/database.db"
            value={config.database || ""}
            onChange={(e) => updateConfig("database", e.target.value)}
            data-testid="input-sqlite-path"
          />
        </div>
      )}
    </div>
  );

  const renderApiTab = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="api-name">Connection Name *</Label>
          <Input
            id="api-name"
            placeholder="My API Connection"
            value={config.name}
            onChange={(e) => updateConfig("name", e.target.value)}
            data-testid="input-api-name"
          />
        </div>
        <div>
          <Label htmlFor="api-type">API Type *</Label>
          <Select value={config.type} onValueChange={(value) => updateConfig("type", value)}>
            <SelectTrigger data-testid="select-api-type">
              <SelectValue placeholder="Select API type" />
            </SelectTrigger>
            <SelectContent>
              {apiTypes.map(type => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="api-url">API URL *</Label>
        <Input
          id="api-url"
          placeholder="https://api.example.com/v1"
          value={config.url || ""}
          onChange={(e) => updateConfig("url", e.target.value)}
          data-testid="input-api-url"
        />
      </div>

      <div>
        <Label htmlFor="auth-type">Authentication</Label>
        <Select value={config.authType || "none"} onValueChange={(value) => updateConfig("authType", value)}>
          <SelectTrigger data-testid="select-auth-type">
            <SelectValue placeholder="Select authentication type" />
          </SelectTrigger>
          <SelectContent>
            {authTypes.map(type => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {config.authType === "apikey" && (
        <div>
          <Label htmlFor="api-key">API Key</Label>
          <Input
            id="api-key"
            placeholder="your-api-key"
            value={config.apiKey || ""}
            onChange={(e) => updateConfig("apiKey", e.target.value)}
            data-testid="input-api-key"
          />
        </div>
      )}

      {config.authType === "bearer" && (
        <div>
          <Label htmlFor="bearer-token">Bearer Token</Label>
          <Input
            id="bearer-token"
            placeholder="your-bearer-token"
            value={config.apiKey || ""}
            onChange={(e) => updateConfig("apiKey", e.target.value)}
            data-testid="input-bearer-token"
          />
        </div>
      )}

      {config.authType === "basic" && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="basic-username">Username</Label>
            <Input
              id="basic-username"
              placeholder="username"
              value={config.username || ""}
              onChange={(e) => updateConfig("username", e.target.value)}
              data-testid="input-basic-username"
            />
          </div>
          <div>
            <Label htmlFor="basic-password">Password</Label>
            <Input
              id="basic-password"
              type="password"
              placeholder="password"
              value={config.password || ""}
              onChange={(e) => updateConfig("password", e.target.value)}
              data-testid="input-basic-password"
            />
          </div>
        </div>
      )}

      <div>
        <Label htmlFor="headers">Custom Headers (JSON format)</Label>
        <Textarea
          id="headers"
          placeholder='{"X-Custom-Header": "value"}'
          value={config.headers || ""}
          onChange={(e) => updateConfig("headers", e.target.value)}
          rows={3}
          data-testid="textarea-headers"
        />
      </div>
    </div>
  );

  const renderSftpTab = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="sftp-name">Connection Name *</Label>
          <Input
            id="sftp-name"
            placeholder="My SFTP Connection"
            value={config.name}
            onChange={(e) => updateConfig("name", e.target.value)}
            data-testid="input-sftp-name"
          />
        </div>
        <div>
          <Label htmlFor="sftp-host">SFTP Host *</Label>
          <Input
            id="sftp-host"
            placeholder="sftp.example.com"
            value={config.host || ""}
            onChange={(e) => updateConfig("host", e.target.value)}
            data-testid="input-sftp-host"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="sftp-port">Port</Label>
          <Input
            id="sftp-port"
            placeholder="22"
            value={config.port || "22"}
            onChange={(e) => updateConfig("port", e.target.value)}
            data-testid="input-sftp-port"
          />
        </div>
        <div>
          <Label htmlFor="sftp-username">Username *</Label>
          <Input
            id="sftp-username"
            placeholder="user"
            value={config.username || ""}
            onChange={(e) => updateConfig("username", e.target.value)}
            data-testid="input-sftp-username"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="sftp-password">Password</Label>
        <div className="relative">
          <Input
            id="sftp-password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            value={config.password || ""}
            onChange={(e) => updateConfig("password", e.target.value)}
            data-testid="input-sftp-password"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => setShowPassword(!showPassword)}
            data-testid="button-toggle-sftp-password"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div>
        <Label htmlFor="sftp-path">Remote Path</Label>
        <Input
          id="sftp-path"
          placeholder="/home/user/data/"
          value={config.sftpPath || ""}
          onChange={(e) => updateConfig("sftpPath", e.target.value)}
          data-testid="input-sftp-path"
        />
      </div>

      <div className="p-4 border rounded-md bg-muted/50">
        <p className="text-sm text-muted-foreground">
          <strong>Supported file types:</strong> CSV, Excel (.xlsx, .xls)
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Files will be automatically discovered in the specified remote path and subdirectories.
        </p>
      </div>
    </div>
  );

  const getConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case "testing":
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <TestTube className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-connector-modal">
        <DialogHeader>
          <DialogTitle>Connect Data Source</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="database" data-testid="tab-database">
              <Database className="mr-2 h-4 w-4" />
              Databases
            </TabsTrigger>
            <TabsTrigger value="api" data-testid="tab-api">
              <Globe className="mr-2 h-4 w-4" />
              APIs
            </TabsTrigger>
            <TabsTrigger value="sftp" data-testid="tab-sftp">
              <Server className="mr-2 h-4 w-4" />
              SFTP
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="database">
              {renderDatabaseTab()}
            </TabsContent>
            <TabsContent value="api">
              {renderApiTab()}
            </TabsContent>
            <TabsContent value="sftp">
              {config.type = "sftp"}
              {renderSftpTab()}
            </TabsContent>
          </div>
        </Tabs>

        <div className="flex items-center justify-between mt-6 pt-4 border-t">
          <div className="flex items-center gap-2">
            {connectionStatus !== "idle" && (
              <Badge variant={connectionStatus === "success" ? "default" : connectionStatus === "error" ? "destructive" : "secondary"}>
                {getConnectionStatusIcon()}
                <span className="ml-1">
                  {connectionStatus === "testing" && "Testing..."}
                  {connectionStatus === "success" && "Connected"}
                  {connectionStatus === "error" && "Failed"}
                </span>
              </Badge>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleTestConnection}
              disabled={isConnecting}
              data-testid="button-test-connection"
            >
              {getConnectionStatusIcon()}
              <span className="ml-2">Test Connection</span>
            </Button>
            <Button
              onClick={handleSaveConnector}
              disabled={connectionStatus !== "success"}
              data-testid="button-save-connector"
            >
              <FolderOpen className="mr-2 h-4 w-4" />
              Add Connection
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}