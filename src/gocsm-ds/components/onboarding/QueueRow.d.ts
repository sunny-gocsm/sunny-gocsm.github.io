import * as React from "react";

/** GoCSM QueueRow — operating-surface queue row (§11). Sort by impact × time. */
export interface QueueRowProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Row subject (account / step). */
  subject: React.ReactNode;
  /** Impact number (mono) — drives the sort. */
  impact?: React.ReactNode;
  /** Blocker owner. client → offer outreach; agency → internal actions only (never client-nudge). */
  blockedBy?: "client" | "agency";
  /** Time vs SLA, e.g. "6d / 3d SLA" (mono). */
  sla?: string;
  /** Render the SLA in breach color. @default false */
  slaBreach?: boolean;
  /** Intervention memory, e.g. "Nudged 2d ago — no movement". */
  memory?: React.ReactNode;
  /** The single inline action (a Button). */
  action?: React.ReactNode;
}

export function QueueRow(props: QueueRowProps): JSX.Element;
