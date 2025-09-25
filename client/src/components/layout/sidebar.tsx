import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Brain, 
  BarChart3, 
  Database, 
  Bot, 
  Table,
  Settings,
  LogOut
} from "lucide-react";

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const navigation = [
  {
    id: "dashboard",
    name: "Dashboard",
    icon: BarChart3,
    description: "Overview & KPIs"
  },
  {
    id: "warehouse",
    name: "NEX Connect", 
    icon: Database,
    description: "Data sources"
  },
  {
    id: "assistant",
    name: "NEX AI",
    icon: Bot,
    description: "Chat with your data"
  },
  {
    id: "charts",
    name: "NEX-VIZ",
    icon: BarChart3,
    description: "Visualizations"
  },
  {
    id: "datasets",
    name: "NEX House",
    icon: Table,
    description: "Data & Views"
  }
];

export default function Sidebar({ currentPage, onPageChange, isOpen, onToggle }: SidebarProps) {
  const { user, logoutMutation } = useAuth();

  const getUserInitials = (name?: string | null, email?: string | null) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    }
    if (email) {
      return email.slice(0, 2).toUpperCase();
    }
    return 'U';
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onToggle}
        />
      )}
      
      {/* Sidebar */}
      <aside className={cn(
        "fixed left-0 top-0 z-50 h-full w-64 bg-card border-r border-border transition-transform duration-300 lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Brain className="text-white text-lg" />
              </div>
              <div>
                <h1 className="text-xl font-bold">NEX Sight</h1>
                <p className="text-xs text-muted-foreground">Business Intelligence</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onPageChange(item.id);
                    // Close mobile sidebar after navigation
                    if (window.innerWidth < 1024) {
                      onToggle();
                    }
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors",
                    isActive 
                      ? "bg-primary/20 text-primary font-medium" 
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                  data-testid={`nav-${item.id}`}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {item.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-3 mb-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-gradient-to-br from-secondary to-accent text-xs">
                  {getUserInitials(user?.name, user?.email)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" data-testid="text-user-name">
                  {user?.name || 'User'}
                </p>
                <p className="text-xs text-muted-foreground truncate" data-testid="text-user-email">
                  {user?.email}
                </p>
              </div>
            </div>
            
            <div className="space-y-1">
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full justify-start text-muted-foreground"
                data-testid="button-settings"
              >
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full justify-start text-muted-foreground hover:text-destructive"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
                data-testid="button-logout"
              >
                <LogOut className="mr-2 h-4 w-4" />
                {logoutMutation.isPending ? 'Signing out...' : 'Sign out'}
              </Button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
