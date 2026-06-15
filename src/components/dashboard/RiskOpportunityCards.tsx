import { AlertTriangle, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import AiBrandingBadge from "@/components/AiBrandingBadge";

interface RiskData {
  title: string;
  items: { label: string; description: string }[];
}

interface OpportunityData {
  title: string;
  items: { label: string; description: string }[];
}

interface RiskOpportunityProps {
  risk: RiskData | null;
  opportunity: OpportunityData | null;
}

const RiskOpportunityCards = ({ risk, opportunity }: RiskOpportunityProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Risk Card */}
      {risk ? (
        <div className="rounded-xl overflow-hidden shadow-card-lg">
          <div className="h-1.5 bg-gradient-to-r from-health-red to-health-orange" />
          <div className="bg-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-health-red-bg">
                <AlertTriangle className="h-3.5 w-3.5 text-health-red" />
              </div>
              <h4 className="text-sm font-semibold text-health-red">Risk Section</h4>
              <span className="ml-auto"><AiBrandingBadge size="sm" /></span>
            </div>
            <div className="space-y-3">
              {risk.items.map((item) => (
                <div key={item.label} className="pl-3 border-l-2 border-health-red/20">
                  <a href="#" className="text-sm font-medium text-health-red hover:text-health-red/80 underline underline-offset-2 transition-colors">
                    {item.label}
                  </a>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl bg-card shadow-card p-6 flex items-center">
          <p className="text-sm text-muted-foreground">No current risks detected.</p>
        </div>
      )}

      {/* Opportunity Card */}
      {opportunity && (
        <div className="rounded-xl overflow-hidden shadow-card-lg">
          <div className="h-1.5 bg-gradient-to-r from-health-green to-primary" />
          <div className="bg-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-health-green-bg">
                <Sparkles className="h-3.5 w-3.5 text-health-green" />
              </div>
              <h4 className="text-sm font-semibold text-health-green">
                Opportunity Section
              </h4>
              <span className="ml-auto"><AiBrandingBadge size="sm" /></span>
            </div>
            <div className="space-y-3">
              {opportunity.items.map((item) => (
                <div key={item.label} className="pl-3 border-l-2 border-health-green/20">
                  <a href="#" className="text-sm font-medium text-health-green hover:text-health-green/80 underline underline-offset-2 transition-colors">
                    {item.label}
                  </a>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RiskOpportunityCards;
