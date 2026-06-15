import React from "react";
import { Icon } from "../util/Icon.jsx";
import { MetricCard } from "../core/MetricCard.jsx";
import { Delta } from "../health/Delta.jsx";

/** BriefingBody — a finite, money-ranked SignalCard queue + a quiet Agency Vitals strip with the
 *  health score demoted (trend beats level, no ScoreRing). `queue` is the SignalCard list (a node). */
export function BriefingBody({ count, queue, viewAll, vitals = [], onViewAll, queueTitle, ...rest }) {
  return (
    <div {...rest}>
      <div className="q-head">
        <span className="q-title">
          {count != null ? <><span className="n">{count}</span> customers need you today</> : queueTitle || "Your queue"}
        </span>
      </div>
      <div className="queue">
        {queue}
        {viewAll != null ? (
          <div className="q-foot"><span className="view-all" onClick={onViewAll}>View all {viewAll}<Icon name="arrow-right" /></span></div>
        ) : null}
      </div>
      {vitals.length ? (
        <div>
          {vitals.map((v, i) => (
            <MetricCard
              key={i}
              label={v.label}
              value={v.value != null ? v.value : v.level}
              accent={v.tone === "neg" ? "neg" : v.tone === "pos" ? "pos" : null}
              delta={v.trend ? <Delta value={v.trend} direction={v.trendDir || "bad-up"} /> : v.delta}
              context={v.value != null && v.level ? v.level : undefined}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
