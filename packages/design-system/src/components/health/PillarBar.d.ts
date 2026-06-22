import * as React from "react";

/** GoCSM PillarBar — four-pillar health-weight breakdown (viz colors, never bands). */
export interface PillarWeights {
  pas?: number; revenue?: number; login?: number; feedback?: number;
}
export interface PillarBarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Percent weight per pillar (agency-configurable sample data — must sum ~100). */
  weights: PillarWeights;
  /** Show the labeled legend with weights. @default true */
  legend?: boolean;
}

export function PillarBar(props: PillarBarProps): JSX.Element;
