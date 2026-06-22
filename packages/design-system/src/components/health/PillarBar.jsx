import React from "react";

/**
 * GoCSM PillarBar — the four-pillar health-weight breakdown (PAS / Revenue /
 * Login / Feedback). Stacked segments in the pillar viz colors (never band
 * colors), with an optional legend. Weights are AGENCY-CONFIGURABLE sample
 * data — never present them as fixed truth. Maps to .pillar-bar / .pillar-legend.
 */
const PILLARS = [
  { key: "pas", label: "Product Adoption" },
  { key: "revenue", label: "Revenue" },
  { key: "login", label: "Login Activity" },
  { key: "feedback", label: "Feedback" },
];

export function PillarBar({ weights = {}, legend = true, className = "", ...rest }) {
  return (
    <div className={className} {...rest}>
      <div className="pillar-bar">
        {PILLARS.map((p) => (
          <div key={p.key} className={`pillar-seg ${p.key}`} style={{ width: `${weights[p.key] || 0}%` }} />
        ))}
      </div>
      {legend && (
        <div className="pillar-legend">
          {PILLARS.map((p) => (
            <span key={p.key} className={`pillar-legend-item ${p.key}`}>
              {p.label}
              {weights[p.key] != null && <span className="wt">{weights[p.key]}%</span>}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
