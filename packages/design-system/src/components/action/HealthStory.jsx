import React, { useState } from "react";
import { Icon } from "../util/Icon.jsx";
import { HealthBadge } from "../health/HealthBadge.jsx";
import { ConfTag } from "../agentic/ConfTag.jsx";
import { PillarBar } from "../health/PillarBar.jsx";

const TONE = { thriving: "pos", healthy: "pos", watch: "watch", atrisk: "risk" };

/**
 * HealthStory — how account health appears everywhere: the reason IS the verdict, never a
 * bare score. Uses the design-system Verdict layout (.verdict) and composes HealthBadge,
 * ConfTag, and the PillarBar primitive (revealed by "See why"). `reason` is a node naming the
 * specific facts (and what's fine); `basis` is [{basis,detail}]; `pillars` feeds PillarBar.
 */
export function HealthStory({ band = "watch", tone, reason, basis = [], pillars = null, onHowScored, ...rest }) {
  const [open, setOpen] = useState(false);
  const t = tone || TONE[band] || "watch";
  return (
    <div className={["verdict", "tone-" + t].join(" ")} {...rest}>
      <div className="verdict-glyph" aria-hidden="true"><Icon name="sparkles" /></div>
      <div className="verdict-body">
        <div className="verdict-attr"><span className="dot" />GoCSM health</div>
        <div className="health-lead"><HealthBadge band={band} /></div>
        <div className="verdict-line">{reason}</div>
        <div className="verdict-meta">
          {basis.length ? (
            <div className="basis">
              {basis.map((b, i) => <ConfTag key={i} basis={b.basis || "fact"} detail={b.detail} />)}
            </div>
          ) : null}
          <div className="verdict-actions">
            {pillars ? (
              <button type="button" className="btn btn-secondary btn-sm" aria-expanded={open} onClick={() => setOpen(!open)}>
                <Icon name="list-tree" />See why
              </button>
            ) : null}
            <span className="how-link" onClick={onHowScored}>How is health scored?<Icon name="arrow-up-right" /></span>
          </div>
        </div>
        {open && pillars ? <PillarBar weights={pillars} /> : null}
      </div>
    </div>
  );
}
