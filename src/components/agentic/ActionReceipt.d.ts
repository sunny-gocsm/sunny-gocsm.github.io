import * as React from "react";

/** GoCSM ActionReceipt — the Reversible Action primitive (in-place, never a toast). */
export interface ActionReceiptProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Lifecycle state. @default "pending" */
  state?: "pending" | "sent" | "stopped";
  /** What ran, e.g. "Setup workflow triggered for Tailored Wellbeing". */
  title: React.ReactNode;
  /** What it does — recipients/effect. */
  scope?: React.ReactNode;
  /** REQUIRED trust-critical line: who is / isn't affected ("Nothing is sent to the account's own clients."). */
  blastRadius: React.ReactNode;
  /** Grace-period seconds before the job fires (≥5). @default 5 */
  graceSeconds?: number;
  /** Report-back promise shown once sent. */
  reportBack?: string;
  /** Undo handler (cancels the queued job during grace). */
  onUndo?: () => void;
}

export function ActionReceipt(props: ActionReceiptProps): JSX.Element;
