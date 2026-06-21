import * as React from "react";

export declare function PromptField(props: {
  value?: string;
  onValueChange?: (text: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  submitLabel?: React.ReactNode;
  icon?: string;
  className?: string;
  [key: string]: any;
}): React.ReactElement;
