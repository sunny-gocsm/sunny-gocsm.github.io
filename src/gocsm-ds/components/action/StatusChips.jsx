import React from "react";
import { Icon } from "../util/Icon.jsx";

/** SaveWindow — an amber-pending deadline badge (borrows --warn-*, never the Watch band). */
export function SaveWindow({ icon = "clock", children, ...rest }) {
  return (
    <span className="save-window" {...rest}>
      <Icon name={icon} />
      {children}
    </span>
  );
}

const SLA_TEXT = { ok: "On track", due: "Due today", breach: "Breaching", none: "No SLA" };
const SLA_ICON = { ok: "check", due: "clock", breach: "alert-triangle", none: "minus" };
/** SLAChip — colour AND glyph, never colour alone. state: ok | due | breach | none. */
export function SLAChip({ state = "ok", label, ...rest }) {
  return (
    <span className={["sla-chip", state].join(" ")} {...rest}>
      <Icon name={SLA_ICON[state]} />
      {label ?? SLA_TEXT[state]}
    </span>
  );
}

const STAGE_TEXT = { onboarding: "Onboarding", growth: "Growth", mature: "Mature" };
/** StageChip — quiet neutral lifecycle context. stage: onboarding | growth | mature. */
export function StageChip({ stage = "growth", label, ...rest }) {
  return (
    <span className="stage-chip" {...rest}>
      {label ?? STAGE_TEXT[stage] ?? stage}
    </span>
  );
}

/** ExecChip — who owns the work: a named member, or GoCSM·Auto. reassignable adds a menu affix. */
export function ExecChip({ member, auto = false, reassignable = false, ...rest }) {
  const cls = ["exec-chip", auto && "auto", reassignable && "reassignable"].filter(Boolean).join(" ");
  const affix = reassignable ? (
    <>
      <span className="sep" />
      <span className="rx"><Icon name="chevron-down" /></span>
    </>
  ) : null;
  if (auto) {
    return (
      <span className={cls} {...rest}>
        <span className="exec-ava"><Icon name="sparkles" /></span>
        GoCSM · Auto
        {affix}
      </span>
    );
  }
  const initial = (member || "?").trim().charAt(0).toUpperCase();
  return (
    <span className={cls} {...rest}>
      <span className="exec-ava">{initial}</span>
      {member}
      {affix}
    </span>
  );
}
