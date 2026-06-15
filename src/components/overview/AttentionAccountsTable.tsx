import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, Sparkle } from "lucide-react";
import AiBrandingBadge from "@/components/AiBrandingBadge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Account {
  id: string;
  name: string;
  score: number;
  trend: number;
  mrr: number;
  risk: "High" | "Medium" | "Low";
  reason: string;
}

interface AttentionAccountsTableProps {
  accounts: Account[];
}

const riskStyle: Record<string, string> = {
  High: "bg-health-red-bg text-health-red border-health-red/20",
  Medium: "bg-health-orange-bg text-health-orange border-health-orange/20",
  Low: "bg-health-green-bg text-health-green border-health-green/20",
};

const healthStatus = (s: number) => {
  if (s >= 80) return { label: "Thriving", color: "text-health-green" };
  if (s >= 60) return { label: "Healthy", color: "text-health-blue" };
  if (s >= 40) return { label: "Steady", color: "text-health-yellow" };
  return { label: "At Risk", color: "text-health-red" };
};

const AttentionAccountsTable = ({ accounts }: AttentionAccountsTableProps) => {
  const navigate = useNavigate();

  return (
    <div className="rounded-2xl bg-card border border-border/40 shadow-card p-6">
      <h3 className="text-sm font-semibold text-card-foreground mb-4 tracking-tight">Accounts Requiring Attention</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm table-fixed">
          <thead>
            <tr className="border-b border-border">
              <th className="w-[20%] text-left pb-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Account</th>
              <th className="w-[15%] text-center pb-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Health</th>
              <th className="w-[10%] text-center pb-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Trend</th>
              <th className="w-[12%] text-right pb-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">MRR</th>
              <th className="w-[28%] text-left pb-3 pl-6 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">Reason <AiBrandingBadge size="xs" /></span>
              </th>
              <th className="w-[15%] text-right pb-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Action</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((acc) => (
              <tr key={acc.id} className="border-b border-border/30 last:border-0 hover:bg-secondary/40 transition-colors">
                <td className="py-3.5">
                  <button
                    onClick={() => navigate(`/sub-accounts/${acc.id}/health-overview`)}
                    className="text-sm font-medium text-primary hover:text-primary/80 hover:underline transition-colors"
                  >
                    {acc.name}
                  </button>
                </td>
                <td className="py-3.5 text-center">
                  <div className="flex flex-col items-center">
                    <span className={cn("text-sm font-semibold", healthStatus(acc.score).color)}>
                      {healthStatus(acc.score).label}
                    </span>
                    <span className="text-xs text-muted-foreground">Score: {acc.score}</span>
                  </div>
                </td>
                <td className="py-3.5 text-center">
                  <div className="flex items-center justify-center gap-1">
                    {acc.trend > 0 ? (
                      <TrendingUp className="h-3.5 w-3.5 text-health-green" />
                    ) : acc.trend < 0 ? (
                      <TrendingDown className="h-3.5 w-3.5 text-health-red" />
                    ) : (
                      <Minus className="h-3.5 w-3.5 text-health-yellow" />
                    )}
                    <span className={cn("text-xs font-medium", acc.trend > 0 ? "text-health-green" : acc.trend < 0 ? "text-health-red" : "text-health-yellow")}>
                      {acc.trend > 0 ? "+" : ""}{acc.trend}%
                    </span>
                  </div>
                </td>
                <td className="py-3.5 text-right font-medium text-card-foreground">${acc.mrr.toLocaleString()}</td>
                <td className="py-3.5 text-xs pl-6 text-muted-foreground leading-relaxed">
                  <span className="inline-flex items-center gap-1.5">
                    <Sparkle className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400 flex-shrink-0" fill="currentColor" />
                    {acc.reason}
                  </span>
                </td>
                <td className="py-3.5 text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-7 hover:bg-primary/10 hover:text-primary"
                    onClick={() => navigate(`/sub-accounts/${acc.id}/health-overview`)}
                  >
                    View Details
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AttentionAccountsTable;
