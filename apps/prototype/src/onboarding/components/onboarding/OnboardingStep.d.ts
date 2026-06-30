import * as React from "react";

/** GoCSM OnboardingStep — the product-wide onboarding step-state row (§10). */
export interface OnboardingStepProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * The single state of this step. 'stalled' is computed, operator-only, and
   * never client-visible. @default "not_started"
   */
  state?:
    | "not_started"
    | "locked"
    | "in_progress"
    | "verifying"
    | "waiting_on_agency"
    | "needs_attention"
    | "done"
    | "skipped"
    | "stalled";
  /** Step title. */
  title: React.ReactNode;
  /** Supporting one-line sub-copy (the blocker, the expectation, the fix). */
  sub?: React.ReactNode;
  /** Trailing affix, e.g. "verified" (auto) vs "marked done" (manual) — honest. */
  affix?: string;
}

export function OnboardingStep(props: OnboardingStepProps): JSX.Element;
