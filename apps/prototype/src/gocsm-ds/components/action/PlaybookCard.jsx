import React from "react";
import { Icon } from "../util/Icon.jsx";
import { Button } from "../core/Button.jsx";
import { LiveStatus } from "../agentic/LiveStatus.jsx";
import { AutonomyBadge } from "./Autonomy.jsx";
import { ReceiptStat } from "./Receipts.jsx";

const STATE = {
  off:       { cls: "off",     icon: "circle", label: "Off" },
  ranonce:   { cls: "ranonce", icon: "check",  label: "Ran once" },
  on:        { cls: "on",      dot: true,      label: "On · autopilot" },
  paused:    { cls: "paused",  icon: "pause",  label: "Paused" },
  // back-compat aliases
  available: { cls: "off",     icon: "circle", label: "Off" },
  running:   { cls: "on",      dot: true,      label: "On · autopilot" },
};
const DEFAULT_CTA = {
  off: "Run it", ranonce: "Keep it running", on: "Manage", paused: "Resume",
  available: "Run it", running: "Manage",
};

/**
 * PlaybookCard — one Situation, bundled: the problem it solves → what it does → the outcome
 * → what's included, with an always-visible state (Off → Ran once → On · autopilot) and a live
 * "N accounts match today". The Library card. State drives the primary action; activation is
 * owner-language ("Run it" / "Keep it running"), never "Activate" or "Configure".
 */
export function PlaybookCard({
  state = "off", icon = "book-open", title, subtitle, matchCount,
  problem, does, outcome, bundle = [], inPlay, autonomy, receipts = null,
  onActivate, activateLabel, ...rest
}) {
  const s = STATE[state] || STATE.off;
  const isOn = s.cls === "on";
  return (
    <div className="playbook-card" {...rest}>
      <div className="pb-head">
        <div className="pb-toprow">
          <span className="pb-ico"><Icon name={icon} /></span>
          <span className={["playbook-state", s.cls].join(" ")}>
            {s.dot ? <span className="rdot" /> : <Icon name={s.icon} />}
            {s.label}
          </span>
        </div>
        <div className="pb-title">{title}</div>
        {subtitle ? <div className="pb-subtitle">{subtitle}</div> : null}
        {matchCount != null ? (
          <div className="pb-match"><Icon name="users" /><span className="n">{matchCount}</span> accounts match today</div>
        ) : null}
      </div>
      {problem || does || outcome ? (
        <div className="pb-body">
          {problem ? <div className="pb-block"><div className="blk-h">The problem it solves</div><p>{problem}</p></div> : null}
          {does ? <div className="pb-block"><div className="blk-h">What it does</div><p>{does}</p></div> : null}
          {outcome ? <div className="pb-outcome"><Icon name="target" /><span className="ot">{outcome}</span></div> : null}
        </div>
      ) : null}
      {bundle.length ? (
        <div className="pb-bundle">
          <div className="bundle-h">What's included</div>
          <div className="bundle-grid">
            {bundle.map((b, i) => (
              <div key={i} className={["bundle-item", b.kind === "ai" && "ai"].filter(Boolean).join(" ")}>
                <span className="bi-ico"><Icon name={b.icon || (b.kind === "ai" ? "sparkles" : "workflow")} /></span>
                <div>
                  <div className="bi-t">{b.title}</div>
                  <div className="bi-d">{b.live ? <LiveStatus state="fresh" label="on by default" /> : b.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
      {isOn ? (
        <div className="run-strip">
          {inPlay != null ? <span className="in-play"><span className="n">{inPlay}</span> in play</span> : null}
          {receipts && receipts.sent != null ? <ReceiptStat v={receipts.sent} l="sent" /> : null}
          {receipts && receipts.back != null ? <ReceiptStat v={receipts.back} l="back" tone="pos" /> : null}
          {autonomy ? <AutonomyBadge level={autonomy} /> : null}
        </div>
      ) : null}
      <div className="pb-foot">
        <span className="spacer" />
        {onActivate ? (
          <Button
            variant={state === "off" || state === "available" || state === "ranonce" ? "primary" : "secondary"}
            onClick={onActivate}
          >
            {activateLabel || DEFAULT_CTA[state] || "Run it"}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
