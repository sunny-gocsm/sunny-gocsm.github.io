import React from "react";

/**
 * GoCSM StackedBar — a generic horizontal stacked distribution bar. Each segment is
 * { pct, tone, label }; tone ∈ neg | warn | pos | neutral. Used for composition /
 * segment readouts ("what's in this set right now") that re-skew as a set changes.
 * Maps to .stacked-bar in components-v3-additions.css.
 */
export function StackedBar({ segments = [], height = 8, className = "", ...rest }) {
  return (
    <div className={["stacked-bar", className].filter(Boolean).join(" ")} style={{ height }} {...rest}>
      {segments.map((s, i) => (
        <span
          key={i}
          className={["sbar-seg", s.tone ? `tone-${s.tone}` : "tone-neutral"].join(" ")}
          style={{ width: `${s.pct}%` }}
          title={s.label != null ? `${s.label} · ${s.pct}%` : undefined}
        />
      ))}
    </div>
  );
}
