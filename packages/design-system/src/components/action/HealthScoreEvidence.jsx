import React from "react";
import { Icon } from "../util/Icon.jsx";
import { ScoreRing } from "../health/ScoreRing.jsx";
import { HealthBadge } from "../health/HealthBadge.jsx";
import { Delta } from "../health/Delta.jsx";

/** HealthScoreEvidence — the score's only home: a small triage/trend instrument, never a hero, never
 *  above the fold. Small ScoreRing + band + how-link, plus a calm band distribution. Trend beats level. */
export function HealthScoreEvidence({ score, band = "atrisk", tag = "Triage instrument", trend, onHowScored, bands = [], ...rest }) {
  return (
    <div {...rest}>
      <div className="panel panel-pad">
        <div className="instrument">
          <ScoreRing score={score} band={band} size={88} />
          <div className="ins-body">
            <span className="ins-tag">{tag}</span>
            <div className="ins-band"><HealthBadge band={band} />{trend ? <Delta value={trend} direction="bad-up" /> : null}</div>
            {onHowScored ? <div className="ins-line"><span className="how-link" onClick={onHowScored}>How is health scored?<Icon name="arrow-up-right" /></span></div> : null}
            <span className="not-hero">Evidence only — never above the fold.</span>
          </div>
        </div>
      </div>
      {bands.length ? (
        <div className="panel panel-pad">
          <div className="bands">
            {bands.map((b, i) => (
              <div key={i} className={["band-tile", b.band].join(" ")}>
                <div className="bt-head"><span className="bt-name">{b.band}</span><span className="bt-dot" /></div>
                <div className="bt-num">{b.n}</div>
                {b.delta ? <div className="bt-delta"><Delta value={b.delta} direction={String(b.delta).startsWith("-") ? "bad-up" : "good-up"} /></div> : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
