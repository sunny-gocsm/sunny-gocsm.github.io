import * as React from "react";

/**
 * GoCSM Button — primary interactive control.
 *
 * @startingPoint section="Core" subtitle="Primary / secondary / ghost / danger / AI buttons" viewport="700x180"
 */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual role. `ai` is reserved for AI-authored actions only. @default "secondary" */
  variant?: "primary" | "secondary" | "ghost" | "danger" | "ai";
  /** Control height: md = 36px, sm = 28px, lg = 44px. @default "md" */
  size?: "sm" | "md" | "lg";
  /** Leading icon node (outline icon, 16px, currentColor). */
  icon?: React.ReactNode;
  /** Trailing icon node. */
  iconRight?: React.ReactNode;
  disabled?: boolean;
  children?: React.ReactNode;
}

export function Button(props: ButtonProps): JSX.Element;
