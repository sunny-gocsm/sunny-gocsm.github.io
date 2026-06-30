import seed from "@onb/data/onboarding-seed.json";
import type { OnboardingSeed, OnboardingAccount } from "./types";

export function getOnboardingSeed(): OnboardingSeed {
  return seed as OnboardingSeed;
}

export function selectActivationRate(s: OnboardingSeed): {
  doneCount: number;
  total: number;
  pct: number;
} {
  const total = s.accounts.length;
  const doneCount = s.accounts.filter((a) => a.steps_done === a.steps_total).length;
  const pct = total === 0 ? 0 : Math.round((doneCount / total) * 100);
  return { doneCount, total, pct };
}

export function selectMedianDaysToActivate(s: OnboardingSeed): number | null {
  const days = s.accounts
    .filter((a) => a.steps_done === a.steps_total)
    .map((a) => a.journey_started_days_ago)
    .sort((a, b) => a - b);
  if (days.length === 0) return null;
  const mid = Math.floor(days.length / 2);
  return days.length % 2 === 0 ? Math.round((days[mid - 1] + days[mid]) / 2) : days[mid];
}

export function selectActivationTrend(s: OnboardingSeed): {
  current: number | null;
  prior: number | null;
  windowLabel: string;
} {
  return {
    current: selectMedianDaysToActivate(s),
    prior: s.prior_median_days_to_activate ?? null,
    windowLabel: s.prior_window_label ?? "last quarter",
  };
}



/** Default expected external wait window (days) by step type.
 *  A2P carrier review usually clears within 3 days; DNS / email-domain
 *  propagation within 2. Anything else falls back to 3. */
export function defaultExternalBudgetDays(stepNameOrType: string | null | undefined): number {
  if (!stepNameOrType) return 3;
  const s = stepNameOrType.toLowerCase();
  if (s.includes("a2p") || s.includes("text-messaging") || s.includes("text messaging")) return 3;
  if (s.includes("domain") || s.includes("dns") || s.includes("email")) return 2;
  return 3;
}

function externalWindow(a: OnboardingAccount): { waited: number; budget: number } {
  const waited = a.external_wait_days ?? a.days_on_current_step ?? 0;
  const budget = a.external_budget_days ?? defaultExternalBudgetDays(a.current_step);
  return { waited, budget };
}

/** Current step is in external review AND we're still inside the expected window.
 *  Treated as calm "waiting on review" — NOT in the stuck queue. */
export function isPendingExternal(a: OnboardingAccount): boolean {
  if (a.current_step_state !== "verifying") return false;
  const { waited, budget } = externalWindow(a);
  return waited <= budget;
}

/** Current step is verifying AND we've exceeded the expected external window.
 *  Auto-promoted to the stuck queue. */
export function isOverExternalBudget(a: OnboardingAccount): boolean {
  if (a.current_step_state !== "verifying") return false;
  const { waited, budget } = externalWindow(a);
  return waited > budget;
}

/** Canonical "stuck" check: replaces raw `a.stalled` reads across the app. */
export function isStuck(a: OnboardingAccount): boolean {
  if (isPendingExternal(a)) return false;
  if (isOverExternalBudget(a)) return true;
  return a.stalled === true;
}

export function selectStalledAccounts(s: OnboardingSeed): OnboardingAccount[] {
  return s.accounts.filter(isStuck);
}

export function selectPendingExternalAccounts(s: OnboardingSeed): OnboardingAccount[] {
  return s.accounts.filter(isPendingExternal);
}

export function selectStalledByImpact(s: OnboardingSeed): OnboardingAccount[] {
  return selectStalledAccounts(s)
    .slice()
    .sort((a, b) => b.mrr * b.days_on_current_step - a.mrr * a.days_on_current_step);
}

export function selectAgencyBlockedCount(s: OnboardingSeed): number {
  return s.accounts.filter((a) => a.blocked_by === "agency").length;
}

export function selectAgencyBlockedStalledCount(s: OnboardingSeed): number {
  return s.accounts.filter((a) => a.blocked_by === "agency" && isStuck(a)).length;
}

export interface StalledGroup {
  step: string;
  accounts: OnboardingAccount[];
  slaDays: number;
}

export function selectLargestStalledGroup(s: OnboardingSeed): StalledGroup | null {
  const stalled = selectStalledAccounts(s).filter((a) => a.current_step);
  if (stalled.length === 0) return null;
  const groups = new Map<string, OnboardingAccount[]>();
  for (const a of stalled) {
    const k = a.current_step as string;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(a);
  }
  let best: StalledGroup | null = null;
  for (const [step, accounts] of groups) {
    const slaDays = Math.max(...accounts.map((a) => a.sla_days));
    const mrr = accounts.reduce((s, a) => s + a.mrr, 0);
    if (
      !best ||
      accounts.length > best.accounts.length ||
      (accounts.length === best.accounts.length &&
        mrr > best.accounts.reduce((s, a) => s + a.mrr, 0))
    ) {
      best = { step, accounts, slaDays };
    }
  }
  return best;
}

export interface FunnelRow {
  step: string;
  clients_reached: number;
  drop: number;
}

export function selectFunnel(s: OnboardingSeed): FunnelRow[] {
  return s.funnel.map((f, i) => ({
    step: f.step,
    clients_reached: f.clients_reached,
    drop: i === 0 ? 0 : s.funnel[i - 1].clients_reached - f.clients_reached,
  }));
}

export function selectTopTwoDrops(s: OnboardingSeed): number[] {
  const rows = selectFunnel(s);
  const indexed = rows.map((r, i) => ({ i, drop: r.drop }));
  indexed.sort((a, b) => (b.drop - a.drop) || (b.i - a.i));
  return indexed.slice(0, 2).filter((x) => x.drop > 0).map((x) => x.i);
}

export type AccountStepState =
  | "done"
  | "stalled"
  | "waiting_on_agency"
  | "in_progress"
  | "not_started";

export function accountStepState(a: OnboardingAccount): AccountStepState {
  if (a.steps_done === a.steps_total) return "done";
  if (isStuck(a)) return "stalled";
  if (a.blocked_by === "agency") return "waiting_on_agency";
  if (a.blocked_by === "client") return "in_progress";
  return "not_started";
}

export function accountId(a: OnboardingAccount): string {
  return a.account.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function selectAllStepNames(s: OnboardingSeed): string[] {
  const set = new Set<string>();
  for (const a of s.accounts) if (a.current_step) set.add(a.current_step);
  return Array.from(set).sort();
}
