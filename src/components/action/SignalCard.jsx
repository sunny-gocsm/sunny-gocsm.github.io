import React from "react";
import { Icon } from "../util/Icon.jsx";
import { ConfTag } from "../agentic/ConfTag.jsx";

/**
 * SignalCard — the core operating unit: a story-telling queue row that replaces
 * "Reason: declining engagement → View". Band-toned left edge + avatar + account · $MRR
 * (mono, always present, even $0) + one Status→Stakes→System-action sentence carrying a
 * ConfTag + one inline action. Composes ConfTag; takes the action (ActionButton),
 * executor (ExecChip), and saveWindow (SaveWindow) as nodes.
 */
export function SignalCard({
  band = "watch", account, mrr, conf, confDetail, story,
  exec = null, action = null, sentBy = false, saveWindow = null,
  provenance = null, onSeePlaybook, compact = false, ...rest
}) {
  const cls = ["signal-card", "band-" + band, compact && "h-row-compact"].filter(Boolean).join(" ");
  const initial = (account || "?").trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  const hasMrr = mrr === 0 || Boolean(mrr);
  return (
    <div className={cls} {...rest}>
      <span className="sig-ava">{initial}</span>
      <div className="sig-main">
        <div className="sig-head">
          {exec ? <span className="exec-slot">{exec}</span> : null}
          <span className="sig-name">{account}</span>
          {hasMrr ? <span className="sig-mrr">· ${Number(mrr).toLocaleString()}</span> : null}
        </div>
        <div className="sig-story">
          {story} {conf ? <ConfTag basis={conf} detail={confDetail} /> : null}
        </div>
        <div className="sig-foot">
          <span className="see-pb" onClick={onSeePlaybook}>
            See playbook<Icon name="arrow-right" />
          </span>
          {provenance}
          {saveWindow}
        </div>
      </div>
      <div className="sig-right">
        {sentBy ? (
          <span className="sent-by"><Icon name="check" />Sent by GoCSM</span>
        ) : (
          action
        )}
      </div>
    </div>
  );
}

/** Queue — the finite, money-ranked stack SignalCards live in (capped; empty = "all caught up"). */
export function Queue({ children, empty = false, emptyLabel = "All caught up — nothing needs you right now.", footer = null, ...rest }) {
  return (
    <div className="queue" {...rest}>
      {empty ? <div className="queue-empty">{emptyLabel}</div> : children}
      {footer ? <div className="q-foot">{footer}</div> : null}
    </div>
  );
}
