import React from "react";
import { Icon } from "../util/Icon.jsx";

const ORDER = ["onboarding", "activated", "established", "lapsing", "dormant", "churned"];
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
 * GoCSM StageProgress — the customer LIFECYCLE journey as a horizontal track,
 * with the account's current stage emphasized (filled). Forward stages
 * (onboarding → established) read solid; the decline tail (lapsing → churned)
 * reads dashed. Structural cool-slate tones (--stage-*) — never the health
 * bands, so it never competes with the health signal.
 *
 * stage: the current stage. stages: optional ordered subset (defaults to all six).
 * compact: show only the current stage's label.
 * Maps to .stage-progress in components-v3-action.css.
 */
export function StageProgress({ stage = "activated", stages, compact = false, className = "", ...rest }) {
  const seq = stages && stages.length ? stages : ORDER;
  const declineStart = seq.indexOf("lapsing");
  return (
    <div className={["stage-progress", compact ? "compact" : "", className].filter(Boolean).join(" ")} {...rest}>
      {seq.map((s, i) => {
        const isCurrent = s === stage;
        const isDecline = declineStart >= 0 && i >= declineStart;
        const nodeCls = ["sp-node", s, isCurrent ? "current" : "", isDecline ? "decline" : ""]
          .filter(Boolean)
          .join(" ");
        return (
          <React.Fragment key={s}>
            {i > 0 ? (
              <span className={["sp-line", isDecline ? "decline" : ""].filter(Boolean).join(" ")} />
            ) : null}
            <span className={nodeCls} title={STAGE_TEXT[s] ?? s}>
              <span className="sp-dot">
                <Icon name={STAGE_ICON[s]} />
              </span>
              {!compact || isCurrent ? <span className="sp-label">{STAGE_TEXT[s] ?? s}</span> : null}
            </span>
          </React.Fragment>
        );
      })}
    </div>
  );
}
