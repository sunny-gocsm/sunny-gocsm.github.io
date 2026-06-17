import React from "react";
import { Icon } from "../util/Icon.jsx";
import { LiveStatus } from "../agentic/LiveStatus.jsx";

/**
 * ActivityLog — the chronological ledger of every action GoCSM took, legible as
 * a bank statement: one row per action, columns aligned (time · actor · what
 * happened · outcome). Day groups stack vertically under a divider strip.
 * Outcomes are observational (delivered / opened), never causal.
 *
 * days: [{ label, count, rows: [...] }]   (preferred — grouped by day)
 * rows: [...]                              (shorthand for a single ungrouped list)
 * Each row: { time, actor, line, blastRadius?, outcome?, outcomeState?, auto?, undo?, onUndo? }
 *   actor === "GoCSM" renders the agent avatar; anyone else renders initials.
 *   outcomeState: "ok" | "pending" | "muted" (defaults to neutral).
 *   auto: true renders a small "Auto" marker (GoCSM ran it unattended).
 */
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
          {d.label ? (
            <div className="day-head">
              <span className="d-label">{d.label}</span>
              {d.count != null ? <span className="d-count">{d.count}</span> : null}
            </div>
          ) : null}
          {(d.rows || []).map((r, j) => {
            const agent = r.actor === "GoCSM";
            return (
              <div key={j} className="activity-row">
                <span className="lr-time">{r.time}</span>
                <span className="lr-actor">
                  <span className={["ava", agent ? "agent" : "member"].join(" ")}>
                    {agent ? <Icon name="sparkles" /> : (r.actor || "?").slice(0, 2).toUpperCase()}
                  </span>
                  <span className={["a-name", agent && "agent"].filter(Boolean).join(" ")}>{r.actor}</span>
                </span>
                <div className="lr-body">
                  <div className="lr-line">{r.line}</div>
                  {r.blastRadius ? <div className="lr-blast">{r.blastRadius}</div> : null}
                  {r.auto ? <div className="lr-auto"><Icon name="sparkles" />Auto</div> : null}
                </div>
                <div className="lr-end">
                  {r.outcome ? (
                    <span className={["lr-outcome", r.outcomeState].filter(Boolean).join(" ")}>{r.outcome}</span>
                  ) : null}
                  {r.undo ? (
                    <button type="button" className="undo-btn" onClick={r.onUndo}>
                      <Icon name="rotate-ccw" />Undo
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
