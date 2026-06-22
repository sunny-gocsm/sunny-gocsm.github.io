import React from "react";

/**
 * GoCSM HealthBadge — the SOLE source of band rendering. The locked
 * four-band spectrum: Thriving green / Healthy blue / Watch amber / At-Risk
 * red, rendered as soft tint + ink text. Never hand-roll band colors; never
 * reuse a band color for a non-health purpose. Maps to .health-badge.
 */
const LABELS = { thriving: "Thriving", healthy: "Healthy", watch: "Watch", atrisk: "At-Risk" };

export function HealthBadge({ band, label, className = "", ...rest }) {
  return (
    <span className={["health-badge", band, className].filter(Boolean).join(" ")} {...rest}>
      {label || LABELS[band] || band}
    </span>
  );
}
