import * as React from "react";
import { LifecycleStage } from "./StageBadge";

/** GoCSM StageProgress — the lifecycle journey as a horizontal track. */
export interface StageProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The account's current lifecycle stage. @default "activated" */
  stage?: LifecycleStage;
  /** Optional ordered subset of stages to render (defaults to the six). */
  stages?: LifecycleStage[];
  /** Show only the current stage's label. @default false */
  compact?: boolean;
}

export function StageProgress(props: StageProgressProps): JSX.Element;
