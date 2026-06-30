// Today-page orientation layer — the "book of business" summary + the day's problems.
//
// ARCHITECTURE (mirrors the real product split): all MATH + CLASSIFICATION happens here,
// deterministically, from the same fixtures the Insights pages read. `computeOrientation`
// returns a structured numbers object; `composeHeadline` only PHRASES those numbers into
// one tight paragraph. In production the phrasing step is an LLM that receives this object
// and writes the sentence — it never computes a number. `composeHeadline` is therefore the
// deterministic FALLBACK the UI renders whenever the LLM is slow or unavailable, so the
// page never looks broken. (Same contract as outcomeLog's outcomeSummary: numbers are
// exact; the wording is generated.)
//
// PHASE MODEL (see state/healthConfig.ts):
//   Phase 1 (Health NOT configured): HL-native signals only — payments, logins, adoption,
//     renewals. ZERO Health vocabulary (no bands, no scores).
//   Phase 2 (Health configured): everything above PLUS health-aware fields (distribution,
//     revenue-at-risk by band, sentiment). Additive — Phase 1 fields remain.

import {
  accounts,
  agencyRollup,
  healthDistribution,
  renewalsWindow,
  failedPayments,
  byBand,
  type Account,
  type HealthBand,
} from "./index";

// Dormancy threshold (days since last login) — sensible default when no agency config is set.
const DORMANT_DAYS = 30;

const live = (a: Account): boolean =>
  a.status.enabled === "Enabled" && a.lifecycle.stage !== "churned";

const sumMrr = (list: Account[]): number => list.reduce((s, a) => s + a.revenue.mrr, 0);

/** Accounts with assets in place but nothing actually switched on, or near-zero engagement
 *  across the board — the "drafted-not-active" / low-adoption case (the TaxNitro story). */
function lowAdoption(list: Account[]): Account[] {
  return list.filter((a) => {
    const f = a.adoption.features;
    if (!f.length) return false;
    const hasAssets = f.some((x) => x.assetCount > 0);
    const noneActive = f.every((x) => x.activeAssetCount === 0);
    const avgEngagement = f.reduce((s, x) => s + x.engagement, 0) / f.length;
    return (hasAssets && noneActive) || avgEngagement < 18;
  });
}

/** Most-recent failed-payment amount for an account (falls back to its MRR exposure). */
function pastDueAmount(a: Account): number {
  const failed = a.revenue.paymentAttempts
    .filter((p) => p.status === "failed")
    .sort((x, y) => Date.parse(y.date) - Date.parse(x.date));
  return failed[0]?.amount ?? a.revenue.mrr;
}

export interface AttentionGroup {
  key: "payments" | "dormant" | "adoption" | "atrisk";
  count: number;
  mrr: number;
  /** For a single-account group, the standout detail (e.g. days dormant) used in prose. */
  detail?: number;
}

export interface OrientationData {
  phase2: boolean;
  accounts: { tracked: number; total: number; live: number };
  mrr: number;
  activeUsers: { active: number; total: number };
  loginAccounts: { active: number; dormant: number };
  payments: { count: number; pastDue: number };
  renewals: { count: number; value: number };
  /** Union of the day's problem accounts (deduped) + per-category breakdown. */
  attention: { count: number; mrr: number; groups: AttentionGroup[] };
  /** Phase 2 only — null in Phase 1. */
  health: {
    distribution: { band: HealthBand; count: number }[];
    thrivingHealthy: number;
    watch: number;
    atrisk: number;
    revenueAtRisk: number;
    revenueAtRiskCount: number;
  } | null;
  /** Phase 2 only — null in Phase 1. */
  sentiment: { nps: number; negativeCount: number; responses: number } | null;
}

export function computeOrientation(healthConfigured: boolean): OrientationData {
  const all = accounts;
  const liveAccts = all.filter(live);
  const rollup = agencyRollup();

  // ── Accounts (honest denominator: tracked vs total) ──────────────────────
  const tracked = all.filter((a) => a.status.tracked).length;

  // ── End users (customer-side only — never internal CSMs) ─────────────────
  const activeUsers = liveAccts.reduce((s, a) => s + a.login.activeUsers, 0);
  const totalUsers = liveAccts.reduce((s, a) => s + a.login.users.length, 0);

  // ── Login health (accounts active vs dormant in the window) ──────────────
  const dormantAccts = liveAccts.filter((a) => a.login.lastLoginDaysAgo >= DORMANT_DAYS);
  const activeAccts = liveAccts.length - dormantAccts.length;

  // ── Payments ─────────────────────────────────────────────────────────────
  const failed = failedPayments();
  const pastDue = failed.reduce((s, a) => s + pastDueAmount(a), 0);

  // ── Renewals (next 90 days) ──────────────────────────────────────────────
  const renew90 = renewalsWindow(0, 90);

  // ── The day's problems ───────────────────────────────────────────────────
  // Assign each problem account to exactly ONE category, in severity order, so the headline's
  // category breakdown reconciles with its total count (no double-counting an account that has
  // both, e.g. dormant AND low adoption). Phase 2 adds at-risk as a category. (At-risk is only
  // used for the Phase-1-style breakdown; the Phase-2 headline leads with the health bands.)
  const lowAdopt = lowAdoption(liveAccts);
  const atRiskAccts = healthConfigured ? byBand("atrisk") : [];

  const claimed = new Set<string>();
  const claim = (list: Account[]): Account[] => {
    const fresh = list.filter((a) => !claimed.has(a.identity.id));
    fresh.forEach((a) => claimed.add(a.identity.id));
    return fresh;
  };
  const gPayments = claim(failed);
  const gDormant = claim(dormantAccts);
  const gAdoption = claim(lowAdopt);
  const gAtRisk = claim(atRiskAccts); // empty in Phase 1

  const groups: AttentionGroup[] = [
    { key: "payments", count: gPayments.length, mrr: sumMrr(gPayments) },
    {
      key: "dormant",
      count: gDormant.length,
      mrr: sumMrr(gDormant),
      detail: gDormant.length === 1 ? gDormant[0].login.lastLoginDaysAgo : undefined,
    },
    { key: "adoption", count: gAdoption.length, mrr: sumMrr(gAdoption) },
    { key: "atrisk", count: gAtRisk.length, mrr: sumMrr(gAtRisk) },
  ];
  const attentionCount = claimed.size;
  const attentionMrr = groups.reduce((s, g) => s + g.mrr, 0);

  // ── Phase 2 health rollups ───────────────────────────────────────────────
  let health: OrientationData["health"] = null;
  let sentiment: OrientationData["sentiment"] = null;
  if (healthConfigured) {
    const dist = healthDistribution();
    const watchAtRisk = [...byBand("watch"), ...byBand("atrisk")];
    health = {
      distribution: (["thriving", "healthy", "watch", "atrisk"] as HealthBand[]).map((band) => ({
        band,
        count: dist[band],
      })),
      thrivingHealthy: dist.thriving + dist.healthy,
      watch: dist.watch,
      atrisk: dist.atrisk,
      revenueAtRisk: sumMrr(watchAtRisk),
      revenueAtRiskCount: watchAtRisk.length,
    };

    const promoters = liveAccts.reduce((s, a) => s + a.feedback.promoters, 0);
    const detractors = liveAccts.reduce((s, a) => s + a.feedback.detractors, 0);
    const responses = liveAccts.reduce((s, a) => s + a.feedback.responses.length, 0);
    sentiment = {
      nps: responses > 0 ? Math.round(((promoters - detractors) / responses) * 100) : 0,
      negativeCount: liveAccts.filter((a) => a.feedback.sentiment === "negative").length,
      responses,
    };
  }

  return {
    phase2: healthConfigured,
    accounts: { tracked, total: all.length, live: rollup.liveAccounts },
    mrr: rollup.mrr,
    activeUsers: { active: activeUsers, total: totalUsers },
    loginAccounts: { active: activeAccts, dormant: dormantAccts.length },
    payments: { count: failed.length, pastDue },
    renewals: { count: renew90.length, value: sumMrr(renew90) },
    attention: { count: attentionCount, mrr: attentionMrr, groups },
    health,
    sentiment,
  };
}

// ─────────────────────────────── Phrasing ───────────────────────────────────
// The deterministic fallback. A real LLM gets the OrientationData object and writes this
// sentence; if it can't, we render exactly this. It must read as one tight, dollar-led,
// skimmable paragraph and must NEVER introduce a number that isn't already in the object.

const money = (n: number): string => "$" + Math.round(n).toLocaleString();
const plural = (n: number, one: string, many = one + "s"): string => (n === 1 ? one : many);

/** Natural-language join: ["a","b","c"] → "a, b and c". */
function joinList(parts: string[]): string {
  if (parts.length <= 1) return parts.join("");
  return parts.slice(0, -1).join(", ") + " and " + parts[parts.length - 1];
}

function describeGroup(g: AttentionGroup): string | null {
  if (g.count === 0) return null;
  switch (g.key) {
    case "payments":
      return `${g.count} failed ${plural(g.count, "payment")}`;
    case "dormant":
      return g.count === 1 && g.detail != null
        ? `1 hasn't logged in for ${g.detail} days`
        : `${g.count} have gone quiet`;
    case "adoption":
      return g.count === 1
        ? `1 hasn't switched on what they set up`
        : `${g.count} have low product adoption`;
    case "atrisk":
      return `${g.count} at risk`;
  }
}

export interface Headline {
  text: string;
  tone: "pos" | "watch" | "risk";
}

export function composeHeadline(d: OrientationData): Headline {
  const lead = `You're managing ${d.accounts.live} ${plural(
    d.accounts.live,
    "sub-account",
  )} ${d.phase2 ? `(${money(d.mrr)} MRR)` : `generating ${money(d.mrr)} MRR`}.`;

  const sentences: string[] = [lead];

  if (d.phase2 && d.health) {
    // Phase 2 — lead the problem with the health distribution, then the actionable specifics.
    const h = d.health;
    const bandBits: string[] = [];
    if (h.thrivingHealthy > 0) bandBits.push(`${h.thrivingHealthy} are Thriving or Healthy`);
    if (h.watch > 0) bandBits.push(`${h.watch} slipped to Watch`);
    if (h.atrisk > 0) bandBits.push(`${h.atrisk} ${plural(h.atrisk, "is", "are")} At-Risk`);
    if (bandBits.length) {
      const risk = h.revenueAtRisk > 0 ? ` (${money(h.revenueAtRisk)} MRR at risk)` : "";
      // "X are Thriving…, but Y slipped… and Z are At-Risk ($… at risk)."
      const head = bandBits[0];
      const rest = bandBits.slice(1);
      sentences.push(rest.length ? `${head}, but ${joinList(rest)}${risk}.` : `${head}.`);
    }
    const actionBits: string[] = [];
    if (d.payments.count > 0)
      actionBits.push(`${d.payments.count} failed ${plural(d.payments.count, "payment")} ${plural(d.payments.count, "needs", "need")} action`);
    if (d.renewals.count > 0)
      actionBits.push(`${d.renewals.count} ${plural(d.renewals.count, "renewal")} ${plural(d.renewals.count, "is", "are")} due within 90 days`);
    if (actionBits.length) sentences.push(capitalize(joinList(actionBits)) + ".");
  } else {
    // Phase 1 — HL-native problems only, dollar-weighted.
    const bits = d.attention.groups
      .filter((g) => g.key !== "atrisk")
      .map(describeGroup)
      .filter((s): s is string => !!s);
    if (d.attention.count > 0 && bits.length) {
      // Name every non-zero category so the breakdown reconciles with the headline count
      // (and the drafted-not-active / low-adoption case surfaces in prose on its own).
      sentences.push(
        `${d.attention.count} ${plural(d.attention.count, "account")} (${money(
          d.attention.mrr,
        )} MRR) ${plural(d.attention.count, "needs", "need")} attention today — ${joinList(bits)}.`,
      );
    } else {
      sentences.push("Your whole book is in good shape right now.");
    }
    if (d.renewals.count > 0) {
      sentences.push(
        `${d.renewals.count} ${plural(d.renewals.count, "renewal")} ${plural(
          d.renewals.count,
          "lands",
          "land",
        )} in the next 90 days.`,
      );
    }
  }

  const tone: Headline["tone"] =
    d.payments.count > 0 || (d.phase2 && (d.health?.atrisk ?? 0) > 0)
      ? "risk"
      : d.attention.count > 0 || (d.phase2 && (d.health?.watch ?? 0) > 0)
        ? "watch"
        : "pos";

  return { text: sentences.join(" "), tone };
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
