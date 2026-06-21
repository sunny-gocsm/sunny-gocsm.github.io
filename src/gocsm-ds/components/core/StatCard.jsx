import React from "react";
import { Icon } from "../util/Icon.jsx";

/**
 * GoCSM StatCard — a value card for report cards / KPIs. A label, a big focal value, an
 * optional secondary axis (the "$142k (37)" dual read — money AND count in one tile), and
 * a signed delta vs a prior period rendered as a green/red arrow so direction reads before
 * the number. `size="hero"` for the one oversized headline figure. Tappable to drill in.
 * Maps to .stat-card.
 */
export function StatCard({
  label,
  icon,
  value,
  secondary,
  delta,
  deltaText,
  tone = "neutral",
  size = "md",
  onClick,
  className = "",
  ...rest
}) {
  const Tag = onClick ? "button" : "div";
  const dir = delta == null ? null : delta > 0 ? "up" : delta < 0 ? "down" : "flat";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      className={["stat-card", `size-${size}`, `tone-${tone}`, onClick ? "clickable" : "", className].filter(Boolean).join(" ")}
      onClick={onClick}
      {...rest}
    >
      {label != null ? (
        <span className="sc-label">
          {icon ? <Icon name={icon} /> : null}
          {label}
        </span>
      ) : null}
      <span className="sc-value">{value}</span>
      {(secondary != null || deltaText != null) ? (
        <span className="sc-foot">
          {secondary != null ? <span className="sc-secondary">{secondary}</span> : null}
          {deltaText != null && dir ? (
            <span className={["sc-delta", dir].join(" ")}>
              <Icon name={dir === "up" ? "arrow-up" : dir === "down" ? "arrow-down" : "minus"} />
              {deltaText}
            </span>
          ) : null}
        </span>
      ) : null}
    </Tag>
  );
}
