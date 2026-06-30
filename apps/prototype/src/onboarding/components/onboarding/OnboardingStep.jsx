import React from "react";

/**
 * GoCSM OnboardingStep — the product-wide step-state row (§10). One step has
 * exactly one state; every surface renders it with identical language.
 * Health-band colors are NEVER used here; every state pairs color + a distinct
 * glyph (never color alone). State changes snap, never tween. 'stalled' is
 * computed, operator-only, never client-visible. Maps to .onb-step.
 */
const STATE_ICON = {
  not_started: "circle",
  locked: "lock",
  in_progress: "circle-dot",
  verifying: "loader",
  waiting_on_agency: "clock",
  needs_attention: "alert-circle",
  done: "check-circle-2",
  skipped: "minus-circle",
  stalled: "alert-triangle",
};

export function OnboardingStep({ state = "not_started", title, sub, affix, className = "", ...rest }) {
  return (
    <div className={["onb-step", state, className].filter(Boolean).join(" ")} {...rest}>
      <span className="onb-dot" />
      <div style={{ minWidth: 0 }}>
        <div className="onb-title">
          {title}
          {affix && <span className="onb-affix">{affix}</span>}
        </div>
        {sub && <div className="onb-sub">{sub}</div>}
      </div>
    </div>
  );
}

/** Map of available states for reference / iteration. */
OnboardingStep.STATES = Object.keys(STATE_ICON);
