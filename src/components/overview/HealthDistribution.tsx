import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface Segment {
  name: string;
  count: number;
  percent: number;
  color: string;
}

interface HealthDistributionProps {
  segments: Segment[];
}

const HealthDistribution = ({ segments }: HealthDistributionProps) => {
  const total = segments.reduce((s, seg) => s + seg.count, 0);

  return (
    <div className="rounded-xl bg-card border border-border/50 shadow-card p-6">
      <h3 className="text-sm font-semibold text-card-foreground mb-4">Portfolio Health Distribution</h3>
      <div className="flex items-center gap-8">
        <div className="relative w-[140px] h-[140px] flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={segments}
                cx="50%"
                cy="50%"
                innerRadius={42}
                outerRadius={62}
                dataKey="count"
                strokeWidth={2}
                stroke="hsl(var(--card))"
              >
                {segments.map((seg, i) => (
                  <Cell key={i} fill={seg.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", fontSize: 12 }}
                formatter={(v: number, name: string) => [`${v} accounts`, name]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xl font-bold text-card-foreground">{total}</span>
            <span className="text-[10px] text-muted-foreground">accounts</span>
          </div>
        </div>

        <div className="space-y-2.5 flex-1">
          {segments.map((seg) => (
            <div key={seg.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: seg.color }} />
                <span className="text-sm text-card-foreground">{seg.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-card-foreground">{seg.count}</span>
                <span className="text-xs text-muted-foreground w-10 text-right">{seg.percent}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HealthDistribution;
