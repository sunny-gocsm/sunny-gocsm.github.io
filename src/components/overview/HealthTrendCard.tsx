import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface TrendPoint {
  day: string;
  score: number;
}

interface HealthTrendCardProps {
  trend: TrendPoint[];
}

const HealthTrendCard = ({ trend }: HealthTrendCardProps) => {
  return (
    <div className="rounded-2xl bg-card border border-border/40 shadow-card p-6">
      <h3 className="text-sm font-semibold text-card-foreground mb-4 tracking-tight">90-Day Health Trend</h3>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={trend} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
          <defs>
            <linearGradient id="healthTrendGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              border: "1px solid hsl(var(--border))",
              fontSize: 12,
              backgroundColor: "hsl(var(--card))",
              boxShadow: "var(--card-shadow-lg)",
            }}
            formatter={(v: number) => [`${v}`, "Health Score"]}
          />
          <Area
            type="monotone"
            dataKey="score"
            stroke="hsl(var(--primary))"
            strokeWidth={2.5}
            fill="url(#healthTrendGrad)"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2, fill: "hsl(var(--card))", stroke: "hsl(var(--primary))" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default HealthTrendCard;
