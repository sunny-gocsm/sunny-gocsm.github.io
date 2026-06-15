import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Filter, Star, MessageSquare } from "lucide-react";

interface ActionsFilterPopoverProps {
  actionFilter: string;
  onFilterChange: (value: string) => void;
}

const TABS = [
  { key: "priority", label: "Priority", icon: Star },
  { key: "feedback", label: "Feedback", icon: MessageSquare },
] as const;

type TabKey = typeof TABS[number]["key"];

const TAB_OPTIONS: Record<TabKey, { value: string; label: string }[]> = {
  priority: [
    { value: "all", label: "All Accounts" },
    { value: "priority", label: "Priority Only" },
  ],
  feedback: [
    { value: "all", label: "All" },
    { value: "feedback-available", label: "Feedback Available" },
  ],
};

// Map filter values to their tab
const getTabForFilter = (filter: string): TabKey => {
  if (filter === "priority") return "priority";
  if (filter === "feedback-available") return "feedback";
  return "priority";
};

const ActionsFilterPopover = ({ actionFilter, onFilterChange }: ActionsFilterPopoverProps) => {
  const [activeTab, setActiveTab] = useState<TabKey>(() =>
    actionFilter !== "all" ? getTabForFilter(actionFilter) : "priority"
  );

  const isActive = actionFilter !== "all";

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-1 hover:text-foreground transition-colors">
          Actions
          <Filter className={`h-3 w-3 ${isActive ? "text-primary" : "opacity-40"}`} />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-52 p-0" align="end">
        {/* Tabs */}
        <div className="flex border-b border-border/40">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isTabActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex flex-col items-center gap-0.5 px-2 py-2.5 text-[10px] font-medium transition-colors ${
                  isTabActive
                    ? "text-primary border-b-2 border-primary -mb-px"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Options */}
        <div className="p-1.5">
          {TAB_OPTIONS[activeTab].map((opt) => (
            <button
              key={opt.value}
              onClick={() => onFilterChange(opt.value)}
              className={`w-full text-left px-3 py-2 text-xs rounded-md transition-colors ${
                actionFilter === opt.value
                  ? "bg-primary/10 text-primary font-medium"
                  : "hover:bg-secondary text-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ActionsFilterPopover;
