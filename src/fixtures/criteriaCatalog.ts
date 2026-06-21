// Criteria catalog — the field universe the Attention criteria builder operates over,
// grouped into the three attribute sets that become the builder's category gate
// (Health signal · Account · User). This file is also the schema the NL warm-start
// validates against: a compiled criterion whose fieldId isn't here is silently dropped.
//
// Pure data + accessors over the Account model. No UI.

import { allAccounts, daysUntil, type Account, type HealthBand } from "./index";

export type AttrSet = "health" | "account" | "user";

export type FieldType =
  | "score" // 0–100 pillar/health score
  | "money" // $ MRR
  | "number" // generic signed number (%, margin)
  | "days" // a day count (renewal-in, last-login)
  | "enum" // string from a fixed/derived set
  | "band" // HealthBand
  | "trendDir"; // direction of movement

export type Operator =
  | "lt"
  | "gt"
  | "between"
  | "is"
  | "isNot"
  | "isAnyOf"
  | "falling"
  | "rising";

export interface FieldDef {
  id: string;
  set: AttrSet;
  label: string;
  /** Short clause used to build the plain-English summary, e.g. "login activity". */
  phrase: string;
  type: FieldType;
  unit?: "$" | "%" | "score" | "days";
  /** Enum/band value providers — derived from REAL accounts so values autocomplete. */
  options?: () => string[];
  get: (a: Account) => number | string;
}

const live = (a: Account) => a.status.enabled === "Enabled" && a.lifecycle.stage !== "churned";
const distinct = (xs: string[]) => Array.from(new Set(xs)).sort();
const liveValues = (pick: (a: Account) => string) => () =>
  distinct(allAccounts().filter(live).map(pick));

export const CATALOG: FieldDef[] = [
  // ---------------- Health signal (the four pillars + composite) ----------------
  { id: "health.productAdoption", set: "health", label: "Product adoption (PAS)", phrase: "product adoption", type: "score", unit: "score", get: (a) => a.health.pillarScores.productAdoption },
  { id: "health.revenue", set: "health", label: "Revenue signal", phrase: "revenue signal", type: "score", unit: "score", get: (a) => a.health.pillarScores.revenue },
  { id: "health.login", set: "health", label: "Login signal", phrase: "login signal", type: "score", unit: "score", get: (a) => a.health.pillarScores.login },
  { id: "health.sentiment", set: "health", label: "Sentiment signal", phrase: "sentiment signal", type: "score", unit: "score", get: (a) => a.health.pillarScores.sentiment },
  { id: "health.score", set: "health", label: "Overall health score", phrase: "health score", type: "score", unit: "score", get: (a) => a.health.score },
  { id: "health.band", set: "health", label: "Health band", phrase: "health", type: "band", options: () => ["thriving", "healthy", "watch", "atrisk"], get: (a) => a.health.band },
  { id: "health.delta", set: "health", label: "Health trend", phrase: "health", type: "trendDir", get: (a) => a.health.delta },

  // ---------------- Account attributes ----------------
  { id: "account.plan", set: "account", label: "Plan", phrase: "plan", type: "enum", options: liveValues((a) => a.identity.plan), get: (a) => a.identity.plan },
  { id: "account.industry", set: "account", label: "Industry", phrase: "industry", type: "enum", options: liveValues((a) => a.identity.industry), get: (a) => a.identity.industry },
  { id: "account.stage", set: "account", label: "Lifecycle stage", phrase: "lifecycle", type: "enum", options: liveValues((a) => a.lifecycle.stage), get: (a) => a.lifecycle.stage },
  { id: "account.mrr", set: "account", label: "MRR", phrase: "MRR", type: "money", unit: "$", get: (a) => a.revenue.mrr },
  { id: "account.spendTrend", set: "account", label: "Spend trend", phrase: "spend", type: "trendDir", get: (a) => a.revenue.spendTrend },
  { id: "account.renewalInDays", set: "account", label: "Renews in (days)", phrase: "renewal", type: "days", unit: "days", get: (a) => Math.max(0, daysUntil(a.revenue.renewalDate)) },
  { id: "account.lastPayment", set: "account", label: "Last payment", phrase: "last payment", type: "enum", options: () => ["succeeded", "failed", "pending"], get: (a) => a.revenue.lastPaymentStatus },
  { id: "account.margin", set: "account", label: "Margin", phrase: "margin", type: "number", unit: "%", get: (a) => a.revenue.margin },

  // ---------------- User attributes ----------------
  { id: "user.lastLoginDaysAgo", set: "user", label: "Owner last login (days ago)", phrase: "last login", type: "days", unit: "days", get: (a) => a.login.lastLoginDaysAgo },
  { id: "user.activeUsers", set: "user", label: "Active users", phrase: "active users", type: "number", get: (a) => a.login.activeUsers },
  { id: "user.npsScore", set: "user", label: "NPS", phrase: "NPS", type: "number", get: (a) => a.feedback.npsScore },
  { id: "user.sentiment", set: "user", label: "Feedback sentiment", phrase: "feedback", type: "enum", options: () => ["positive", "neutral", "negative"], get: (a) => a.feedback.sentiment },
];

export const fieldById = (id: string): FieldDef | undefined => CATALOG.find((f) => f.id === id);

export const fieldsForSet = (set: AttrSet): FieldDef[] => CATALOG.filter((f) => f.set === set);

export const OPS_BY_TYPE: Record<FieldType, Operator[]> = {
  score: ["lt", "gt", "between"],
  money: ["gt", "lt", "between"],
  number: ["gt", "lt", "between"],
  days: ["gt", "lt", "between"],
  enum: ["is", "isNot", "isAnyOf"],
  band: ["is", "isAnyOf"],
  trendDir: ["falling", "rising"],
};

export const opsFor = (f: FieldDef): Operator[] => OPS_BY_TYPE[f.type];

export const OP_LABEL: Record<Operator, string> = {
  lt: "below",
  gt: "above",
  between: "between",
  is: "is",
  isNot: "is not",
  isAnyOf: "is any of",
  falling: "is falling",
  rising: "is rising",
};

export const SET_META: Record<AttrSet, { label: string; question: string; icon: string }> = {
  health: { label: "Health signal", question: "A health signal", icon: "activity" },
  account: { label: "Account", question: "An account detail", icon: "building" },
  user: { label: "User", question: "A user detail", icon: "users" },
};

export const bandLabelShort = (b: HealthBand): string =>
  b === "atrisk" ? "At-Risk" : b[0].toUpperCase() + b.slice(1);
