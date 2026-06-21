import React from "react";

/**
 * GoCSM Monogram — a deterministic initials avatar for accounts/people. Initials =
 * first letter of the first + last word; the background color is derived from a hash
 * of the name (charCodeAt sum % palette), so the same name is always the same color.
 * Identity-only — never encodes health (that's HealthBadge's job). Maps to .monogram.
 */
const PALETTE = ["#0f6fd6", "#1e874b", "#b8860b", "#c0392b", "#6d28d9", "#0e7490", "#be185d", "#475569"];

function initials(name) {
  const w = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!w.length) return "?";
  if (w.length === 1) return w[0].slice(0, 2).toUpperCase();
  return (w[0][0] + w[w.length - 1][0]).toUpperCase();
}

function hashColor(name) {
  const s = String(name || "");
  let sum = 0;
  for (let i = 0; i < s.length; i++) sum += s.charCodeAt(i);
  return PALETTE[sum % PALETTE.length];
}

export function Monogram({ name, size = 28, className = "", ...rest }) {
  return (
    <span
      className={["monogram", className].filter(Boolean).join(" ")}
      style={{ width: size, height: size, background: hashColor(name), fontSize: Math.round(size * 0.4) }}
      aria-hidden
      {...rest}
    >
      {initials(name)}
    </span>
  );
}
