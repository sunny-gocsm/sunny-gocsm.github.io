import * as React from "react";

/** The six lifecycle stages (a structural axis, distinct from the health bands). */
export type LifecycleStage =
  | "onboarding"
  | "activated"
  | "established"
  | "lapsing"
  | "dormant"
  | "churned";

/** GoCSM StageBadge — inline LIFECYCLE stage chip. NOT a health band (use HealthBadge). */
export interface StageBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Lifecycle stage. @default "activated" */
  stage?: LifecycleStage;
  /** Override the default stage label. */
  label?: string;
  /** Show the transient "↑ Reactivated" win affix. @default false */
  reactivated?: boolean;
}

export function StageBadge(props: StageBadgeProps): JSX.Element;
