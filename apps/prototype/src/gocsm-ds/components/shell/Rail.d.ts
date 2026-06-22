import * as React from "react";

export interface RailItem { id: string; label: string; icon?: string; }
export interface RailGroup { label?: string; items: RailItem[]; }

/** GoCSM Rail — the standard 244px operator app sidebar (§8.3). */
export interface RailProps extends React.HTMLAttributes<HTMLElement> {
  /** Nav groups (Insights / Configurations / Resources / HighLevel CRM). */
  groups: RailGroup[];
  /** Active item id. */
  active?: string;
  /** Navigation handler. */
  onNavigate?: (id: string) => void;
  /** Logo node, pinned top-left (operator surfaces only — never on client surfaces). */
  logo?: React.ReactNode;
}

export function Rail(props: RailProps): JSX.Element;
