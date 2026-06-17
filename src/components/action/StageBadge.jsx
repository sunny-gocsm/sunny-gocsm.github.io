import React from "react";
import { Icon } from "../util/Icon.jsx";

const STAGE_TEXT = {
  onboarding: "Onboarding",
  activated: "Activated",
  established: "Established",
  lapsing: "Lapsing",
  dormant: "Dormant",
  churned: "Churned",
};
const STAGE_ICON = {
  onboarding: "play",
  activated: "sparkles",
  established: "star",
  lapsing: "trending-down",
  dormant: "moon",
  churned: "x",
};

/**
 * GoCSM StageBadge — the customer LIFECYCLE stage as an inline chip.
 *
 * A structural, cool-slate axis kept deliberately distinct from the four health
 * bands: the glyph carries the meaning, color is a quiet reinforcement, and
 * Health stays the only vivid signal on screen. This is NOT a health signal —
 * for the four-band customer-health signal use HealthBadge instead.
 *
 * stage: onboarding | activated | established | lapsing | dormant | churned
 * reactivated: renders the transient "↑ Reactivated" win affix (a badge, never
 *   a persistent stage color) for an account that resumed activity.
 * Maps to .stage-badge + .stage-badge.<stage> in components-v3-action.css.
 */
export function StageBadge({ stage = "activated", label, reactivated = false, className = "", ...rest }) {
  const key = STAGE_TEXT[stage] ? stage : "activated";
  return (
    <span className={["stage-badge", key, className].filter(Boolean).join(" ")} {...rest}>
      <Icon name={STAGE_ICON[key]} />
      {label ?? STAGE_TEXT[key]}
      {reactivated ? (
        <span className="sb-react">
          <Icon name="arrow-up" />
          Reactivated
        </span>
      ) : null}
    </span>
  );
}
