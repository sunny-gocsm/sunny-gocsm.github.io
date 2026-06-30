import * as React from "react";

/**
 * GoCSM Verdict — Tier 0 of the Insight Hierarchy (the AI hero sentence).
 *
 * @startingPoint section="Insight" subtitle="The AI verdict — one declarative sentence + headline number" viewport="700x220"
 */
export interface VerdictProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Dominant signal — tints the left edge only. @default "watch" */
  tone?: "pos" | "watch" | "risk";
  /** AI attribution label. @default "GoCSM AI" */
  attribution?: string;
  /** The declarative verdict sentence — the most important copy on the page. */
  children: React.ReactNode;
  /** Optional headline score (mono). */
  score?: React.ReactNode;
  /** Band to color the score. */
  band?: "thriving" | "healthy" | "watch" | "atrisk";
  /** A <span className="stamp"> trend stamp. */
  stamp?: React.ReactNode;
  /** Right-aligned action buttons. */
  actions?: React.ReactNode;
}

export function Verdict(props: VerdictProps): JSX.Element;
