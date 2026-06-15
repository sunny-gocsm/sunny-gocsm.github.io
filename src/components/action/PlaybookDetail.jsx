import React from "react";
import { Icon } from "../util/Icon.jsx";
import { AutonomyDial } from "./Autonomy.jsx";
import { ExecChip } from "./StatusChips.jsx";

/** PlaybookDetail — the full panel behind a PlaybookCard: two execution rails, per-audience autonomy,
 *  guardrails, receipts. A floating panel (--sh-sheet). guardrail.control and `receipts` are nodes. */
export function PlaybookDetail({
  icon = "book-open", stateLabel, title, subtitle, outcome,
  rails = [], audiences = [], guardrails = [], receipts = null, ...rest
}) {
  return (
    <div className="panel" {...rest}>
      <div className="pd-head">
        <div className="pd-toprow">
          <span className="pd-ico"><Icon name={icon} /></span>
          {stateLabel ? <span className="pd-state"><span className="rdot" />{stateLabel}</span> : null}
        </div>
        <div className="pd-title">{title}</div>
        {subtitle ? <div className="pd-subtitle">{subtitle}</div> : null}
        {outcome ? <div className="pd-outcome"><Icon name="target" />{outcome}</div> : null}
      </div>

      <div className="panel-section">
        <div className="ps-h">
          <span className="lbl"><Icon name="git-branch" />What runs</span>
          <span className="rail-key">
            <span className="rail-tag automation"><Icon name="workflow" />Automation</span>
            <span className="rail-tag ai"><Icon name="sparkles" />AI skill</span>
          </span>
        </div>
        <div className="timeline">
          {rails.map((r, i) => (
            <div key={i} className={["tl-step", r.type].join(" ")}>
              <div className="tl-top">
                <span className={["rail-tag", r.type].join(" ")}>
                  <Icon name={r.type === "ai" ? "sparkles" : "workflow"} />{r.type === "ai" ? "AI skill" : "Automation"}
                </span>
                <span className="tl-name">{r.name}</span>
                {r.trigger ? <span className="tl-trigger">trigger: <b>{r.trigger}</b>{r.triggerNote ? " · " + r.triggerNote : ""}</span> : null}
                {r.auto ? <span className="tl-exec"><ExecChip auto /></span> : null}
              </div>
              {r.desc ? <div className="tl-desc">{r.desc}</div> : null}
            </div>
          ))}
        </div>
      </div>

      <div className="panel-section">
        <div className="ps-h"><span className="lbl"><Icon name="users" />Who handles it</span></div>
        {audiences.map((a, i) => (
          <div key={i} className="aud-row">
            <div className="aud-info">
              <div className="aud-name"><Icon name={a.icon || "mail"} />{a.name}</div>
              {a.help ? <div className="aud-help">{a.help}</div> : null}
            </div>
            {a.default ? <span className="default-flag">default</span> : null}
            <AutonomyDial value={a.autonomy} />
          </div>
        ))}
      </div>

      {guardrails.length ? (
        <div className="panel-section">
          <div className="ps-h"><span className="lbl"><Icon name="shield" />Guardrails</span></div>
          <div className="guard-grid">
            {guardrails.map((g, i) => (
              <div key={i} className="guard">
                <div className="g-info"><div className="g-name">{g.name}</div>{g.help ? <div className="g-help">{g.help}</div> : null}</div>
                {g.control}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {receipts ? (
        <div className="panel-section">
          <div className="ps-h"><span className="lbl"><Icon name="receipt" />Receipts</span></div>
          {receipts}
        </div>
      ) : null}
    </div>
  );
}
