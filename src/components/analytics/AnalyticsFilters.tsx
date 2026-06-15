import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal, X } from "lucide-react";

interface AnalyticsFiltersProps {
  statusFilter: string;
  stageFilter: string;
  riskFilter: string;
  planFilter: string;
  onStatusChange: (v: string) => void;
  onStageChange: (v: string) => void;
  onRiskChange: (v: string) => void;
  onPlanChange: (v: string) => void;
  onClearAll: () => void;
  hasActiveFilters: boolean;
}

const AnalyticsFilters = ({
  statusFilter,
  stageFilter,
  riskFilter,
  planFilter,
  onStatusChange,
  onStageChange,
  onRiskChange,
  onPlanChange,
  onClearAll,
  hasActiveFilters,
}: AnalyticsFiltersProps) => {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <SlidersHorizontal className="h-3.5 w-3.5" />
      </div>

      <Select value={statusFilter} onValueChange={onStatusChange}>
        <SelectTrigger className="w-[140px] h-9 text-xs bg-card border-border/60 rounded-lg">
          <SelectValue placeholder="All Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="Enabled">Enabled</SelectItem>
          <SelectItem value="Disabled">Disabled</SelectItem>
        </SelectContent>
      </Select>

      <Select value={stageFilter} onValueChange={onStageChange}>
        <SelectTrigger className="w-[140px] h-9 text-xs bg-card border-border/60 rounded-lg">
          <SelectValue placeholder="All Stages" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Stages</SelectItem>
          <SelectItem value="Onboarding">Onboarding</SelectItem>
          <SelectItem value="Growth">Growth</SelectItem>
          <SelectItem value="Mature">Mature</SelectItem>
        </SelectContent>
      </Select>

      <Select value={riskFilter} onValueChange={onRiskChange}>
        <SelectTrigger className="w-[150px] h-9 text-xs bg-card border-border/60 rounded-lg">
          <SelectValue placeholder="All Risk Levels" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Risk Levels</SelectItem>
          <SelectItem value="Low">Low</SelectItem>
          <SelectItem value="Medium">Medium</SelectItem>
          <SelectItem value="High">High</SelectItem>
        </SelectContent>
      </Select>

      <Select value={planFilter} onValueChange={onPlanChange}>
        <SelectTrigger className="w-[140px] h-9 text-xs bg-card border-border/60 rounded-lg">
          <SelectValue placeholder="All Plans" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Plans</SelectItem>
          <SelectItem value="Pro">Pro</SelectItem>
          <SelectItem value="Plus">Plus</SelectItem>
          <SelectItem value="Premium">Premium</SelectItem>
          <SelectItem value="Starter">Starter</SelectItem>
          <SelectItem value="Manual">Non-SaaS</SelectItem>
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="h-9 text-xs text-muted-foreground hover:text-foreground gap-1"
        >
          <X className="h-3 w-3" />
          Clear All
        </Button>
      )}
    </div>
  );
};

export default AnalyticsFilters;
