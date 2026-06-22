import * as React from "react";

/** GoCSM Field — label + control + hint wrapper. */
export interface FieldProps {
  label?: string;
  hint?: string;
  htmlFor?: string;
  className?: string;
  children?: React.ReactNode;
}

/** GoCSM Input — 36px text control. Renders input / textarea / select per `as`. */
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Element to render. @default "input" */
  as?: "input" | "textarea" | "select";
  children?: React.ReactNode;
}

export function Field(props: FieldProps): JSX.Element;
export function Input(props: InputProps): JSX.Element;
