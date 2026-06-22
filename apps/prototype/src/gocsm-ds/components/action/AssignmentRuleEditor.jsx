import React from "react";
import { Icon } from "../util/Icon.jsx";
import { Button } from "../core/Button.jsx";

/** AssignmentRuleEditor — how an owner routes sub-accounts to members: a light rule builder with an
 *  always-on, locked owner fallback so nothing is ever unowned. Every change is logged. */
export function AssignmentRuleEditor({ mode = "by-rule", rules = [], onModeChange, onAddRule, onRemoveRule, ...rest }) {
  return (
    <div className="panel" {...rest}>
      <div className="panel-head">
        <span className="ph-title">Assignment rules</span>
        <span className="ph-mode">
          <span className={["seg", mode === "by-rule" && "sel"].filter(Boolean).join(" ")} onClick={() => onModeChange && onModeChange("by-rule")}>By rule</span>
          <span className={["seg", mode === "round-robin" && "sel"].filter(Boolean).join(" ")} onClick={() => onModeChange && onModeChange("round-robin")}>Round-robin</span>
        </span>
      </div>
      <div className="rules">
        {rules.map((r, i) => (
          <div key={i} className="rule-row">
            <span className="rule-when">When</span>
            <select className="select sm" defaultValue={r.when}><option>{r.when}</option></select>
            <span className="rule-cond">is</span>
            <select className="select sm" defaultValue={r.is}><option>{r.is}</option></select>
            <span className="rule-arrow"><Icon name="arrow-right" /></span>
            <span className="assignee">{r.to}</span>
            <span className="grow" />
            <button type="button" className="rule-del" aria-label="Remove rule" onClick={() => onRemoveRule && onRemoveRule(i)}><Icon name="x" /></button>
          </div>
        ))}
        <div className="rule-row rr">
          <span className="rule-when">Unassigned</span>
          <span className="rule-arrow"><Icon name="arrow-right" /></span>
          <span className="assignee">Account owner</span>
          <span className="grow" />
          <span className="default-flag"><Icon name="lock" />Always on</span>
        </div>
      </div>
      {onAddRule ? <Button variant="secondary" size="sm" icon={<Icon name="plus" />} onClick={onAddRule}>Add rule</Button> : null}
    </div>
  );
}
