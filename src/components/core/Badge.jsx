import React from "react";

/**
 * GoCSM Badge — a compact status pill (NOT a health band; use HealthBadge
 * for the four-band signal). A leading dot is shown by default; pass
 * dot={false} for a flat label. Maps to .badge + .badge-* in components.css.
 */
export function Badge({ variant = "neutral", dot = true, className = "", children, ...rest }) {
  const variantClass = {
    neutral: "badge-neutral",
    blue: "badge-blue",
    pos: "badge-pos",
    warn: "badge-warn",
    danger: "badge-danger",
    ai: "badge-ai",
  }[variant] || "badge-neutral";

  return (
    <span
      className={["badge", variantClass, dot ? "" : "no-dot", className].filter(Boolean).join(" ")}
      {...rest}
    >
      {children}
    </span>
  );
}
