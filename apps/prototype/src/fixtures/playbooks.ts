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

// Churn↔expansion rating — how the account is doing the moment a play fires, from
// `critical` (about to lose them) to `verypositive` (booming — grow the relationship).
// NB: this is the play's severity BAND, distinct from the detected `signals` events
// imported above. DISPLAY LABELS are deliberately plain words that do NOT reuse the
// coined, gated account-Health bands (Thriving/Healthy/Watch/At-Risk) — those must
// never leak onto this Phase-1 marketplace surface. The internal value strings stay
// fixed to avoid churn; only the labels are the customer-facing vocabulary.
// Ordered worst→best for filter rails.
export type PlaybookSignal = "critical" | "atrisk" | "watch" | "positive" | "verypositive";
export const SIGNALS: { id: PlaybookSignal; label: string }[] = [
  { id: "critical", label: "Critical" },
  { id: "atrisk", label: "Slipping" },
  { id: "watch", label: "Steady" },
  { id: "positive", label: "Strong" },
  { id: "verypositive", label: "Booming" },
];
export const SIGNAL_LABEL: Record<PlaybookSignal, string> = {
  critical: "Critical",
  atrisk: "Slipping",
  watch: "Steady",
  positive: "Strong",
  verypositive: "Booming",
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
  /** Churn↔expansion rating: how critical the moment is (critical → verypositive). */
  signal: PlaybookSignal;
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

// ---- shared predicates for the v1 library matches (read-only over the Account model) ----
const notOnboardingLive = (a: Account): boolean =>
  a.status.enabled === "Enabled" &&
  a.lifecycle.stage !== "onboarding" &&
  a.lifecycle.stage !== "churned";

const hasFeature = (a: Account, name: string): boolean =>
  a.adoption.features.some((f) => f.name === name && f.engagement > 0);

const lifetimeSpendOf = (a: Account): number =>
  Math.round(a.revenue.mrr * Math.max(1, a.identity.activeDays / 30));

const recentPlanChange = (a: Account, type: string, withinDays: number): boolean =>
  a.revenue.planChanges.some((p) => p.type === type && daysSince(p.date) <= withinDays);

const failedAttempts = (a: Account): number =>
  a.revenue.paymentAttempts.filter((p) => p.status === "failed").length;

const renewsWithin = (a: Account, minDays: number, maxDays: number): boolean => {
  const d = daysUntil(a.revenue.renewalDate);
  return d >= minDays && d <= maxDays;
};

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

  // ----- v1 library actions -----
  "pb-quiet-7d": [
    { type: "customer-email", subject: "A quick hello from {{account}}", preview: "Hi {{name}}, noticed it's been a few days — here's one quick thing worth a look." },
  ],
  "pb-admin-dark-30": [
    { type: "slack", preview: "{{account}}'s admin has been dark for a month — worth a personal note." },
    { type: "customer-email", subject: "Checking in, {{name}}", preview: "Hi {{name}}, we haven't seen you in a while — anything we can help unblock?" },
  ],
  "pb-all-inactive": [
    { type: "internal-email", subject: "Account gone quiet: {{account}}", preview: "No logins from anyone in 30+ days. Time for a real outreach." },
    { type: "customer-email", subject: "Still getting value from {{account}}?", preview: "Hi {{name}}, it's been quiet on your end — let's make sure this is still working for you." },
  ],
  "pb-login-collapsed": [
    { type: "customer-email", subject: "Here when you need us", preview: "Hi {{name}}, you've been logging in less lately — here's a fast way back to value." },
  ],
  "pb-admin-removed": [
    { type: "internal-email", subject: "Admin removed: {{account}}", preview: "A key user is gone. Find the new point of contact before the relationship drifts." },
  ],
  "pb-reengaged": [
    { type: "customer-email", subject: "Welcome back, {{name}}", preview: "Great to see you again — here's the quickest win to pick up where you left off." },
  ],
  "pb-health-atrisk": [
    { type: "slack", preview: "{{account}} just dropped to at-risk — worth a look today." },
    { type: "customer-email", subject: "Let's get {{account}} back on track", preview: "Hi {{name}}, I'd love to help you get more out of this — can we grab 15 minutes?" },
  ],
  "pb-health-watch": [
    { type: "customer-email", subject: "A quick tune-up for {{account}}", preview: "Hi {{name}}, a couple of small things could make this run a lot smoother — want a hand?" },
  ],
  "pb-prolonged-decline": [
    { type: "internal-email", subject: "Sustained decline: {{account}}", preview: "Health's been falling for weeks. Time for a structured save." },
  ],
  "pb-save-big": [
    { type: "slack", preview: "High-value {{account}} is at-risk — escalating." },
    { type: "task", preview: "Personally reach out to {{account}} (high MRR, at-risk)." },
  ],
  "pb-renewal-dark": [
    { type: "customer-email", subject: "Before your renewal — a quick recap", preview: "Hi {{name}}, you're up for renewal soon. Here's the value you've gotten, and a hand if you want it." },
  ],
  "pb-annual-renewal": [
    { type: "customer-email", subject: "Your renewal's coming up", preview: "Hi {{name}}, your annual renewal is approaching — here's a recap and what's ahead." },
  ],
  "pb-funnel-unpublished": [
    { type: "internal-email", subject: "Funnel unpublished: {{account}}", preview: "They took a live funnel down. Strong leaving signal — reach out now." },
    { type: "customer-email", subject: "Noticed your funnel went offline", preview: "Hi {{name}}, your funnel is no longer live — want us to help get it back up?" },
  ],
  "pb-phone-portout": [
    { type: "slack", preview: "{{account}} ported their number out — likely leaving. Call today." },
    { type: "internal-email", subject: "Phone ported out: {{account}}", preview: "One of the strongest exit signals. Personal call before they fully migrate." },
  ],
  "pb-email-disconnect": [
    { type: "customer-email", subject: "Your email sending got disconnected", preview: "Hi {{name}}, your sending domain is disconnected — let's reconnect so campaigns keep landing." },
  ],
  "pb-stripe-disconnect": [
    { type: "internal-email", subject: "Payments disconnected: {{account}}", preview: "They can't collect right now. Offer an urgent reconnect." },
    { type: "customer-email", subject: "Let's get your payments working again", preview: "Hi {{name}}, your payment processor is disconnected — we can reconnect it with you in minutes." },
  ],
  "pb-calendar-disconnect": [
    { type: "customer-email", subject: "Your calendar got disconnected", preview: "Hi {{name}}, bookings won't go through until your calendar's reconnected — want a hand?" },
  ],
  "pb-workflow-off": [
    { type: "internal-email", subject: "Workflow turned off: {{account}}", preview: "A published automation was switched off. Find out why and offer to re-set-up." },
  ],
  "pb-payment-dunning": [
    { type: "customer-email", subject: "Your payment didn't go through — again", preview: "Hi {{name}}, we've tried your card a couple of times — update it here to avoid any interruption." },
    { type: "slack", preview: "{{account}} has multiple failed payments — escalating before cancel." },
  ],
  "pb-wallet-low": [
    { type: "customer-email", subject: "Top up to keep your texts and emails sending", preview: "Hi {{name}}, your balance is nearly out — a quick top-up keeps everything running." },
  ],
  "pb-spend-drop": [
    { type: "internal-email", subject: "Spend falling: {{account}}", preview: "Rebilling usage dropped sharply. Diagnose the pullback." },
  ],
  "pb-cancellation": [
    { type: "slack", preview: "{{account}} asked to cancel — pausing automations, routing to you now." },
    { type: "customer-email", subject: "Before you go — can we talk?", preview: "Hi {{name}}, I saw you're thinking of cancelling. I'd love 10 minutes to make this right." },
  ],
  "pb-churned-winback": [
    { type: "customer-email", subject: "We've changed a lot — come see", preview: "Hi {{name}}, it's been a while. Here's what's new since you left, and an easy way back." },
  ],
  "pb-workflows-unpublished": [
    { type: "customer-email", subject: "Let's publish your first automation", preview: "Hi {{name}}, you haven't launched a workflow yet — here's a two-minute starter, or we'll build one with you." },
  ],
  "pb-payments-unset": [
    { type: "customer-email", subject: "You're leaving money on the table", preview: "Hi {{name}}, payments isn't switched on yet — here's the quick setup to start collecting." },
  ],
  "pb-sms-unset": [
    { type: "customer-email", subject: "Send your first text campaign", preview: "Hi {{name}}, you're set up for texting but haven't sent one yet — here's how to launch your first." },
  ],
  "pb-reviews-unset": [
    { type: "customer-email", subject: "Start collecting reviews", preview: "Hi {{name}}, connect your profile and we'll help you turn happy clients into reviews." },
  ],
  "pb-breadth-no-depth": [
    { type: "customer-email", subject: "Pick one, go deep", preview: "Hi {{name}}, you've tried a lot — let's master one feature that'll move the needle." },
  ],
  "pb-day7-ghost": [
    { type: "internal-email", subject: "New account hasn't logged in: {{account}}", preview: "Day-7 ghost. Personal outreach before activation is lost." },
    { type: "customer-email", subject: "Let's get you started", preview: "Hi {{name}}, welcome aboard — grab 10 minutes and we'll set up your first win together." },
  ],
  "pb-onb-day30": [
    { type: "customer-email", subject: "How's setup going?", preview: "Hi {{name}}, want to make sure nothing's blocking you — here's a quick check-in." },
  ],
  "pb-onb-longtail": [
    { type: "internal-email", subject: "Long-tail onboarding: {{account}}", preview: "90+ days and still not live. Time for an intensive activation push." },
  ],
  "pb-welcome-day1": [
    { type: "customer-email", subject: "Welcome to {{account}}!", preview: "Hi {{name}}, so glad you're here — here's the two-minute path to your first win." },
  ],
  "pb-graduated": [
    { type: "customer-email", subject: "You're off to a great start", preview: "Hi {{name}}, you've cleared setup — here are the next features worth turning on." },
  ],
  "pb-spend-surge": [
    { type: "internal-email", subject: "Scaling fast: {{account}}", preview: "Spend is surging. Great moment for an expansion conversation." },
    { type: "customer-email", subject: "You're growing — let's grow with you", preview: "Hi {{name}}, you're scaling fast. Here's how to get even more, plus a quick planning call." },
  ],
  "pb-plan-upgrade": [
    { type: "customer-email", subject: "Welcome to your new plan", preview: "Hi {{name}}, congrats on upgrading — here's how to switch on what you just unlocked." },
  ],
  "pb-lifetime-milestone": [
    { type: "customer-email", subject: "Thank you for {{account}}", preview: "Hi {{name}}, you've hit a real milestone with us — here's to what's next." },
  ],
  "pb-high-engage-entry": [
    { type: "customer-email", subject: "You've outgrown your plan — in a good way", preview: "Hi {{name}}, you're using this heavily. Here's what the next tier unlocks." },
  ],
  "pb-power-user": [
    { type: "internal-email", subject: "Champion at {{account}}", preview: "Daily-active power user. Great testimonial or referral candidate." },
  ],
  "pb-no-feedback": [
    { type: "customer-email", subject: "How are we doing?", preview: "Hi {{name}}, we'd love your honest take — anything we could be doing better?" },
  ],
  "pb-health-thriving": [
    { type: "customer-email", subject: "You're thriving — here's what's next", preview: "Hi {{name}}, things are clicking. Want to explore a couple of ways to get even more?" },
  ],
  "pb-anniversary": [
    { type: "customer-email", subject: "Happy one year, {{name}}!", preview: "Hi {{name}}, it's been a year — here's a quick look back at what you've accomplished." },
  ],
};

type PlaybookSeed = Omit<
  Playbook,
  "videoUrl" | "actions" | "category" | "usedByAgencies" | "totalRuns" | "launchedDaysAgo" | "trending" | "effort" | "signal"
>;

// Marketplace metadata, merged into the catalog below. Prototype seed numbers —
// the UI labels them as community/aggregate signals, never invents precision.
const PLAY_META: Record<
  string,
  { category: PlaybookCategory; usedByAgencies: number; totalRuns: number; launchedDaysAgo: number; trending?: boolean; effort?: PlaybookEffort; signal: PlaybookSignal }
> = {
  "pb-no-login":           { category: "reengage", usedByAgencies: 2400, totalRuns: 51200, launchedDaysAgo: 210, effort: "ready", signal: "atrisk" },
  "pb-renewal-save":       { category: "winback",  usedByAgencies: 1980, totalRuns: 38400, launchedDaysAgo: 180, trending: true, effort: "ready", signal: "atrisk" },
  "pb-payment-failed":     { category: "revenue",  usedByAgencies: 3100, totalRuns: 72500, launchedDaysAgo: 240, effort: "ready", signal: "critical" },
  "pb-plan-downgrade":     { category: "winback",  usedByAgencies: 860,  totalRuns: 12300, launchedDaysAgo: 95,  effort: "quick", signal: "atrisk" },
  "pb-feature-drop":       { category: "adoption", usedByAgencies: 1450, totalRuns: 26800, launchedDaysAgo: 130, effort: "ready", signal: "atrisk" },
  "pb-onboarding-stalled": { category: "onboard",  usedByAgencies: 2100, totalRuns: 44100, launchedDaysAgo: 160, effort: "ready", signal: "watch" },
  "pb-save-domain":        { category: "winback",  usedByAgencies: 540,  totalRuns: 6900,  launchedDaysAgo: 70,  effort: "ready", signal: "critical" },
  "pb-save-integration":   { category: "winback",  usedByAgencies: 470,  totalRuns: 5400,  launchedDaysAgo: 64,  effort: "ready", signal: "critical" },
  "pb-save-a2p":           { category: "winback",  usedByAgencies: 390,  totalRuns: 4200,  launchedDaysAgo: 58,  effort: "quick", signal: "critical" },
  "pb-expansion-ready":    { category: "grow",     usedByAgencies: 1230, totalRuns: 19800, launchedDaysAgo: 110, trending: true, effort: "ready", signal: "positive" },
  "pb-quiet-renewal":      { category: "winback",  usedByAgencies: 320,  totalRuns: 2100,  launchedDaysAgo: 5,   trending: true, effort: "ready", signal: "atrisk" },
  "pb-low-adoption":       { category: "adoption", usedByAgencies: 410,  totalRuns: 3300,  launchedDaysAgo: 9,   effort: "quick", signal: "watch" },
  "pb-nps-detractor":      { category: "listen",   usedByAgencies: 760,  totalRuns: 9100,  launchedDaysAgo: 30,  effort: "ready", signal: "atrisk" },
  "pb-nps-promoter":       { category: "listen",   usedByAgencies: 1120, totalRuns: 15600, launchedDaysAgo: 12,  trending: true, effort: "ready", signal: "verypositive" },
  "pb-milestone":          { category: "listen",   usedByAgencies: 280,  totalRuns: 1800,  launchedDaysAgo: 3,   effort: "ready", signal: "positive" },
  "pb-upsell-limit":       { category: "grow",     usedByAgencies: 690,  totalRuns: 7400,  launchedDaysAgo: 18,  effort: "quick", signal: "positive" },

  // ----- v1 library metadata -----
  "pb-quiet-7d":            { category: "reengage", usedByAgencies: 1680, totalRuns: 33400, launchedDaysAgo: 140, effort: "ready", signal: "watch" },
  "pb-admin-dark-30":      { category: "reengage", usedByAgencies: 1320, totalRuns: 21800, launchedDaysAgo: 6,   trending: true, effort: "ready", signal: "atrisk" },
  "pb-all-inactive":       { category: "reengage", usedByAgencies: 940,  totalRuns: 12600, launchedDaysAgo: 44,  effort: "ready", signal: "critical" },
  "pb-login-collapsed":    { category: "reengage", usedByAgencies: 720,  totalRuns: 8800,  launchedDaysAgo: 33,  effort: "quick", signal: "atrisk" },
  "pb-admin-removed":      { category: "reengage", usedByAgencies: 410,  totalRuns: 3100,  launchedDaysAgo: 21,  effort: "quick", signal: "atrisk" },
  "pb-reengaged":          { category: "reengage", usedByAgencies: 560,  totalRuns: 6200,  launchedDaysAgo: 11,  effort: "ready", signal: "positive" },
  "pb-health-atrisk":      { category: "winback",  usedByAgencies: 2260, totalRuns: 48900, launchedDaysAgo: 150, effort: "ready", signal: "atrisk" },
  "pb-health-watch":       { category: "winback",  usedByAgencies: 1410, totalRuns: 22300, launchedDaysAgo: 88,  effort: "ready", signal: "watch" },
  "pb-prolonged-decline":  { category: "winback",  usedByAgencies: 880,  totalRuns: 11200, launchedDaysAgo: 52,  effort: "quick", signal: "atrisk" },
  "pb-save-big":           { category: "winback",  usedByAgencies: 1180, totalRuns: 9400,  launchedDaysAgo: 40,  trending: true, effort: "ready", signal: "critical" },
  "pb-renewal-dark":       { category: "winback",  usedByAgencies: 990,  totalRuns: 13700, launchedDaysAgo: 7,   trending: true, effort: "ready", signal: "critical" },
  "pb-annual-renewal":     { category: "winback",  usedByAgencies: 760,  totalRuns: 8100,  launchedDaysAgo: 64,  effort: "quick", signal: "watch" },
  "pb-funnel-unpublished": { category: "winback",  usedByAgencies: 620,  totalRuns: 7300,  launchedDaysAgo: 16,  trending: true, effort: "ready", signal: "critical" },
  "pb-phone-portout":      { category: "winback",  usedByAgencies: 480,  totalRuns: 4900,  launchedDaysAgo: 8,   trending: true, effort: "ready", signal: "critical" },
  "pb-email-disconnect":   { category: "winback",  usedByAgencies: 430,  totalRuns: 4400,  launchedDaysAgo: 34,  effort: "ready", signal: "critical" },
  "pb-stripe-disconnect":  { category: "winback",  usedByAgencies: 510,  totalRuns: 5600,  launchedDaysAgo: 27,  effort: "ready", signal: "critical" },
  "pb-calendar-disconnect":{ category: "winback",  usedByAgencies: 360,  totalRuns: 3500,  launchedDaysAgo: 30,  effort: "quick", signal: "critical" },
  "pb-workflow-off":       { category: "winback",  usedByAgencies: 540,  totalRuns: 6100,  launchedDaysAgo: 23,  effort: "ready", signal: "atrisk" },
  "pb-payment-dunning":    { category: "revenue",  usedByAgencies: 2540, totalRuns: 58200, launchedDaysAgo: 200, effort: "ready", signal: "critical" },
  "pb-wallet-low":         { category: "revenue",  usedByAgencies: 1290, totalRuns: 24800, launchedDaysAgo: 19,  trending: true, effort: "ready", signal: "critical" },
  "pb-spend-drop":         { category: "revenue",  usedByAgencies: 1010, totalRuns: 14300, launchedDaysAgo: 70,  effort: "quick", signal: "atrisk" },
  "pb-cancellation":       { category: "revenue",  usedByAgencies: 1460, totalRuns: 11900, launchedDaysAgo: 12,  trending: true, effort: "ready", signal: "critical" },
  "pb-churned-winback":    { category: "revenue",  usedByAgencies: 870,  totalRuns: 7600,  launchedDaysAgo: 55,  effort: "custom", signal: "critical" },
  "pb-workflows-unpublished": { category: "adoption", usedByAgencies: 1340, totalRuns: 19200, launchedDaysAgo: 9, trending: true, effort: "ready", signal: "atrisk" },
  "pb-payments-unset":     { category: "adoption", usedByAgencies: 980,  totalRuns: 12400, launchedDaysAgo: 41,  effort: "quick", signal: "watch" },
  "pb-sms-unset":          { category: "adoption", usedByAgencies: 740,  totalRuns: 8300,  launchedDaysAgo: 48,  effort: "quick", signal: "watch" },
  "pb-reviews-unset":      { category: "adoption", usedByAgencies: 650,  totalRuns: 6900,  launchedDaysAgo: 60,  effort: "quick", signal: "watch" },
  "pb-breadth-no-depth":   { category: "adoption", usedByAgencies: 420,  totalRuns: 3600,  launchedDaysAgo: 26,  effort: "custom", signal: "watch" },
  "pb-day7-ghost":         { category: "onboard",  usedByAgencies: 1720, totalRuns: 29800, launchedDaysAgo: 5,   trending: true, effort: "ready", signal: "atrisk" },
  "pb-onb-day30":          { category: "onboard",  usedByAgencies: 1180, totalRuns: 18400, launchedDaysAgo: 36,  effort: "ready", signal: "watch" },
  "pb-onb-longtail":       { category: "onboard",  usedByAgencies: 540,  totalRuns: 5200,  launchedDaysAgo: 50,  effort: "quick", signal: "watch" },
  "pb-welcome-day1":       { category: "onboard",  usedByAgencies: 2010, totalRuns: 51800, launchedDaysAgo: 175, effort: "ready", signal: "watch" },
  "pb-graduated":          { category: "onboard",  usedByAgencies: 690,  totalRuns: 7100,  launchedDaysAgo: 14,  effort: "ready", signal: "positive" },
  "pb-spend-surge":        { category: "grow",     usedByAgencies: 1130, totalRuns: 13900, launchedDaysAgo: 10,  trending: true, effort: "ready", signal: "verypositive" },
  "pb-plan-upgrade":       { category: "grow",     usedByAgencies: 980,  totalRuns: 11200, launchedDaysAgo: 31,  effort: "ready", signal: "verypositive" },
  "pb-lifetime-milestone": { category: "grow",     usedByAgencies: 520,  totalRuns: 4800,  launchedDaysAgo: 22,  effort: "ready", signal: "positive" },
  "pb-high-engage-entry":  { category: "grow",     usedByAgencies: 860,  totalRuns: 9700,  launchedDaysAgo: 38,  effort: "quick", signal: "positive" },
  "pb-power-user":         { category: "grow",     usedByAgencies: 740,  totalRuns: 8200,  launchedDaysAgo: 17,  effort: "ready", signal: "verypositive" },
  "pb-no-feedback":        { category: "listen",   usedByAgencies: 630,  totalRuns: 6400,  launchedDaysAgo: 45,  effort: "quick", signal: "watch" },
  "pb-health-thriving":    { category: "listen",   usedByAgencies: 910,  totalRuns: 12100, launchedDaysAgo: 13,  trending: true, effort: "ready", signal: "verypositive" },
  "pb-anniversary":        { category: "listen",   usedByAgencies: 1240, totalRuns: 21600, launchedDaysAgo: 120, effort: "ready", signal: "positive" },
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
    match: (a) =>
      a.status.enabled === "Enabled" &&
      (a.feedback.sentiment === "negative" ||
        (a.feedback.npsScore > 0 && a.feedback.npsScore <= 6)),
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
    match: (a) =>
      a.status.enabled === "Enabled" &&
      ((a.identity.activeDays >= 350 && a.identity.activeDays <= 380) ||
        (a.identity.activeDays >= 705 && a.identity.activeDays <= 740)),
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
    match: (a) =>
      a.status.enabled === "Enabled" &&
      (a.health.band === "thriving" || a.health.band === "healthy") &&
      a.login.activeUsers >= 5 &&
      !a.identity.plan.includes("Pro+"),
  },

  // ============================================================
  // v1 LIBRARY — 41 new plays (grounded in gocsm-signal-knowledge-base.md).
  // Rated on the churn↔expansion spectrum; see playbook-library-v1.md.
  // ============================================================

  // ----- Re-engage quiet (login & inactivity) -----
  {
    id: "pb-quiet-7d",
    title: "No login — 7 days",
    subtitle: "Catch drift with an early, soft nudge",
    icon: "log-in",
    state: "off",
    kind: "retention",
    problem: "The owner hasn't logged in for a week.",
    does: "Sends a light 'here's what's new' nudge — no alarm, just a reason to come back.",
    outcome: "Re-open the habit before the gap widens.",
    match: (a) => notOnboardingLive(a) && a.login.lastLoginDaysAgo >= 7 && a.login.lastLoginDaysAgo < 21,
  },
  {
    id: "pb-admin-dark-30",
    title: "Admin gone dark — 30 days",
    subtitle: "Step in when the key user disappears",
    icon: "user-x",
    state: "off",
    kind: "retention",
    problem: "The account admin hasn't logged in for 30+ days.",
    does: "Alerts your team and sends an urgent, personal check-in to the admin.",
    outcome: "Reconnect the decision-maker before the account goes cold.",
    match: (a) => notOnboardingLive(a) && a.login.lastLoginDaysAgo >= 30,
  },
  {
    id: "pb-all-inactive",
    title: "Whole account inactive",
    subtitle: "Nobody's logged in for a month",
    icon: "users",
    state: "off",
    kind: "retention",
    problem: "Every user has been idle for 30+ days — the account is going dark.",
    does: "Escalates to your team and sends an account-level re-engagement outreach.",
    outcome: "Revive the account before it lapses entirely.",
    match: (a) =>
      notOnboardingLive(a) && a.login.lastLoginDaysAgo >= 30 && a.login.activityStatus === "ghosting",
  },
  {
    id: "pb-login-collapsed",
    title: "Login frequency collapsed",
    subtitle: "From regular to barely there",
    icon: "activity",
    state: "off",
    kind: "retention",
    problem: "They were logging in regularly and have suddenly dropped off.",
    does: "Sends a re-anchor nudge with a quick reason to return.",
    outcome: "Catch the slowdown before it becomes silence.",
    match: (a) => a.status.enabled === "Enabled" && usageReverse(a, ["Login"], 90),
  },
  {
    id: "pb-admin-removed",
    title: "Key admin removed",
    subtitle: "A champion may have left",
    icon: "user-minus",
    state: "off",
    kind: "retention",
    problem: "An admin user was deactivated or removed from the account.",
    does: "Alerts your team to find out who's now in charge and re-establish the relationship.",
    outcome: "Don't let a staffing change become a silent churn.",
    match: (a) =>
      a.status.enabled === "Enabled" &&
      a.login.users.some((u) => u.role !== "owner" && u.status === "inactive"),
  },
  {
    id: "pb-reengaged",
    title: "Owner re-engaged",
    subtitle: "They came back — make it count",
    icon: "user-check",
    state: "off",
    kind: "expansion",
    problem: "An account that had gone quiet is active again.",
    does: "Sends a warm 'welcome back' and surfaces a quick win to rebuild momentum.",
    outcome: "Turn a return into a re-rooted habit.",
    match: (a) =>
      a.status.enabled === "Enabled" &&
      (a.lifecycle.reactivated || (a.health.delta > 0 && a.login.lastLoginDaysAgo <= 7 && a.lifecycle.stage === "activated")),
  },

  // ----- Win back at-risk (health & renewal) -----
  {
    id: "pb-health-atrisk",
    title: "Health dropped to at-risk",
    subtitle: "Move the moment the band breaks",
    icon: "heart-pulse",
    state: "off",
    kind: "retention",
    problem: "Overall health just fell into the at-risk band.",
    does: "Alerts your team and opens a diagnostic, recovery-focused outreach.",
    outcome: "Intervene while there's still a relationship to save.",
    match: (a) => a.status.enabled === "Enabled" && a.health.band === "atrisk" && a.health.delta < 0,
  },
  {
    id: "pb-health-watch",
    title: "Slipped to watch",
    subtitle: "The earliest warning worth acting on",
    icon: "alert-triangle",
    state: "off",
    kind: "retention",
    problem: "Health softened from healthy into the watch band.",
    does: "Sends a light-touch nudge before the slide continues.",
    outcome: "Course-correct early, while it's cheap to fix.",
    match: (a) => a.status.enabled === "Enabled" && a.health.band === "watch" && a.health.delta < 0,
  },
  {
    id: "pb-prolonged-decline",
    title: "Prolonged decline",
    subtitle: "Falling for weeks, not days",
    icon: "trending-down",
    state: "off",
    kind: "retention",
    problem: "Health has been falling steadily — a sustained downward trend.",
    does: "Flags the pattern and runs a structured save play with your team.",
    outcome: "Break the decline before it reaches at-risk.",
    match: (a) => a.status.enabled === "Enabled" && a.health.delta <= -7,
  },
  {
    id: "pb-save-big",
    title: "Save the big ones",
    subtitle: "Your largest accounts, at risk",
    icon: "shield",
    state: "off",
    kind: "save",
    problem: "A high-MRR account is at-risk — the most expensive churn you can have.",
    does: "Top-priorities your team, loops in an exec, and opens a personal save.",
    outcome: "Protect the revenue that matters most.",
    match: (a) => a.status.enabled === "Enabled" && a.health.band === "atrisk" && a.revenue.mrr >= 2000,
  },
  {
    id: "pb-renewal-dark",
    title: "Renewing in 30 days & gone dark",
    subtitle: "Silent right before the renewal",
    icon: "calendar-clock",
    state: "off",
    kind: "retention",
    problem: "Renews within 30 days and hasn't logged in for a month.",
    does: "Sends a value recap and books a personal pre-renewal check-in.",
    outcome: "Re-open the conversation before the renewal decision lands.",
    match: (a) => a.status.enabled === "Enabled" && a.login.lastLoginDaysAgo >= 30 && renewsWithin(a, 0, 30),
  },
  {
    id: "pb-annual-renewal",
    title: "Annual renewal approaching",
    subtitle: "Warm up the big yearly decision",
    icon: "calendar",
    state: "off",
    kind: "retention",
    problem: "An annual account is coming up for renewal in the next 60 days.",
    does: "Starts an early, value-led warm-up ahead of the renewal date.",
    outcome: "Make the annual renewal a formality, not a surprise.",
    match: (a) => a.status.enabled === "Enabled" && a.identity.plan.includes("Pro") && renewsWithin(a, 0, 60),
  },

  // ----- Value teardown (sticky-setup reverse) — strongest churn tells -----
  {
    id: "pb-funnel-unpublished",
    title: "Website / funnel unpublished",
    subtitle: "Win-back · they took it live, then down",
    icon: "globe",
    state: "off",
    kind: "save",
    problem: "A funnel that was live has been unpublished — a strong leaving signal.",
    does: "Stops other automations, alerts you, and offers a hands-on save call.",
    outcome: "Find out why it came down and keep them on the platform.",
    match: (a) => stickyReverseSubjects(a, ["Funnel"]),
  },
  {
    id: "pb-phone-portout",
    title: "Phone number ported out",
    subtitle: "Win-back · near-certain exit",
    icon: "phone",
    state: "off",
    kind: "save",
    problem: "They ported their phone number off the platform — one of the strongest exit signals.",
    does: "Immediately alerts your team for a personal call — automations paused.",
    outcome: "Intervene before the move becomes a full migration.",
    match: (a) => stickyReverseSubjects(a, ["Phone"]),
  },
  {
    id: "pb-email-disconnect",
    title: "Email sending domain disconnected",
    subtitle: "Win-back · deliverability at risk",
    icon: "mail",
    state: "off",
    kind: "save",
    problem: "Their email sending domain was disconnected — campaigns will stop landing.",
    does: "Alerts you and offers a hands-on reconnect before deliverability craters.",
    outcome: "Restore sending and confirm they're staying.",
    match: (a) => stickyReverseSubjects(a, ["Email"]),
  },
  {
    id: "pb-stripe-disconnect",
    title: "Payment processor disconnected",
    subtitle: "Win-back · they can't collect",
    icon: "credit-card",
    state: "off",
    kind: "save",
    problem: "Their Stripe/payment processor was disconnected — they can't take payments.",
    does: "Alerts you and offers an urgent reconnect call.",
    outcome: "Get them collecting again before they give up on the platform.",
    match: (a) => stickyReverseSubjects(a, ["Payment"]),
  },
  {
    id: "pb-calendar-disconnect",
    title: "Calendar disconnected",
    subtitle: "Win-back · booking flow broken",
    icon: "calendar-x",
    state: "off",
    kind: "save",
    problem: "Their calendar integration was disconnected — bookings will fail.",
    does: "Alerts you and offers a quick reconnect before missed appointments pile up.",
    outcome: "Restore scheduling and the value that depends on it.",
    match: (a) => stickyReverseSubjects(a, ["Calendar"]),
  },
  {
    id: "pb-workflow-off",
    title: "Published workflow turned off",
    subtitle: "Win-back · automation switched off",
    icon: "workflow",
    state: "off",
    kind: "save",
    problem: "A live, published workflow was turned off or deleted.",
    does: "Finds the cause and offers to help re-set-up the automation.",
    outcome: "Re-anchor the automation that made them sticky.",
    match: (a) => stickyReverseSubjects(a, ["Workflow"]),
  },

  // ----- Rescue revenue (billing & spend) -----
  {
    id: "pb-payment-dunning",
    title: "Payment failing repeatedly",
    subtitle: "Two strikes — escalate now",
    icon: "credit-card",
    state: "off",
    kind: "billing",
    problem: "A card has failed two or more times in a row.",
    does: "Escalates beyond auto-reminders to a personal nudge before the subscription cancels.",
    outcome: "Recover the payment before dunning ends in a cancel.",
    match: (a) => a.status.enabled === "Enabled" && failedAttempts(a) >= 2,
  },
  {
    id: "pb-wallet-low",
    title: "Rebilling wallet critically low",
    subtitle: "Their texts and emails are about to stop",
    icon: "wallet",
    state: "off",
    kind: "billing",
    problem: "The rebilling wallet is nearly empty while usage keeps drawing it down.",
    does: "Sends a top-up reminder before SMS and email delivery halts.",
    outcome: "Keep their messaging running — and your rebilling revenue with it.",
    match: (a) =>
      a.status.enabled === "Enabled" &&
      a.revenue.mrr > 0 &&
      a.revenue.walletBalance < 250 &&
      a.revenue.walletSpend30d > a.revenue.walletBalance,
  },
  {
    id: "pb-spend-drop",
    title: "Spend dropping",
    subtitle: "Rebilling usage is falling fast",
    icon: "trending-down",
    state: "off",
    kind: "billing",
    problem: "Their rebilling spend has fallen sharply — usage is pulling back.",
    does: "Diagnoses the pullback and re-engages them on the value they're dropping.",
    outcome: "Reverse the decline before it shows up at renewal.",
    match: (a) => a.status.enabled === "Enabled" && a.revenue.spendTrend <= -15,
  },
  {
    id: "pb-cancellation",
    title: "Cancellation requested",
    subtitle: "Stop everything — save it personally",
    icon: "x-circle",
    state: "off",
    kind: "retention",
    problem: "They've signaled intent to cancel.",
    does: "Pauses all automations and routes an immediate, founder-level save offer.",
    outcome: "Win the conversation before the cancel is final.",
    match: (a) => a.status.enabled === "Enabled" && a.status.pendingStop,
  },
  {
    id: "pb-churned-winback",
    title: "Churned — win back",
    subtitle: "Bring them back with what's new",
    icon: "rotate-ccw",
    state: "off",
    kind: "retention",
    problem: "An account cancelled recently.",
    does: "Runs a timed win-back sequence highlighting what's changed since they left.",
    outcome: "Reopen the door once the dust settles.",
    match: (a) => a.lifecycle.stage === "churned" || recentPlanChange(a, "churn", 90),
  },

  // ----- Drive adoption (feature activation) -----
  {
    id: "pb-workflows-unpublished",
    title: "No workflow 30 days after signup",
    subtitle: "Automation never got switched on",
    icon: "workflow",
    state: "off",
    kind: "adoption",
    problem: "A month in and they still haven't published a single automation.",
    does: "Sends a guided 'publish your first workflow' nudge and offers to build one with them.",
    outcome: "Get them to the automation aha before they drift.",
    match: (a) => notOnboardingLive(a) && a.identity.activeDays >= 30 && !hasFeature(a, "Workflow"),
  },
  {
    id: "pb-payments-unset",
    title: "Payments never set up",
    subtitle: "Leaving money uncollected",
    icon: "banknote",
    state: "off",
    kind: "adoption",
    problem: "A paying account never switched on payments — money they could be collecting.",
    does: "Sends a short walkthrough to connect payments and take the first invoice.",
    outcome: "Turn on a feature that pays for itself.",
    match: (a) =>
      notOnboardingLive(a) &&
      a.revenue.mrr > 0 &&
      !a.identity.isNonSaaS &&
      !hasFeature(a, "Payment"),
  },
  {
    id: "pb-sms-unset",
    title: "Texting never sent",
    subtitle: "Phone set up, but no SMS going out",
    icon: "message-square",
    state: "off",
    kind: "adoption",
    problem: "They have phone capability but haven't sent any texts.",
    does: "Nudges them to register and send a first SMS campaign.",
    outcome: "Unlock the channel with the highest response rate they own.",
    match: (a) => a.status.enabled === "Enabled" && hasFeature(a, "Phone") && !hasFeature(a, "SMS"),
  },
  {
    id: "pb-reviews-unset",
    title: "Reviews never connected",
    subtitle: "Reputation tools sitting idle",
    icon: "star",
    state: "off",
    kind: "adoption",
    problem: "A local-service account hasn't connected review/reputation tools.",
    does: "Sends a light nudge to connect their profile and start collecting reviews.",
    outcome: "Help them win the local-search game they're paying for.",
    match: (a) =>
      a.status.enabled === "Enabled" &&
      ["Healthcare", "Fitness", "Wellness", "Legal"].includes(a.identity.industry) &&
      !hasFeature(a, "Reputation"),
  },
  {
    id: "pb-breadth-no-depth",
    title: "Breadth without depth",
    subtitle: "Lots of features, none used deeply",
    icon: "layers",
    state: "off",
    kind: "adoption",
    problem: "They've touched several features but go deep on none of them.",
    does: "Helps them pick one feature and actually master it.",
    outcome: "Trade shallow sprawl for one real habit.",
    match: (a) =>
      a.status.enabled === "Enabled" &&
      a.adoption.features.length >= 2 &&
      a.adoption.features.every((f) => f.engagement > 0 && f.engagement <= 40),
  },

  // ----- Onboard faster (lifecycle-aware) -----
  {
    id: "pb-day7-ghost",
    title: "Day-7 ghost",
    subtitle: "Signed up, never logged in",
    icon: "ghost",
    state: "off",
    kind: "onboarding",
    problem: "A new account hasn't logged in at all in its first week.",
    does: "Triggers a hands-on 'let's get you started' outreach from your team.",
    outcome: "Rescue the activation before it's lost on day one.",
    match: (a) =>
      a.status.enabled === "Enabled" &&
      a.lifecycle.stage === "onboarding" &&
      a.identity.activeDays <= 14 &&
      a.login.activityStatus === "ghosting",
  },
  {
    id: "pb-onb-day30",
    title: "Day-30 onboarding health check",
    subtitle: "Still finding their feet",
    icon: "clipboard-check",
    state: "off",
    kind: "onboarding",
    problem: "An onboarding account is past the first weeks but health is still low.",
    does: "Runs a structured check-in to unblock whatever's stalling them.",
    outcome: "Get them to value before momentum dies.",
    match: (a) =>
      a.status.enabled === "Enabled" && a.lifecycle.stage === "onboarding" && a.health.score < 60,
  },
  {
    id: "pb-onb-longtail",
    title: "Long-tail onboarding",
    subtitle: "Months in, still not activated",
    icon: "clock",
    state: "off",
    kind: "onboarding",
    problem: "The account is 90+ days old but never finished onboarding.",
    does: "Escalates to an intensive, hands-on activation push.",
    outcome: "Finally get them live — or learn why they can't be.",
    match: (a) =>
      a.status.enabled === "Enabled" && a.lifecycle.stage === "onboarding" && a.identity.activeDays >= 85,
  },
  {
    id: "pb-welcome-day1",
    title: "Welcome — day 1",
    subtitle: "Start the relationship right",
    icon: "calendar-check",
    state: "off",
    kind: "onboarding",
    problem: "A brand-new account just came on board.",
    does: "Sends a warm welcome and the two-minute path to their first win.",
    outcome: "Make a strong first impression and set the tone.",
    match: (a) =>
      a.status.enabled === "Enabled" &&
      a.lifecycle.stage === "onboarding" &&
      daysSince(a.identity.clientSince) <= 2,
  },
  {
    id: "pb-graduated",
    title: "Graduated to growth",
    subtitle: "Onboarding done — what's next",
    icon: "rocket",
    state: "off",
    kind: "expansion",
    problem: "An account just moved from onboarding into active growth.",
    does: "Celebrates the milestone and introduces the next set of features.",
    outcome: "Carry early momentum into deeper adoption.",
    match: (a) => a.status.enabled === "Enabled" && a.lifecycle.stage === "activated" && a.health.delta > 0,
  },

  // ----- Grow & upsell (the happy signals) -----
  {
    id: "pb-spend-surge",
    title: "Spend surging",
    subtitle: "Usage is taking off — strike now",
    icon: "trending-up",
    state: "off",
    kind: "expansion",
    problem: "Their rebilling spend is climbing fast — they're scaling.",
    does: "Flags the moment and opens an expansion conversation while it's hot.",
    outcome: "Grow with them at exactly the right time.",
    match: (a) =>
      a.status.enabled === "Enabled" &&
      (a.health.band === "thriving" || a.health.band === "healthy") &&
      a.revenue.spendTrend >= 12,
  },
  {
    id: "pb-plan-upgrade",
    title: "Plan upgraded — deepen",
    subtitle: "They just leveled up",
    icon: "arrow-up-circle",
    state: "off",
    kind: "expansion",
    problem: "They recently upgraded to a higher plan.",
    does: "Sends a congrats and helps them activate the features the new tier unlocks.",
    outcome: "Make the upgrade pay off so it sticks.",
    match: (a) => a.status.enabled === "Enabled" && recentPlanChange(a, "upgrade", 30),
  },
  {
    id: "pb-lifetime-milestone",
    title: "Lifetime spend milestone",
    subtitle: "A long, valuable relationship",
    icon: "gem",
    state: "off",
    kind: "expansion",
    problem: "Their total spend with you has crossed a meaningful threshold.",
    does: "Recognizes the milestone and opens an expansion or advocacy ask.",
    outcome: "Turn loyalty into growth or proof.",
    match: (a) => a.status.enabled === "Enabled" && lifetimeSpendOf(a) >= 30000,
  },
  {
    id: "pb-high-engage-entry",
    title: "High engagement on entry plan",
    subtitle: "Outgrowing their starter tier",
    icon: "zap",
    state: "off",
    kind: "expansion",
    problem: "They're using the product heavily while still on an entry plan.",
    does: "Frames the upgrade around what they've already outgrown.",
    outcome: "Match their plan to the value they're getting.",
    match: (a) =>
      a.status.enabled === "Enabled" &&
      a.identity.plan.includes("Starter") &&
      a.login.activityStatus === "highly",
  },
  {
    id: "pb-power-user",
    title: "Power user emerged",
    subtitle: "A daily-active champion",
    icon: "crown",
    state: "off",
    kind: "expansion",
    problem: "Someone is in the product daily — a clear champion.",
    does: "Surfaces them for a testimonial, referral, or expansion conversation.",
    outcome: "Turn a power user into advocacy or expansion.",
    match: (a) =>
      a.status.enabled === "Enabled" &&
      a.login.activityStatus === "highly" &&
      a.login.lastLoginDaysAgo <= 2 &&
      (a.health.band === "thriving" || a.health.band === "healthy"),
  },

  // ----- Listen & celebrate (feedback & milestones) -----
  {
    id: "pb-no-feedback",
    title: "No feedback in 60+ days",
    subtitle: "Quiet established account",
    icon: "message-square",
    state: "off",
    kind: "retention",
    problem: "An established account hasn't given any feedback in a long time.",
    does: "Sends a proactive 'how are we doing' ask to surface any hidden issues.",
    outcome: "Catch silent dissatisfaction before it becomes churn.",
    match: (a) =>
      a.status.enabled === "Enabled" &&
      a.lifecycle.stage === "established" &&
      a.feedback.lastFeedbackDate === null,
  },
  {
    id: "pb-health-thriving",
    title: "Health reached thriving",
    subtitle: "Everything's clicking",
    icon: "heart",
    state: "off",
    kind: "expansion",
    problem: "Their health just climbed into the thriving band.",
    does: "Sends a warm note and tees up an expansion or testimonial ask.",
    outcome: "Capitalize on a peak moment.",
    match: (a) => a.status.enabled === "Enabled" && a.health.band === "thriving" && a.health.delta > 0,
  },
  {
    id: "pb-anniversary",
    title: "1-year anniversary",
    subtitle: "Mark a year together",
    icon: "award",
    state: "off",
    kind: "expansion",
    problem: "An account is hitting its one-year mark with you.",
    does: "Sends a warm year-in-review recap — a loyalty moment, no ask.",
    outcome: "Deepen the relationship at a natural milestone.",
    match: (a) =>
      a.status.enabled === "Enabled" && a.identity.activeDays >= 350 && a.identity.activeDays <= 380,
  },
];

const DEFAULT_META = {
  category: "winback" as PlaybookCategory,
  usedByAgencies: 0,
  totalRuns: 0,
  launchedDaysAgo: 999,
  trending: false,
  effort: "ready" as PlaybookEffort,
  signal: "watch" as PlaybookSignal,
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
    signal: m.signal ?? "watch",
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
