import * as React from "react";

export interface PromptAreaExample {
  label: string;
  fill?: string;
}

export interface PromptAreaProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onSubmit"> {
  value?: string;
  onValueChange?: (text: string) => void;
  onSubmit?: (text: string) => void;
  placeholder?: string;
  submitLabel?: string;
  busyLabel?: string;
  hint?: React.ReactNode;
  examples?: PromptAreaExample[];
  busy?: boolean;
  minRows?: number;
  maxRows?: number;
  icon?: string;
  className?: string;
}

export declare function PromptArea(props: PromptAreaProps): React.JSX.Element;
