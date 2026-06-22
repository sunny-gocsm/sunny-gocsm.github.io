import React from "react";
import { Icon } from "../util/Icon.jsx";

/**
 * GoCSM Verdict — Tier 0 of the Insight Hierarchy: the AI hero. One bold,
 * plain-language sentence + the headline number/actions. Calm indigo AI
 * surface; tone tints the LEFT edge only (never floods the card). The
 * verdict sentence is the most important copy on any page. Maps to .verdict.
 */
export function Verdict({
  tone = "watch",
  attribution = "GoCSM AI",
  children,
  score = null,
  band = null,
  stamp = null,
  actions = null,
  className = "",
  ...rest
}) {
  const toneClass = { pos: "tone-pos", watch: "tone-watch", risk: "tone-risk" }[tone] || "";
  return (
    <div className={["verdict", toneClass, className].filter(Boolean).join(" ")} {...rest}>
      <div className="verdict-glyph" aria-hidden="true">
        <Icon name="sparkles" style={{ width: 18, height: 18 }} />
      </div>
      <div className="verdict-body">
        <div className="verdict-attr"><span className="dot" />{attribution}</div>
        <div className="verdict-line">{children}</div>
        <div className="verdict-meta">
          {score != null && (
            <span className="verdict-score" style={band ? { color: `var(--health-${band}-strong)` } : undefined}>{score}</span>
          )}
          {stamp}
          {actions && <div className="verdict-actions">{actions}</div>}
        </div>
      </div>
    </div>
  );
}
