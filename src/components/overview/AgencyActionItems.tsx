import { Lightbulb, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ActionItem {
  title: string;
  description: string;
  impact: "High" | "Medium" | "Low";
  category: string;
}

interface AgencyActionItemsProps {
  actions: ActionItem[];
}

const impactStyle: Record<string, string> = {
  High: "bg-health-green-bg text-health-green border-health-green/20",
  Medium: "bg-health-yellow-bg text-health-yellow border-health-yellow/20",
  Low: "bg-secondary text-muted-foreground border-border",
};

const AgencyActionItems = ({ actions }: AgencyActionItemsProps) => {
  return (
    <div className="rounded-xl bg-card border border-border/50 shadow-card p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
          <Lightbulb className="h-3.5 w-3.5 text-primary" />
        </div>
        <h3 className="text-sm font-semibold text-card-foreground">Recommended Actions</h3>
      </div>

      <div className="space-y-3">
        {actions.map((action, i) => (
          <div
            key={i}
            className="flex items-start gap-3 bg-secondary/30 rounded-lg px-4 py-3 hover:bg-secondary/50 transition-colors group"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-card-foreground">{action.title}</span>
                <Badge variant="outline" className={impactStyle[action.impact]}>
                  {action.impact} Impact
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{action.description}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
            >
              Act <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AgencyActionItems;
