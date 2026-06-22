import React, { useState } from "react";
import { Icon } from "../util/Icon.jsx";

/** ProvenanceExpander — the inline evidence pattern: collapsed by default, opens once, never nests a
 *  second drill. Keeps charts BELOW the action layer. `summary` (e.g., a Verdict) shows always. */
export function ProvenanceExpander({ summary, children, label = "See the data behind this", ...rest }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="panel panel-pad" {...rest}>
      {summary}
      <div className="fold">
        <button type="button" className="prov-toggle" aria-expanded={open} onClick={() => setOpen(!open)}>
          {label}<Icon name="chevron-down" />
        </button>
      </div>
      {open ? <div className="prov-box">{children}</div> : null}
    </div>
  );
}
/** EvidenceBoundary — alias of ProvenanceExpander (the disclosure boundary for evidence). */
export function EvidenceBoundary(props) { return <ProvenanceExpander {...props} />; }
