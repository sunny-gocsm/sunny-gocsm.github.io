import React from "react";
import { Icon } from "../util/Icon.jsx";
import { AutopilotMeter } from "./Autonomy.jsx";

/** WeeklyDigest — the Brief delivered as a message (email / WhatsApp): the same Brief, degraded
 *  gracefully (static stats, no live pulse, deep links back in). Observational receipts, never causal. */
export function WeeklyDigest({ greeting, stats = {}, actions = [], autopilot = null, sync, ...rest }) {
  const order = [
    ["sent", "sent"],
    ["recovered", "recovered"],
    ["protected", "protected"],
  ];
  return (
    <div className="msg-body" {...rest}>
      {greeting ? <div className="msg-open">{greeting}</div> : null}
      <div className="msg-stats">
        {order.map(([k, label], i) =>
          stats[k] != null ? (
            <React.Fragment key={k}>
              {i > 0 ? <span className="sep" /> : null}
              <span className="msg-stat"><span className="v">{stats[k]}</span> {label}</span>
            </React.Fragment>
          ) : null
        )}
      </div>
      {actions.map((a, i) => (
        <div key={i} className={["msg-action", a.kind].filter(Boolean).join(" ")}>
          <span className="ma-ico"><Icon name={a.icon || "inbox"} /></span>
          <span className="ma-text"><span className="n">{a.n}</span> {a.label}</span>
        </div>
      ))}
      {autopilot ? <AutopilotMeter on={autopilot.on} of={autopilot.of} /> : null}
      {sync ? <div className="msg-open">{sync}</div> : null}
    </div>
  );
}
