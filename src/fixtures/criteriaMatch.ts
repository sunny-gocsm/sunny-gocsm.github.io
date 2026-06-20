// Matching engine for the Attention criteria builder — the live wall's brain.
// Pure functions over the Account model. No UI, no dates-from-now (anchored to TODAY).
//
// Powers: matchAccounts (the wall), candidateDelta (per-criterion preview counts),
// composition (the distribution bars that cue the next filter), forecast7d (the
// "likely in 7 days" ghost tiles — honest + confidence-gated), floorWarn (inventory
// floor), and describeSet (the plain-English summary above the chips).

import { allAccounts, type Account, type HealthBand } from "./index";
import { CATALOG, fieldById, OP_LABEL, bandLabelShort, type Operator } from "./criteriaCatalog";

export type CriterionValue = number | [number, number] | string | string[] | undefined;

export interface Criterion {
  id: string;
  fieldId: string;
  op: Operator;
  value?: CriterionValue;
}

export interface CriteriaSet {
  match: "all" | "any";
  criteria: Criterion[];
  name?: string;
}

const live = (a: Account) => a.status.enabled === "Enabled" && a.lifecycle.stage !== "churned";

export const INVENTORY_FLOOR = 5;

// ---------------------------------------------------------------------------
// Evaluation
// ---------------------------------------------------------------------------
export function evalCriterion(a: Account, c: Criterion): boolean {
  const f = fieldById(c.fieldId);
  if (!f) return false; // hallucinated / unknown field → never matches (Honeycomb: strip, don't trust)
  const raw = f.get(a);
  switch (c.op) {
    case "lt":
      return typeof raw === "number" && typeof c.value === "number" && raw < c.value;
    case "gt":
      return typeof raw === "number" && typeof c.value === "number" && raw > c.value;
    case "between": {
      if (typeof raw !== "number" || !Array.isArray(c.value)) return false;
      const [lo, hi] = c.value as [number, number];
      return raw >= lo && raw <= hi;
    }
    case "is":
      return String(raw) === String(c.value);
    case "isNot":
      return String(raw) !== String(c.value);
    case "isAnyOf":
      return Array.isArray(c.value) && (c.value as string[]).map(String).includes(String(raw));
    case "falling":
      return typeof raw === "number" && raw < 0;
    case "rising":
      return typeof raw === "number" && raw > 0;
    default:
      return false;
  }
}

export function matchAccounts(set: CriteriaSet): Account[] {
  const base = allAccounts().filter(live);
  if (set.criteria.length === 0) return base;
  return base.filter((a) =>
    set.match === "all"
      ? set.criteria.every((c) => evalCriterion(a, c))
      : set.criteria.some((c) => evalCriterion(a, c)),
  );
}

export const matchCount = (set: CriteriaSet): number => matchAccounts(set).length;

/** Signed change in wall size if `candidate` is added (≤0 under "all" — how many it removes). */
export function candidateDelta(set: CriteriaSet, candidate: Criterion): number {
  const now = matchCount(set);
  const next = matchCount({ ...set, criteria: [...set.criteria, candidate] });
  return next - now;
}

/** Would adding `candidate` leave the wall at/below the inventory floor? */
export function floorWarn(set: CriteriaSet, candidate: Criterion): boolean {
  return matchCount({ ...set, criteria: [...set.criteria, candidate] }) <= INVENTORY_FLOOR;
}

// ---------------------------------------------------------------------------
// Composition bars — the bridge from "watch it shrink" to "what to filter next"
// ---------------------------------------------------------------------------
export interface CompositionPart {
  label: string;
  pct: number;
  tone: "neg" | "warn" | "pos" | "neutral";
}
export interface CompositionBar {
  dim: string;
  parts: CompositionPart[];
}

const BAND_TONE: Record<HealthBand, CompositionPart["tone"]> = {
  atrisk: "neg",
  watch: "warn",
  healthy: "pos",
  thriving: "pos",
};

function tally(accounts: Account[], key: (a: Account) => string): Map<string, number> {
  const m = new Map<string, number>();
  for (const a of accounts) m.set(key(a), (m.get(key(a)) ?? 0) + 1);
  return m;
}

export function composition(accounts: Account[]): CompositionBar[] {
  if (accounts.length === 0) return [];
  const n = accounts.length;
  const band = tally(accounts, (a) => a.health.band);
  const plan = tally(accounts, (a) => a.identity.plan);

  const bandBar: CompositionBar = {
    dim: "Health",
    parts: (["atrisk", "watch", "healthy", "thriving"] as HealthBand[])
      .filter((b) => band.get(b))
      .map((b) => ({ label: bandLabelShort(b), pct: Math.round(((band.get(b) ?? 0) / n) * 100), tone: BAND_TONE[b] })),
  };
  const planBar: CompositionBar = {
    dim: "Plan",
    parts: Array.from(plan.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([label, c]) => ({ label, pct: Math.round((c / n) * 100), tone: "neutral" as const })),
  };
  // Return the two dims; Health first (it's the action-relevant skew).
  return [bandBar, planBar].filter((b) => b.parts.length > 1 || b.dim === "Health");
}

// ---------------------------------------------------------------------------
// 7-day forecast — accounts trending toward the set. Honest + confidence-gated.
// ---------------------------------------------------------------------------
export interface ForecastEntry {
  account: Account;
  etaDays: number;
  confidence: "high" | "low";
}

// Relax numeric thresholds by a small margin so "near-miss + trending toward" surfaces.
function relax(c: Criterion): Criterion {
  const f = fieldById(c.fieldId);
  if (!f) return c;
  if ((c.op === "lt" || c.op === "gt") && typeof c.value === "number") {
    const margin = f.type === "days" ? 4 : f.type === "money" ? Math.round(c.value * 0.15) : 8;
    return { ...c, value: c.op === "lt" ? c.value + margin : c.value - margin };
  }
  return c;
}

/** Is the account trending TOWARD risk (so it's drifting into an attention set)? */
const trendingToRisk = (a: Account) => a.health.delta < 0;

export function forecast7d(set: CriteriaSet): ForecastEntry[] {
  if (set.criteria.length === 0) return [];
  const current = new Set(matchAccounts(set).map((a) => a.identity.id));
  const relaxed: CriteriaSet = { ...set, criteria: set.criteria.map(relax) };
  return matchAccounts(relaxed)
    .filter((a) => !current.has(a.identity.id) && trendingToRisk(a))
    .map((a) => {
      const speed = Math.max(1, Math.abs(a.health.delta));
      // closer to the band edge → sooner; clamp to the 7-day window
      const gap = Math.max(1, Math.abs(50 - a.health.score) / 6);
      const etaDays = Math.min(7, Math.max(1, Math.round(gap / (speed / 4))));
      const confidence: "high" | "low" = Math.abs(a.health.delta) >= 4 && a.health.trend90d.length >= 6 ? "high" : "low";
      return { account: a, etaDays, confidence };
    })
    .sort((x, y) => x.etaDays - y.etaDays);
}

// ---------------------------------------------------------------------------
// Plain-English summary (HubSpot Breeze pattern) — restate the set in prose.
// ---------------------------------------------------------------------------
function valuePhrase(c: Criterion): string {
  const f = fieldById(c.fieldId);
  const unit = f?.unit === "$" ? "$" : "";
  const suffix = f?.unit === "days" ? "d" : f?.unit === "%" ? "%" : "";
  const fmt = (v: number) => `${unit}${v}${suffix}`;
  switch (c.op) {
    case "between":
      return Array.isArray(c.value) ? `${fmt((c.value as number[])[0])}–${fmt((c.value as number[])[1])}` : "";
    case "isAnyOf":
      return Array.isArray(c.value)
        ? (c.value as string[]).map((v) => (f?.type === "band" ? bandLabelShort(v as HealthBand) : v)).join(" or ")
        : "";
    case "falling":
    case "rising":
      return "";
    default:
      return typeof c.value === "number" ? fmt(c.value) : f?.type === "band" ? bandLabelShort(String(c.value) as HealthBand) : String(c.value ?? "");
  }
}

export function describeCriterion(c: Criterion): string {
  const f = fieldById(c.fieldId);
  if (!f) return "";
  const vp = valuePhrase(c);
  return `${f.phrase} ${OP_LABEL[c.op]}${vp ? " " + vp : ""}`.trim();
}

export function describeSet(set: CriteriaSet): string {
  if (set.criteria.length === 0) return "All accounts";
  const joiner = set.match === "all" ? " and " : " or ";
  return "Accounts with " + set.criteria.map(describeCriterion).join(joiner);
}

// Catalog re-export convenience for builder UIs.
export { CATALOG };
