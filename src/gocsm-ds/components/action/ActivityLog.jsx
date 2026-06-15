import React from "react";
import { Icon } from "../util/Icon.jsx";
import { LiveStatus } from "../agentic/LiveStatus.jsx";
import { Button } from "../core/Button.jsx";

/** ActivityLog — the chronological ledger of every action GoCSM took, legible as a bank statement.
 *  Observational outcomes (delivered), never causal; blast-radius on committed customer-facing rows. */
export function ActivityLog({ filters = [], live = false, days = [], rows = null, ...rest }) {
  const grouped = days.length ? days : rows ? [{ rows }] : [];
  return (
    <div className="activity-log" {...rest}>
      <div className="filter-bar">
        <span className="fb-title">Activity</span>
        {filters.map((f, i) => (
          <span key={i} className="filter">{f}<span className="chev"><Icon name="chevron-down" /></span></span>
        ))}
        {live ? <LiveStatus state="fresh" label="live · updating" /> : null}
      </div>
      {grouped.map((d, i) => (
        <div key={i} className="activity-day">
          {d.label ? <><span className="d-label">{d.label}</span>{d.count != null ? <span className="d-count">{d.count}</span> : null}</> : null}
          {(d.rows || []).map((r, j) => {
            const agent = r.actor === "GoCSM";
            return (
              <div key={j} className="activity-row">
                <span className="lr-time">{r.time}</span>
                <span className="lr-actor">
                  <span className={["ava", agent ? "agent" : "member"].join(" ")}>{agent ? <Icon name="sparkles" /> : (r.actor || "?").slice(0, 2).toUpperCase()}</span>
                  <span className={["a-name", agent && "agent"].filter(Boolean).join(" ")}>{r.actor}</span>
                </span>
                <div>
                  <div className="lr-line">{r.line}</div>
                  {r.blastRadius ? <div>{r.blastRadius}</div> : null}
                </div>
                <span>{r.outcome}</span>
                {r.undo ? <Button variant="ghost" size="sm" onClick={r.onUndo}>Undo</Button> : null}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
