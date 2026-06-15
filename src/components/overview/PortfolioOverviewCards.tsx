import { Building2, Star, Users, DollarSign, TrendingUp, TrendingDown, AlertTriangle, Activity, Heart, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface Metric {
  label: string;
  value: string;
  delta?: string;
  positive?: boolean;
  icon: React.ElementType;
  iconClass?: string;
}

interface PortfolioOverviewCardsProps {
  portfolio: Metric[];
  priority: Metric[];
}

const MetricTile = ({ m }: { m: Metric }) => {
  const Icon = m.icon;
  const Trend = m.positive ? TrendingUp : TrendingDown;
  return (
    <div className="rounded-xl border border-border/40 bg-card p-4 card-hover-lift">
      <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-2">
        <Icon className={cn("h-3.5 w-3.5", m.iconClass ?? "text-muted-foreground")} />
        <span className="truncate">{m.label}</span>
      </div>
      <div className="flex items-end justify-between gap-2">
        <p className="text-2xl font-bold text-card-foreground tracking-tight">{m.value}</p>
        {m.delta && (
          <span className={cn("inline-flex items-center gap-0.5 text-[11px] font-medium", m.positive ? "text-health-green" : "text-health-red")}>
            <Trend className="h-3 w-3" />
            {m.delta}
          </span>
        )}
      </div>
      {m.delta && <p className="text-[10px] text-muted-foreground mt-1">in last 30 days</p>}
    </div>
  );
};

const PortfolioOverviewCards = ({ portfolio, priority }: PortfolioOverviewCardsProps) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="rounded-2xl bg-card border border-border/40 shadow-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center">
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-card-foreground tracking-tight">Portfolio Overview</h3>
            <p className="text-[11px] text-muted-foreground">All accounts & revenue</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {portfolio.map((m) => <MetricTile key={m.label} m={m} />)}
        </div>
      </div>

      <div className="rounded-2xl bg-card border border-border/40 shadow-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center">
            <Star className="h-4 w-4 text-amber-500" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-card-foreground tracking-tight">Priority Accounts</h3>
            <p className="text-[11px] text-muted-foreground">Priority Account Insights & Revenue</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {priority.map((m) => <MetricTile key={m.label} m={m} />)}
        </div>
      </div>
    </div>
  );
};

export { Building2, Users, DollarSign, AlertTriangle, Activity, Heart, UserCheck };
export default PortfolioOverviewCards;
