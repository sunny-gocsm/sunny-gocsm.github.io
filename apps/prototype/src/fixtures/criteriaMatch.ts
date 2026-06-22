// Matching engine for the Attention criteria builder — the live wall's brain.
// Pure functions over the Account model. No UI, no dates-from-now (anchored to TODAY).
//
// MODEL (CPDO §4/§9): a CriteriaSet is a top-level join over NODES, where a node is either
// a flat Criterion OR a Group (its own all/any over criteria — one level of nesting only,
// for Advanced mode). The Simple path stays flat: `set.criteria` is a maintained mirror of
// the leaf criteria so existing call-sites (drafts, recipes, AttentionActivation) keep
// working unchanged. When there are no groups, `nodes` and `criteria` are the same leaves.
//
// Powers: matchAccounts (the wall), candidateDelta (per-criterion preview), composition
// (the distribution bars), forecast7d (the "likely in 7 days" ghosts), floorWarn, and
// describeSet (the plain-English restatement, with parentheses for groups).

import { allAccounts, type Account, type HealthBand } from "./index";
import {
  CATALOG,
  fieldById,
  OP_LABEL,
  bandLabelShort,
  type Operator,
  type DateRelValue,
} from "./criteriaCatalog";

export type { DateRelValue };

export type CriterionValue =
  | number
  | [number, number]
  | string
  | string[]
  | boolean
  | DateRelValue
  | undefined;

export interface Criterion {
  id: string;
  fieldId: string;
  op: Operator;
  value?: CriterionValue;
}

export interface Group {
  id: string;
  kind: "group";
  match: "all" | "any";
  criteria: Criterion[];
}

export type Node = Criterion | Group;

export interface CriteriaSet {
  match: "all" | "any";
  /** Advanced structure: a mix of bare criteria and one-level groups. */
  nodes?: Node[];
  /** Flat mirror of all leaf criteria (back-compat: Simple path, drafts, recipes). */
  criteria: Criterion[];
  name?: string;
}

const live = (a: Account) => a.status.enabled === "Enabled" && a.lifecycle.stage !== "churned";

export const INVENTORY_FLOOR = 5;

export const isGroup = (n: Node): n is Group => (n as Group).kind === "group";

/** All leaf criteria, flattened (groups expanded). */
export function flatten(set: CriteriaSet): Criterion[] {
  if (!set.nodes) return set.criteria;
  return set.nodes.flatMap((n) => (isGroup(n) ? n.criteria : [n]));
}

/** Does this set use real nesting (any group with content)? */
export function isAdvanced(set: CriteriaSet): boolean {
  return !!set.nodes && set.nodes.some(isGroup);
}

/** The nodes to render — falls back to the flat criteria as bare nodes. */
export function nodesOf(set: CriteriaSet): Node[] {
  return set.nodes ?? set.criteria;
}

/** Rebuild the flat `criteria` mirror from nodes (keep the two in sync on every edit). */
export function withNodes(set: CriteriaSet, nodes: Node[]): CriteriaSet {
  return { ...set, nodes, criteria: nodes.flatMap((n) => (isGroup(n) ? n.criteria : [n])) };
}

/** Normalize any set (recipe/draft) into one carrying a `nodes` array. */
export function normalize(set: CriteriaSet): CriteriaSet {
  if (set.nodes) return { ...set, criteria: flatten(set) };
  return { ...set, nodes: set.criteria };
}

// ---------------------------------------------------------------------------
// Evaluation
// ---------------------------------------------------------------------------
function dayCount(v: DateRelValue): number {
  const mult = v.unit === "weeks" ? 7 : v.unit === "months" ? 30 : 1;
  return v.n * mult;
}

export function evalCriterion(a: Account, c: Criterion): boolean {
  const f = fieldById(c.fieldId);
  if (!f) return false; // hallucinated / unknown field → never matches (strip, don't trust)
  const raw = f.get(a);

  switch (c.op) {
    case "lt":
      return typeof raw === "number" && typeof c.value === "number" && raw < c.value;
    case "gt":
      return typeof raw === "number" && typeof c.value === "number" && raw > c.value;
    case "gte":
      return typeof raw === "number" && typeof c.value === "number" && raw >= c.value;
    case "lte":
      return typeof raw === "number" && typeof c.value === "number" && raw <= c.value;
    case "eq":
      return typeof raw === "number" && typeof c.value === "number" && raw === c.value;
    case "between": {
      if (typeof raw !== "number" || !Array.isArray(c.value)) return false;
      const [lo, hi] = c.value as [number, number];
      return raw >= lo && raw <= hi;
    }
    case "is":
      if (typeof raw === "boolean") return raw === (c.value === true || c.value === "true");
      return String(raw) === String(c.value);
    case "isNot":
      return String(raw) !== String(c.value);
    case "isAnyOf": {
      if (!Array.isArray(c.value)) return false;
      const want = (c.value as string[]).map(String);
      // For joined multi-value fields (features, risk tags) raw is "a,b,c".
      const have = String(raw).split(",").map((s) => s.trim()).filter(Boolean);
      return want.some((w) => have.includes(w));
    }
    case "isNoneOf": {
      if (!Array.isArray(c.value)) return true;
      const want = (c.value as string[]).map(String);
      const have = String(raw).split(",").map((s) => s.trim()).filter(Boolean);
      return !want.some((w) => have.includes(w));
    }
    case "contains":
      return String(raw).toLowerCase().includes(String(c.value ?? "").toLowerCase());
    case "startsWith":
      return String(raw).toLowerCase().startsWith(String(c.value ?? "").toLowerCase());
    case "inNext": {
      // future window: 0 ≤ days ≤ N
      if (typeof raw !== "number" || !c.value) return false;
      const n = dayCount(c.value as DateRelValue);
      return raw >= 0 && raw <= n;
    }
    case "within": {
      // |days| ≤ N (either direction)
      if (typeof raw !== "number" || !c.value) return false;
      const n = dayCount(c.value as DateRelValue);
      return Math.abs(raw) <= n;
    }
    case "inLast": {
      // past window: -N ≤ days ≤ 0
      if (typeof raw !== "number" || !c.value) return false;
      const n = dayCount(c.value as DateRelValue);
      return raw <= 0 && raw >= -n;
    }
    case "moreThanAgo": {
      // past, older than N: days < -N
      if (typeof raw !== "number" || !c.value) return false;
      const n = dayCount(c.value as DateRelValue);
      return raw < -n;
    }
    case "falling":
      return typeof raw === "number" && raw < 0;
    case "rising":
      return typeof raw === "number" && raw > 0;
    default:
      return false;
  }
}

function evalNode(a: Account, n: Node): boolean {
  if (!isGroup(n)) return evalCriterion(a, n);
  if (n.criteria.length === 0) return true;
  return n.match === "all"
    ? n.criteria.every((c) => evalCriterion(a, c))
    : n.criteria.some((c) => evalCriterion(a, c));
}

export function matchAccounts(set: CriteriaSet): Account[] {
  const base = allAccounts().filter(live);
  const nodes = nodesOf(set);
  if (nodes.length === 0) return base;
  return base.filter((a) =>
    set.match === "all"
      ? nodes.every((n) => evalNode(a, n))
      : nodes.some((n) => evalNode(a, n)),
  );
}

export const matchCount = (set: CriteriaSet): number => matchAccounts(set).length;

/** Signed change in wall size if `candidate` is added at top level (≤0 under "all"). */
export function candidateDelta(set: CriteriaSet, candidate: Criterion): number {
  const now = matchCount(set);
  const next = matchCount(withNodes(set, [...nodesOf(set), candidate]));
  return next - now;
}

/** Would adding `candidate` leave the wall at/below the inventory floor? */
export function floorWarn(set: CriteriaSet, candidate: Criterion): boolean {
  return matchCount(withNodes(set, [...nodesOf(set), candidate])) <= INVENTORY_FLOOR;
}

// ---------------------------------------------------------------------------
// Composition bars
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
  if ((c.op === "lt" || c.op === "lte" || c.op === "gt" || c.op === "gte") && typeof c.value === "number") {
    const margin = f.type === "days" ? 4 : f.type === "money" ? Math.round(c.value * 0.15) : 8;
    const widen = c.op === "lt" || c.op === "lte" ? c.value + margin : c.value - margin;
    return { ...c, value: widen };
  }
  return c;
}

const trendingToRisk = (a: Account) => a.health.delta < 0;

export function forecast7d(set: CriteriaSet): ForecastEntry[] {
  const leaves = flatten(set);
  if (leaves.length === 0) return [];
  const current = new Set(matchAccounts(set).map((a) => a.identity.id));
  const relaxedNodes = nodesOf(set).map((n) =>
    isGroup(n) ? { ...n, criteria: n.criteria.map(relax) } : relax(n),
  );
  const relaxed = withNodes(set, relaxedNodes);
  return matchAccounts(relaxed)
    .filter((a) => !current.has(a.identity.id) && trendingToRisk(a))
    .map((a) => {
      const speed = Math.max(1, Math.abs(a.health.delta));
      const gap = Math.max(1, Math.abs(50 - a.health.score) / 6);
      const etaDays = Math.min(7, Math.max(1, Math.round(gap / (speed / 4))));
      const confidence: "high" | "low" =
        Math.abs(a.health.delta) >= 4 && a.health.trend90d.length >= 6 ? "high" : "low";
      return { account: a, etaDays, confidence };
    })
    .sort((x, y) => x.etaDays - y.etaDays);
}

// ---------------------------------------------------------------------------
// Plain-English restatement — restate the set in prose, parentheses for groups.
// This PROSE path is the trust surface; it is deliberately MORE verbose/grammatical
// than the compact editable-chip controls (which keep "21d" / "$1500" / "is any of").
// Units are spelled out, money gets a thousands separator, and the operator words are
// rendered prose-side (see PROSE_OP_WORD) — never reusing the chip's OP_LABEL.
// ---------------------------------------------------------------------------
const UNIT_WORD: Record<string, (n: number) => string> = {
  d: (n) => (n === 1 ? "day" : "days"),
  "%": () => "%",
  min: (n) => (n === 1 ? "minute" : "minutes"),
  users: (n) => (n === 1 ? "user" : "users"),
};

// Prose value formatter — distinct from the chip's compact fmtNum. Spells units out and
// formats money with a thousands separator ("$1,500", "21 days").
function fmtProseNum(c: Criterion): (v: number) => string {
  const f = fieldById(c.fieldId);
  const unit = f?.unit;
  return (v: number) => {
    if (unit === "$") return "$" + v.toLocaleString("en-US");
    if (unit && UNIT_WORD[unit]) {
      const w = UNIT_WORD[unit](v);
      return unit === "%" ? `${v}%` : `${v} ${w}`;
    }
    return String(v);
  };
}

// Prose operator words — money reads "over"/"under" (not "is more than"/"is less than");
// band/enum membership reads plain "is" (not "is any of"). Kept SEPARATE from the chip's
// OP_LABEL so the editable chip keeps "is any of" / "is more than".
function proseOpWord(c: Criterion): string {
  const f = fieldById(c.fieldId);
  if (f?.type === "money") {
    if (c.op === "gt" || c.op === "gte") return "over";
    if (c.op === "lt" || c.op === "lte") return "under";
  }
  // Membership for band/enum reads as a plain "is" in prose.
  if (c.op === "isAnyOf") return "is";
  if (c.op === "isNoneOf") return "is not";
  return OP_LABEL[c.op];
}

function valuePhrase(c: Criterion): string {
  const f = fieldById(c.fieldId);
  const fmt = fmtProseNum(c);
  switch (c.op) {
    case "between":
      return Array.isArray(c.value) ? `${fmt((c.value as number[])[0])} and ${fmt((c.value as number[])[1])}` : "";
    case "isAnyOf":
    case "isNoneOf":
      return Array.isArray(c.value)
        ? (c.value as string[])
            .map((v) => (f?.type === "band" ? bandLabelShort(v as HealthBand) : v))
            .join(" or ")
        : "";
    case "is":
    case "isNot":
      if (f?.type === "boolean") return ""; // handled below
      return f?.type === "band" ? bandLabelShort(String(c.value) as HealthBand) : String(c.value ?? "");
    case "contains":
    case "startsWith":
      return `"${String(c.value ?? "")}"`;
    case "inNext":
    case "inLast":
    case "moreThanAgo":
    case "within": {
      const d = c.value as DateRelValue | undefined;
      if (!d) return "";
      const unitWord = d.unit === "days" ? (d.n === 1 ? "day" : "days") : d.unit;
      const tail = c.op === "moreThanAgo" ? " ago" : "";
      return `${d.n} ${unitWord}${tail}`.trim();
    }
    case "falling":
    case "rising":
      return "";
    default:
      return typeof c.value === "number" ? fmt(c.value) : String(c.value ?? "");
  }
}

// Booleans read as a natural clause rather than "field = Yes".
const BOOL_PHRASE: Record<string, { yes: string; no: string }> = {
  "revenue.failedPayment": { yes: "a payment failed", no: "no payment failed" },
  "health.priority": { yes: "is a priority account", no: "is not a priority account" },
  "feature.neverUsed": { yes: "no feature used since signup", no: "some feature used since signup" },
  "user.keyOnly": { yes: "has key users", no: "has no key users" },
};

// Day-count "time since an event" fields read as past tense with "ago" in prose:
// "last login was more than 21 days ago".
const AGO_FIELDS = new Set(["engagement.lastLoginDays", "user.idleDays"]);
const AGO_OP_WORD: Record<string, string> = {
  gt: "was more than",
  gte: "was at least",
  lt: "was less than",
  lte: "was at most",
  eq: "was exactly",
};

export function describeCriterion(c: Criterion): string {
  const f = fieldById(c.fieldId);
  if (!f) return "";
  if (f.type === "boolean") {
    const yes = c.value === true || c.value === "true";
    const p = BOOL_PHRASE[c.fieldId];
    if (p) return yes ? p.yes : p.no;
    return yes ? `${f.phrase} is Yes` : `${f.phrase} is No`;
  }
  // Days-since-an-event → past tense with a trailing "ago".
  if (AGO_FIELDS.has(c.fieldId) && AGO_OP_WORD[c.op] && typeof c.value === "number") {
    const vp = valuePhrase(c);
    return `${f.phrase} ${AGO_OP_WORD[c.op]} ${vp} ago`.trim();
  }
  const vp = valuePhrase(c);
  return `${f.phrase} ${proseOpWord(c)}${vp ? " " + vp : ""}`.trim();
}

function describeNode(n: Node): string {
  if (!isGroup(n)) return describeCriterion(n);
  if (n.criteria.length === 0) return "";
  const joiner = n.match === "all" ? " and " : " or ";
  const inner = n.criteria.map(describeCriterion).filter(Boolean).join(joiner);
  return n.criteria.length > 1 ? `(${inner})` : inner;
}

export function describeSet(set: CriteriaSet): string {
  const nodes = nodesOf(set).filter((n) => (isGroup(n) ? n.criteria.length > 0 : true));
  if (nodes.length === 0) return "All accounts";
  const joiner = set.match === "all" ? " and " : " or ";
  return "Accounts where " + nodes.map(describeNode).filter(Boolean).join(joiner);
}

// Catalog re-export convenience for builder UIs.
export { CATALOG };
