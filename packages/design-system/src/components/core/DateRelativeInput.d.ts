import * as React from "react";

export type DateRelVerb = "inNext" | "inLast" | "moreThanAgo" | "within";

export interface DateRelValue {
  verb: DateRelVerb;
  n: number;
  unit: "days" | "weeks" | "months";
}

export interface DateRelativeInputProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, "onChange"> {
  value?: DateRelValue;
  onChange?: (value: DateRelValue) => void;
  quickPicks?: number[];
  className?: string;
}

export declare function DateRelativeInput(props: DateRelativeInputProps): React.JSX.Element;
