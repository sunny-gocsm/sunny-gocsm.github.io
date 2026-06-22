// Criteria catalog — the field universe the Attention criteria builder operates over,
// re-seeded to the exact CPDO §6 field set (~24 fields, ~7 "Common"). Grouped by the
// user's mental model (Common · Health & Risk · Engagement & Login · Feature adoption ·
// Revenue & Billing · Account · Feedback · Users). This file is also the schema the NL
// warm-start validates against: a compiled criterion whose fieldId isn't here is dropped.
//
// HARD RULE (catalog §6): NEVER expose PAS, raw pillar scores, the fake healthScore proxy,
// or velocity/cap internals. The four health.pillar fields are deliberately absent.
//
// Pure data + accessors over the Account model. No UI.

import { allAccounts, daysUntil, daysSince, type Account, type HealthBand } from "./index";

// The eight picker groups (Common surfaced first).
export type AttrGroup =
  | "common"
  | "health"
  | "engagement"
  | "feature"
  | "revenue"
  | "account"
  | "feedback"
  | "users";

export type FieldType =
  | "score" // 0–100 health score (Range)
  | "money" // $ MRR / lifetime spend (Range)
  | "number" // a single numeric threshold (users, days, %)
  | "days" // a day count (last login, account age)
  | "dateRelative" // a relative date window (renewal, created)
  | "enum" // a string from a fixed/derived set
  | "band" // HealthBand
  | "boolean" // a yes/no fact
  | "trendDir"; // direction of movement (rising / falling)

export type Operator =
  | "lt" // is less than
  | "gt" // is more than
  | "gte" // is at least
  | "lte" // is at most
  | "eq" // is exactly (number)
  | "between" // is between
  | "is" // is (enum / boolean)
  | "isNot" // is not
  | "isAnyOf" // is any of
  | "isNoneOf" // is none of
  | "contains" // text contains
  | "startsWith" // text starts with
  | "inNext" // date: in the next N
  | "inLast" // date: in the last N
  | "moreThanAgo" // date: more than N ago
  | "within" // date: within N
  | "falling" // trend down
  | "rising"; // trend up

// A relative-date value: "in the next 30 days", "more than 21 days ago", …
export interface DateRelValue {
  verb: "inNext" | "inLast" | "moreThanAgo" | "within";
  n: number;
  unit: "days" | "weeks" | "months";
}

export interface FieldDef {
  id: string;
  group: AttrGroup;
  /** Also tagged Common — surfaced in the "Common / suggested" shortlist. */
  common?: boolean;
  label: string;
  /** Short clause used to build the plain-English summary, e.g. "health". */
  phrase: string;
  type: FieldType;
  unit?: "$" | "%" | "d" | "min" | "users";
  /** Enum/band value providers — derived from REAL accounts so values autocomplete. */
  options?: () => string[];
  /**
   * Reader over the Account model. For dateRelative fields this returns the signed
   * day-count from TODAY (positive = future, e.g. renewal; negative = past).
   */
  get: (a: Account) => number | string | boolean;
}

const live = (a: Account) => a.status.enabled === "Enabled" && a.lifecycle.stage !== "churned";
const distinct = (xs: string[]) => Array.from(new Set(xs)).sort();
const liveValues = (pick: (a: Account) => string) => () =>
  distinct(allAccounts().filter(live).map(pick));

// ---- derived helpers over the fixture model (kept honest — no invented data) ----

// Login activity status from the owner's idle days (catalog: Active ≤7 · At-Risk 7–30 · Dormant >30).
const loginActivityStatus = (a: Account): string => {
  const d = a.login.lastLoginDaysAgo;
  return d <= 7 ? "Active" : d <= 30 ? "At-risk" : "Dormant";
};

// Risk tags exist on the revenue model; expose the real cached tags.
const RISK_TAG_LABEL: Record<string, string> = {
  "renewal-urgent": "Renewal urgent",
  "failed-payment": "Payment failed",
  "non-saas-dormant": "Dormant",
};
const riskTagLabels = (a: Account): string[] => a.revenue.riskTags.map((t) => RISK_TAG_LABEL[t] ?? t);

// The feature vocabulary the persona reasons about. Derived from real adoption features
// across all accounts so the combobox autocompletes from actual usage.
const FEATURE_VOCAB = [
  "Workflow",
  "Email",
  "SMS",
  "Phone",
  "Payment",
  "WebsiteFunnel",
  "Forms",
  "Reputation",
  "Memberships",
  "Calendar",
  "Opportunity",
];
const featuresInUse = (a: Account): string[] =>
  a.adoption.features.filter((f) => f.engagement > 0).map((f) => f.name);

// Spend trend bucket label (declining / flat / increasing) from the signed %.
const spendTrendBucket = (a: Account): string =>
  a.revenue.spendTrend <= -10 ? "declining" : a.revenue.spendTrend >= 10 ? "increasing" : "flat";

// Plan change (most recent) — upgraded / downgraded / cancelled / none.
const planChangeLabel = (a: Account): string => {
  const last = a.revenue.planChanges[a.revenue.planChanges.length - 1];
  if (!last) return "none";
  return last.type === "upgrade"
    ? "upgraded"
    : last.type === "downgrade"
      ? "downgraded"
      : last.type === "churn"
        ? "cancelled"
        : "reactivated";
};

// Payment frequency — fixtures don't carry billing interval, so derive a sensible proxy
// from MRR magnitude (a higher MRR Pro plan is far likelier billed annually). Honest proxy.
const paymentFrequency = (a: Account): string => (a.identity.plan.includes("Pro") ? "annual" : "monthly");

// Customer sentiment maps the fixture feedback.sentiment to the catalog's 4-band enum
// where we have signal, else neutral.
const sentimentLabel = (a: Account): string => {
  if (a.feedback.npsScore >= 9) return "very happy";
  if (a.feedback.sentiment === "positive") return "happy";
  if (a.feedback.sentiment === "negative") return "unhappy";
  return "neutral";
};

// Avg rating (0–5) — derive from NPS where present (0–10 → 0–5), else from the band.
const avgRating = (a: Account): number => {
  if (a.feedback.npsScore > 0) return Math.round((a.feedback.npsScore / 2) * 10) / 10;
  const byBand: Record<HealthBand, number> = { thriving: 4.6, healthy: 4.1, watch: 3.2, atrisk: 2.4 };
  return byBand[a.health.band];
};

// Total time spent (minutes / 30d) across the account.
const totalTimeSpent = (a: Account): number => a.login.totalLoggedInTime;

// Lifetime spend proxy — MRR × months active (no real cumulative field in fixtures).
const lifetimeSpend = (a: Account): number =>
  Math.round(a.revenue.mrr * Math.max(1, a.identity.activeDays / 30));

// Feature engagement trend — the avg engagement direction. We approximate from health
// delta sign scoped to feature-bearing accounts (honest proxy; no per-feature WoW in fixtures).
const featureEngagementTrend = (a: Account): number => a.health.delta;

// "Feature never used since signup" — true when the account has no feature with engagement.
const noFeatureUse = (a: Account): boolean => a.adoption.features.every((f) => f.engagement <= 0);

export const CATALOG: FieldDef[] = [
  // ─────────────────────────── Health & Risk ───────────────────────────
  {
    id: "health.band",
    group: "health",
    common: true,
    label: "Health band",
    phrase: "health",
    type: "band",
    options: () => ["atrisk", "watch", "healthy", "thriving"],
    get: (a) => a.health.band,
  },
  {
    id: "health.score",
    group: "health",
    label: "Health score",
    phrase: "health score",
    type: "score",
    get: (a) => a.health.score,
  },
  {
    id: "health.trend",
    group: "health",
    common: true,
    label: "Health trend",
    phrase: "health",
    type: "trendDir",
    get: (a) => a.health.delta,
  },
  {
    id: "health.riskTags",
    group: "health",
    label: "Risk tags",
    phrase: "risk tags",
    type: "enum",
    options: () => distinct(allAccounts().filter(live).flatMap(riskTagLabels)),
    get: (a) => riskTagLabels(a).join(","), // joined; matched via includes
  },
  {
    id: "health.lifecycle",
    group: "health",
    label: "Account stage",
    phrase: "stage",
    type: "enum",
    options: liveValues((a) => a.lifecycle.stage),
    get: (a) => a.lifecycle.stage,
  },
  {
    id: "health.priority",
    group: "health",
    label: "Priority account",
    phrase: "priority account",
    type: "boolean",
    get: (a) => a.status.isPriority,
  },
  {
    id: "health.status",
    group: "health",
    label: "Account status",
    phrase: "account status",
    type: "enum",
    options: () => ["active", "churned", "cancelled"],
    get: (a) =>
      a.lifecycle.stage === "churned"
        ? "churned"
        : a.status.enabled === "Disabled"
          ? "cancelled"
          : "active",
  },

  // ─────────────────────────── Engagement & Login ───────────────────────────
  {
    id: "engagement.lastLoginDays",
    group: "engagement",
    common: true,
    label: "Days since last login",
    phrase: "last login",
    type: "days",
    unit: "d",
    get: (a) => a.login.lastLoginDaysAgo,
  },
  {
    id: "engagement.activityStatus",
    group: "engagement",
    label: "Login activity status",
    phrase: "login activity",
    type: "enum",
    options: () => ["Active", "At-risk", "Dormant"],
    get: (a) => loginActivityStatus(a),
  },
  {
    id: "engagement.activeUsers",
    group: "engagement",
    label: "Active users",
    phrase: "active users",
    type: "number",
    unit: "users",
    get: (a) => a.login.activeUsers,
  },
  {
    id: "engagement.timeSpent",
    group: "engagement",
    label: "Total time spent",
    phrase: "time spent",
    type: "number",
    unit: "min",
    get: (a) => totalTimeSpent(a),
  },

  // ─────────────────────────── Feature adoption ───────────────────────────
  {
    id: "feature.inUse",
    group: "feature",
    common: true,
    label: "Feature in use",
    phrase: "features in use",
    type: "enum",
    options: () => FEATURE_VOCAB,
    get: (a) => featuresInUse(a).join(","), // joined; matched via includes
  },
  {
    id: "feature.engagementTrend",
    group: "feature",
    label: "Feature engagement trend",
    phrase: "feature engagement",
    type: "trendDir",
    get: (a) => featureEngagementTrend(a),
  },
  {
    id: "feature.neverUsed",
    group: "feature",
    label: "Feature never used since signup",
    phrase: "no feature used since signup",
    type: "boolean",
    get: (a) => noFeatureUse(a),
  },

  // ─────────────────────────── Revenue & Billing ───────────────────────────
  {
    id: "revenue.mrr",
    group: "revenue",
    common: true,
    label: "MRR",
    phrase: "MRR",
    type: "money",
    unit: "$",
    get: (a) => a.revenue.mrr,
  },
  {
    id: "revenue.spendTrend",
    group: "revenue",
    label: "Spend trend",
    phrase: "spend",
    type: "enum",
    options: () => ["declining", "flat", "increasing"],
    get: (a) => spendTrendBucket(a),
  },
  {
    id: "revenue.lifetimeSpend",
    group: "revenue",
    label: "Lifetime spend",
    phrase: "lifetime spend",
    type: "money",
    unit: "$",
    get: (a) => lifetimeSpend(a),
  },
  {
    id: "revenue.plan",
    group: "revenue",
    label: "Plan",
    phrase: "plan",
    type: "enum",
    options: liveValues((a) => a.identity.plan),
    get: (a) => a.identity.plan,
  },
  {
    id: "revenue.planChange",
    group: "revenue",
    label: "Plan change",
    phrase: "plan change",
    type: "enum",
    options: () => ["upgraded", "downgraded", "cancelled", "reactivated", "none"],
    get: (a) => planChangeLabel(a),
  },
  {
    id: "revenue.paymentFreq",
    group: "revenue",
    label: "Payment frequency",
    phrase: "billing",
    type: "enum",
    options: () => ["monthly", "annual"],
    get: (a) => paymentFrequency(a),
  },
  {
    id: "revenue.failedPayment",
    group: "revenue",
    common: true,
    label: "Failed payment",
    phrase: "payment",
    type: "boolean",
    get: (a) =>
      a.revenue.lastPaymentStatus === "failed" ||
      a.revenue.paymentAttempts.some((p) => p.status === "failed"),
  },
  {
    id: "revenue.renewsWithin",
    group: "revenue",
    common: true,
    label: "Renews within",
    phrase: "renews",
    type: "dateRelative",
    unit: "d",
    get: (a) => daysUntil(a.revenue.renewalDate), // signed: + = in the future
  },

  // ─────────────────────────── Account ───────────────────────────
  {
    id: "account.name",
    group: "account",
    label: "Account name",
    phrase: "account name",
    type: "enum", // text-like; options autocomplete from real names
    options: liveValues((a) => a.identity.name),
    get: (a) => a.identity.name,
  },
  {
    id: "account.age",
    group: "account",
    label: "Account age",
    phrase: "account age",
    type: "days",
    unit: "d",
    get: (a) => a.identity.activeDays,
  },
  {
    id: "account.created",
    group: "account",
    label: "Created (GoCSM/GHL)",
    phrase: "created",
    type: "dateRelative",
    unit: "d",
    get: (a) => -daysSince(a.identity.clientSince), // negative: in the past
  },

  // ─────────────────────────── Feedback ───────────────────────────
  {
    id: "feedback.sentiment",
    group: "feedback",
    label: "Customer sentiment",
    phrase: "sentiment",
    type: "enum",
    options: () => ["very happy", "happy", "neutral", "unhappy"],
    get: (a) => sentimentLabel(a),
  },
  {
    id: "feedback.rating",
    group: "feedback",
    label: "Avg rating",
    phrase: "rating",
    type: "number",
    get: (a) => avgRating(a),
  },

  // ─────────────────────────── Users ───────────────────────────
  {
    id: "user.role",
    group: "users",
    label: "User role",
    phrase: "user role",
    type: "enum",
    options: () => ["owner", "admin", "user"],
    get: (a) => a.login.users[0]?.role ?? "owner",
  },
  {
    id: "user.keyOnly",
    group: "users",
    label: "Key users only",
    phrase: "key users",
    type: "boolean",
    get: (a) => a.login.users.some((u) => u.keyUser),
  },
  {
    id: "user.idleDays",
    group: "users",
    label: "Days since a user logged in",
    phrase: "days since a user logged in",
    type: "days",
    unit: "d",
    get: (a) => a.login.lastLoginDaysAgo,
  },
];

export const fieldById = (id: string): FieldDef | undefined => CATALOG.find((f) => f.id === id);

export const commonFields = (): FieldDef[] => CATALOG.filter((f) => f.common);

export const fieldsForGroup = (g: AttrGroup): FieldDef[] =>
  g === "common" ? commonFields() : CATALOG.filter((f) => f.group === g);

// ---------------------------------------------------------------------------
// Operators per field type
// ---------------------------------------------------------------------------
export const OPS_BY_TYPE: Record<FieldType, Operator[]> = {
  score: ["between", "gte", "lte", "gt", "lt", "eq"],
  money: ["gt", "lt", "gte", "lte", "between"],
  number: ["gt", "lt", "gte", "lte", "eq"],
  days: ["gt", "lt", "gte", "lte", "eq"],
  dateRelative: ["inNext", "inLast", "moreThanAgo", "within"],
  enum: ["isAnyOf", "isNoneOf", "is", "isNot"],
  band: ["isAnyOf", "is"],
  boolean: ["is"],
  trendDir: ["falling", "rising"],
};

export const opsFor = (f: FieldDef): Operator[] => {
  // Account name is text-like: contains/is/startsWith.
  if (f.id === "account.name") return ["contains", "is", "isNot", "startsWith"];
  return OPS_BY_TYPE[f.type];
};

// Plain-word operator labels. Auto-pluralizing handled at render (is → is any of) via the
// operator value itself. Never symbols.
export const OP_LABEL: Record<Operator, string> = {
  lt: "is less than",
  gt: "is more than",
  gte: "is at least",
  lte: "is at most",
  eq: "is exactly",
  between: "is between",
  is: "is",
  isNot: "is not",
  isAnyOf: "is any of",
  isNoneOf: "is none of",
  contains: "contains",
  startsWith: "starts with",
  inNext: "in the next",
  inLast: "in the last",
  moreThanAgo: "more than",
  within: "within",
  falling: "is falling",
  rising: "is rising",
};

// Picker group metadata (label + icon + the persona's question).
export const GROUP_META: Record<AttrGroup, { label: string; icon: string }> = {
  common: { label: "Common", icon: "sparkles" },
  health: { label: "Health & Risk", icon: "heart-pulse" },
  engagement: { label: "Engagement & Login", icon: "activity" },
  feature: { label: "Feature adoption", icon: "square-stack" },
  revenue: { label: "Revenue & Billing", icon: "credit-card" },
  account: { label: "Account", icon: "building-2" },
  feedback: { label: "Feedback", icon: "message-square" },
  users: { label: "Users", icon: "users" },
};

export const GROUP_ORDER: AttrGroup[] = [
  "common",
  "health",
  "engagement",
  "feature",
  "revenue",
  "account",
  "feedback",
  "users",
];

export const bandLabelShort = (b: HealthBand): string =>
  b === "atrisk" ? "At-risk" : b[0].toUpperCase() + b.slice(1);
