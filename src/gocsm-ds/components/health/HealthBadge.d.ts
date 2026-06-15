import * as React from "react";

/**
 * GoCSM HealthBadge — the single source of health-band rendering.
 *
 * @startingPoint section="Health" subtitle="The locked four-band health signal" viewport="700x120"
 */
export interface HealthBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** The customer-health band. 'Steady' is deprecated — these four only. */
  band: "thriving" | "healthy" | "watch" | "atrisk";
  /** Override the auto label (Thriving / Healthy / Watch / At-Risk). */
  label?: string;
}

export function HealthBadge(props: HealthBadgeProps): JSX.Element;
