import React from "react";
import { Icon } from "../util/Icon.jsx";

/** ReceiptStat — one outcome figure + a plain label. tone: pos | muted. */
export function ReceiptStat({ v, l, tone, ...rest }) {
  return (
    <span className={["receipt-stat", tone].filter(Boolean).join(" ")} {...rest}>
      <span className="v">{v}</span>
      <span className="l">{l}</span>
    </span>
  );
}

/**
 * ReceiptStrip — observational report of what a play did (never causal). The strip reports
 * completed work, so it leads with an AI-presence line, not a ConfTag.
 * `lead` is the bold opener; `children` is the rest of the sentence (use <span className="n">
 * for counts and <span className="pb"> for the playbook name); `stats` is an array of {v,l,tone}.
 */
export function ReceiptStrip({ lead, children, stats = [], onSeeLog, ...rest }) {
  return (
    <div className="receipt-strip" {...rest}>
      <div className="intro">
        <span className="ai-glyph"><Icon name="sparkles" /></span>
        <span className="txt">
          <span className="who">{lead}</span>
          {children}
        </span>
      </div>
      <div className="strip-stats">
        {stats.map((s, i) => (
          <ReceiptStat key={i} v={s.v} l={s.l} tone={s.tone} />
        ))}
        {onSeeLog ? (
          <span className="see-log" onClick={onSeeLog}>
            See log<Icon name="arrow-right" />
          </span>
        ) : null}
      </div>
    </div>
  );
}
