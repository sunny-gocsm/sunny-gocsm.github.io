import * as React from "react";

export type PlaybookState = "off" | "ranonce" | "on" | "paused" | "available" | "running";

export interface PlaybookBundleItem {
  title?: React.ReactNode;
  desc?: React.ReactNode;
  icon?: string;
  kind?: "workflow" | "ai" | string;
  live?: boolean;
}

export interface PlaybookCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  /** Off → Ran once → On (autopilot). @default "off" */
  state?: PlaybookState;
  icon?: string;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  /** Live count of accounts that match the trigger right now. */
  matchCount?: number;
  problem?: React.ReactNode;
  does?: React.ReactNode;
  outcome?: React.ReactNode;
  bundle?: PlaybookBundleItem[];
  inPlay?: number;
  autonomy?: string;
  receipts?: { sent?: number; back?: number } | null;
  onActivate?: () => void;
  activateLabel?: React.ReactNode;
}

export function PlaybookCard(props: PlaybookCardProps): JSX.Element;
