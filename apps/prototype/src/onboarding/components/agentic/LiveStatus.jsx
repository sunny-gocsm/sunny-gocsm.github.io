import React from "react";

/**
 * GoCSM LiveStatus — the Liveness primitive. "A system that is watching, not a
 * page you visit." Derives state from now − syncedAt: fresh (<5m, green pulse)
 * / recent (<24h, neutral) / stale (>24h, amber, honest) / error (sync fail,
 * red, actionable). Pulse runs ONLY in fresh. Maps to .live-status / .live-dot.
 */
export function LiveStatus({ state = "fresh", label, watchingCount, className = "", ...rest }) {
  const defaults = {
    fresh: "live · checked just now",
    recent: "checked 3h ago",
    stale: "last checked Jun 3 — may be behind",
    error: "sync paused — reconnect HighLevel →",
  };
  return (
    <span
      className={["live-status", state === "error" ? "error" : "", className].filter(Boolean).join(" ")}
      {...rest}
    >
      <span className={`live-dot ${state}`} />
      <span>{label || defaults[state]}</span>
      {watchingCount != null && state !== "error" && (
        <span style={{ color: "var(--text-3)" }}>· watching {watchingCount} accounts for you</span>
      )}
    </span>
  );
}
