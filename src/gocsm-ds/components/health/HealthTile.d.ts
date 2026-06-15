import * as React from "react";

/** GoCSM HealthTile — pastel band distribution card (Health Overview). */
export interface HealthTileProps extends React.HTMLAttributes<HTMLDivElement> {
  band: "thriving" | "healthy" | "watch" | "atrisk";
  /** Account count in this band (mono). */
  count: React.ReactNode;
  /** Share of portfolio, e.g. "32%". */
  pct?: string;
  label?: string;
}

export function HealthTile(props: HealthTileProps): JSX.Element;
