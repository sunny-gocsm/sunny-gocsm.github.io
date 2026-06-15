import React from "react";
import { Icon } from "../util/Icon.jsx";
import { Button } from "../core/Button.jsx";

const LOAD = [["open", "On track", "inbox"], ["due", "Due today", "clock"], ["breach", "Breaching", "alert-triangle"]];
/** TeamPulseStrip — the owner's accountability view: SLA load, per-member throughput, escalations
 *  routed. A factual mirror, never a leaderboard; throughput bar is neutral, one action per row. */
export function TeamPulseStrip({ load = {}, members = [], escalations = [], title = "Team pulse", sub, ...rest }) {
  return (
    <div className="team-pulse" {...rest}>
      <div className="pulse-head"><span className="ph-title">{title}</span>{sub ? <span className="ph-sub">{sub}</span> : null}</div>
      <div className="sla-load">
        {LOAD.map(([k, lab, ic]) => load[k] != null ? (
          <div key={k} className={["load-chip", k].join(" ")}>
            <span className="lc-ico"><Icon name={ic} /></span><div className="lc-num">{load[k]}</div><div className="lc-lab">{lab}</div>
          </div>
        ) : null)}
      </div>
      <div className="members">
        {members.map((m, i) => (
          <div key={i} className="member-row">
            <span className="m-ava">{(m.name || "?").slice(0, 2).toUpperCase()}</span>
            <span className="m-name">{m.name}</span>
            <div className="m-stats">
              {(m.stats || []).map((s, j) => (
                <span key={j} className={["m-stat", s.tone].filter(Boolean).join(" ")}><span className="v">{s.v}</span> {s.l}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
      {escalations.length ? (
        <div>
          {escalations.map((e, i) => (
            <div key={i} className="escal-row">
              <span>{e.text}</span>
              {e.onTake ? <Button variant="secondary" size="sm" onClick={e.onTake}>Take it</Button> : null}
            </div>
          ))}
        </div>
      ) : <div className="escal-empty">Nothing needs you right now.</div>}
    </div>
  );
}
