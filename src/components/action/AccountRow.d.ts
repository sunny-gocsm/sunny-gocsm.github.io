import * as React from "react";

export declare function AccountRow(props: {
  name?: React.ReactNode;
  band?: "thriving" | "healthy" | "watch" | "atrisk";
  bandLabel?: React.ReactNode;
  value?: React.ReactNode;
  meta?: React.ReactNode;
  trailing?: React.ReactNode;
  muted?: boolean;
  onClick?: () => void;
  className?: string;
  [key: string]: any;
}): React.ReactElement;
