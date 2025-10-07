import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  BarChart3, 
  Database, 
  Bot, 
  Table,
  Plug,
  Settings,
  LogOut,
  Pin,
  PinOff,
  Target
} from "lucide-react";
import nexSightLogo from "@assets/nexsight_1758799902588.png";

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
    id: "kpis",
    name: "KPI Dashboard",
    icon: Target,
    description: "Performance Metrics"
  },
  {
    id: "warehouse",
    name: "NEX Connect", 
    icon: Plug,
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
    name: "NEX VIZ",
    icon: BarChart3,
    description: "Visualizations"
  },
  {
    id: "datasets",
    name: "NEX House",
    icon: Database,
    description: "Data & Views"
  }
];

export default function Sidebar({ currentPage, onPageChange, isOpen, onToggle }: SidebarProps) {
  const { user, logoutMutation } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  const shouldShowExpanded = isPinned || isHovered;
  const sidebarWidth = shouldShowExpanded ? 'w-64' : 'w-16';

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
      <aside 
        className={cn(
          "fixed left-0 top-0 z-50 h-full bg-card border-r border-border transition-all duration-300 lg:translate-x-0",
          sidebarWidth,
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className={cn("border-b border-border transition-all duration-300", shouldShowExpanded ? "p-6" : "p-3")}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
                <img 
                  src={nexSightLogo} 
                  alt="NEX Sight Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
              {shouldShowExpanded && (
                <div className="overflow-hidden">
                  <h1 className="text-xl font-bold whitespace-nowrap">NEX Sight</h1>
                  <p className="text-xs text-muted-foreground whitespace-nowrap">Business Intelligence</p>
                </div>
              )}
              {shouldShowExpanded && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsPinned(!isPinned)}
                  className="ml-auto opacity-60 hover:opacity-100 transition-opacity"
                  data-testid="button-pin-sidebar"
                >
                  {isPinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                </Button>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className={cn("flex-1 space-y-2 transition-all duration-300", shouldShowExpanded ? "p-4" : "p-2")}>
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
                    "w-full flex items-center rounded-lg text-left transition-all duration-300",
                    shouldShowExpanded ? "gap-3 px-3 py-2" : "justify-center p-3",
                    isActive 
                      ? "bg-primary/20 text-primary font-medium" 
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                  data-testid={`nav-${item.id}`}
                  title={!shouldShowExpanded ? item.name : undefined}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {shouldShowExpanded && (
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <div className="font-medium whitespace-nowrap">{item.name}</div>
                      <div className="text-xs text-muted-foreground whitespace-nowrap">
                        {item.description}
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </nav>

          {/* User section */}
          <div className={cn("border-t border-border transition-all duration-300", shouldShowExpanded ? "p-4" : "p-2")}>
            <div className={cn("flex items-center mb-3", shouldShowExpanded ? "gap-3" : "justify-center")}>
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarFallback className="bg-gradient-to-br from-secondary to-accent text-xs">
                  {getUserInitials(user?.name, user?.email)}
                </AvatarFallback>
              </Avatar>
              {shouldShowExpanded && (
                <div className="flex-1 min-w-0 overflow-hidden">
                  <p className="text-sm font-medium truncate" data-testid="text-user-name">
                    {user?.name || 'User'}
                  </p>
                  <p className="text-xs text-muted-foreground truncate" data-testid="text-user-email">
                    {user?.email}
                  </p>
                </div>
              )}
            </div>
            
            <div className="space-y-1">
              <Button 
                variant="ghost" 
                size="sm" 
                className={cn(
                  "w-full text-muted-foreground transition-all duration-300",
                  shouldShowExpanded ? "justify-start" : "justify-center px-2"
                )}
                data-testid="button-settings"
                title={!shouldShowExpanded ? "Settings" : undefined}
              >
                <Settings className={cn("h-4 w-4", shouldShowExpanded && "mr-2")} />
                {shouldShowExpanded && "Settings"}
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className={cn(
                  "w-full text-muted-foreground hover:text-destructive transition-all duration-300",
                  shouldShowExpanded ? "justify-start" : "justify-center px-2"
                )}
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
                data-testid="button-logout"
                title={!shouldShowExpanded ? (logoutMutation.isPending ? 'Signing out...' : 'Sign out') : undefined}
              >
                <LogOut className={cn("h-4 w-4", shouldShowExpanded && "mr-2")} />
                {shouldShowExpanded && (logoutMutation.isPending ? 'Signing out...' : 'Sign out')}
              </Button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
