import * as React from "react";

/**
 * GoCSM ScoreRing — donut health-score ring (the conic .gauge is removed; use this).
 *
 * @startingPoint section="Health" subtitle="0–100 health score ring in band color" viewport="700x200"
 */
export interface ScoreRingProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Integer health score 0–100. */
  score: number;
  /** Band that colors the arc + label. */
  band: "thriving" | "healthy" | "watch" | "atrisk";
  /** Diameter in px. @default 128 */
  size?: number;
  /** Override the band label under the score. */
  label?: string;
}

export function ScoreRing(props: ScoreRingProps): JSX.Element;
