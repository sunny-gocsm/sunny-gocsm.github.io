import * as React from "react";

/** GoCSM Checkbox — 16px square; blue when checked. */
export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Optional inline label rendered to the right. */
  label?: React.ReactNode;
}

export function Checkbox(props: CheckboxProps): JSX.Element;
