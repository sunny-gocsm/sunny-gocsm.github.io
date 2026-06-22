import React from "react";

/**
 * GoCSM MetricCard — the live summary tile. NEUTRAL surface; emphasis comes
 * from the number + delta + icon chip, NEVER a saturated colored background
 * (the red-bleed rule). At most ONE red element per card, carried by a thin
 * left accent rule. Maps to .metric-card in components.css.
 */
export function MetricCard({
  label,
  value,
  icon = null,
  iconTone = "info",
  accent = null,
  delta = null,
  context = null,
  className = "",
  ...rest
}) {
  return (
    <div
      className={[
        "metric-card",
        accent === "neg" ? "accent-neg" : accent === "pos" ? "accent-pos" : "",
        className,
      ].filter(Boolean).join(" ")}
      {...rest}
    >
      <div className="head">
        <span className="t-label">{label}</span>
        {icon && <span className={`icon ${iconTone}`}>{icon}</span>}
      </div>
      <div className="metric metric-xl">{value}</div>
      {(delta || context) && (
        <div style={{ display: "flex", alignItems: "center", gap: "var(--s-2)" }}>
          {delta}
          {context && <span className="t-caption">{context}</span>}
        </div>
      )}
    </div>
  );
}
