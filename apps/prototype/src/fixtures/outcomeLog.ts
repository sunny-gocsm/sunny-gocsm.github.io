// Outcome log — the granular, action-level event history behind the Outcomes page.
// Each event = one action a playbook fired on/about an account, with its result and
// $ impact. Deterministic (no Math.random), anchored to TODAY, spread across ~300 days
// so the 7-day / 30-day / lifetime windows and every filter have real data.
//
// This is the spine for all three rungs of the redesigned Outcomes page:
//   Rung 1 (impact / ROI)        → impactSummary() · impactVerdict()
//   Rung 2 (playbook effectiveness) → playbookScorecard()
//   Rung 3 (audit log)           → the event rows themselves + channelBreakdown()
//
// HONESTY MODEL (the design-loop fix, 2026-06-30): each account has at most ONE primary
// situation, so the retention categories (winback / payment / renewal) are mutually
// EXCLUSIVE per account — a customer's saved MRR is attributed to exactly one playbook and
// counted ONCE. Adoption (retained-usage value) and expansion (genuinely NEW mrr) are
// different money on different accounts, so they stay additive. There is no double-count.

import { allAccounts, daysUntil, TODAY, type Account, type HealthBand } from "./index";

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

// CATEGORY_META — one per activated playbook. `objective` is the plain-English goal shown
// on the effectiveness scorecard; `goalVerb` is the success word ("8 came back").
export const CATEGORY_META: Record<
  EventCategory,
  { label: string; icon: string; valueLabel: string; objective: string; goalVerb: string }
> = {
  winback: {
    label: "Win-backs",
    icon: "moon",
    valueLabel: "MRR kept",
    objective: "Brings back customers who went quiet and stopped logging in.",
    goalVerb: "came back",
  },
  payment: {
    label: "Payments recovered",
    icon: "credit-card",
    valueLabel: "recovered",
    objective: "Recovers customers whose card was declined.",
    goalVerb: "recovered",
  },
  renewal: {
    label: "Renewals saved",
    icon: "calendar-clock",
    valueLabel: "MRR saved",
    objective: "Saves renewals that were about to lapse.",
    goalVerb: "saved",
  },
  adoption: {
    label: "Usage nudges",
    icon: "activity",
    valueLabel: "kept",
    objective: "Re-engages customers whose usage was sliding.",
    goalVerb: "re-engaged",
  },
  expansion: {
    label: "Expansions",
    icon: "trending-up",
    valueLabel: "new monthly revenue",
    objective: "Opens upgrade chats with your happiest, fastest-growing customers.",
    goalVerb: "expanded",
  },
};

export const ACTION_META: Record<ActionKind, { label: string; icon: string; channel: string }> = {
  email: { label: "Email", icon: "mail", channel: "Email" },
  sms: { label: "SMS", icon: "message-square", channel: "SMS" },
  call: { label: "Call task", icon: "phone", channel: "Call" },
  alert: { label: "Alert", icon: "bell", channel: "In-app" },
  dunning: { label: "Card retry", icon: "credit-card", channel: "Billing" },
  task: { label: "Task", icon: "check-square", channel: "Task" },
};

// CHANNEL_META — the by-channel lens (Rung 3). Plain channels the owner already knows.
export const CHANNEL_META: Record<string, { label: string; icon: string }> = {
  Email: { label: "Email", icon: "mail" },
  SMS: { label: "SMS", icon: "message-square" },
  Call: { label: "Call", icon: "phone" },
  "In-app": { label: "In-app", icon: "bell" },
  Billing: { label: "Billing retry", icon: "credit-card" },
  Task: { label: "Task", icon: "check-square" },
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
  // a small action "chain" fired for one episode, with the closing result. Name-free —
  // the account is shown beside it in the row, so the phrase never repeats the name.
  verb: (action: ActionKind, result: EventResult) => string;
  // $ value when it works (function of the account's MRR)
  value: (mrr: number) => number;
};

// "after an email" / "after a call" — the article + noun for each channel.
const ACTION_PHRASE: Record<ActionKind, string> = {
  email: "an email",
  sms: "a text",
  call: "a call",
  alert: "an alert",
  dunning: "a card retry",
  task: "a task",
};

const TEMPLATES: Record<EventCategory, Tmpl> = {
  winback: {
    category: "winback",
    playbookId: "pb-no-login",
    playbookTitle: "Gone quiet",
    actions: ["email", "sms", "call"],
    verb: (a, r) =>
      r === "worked"
        ? `Logged back in after ${ACTION_PHRASE[a]}`
        : r === "failed"
          ? `Still away after ${ACTION_PHRASE[a]}`
          : `Warm check-in sent`,
    value: (mrr) => mrr,
  },
  payment: {
    category: "payment",
    playbookId: "pb-payment-failed",
    playbookTitle: "Payment failed",
    actions: ["dunning", "email"],
    verb: (_a, r) =>
      r === "worked"
        ? `Recovered a failed payment`
        : r === "failed"
          ? `Card still declining after retries`
          : `Retrying the card`,
    value: (mrr) => mrr,
  },
  renewal: {
    category: "renewal",
    playbookId: "pb-renewal-save",
    playbookTitle: "Renewing soon",
    actions: ["alert", "email", "call"],
    verb: (_a, r) =>
      r === "worked"
        ? `Renewal protected`
        : r === "failed"
          ? `Renewal still at risk`
          : `Renewal flagged for a save`,
    value: (mrr) => mrr,
  },
  adoption: {
    category: "adoption",
    playbookId: "pb-feature-drop",
    playbookTitle: "Cooling off",
    actions: ["email"],
    verb: (_a, r) =>
      r === "worked"
        ? `Picked usage back up after a how-to`
        : r === "failed"
          ? `Usage kept sliding after a how-to`
          : `Targeted how-to sent`,
    value: (mrr) => Math.round(mrr * 0.5),
  },
  expansion: {
    category: "expansion",
    playbookId: "pb-expansion-ready",
    playbookTitle: "Expansion ready",
    actions: ["email", "call"],
    verb: (_a, r) =>
      r === "worked"
        ? `Expanded after a roadmap chat`
        : `Spotted an upsell`,
    value: (mrr) => Math.round(mrr * 0.35),
  },
};

export const PLAYBOOK_ORDER: EventCategory[] = ["winback", "payment", "renewal", "adoption", "expansion"];

/** The activated playbooks, by category → title (for the audit-log "All playbooks" filter). */
export const PLAYBOOK_LIST: { category: EventCategory; title: string }[] = PLAYBOOK_ORDER.map((c) => ({
  category: c,
  title: TEMPLATES[c].playbookTitle,
}));
export const playbookTitleFor = (c: EventCategory): string => TEMPLATES[c].playbookTitle;

// Pick the ONE primary situation an account is in, so each account's saved MRR is counted
// once. Order = root cause first: a customer who's gone quiet is a win-back BEFORE their
// renewal can be saved (you can't save a ghost's renewal). Returns null for genuinely-fine
// accounts (no episode — and that's honest: nothing needed doing).
function primaryCategoryFor(a: Account): EventCategory | null {
  // 1. Card declined — the most specific, most urgent money signal.
  const paymentTrouble =
    a.revenue.lastPaymentStatus === "failed" || a.revenue.paymentAttempts.some((p) => p.status === "failed");
  if (paymentTrouble) return "payment";

  const atRisk = a.health.band === "atrisk" || a.health.band === "watch";
  if (atRisk) {
    // 2. Gone quiet — stopped logging in. The root cause; trumps renewal timing.
    if (a.login.lastLoginDaysAgo >= 14) return "winback";
    // 3. Renewing soon and still showing up — protect the renewal.
    if (daysUntil(a.revenue.renewalDate) <= 45) return "renewal";
    // 4. Still present but usage sliding — re-engage adoption.
    if (a.health.pillarScores.productAdoption < 55) return "adoption";
    return null;
  }

  // 5. Healthy / thriving with rising usage — a genuinely NEW-money expansion (disjoint set).
  const upsellReady = a.health.delta > 0 && a.revenue.spendTrend > 0 && a.login.lastLoginDaysAgo <= 21;
  if ((a.health.band === "thriving" || a.health.band === "healthy") && upsellReady) return "expansion";
  return null;
}

// tiny deterministic hash → 0..1
const frac = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 100000;
  return (h % 1000) / 1000;
};

// An intermediate cascade step (the workflow tried something, no result yet).
const STEP_SENT: Record<ActionKind, string> = {
  email: "Sent an email — no reply yet",
  sms: "Sent a text — no reply yet",
  call: "Left a voicemail — no answer yet",
  dunning: "Retried the card — still declined",
  alert: "Raised an alert for the team",
  task: "Opened a follow-up task",
};

// One "episode" = a playbook firing on one account for its one situation. It plays out as a
// CASCADE of individual actions (email → text → call); the resolving step carries the
// outcome and the $ value, the earlier steps are no-change attempts worth $0. This is what
// makes the log an audit trail — every action is its own row, but each $ is counted once.
function buildEvents(): OutcomeEvent[] {
  const live = allAccounts().filter((a) => a.status.enabled === "Enabled" && a.lifecycle.stage !== "churned");
  const events: OutcomeEvent[] = [];
  let seq = 0;

  live.forEach((a) => {
    const cat = primaryCategoryFor(a);
    if (!cat) return; // genuinely-fine account — no episode
    const tmpl = TEMPLATES[cat];

    // When did this episode happen? At-risk situations bias recent so the 7-/30-day
    // windows have life; healthier nudges spread across the install lifetime.
    const recent = a.health.band === "atrisk" || a.health.band === "watch";
    const startDaysAgo = recent
      ? Math.round(frac(a.identity.id + cat + "recent") * 24) + 1
      : Math.round(frac(a.identity.id + cat) * 286) + 8;

    // Episode outcome (the result of the LAST step in the cascade). A handful of recent
    // episodes are left "pending" (still in play) so the honest in-progress state is real.
    const rr = frac(a.identity.id + cat + "res");
    const outcome: EventResult =
      startDaysAgo <= 14 && rr > 0.58 ? "pending" : rr > 0.8 ? "failed" : rr > 0.52 ? "no_change" : "worked";

    // How many actions the workflow fired before it resolved. Bias worked/pending episodes
    // toward 2+ steps so the cascade (and the channel mix) shows in the log.
    const maxSteps = tmpl.actions.length;
    const steps =
      outcome === "worked" || outcome === "pending"
        ? Math.min(maxSteps, 1 + Math.round(frac(a.identity.id + cat + "steps") * (maxSteps - 1) + 0.4))
        : maxSteps;

    for (let s = 0; s < steps; s++) {
      const isLast = s === steps - 1;
      const action = tmpl.actions[s % tmpl.actions.length];
      const result: EventResult = isLast ? outcome : "no_change";
      // steps walk forward in time toward the resolution at startDaysAgo
      const d = Math.max(0, startDaysAgo + (steps - 1 - s) * 2);
      const amount = isLast && outcome === "worked" ? tmpl.value(a.revenue.mrr) : 0;
      // Autopilot = the channels GoCSM fires automatically (email / SMS / card-retry / in-app
      // alert). Calls and tasks are work a human does — credited to "you & your team".
      const attribution: OutcomeEvent["attribution"] = action === "call" || action === "task" ? "you approved" : "autopilot";
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
        summary: isLast ? tmpl.verb(action, result) : STEP_SENT[action],
      });
    }
  });

  return events.sort((x, y) => x.daysAgo - y.daysAgo);
}

export const outcomeEvents: OutcomeEvent[] = buildEvents();

// ---------------------------------------------------------------------------
// Windows
// ---------------------------------------------------------------------------
export type Window = "7d" | "30d" | "lifetime";
export const WINDOW_DAYS: Record<Window, number> = { "7d": 7, "30d": 30, lifetime: Infinity };

export const eventsInWindow = (w: Window): OutcomeEvent[] =>
  outcomeEvents.filter((e) => e.daysAgo <= WINDOW_DAYS[w]);

// Plain-language period phrase (echoed in every section so the active timeframe is always
// obvious) + the resolved calendar range shown under the selector ("May 18 – Jun 17").
export const periodPhrase = (w: Window): string =>
  w === "7d" ? "in the last 7 days" : w === "30d" ? "in the last 30 days" : "since you installed GoCSM";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY_MS = 86_400_000;
const installDaysAgo = Math.max(...outcomeEvents.map((e) => e.daysAgo), 30);
const fmtDate = (d: Date, withYear = false) =>
  `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}${withYear ? `, ${d.getUTCFullYear()}` : ""}`;

export function windowDateLabel(w: Window): string {
  if (w === "lifetime") return `since ${fmtDate(new Date(TODAY.getTime() - installDaysAgo * DAY_MS), true)}`;
  return `${fmtDate(new Date(TODAY.getTime() - WINDOW_DAYS[w] * DAY_MS))} – ${fmtDate(TODAY)}`;
}

// ---------------------------------------------------------------------------
// Episodes — one playbook firing on one account. The resolving step carries the outcome and
// the $; the earlier cascade steps are $0 attempts. Effectiveness + impact are episode-level
// so each saved customer is counted exactly once.
// ---------------------------------------------------------------------------
export interface Episode {
  accountId: string;
  accountName: string;
  category: EventCategory;
  playbookId: string;
  playbookTitle: string;
  result: EventResult;
  value: number; // resolved $ (0 unless worked)
  potential: number; // what it's worth if it lands (for pending "in play")
  channels: string[]; // distinct channels touched, in order
  daysAgo: number; // when it resolved (the resolving step)
}

const RESOLVING_PRECEDENCE: EventResult[] = ["worked", "failed", "pending", "no_change"];

function episodesIn(w: Window): Episode[] {
  const map = new Map<string, OutcomeEvent[]>();
  for (const e of eventsInWindow(w)) {
    const k = e.accountId + "|" + e.category;
    const arr = map.get(k);
    if (arr) arr.push(e);
    else map.set(k, [e]);
  }
  const out: Episode[] = [];
  for (const [, steps] of map) {
    // the resolving step = the one carrying the episode's outcome (worked/failed/pending),
    // else the latest no_change. Value comes from the worked step.
    let resolver = steps[0];
    for (const s of steps) {
      if (RESOLVING_PRECEDENCE.indexOf(s.result) < RESOLVING_PRECEDENCE.indexOf(resolver.result)) resolver = s;
    }
    const worked = steps.find((s) => s.result === "worked");
    const tmpl = TEMPLATES[resolver.category];
    const acct = allAccounts().find((a) => a.identity.id === resolver.accountId);
    out.push({
      accountId: resolver.accountId,
      accountName: resolver.accountName,
      category: resolver.category,
      playbookId: resolver.playbookId,
      playbookTitle: resolver.playbookTitle,
      result: resolver.result,
      value: worked ? worked.amount : 0,
      potential: acct ? tmpl.value(acct.revenue.mrr) : 0,
      channels: Array.from(new Set(steps.map((s) => s.channel))),
      daysAgo: Math.min(...steps.map((s) => s.daysAgo)),
    });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Rung 2 — per-playbook effectiveness scorecard
// ---------------------------------------------------------------------------
export type ScorecardVerdict = "working" | "early" | "needs-look";
export interface PlaybookScore {
  category: EventCategory;
  playbookId: string;
  title: string;
  objective: string;
  goalVerb: string;
  icon: string;
  fired: number; // distinct accounts the playbook fired on
  worked: number;
  noChange: number;
  failed: number;
  pending: number;
  resolved: number; // worked + noChange + failed
  successRate: number; // worked / resolved (0 when nothing resolved)
  value: number; // $ delivered (worked only)
  verdict: ScorecardVerdict;
  verdictTone: "pos" | "neutral" | "warn" | "blue";
}

// Three states whose COLOR maps to meaning (green = good, grey = informational, amber =
// attention) — so an owner never has to decode why two similar bars read differently:
//   Working (green)      — proven: enough resolved fires AND a majority landed
//   Early days (grey)    — has a win but too few resolved to call yet (or only in-progress)
//   Needs a look (amber) — tried and mostly missing, or hasn't landed once
function verdictFor(s: { resolved: number; worked: number; pending: number; successRate: number }): {
  verdict: ScorecardVerdict;
  verdictTone: PlaybookScore["verdictTone"];
} {
  if (s.worked === 0 && s.resolved >= 1) return { verdict: "needs-look", verdictTone: "warn" }; // tried, no wins
  if (s.resolved >= 3) return s.successRate >= 0.5 ? { verdict: "working", verdictTone: "pos" } : { verdict: "needs-look", verdictTone: "warn" };
  return { verdict: "early", verdictTone: "neutral" }; // small sample (a win, or only in-progress)
}

export const VERDICT_LABEL: Record<ScorecardVerdict, string> = {
  working: "Working",
  early: "Early days",
  "needs-look": "Needs a look",
};

// Plain-English meaning shown on hover so the badge never needs a separate legend.
export const VERDICT_HINT: Record<ScorecardVerdict, string> = {
  working: "Proven — enough customers have run through it and most landed.",
  early: "Working so far, but too few have finished to call it yet.",
  "needs-look": "It's mostly missing — worth a look at the wording or timing.",
};

/** One row per activated playbook, sorted by $ delivered (best earner first). */
export function playbookScorecard(w: Window): PlaybookScore[] {
  const eps = episodesIn(w);
  const rows: PlaybookScore[] = PLAYBOOK_ORDER.map((cat) => {
    const meta = CATEGORY_META[cat];
    const tmpl = TEMPLATES[cat];
    const mine = eps.filter((e) => e.category === cat);
    const worked = mine.filter((e) => e.result === "worked").length;
    const noChange = mine.filter((e) => e.result === "no_change").length;
    const failed = mine.filter((e) => e.result === "failed").length;
    const pending = mine.filter((e) => e.result === "pending").length;
    const resolved = worked + noChange + failed;
    const successRate = resolved ? worked / resolved : 0;
    const value = mine.reduce((s, e) => s + e.value, 0);
    const v = verdictFor({ resolved, worked, pending, successRate });
    return {
      category: cat,
      playbookId: tmpl.playbookId,
      title: tmpl.playbookTitle,
      objective: meta.objective,
      goalVerb: meta.goalVerb,
      icon: meta.icon,
      fired: mine.length,
      worked,
      noChange,
      failed,
      pending,
      resolved,
      successRate,
      value,
      ...v,
    };
  }).filter((r) => r.fired > 0);
  return rows.sort((a, b) => b.value - a.value || b.fired - a.fired);
}

// ---------------------------------------------------------------------------
// Rung 1 — overall impact / ROI
// ---------------------------------------------------------------------------
// GoCSM's monthly plan price (production reads the agency's real plan). Used only to phrase
// the ROI multiple honestly — value delivered ÷ what GoCSM cost over the same window.
export const GOCSM_MONTHLY_COST = 530;
const INSTALL_MONTHS = Math.max(1, Math.ceil(Math.max(...outcomeEvents.map((e) => e.daysAgo), 30) / 30));

export interface MechanismStat {
  category: EventCategory;
  title: string; // the playbook name (same label the scorecard uses)
  icon: string;
  hard: boolean; // true = exact recovered/saved dollars; false = estimated, partial-credit
  count: number; // distinct customers
  value: number;
}
export interface ImpactSummary {
  window: Window;
  totalValue: number; // each customer counted once
  customersKept: number;
  actionsRun: number;
  autopilotCount: number;
  autopilotShare: number; // 0..1
  stillInPlayValue: number;
  stillInPlayCount: number;
  byMechanism: MechanismStat[];
  gocsmCost: number;
  roiMultiple: number; // totalValue / gocsmCost over this window
  installMonths: number;
  asOf: string;
}

const WINDOW_PHRASE: Record<Window, string> = {
  "7d": "the last 7 days",
  "30d": "the last 30 days",
  lifetime: "since you installed GoCSM",
};

function gocsmCostFor(w: Window): number {
  return w === "lifetime" ? GOCSM_MONTHLY_COST * INSTALL_MONTHS : Math.round(GOCSM_MONTHLY_COST * (WINDOW_DAYS[w] / 30));
}

export function impactSummary(w: Window): ImpactSummary {
  const eps = episodesIn(w);
  const evs = eventsInWindow(w);
  const worked = eps.filter((e) => e.result === "worked");
  const pending = eps.filter((e) => e.result === "pending");

  // payment & renewal are exact recovered/saved dollars; win-back/usage/expansion are
  // estimated at a share of the customer's monthly revenue (partial credit).
  const HARD: Record<EventCategory, boolean> = { payment: true, renewal: true, winback: false, adoption: false, expansion: false };
  const byMechanism: MechanismStat[] = PLAYBOOK_ORDER.map((cat) => {
    const meta = CATEGORY_META[cat];
    const w2 = worked.filter((e) => e.category === cat);
    return { category: cat, title: TEMPLATES[cat].playbookTitle, icon: meta.icon, hard: HARD[cat], count: w2.length, value: w2.reduce((s, e) => s + e.value, 0) };
  })
    .filter((m) => m.value > 0 || m.count > 0)
    .sort((a, b) => b.value - a.value);

  const totalValue = worked.reduce((s, e) => s + e.value, 0);
  const autopilotCount = evs.filter((e) => e.attribution === "autopilot").length;
  const gocsmCost = gocsmCostFor(w);

  return {
    window: w,
    totalValue,
    customersKept: new Set(worked.map((e) => e.accountId)).size,
    actionsRun: evs.length,
    autopilotCount,
    autopilotShare: evs.length ? autopilotCount / evs.length : 0,
    stillInPlayValue: pending.reduce((s, e) => s + e.potential, 0),
    stillInPlayCount: pending.length,
    byMechanism,
    gocsmCost,
    roiMultiple: gocsmCost ? totalValue / gocsmCost : 0,
    installMonths: INSTALL_MONTHS,
    asOf: `Covers ${WINDOW_PHRASE[w]} · as of today`,
  };
}

// The one AI verdict sentence (Rung 1). DETERMINISTIC: every figure is computed above; the
// wording is a template around those exact numbers. AI never touches the arithmetic.
export interface ImpactVerdict {
  tone: "pos" | "watch";
  line: string;
  roiMultiple: number;
  light: boolean;
  stamp: string;
}
const fmt$ = (n: number) => "$" + Math.round(n).toLocaleString();
const roiText = (x: number) => (x >= 10 ? `${Math.round(x)}×` : `${x.toFixed(1)}×`);

export function impactVerdict(w: Window): ImpactVerdict {
  const s = impactSummary(w);
  // Only "light" when essentially nothing was kept — so a window that DID keep money (e.g. a
  // quiet 7-day week with one $1,600 save) still shows its dollar figure, never a blank.
  const light = s.totalValue < 300;
  const phrase = WINDOW_PHRASE[w];

  // The visible context sentence — carries the customer/action/autopilot context but NOT the
  // big dollar figure (that renders once, as the hero number) so nothing is restated.
  let line: string;
  if (light) {
    line = `Quieter stretch — GoCSM ran ${s.actionsRun} action${s.actionsRun === 1 ? "" : "s"} in ${phrase}; nothing on fire.`;
  } else {
    line = `That's ${s.customersKept} customer${s.customersKept === 1 ? "" : "s"} kept across ${s.actionsRun} action${
      s.actionsRun === 1 ? "" : "s"
    } — GoCSM sent ${s.autopilotCount} of them automatically.`;
  }
  return {
    tone: light ? "watch" : "pos",
    line,
    roiMultiple: s.roiMultiple,
    light,
    stamp: "Calculated from your data · wording is AI",
  };
}

// The one AI lead line for the effectiveness section (Rung 2) — names the top earner.
// Numbers computed above; wording templated. Returns null when no playbook has fired.
export function effectivenessLead(w: Window): { line: string; stamp: string } | null {
  const sc = playbookScorecard(w);
  if (!sc.length) return null;
  const top = sc[0];
  const verb = CATEGORY_META[top.category].goalVerb;
  const line =
    top.worked > 0
      ? `${top.title} is your top earner — ${top.worked} ${top.worked === 1 ? "customer" : "customers"} ${verb}, keeping ${fmt$(top.value)}.`
      : `${top.title} has run on ${top.fired} ${top.fired === 1 ? "customer" : "customers"} — still waiting on its first win.`;
  return { line, stamp: "Calculated from your data · wording is AI" };
}

// ---------------------------------------------------------------------------
// Rung 3 — by-channel breakdown
// ---------------------------------------------------------------------------
export interface ChannelStat {
  channel: string;
  label: string;
  icon: string;
  sent: number; // total actions on this channel
  worked: number; // resolving actions that worked
  value: number;
  accounts: number;
}
export function channelBreakdown(w: Window): ChannelStat[] {
  const evs = eventsInWindow(w);
  const map = new Map<string, OutcomeEvent[]>();
  for (const e of evs) {
    const arr = map.get(e.channel);
    if (arr) arr.push(e);
    else map.set(e.channel, [e]);
  }
  return Array.from(map.entries())
    .map(([channel, items]) => {
      const meta = CHANNEL_META[channel] ?? { label: channel, icon: "circle" };
      return {
        channel,
        label: meta.label,
        icon: meta.icon,
        sent: items.length,
        worked: items.filter((e) => e.result === "worked").length,
        value: items.reduce((s, e) => s + e.amount, 0),
        accounts: new Set(items.map((e) => e.accountId)).size,
      };
    })
    .sort((a, b) => b.sent - a.sent);
}

// ---------------------------------------------------------------------------
// Legacy report-card aggregation (kept for the test + any back-compat)
// ---------------------------------------------------------------------------
export interface CategoryStat {
  category: EventCategory;
  count: number;
  value: number;
}
export interface ReportCard {
  totalValue: number;
  accountsHelped: number;
  actionsRun: number;
  byCategory: CategoryStat[];
}
function aggregate(evs: OutcomeEvent[]): ReportCard {
  const worked = evs.filter((e) => e.result === "worked");
  const byCategory = PLAYBOOK_ORDER.map((c) => {
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

// ---------------------------------------------------------------------------
// Filtering (for the audit log)
// ---------------------------------------------------------------------------
export interface EventFilter {
  window: Window;
  accountId?: string;
  category?: EventCategory;
  action?: ActionKind;
  channel?: string;
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
      (!f.channel || e.channel === f.channel) &&
      (!f.result || e.result === f.result) &&
      (!q || e.accountName.toLowerCase().includes(q) || e.summary.toLowerCase().includes(q) || e.playbookTitle.toLowerCase().includes(q)),
  );
}

/** Distinct accounts that appear in the log (for the customer filter). */
export const loggedAccounts = (): { id: string; name: string }[] => {
  const seen = new Map<string, string>();
  outcomeEvents.forEach((e) => seen.set(e.accountId, e.accountName));
  return Array.from(seen, ([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
};

/** Distinct channels that appear in the log (for the channel filter). */
export const loggedChannels = (): string[] => {
  const seen = new Set<string>();
  outcomeEvents.forEach((e) => seen.add(e.channel));
  return Array.from(seen).sort((a, b) => a.localeCompare(b));
};
