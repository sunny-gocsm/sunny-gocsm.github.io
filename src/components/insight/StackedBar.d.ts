import * as React from "react";

export interface StackedBarSegment {
  pct: number;
  tone?: "neg" | "warn" | "pos" | "neutral";
  label?: React.ReactNode;
}

export declare function StackedBar(props: {
  segments?: StackedBarSegment[];
  height?: number;
  className?: string;
  [key: string]: any;
}): React.ReactElement;
