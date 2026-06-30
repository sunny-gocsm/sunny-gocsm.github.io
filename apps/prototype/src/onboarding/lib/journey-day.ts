import type { OnboardingAccount } from "./types";

/**
 * Universal time language: every per-client display is anchored at signup
 * and read in "Day N" terms. Per-step `slaHours` is authoring config only
 * and never appears on operator runtime surfaces.
 */

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** Today, normalized to local midnight. */
function todayMidnight(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Today's day-since-signup for an account. */
export function journeyDay(account: OnboardingAccount): number {
  return account.journey_started_days_ago;
}

/** The signup anchor as a local-midnight Date. */
export function startDate(account: OnboardingAccount): Date {
  const d = todayMidnight();
  d.setDate(d.getDate() - account.journey_started_days_ago);
  return d;
}

/** Deterministic per-step actual-days, mirrors AccountStoryDrawer.synthDuration. */
function hash01(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return (h % 1000) / 1000;
}
export function synthStepDays(
  account: string,
  stepId: string,
  expectedDays: number
): number {
  const r = hash01(account + ":" + stepId);
  const ratio = 0.5 + r * 1.3;
  return Math.max(1, Math.round(expectedDays * ratio));
}

/** Cumulative completion day (since signup) at the end of step at `stepIdx`. */
export function completionDay(
  account: OnboardingAccount,
  steps: Array<{ id: string; slaHours: number }>,
  stepIdx: number
): number {
  let cum = 0;
  const limit = Math.min(stepIdx + 1, steps.length);
  for (let i = 0; i < limit; i++) {
    const s = steps[i];
    const expected = Math.max(1, Math.round(s.slaHours / 24));
    cum += synthStepDays(account.account, s.id, expected);
  }
  return cum;
}

/** Day-since-signup the current step was first entered. */
export function currentStartedDay(account: OnboardingAccount): number {
  return Math.max(0, account.journey_started_days_ago - account.days_on_current_step);
}

export function isPastTarget(
  account: OnboardingAccount,
  targetDays: number
): boolean {
  return account.journey_started_days_ago > targetDays;
}

export function fmtDate(d: Date): string {
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}
