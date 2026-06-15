import React from "react";
import { Icon } from "../util/Icon.jsx";
import { ConfTag } from "../agentic/ConfTag.jsx";

/**
 * FixItCard — a data-hygiene issue surfaced as a fixable task (housekeeping, not an
 * intervention): no avatar, no $MRR, no band edge. The inferred cost carries a ConfTag.
 * Composes ConfTag; takes the action (ActionButton) as a node. `clean`/`resolved` show all-clear.
 */
export function FixItCard({
  icon = "alert-circle", tag = "Data hygiene", text, conf, confDetail,
  action = null, onSnooze, resolved = false, clean = false, doneLabel = "Fixed", ...rest
}) {
  const cls = ["fixit-card", resolved && "resolved", clean && "clean"].filter(Boolean).join(" ");
  const done = resolved || clean;
  return (
    <div className={cls} {...rest}>
      <span className="fi-ico"><Icon name={icon} /></span>
      <div className="fi-main">
        <div className="fi-tag"><Icon name="shield-check" />{tag}</div>
        <div className="fi-text">
          {text} {conf ? <ConfTag basis={conf} detail={confDetail} /> : null}
        </div>
      </div>
      <div className="fi-right">
        {done ? (
          <span className="fi-done"><Icon name="check" />{doneLabel}</span>
        ) : (
          <>
            {action}
            {onSnooze ? (
              <button type="button" className="fi-snooze" aria-label="Snooze" onClick={onSnooze}>
                <Icon name="clock" />
              </button>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
