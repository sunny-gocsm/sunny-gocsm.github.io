import * as React from "react";

/** GoCSM ConfTag — the Confidence primitive; required on every AI claim. */
export interface ConfTagProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Claim basis: fact (direct read) / projection (inferred) / guess (low data). @default "fact" */
  basis?: "fact" | "projection" | "guess";
  /** Evidence detail, e.g. "6 days of data". REQUIRED for projection/guess; omit for fact. */
  detail?: string;
}

export function ConfTag(props: ConfTagProps): JSX.Element;
