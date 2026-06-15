import React from "react";
import { Icon } from "../util/Icon.jsx";
import { Button } from "../core/Button.jsx";

/** GraduationPromptCard — the earned nudge to autopilot. Appears only after successful manual runs and
 *  leads with the play's own receipts as proof. AI surface; a calm "Not now" always present. */
export function GraduationPromptCard({
  runs = 0, evidence = [], rails = [], onNotNow,
  attribution = "GoCSM noticed a pattern", lead, notNowNote = "We'll ask again next time it comes up — no rush.", ...rest
}) {
  return (
    <div className="ai-surface graduation-card" {...rest}>
      <div className="grad-head">
        <span className="ai-glyph-lg"><Icon name="sparkles" /></span>
        <span className="ai-attr">{attribution}</span>
        <span className="earned"><Icon name="circle-check" />Earned — {runs} successful runs</span>
      </div>
      <div className="ai-lead">{lead || <>You've handled this <span className="mono">{runs}</span> times. Put it on autopilot?</>}</div>
      {evidence.length ? (
        <div className="grad-evidence">
          <span className="ev-lbl">Last {runs} runs:</span>
          {evidence.map((e, i) => (
            <span key={i} className={["ev-stat", e.tone].filter(Boolean).join(" ")}>
              <span className="v">{e.v}</span><span className="l">{e.l}</span>
            </span>
          ))}
        </div>
      ) : null}
      <div className="grad-ctas">
        {rails.map((r, i) => (
          <div key={i} className="rail-cta">
            <Button variant="ai" icon={<Icon name={r.icon || (r.type === "ai-skill" ? "calendar-clock" : "workflow")} />} onClick={r.onClick}>
              {r.label}
            </Button>
            {r.sublabel ? <span className="sublabel">{r.kind ? <span className="railkind">{r.kind}</span> : null}<br />{r.sublabel}</span> : null}
          </div>
        ))}
      </div>
      <div className="grad-foot">
        <button type="button" className="not-now" onClick={onNotNow}>Not now</button>
        <span className="quiet-note">{notNowNote}</span>
      </div>
    </div>
  );
}
