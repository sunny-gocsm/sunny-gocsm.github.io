import { cn } from "@/lib/utils";

interface KpiItem {
  label: string;
  value: string;
  change: string;
  positive: boolean;
  hideCompare?: boolean;
}

interface KpiStripProps {
  items: KpiItem[];
}

const KpiStrip = ({ items }: KpiStripProps) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {items.map((item, i) => (
        <div
          key={item.label}
          className="rounded-xl bg-card border border-border/40 shadow-card p-4 card-hover-lift group"
          style={{ animationDelay: `${i * 0.04}s` }}
        >
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-2 group-hover:text-foreground/70 transition-colors">
            {item.label}
          </p>
          <p className="text-2xl font-bold text-card-foreground mb-1 tracking-tight">{item.value}</p>
          <span
            className={cn(
              "text-xs font-medium",
              item.positive ? "text-health-green" : "text-health-red"
            )}
           >
            {item.change}{!item.hideCompare && <span className="text-muted-foreground font-normal"> vs Previous 30 Days</span>}
          </span>
        </div>
      ))}
    </div>
  );
};

export default KpiStrip;
