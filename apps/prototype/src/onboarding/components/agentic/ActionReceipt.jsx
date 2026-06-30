import React from "react";

/**
 * GoCSM ActionReceipt — the Reversible Action primitive. Renders inline where
 * an action was triggered (never an ephemeral toast). The blastRadius line is
 * REQUIRED — it states who is / isn't affected. Lifecycle: pending (grace
 * countdown, undoable) → sent (committed, report-back promised) → stopped
 * (undone, nothing happened). Maps to .action-receipt in components.css.
 */
export function ActionReceipt({
  state = "pending",
  title,
  scope,
  blastRadius,
  graceSeconds = 5,
  reportBack,
  onUndo,
  className = "",
  ...rest
}) {
  const stateClass = { sent: "committed", stopped: "stopped" }[state] || "";
  return (
    <div className={["action-receipt", stateClass, className].filter(Boolean).join(" ")} {...rest}>
      <div className="ar-title">
        <i data-lucide={state === "stopped" ? "circle-slash" : state === "sent" ? "circle-check" : "loader"} style={{ width: 15, height: 15 }} />
        {title}
      </div>
      {scope && <div className="ar-scope">{scope}</div>}
      {blastRadius && <div className="ar-blast">{blastRadius}</div>}
      <div className="ar-foot">
        {state === "pending" && (
          <>
            <span className="ar-countdown">Sending in {graceSeconds}s</span>
            <button className="btn btn-secondary btn-sm" onClick={onUndo}>Undo</button>
          </>
        )}
        {state === "sent" && (
          <span className="ar-countdown sent">Sent{reportBack ? ` · ${reportBack}` : ""}</span>
        )}
        {state === "stopped" && <span className="ar-countdown">Stopped — nothing was sent.</span>}
      </div>
    </div>
  );
}
