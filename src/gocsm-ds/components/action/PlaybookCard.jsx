import React from "react";
import { Icon } from "../util/Icon.jsx";
import { Button } from "../core/Button.jsx";
import { LiveStatus } from "../agentic/LiveStatus.jsx";
import { AutonomyBadge } from "./Autonomy.jsx";
import { ReceiptStat } from "./Receipts.jsx";

const STATE = {
  available: { cls: "available", icon: "circle", label: "Available" },
  running: { cls: "running", label: "Running" },
  paused: { cls: "paused", icon: "pause", label: "Paused" },
};
/** PlaybookCard — a job to be done, bundled: problem → what it does → outcome → an explicit bundle. */
export function PlaybookCard({
  state = "available", icon = "book-open", title, subtitle, problem, does, outcome,
  bundle = [], inPlay, autonomy, receipts = null, onActivate, activateLabel, ...rest
}) {
  const s = STATE[state] || STATE.available;
  return (
    <div className="playbook-card" {...rest}>
      <div className="pb-head">
        <div className="pb-toprow">
          <span className="pb-ico"><Icon name={icon} /></span>
          <span className={["playbook-state", s.cls].join(" ")}>
            {state === "running" ? <span className="rdot" /> : <Icon name={s.icon} />}
            {state === "running" && inPlay != null ? "Running" : s.label}
          </span>
        </div>
        <div className="pb-title">{title}</div>
        {subtitle ? <div className="pb-subtitle">{subtitle}</div> : null}
      </div>
      {problem || does || outcome ? (
        <div className="pb-body">
          {problem ? <div className="pb-block"><div className="blk-h">The problem it solves</div><p>{problem}</p></div> : null}
          {does ? <div className="pb-block"><div className="blk-h">What this playbook does</div><p>{does}</p></div> : null}
          {outcome ? <div className="pb-outcome"><Icon name="target" /><span className="ot">{outcome}</span></div> : null}
        </div>
      ) : null}
      {bundle.length ? (
        <div className="pb-bundle">
          <div className="bundle-h">Bundle includes</div>
          <div className="bundle-grid">
            {bundle.map((b, i) => (
              <div key={i} className={["bundle-item", b.kind === "ai" && "ai"].filter(Boolean).join(" ")}>
                <span className="bi-ico"><Icon name={b.icon || (b.kind === "ai" ? "sparkles" : "workflow")} /></span>
                <div>
                  <div className="bi-t">{b.title}</div>
                  <div className="bi-d">{b.live ? <LiveStatus state="fresh" label="live by default" /> : b.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
      {state === "running" ? (
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
          <Button variant={state === "available" ? "primary" : "secondary"} onClick={onActivate}>
            {activateLabel || (state === "available" ? "Activate playbook" : "Manage")}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
