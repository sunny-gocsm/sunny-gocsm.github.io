import React from "react";

/**
 * GoCSM QueueRow — the operating-surface queue row (§11). Anatomy: subject +
 * impact number (mono) + state/blocked-by badge + time-vs-SLA (mono) + last
 * intervention memory + ONE inline action. Owner-aware: client-blocked rows
 * offer outreach; agency-blocked rows offer internal actions only. Maps to
 * .queue-row + .blocked-badge / .queue-sla / .queue-memory.
 */
export function QueueRow({
  subject,
  impact,
  blockedBy,
  sla,
  slaBreach = false,
  memory,
  action,
  className = "",
  ...rest
}) {
  return (
    <div className={["queue-row", className].filter(Boolean).join(" ")} {...rest}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 14 }}>{subject}</div>
        {memory && <div className="queue-memory">{memory}</div>}
      </div>
      {impact != null && <span className="queue-impact">{impact}</span>}
      {blockedBy && (
        <span className={`blocked-badge ${blockedBy}`}>
          {blockedBy === "client" ? "Blocked · client" : "Blocked · your team"}
        </span>
      )}
      {sla && <span className={["queue-sla", slaBreach ? "breach" : ""].filter(Boolean).join(" ")}>{sla}</span>}
      {action && <div style={{ flexShrink: 0 }}>{action}</div>}
    </div>
  );
}
