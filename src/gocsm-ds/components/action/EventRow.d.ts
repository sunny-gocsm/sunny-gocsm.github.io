import * as React from "react";

export declare function EventRow(props: {
  time?: React.ReactNode;
  name?: string;
  actionIcon?: string;
  actionLabel?: string;
  summary?: React.ReactNode;
  status?: React.ReactNode;
  statusTone?: "pos" | "neg" | "warn" | "neutral";
  value?: React.ReactNode;
  onClick?: () => void;
  className?: string;
  [key: string]: any;
}): React.ReactElement;
