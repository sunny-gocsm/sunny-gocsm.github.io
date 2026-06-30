// Stuck-reason resolver for operator "Needs help today" rows. Sources the
// reason verbatim from the state catalog's agencyCopy when an explicit
// failure id is set; otherwise falls back to a neutral no-movement line.
// NEVER paraphrase failure copy.

import { findEntry } from "./state-catalog";
import { isOverExternalBudget, isPendingExternal } from "./onboarding-data";
import type { OnboardingAccount } from "./types";

export interface StuckReason {
  kind: "failure" | "no_movement";
  text: string;
}

export function getStuckReason(a: OnboardingAccount): StuckReason | null {
  if (a.current_failure_id) {
    const entry = findEntry(a.current_failure_id);
    if (entry) return { kind: "failure", text: entry.rowClause ?? entry.shortLabel ?? entry.agencyCopy };
  }
  if (!a.stalled || !a.current_step) return null;
  // External-review rows (carrier/DNS/Google) get their honest copy from the
  // SLA cell ("Waiting on carrier longer than expected · day N of ~B"). Don't
  // add a parallel "No movement" reason line that would imply client inaction.
  if (isPendingExternal(a) || isOverExternalBudget(a)) return null;
  const nudgeDay = Math.max(
    0,
    a.journey_started_days_ago - a.days_on_current_step,
  );
  return { kind: "no_movement", text: `No movement since Day ${nudgeDay}` };
}

// ---------------------------------------------------------------------------
// Reason grouping — powers the "group by reason" chip row atop the queue.
// ---------------------------------------------------------------------------

export interface StuckReasonGroup {
  key: string;
  label: string;
  count: number;
  ids: string[];
}

const EXTERNAL_WINDOW_KEY = "external_window";
const NO_MOVEMENT_KEY = "no_movement";

export function getStuckReasonKey(a: OnboardingAccount): string {
  if (a.current_failure_id && findEntry(a.current_failure_id)) {
    return `failure:${a.current_failure_id}`;
  }
  if (isOverExternalBudget(a)) return EXTERNAL_WINDOW_KEY;
  return NO_MOVEMENT_KEY;
}

function labelForKey(key: string): string {
  if (key === EXTERNAL_WINDOW_KEY) return "External review · past window";
  if (key === NO_MOVEMENT_KEY) return "No detector signal · stalled";
  if (key.startsWith("failure:")) {
    const id = key.slice("failure:".length);
    const entry = findEntry(id);
    if (entry) return entry.shortLabel ?? entry.stepTitle;
  }
  return key;
}

export function summarizeStuckReasons(
  rows: OnboardingAccount[],
): StuckReasonGroup[] {
  const map = new Map<string, StuckReasonGroup>();
  for (const a of rows) {
    const key = getStuckReasonKey(a);
    const existing = map.get(key);
    if (existing) {
      existing.count += 1;
      existing.ids.push(a.account);
    } else {
      map.set(key, { key, label: labelForKey(key), count: 1, ids: [a.account] });
    }
  }
  return Array.from(map.values()).sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return a.label.localeCompare(b.label);
  });
}

export function matchesReasonKey(a: OnboardingAccount, key: string): boolean {
  return getStuckReasonKey(a) === key;
}
