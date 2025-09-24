import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import VoiceButton from "@/components/voice/voice-button";
import VoiceStatus from "@/components/voice/voice-status";
import { Menu, Search, Bell } from "lucide-react";

interface TopBarProps {
  currentPage: string;
  onSidebarToggle: () => void;
}

const pageLabels: Record<string, string> = {
  dashboard: "Dashboard Overview",
  warehouse: "Data Warehouse", 
  assistant: "AI Assistant",
  charts: "Charts & Visualizations",
  datasets: "Datasets & Tables"
};

export default function TopBar({ currentPage, onSidebarToggle }: TopBarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);

  const handleVoiceClick = () => {
    // This will be implemented by the parent component or voice service
    setIsRecording(!isRecording);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Redirect to assistant page with the query
      // This would typically be handled by the parent component
      console.log("Search query:", searchQuery);
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onSidebarToggle}
              className="lg:hidden"
              data-testid="button-sidebar-toggle"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h2 className="text-lg font-semibold">
              {pageLabels[currentPage] || "NEX-AI"}
            </h2>
          </div>
          
          {/* Voice/Text prompt interface */}
          <div className="flex items-center gap-4">
            {/* Voice Input Button */}
            <VoiceButton
              isRecording={isRecording}
              isTranscribing={isTranscribing}
              onClick={handleVoiceClick}
            />
            
            {/* Text Prompt Input */}
            <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Ask anything about your data..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-input border-border focus:ring-2 focus:ring-primary focus:border-transparent"
                  data-testid="input-global-search"
                />
              </div>
            </form>
            
            <Button 
              variant="ghost" 
              size="sm"
              data-testid="button-notifications"
            >
              <Bell className="h-5 w-5" />
            </Button>
          </div>
        </div>
        
        {/* Voice Status Component */}
        <VoiceStatus 
          isRecording={isRecording}
          isTranscribing={isTranscribing}
          onStop={handleVoiceClick}
        />
      </div>
    </header>
  );
}
