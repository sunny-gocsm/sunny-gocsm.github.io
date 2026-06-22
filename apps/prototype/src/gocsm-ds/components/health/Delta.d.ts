import * as React from "react";

/** GoCSM Delta — the single trend-chip format (arrow + color, never color alone). */
export interface DeltaProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** The change value, e.g. "+2.1%" or "-340". Rendered mono/tabular. */
  value: React.ReactNode;
  /**
   * Direction. Standard metrics: up (green↑) / down (red↓) / flat (grey—).
   * Inverted metrics (churn, cost, dormant): bad-up (red↑) / good-down (green↓).
   * @default "up"
   */
  direction?: "up" | "down" | "flat" | "bad-up" | "good-down";
  /** Trailing muted context, e.g. "vs last period". */
  context?: string;
}

export function Delta(props: DeltaProps): JSX.Element;
