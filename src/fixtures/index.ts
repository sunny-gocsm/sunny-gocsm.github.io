// Shared mock-data layer. Every surface reads from here so numbers stay
// consistent across screens. No backend, no API — plain typed exports +
// pure selector helpers.

// ============================================================
// TYPES
// ============================================================

export type HealthBand = "thriving" | "healthy" | "watch" | "atrisk";

export type LifecycleStage =
  | "onboarding"
  | "activated"
  | "established"
  | "lapsing"
  | "dormant"
  | "churned";

export interface TimelineEvent {
  daysAgo: number;
  label: string;
}

export interface AccountAdoption {
  workflowRuns: number;
  contactGrowthPct: number;
  featuresUsed: number;
}

export interface Account {
  id: string;
  name: string;
  healthBand: HealthBand;
  healthScore: number; // 0-100
  lifecycleStage: LifecycleStage;
  reactivated?: boolean;
  /** Native-HL CS pipeline stage name, only present on some accounts. */
  pipelineStage?: string;
  mrr: number;
  renewalInDays: number;
  lastLoginDays: number;
  adoption: AccountAdoption;
  owner: string;
  segments: string[];
  /** Risk-narrative timeline, newest last. */
  timeline: TimelineEvent[];
}

export type PlaybookState = "off" | "ranonce" | "on";

export interface PlaybookAction {
  icon: string;
  title: string;
  desc: string;
  on: boolean;
  supervised: boolean;
}

export interface PlaybookDraft {
  channel: string;
  icon: string;
  preview: string;
}

export interface PlaybookWatch {
  summary: string;
  cadence: string;
  via: "Runs as a HighLevel automation" | "Runs as an AI watch";
}

export interface Playbook {
  id: string;
  icon: string;
  title: string;
  problem: string;
  does: string;
  outcome: string;
  watch: PlaybookWatch;
  actions: PlaybookAction[];
  proof: { drafts: PlaybookDraft[] };
  state: PlaybookState;
  videoLabel: string;
  /** Rule that decides which accounts the playbook applies to. */
  match: (account: Account) => boolean;
}

export interface Outcome {
  id: string;
  accountName: string;
  action: string;
  result: string;
  savedMrr?: number;
  daysAgo: number;
}

export interface OnboardingStep {
  label: string;
  done: boolean;
}

export interface OnboardingProgress {
  accountId: string;
  accountName: string;
  startedDaysAgo: number;
  steps: OnboardingStep[];
  /** Index into steps[] of the step the account is stuck on, if any. */
  stalledStepIndex?: number;
}

export interface PlanMixEntry {
  plan: string;
  accounts: number;
  mrr: number;
}

export interface MoneySnapshot {
  mrr: number;
  nrrPct: number;
  grossMarginPct: number;
  planMix: PlanMixEntry[];
}

// ============================================================
// ACCOUNTS — ~16 with a realistic spread
// ============================================================

export const accounts: Account[] = [
  // --- Urgent: at-risk / dormant with high MRR near renewal ---
  {
    id: "a-modern-physio",
    name: "Modern Physio",
    healthBand: "atrisk",
    healthScore: 28,
    lifecycleStage: "lapsing",
    pipelineStage: "Retention review",
    mrr: 2400,
    renewalInDays: 6,
    lastLoginDays: 21,
    adoption: { workflowRuns: 4, contactGrowthPct: -3, featuresUsed: 2 },
    owner: "Sinan",
    segments: ["healthcare", "high-mrr"],
    timeline: [
      { daysAgo: 60, label: "Logins dropped from daily to weekly" },
      { daysAgo: 28, label: "Cancelled SMS add-on" },
      { daysAgo: 21, label: "Last login" },
      { daysAgo: 3, label: "Renewal in 6 days — owner not yet contacted" },
    ],
  },
  {
    id: "a-badasslink",
    name: "BadassLink",
    healthBand: "atrisk",
    healthScore: 22,
    lifecycleStage: "lapsing",
    mrr: 1850,
    renewalInDays: 11,
    lastLoginDays: 14,
    adoption: { workflowRuns: 2, contactGrowthPct: -8, featuresUsed: 3 },
    owner: "Maya",
    segments: ["agency", "high-mrr"],
    timeline: [
      { daysAgo: 45, label: "Card declined on monthly invoice" },
      { daysAgo: 30, label: "Failed-payment dunning sent (no reply)" },
      { daysAgo: 14, label: "Last login" },
    ],
  },
  {
    id: "a-organize-online-biz",
    name: "Organize Your Online Biz",
    healthBand: "atrisk",
    healthScore: 31,
    lifecycleStage: "dormant",
    mrr: 1200,
    renewalInDays: 9,
    lastLoginDays: 34,
    adoption: { workflowRuns: 1, contactGrowthPct: -12, featuresUsed: 2 },
    owner: "Auto",
    segments: ["coaching"],
    timeline: [
      { daysAgo: 50, label: "Stopped sending campaigns" },
      { daysAgo: 34, label: "Last login" },
      { daysAgo: 1, label: "Renewal reminder sent (auto)" },
    ],
  },
  {
    id: "a-greenfield-partners",
    name: "Greenfield Partners",
    healthBand: "watch",
    healthScore: 48,
    lifecycleStage: "lapsing",
    pipelineStage: "Check-in",
    mrr: 3100,
    renewalInDays: 22,
    lastLoginDays: 9,
    adoption: { workflowRuns: 8, contactGrowthPct: -2, featuresUsed: 4 },
    owner: "Sinan",
    segments: ["real-estate", "high-mrr"],
    timeline: [
      { daysAgo: 40, label: "Pipeline imports paused" },
      { daysAgo: 9, label: "Last login (down from daily)" },
    ],
  },
  {
    id: "a-lauren-fondriest",
    name: "Lauren Fondriest",
    healthBand: "watch",
    healthScore: 54,
    lifecycleStage: "activated",
    mrr: 780,
    renewalInDays: 41,
    lastLoginDays: 7,
    adoption: { workflowRuns: 12, contactGrowthPct: 4, featuresUsed: 5 },
    owner: "Maya",
    segments: ["coaching"],
    timeline: [
      { daysAgo: 20, label: "Workflow runs dropped 30%" },
      { daysAgo: 7, label: "Last login" },
    ],
  },
  {
    id: "a-northside-dental",
    name: "Northside Dental",
    healthBand: "watch",
    healthScore: 51,
    lifecycleStage: "established",
    pipelineStage: "Quarterly review",
    mrr: 1450,
    renewalInDays: 60,
    lastLoginDays: 11,
    adoption: { workflowRuns: 14, contactGrowthPct: 1, featuresUsed: 5 },
    owner: "Sinan",
    segments: ["healthcare"],
    timeline: [
      { daysAgo: 30, label: "Owner changed" },
      { daysAgo: 11, label: "Last login" },
    ],
  },

  // --- Healthy / steady middle ---
  {
    id: "a-this-is-wellbeing",
    name: "This is Wellbeing",
    healthBand: "healthy",
    healthScore: 72,
    lifecycleStage: "established",
    pipelineStage: "Advocate",
    mrr: 1650,
    renewalInDays: 95,
    lastLoginDays: 1,
    adoption: { workflowRuns: 41, contactGrowthPct: 9, featuresUsed: 7 },
    owner: "Maya",
    segments: ["coaching", "advocate"],
    timeline: [
      { daysAgo: 90, label: "NPS 9 submitted" },
      { daysAgo: 7, label: "Hit 100 active contacts milestone" },
    ],
  },
  {
    id: "a-coastline-realty",
    name: "Coastline Realty",
    healthBand: "healthy",
    healthScore: 68,
    lifecycleStage: "established",
    mrr: 2100,
    renewalInDays: 73,
    lastLoginDays: 2,
    adoption: { workflowRuns: 32, contactGrowthPct: 6, featuresUsed: 6 },
    owner: "Sinan",
    segments: ["real-estate"],
    timeline: [
      { daysAgo: 14, label: "Added 2nd user seat" },
    ],
  },
  {
    id: "a-mile-high-fitness",
    name: "Mile High Fitness",
    healthBand: "healthy",
    healthScore: 66,
    lifecycleStage: "activated",
    mrr: 690,
    renewalInDays: 51,
    lastLoginDays: 3,
    adoption: { workflowRuns: 22, contactGrowthPct: 11, featuresUsed: 5 },
    owner: "Maya",
    segments: ["fitness"],
    timeline: [
      { daysAgo: 30, label: "Activated first automation" },
    ],
  },
  {
    id: "a-paws-and-claws",
    name: "Paws & Claws Vet",
    healthBand: "healthy",
    healthScore: 64,
    lifecycleStage: "established",
    pipelineStage: "Advocate",
    mrr: 980,
    renewalInDays: 110,
    lastLoginDays: 4,
    adoption: { workflowRuns: 27, contactGrowthPct: 5, featuresUsed: 6 },
    owner: "Sinan",
    segments: ["healthcare"],
    timeline: [{ daysAgo: 60, label: "Renewed annually" }],
  },

  // --- Thriving / advocates ---
  {
    id: "a-summit-marketing",
    name: "Summit Marketing",
    healthBand: "thriving",
    healthScore: 88,
    lifecycleStage: "established",
    pipelineStage: "Expansion candidate",
    mrr: 3400,
    renewalInDays: 140,
    lastLoginDays: 1,
    adoption: { workflowRuns: 58, contactGrowthPct: 18, featuresUsed: 9 },
    owner: "Sinan",
    segments: ["agency", "high-mrr", "advocate"],
    timeline: [
      { daysAgo: 21, label: "Hit plan contact limit (warm upsell)" },
      { daysAgo: 4, label: "Referred a friend" },
    ],
  },
  {
    id: "a-evergreen-studio",
    name: "Evergreen Studio",
    healthBand: "thriving",
    healthScore: 84,
    lifecycleStage: "established",
    mrr: 1750,
    renewalInDays: 120,
    lastLoginDays: 1,
    adoption: { workflowRuns: 49, contactGrowthPct: 14, featuresUsed: 8 },
    owner: "Maya",
    segments: ["agency", "advocate"],
    timeline: [{ daysAgo: 30, label: "NPS 10 submitted" }],
  },

  // --- Onboarding ---
  {
    id: "a-bright-orbit",
    name: "Bright Orbit",
    healthBand: "watch",
    healthScore: 55,
    lifecycleStage: "onboarding",
    pipelineStage: "Onboarding",
    mrr: 540,
    renewalInDays: 88,
    lastLoginDays: 6,
    adoption: { workflowRuns: 3, contactGrowthPct: 0, featuresUsed: 2 },
    owner: "Auto",
    segments: ["agency"],
    timeline: [
      { daysAgo: 18, label: "Signed up" },
      { daysAgo: 14, label: "Imported contacts" },
      { daysAgo: 6, label: "Stalled on connecting domain" },
    ],
  },
  {
    id: "a-harborline-legal",
    name: "Harborline Legal",
    healthBand: "healthy",
    healthScore: 62,
    lifecycleStage: "onboarding",
    pipelineStage: "Onboarding",
    mrr: 920,
    renewalInDays: 92,
    lastLoginDays: 2,
    adoption: { workflowRuns: 7, contactGrowthPct: 0, featuresUsed: 4 },
    owner: "Sinan",
    segments: ["legal"],
    timeline: [
      { daysAgo: 12, label: "Signed up" },
      { daysAgo: 2, label: "First workflow live" },
    ],
  },

  // --- Reactivated ---
  {
    id: "a-westmount-tutoring",
    name: "Westmount Tutoring",
    healthBand: "healthy",
    healthScore: 60,
    lifecycleStage: "activated",
    reactivated: true,
    mrr: 460,
    renewalInDays: 80,
    lastLoginDays: 2,
    adoption: { workflowRuns: 9, contactGrowthPct: 3, featuresUsed: 4 },
    owner: "Maya",
    segments: ["education"],
    timeline: [
      { daysAgo: 120, label: "Churned" },
      { daysAgo: 14, label: "Reactivated on Starter" },
      { daysAgo: 2, label: "Last login" },
    ],
  },

  // --- Churned (excluded from most metrics; kept for completeness) ---
  {
    id: "a-old-river-collective",
    name: "Old River Collective",
    healthBand: "atrisk",
    healthScore: 0,
    lifecycleStage: "churned",
    mrr: 0,
    renewalInDays: -30,
    lastLoginDays: 75,
    adoption: { workflowRuns: 0, contactGrowthPct: 0, featuresUsed: 0 },
    owner: "Auto",
    segments: ["coaching"],
    timeline: [
      { daysAgo: 90, label: "Asked to pause" },
      { daysAgo: 30, label: "Cancelled" },
    ],
  },
];

// ============================================================
// PLAYBOOKS
// ============================================================

export const playbooks: Playbook[] = [
  {
    id: "pb-winback",
    icon: "user-minus",
    title: "Win back a customer who stopped logging in",
    problem: "An account has gone quiet — no logins in weeks.",
    does: "Reaches out with a personal nudge from the owner and offers a 15-minute reset call.",
    outcome: "Customer logs in again or tells us why they stopped.",
    watch: {
      summary: "Watches for accounts with no login in 14+ days",
      cadence: "Checks every morning",
      via: "Runs as an AI watch",
    },
    actions: [
      { icon: "mail", title: "Send a personal nudge", desc: "From the account owner, plain text.", on: true, supervised: true },
      { icon: "calendar", title: "Offer a 15-minute reset call", desc: "Booking link in the nudge.", on: true, supervised: false },
      { icon: "bell", title: "Alert the team if no reply in 3 days", desc: "Escalates to the owner.", on: true, supervised: false },
    ],
    proof: {
      drafts: [
        { channel: "Email", icon: "mail", preview: "Hey — noticed you haven't been in for a couple of weeks. Anything we can help unstick?" },
      ],
    },
    state: "on",
    videoLabel: "90-second explainer",
    match: (a) => a.lifecycleStage !== "churned" && a.lastLoginDays >= 14,
  },
  {
    id: "pb-failed-payment",
    icon: "credit-card",
    title: "Fix a failed payment before it churns",
    problem: "A card declined and the invoice is unpaid.",
    does: "Sends a polite reminder, retries the card, and pings the owner if it keeps failing.",
    outcome: "Payment recovers without the customer noticing.",
    watch: {
      summary: "Watches for invoices that failed in the last 7 days",
      cadence: "Checks hourly",
      via: "Runs as a HighLevel automation",
    },
    actions: [
      { icon: "mail", title: "Send dunning email", desc: "Branded, friendly tone.", on: true, supervised: false },
      { icon: "refresh-cw", title: "Retry the card after 48 hours", desc: "One retry, then escalate.", on: true, supervised: false },
      { icon: "bell", title: "Alert the team after 2 failures", desc: "Hands off to a human.", on: true, supervised: false },
    ],
    proof: {
      drafts: [
        { channel: "Email", icon: "mail", preview: "Quick heads-up — your last payment didn't go through. Mind updating your card here?" },
      ],
    },
    state: "on",
    videoLabel: "60-second explainer",
    // Proxy: at-risk accounts with very recent timeline events that mention payment.
    match: (a) =>
      a.lifecycleStage !== "churned" &&
      a.timeline.some((t) => /payment|card|invoice|dunning/i.test(t.label)),
  },
  {
    id: "pb-rescue-onboarding",
    icon: "rocket",
    title: "Rescue a stalled onboarding",
    problem: "A new account got stuck mid-setup.",
    does: "Offers a 1:1 setup session and walks them past the step they're stuck on.",
    outcome: "Account finishes setup and sends their first campaign.",
    watch: {
      summary: "Watches onboarding accounts that haven't moved a step in 5+ days",
      cadence: "Checks daily",
      via: "Runs as an AI watch",
    },
    actions: [
      { icon: "mail", title: "Send a 'need a hand?' email", desc: "Names the exact step they're stuck on.", on: true, supervised: true },
      { icon: "calendar", title: "Offer a 1:1 setup session", desc: "30-minute slot, owner-hosted.", on: true, supervised: false },
      { icon: "bell", title: "Alert owner after 2 days of silence", desc: "Owner takes it from here.", on: false, supervised: false },
    ],
    proof: {
      drafts: [
        { channel: "Email", icon: "mail", preview: "Looks like you got stuck on connecting your domain — want me to walk you through it tomorrow?" },
      ],
    },
    state: "ranonce",
    videoLabel: "90-second explainer",
    match: (a) => a.lifecycleStage === "onboarding" && a.lastLoginDays >= 5,
  },
  {
    id: "pb-renewal-save",
    icon: "calendar-check",
    title: "Save an upcoming renewal",
    problem: "A paying account is renewing soon and the signals look shaky.",
    does: "Surfaces it to the owner with a one-page brief and queues a check-in.",
    outcome: "Owner runs the save before the renewal date.",
    watch: {
      summary: "Watches accounts renewing in the next 30 days with health below 60",
      cadence: "Checks daily",
      via: "Runs as an AI watch",
    },
    actions: [
      { icon: "file-text", title: "Draft a renewal brief", desc: "What changed, what to say.", on: true, supervised: true },
      { icon: "phone", title: "Queue a check-in call", desc: "Owner-led, 15 minutes.", on: true, supervised: false },
      { icon: "tag", title: "Offer a 1-month extension if needed", desc: "Only if you approve.", on: false, supervised: true },
    ],
    proof: {
      drafts: [
        { channel: "Internal", icon: "file-text", preview: "Renewal brief: 3 reasons engagement dropped + the ask for the call." },
      ],
    },
    state: "on",
    videoLabel: "2-minute explainer",
    match: (a) =>
      a.lifecycleStage !== "churned" &&
      a.renewalInDays > 0 &&
      a.renewalInDays <= 30 &&
      a.healthScore < 60,
  },
  {
    id: "pb-expansion",
    icon: "trending-up",
    title: "Spot a customer ready to expand",
    problem: "A thriving account is hitting limits and could upgrade.",
    does: "Sends a soft upsell prompt and asks the owner to follow up.",
    outcome: "An expansion conversation gets booked.",
    watch: {
      summary: "Watches thriving accounts with high adoption and growing contacts",
      cadence: "Checks weekly",
      via: "Runs as an AI watch",
    },
    actions: [
      { icon: "mail", title: "Send a soft upsell prompt", desc: "References what they're already doing well.", on: true, supervised: true },
      { icon: "user-plus", title: "Ask the owner to follow up", desc: "Adds it to the owner's queue.", on: true, supervised: false },
      { icon: "gift", title: "Offer a 14-day Pro trial", desc: "Only if you approve.", on: false, supervised: true },
    ],
    proof: {
      drafts: [
        { channel: "Email", icon: "mail", preview: "You're getting a lot out of automations — want a quick look at what Pro unlocks?" },
      ],
    },
    state: "off",
    videoLabel: "90-second explainer",
    match: (a) =>
      a.healthBand === "thriving" &&
      a.adoption.contactGrowthPct >= 10 &&
      a.adoption.featuresUsed >= 7,
  },
];

// ============================================================
// OUTCOMES — verified wins
// ============================================================

export const outcomes: Outcome[] = [
  { id: "o-1", accountName: "Paws & Claws Vet", action: "Failed-payment recovery", result: "Card updated, invoice paid", savedMrr: 980, daysAgo: 2 },
  { id: "o-2", accountName: "Coastline Realty", action: "Win-back nudge", result: "Owner logged back in and booked a call", savedMrr: 2100, daysAgo: 4 },
  { id: "o-3", accountName: "Mile High Fitness", action: "Onboarding rescue", result: "First automation activated", daysAgo: 6 },
  { id: "o-4", accountName: "This is Wellbeing", action: "Testimonial ask", result: "Customer submitted NPS 9 + quote", daysAgo: 9 },
  { id: "o-5", accountName: "Evergreen Studio", action: "Renewal save", result: "Renewed annually + added seat", savedMrr: 1750, daysAgo: 14 },
  { id: "o-6", accountName: "Westmount Tutoring", action: "Reactivation offer", result: "Reactivated on Starter plan", savedMrr: 460, daysAgo: 17 },
];

// ============================================================
// ONBOARDING PROGRESS
// ============================================================

const onboardingTemplate = [
  "Connect domain",
  "Import contacts",
  "Send first campaign",
  "Invite teammate",
  "Activate first automation",
];

export const onboardingProgress: OnboardingProgress[] = [
  {
    accountId: "a-bright-orbit",
    accountName: "Bright Orbit",
    startedDaysAgo: 18,
    steps: [
      { label: onboardingTemplate[0], done: false },
      { label: onboardingTemplate[1], done: true },
      { label: onboardingTemplate[2], done: false },
      { label: onboardingTemplate[3], done: false },
      { label: onboardingTemplate[4], done: false },
    ],
    stalledStepIndex: 0,
  },
  {
    accountId: "a-harborline-legal",
    accountName: "Harborline Legal",
    startedDaysAgo: 12,
    steps: [
      { label: onboardingTemplate[0], done: true },
      { label: onboardingTemplate[1], done: true },
      { label: onboardingTemplate[2], done: true },
      { label: onboardingTemplate[3], done: false },
      { label: onboardingTemplate[4], done: true },
    ],
  },
];

// ============================================================
// MONEY
// ============================================================

function deriveMoney(): MoneySnapshot {
  const live = accounts.filter((a) => a.lifecycleStage !== "churned");
  const mrr = live.reduce((sum, a) => sum + a.mrr, 0);

  const planBuckets: Record<string, { accounts: number; mrr: number }> = {
    Starter: { accounts: 0, mrr: 0 },
    Growth: { accounts: 0, mrr: 0 },
    Pro: { accounts: 0, mrr: 0 },
  };
  for (const a of live) {
    const plan = a.mrr >= 2000 ? "Pro" : a.mrr >= 900 ? "Growth" : "Starter";
    planBuckets[plan].accounts += 1;
    planBuckets[plan].mrr += a.mrr;
  }

  return {
    mrr,
    nrrPct: 108,
    grossMarginPct: 74,
    planMix: Object.entries(planBuckets).map(([plan, v]) => ({
      plan,
      accounts: v.accounts,
      mrr: v.mrr,
    })),
  };
}

export const money: MoneySnapshot = deriveMoney();

// ============================================================
// SELECTORS — derive counts; never hardcode
// ============================================================

const BAND_LABEL: Record<HealthBand, string> = {
  thriving: "Thriving",
  healthy: "Healthy",
  watch: "Watch",
  atrisk: "At risk",
};

export function bandLabel(band: HealthBand): string {
  return BAND_LABEL[band];
}

const BAND_RANK: Record<HealthBand, number> = {
  atrisk: 0,
  watch: 1,
  healthy: 2,
  thriving: 3,
};

/** Accounts excluding churned (most rollups should use this). */
export function liveAccounts(source: Account[] = accounts): Account[] {
  return source.filter((a) => a.lifecycleStage !== "churned");
}

export function matchingAccounts(playbook: Playbook, source: Account[] = accounts): Account[] {
  return liveAccounts(source).filter(playbook.match);
}

export function playbookMatchCount(playbook: Playbook, source: Account[] = accounts): number {
  return matchingAccounts(playbook, source).length;
}

/**
 * Sort accounts most-urgent-first: at-risk/watch first, then by soonest
 * upcoming renewal, then by lowest health score.
 */
export function byUrgency(source: Account[] = accounts): Account[] {
  const renewalKey = (a: Account) =>
    a.renewalInDays >= 0 ? a.renewalInDays : Number.POSITIVE_INFINITY;
  return [...liveAccounts(source)].sort((a, b) => {
    const band = BAND_RANK[a.healthBand] - BAND_RANK[b.healthBand];
    if (band !== 0) return band;
    const ren = renewalKey(a) - renewalKey(b);
    if (ren !== 0) return ren;
    return a.healthScore - b.healthScore;
  });
}

export function accountsByBand(band: HealthBand, source: Account[] = accounts): Account[] {
  return liveAccounts(source).filter((a) => a.healthBand === band);
}

export function accountsByStage(stage: LifecycleStage, source: Account[] = accounts): Account[] {
  return source.filter((a) => a.lifecycleStage === stage);
}

export function findAccount(id: string): Account | undefined {
  return accounts.find((a) => a.id === id);
}

export function findPlaybook(id: string): Playbook | undefined {
  return playbooks.find((p) => p.id === id);
}

// --- Derived cohort sizes (used by Money + Today) ---

/** Accounts whose timeline mentions a recent failed payment / declined card. */
export function failedPaymentAccounts(source: Account[] = accounts): Account[] {
  return liveAccounts(source).filter((a) =>
    a.timeline.some((t) => /failed|declined|dunning|card/i.test(t.label)),
  );
}

/** Accounts trending down: watch/at-risk with negative adoption growth. */
export function decliningAccounts(source: Account[] = accounts): Account[] {
  return liveAccounts(source).filter(
    (a) =>
      (a.healthBand === "watch" || a.healthBand === "atrisk") &&
      a.adoption.contactGrowthPct < 0,
  );
}

/** Thriving accounts that match the expansion playbook. */
export function upsellReadyAccounts(source: Account[] = accounts): Account[] {
  const expansion = findPlaybook("pb-expansion");
  return expansion ? matchingAccounts(expansion, source) : [];
}

/** Renewing in <=30 days AND below healthy. */
export function churnRiskAccounts(source: Account[] = accounts): Account[] {
  return liveAccounts(source).filter(
    (a) => a.renewalInDays > 0 && a.renewalInDays <= 30 && a.healthScore < 60,
  );
}

export interface MoneyCohorts {
  failedPayments: number;
  declining: number;
  upsellReady: number;
  churnRisk: number;
}

export function moneyCohorts(source: Account[] = accounts): MoneyCohorts {
  return {
    failedPayments: failedPaymentAccounts(source).length,
    declining: decliningAccounts(source).length,
    upsellReady: upsellReadyAccounts(source).length,
    churnRisk: churnRiskAccounts(source).length,
  };
}

/** Sum of MRR at risk = MRR of accounts renewing soon with weak health. */
export function mrrAtRisk(source: Account[] = accounts): number {
  return churnRiskAccounts(source).reduce((sum, a) => sum + a.mrr, 0);
}

/** Total live MRR across the book. */
export function totalMrr(source: Account[] = accounts): number {
  return liveAccounts(source).reduce((sum, a) => sum + a.mrr, 0);
}

export function totalAccounts(source: Account[] = accounts): number {
  return liveAccounts(source).length;
}

// --- Onboarding selectors ---

export function stalledOnboardings(): OnboardingProgress[] {
  return onboardingProgress.filter((o) => o.stalledStepIndex !== undefined);
}
