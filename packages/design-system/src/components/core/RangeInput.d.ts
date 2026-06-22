import * as React from "react";

export interface RangeInputValue {
  from: number | null;
  to: number | null;
}

export interface RangeInputProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, "onChange"> {
  from?: number | null;
  to?: number | null;
  onChange?: (value: RangeInputValue) => void;
  unit?: "$" | "%" | "d" | "min" | "users";
  min?: number;
  max?: number;
  slider?: boolean;
  className?: string;
}

export declare function RangeInput(props: RangeInputProps): React.JSX.Element;
