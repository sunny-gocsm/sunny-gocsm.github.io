import * as React from "react";

/** GoCSM QueueRow — operating-surface queue row (§11). Sort by impact × time. */
export interface QueueRowProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Row subject (account / step). */
  subject: React.ReactNode;
  /** Impact number (mono) — drives the sort. */
  impact?: React.ReactNode;
  /** Blocker owner. client → offer outreach; agency → internal actions only (never client-nudge). */
  blockedBy?: "client" | "agency";
  /** Step clock, e.g. "Stuck 12 days" (mono). */
  sla?: React.ReactNode;
  /** Render the SLA in breach color. @default false. Prefer `slaTone`. */
  slaBreach?: boolean;
  /** SLA color tone. "danger" = red act-now, "warning" = amber external-slow,
   *  "neutral" = default. Overrides `slaBreach` when set. */
  slaTone?: "neutral" | "danger" | "warning";
  /** Neutral pill rendered in place of the blocked-badge — used when the row
   *  is waiting on an external party (carrier/DNS/Google), so we never
   *  mislabel external slowness as a client block. */
  waitingNote?: React.ReactNode;
  /** Secondary muted line under sla, e.g. "Day 33 of 14" — render only past target. */
  slaSub?: React.ReactNode;
  /** Intervention memory, e.g. "Nudged 2d ago — no movement". */
  memory?: React.ReactNode;
  /** The single inline action (a Button). */
  action?: React.ReactNode;
}

export function QueueRow(props: QueueRowProps): JSX.Element;
