import React from "react";
import { Icon } from "../util/Icon.jsx";
import { ConfTag } from "../agentic/ConfTag.jsx";

/**
 * FixItCard — an issue surfaced as a fixable task. Composes ConfTag; takes the action
 * (ActionButton, or a fragment of up to ~3 buttons) as a node. `clean`/`resolved` show all-clear.
 *
 * Props added in v3.2 (cohort/autopilot surfaces, e.g. Today's "Fix a problem"):
 *  - `size="lg"`  — hero variant for the single top-priority cohort (bigger icon + text).
 *  - `badge`      — a node (e.g. <Badge variant="pos">On · autopilot</Badge>) shown beside the tag.
 *  - `note`       — a secondary muted line under the text (e.g. "New matches handled automatically.").
 */
export function FixItCard({
  icon = "alert-circle", tag = "Data hygiene", text, conf, confDetail,
  action = null, onSnooze, resolved = false, clean = false, doneLabel = "Fixed",
  size = "md", badge = null, note = null, ...rest
}) {
  const cls = ["fixit-card", size === "lg" && "lg", resolved && "resolved", clean && "clean"]
    .filter(Boolean).join(" ");
  const done = resolved || clean;
  return (
    <div className={cls} {...rest}>
      <span className="fi-ico"><Icon name={icon} /></span>
      <div className="fi-main">
        <div className="fi-head">
          <div className="fi-tag"><Icon name="shield-check" />{tag}</div>
          {badge ? <span className="fi-badge">{badge}</span> : null}
        </div>
        <div className="fi-text">
          {text} {conf ? <ConfTag basis={conf} detail={confDetail} /> : null}
        </div>
        {note ? <div className="fi-note">{note}</div> : null}
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
