import * as React from "react";

export declare function StatCard(props: {
  label?: React.ReactNode;
  icon?: string;
  value?: React.ReactNode;
  /** One-line plain-English explainer shown directly beneath the value (Pattern 1: no naked big numbers). */
  caption?: React.ReactNode;
  secondary?: React.ReactNode;
  delta?: number | null;
  deltaText?: React.ReactNode;
  tone?: "neutral" | "pos" | "neg" | "warn" | "brand";
  size?: "md" | "hero";
  onClick?: () => void;
  className?: string;
  [key: string]: any;
}): React.ReactElement;
