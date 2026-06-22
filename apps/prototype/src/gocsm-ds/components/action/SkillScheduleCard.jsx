import React from "react";
import { Icon } from "../util/Icon.jsx";
import { LiveStatus } from "../agentic/LiveStatus.jsx";

const AUT = { watch: "Watch only", draft: "Draft only", approve: "Approve before send", auto: "Fully automatic" };
/** SkillScheduleCard — a scheduled AI skill living as its own card: cadence, scope, autonomy, last-run
 *  receipt, and an obvious always-present Pause. AI surface; honest LiveStatus. */
export function SkillScheduleCard({
  cadence, scope, autonomy = "approve", desc, lastRun = null, lastRunLabel,
  liveLabel = "ran 2 hours ago", state = "running", onPause, onEdit, onSeeLog, ...rest
}) {
  return (
    <div className={["skill-card", state === "paused" && "paused"].filter(Boolean).join(" ")} {...rest}>
      <div className="sk-head">
        <span className="sk-glyph"><Icon name="sparkles" /></span>
        <span className="sk-attr">Scheduled AI skill · by GoCSM</span>
        <span className="sk-status"><LiveStatus state="fresh" label={liveLabel} /></span>
      </div>
      {desc ? <div className="sk-desc">{desc}</div> : null}
      <div className="sk-meta">
        {cadence ? <span className="sk-chip"><Icon name="calendar-clock" /><span className="lab">Cadence</span>{cadence}</span> : null}
        {scope ? <span className="sk-chip"><Icon name="users" /><span className="lab">Scope</span>{scope}</span> : null}
        <span className="sk-chip autonomy"><Icon name="check" />{AUT[autonomy] || autonomy}</span>
      </div>
      {lastRun ? (
        <div className="sk-receipt">
          <div className="rr-top">
            <span className="rt-title"><Icon name="receipt" />Last run</span>
            {lastRunLabel ? <LiveStatus state="recent" label={lastRunLabel} /> : null}
          </div>
          <div className="rr-stats">
            {(lastRun.stats || []).map((s, i) => (
              <span key={i} className={["rr-stat", s.tone].filter(Boolean).join(" ")}>
                <span className="v">{s.v}</span><span className="l">{s.l}</span>
              </span>
            ))}
            {onSeeLog ? <span className="see-log" onClick={onSeeLog}>See log<Icon name="arrow-right" /></span> : null}
          </div>
        </div>
      ) : null}
      <div className="sk-controls">
        <button type="button" className="btn-pause" onClick={onPause}>
          <Icon name={state === "paused" ? "play" : "pause"} />{state === "paused" ? "Resume skill" : "Pause skill"}
        </button>
        {onEdit ? <button type="button" className="btn-edit" onClick={onEdit}><Icon name="sliders-horizontal" />Edit</button> : null}
      </div>
    </div>
  );
}
