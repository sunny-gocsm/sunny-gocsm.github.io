import React from "react";
import { Icon } from "../util/Icon.jsx";
import { Button } from "../core/Button.jsx";

/**
 * PlaybookActivation — the contextual run-once → autopilot ladder, surfaced at the point of
 * need (from a live Situation in Today). Shows the Proof (who matches, the drafts, Preview),
 * then climbs: Off → Run it once (supervised) → "Keep it running?" → On (autopilot). Owner
 * language only; always reversible. A focused sheet — not the full editor (that's PlaybookDetail).
 *
 * state: "off" | "ranonce" | "on".
 */
export function PlaybookActivation({
  icon = "book-open", title, situation, state = "off",
  proof, ranCount, onRunOnce, onAutopilot, onTurnOff, onPreview, onClose,
  busy = false, ...rest
}) {
  return (
    <div className="pb-activate" {...rest}>
      <div className="pa-head">
        <span className="pa-ico"><Icon name={icon} /></span>
        <div className="pa-titles">
          <div className="pa-kicker">GoCSM has a Playbook for this</div>
          <div className="pa-title">{title}</div>
        </div>
        {onClose ? <button type="button" className="pa-close" onClick={onClose} aria-label="Close"><Icon name="x" /></button> : null}
      </div>
      {situation ? <div className="pa-situation">{situation}</div> : null}

      {proof ? (
        <div className="pa-proof">
          {proof.matchCount != null ? <div className="pa-match"><Icon name="users" /><span className="n">{proof.matchCount}</span> accounts match right now</div> : null}
          {(proof.drafts || []).length ? (
            <div className="pa-drafts">
              {proof.drafts.map((d, i) => (
                <div key={i} className="pa-draft">
                  <span className="pa-draft-ch"><Icon name={d.icon || "mail"} />{d.channel}</span>
                  <span className="pa-draft-prev">{d.preview}</span>
                </div>
              ))}
            </div>
          ) : null}
          {onPreview ? <button type="button" className="pa-preview" onClick={onPreview}><Icon name="eye" />Preview on a real account</button> : null}
        </div>
      ) : null}

      <div className="pa-ladder">
        {state === "off" ? (
          <>
            <Button variant="primary" onClick={onRunOnce} disabled={busy}>{busy ? "Running…" : "Run it once"}</Button>
            <div className="pa-note">You'll review before anything is sent.</div>
          </>
        ) : null}
        {state === "ranonce" ? (
          <>
            <div className="pa-success"><Icon name="circle-check" />Ran on <span className="n">{ranCount}</span> accounts</div>
            <div className="pa-autopilot-offer">
              <div className="pao-title">Keep it running without you?</div>
              <div className="pao-note">It'll keep watching and run on new matches. Turn it off anytime.</div>
              <Button variant="primary" onClick={onAutopilot} disabled={busy}>Turn on autopilot</Button>
            </div>
          </>
        ) : null}
        {state === "on" ? (
          <div className="pa-on">
            <div className="pa-success"><Icon name="circle-check" />On autopilot — running without you</div>
            {onTurnOff ? <Button variant="ghost" onClick={onTurnOff}>Turn off</Button> : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
