import * as React from "react";

export declare function SegmentedControl(props: {
  options?: { value: string; label: React.ReactNode }[];
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
  [key: string]: any;
}): React.ReactElement;
