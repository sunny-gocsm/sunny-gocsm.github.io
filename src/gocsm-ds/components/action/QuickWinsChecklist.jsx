import React from "react";
import { Icon } from "../util/Icon.jsx";
import { Toggle } from "../core/Toggle.jsx";

/** QuickWinsChecklist — the new-agency empty state (never a wall of 0s): an onboarding hero with three
 *  starter plays, each a one-line benefit + activate Toggle. Any statistical claim carries a Projection tag. */
export function QuickWinsChecklist({
  title = "Start with a quick win", promise, eyebrow = "New here", claim,
  plays = [], onActivateAll, ...rest
}) {
  return (
    <div className="qw" {...rest}>
      <div className="qw-hero">
        <span className="qw-eyebrow">{eyebrow}</span>
        <div className="qw-title">{title}</div>
        {promise ? <div className="qw-promise">{promise}</div> : null}
        {claim ? (
          <div className="qw-basis">
            <span className="qw-conf"><Icon name="chart-spline" />{claim.basisLabel || "Projection"}</span>
            <span className="qw-basis-t">{claim.text}</span>
          </div>
        ) : null}
        {onActivateAll ? (
          <div className="qw-cta">
            <button type="button" className="btn-start" onClick={onActivateAll}>Activate all {plays.length}</button>
            {claim && claim.time ? <span className="meta-time">{claim.time}</span> : null}
          </div>
        ) : null}
      </div>
      <div className="qw-list">
        {plays.map((p, i) => (
          <div key={i} className="qw-item">
            <span className="qw-step">{i + 1}</span>
            <span className={["qw-ico", p.tone || "login"].join(" ")}><Icon name={p.icon || "log-in"} /></span>
            <div className="qw-text"><div className="qw-name">{p.name}</div><div className="qw-benefit">{p.benefit}</div></div>
            <div className="qw-toggle-wrap"><Toggle on={p.on} onChange={p.onToggle} /></div>
          </div>
        ))}
      </div>
    </div>
  );
}
