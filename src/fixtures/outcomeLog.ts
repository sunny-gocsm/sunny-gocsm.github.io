// Outcome log — the granular, action-level event history behind the Outcomes page.
// Each event = one workflow action GoCSM fired on/about an account, with its result and
// $ impact. Deterministic (no Math.random), anchored to TODAY, spread across ~300 days
// so the 7-day / 30-day / lifetime windows and every filter have real data.
//
// This is BOTH the audit log (the event rows) and the source of the report-card totals.

import { allAccounts, type Account, type HealthBand } from "./index";

export type ActionKind = "email" | "sms" | "call" | "alert" | "dunning" | "task";
export type EventCategory = "winback" | "payment" | "renewal" | "adoption" | "expansion";
export type EventResult = "worked" | "no_change" | "failed" | "pending";

export interface OutcomeEvent {
  id: string;
  daysAgo: number;
  accountId: string;
  accountName: string;
  plan: string;
  band: HealthBand;
  playbookId: string;
  playbookTitle: string;
  category: EventCategory;
  action: ActionKind;
  channel: string;
  result: EventResult;
  amount: number; // $ MRR recovered / protected — 0 when the action has no direct $ value
  attribution: "autopilot" | "you approved";
  summary: string;
}

export const CATEGORY_META: Record<EventCategory, { label: string; icon: string; valueLabel: string }> = {
  winback: { label: "Win-backs", icon: "moon", valueLabel: "MRR kept" },
  payment: { label: "Payments recovered", icon: "credit-card", valueLabel: "recovered" },
  renewal: { label: "Renewals saved", icon: "calendar-clock", valueLabel: "MRR saved" },
  adoption: { label: "Adoption nudges", icon: "activity", valueLabel: "MRR kept" },
  expansion: { label: "Expansions", icon: "trending-up", valueLabel: "new MRR" },
};

export const ACTION_META: Record<ActionKind, { label: string; icon: string; channel: string }> = {
  email: { label: "Email", icon: "mail", channel: "Email" },
  sms: { label: "SMS", icon: "message-square", channel: "SMS" },
  call: { label: "Call task", icon: "phone", channel: "Call" },
  alert: { label: "Alert", icon: "bell", channel: "In-app" },
  dunning: { label: "Dunning", icon: "credit-card", channel: "Billing" },
  task: { label: "Task", icon: "check-square", channel: "Task" },
};

export const RESULT_META: Record<EventResult, { label: string; tone: "pos" | "neutral" | "neg" | "warn" }> = {
  worked: { label: "Worked", tone: "pos" },
  no_change: { label: "No change", tone: "neutral" },
  failed: { label: "Didn't land", tone: "neg" },
  pending: { label: "In progress", tone: "warn" },
};

// ---------------------------------------------------------------------------
// Deterministic generation
// ---------------------------------------------------------------------------
type Tmpl = {
  category: EventCategory;
  playbookId: string;
  playbookTitle: string;
  actions: ActionKind[];
  // a small action "chain" fired for one episode, with the closing result
  verb: (name: string, action: ActionKind, result: EventResult) => string;
  // $ value when it works (function of the account's MRR)
  value: (mrr: number) => number;
};

const TEMPLATES: Tmpl[] = [
  {
    category: "winback",
    playbookId: "pb-no-login",
    playbookTitle: "Gone quiet",
    actions: ["email", "sms", "call"],
    verb: (n, a, r) =>
      r === "worked"
        ? `${n} logged back in after a ${ACTION_META[a].label.toLowerCase()}`
        : r === "failed"
          ? `${n} still hasn't returned after a ${ACTION_META[a].label.toLowerCase()}`
          : `Sent ${n} a warm check-in`,
    value: (mrr) => mrr,
  },
  {
    category: "payment",
    playbookId: "pb-payment-failed",
    playbookTitle: "Payment failed",
    actions: ["dunning", "email"],
    verb: (n, a, r) =>
      r === "worked"
        ? `Recovered a failed payment from ${n}`
        : r === "failed"
          ? `${n}'s payment is still failing after dunning`
          : `Ran a dunning retry for ${n}`,
    value: (mrr) => mrr,
  },
  {
    category: "renewal",
    playbookId: "pb-renewal-save",
    playbookTitle: "Renewing & at-risk",
    actions: ["alert", "email", "call"],
    verb: (n, a, r) =>
      r === "worked"
        ? `Protected ${n}'s renewal`
        : r === "failed"
          ? `${n}'s renewal still at risk`
          : `Flagged ${n}'s renewal for a save`,
    value: (mrr) => mrr,
  },
  {
    category: "adoption",
    playbookId: "pb-feature-drop",
    playbookTitle: "Adoption slipping",
    actions: ["email"],
    verb: (n, a, r) =>
      r === "worked"
        ? `${n} picked usage back up after a how-to`
        : r === "failed"
          ? `${n}'s usage kept sliding after a how-to`
          : `Sent ${n} a targeted how-to`,
    value: (mrr) => Math.round(mrr * 0.5),
  },
  {
    category: "expansion",
    playbookId: "pb-expansion-ready",
    playbookTitle: "Expansion ready",
    actions: ["email", "call"],
    verb: (n, a, r) =>
      r === "worked"
        ? `${n} expanded after a roadmap chat`
        : `Surfaced an upsell briefing for ${n}`,
    value: (mrr) => Math.round(mrr * 0.35),
  },
];

// pick a category that suits the account's situation (so the log reads true)
function categoriesFor(a: Account): EventCategory[] {
  const out: EventCategory[] = [];
  if (a.revenue.lastPaymentStatus === "failed" || a.revenue.paymentAttempts.some((p) => p.status === "failed")) out.push("payment");
  if (a.health.band === "atrisk" || a.health.band === "watch") out.push("winback", "renewal");
  if (a.health.pillarScores.productAdoption < 55) out.push("adoption");
  if (a.health.band === "thriving" || a.health.band === "healthy") out.push("expansion");
  if (out.length === 0) out.push("winback");
  return out;
}

// tiny deterministic hash → 0..1
const frac = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 100000;
  return (h % 1000) / 1000;
};

function buildEvents(): OutcomeEvent[] {
  const live = allAccounts().filter((a) => a.status.enabled === "Enabled" && a.lifecycle.stage !== "churned");
  const events: OutcomeEvent[] = [];
  let seq = 0;

  live.forEach((a, ai) => {
    const cats = categoriesFor(a);
    // 2–4 episodes per account, spread across ~300 days
    const episodes = 2 + Math.round(frac(a.identity.id + "ep") * 2);
    for (let e = 0; e < episodes; e++) {
      const cat = cats[(ai + e) % cats.length];
      const tmpl = TEMPLATES.find((t) => t.category === cat)!;
      const action = tmpl.actions[(ai + e) % tmpl.actions.length];
      // spread daysAgo: recent episodes for some, older for others
      const r = frac(a.identity.id + ":" + e);
      const daysAgo = Math.max(0, Math.round(r * 300) + (e === 0 ? 0 : 0) - (ai % 3 === 0 && e === 0 ? 0 : 0));
      // bias the first episode of at-risk accounts to be recent so 7d/30d windows have life
      const recentBias = e === 0 && (a.health.band === "atrisk" || a.health.band === "watch") ? Math.round(r * 25) : daysAgo;
      const d = e === 0 ? recentBias : daysAgo;
      // result distribution: mostly worked, some no_change/failed, a few pending (only recent)
      const rr = frac(a.identity.id + "r" + e);
      const result: EventResult =
        d <= 2 && rr > 0.7 ? "pending" : rr > 0.78 ? "failed" : rr > 0.62 ? "no_change" : "worked";
      const amount = result === "worked" ? tmpl.value(a.revenue.mrr) : 0;
      const attribution: OutcomeEvent["attribution"] = action === "email" || action === "sms" ? "you approved" : "autopilot";
      events.push({
        id: `ev-${++seq}`,
        daysAgo: d,
        accountId: a.identity.id,
        accountName: a.identity.name,
        plan: a.identity.plan,
        band: a.health.band,
        playbookId: tmpl.playbookId,
        playbookTitle: tmpl.playbookTitle,
        category: cat,
        action,
        channel: ACTION_META[action].channel,
        result,
        amount,
        attribution,
        summary: tmpl.verb(a.identity.name, action, result),
      });
    }
  });

  return events.sort((x, y) => x.daysAgo - y.daysAgo);
}

export const outcomeEvents: OutcomeEvent[] = buildEvents();

// ---------------------------------------------------------------------------
// Windows + report-card aggregation
// ---------------------------------------------------------------------------
export type Window = "7d" | "30d" | "lifetime";
export const WINDOW_DAYS: Record<Window, number> = { "7d": 7, "30d": 30, lifetime: Infinity };

export const eventsInWindow = (w: Window): OutcomeEvent[] =>
  outcomeEvents.filter((e) => e.daysAgo <= WINDOW_DAYS[w]);

export interface CategoryStat {
  category: EventCategory;
  count: number; // distinct accounts with a "worked" event in this category
  value: number; // $ summed over worked events
}
export interface ReportCard {
  totalValue: number;
  accountsHelped: number; // distinct accounts with any worked event
  actionsRun: number; // total events fired in window
  byCategory: CategoryStat[];
}

function aggregate(evs: OutcomeEvent[]): ReportCard {
  const worked = evs.filter((e) => e.result === "worked");
  const cats: EventCategory[] = ["winback", "payment", "renewal", "adoption", "expansion"];
  const byCategory = cats.map((c) => {
    const ce = worked.filter((e) => e.category === c);
    return { category: c, count: new Set(ce.map((e) => e.accountId)).size, value: ce.reduce((s, e) => s + e.amount, 0) };
  });
  return {
    totalValue: worked.reduce((s, e) => s + e.amount, 0),
    accountsHelped: new Set(worked.map((e) => e.accountId)).size,
    actionsRun: evs.length,
    byCategory,
  };
}

export const reportCard = (w: Window): ReportCard => aggregate(eventsInWindow(w));

/** Events in the equal-length window immediately before this one (days (D, 2D]). */
export const eventsInPriorWindow = (w: Window): OutcomeEvent[] => {
  if (w === "lifetime") return [];
  const d = WINDOW_DAYS[w];
  return outcomeEvents.filter((e) => e.daysAgo > d && e.daysAgo <= d * 2);
};

/** Current window + the prior equal-length window, so the UI can stamp a delta on every
 *  card. The window toggle auto-derives the comparison — the user never picks two ranges. */
export function reportCardCompare(w: Window): { current: ReportCard; prior: ReportCard | null } {
  return { current: aggregate(eventsInWindow(w)), prior: w === "lifetime" ? null : aggregate(eventsInPriorWindow(w)) };
}

// ---------------------------------------------------------------------------
// Filtering (for the audit log)
// ---------------------------------------------------------------------------
export interface EventFilter {
  window: Window;
  accountId?: string;
  category?: EventCategory;
  action?: ActionKind;
  result?: EventResult;
  query?: string;
}

export function filterEvents(f: EventFilter): OutcomeEvent[] {
  const q = f.query?.trim().toLowerCase();
  return eventsInWindow(f.window).filter(
    (e) =>
      (!f.accountId || e.accountId === f.accountId) &&
      (!f.category || e.category === f.category) &&
      (!f.action || e.action === f.action) &&
      (!f.result || e.result === f.result) &&
      (!q || e.accountName.toLowerCase().includes(q) || e.summary.toLowerCase().includes(q) || e.playbookTitle.toLowerCase().includes(q)),
  );
}

// ---------------------------------------------------------------------------
// AI summary — DETERMINISTIC: every figure is computed from the log; the wording is a
// template around those exact numbers (Tableau-Pulse grounding rule). Each bullet carries
// a `filter` so the UI can make the claim click straight to its source rows.
// ---------------------------------------------------------------------------
const fmt$ = (n: number) => "$" + Math.round(n).toLocaleString();
const WINDOW_PHRASE: Record<Window, string> = { "7d": "the last 7 days", "30d": "the last 30 days", lifetime: "since you installed GoCSM" };

export interface SummaryBullet {
  text: string;
  filter: Partial<EventFilter>;
  tone: "pos" | "warn";
}
export interface OutcomeSummary {
  asOf: string;
  verdict: string;
  bullets: SummaryBullet[];
  contextLine?: string;
  scopeLine: string;
}

export function outcomeSummary(w: Window): OutcomeSummary {
  const rc = reportCard(w);
  const phrase = WINDOW_PHRASE[w];
  const light = rc.totalValue < 1500 || rc.accountsHelped < 2;

  const verdict = light
    ? `Quieter stretch — GoCSM is watching ${rc.actionsRun} action${rc.actionsRun === 1 ? "" : "s"}, nothing on fire.`
    : `${rc.accountsHelped} accounts kept on board and ${fmt$(rc.totalValue)} protected ${phrase}.`;

  // Top categories by value → the wins (click-to-source via category filter).
  const winners = [...rc.byCategory].filter((c) => c.value > 0 || c.count > 0).sort((a, b) => b.value - a.value).slice(0, 3);
  const bullets: SummaryBullet[] = winners.map((c) => ({
    tone: "pos" as const,
    filter: { window: w, category: c.category, result: "worked" as EventResult },
    text:
      c.category === "winback"
        ? `Won back ${c.count} quiet account${c.count === 1 ? "" : "s"} worth ${fmt$(c.value)}`
        : c.category === "payment"
          ? `Recovered ${fmt$(c.value)} in failed payments`
          : c.category === "renewal"
            ? `Saved ${fmt$(c.value)} of renewals about to lapse`
            : c.category === "expansion"
              ? `Opened ${fmt$(c.value)} of expansion across ${c.count} account${c.count === 1 ? "" : "s"}`
              : `Pulled ${c.count} account${c.count === 1 ? "" : "s"} back into the product`,
  }));

  // One thing to look at — the most recent action that didn't land or is still pending.
  const watch = eventsInWindow(w)
    .filter((e) => e.result === "failed" || e.result === "pending")
    .sort((a, b) => a.daysAgo - b.daysAgo)[0];
  if (watch) {
    bullets.push({
      tone: "warn",
      filter: { window: w, accountId: watch.accountId },
      text: `Worth a look: ${watch.accountName} — ${watch.summary.replace(/^[A-Z]/, (m) => m.toLowerCase())}`,
    });
  }

  return {
    asOf: `Covers ${phrase} · as of today`,
    verdict,
    bullets,
    contextLine: light ? "A slow period is normal — GoCSM keeps watching so you don't have to." : undefined,
    scopeLine: "Based on the logins, payments, and CS actions GoCSM ran this period. Numbers are exact; the wording is generated.",
  };
}

/** Distinct accounts that appear in the log (for the customer filter). */
export const loggedAccounts = (): { id: string; name: string }[] => {
  const seen = new Map<string, string>();
  outcomeEvents.forEach((e) => seen.set(e.accountId, e.accountName));
  return Array.from(seen, ([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
};
