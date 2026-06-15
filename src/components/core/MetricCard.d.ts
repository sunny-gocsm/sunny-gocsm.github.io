import * as React from "react";

/**
 * GoCSM MetricCard — summary metric tile. Neutral surface; one red element max.
 *
 * @startingPoint section="Core" subtitle="Neutral KPI tile — the red-bleed-safe summary card" viewport="700x150"
 */
export interface MetricCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Uppercase label (rendered .t-label). */
  label: string;
  /** The emphasized number — pass a pre-formatted string (mono, tabular). */
  value: React.ReactNode;
  /** Icon-chip node. */
  icon?: React.ReactNode;
  /** Icon-chip tone. @default "info" */
  iconTone?: "info" | "pos" | "warn" | "neg";
  /** Thin left accent rule — the ONLY place a red/green may appear. */
  accent?: "pos" | "neg" | null;
  /** A <Delta> node for the trend chip. */
  delta?: React.ReactNode;
  /** Trailing muted context, e.g. "vs last period". */
  context?: string;
}

export function MetricCard(props: MetricCardProps): JSX.Element;
