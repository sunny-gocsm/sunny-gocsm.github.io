import { Bell, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface DashboardHeaderProps {
  activeTab?: string;
}

const DashboardHeader = ({ activeTab = "overview" }: DashboardHeaderProps) => {
  const navigate = useNavigate();

  const tabs = [
    { value: "overview", label: "Overview", path: "/" },
    { value: "analytics", label: "Sub-Accounts", path: "/analytics" },
    { value: "configure", label: "Configure", path: "/configure" },
  ];

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between px-6 py-3 bg-card/80 backdrop-blur-xl border-b border-border/40">
      <div className="flex items-center gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => navigate(tab.path)}
            className={`relative rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
              activeTab === tab.value
                ? "bg-primary/10 text-primary shadow-sm"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            {tab.label}
            {activeTab === tab.value && (
              <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 h-0.5 w-6 rounded-full bg-primary" />
            )}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <button className="p-2 rounded-lg hover:bg-secondary transition-all duration-200 group">
          <Bell className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
        </button>
        <button className="p-2 rounded-lg hover:bg-secondary transition-all duration-200 group">
          <Settings className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
        </button>
        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-xs font-semibold text-primary-foreground shadow-sm">
          AO
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
