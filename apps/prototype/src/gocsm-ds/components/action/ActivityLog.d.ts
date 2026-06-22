import * as React from "react";

export interface ActivityRow {
  time?: string;
  actor?: string;
  line?: React.ReactNode;
  blastRadius?: React.ReactNode;
  outcome?: React.ReactNode;
  outcomeState?: "ok" | "pending" | "muted";
  auto?: boolean;
  undo?: boolean;
  onUndo?: () => void;
}
export interface ActivityDay {
  label?: string;
  count?: number;
  rows?: ActivityRow[];
}
export interface ActivityLogProps extends React.HTMLAttributes<HTMLDivElement> {
  filters?: React.ReactNode[];
  live?: boolean;
  days?: ActivityDay[];
  rows?: ActivityRow[] | null;
}
export function ActivityLog(props: ActivityLogProps): JSX.Element;
