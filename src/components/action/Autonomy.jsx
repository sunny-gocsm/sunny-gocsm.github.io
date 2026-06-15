import React from "react";
import { Icon } from "../util/Icon.jsx";

const DIAL = [
  { key: "watch", label: "Watch", icon: "eye" },
  { key: "draft", label: "Draft" },
  { key: "approve", label: "Approve" },
  { key: "auto", label: "Auto", icon: "sparkles" },
];
/** AutonomyDial — 4-step Watch→Draft→Approve→Auto. Only Auto reaches the AI indigo. */
export function AutonomyDial({ value = "watch", locked = false, ...rest }) {
  return (
    <div className={["autonomy-dial", locked && "locked"].filter(Boolean).join(" ")} {...rest}>
      {DIAL.map((s) => {
        const sel = s.key === value;
        const showIcon = s.icon && (s.key === "watch" || sel);
        return (
          <span key={s.key} className={["seg", s.key, sel && "sel", locked && "disabled"].filter(Boolean).join(" ")}>
            {showIcon ? <Icon name={s.icon} /> : null}
            {s.label}
          </span>
        );
      })}
    </div>
  );
}

const BADGE = {
  watch: { icon: "eye", label: "Watch" },
  draft: { icon: "pencil", label: "Draft" },
  approve: { icon: "check", label: "Approve" },
  auto: { icon: "sparkles", label: "Auto" },
};
/** AutonomyBadge — compact read-only autonomy level, for cards. */
export function AutonomyBadge({ level = "watch", ...rest }) {
  const b = BADGE[level] ?? BADGE.watch;
  return (
    <span className={["autonomy-badge", level].join(" ")} {...rest}>
      <Icon name={b.icon} />
      {b.label}
    </span>
  );
}

/** AutopilotMeter — the moat made visible. --pos-7 fill over the neutral track (never a band colour). */
export function AutopilotMeter({ on = 0, of = 0, size = "md", label = "retention jobs on autopilot", ...rest }) {
  const pct = of > 0 ? Math.max(0, Math.min(100, (on / of) * 100)) : 0;
  const meterCls = ["autopilot-meter", size === "lg" && "lg", size === "sm" && "sm"].filter(Boolean).join(" ");
  return (
    <div {...rest}>
      <div className={meterCls}>
        <span className="on" style={{ width: pct + "%" }} />
      </div>
      <div className="autopilot-legend">
        {on > 0 ? (
          <span>
            <span className="autopilot-count">{on}</span> of <span className="autopilot-count">{of}</span> {label}
          </span>
        ) : (
          <span>
            <span className="autopilot-count">0</span> of <span className="autopilot-count">{of}</span> — nothing on autopilot yet
          </span>
        )}
      </div>
    </div>
  );
}
