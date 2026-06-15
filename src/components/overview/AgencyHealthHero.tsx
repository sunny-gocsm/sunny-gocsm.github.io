import { Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface HealthBand {
  name: string;
  count: number;
  percent: number;
  color: string;
}

interface AgencyHealthHeroProps {
  score: number;
  scoreDelta: number;
  scorePeriod: string;
  status: string;
  healthBands: HealthBand[];
}

const bandStyle: Record<string, { text: string; bg: string; ring: string }> = {
  Thriving: { text: "text-health-green", bg: "bg-health-green-bg", ring: "ring-health-green/20" },
  Healthy: { text: "text-health-blue", bg: "bg-health-blue-bg", ring: "ring-health-blue/20" },
  Steady: { text: "text-health-yellow", bg: "bg-health-yellow-bg", ring: "ring-health-yellow/20" },
  "At Risk": { text: "text-health-red", bg: "bg-health-red-bg", ring: "ring-health-red/20" },
};

const bandTooltip: Record<string, string> = {
  Thriving: "Health score is 80% or above. These accounts are thriving with strong engagement and reliable payments.",
  Healthy: "Health score is between 60%–79%. These accounts are steady but may benefit from proactive engagement.",
  Steady: "Health score is between 40%–59%. These accounts show warning signs and need attention soon.",
  "At Risk": "Health score is below 40%. These accounts are at high risk of churn and require immediate intervention.",
};

const bandFilterValue: Record<string, string> = {
  Thriving: "thriving",
  Healthy: "healthy",
  Steady: "steady",
  "At Risk": "at-risk",
};

const AgencyHealthHero = ({
  score,
  scoreDelta,
  scorePeriod,
  status,
  healthBands,
}: AgencyHealthHeroProps) => {
  const navigate = useNavigate();
  const getStatusColor = () => {
    if (score >= 80) return { stroke: "hsl(var(--health-green))", text: "text-health-green", bg: "bg-health-green-bg" };
    if (score >= 60) return { stroke: "hsl(var(--health-yellow))", text: "text-health-yellow", bg: "bg-health-yellow-bg" };
    if (score >= 40) return { stroke: "hsl(var(--health-orange))", text: "text-health-orange", bg: "bg-health-orange-bg" };
    return { stroke: "hsl(var(--health-red))", text: "text-health-red", bg: "bg-health-red-bg" };
  };

  const colors = getStatusColor();
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (score / 100) * circumference;
  const totalAccounts = healthBands.reduce((s, b) => s + b.count, 0);
  const atRiskCount = healthBands.filter(b => b.name === "Steady" || b.name === "At Risk").reduce((s, b) => s + b.count, 0);

  return (
    <div className="rounded-2xl bg-card border border-border/40 shadow-card-lg p-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-lg font-semibold text-card-foreground tracking-tight">Agency Health Score</h2>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-[260px]">
                <p className="text-xs">Health score is calculated using engagement, payment reliability, revenue retention, and support risk.</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <p className="text-sm text-muted-foreground">
            Based on {totalAccounts} tracked accounts. {atRiskCount > 0 ? `${atRiskCount} need attention.` : "All accounts are on track."} {atRiskCount > 0 ? `${atRiskCount} need attention.` : "All accounts are on track."}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-12">
        {/* Circular gauge */}
        <div className="relative flex-shrink-0">
          <svg width="160" height="160" viewBox="0 0 100 100" className="-rotate-90">
            <circle cx="50" cy="50" r="45" fill="none" stroke="hsl(var(--border))" strokeWidth="5" strokeOpacity="0.5" />
            <circle
              cx="50" cy="50" r="45" fill="none"
              stroke={colors.stroke} strokeWidth="5" strokeLinecap="round"
              strokeDasharray={circumference} strokeDashoffset={offset}
              className="transition-all duration-1000 ease-out"
              style={{ filter: `drop-shadow(0 0 6px ${colors.stroke}40)` }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-xs font-medium ${colors.text}`}>{status}</span>
            <span className="text-4xl font-bold text-card-foreground tracking-tight">{score}</span>
            <span className={`text-xs font-medium ${scoreDelta >= 0 ? "text-health-green" : "text-health-red"}`}>
              {scoreDelta >= 0 ? "↑" : "↓"} {scoreDelta >= 0 ? "+" : ""}{scoreDelta} {scorePeriod}
            </span>
          </div>
        </div>

        {/* Health band boxes */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1">
          {healthBands.map((band) => {
            const style = bandStyle[band.name] ?? { text: "text-foreground", bg: "bg-muted", ring: "" };
            return (
              <Tooltip key={band.name}>
              <TooltipTrigger asChild>
                  <div
                    className={`rounded-xl ${style.bg} p-4 cursor-pointer ring-1 ${style.ring} card-hover-lift`}
                    onClick={() => navigate(`/analytics?health=${bandFilterValue[band.name] ?? ""}`)}
                  >
                    <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1">{band.name}</p>
                    <p className={`text-2xl font-bold ${style.text} tracking-tight`}>{band.count}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{band.percent}% of portfolio</p>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[220px]">
                  <p className="text-xs">{bandTooltip[band.name] ?? band.name}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AgencyHealthHero;
