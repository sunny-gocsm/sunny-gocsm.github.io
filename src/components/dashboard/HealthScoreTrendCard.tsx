import { useEffect, useRef } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { LineChart, Line, XAxis, ResponsiveContainer, Tooltip, Area, AreaChart } from "recharts";

interface HealthScoreTrendCardProps {
  score: number;
  explanation: string;
  trendData: { label: string; score: number }[];
  changePoints: number;
  direction: "up" | "down";
  hasSufficientData: boolean;
}

const getScoreConfig = (score: number) => {
  if (score >= 80) return { label: "Thriving", colorClass: "text-health-green", strokeColor: "hsl(152, 60%, 45%)", bgGlow: "from-health-green/10 to-transparent" };
  if (score >= 60) return { label: "Healthy", colorClass: "text-health-blue", strokeColor: "hsl(215, 72%, 52%)", bgGlow: "from-health-blue/10 to-transparent" };
  if (score >= 40) return { label: "Steady", colorClass: "text-health-yellow", strokeColor: "hsl(40, 90%, 52%)", bgGlow: "from-health-yellow/10 to-transparent" };
  return { label: "At Risk", colorClass: "text-health-red", strokeColor: "hsl(0, 72%, 56%)", bgGlow: "from-health-red/10 to-transparent" };
};

const HealthScoreTrendCard = ({
  score,
  explanation,
  trendData,
  changePoints,
  direction,
  hasSufficientData,
}: HealthScoreTrendCardProps) => {
  const circleRef = useRef<SVGCircleElement>(null);
  const { label, colorClass, strokeColor } = getScoreConfig(score);
  const isDown = direction === "down";

  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  useEffect(() => {
    const el = circleRef.current;
    if (el) {
      el.style.strokeDasharray = `${circumference}`;
      el.style.strokeDashoffset = `${circumference}`;
      requestAnimationFrame(() => {
        el.style.transition = "stroke-dashoffset 1.2s ease-out";
        el.style.strokeDashoffset = `${offset}`;
      });
    }
  }, [score, circumference, offset]);

  return (
    <div className="rounded-xl bg-card shadow-card-lg p-6 overflow-hidden relative">
      {/* Subtle gradient glow behind score */}
      <div className={`absolute top-0 left-0 w-64 h-64 rounded-full bg-gradient-radial ${getScoreConfig(score).bgGlow} blur-3xl opacity-60 -translate-x-1/4 -translate-y-1/4 pointer-events-none`} />

      <h3 className="text-sm font-semibold text-card-foreground mb-5 relative z-10">
        Overall Health Score
      </h3>

      <div className="flex flex-col md:flex-row items-start gap-8 relative z-10">
        {/* Left: Score Circle */}
        <div className="flex flex-col items-center gap-3 flex-shrink-0">
          <div className="relative w-36 h-36">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50" cy="50" r={radius}
                fill="none"
                stroke="hsl(216, 18%, 93%)"
                strokeWidth="7"
              />
              <circle
                ref={circleRef}
                cx="50" cy="50" r={radius}
                fill="none"
                stroke={strokeColor}
                strokeWidth="7"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-extrabold text-card-foreground">{score}</span>
              <span className={`text-xs font-semibold ${colorClass}`}>{label}</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground text-center max-w-[180px] leading-relaxed">
            {explanation}
          </p>
        </div>

        {/* Right: Trend Chart */}
        <div className="flex-1 w-full min-w-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">Health Trend (90 days)</span>
            {hasSufficientData && (
              <div className="flex items-center gap-1.5">
                {isDown ? (
                  <TrendingDown className="h-3.5 w-3.5 text-health-red" />
                ) : (
                  <TrendingUp className="h-3.5 w-3.5 text-health-green" />
                )}
                <span className={`text-xs font-medium ${isDown ? "text-health-red" : "text-health-green"}`}>
                  {isDown ? "Down" : "Up"} {changePoints} points this month
                </span>
              </div>
            )}
          </div>

          {hasSufficientData ? (
            <ResponsiveContainer width="100%" height={140}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(215, 72%, 52%)" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="hsl(215, 72%, 52%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: "hsl(218, 14%, 55%)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(0, 0%, 100%)",
                    border: "1px solid hsl(216, 18%, 90%)",
                    borderRadius: "8px",
                    fontSize: "12px",
                    boxShadow: "0 4px 12px hsla(220, 25%, 12%, 0.1)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="hsl(215, 72%, 52%)"
                  strokeWidth={2.5}
                  fill="url(#scoreGradient)"
                  dot={false}
                  activeDot={{ r: 4, fill: "hsl(215, 72%, 52%)", stroke: "hsl(0, 0%, 100%)", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[140px]">
              <p className="text-sm text-muted-foreground">Not enough data yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HealthScoreTrendCard;
