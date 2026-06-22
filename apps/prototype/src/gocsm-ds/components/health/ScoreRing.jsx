import React from "react";

/**
 * GoCSM ScoreRing — the live donut score ring (replaces the removed conic
 * .gauge). Rounded-cap SVG arc in the band color, mono score in the center.
 * Maps to .ring in components.css.
 */
const BAND_COLOR = {
  thriving: "var(--health-thriving-strong)",
  healthy: "var(--health-healthy-strong)",
  watch: "var(--health-watch-strong)",
  atrisk: "var(--health-atrisk-strong)",
};
const BAND_LABEL = { thriving: "Thriving", healthy: "Healthy", watch: "Watch", atrisk: "At-Risk" };

export function ScoreRing({ score = 0, band = "watch", size = 128, label, className = "", ...rest }) {
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score));
  const offset = c * (1 - pct / 100);
  return (
    <div className={["ring", className].filter(Boolean).join(" ")} style={{ width: size, height: size }} {...rest}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle className="track" cx={size / 2} cy={size / 2} r={r} />
        <circle
          className="arc"
          cx={size / 2}
          cy={size / 2}
          r={r}
          style={{ stroke: BAND_COLOR[band], strokeDasharray: c, strokeDashoffset: offset }}
        />
      </svg>
      <div className="inner">
        <div className="score">{Math.round(pct)}</div>
        <div className="band" style={{ color: BAND_COLOR[band] }}>{label || BAND_LABEL[band]}</div>
      </div>
    </div>
  );
}
