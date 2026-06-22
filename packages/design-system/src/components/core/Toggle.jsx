import React from "react";

/**
 * GoCSM Toggle — 20×38px switch for a live binary setting (Auto-balance,
 * Auto-track, role visibility). The locked variant shows a lock glyph and is
 * never dimmed (dimming reads as broken). Maps to .toggle / .toggle.on / .locked.
 */
export function Toggle({ on = false, locked = false, onChange, label, className = "", ...rest }) {
  const sw = (
    <span
      role="switch"
      aria-checked={on}
      aria-disabled={locked || undefined}
      tabIndex={locked ? -1 : 0}
      onClick={() => !locked && onChange && onChange(!on)}
      onKeyDown={(e) => {
        if (locked) return;
        if (e.key === " " || e.key === "Enter") { e.preventDefault(); onChange && onChange(!on); }
      }}
      className={["toggle", on ? "on" : "", locked ? "locked" : "", className].filter(Boolean).join(" ")}
      {...rest}
    />
  );
  if (!label) return sw;
  return (
    <label style={{ display: "inline-flex", alignItems: "center", gap: "var(--s-3)", cursor: locked ? "not-allowed" : "pointer", fontSize: "var(--t-body-sm)" }}>
      {sw}
      <span>{label}</span>
    </label>
  );
}
