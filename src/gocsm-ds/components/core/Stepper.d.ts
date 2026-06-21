import * as React from "react";

export declare function Stepper(props: {
  steps?: { label: React.ReactNode }[];
  current?: number;
  onStepClick?: (index: number) => void;
  className?: string;
  [key: string]: any;
}): React.ReactElement;
