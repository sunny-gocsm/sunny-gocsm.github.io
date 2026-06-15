import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface TrendPoint {
  day: string;
  revenue: number;
}

interface RevenueOverviewProps {
  totalMRR: number;
  mrrGrowth: number;
  revenueAtRisk: number;
  churnedRevenue: number;
  trend: TrendPoint[];
}

const fmt = (n: number) =>
  n >= 1000 ? `$${Math.round(n / 1000)}k` : `$${n}`;

const RevenueOverview = ({ totalMRR, mrrGrowth, revenueAtRisk, churnedRevenue, trend }: RevenueOverviewProps) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Left – metrics */}
      <div className="rounded-xl bg-card border border-border/50 shadow-card p-6">
        <h3 className="text-sm font-semibold text-card-foreground mb-5">Revenue Overview</h3>
        <div className="space-y-5">
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Total MRR</p>
            <p className="text-3xl font-bold text-card-foreground">${totalMRR.toLocaleString()}</p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Growth MoM</p>
              <p className="text-lg font-semibold text-health-green">+{Math.round(mrrGrowth)}%</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Revenue at Risk</p>
              <p className="text-lg font-semibold text-health-orange">${revenueAtRisk.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Churned (30d)</p>
              <p className="text-lg font-semibold text-health-red">${churnedRevenue.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right – trend chart */}
      <div className="rounded-xl bg-card border border-border/50 shadow-card p-6">
        <h3 className="text-sm font-semibold text-card-foreground mb-4">30-Day Revenue Trend</h3>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={trend} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
            <defs>
              <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={(v) => fmt(v)} />
            <Tooltip
              contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", fontSize: 12 }}
              formatter={(v: number) => [`$${v.toLocaleString()}`, "MRR"]}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fill="url(#revGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RevenueOverview;
