import React, { useState } from "react";
import { Icon } from "../util/Icon.jsx";

const CONF = {
  high: { icon: "circle-check", label: "High confidence" },
  medium: { icon: "chart-spline", label: "Medium confidence" },
  low: { icon: "help-circle", label: "Low confidence" },
};

/**
 * NarrativeTakeaway — the Layer-1 page opener: a bold stat-in-words lead + one focus sentence,
 * money or customers always present, never a chart. Uses the Verdict layout (.verdict.takeaway)
 * and the global .conf-pill / .prov-* affordances. `lead`/`focus` are nodes (wrap numbers in
 * <span className="mono">; the at-risk figure in <span className="mono risk">).
 */
export function NarrativeTakeaway({ lens, conf, lead, focus, tone = "watch", provenance = null, ...rest }) {
  const [open, setOpen] = useState(false);
  const c = conf ? CONF[conf] || CONF.high : null;
  return (
    <div className={["verdict", "takeaway", "tone-" + tone].join(" ")} {...rest}>
      <div className="verdict-glyph" aria-hidden="true"><Icon name="sparkles" /></div>
      <div className="verdict-body">
        <div className="tk-head">
          <span className="verdict-attr"><span className="dot" />{lens}</span>
          {c ? <span className="conf-pill"><Icon name={c.icon} />{c.label}</span> : null}
        </div>
        <div className="tk-lead">{lead}</div>
        {focus ? <div className="tk-focus">{focus}</div> : null}
        {provenance ? (
          <>
            <button type="button" className="prov-toggle" aria-expanded={open} onClick={() => setOpen(!open)}>
              See the data<Icon name="chevron-down" />
            </button>
            {open ? <div className="prov-box">{provenance}</div> : null}
          </>
        ) : null}
      </div>
    </div>
  );
}
