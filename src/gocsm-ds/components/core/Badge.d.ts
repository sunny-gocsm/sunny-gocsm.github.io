import * as React from "react";

/** GoCSM Badge — compact status pill. NOT a health band (use HealthBadge). */
export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Status role. @default "neutral" */
  variant?: "neutral" | "blue" | "pos" | "warn" | "danger" | "ai";
  /** Show the leading status dot. @default true */
  dot?: boolean;
  children?: React.ReactNode;
}

export function Badge(props: BadgeProps): JSX.Element;
