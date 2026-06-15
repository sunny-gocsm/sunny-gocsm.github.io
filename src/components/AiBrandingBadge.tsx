import { Sparkle, Clock } from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

interface AiBrandingBadgeProps {
  size?: "xs" | "sm" | "md";
}

const getUpdateDates = () => {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const lastMonday = new Date(now);
  lastMonday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
  const nextMonday = new Date(lastMonday);
  nextMonday.setDate(lastMonday.getDate() + 7);

  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return { lastUpdated: fmt(lastMonday), nextUpdate: fmt(nextMonday) };
};

const AiBrandingBadge = ({ size = "sm" }: AiBrandingBadgeProps) => {
  const sizeClasses = {
    xs: { gap: "gap-0.5", icon: "h-2.5 w-2.5", clock: "h-2 w-2", text: "text-[8px]", font: "font-medium" },
    sm: { gap: "gap-1", icon: "h-3.5 w-3.5", clock: "h-3 w-3", text: "text-[10px]", font: "font-semibold" },
    md: { gap: "gap-1.5", icon: "h-4 w-4", clock: "h-3.5 w-3.5", text: "text-xs", font: "font-bold" },
  };
  const s = sizeClasses[size];
  const { lastUpdated, nextUpdate } = getUpdateDates();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={`inline-flex items-center ${s.gap} cursor-help`}>
          <span className={`${s.icon} relative`}
            style={{
              background: "linear-gradient(135deg, #f59e0b, #d97706, #b45309)",
              WebkitBackgroundClip: "text",
            }}
          >
            <Sparkle
              className={s.icon}
              fill="url(#gocsm-sparkle-gradient)"
              stroke="url(#gocsm-sparkle-gradient)"
              strokeWidth={1.5}
            />
            <svg width="0" height="0" className="absolute">
              <defs>
                <linearGradient id="gocsm-sparkle-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#fbbf24" />
                  <stop offset="50%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#d97706" />
                </linearGradient>
              </defs>
            </svg>
          </span>
          <span className={`whitespace-nowrap ${s.text}`}>
            <span className="font-medium text-muted-foreground">Powered by </span>
            <span
              className={s.font}
              style={{
                background: "linear-gradient(135deg, #fbbf24, #f59e0b, #d97706)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              GoCSM AI
            </span>
          </span>
          <Clock className={`${s.clock} text-muted-foreground/60 flex-shrink-0`} />
        </span>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-[220px] p-3">
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-popover-foreground">AI insights update weekly</p>
          <div className="text-[11px] text-muted-foreground space-y-0.5">
            <p>Last Updated: <span className="font-medium text-popover-foreground">{lastUpdated}</span></p>
            <p>Next Update: <span className="font-medium text-popover-foreground">{nextUpdate}</span></p>
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
};

export default AiBrandingBadge;
