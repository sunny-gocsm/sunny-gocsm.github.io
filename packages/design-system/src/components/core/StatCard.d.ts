import * as React from "react";

export declare function StatCard(props: {
  label?: React.ReactNode;
  icon?: string;
  value?: React.ReactNode;
  secondary?: React.ReactNode;
  delta?: number | null;
  deltaText?: React.ReactNode;
  tone?: "neutral" | "pos" | "neg" | "warn" | "brand";
  size?: "md" | "hero";
  onClick?: () => void;
  className?: string;
  [key: string]: any;
}): React.ReactElement;
