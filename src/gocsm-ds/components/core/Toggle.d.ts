import * as React from "react";

/** GoCSM Toggle — switch for a live binary setting. */
export interface ToggleProps {
  /** On state. @default false */
  on?: boolean;
  /** Locked: shows a lock glyph instead of dimming (never dim a toggle). @default false */
  locked?: boolean;
  /** Called with the next boolean value. */
  onChange?: (next: boolean) => void;
  /** Optional inline label. */
  label?: React.ReactNode;
  className?: string;
}

export function Toggle(props: ToggleProps): JSX.Element;
