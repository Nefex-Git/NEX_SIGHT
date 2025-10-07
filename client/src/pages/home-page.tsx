import { useState } from "react";
import { Link } from "wouter";
import Sidebar from "@/components/layout/sidebar";
import TopBar from "@/components/layout/top-bar";
import DashboardPage from "./dashboard-page";
import DashboardViewPage from "./dashboard-view-page";
import AssistantPage from "./assistant-page";
import WarehousePage from "./warehouse-page";
import ChartsPage from "./charts-page";
import DatasetsPage from "./datasets-page";

type Page = "dashboard" | "assistant" | "warehouse" | "charts" | "datasets";

export default function HomePage() {
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [viewingDashboardId, setViewingDashboardId] = useState<string | null>(null);

  const handleNavigateToDashboard = (dashboardId: string) => {
    setViewingDashboardId(dashboardId);
  };

  const handleBackToDashboards = () => {
    setViewingDashboardId(null);
  };

  const renderPage = () => {
    if (currentPage === "dashboard") {
      if (viewingDashboardId) {
        return (
          <DashboardViewPage 
            dashboardId={viewingDashboardId} 
            onBack={handleBackToDashboards}
          />
        );
      }
      return <DashboardPage onNavigateToDashboard={handleNavigateToDashboard} />;
    }

    switch (currentPage) {
      case "assistant":
        return <AssistantPage />;
      case "warehouse":
        return <WarehousePage />;
      case "charts":
        return <ChartsPage />;
      case "datasets":
        return <DatasetsPage />;
      default:
        return <DashboardPage onNavigateToDashboard={handleNavigateToDashboard} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar 
        currentPage={currentPage} 
        onPageChange={(page) => {
          setCurrentPage(page as Page);
          setViewingDashboardId(null); // Reset dashboard view when changing pages
        }}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      
      <main className={`flex-1 overflow-auto transition-all duration-300 ${sidebarOpen ? 'ml-16' : 'ml-0'} lg:ml-16`}>
        <TopBar 
          currentPage={currentPage}
          onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
        />
        
        <div className="min-h-[calc(100vh-80px)]">
          {renderPage()}
        </div>
      </main>
    </div>
  );
}
