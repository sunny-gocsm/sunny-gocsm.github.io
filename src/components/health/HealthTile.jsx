import React from "react";

/**
 * GoCSM HealthTile — the live pastel distribution card (one per band on the
 * Health Overview). Soft band tint, mono count, percentage. Maps to
 * .health-tile in components.css.
 */
const LABELS = { thriving: "Thriving", healthy: "Healthy", watch: "Watch", atrisk: "At-Risk" };

export function HealthTile({ band, count, pct, label, className = "", ...rest }) {
  return (
    <div className={["health-tile", band, className].filter(Boolean).join(" ")} {...rest}>
      <div className="label">{label || LABELS[band]}</div>
      <div className="count">{count}</div>
      {pct != null && <div className="pct">{pct}</div>}
    </div>
  );
}
