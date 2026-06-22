// Playbooks fixture — seed catalog grounded in the Signal model.
// matchesToday() derives live counts from the unified accounts/signals fixtures.
// Marked seed-pending-snapshot: production catalog absorbs additional plays
// from the 10+ workflow snapshot once provided; surface is unchanged.

import {
  accounts,
  signals,
  daysSince,
  daysUntil,
  failedPayments,
  stalledOnboarding,
  lostStickySetups,
  type Account,
  type SignalSubject,
} from "./index";

export type PlaybookState = "off" | "ranonce" | "on" | "paused";
export type PlaybookKind = "save" | "retention" | "adoption" | "billing" | "onboarding" | "expansion";

// Marketplace outcome taxonomy — 7 plain-language buckets the owner thinks in
// (collapsed from the doc's 8 system categories). Used as a filter, not the front door.
export type PlaybookCategory =
  | "winback" | "reengage" | "adoption" | "revenue" | "onboard" | "grow" | "listen";
export type PlaybookEffort = "ready" | "quick" | "custom";

export const CATEGORIES: { id: PlaybookCategory; label: string; icon: string }[] = [
  { id: "winback", label: "Win back at-risk", icon: "shield" },
  { id: "reengage", label: "Re-engage quiet", icon: "log-in" },
  { id: "adoption", label: "Drive adoption", icon: "trending-up" },
  { id: "revenue", label: "Rescue revenue", icon: "credit-card" },
  { id: "onboard", label: "Onboard faster", icon: "rocket" },
  { id: "grow", label: "Grow & upsell", icon: "sparkles" },
  { id: "listen", label: "Listen & celebrate", icon: "heart" },
];
export const EFFORT_LABEL: Record<PlaybookEffort, string> = {
  ready: "Ready to go",
  quick: "Quick setup",
  custom: "Add your wording",
};

/** One reviewable action inside a playbook. Pre-written; edited in HighLevel. */
export type PlaybookActionType = "customer-email" | "internal-email" | "slack" | "task";
export interface PlaybookAction {
  type: PlaybookActionType;
  /** Subject line for emails (omit for Slack / task). */
  subject?: string;
  /** One-line peek shown collapsed — the first line of the message / the task title. */
  preview: string;
  /** Optional fuller draft revealed on expand. */
  body?: string;
}

export interface Playbook {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  state: PlaybookState;
  kind: PlaybookKind;
  /** One-sentence Situation (the named problem). */
  problem: string;
  /** A few pre-written moves, plain language. */
  does: string;
  /** The outcome it's trying to produce. */
  outcome: string;
  /** The pre-written actions the play runs — reviewable before handoff, edited in HighLevel. */
  actions: PlaybookAction[];
  /** Marketplace outcome category (the 7-bucket plain-language taxonomy). */
  category: PlaybookCategory;
  /** Marketplace signals (prototype seed data — labeled as such in the UI). */
  usedByAgencies: number;   // popularity: how many agencies run it
  totalRuns: number;        // total runs across all customers
  launchedDaysAgo: number;  // freshness; < 14 ⇒ "New this week"
  trending: boolean;        // fastest-growing this week
  effort: PlaybookEffort;   // readiness vocabulary
  /** Pure predicate against the unified fixtures. */
  match: (a: Account) => boolean;
  /** Short explainer video for this play (~1 min). Empty string until a real
   *  recording lands — the UI shows a "coming soon" placeholder, never a stand-in clip. */
  videoUrl: string;
  /** Optional poster image shown before the video plays. */
  videoPoster?: string;
}

// No real per-play recordings yet — empty means "show a tasteful coming-soon
// placeholder," never a generic stand-in clip. Fill PLAY_VIDEOS per play as
// real walkthroughs are produced.
const PLACEHOLDER_VIDEO = "";

const STICKY_REVERSE_DAYS = 30;
const stickyReverseSubjects = (a: Account, subjects: SignalSubject[]): boolean =>
  signals.some(
    (s) =>
      s.accountId === a.identity.id &&
      s.sticky &&
      s.direction === "reverse" &&
      s.type === "setup" &&
      subjects.includes(s.subject) &&
      daysSince(s.detectedAt) <= STICKY_REVERSE_DAYS,
  );

const usageReverse = (a: Account, subjects: SignalSubject[], windowDays = 60): boolean =>
  signals.some(
    (s) =>
      s.accountId === a.identity.id &&
      s.type === "usage" &&
      s.direction === "reverse" &&
      subjects.includes(s.subject) &&
      daysSince(s.detectedAt) <= windowDays,
  );

// Per-play video assignments. All point to the placeholder for now;
// production swaps these for the real recordings keyed by play id.
const PLAY_VIDEOS: Record<string, string> = {
  "pb-no-login": PLACEHOLDER_VIDEO,
  "pb-renewal-save": PLACEHOLDER_VIDEO,
  "pb-payment-failed": PLACEHOLDER_VIDEO,
  "pb-plan-downgrade": PLACEHOLDER_VIDEO,
  "pb-feature-drop": PLACEHOLDER_VIDEO,
  "pb-onboarding-stalled": PLACEHOLDER_VIDEO,
  "pb-save-domain": PLACEHOLDER_VIDEO,
  "pb-save-integration": PLACEHOLDER_VIDEO,
  "pb-save-a2p": PLACEHOLDER_VIDEO,
  "pb-expansion-ready": PLACEHOLDER_VIDEO,
};

// Pre-written actions per play (the messages GoCSM sends). Plain language, no
// jargon, no emoji. Reviewable in the journey; edited in HighLevel. {{name}} /
// {{account}} are filled per account at send time.
const PLAY_ACTIONS: Record<string, PlaybookAction[]> = {
  "pb-no-login": [
    { type: "slack", preview: "{{account}} hasn't logged in for a few weeks — worth a nudge." },
    { type: "internal-email", subject: "Check in: {{account}} has gone quiet", preview: "They haven't logged in lately. A quick personal note usually brings them back." },
    { type: "customer-email", subject: "We miss you at {{account}}", preview: "Hi {{name}}, noticed you haven't been in lately — here's what's new and how to get value fast.", body: "Hi {{name}}, noticed you haven't been in lately. Here's what's new since your last visit, plus the two-minute path to value. Want a hand getting back in? Just reply." },
  ],
  "pb-renewal-save": [
    { type: "slack", preview: "{{account}} renews soon and is showing risk — worth a check-in." },
    { type: "internal-email", subject: "Renewal at risk: {{account}}", preview: "Renews soon with warning signs. Reach out before it lapses." },
    { type: "customer-email", subject: "A quick check-in before your renewal", preview: "Hi {{name}}, you're coming up for renewal — here's a recap of the value you've gotten.", body: "Hi {{name}}, you're coming up for renewal. Here's a quick recap of what you've gotten this year, and what's ahead. Anything you'd like to talk through before then?" },
  ],
  "pb-payment-failed": [
    { type: "customer-email", subject: "Your last payment didn't go through", preview: "Hi {{name}}, your recent payment failed — update your card to avoid any interruption.", body: "Hi {{name}}, your recent payment didn't go through. Update your card in a minute to keep everything running — here's the secure link." },
    { type: "internal-email", subject: "Payment failed: {{account}}", preview: "A payment failed and reminders are going out. Flagging in case you want to reach out." },
    { type: "slack", preview: "Payment failed for {{account}} — reminders started." },
  ],
  "pb-plan-downgrade": [
    { type: "internal-email", subject: "Downgrade: {{account}}", preview: "They just stepped down a plan. Worth a value-check call." },
    { type: "customer-email", subject: "Let's make sure you're getting the most", preview: "Hi {{name}}, saw you changed your plan — here are three things you may not be using yet.", body: "Hi {{name}}, saw your plan changed. Before anything else, here are three things in your plan you may not be using yet — each takes a minute and adds real value." },
    { type: "task", preview: "Book a value-check call with {{account}}." },
  ],
  "pb-feature-drop": [
    { type: "customer-email", subject: "A faster way to get more done", preview: "Hi {{name}}, here's a two-minute way to get more out of the feature you've used less lately.", body: "Hi {{name}}, noticed a feature you rely on has been quiet. Here's a two-minute refresher to get more out of it — reply if you'd like a hand." },
    { type: "internal-email", subject: "Usage dropping: {{account}}", preview: "Key feature usage fell this month. Heads up if there's no reply in a week." },
  ],
  "pb-onboarding-stalled": [
    { type: "customer-email", subject: "Stuck on setup? We'll do it with you", preview: "Hi {{name}}, looks like setup paused — grab 10 minutes and we'll finish it together.", body: "Hi {{name}}, looks like setup paused on the same step. Grab 10 minutes and we'll finish it together — pick a time that works here." },
    { type: "internal-email", subject: "Onboarding stalled: {{account}}", preview: "Stuck on the same step too long. Nudge sent; offer to do it with them." },
    { type: "task", preview: "Book a 10-minute setup call with {{account}}." },
  ],
  "pb-save-domain": [
    { type: "internal-email", subject: "Website disconnected: {{account}}", preview: "Strong leaving signal. Offer a hands-on reconnect now." },
    { type: "customer-email", subject: "Your website got disconnected — we can help", preview: "Hi {{name}}, your site is no longer connected. Want us to reconnect it with you?", body: "Hi {{name}}, your website is no longer connected. That's usually a quick fix — want us to reconnect it with you on a short call?" },
    { type: "slack", preview: "{{account}} disconnected their website — likely leaving. Pausing other messages." },
  ],
  "pb-save-integration": [
    { type: "internal-email", subject: "Key setup removed: {{account}}", preview: "A page or automation was removed. Find the cause and offer to re-set-up." },
    { type: "customer-email", subject: "Noticed a key setup came down", preview: "Hi {{name}}, an important setup was removed — happy to help restore it.", body: "Hi {{name}}, noticed an important setup was removed. If that wasn't intentional, we're happy to help restore it — just reply." },
  ],
  "pb-save-a2p": [
    { type: "customer-email", subject: "Your texting registration lapsed", preview: "Hi {{name}}, your phone-texting registration expired — let's re-register so texts keep sending.", body: "Hi {{name}}, your phone-texting registration expired, so texts will stop until it's renewed. It's a quick re-registration — we'll walk you through it." },
    { type: "internal-email", subject: "Texting registration lost: {{account}}", preview: "Registration lapsed; texts about to stop. Help them re-register." },
    { type: "slack", preview: "{{account}} lost texting registration — texts paused until fixed." },
  ],
  "pb-expansion-ready": [
    { type: "customer-email", subject: "You're getting great results — here's what's next", preview: "Hi {{name}}, you're thriving — here are a couple ways to get even more, plus a quick planning call.", body: "Hi {{name}}, you're getting great results. Here are a couple of ways to get even more out of it — and if you're open to it, a short planning call to map what's next." },
    { type: "internal-email", subject: "Expansion ready: {{account}}", preview: "Healthy and trending up. Good upsell and testimonial candidate." },
    { type: "task", preview: "Reach out about expansion, or ask for a testimonial." },
  ],
  "pb-quiet-renewal": [
    { type: "slack", preview: "{{account}} is quiet and renews soon — worth a personal check-in." },
    { type: "customer-email", subject: "Checking in before your renewal", preview: "Hi {{name}}, you've been quiet lately and your renewal's coming up — here's a quick recap and a hand if you want it." },
  ],
  "pb-low-adoption": [
    { type: "customer-email", subject: "A 2-minute setup that pays off", preview: "Hi {{name}}, there's a feature in your plan you haven't switched on yet — here's the two-minute setup." },
    { type: "internal-email", subject: "Low adoption: {{account}}", preview: "Core features never set up. Nudge sent; offer to do it with them if no movement." },
  ],
  "pb-nps-detractor": [
    { type: "internal-email", subject: "Unhappy feedback: {{account}}", preview: "Left negative feedback. Call personally before anything automated goes out." },
    { type: "customer-email", subject: "I'd like to make this right", preview: "Hi {{name}}, thank you for the honest feedback — I'd like to make this right. Can we talk this week?" },
  ],
  "pb-nps-promoter": [
    { type: "customer-email", subject: "Mind sharing a quick review?", preview: "Hi {{name}}, so glad it's working well — would you share a quick review? It genuinely helps." },
  ],
  "pb-milestone": [
    { type: "customer-email", subject: "Congrats on the milestone!", preview: "Hi {{name}}, just wanted to say congrats — you hit a real milestone. Here's to the next one." },
  ],
  "pb-upsell-limit": [
    { type: "internal-email", subject: "Near plan limit: {{account}}", preview: "Bumping the ceiling of their plan. Good moment for a value-led upgrade offer." },
    { type: "customer-email", subject: "You're outgrowing your plan — in a good way", preview: "Hi {{name}}, you're hitting the limits of your current plan. Here's what the next tier unlocks." },
  ],
};

type PlaybookSeed = Omit<
  Playbook,
  "videoUrl" | "actions" | "category" | "usedByAgencies" | "totalRuns" | "launchedDaysAgo" | "trending" | "effort"
>;

// Marketplace metadata, merged into the catalog below. Prototype seed numbers —
// the UI labels them as community/aggregate signals, never invents precision.
const PLAY_META: Record<
  string,
  { category: PlaybookCategory; usedByAgencies: number; totalRuns: number; launchedDaysAgo: number; trending?: boolean; effort?: PlaybookEffort }
> = {
  "pb-no-login":           { category: "reengage", usedByAgencies: 2400, totalRuns: 51200, launchedDaysAgo: 210, effort: "ready" },
  "pb-renewal-save":       { category: "winback",  usedByAgencies: 1980, totalRuns: 38400, launchedDaysAgo: 180, trending: true, effort: "ready" },
  "pb-payment-failed":     { category: "revenue",  usedByAgencies: 3100, totalRuns: 72500, launchedDaysAgo: 240, effort: "ready" },
  "pb-plan-downgrade":     { category: "winback",  usedByAgencies: 860,  totalRuns: 12300, launchedDaysAgo: 95,  effort: "quick" },
  "pb-feature-drop":       { category: "adoption", usedByAgencies: 1450, totalRuns: 26800, launchedDaysAgo: 130, effort: "ready" },
  "pb-onboarding-stalled": { category: "onboard",  usedByAgencies: 2100, totalRuns: 44100, launchedDaysAgo: 160, effort: "ready" },
  "pb-save-domain":        { category: "winback",  usedByAgencies: 540,  totalRuns: 6900,  launchedDaysAgo: 70,  effort: "ready" },
  "pb-save-integration":   { category: "winback",  usedByAgencies: 470,  totalRuns: 5400,  launchedDaysAgo: 64,  effort: "ready" },
  "pb-save-a2p":           { category: "winback",  usedByAgencies: 390,  totalRuns: 4200,  launchedDaysAgo: 58,  effort: "quick" },
  "pb-expansion-ready":    { category: "grow",     usedByAgencies: 1230, totalRuns: 19800, launchedDaysAgo: 110, trending: true, effort: "ready" },
  "pb-quiet-renewal":      { category: "winback",  usedByAgencies: 320,  totalRuns: 2100,  launchedDaysAgo: 5,   trending: true, effort: "ready" },
  "pb-low-adoption":       { category: "adoption", usedByAgencies: 410,  totalRuns: 3300,  launchedDaysAgo: 9,   effort: "quick" },
  "pb-nps-detractor":      { category: "listen",   usedByAgencies: 760,  totalRuns: 9100,  launchedDaysAgo: 30,  effort: "ready" },
  "pb-nps-promoter":       { category: "listen",   usedByAgencies: 1120, totalRuns: 15600, launchedDaysAgo: 12,  trending: true, effort: "ready" },
  "pb-milestone":          { category: "listen",   usedByAgencies: 280,  totalRuns: 1800,  launchedDaysAgo: 3,   effort: "ready" },
  "pb-upsell-limit":       { category: "grow",     usedByAgencies: 690,  totalRuns: 7400,  launchedDaysAgo: 18,  effort: "quick" },
};

const playbookSeeds: PlaybookSeed[] = [
  // ----- Retention / lifecycle -----
  {
    id: "pb-no-login",
    title: "No recent login",
    subtitle: "Win back owners who've gone quiet",
    icon: "log-in",
    state: "on",
    kind: "retention",
    problem: "The owner hasn't logged in for 21+ days.",
    does: "Alerts your team, sends a warm check-in email, and sets a follow-up call.",
    outcome: "Bring them back into the workspace before the relationship drifts.",
    match: (a) =>
      a.status.enabled === "Enabled" &&
      a.lifecycle.stage !== "onboarding" &&
      a.lifecycle.stage !== "churned" &&
      a.login.lastLoginDaysAgo >= 21,
  },
  {
    id: "pb-renewal-save",
    title: "Renewing soon & at risk",
    subtitle: "Protect the renewal before it lapses",
    icon: "calendar-clock",
    state: "off",
    kind: "retention",
    problem: "Renews within 30 days and showing warning signs.",
    does: "Alerts your team, sends a renewal check-in, and shares a quick value recap before renewal.",
    outcome: "Lock in the renewal before it slips.",
    match: (a) => {
      const d = daysUntil(a.revenue.renewalDate);
      return d >= 0 && d <= 30 && (a.health.band === "atrisk" || a.health.band === "watch");
    },
  },
  {
    id: "pb-payment-failed",
    title: "Payment failed",
    subtitle: "Recover the invoice before churn",
    icon: "credit-card",
    state: "on",
    kind: "billing",
    problem: "A recent payment failed or the card was declined.",
    does: "Sends payment reminders, flags the account for you, and pauses other messages.",
    outcome: "Recover the invoice and keep the account live.",
    match: (a) => failedPayments().some((x) => x.identity.id === a.identity.id),
  },
  {
    id: "pb-plan-downgrade",
    title: "Plan downgrade",
    subtitle: "Save the relationship after a step-down",
    icon: "arrow-down-circle",
    state: "ranonce",
    kind: "retention",
    problem: "The account just downgraded or dropped a paid add-on.",
    does: "Books a value-check call and shows three features they aren't using yet.",
    outcome: "Stop the slide before it becomes a full cancel.",
    match: (a) =>
      a.revenue.planChanges.some(
        (p) => (p.type === "downgrade" || p.type === "churn") && daysSince(p.date) <= 60,
      ),
  },
  {
    id: "pb-feature-drop",
    title: "Usage dropping",
    subtitle: "Catch quiet drop-off early",
    icon: "trending-down",
    state: "on",
    kind: "adoption",
    problem: "A key feature's usage fell 30%+ this month.",
    does: "Nudges the owner with a short how-to, and tells your team if there's no reply in 7 days.",
    outcome: "Re-anchor adoption before the habit breaks.",
    match: (a) => usageReverse(a, ["Workflow"], 30) || a.adoption.underutilizedFeatures.length > 0,
  },
  {
    id: "pb-onboarding-stalled",
    title: "Onboarding stalled",
    subtitle: "Move setup forward when it gets stuck",
    icon: "alert-triangle",
    state: "on",
    kind: "onboarding",
    problem: "The account has been stuck on the same setup step too long.",
    does: "Nudges whoever's stuck, books a 10-minute call, and offers to do it with them.",
    outcome: "Get to first value before momentum dies.",
    match: (a) => stalledOnboarding().some((x) => x.identity.id === a.identity.id),
  },

  // ----- Save plays (sticky-setup reverse, weighted heavy) -----
  {
    id: "pb-save-domain",
    title: "Website disconnected — win them back",
    subtitle: "Win-back · key setup lost",
    icon: "globe",
    state: "on",
    kind: "save",
    problem: "Their website is no longer connected — a strong sign they're leaving.",
    does: "Alerts you, offers a hands-on reconnect, and pauses messages until it's fixed.",
    outcome: "Reconnect their website and confirm they're staying.",
    match: (a) => stickyReverseSubjects(a, ["Domain"]),
  },
  {
    id: "pb-save-integration",
    title: "Key integration removed",
    subtitle: "Win-back · key setup lost",
    icon: "plug",
    state: "ranonce",
    kind: "save",
    problem: "A page, automation, or other key setup was removed.",
    does: "Alerts you, finds the cause, and gives your team a re-setup playbook.",
    outcome: "Restore the integration before they fully migrate away.",
    match: (a) => stickyReverseSubjects(a, ["Funnel", "Workflow"]),
  },
  {
    id: "pb-save-a2p",
    title: "Texting registration lost — win them back",
    subtitle: "Win-back · key setup lost",
    icon: "message-square-x",
    state: "off",
    kind: "save",
    problem: "Their phone-texting registration lapsed — texts are about to stop.",
    does: "Alerts you, helps them re-register, and pauses texts until it's fixed.",
    outcome: "Get texting approved again and keep the account active.",
    match: (a) => stickyReverseSubjects(a, ["A2P", "Phone"]),
  },

  // ----- Expansion (positive direction) -----
  {
    id: "pb-expansion-ready",
    title: "Expansion ready",
    subtitle: "Doing great — time to grow",
    icon: "sparkles",
    state: "off",
    kind: "expansion",
    problem: "Doing great, healthy, and trending up.",
    does: "Shows what to upsell, offers a planning call, and asks for a testimonial.",
    outcome: "Turn momentum into expansion revenue or advocacy.",
    match: (a) =>
      a.status.enabled === "Enabled" &&
      a.lifecycle.stage === "established" &&
      a.health.band === "thriving",
  },

  // ----- Newer marketplace additions (populate categories + curated rows) -----
  {
    id: "pb-quiet-renewal",
    title: "Quiet account, renewal close",
    subtitle: "Reach quiet owners before they lapse",
    icon: "calendar-clock",
    state: "off",
    kind: "retention",
    problem: "Hasn't logged in lately and renews within 45 days.",
    does: "Alerts your team and sends a warm, value-led check-in ahead of renewal.",
    outcome: "Re-open the relationship before the renewal decision.",
    match: (a) =>
      a.status.enabled === "Enabled" &&
      a.login.lastLoginDaysAgo >= 14 &&
      (() => {
        const d = daysUntil(a.revenue.renewalDate);
        return d >= 0 && d <= 45;
      })(),
  },
  {
    id: "pb-low-adoption",
    title: "Key feature never set up",
    subtitle: "Turn shelfware into habit",
    icon: "trending-up",
    state: "off",
    kind: "adoption",
    problem: "Paying, but two or more core features were never switched on.",
    does: "Sends a two-minute setup nudge and offers a hand if there's no movement.",
    outcome: "Get the value they're paying for switched on.",
    match: (a) => a.adoption.underutilizedFeatures.length >= 2,
  },
  {
    id: "pb-nps-detractor",
    title: "Unhappy feedback — make it right",
    subtitle: "Catch a detractor before they leave",
    icon: "frown",
    state: "off",
    kind: "retention",
    problem: "Left low or negative feedback recently.",
    does: "Alerts you to call personally and drafts a make-it-right note for your OK.",
    outcome: "Turn a bad moment into a saved relationship.",
    match: () => false,
  },
  {
    id: "pb-nps-promoter",
    title: "Happy customer — ask for a review",
    subtitle: "Turn a fan into proof",
    icon: "star",
    state: "off",
    kind: "expansion",
    problem: "Healthy, established, and clearly happy.",
    does: "Sends a friendly review/testimonial ask once they're past a good moment.",
    outcome: "Turn momentum into social proof.",
    match: (a) =>
      a.status.enabled === "Enabled" &&
      a.lifecycle.stage === "established" &&
      a.health.band === "thriving",
  },
  {
    id: "pb-milestone",
    title: "Celebrate a milestone",
    subtitle: "Mark the wins that build loyalty",
    icon: "award",
    state: "off",
    kind: "expansion",
    problem: "Hit a meaningful milestone (anniversary, usage high, first result).",
    does: "Sends a warm, on-brand congrats — no ask attached.",
    outcome: "Deepen loyalty by noticing the good moments.",
    match: () => false,
  },
  {
    id: "pb-upsell-limit",
    title: "Hitting plan limits",
    subtitle: "Offer the upgrade at the right moment",
    icon: "arrow-up-circle",
    state: "off",
    kind: "expansion",
    problem: "Bumping against the ceiling of their current plan.",
    does: "Flags the moment and offers a frictionless upgrade with the value spelled out.",
    outcome: "Expand revenue exactly when the need is real.",
    match: () => false,
  },
];

const DEFAULT_META = {
  category: "winback" as PlaybookCategory,
  usedByAgencies: 0,
  totalRuns: 0,
  launchedDaysAgo: 999,
  trending: false,
  effort: "ready" as PlaybookEffort,
};

export const playbooks: Playbook[] = playbookSeeds.map((p) => {
  const m = PLAY_META[p.id] ?? DEFAULT_META;
  return {
    ...p,
    category: m.category,
    usedByAgencies: m.usedByAgencies,
    totalRuns: m.totalRuns,
    launchedDaysAgo: m.launchedDaysAgo,
    trending: m.trending ?? false,
    effort: m.effort ?? "ready",
    videoUrl: PLAY_VIDEOS[p.id] ?? PLACEHOLDER_VIDEO,
    actions: PLAY_ACTIONS[p.id] ?? [],
  };
});

// ----- Selectors -----

export const matchesToday = (p: Playbook): Account[] =>
  accounts.filter((a) => a.status.enabled === "Enabled" && p.match(a));

export const matchCount = (p: Playbook): number => matchesToday(p).length;

export const playbookById = (id: string): Playbook | undefined =>
  playbooks.find((p) => p.id === id);

/** Live impact for a playbook: matching accounts today + their MRR (the "$ it can
 *  address if enabled" the marketplace surfaces). */
export const playbookImpact = (p: Playbook): { count: number; mrr: number } => {
  const accts = matchesToday(p);
  return { count: accts.length, mrr: accts.reduce((s, a) => s + (a.revenue?.mrr ?? 0), 0) };
};

export const categoryLabel = (c: PlaybookCategory): string =>
  CATEGORIES.find((x) => x.id === c)?.label ?? c;

export const NEW_WINDOW_DAYS = 14;
export const isNewPlaybook = (p: Playbook): boolean => p.launchedDaysAgo <= NEW_WINDOW_DAYS;
