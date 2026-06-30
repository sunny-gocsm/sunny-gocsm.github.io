import React from "react";

/**
 * GoCSM QueueRow — the operating-surface queue row (§11).
 *
 * Layout: a stable 5-track CSS grid so MRR / badge / timing / action align
 * vertically across every row, including externally-pending rows that swap
 * the blocked-by badge for a "waiting on external review" pill.
 *
 *   [ subject (minmax(280px,1fr)) | mrr 72px | badge 132px | timing 96px | action auto ]
 *
 * Every track is always rendered — empty cells become placeholders — so the
 * grid resolves identically on every row.
 *
 * Severity:
 *  - slaTone: "neutral" | "danger" | "warning" — color for the SLA cell.
 *  - waitingNote: when set, replaces the blocked-badge with a neutral pill so
 *    external slowness is never mislabeled as a client block.
 */
export function QueueRow({
  subject,
  impact,
  blockedBy,
  sla,
  slaBreach = false,
  slaTone,
  slaSub,
  waitingNote,
  memory,
  action,
  className = "",
  onClick,
  ...rest
}) {
  const tone = slaTone ?? (slaBreach ? "danger" : "neutral");
  const slaClass = ["queue-sla", tone === "danger" ? "breach" : ""]
    .filter(Boolean)
    .join(" ");
  const slaStyle = tone === "warning" ? { color: "var(--warn-7)" } : undefined;
  const clickable = typeof onClick === "function";
  const handleKeyDown = clickable
    ? (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick(e);
        }
      }
    : undefined;

  return (
    <div
      className={["queue-row", className].filter(Boolean).join(" ")}
      {...rest}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role={clickable ? "button" : rest.role}
      tabIndex={clickable ? 0 : rest.tabIndex}
      style={{
        display: "grid",
        gridTemplateColumns:
          "minmax(280px, 1fr) 72px 132px 96px auto",
        columnGap: 16,
        alignItems: "center",
        cursor: clickable ? "pointer" : undefined,
        ...(rest.style || {}),
      }}
    >
      {/* Subject (name + step + reason + memory) */}
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 14, minWidth: 0 }}>{subject}</div>
        {memory && <div className="queue-memory">{memory}</div>}
      </div>

      {/* MRR */}
      <div style={{ textAlign: "right", minWidth: 0 }}>
        {impact != null ? <span className="queue-impact">{impact}</span> : null}
      </div>

      {/* Blocked-by / waiting pill */}
      <div style={{ minWidth: 0, display: "flex", justifyContent: "flex-start" }}>
        {waitingNote ? (
          <span
            className="blocked-badge"
            style={{ background: "var(--surface-2)", color: "var(--text-2)" }}
          >
            {waitingNote}
          </span>
        ) : blockedBy ? (
          <span className={`blocked-badge ${blockedBy}`}>
            {blockedBy === "client" ? "Blocked · client" : "Blocked · your team"}
          </span>
        ) : null}
      </div>

      {/* Timing token */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: 2,
          minWidth: 0,
        }}
      >
        {sla && (
          <span className={slaClass} style={slaStyle}>
            {sla}
          </span>
        )}
        {slaSub && (
          <span style={{ fontSize: 11, color: "var(--text-3)" }}>{slaSub}</span>
        )}
      </div>

      {/* Action cluster */}
      <div style={{ justifySelf: "end", flexShrink: 0 }}>{action}</div>
    </div>
  );
}
