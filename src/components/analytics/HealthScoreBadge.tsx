import { cn } from "@/lib/utils";

interface HealthScoreBadgeProps {
  score: number;
  delta: number;
}

const getHealthStatus = (score: number) => {
  if (score >= 80) return { label: "Thriving", color: "text-health-green", bg: "bg-health-green-bg" };
  if (score >= 60) return { label: "Healthy", color: "text-health-blue", bg: "bg-health-blue-bg" };
  if (score >= 40) return { label: "Steady", color: "text-health-yellow", bg: "bg-health-yellow-bg" };
  return { label: "At Risk", color: "text-health-red", bg: "bg-health-red-bg" };
};

const HealthScoreBadge = ({ score }: HealthScoreBadgeProps) => {
  const status = getHealthStatus(score);

  return (
    <div className="flex flex-col">
      <span className={cn("text-sm font-semibold", status.color)}>
        {status.label}
      </span>
      <span className="text-xs text-muted-foreground">
        Score: {score}
      </span>
    </div>
  );
};

export default HealthScoreBadge;
