// The needs-attention queue's signal library — the shared currency of Attention.
// Two tiers, per the GoCSM product context's signal library:
//   • Tier 1 "native" — HL-native events, ALWAYS on. The only tier a Phase-1 customer
//     (no Health configured) sees. Leads with the plain event; zero coined vocab.
//   • Tier 2 "health" — GoCSM-computed, health-derived. GATED behind Health Config; in
//     Phase 2 these JOIN the same queue alongside (never replacing) the native ones.
// Every signal leads with the plain event (Pattern 3) and carries a one-line
// "what this means" explainer (Pattern 2). Cohorts run through the criteria engine, so
// the count shown and the activation flow the row opens always agree.

import { normalize, matchAccounts, type Criterion, type CriteriaSet } from "./criteriaMatch";
import type { Recipe } from "./recipes";
import type { Account } from "./index";

export type SignalTier = "native" | "health";

export interface AttentionSignal {
  id: string;
  tier: SignalTier;
  icon: string;
  /** Plain HL-native event with the count baked in — the row's lead line. */
  title: (n: number) => string;
  /** One-line plain-English "what this means" (Pattern 2). */
  meaning: string;
  /** Cohort definition; the count and the setup it opens both derive from this. */
  set: CriteriaSet;
  /** The playbook this signal's action activates. */
  playbookId: string;
  /** Sort weight — higher surfaces first. */
  priority: number;
}

let i = 0;
const c = (fieldId: string, op: Criterion["op"], value?: Criterion["value"]): Criterion => ({
  id: `sig${++i}`,
  fieldId,
  op,
  value,
});
const crit = (match: "all" | "any", ...criteria: Criterion[]): CriteriaSet => normalize({ match, criteria });

// ---- Tier 1 — HL-native, always on (Phase 1 and Phase 2) -------------------
const NATIVE: AttentionSignal[] = [
  {
    id: "sig-payment-failed",
    tier: "native",
    icon: "credit-card",
    title: (n) => `Payment failed on ${n} sub-account${n === 1 ? "" : "s"}`,
    meaning: "A charge was declined — these accounts can lose access until billing is fixed.",
    set: crit("all", c("revenue.failedPayment", "is", true)),
    playbookId: "pb-payment-failed",
    priority: 90,
  },
  {
    id: "sig-no-login",
    tier: "native",
    icon: "moon",
    title: (n) => `${n} sub-account${n === 1 ? " hasn't" : "s haven't"} logged in for 14 days`,
    meaning: "No one has signed in for two weeks — usage has stalled and they may be drifting.",
    set: crit("all", c("engagement.lastLoginDays", "gt", 14)),
    playbookId: "pb-no-login",
    priority: 70,
  },
];

// ---- Tier 2 — GoCSM-computed, GATED behind Health Config (Phase 2 only) -----
const HEALTH: AttentionSignal[] = [
  {
    id: "sig-health-atrisk",
    tier: "health",
    icon: "trending-down",
    title: (n) => `${n} account${n === 1 ? "" : "s"} dropped to At-Risk`,
    meaning: "Their Health score fell into the At-Risk band — worth a save play before renewal.",
    set: crit("all", c("health.band", "isAnyOf", ["atrisk"])),
    playbookId: "pb-renewal-save",
    priority: 80,
  },
];

export interface QueueItem extends AttentionSignal {
  count: number;
  accounts: Account[];
}

function build(sig: AttentionSignal): QueueItem | null {
  const accs = matchAccounts(sig.set);
  if (accs.length === 0) return null;
  return { ...sig, count: accs.length, accounts: accs };
}

/**
 * The needs-attention queue.
 *  - Phase 1 (healthConfigured = false): native signals only.
 *  - Phase 2 (true): native + health, merged into ONE queue, ordered by urgency.
 * Health signals JOIN the native ones; they never replace them.
 */
export function attentionQueue(healthConfigured: boolean): QueueItem[] {
  const sigs = healthConfigured ? [...NATIVE, ...HEALTH] : NATIVE;
  return sigs
    .map(build)
    .filter((x): x is QueueItem => x !== null)
    .sort((a, b) => b.priority - a.priority);
}

/** Unique sub-accounts across the whole queue (cohorts overlap — never overclaim). */
export function queueAccountCount(items: QueueItem[]): number {
  const ids = new Set<string>();
  items.forEach((it) => it.accounts.forEach((a) => ids.add(a.identity.id)));
  return ids.size;
}

/**
 * Build a Recipe to hand to the activation flow, so the queue's action opens a setup
 * pre-scoped to exactly the accounts the row counted (count ↔ activation stay in sync).
 */
export function recipeForSignal(item: QueueItem): Recipe {
  return {
    id: item.id,
    icon: item.icon,
    label: item.title(item.count),
    blurb: item.meaning,
    set: item.set,
    playbookId: item.playbookId,
  };
}
