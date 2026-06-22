import React from "react";
import { Icon } from "../util/Icon.jsx";

/**
 * GoCSM WhyCard — Tier 1 of the Insight Hierarchy. A Risk OR Opportunity
 * column of plain-language drivers; the header rule carries the semantic
 * color, the body stays neutral. Every driver carries a prescriptive
 * .driver-action pointer. Maps to .why-card / .driver in components.css.
 *
 * Pass drivers as: { title, desc, severity: 'high'|'med'|'pos', action }
 */
export function WhyCard({ kind = "risk", title, aiTagged = true, drivers = [], className = "", ...rest }) {
  const sevClass = { high: "sev-high", med: "sev-med", pos: "sev-pos" };
  return (
    <div className={["why-card", kind, className].filter(Boolean).join(" ")} {...rest}>
      <div className="top-rule" />
      <div className="why-head">
        <span className="why-title">
          <Icon name={kind === "risk" ? "alert-triangle" : "trending-up"} style={{ width: 15, height: 15 }} />
          {title || (kind === "risk" ? "Risk" : "Opportunity")}
        </span>
        {aiTagged && <span className="why-ai-tag"><Icon name="sparkles" style={{ width: 12, height: 12 }} />AI</span>}
      </div>
      <div className="why-body">
        {drivers.map((d, i) => (
          <div key={i} className={["driver", sevClass[d.severity] || ""].filter(Boolean).join(" ")}>
            <div className="driver-title">{d.title}</div>
            <div className="driver-desc">{d.desc}</div>
            {d.action && <span className="driver-action">{d.action}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
