import * as React from "react";

/** GoCSM LiveStatus — the Liveness primitive (felt presence, honest staleness). */
export interface LiveStatusProps extends React.HTMLAttributes<HTMLSpanElement> {
  /**
   * Derived from now − syncedAt: fresh (<5m) / recent (<24h) / stale (>24h) /
   * error (sync failed). @default "fresh"
   */
  state?: "fresh" | "recent" | "stale" | "error";
  /** Override the auto copy. */
  label?: string;
  /** Optional "watching N accounts for you" count (hidden in error). */
  watchingCount?: number;
}

export function LiveStatus(props: LiveStatusProps): JSX.Element;
