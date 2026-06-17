import React from "react";
import { Icon } from "../util/Icon.jsx";
import { Button } from "../core/Button.jsx";
import { Toggle } from "../core/Toggle.jsx";

const STATE = {
  off:     { cls: "off",     icon: "circle", label: "Off" },
  ranonce: { cls: "ranonce", icon: "check",  label: "Ran once" },
  on:      { cls: "on",      dot: true,      label: "On · autopilot" },
  paused:  { cls: "paused",  icon: "pause",  label: "Paused" },
};
const PRIMARY = { off: "Run it", ranonce: "Keep it running", on: "On · autopilot", paused: "Resume" };

/**
 * PlaybookDetail — the full view-and-customize panel for one Playbook, laid out as the
 * canonical anatomy: Situation → Trigger ("what it watches for") → Actions ("what it does",
 * each toggleable + editable) → Proof ("who it affects" — match count, drafts, Preview) →
 * Explainer (the video). Owner-facing language throughout; the AI-vs-workflow choice is
 * GoCSM's, shown only as a quiet "how it runs" line. A floating panel (--sh-sheet).
 */
export function PlaybookDetail({
  icon = "book-open", title, subtitle, state = "off",
  problem, does, outcome,
  watch, actions = [], proof, video, videoLabel, limits = [],
  onRun, onPreview, primaryLabel, ...rest
}) {
  const s = STATE[state] || STATE.off;
  return (
    <div className="panel" {...rest}>
      <div className="pd-head">
        <div className="pd-toprow">
          <span className="pd-ico"><Icon name={icon} /></span>
          <span className={["pd-state", s.cls].join(" ")}>{s.dot ? <span className="rdot" /> : <Icon name={s.icon} />}{s.label}</span>
        </div>
        <div className="pd-title">{title}</div>
        {subtitle ? <div className="pd-subtitle">{subtitle}</div> : null}
        {problem ? <div className="pd-block"><div className="blk-h">The problem it solves</div><p>{problem}</p></div> : null}
        {does ? <div className="pd-block"><div className="blk-h">What it does</div><p>{does}</p></div> : null}
        {outcome ? <div className="pd-outcome"><Icon name="target" />{outcome}</div> : null}
      </div>

      {watch ? (
        <div className="panel-section">
          <div className="ps-h"><span className="lbl"><Icon name="radar" />What it watches for</span></div>
          <div className="pd-watch">{watch.summary}</div>
          <div className="pd-watch-meta">
            {watch.cadence ? <span className="pd-cadence"><Icon name="clock" />{watch.cadence}</span> : null}
            {watch.via ? <span className="pd-via">{watch.via}</span> : null}
          </div>
        </div>
      ) : null}

      {actions.length ? (
        <div className="panel-section">
          <div className="ps-h"><span className="lbl"><Icon name="list-checks" />What it does</span></div>
          <div className="pd-actions">
            {actions.map((a, i) => (
              <div key={i} className={["pd-action", a.on ? "on" : "off"].join(" ")}>
                <span className="pda-ico"><Icon name={a.icon || "zap"} /></span>
                <div className="pda-main">
                  <div className="pda-title">{a.title}
                    {a.supervised ? <span className="pda-tag needsok">Needs your OK</span> : <span className="pda-tag auto">Automatic</span>}
                  </div>
                  {a.desc ? <div className="pda-desc">{a.desc}</div> : null}
                </div>
                {a.onEdit ? <button type="button" className="pda-edit" onClick={a.onEdit}><Icon name="pencil" />Edit</button> : null}
                <Toggle on={!!a.on} onChange={a.onToggle} />
              </div>
            ))}
          </div>
          {limits.length ? (
            <div className="pd-limits"><Icon name="shield" />{limits.map((l, i) => (<span key={i} className="lim">{typeof l === "string" ? l : l.name}</span>))}</div>
          ) : null}
        </div>
      ) : null}

      {proof ? (
        <div className="panel-section">
          <div className="ps-h"><span className="lbl"><Icon name="users" />Who it affects</span></div>
          <div className="pd-proof">
            {proof.matchCount != null ? <div className="pd-match"><span className="n">{proof.matchCount}</span> accounts match today</div> : null}
            {(proof.drafts || []).length ? (
              <div className="pd-drafts">
                {proof.drafts.map((d, i) => (
                  <div key={i} className="pd-draft">
                    <span className="pd-draft-ch"><Icon name={d.icon || "mail"} />{d.channel}</span>
                    <span className="pd-draft-prev">{d.preview}</span>
                  </div>
                ))}
              </div>
            ) : null}
            {onPreview ? <Button variant="secondary" size="sm" onClick={onPreview}><Icon name="eye" />Preview on a real account</Button> : null}
          </div>
        </div>
      ) : null}

      {video || videoLabel ? (
        <div className="panel-section">
          <div className="ps-h"><span className="lbl"><Icon name="circle-play" />How it works</span></div>
          <div className="pd-video">{video || <div className="pd-video-ph"><span className="pv-play"><Icon name="play" /></span><span>{videoLabel || "Watch a 2-min walkthrough"}</span></div>}</div>
        </div>
      ) : null}

      <div className="pd-foot">
        {onRun ? <Button variant={state === "on" ? "secondary" : "primary"} onClick={onRun}>{primaryLabel || PRIMARY[state] || "Run it"}</Button> : null}
      </div>
    </div>
  );
}
