import * as React from "react";

/** A single plain-language driver inside a WhyCard. */
export interface Driver {
  title: string;
  desc: string;
  /** Dot severity: high (red) / med (amber) / pos (green). */
  severity?: "high" | "med" | "pos";
  /** Prescriptive pointer text — a concrete action ("Send re-engagement workflow"). */
  action?: React.ReactNode;
}

/** GoCSM WhyCard — Tier 1 Risk/Opportunity driver column. */
export interface WhyCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Column kind — sets the header rule color. @default "risk" */
  kind?: "risk" | "opp";
  /** Column title. @default "Risk" / "Opportunity" */
  title?: string;
  /** Show the AI tag in the header. @default true */
  aiTagged?: boolean;
  /** The drivers to list. */
  drivers: Driver[];
}

export function WhyCard(props: WhyCardProps): JSX.Element;
