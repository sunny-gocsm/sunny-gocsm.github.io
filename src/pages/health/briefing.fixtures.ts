// Self-contained mock data for the Overview "Briefing" page.
// Do not split this file. Do not derive from subAccountsData.

export type Band = "thriving" | "healthy" | "watch" | "atrisk";
export type Conf = "fact" | "projection" | "guess";

export interface SignalFactor {
  text: string;
  pillar?: "pas" | "revenue" | "login" | "feedback";
  dir?: "up" | "down" | "flat";
}

export interface BriefingSignal {
  id: string;
  band: Band;
  account: string;
  mrr: number;
  story: string;
  conf?: Conf;
  confDetail?: string;
  saveWindow?: string;
  actionLabel: string;
  assignee?: string; // shown in team mode
  factors: SignalFactor[];
}

export interface BriefingVital {
  label: string;
  value: string;
  context?: string;
  delta?: { value: string; direction: "up" | "down" | "flat" | "bad-up" | "good-down" };
  tone?: "neg" | "pos" | null;
}

export interface CohortCard {
  id: string;
  problem: string;
  count: number;
  delta?: { value: string; direction: "up" | "down" | "flat" | "bad-up" | "good-down" };
  actionLabel: string;
}

export interface EvidenceBandRow {
  band: Band;
  n: number;
  pct: number;
}

export interface TrendPoint {
  day: number;        // 0..59
  score: number;
}

export interface MethodologyFactor {
  text: string;
  pillar?: "pas" | "revenue" | "login" | "feedback";
  dir?: "up" | "down" | "flat";
}

// ─── Header / digest ──────────────────────────────────────────────────────────
export const header = {
  ownerName: "Karthik",
  lastSync: "this morning",
};

export const digest = {
  line: "Overnight, GoCSM ran 12 plays across 8 playbooks and reached 47 customers for you.",
  sent: 47,
  alerted: 8,
  waiting: 3,
};

// ─── Queue (5 SignalCards, worst-first) ───────────────────────────────────────
export const signals: BriefingSignal[] = [
  {
    id: "s1",
    band: "atrisk",
    account: "Organize Your Online Biz",
    mrr: 1639,
    story: "Gone dark 32 days. Renewal in 14 days. GoCSM sent a reminder, no reply.",
    saveWindow: "Renewal in 14 days",
    actionLabel: "Call today",
    assignee: "Sinan",
    factors: [
      { text: "No logins in 32 days", pillar: "login", dir: "down" },
      { text: "Renewal window opens in 14 days", pillar: "revenue", dir: "flat" },
      { text: "Reminder email unopened", pillar: "feedback", dir: "down" },
    ],
  },
  {
    id: "s2",
    band: "atrisk",
    account: "BadassLink",
    mrr: 890,
    story: "Payment failed 9 days ago. Dunning ran, still no card update.",
    conf: "fact",
    actionLabel: "Call to fix",
    assignee: "Auto",
    factors: [
      { text: "Payment failed 9 days ago", pillar: "revenue", dir: "down" },
      { text: "Dunning sequence complete, no response", pillar: "revenue", dir: "down" },
      { text: "Logins steady", pillar: "login", dir: "flat" },
    ],
  },
  {
    id: "s3",
    band: "atrisk",
    account: "Modern Physio",
    mrr: 1190,
    story: "Domain moved off GoCSM 6 days ago, workflows switched off. Still paying — heading for the door.",
    conf: "projection",
    confDetail: "based on infra + usage signals",
    actionLabel: "Call today",
    assignee: "Sinan",
    factors: [
      { text: "Domain DNS moved off GoCSM", pillar: "pas", dir: "down" },
      { text: "Active workflows dropped to 0", pillar: "pas", dir: "down" },
      { text: "Still paying — billing healthy", pillar: "revenue", dir: "flat" },
    ],
  },
  {
    id: "s4",
    band: "watch",
    account: "Lauren Fondriest",
    mrr: 540,
    story: "Recovering — owner logged in 2 days ago, score climbing. Now's the moment to engage.",
    conf: "fact",
    actionLabel: "Send check-in",
    assignee: "Maya",
    factors: [
      { text: "Owner logged in 2 days ago", pillar: "login", dir: "up" },
      { text: "Score climbing 8 pts in 7 days", pillar: "pas", dir: "up" },
      { text: "No open billing issues", pillar: "revenue", dir: "flat" },
    ],
  },
  {
    id: "s5",
    band: "thriving",
    account: "This is Wellbeing",
    mrr: 1290,
    story: "Crushing it. Conversations 3× last month. Perfect moment for a testimonial ask.",
    conf: "fact",
    actionLabel: "Ask testimonial",
    assignee: "Maya",
    factors: [
      { text: "Conversations 3× last month", pillar: "pas", dir: "up" },
      { text: "Owner logs in daily", pillar: "login", dir: "up" },
      { text: "Positive feedback in last NPS", pillar: "feedback", dir: "up" },
    ],
  },
];

// ─── Agency vitals (3 MetricCards) ────────────────────────────────────────────
export const vitals: BriefingVital[] = [
  {
    label: "MRR at risk",
    value: "$58,307",
    context: "90% of your MRR",
    tone: "neg",
  },
  {
    label: "Renewals next 30 days",
    value: "23",
    context: "8 at risk",
    tone: null,
  },
  {
    label: "Agency health",
    value: "47",
    context: "60 days",
    delta: { value: "38%", direction: "down" },
    tone: "neg",
  },


];

// ─── Cold start (gated by isNewAgency, default false) ─────────────────────────
export const isNewAgency = false;

export const coldStart = {
  banner: "Most agencies see fewer cancellations within 14 days of turning on these 3 playbooks.",
  ctaLabel: "Start setup",
  plays: [
    { name: "Churn Risk Alerts", benefit: "Catch at-risk accounts before they cancel", icon: "bell", tone: "neg" },
    { name: "Usage Nudges", benefit: "Re-engage customers who go quiet", icon: "mail", tone: "warn" },
    { name: "Renewal Playbook", benefit: "Automate renewal outreach 30 days out", icon: "calendar", tone: "login" },
  ] as const,
};

// ─── Team mode ────────────────────────────────────────────────────────────────
export const teamMember = {
  name: "Karthik",
  scope: 47, // accounts assigned
};

export const teamPulse = {
  title: "Team pulse",
  sub: "Today",
  load: { open: 38, due: 12, breach: 3 },
  members: [
    { name: "Sinan", stats: [{ v: 14, l: "open" }, { v: 2, l: "due", tone: "warn" }, { v: 1, l: "breach", tone: "neg" }] },
    { name: "Maya",  stats: [{ v: 11, l: "open" }, { v: 3, l: "due", tone: "warn" }, { v: 0, l: "breach" }] },
    { name: "Auto",  stats: [{ v: 13, l: "open" }, { v: 7, l: "due" }, { v: 2, l: "breach", tone: "neg" }] },
  ],
  escalations: [
    { text: "Modern Physio breached SLA — no owner action in 48h." },
    { text: "BadassLink dunning escalated to you by Auto." },
  ],
};

// ─── Team mode: "Act by problem" cohort cards ─────────────────────────────────
export const cohorts: (CohortCard & { mrrAtRisk: string; conf: Conf; confDetail?: string })[] = [
  {
    id: "c1",
    problem: "Payment failed, no card update",
    count: 14,
    mrrAtRisk: "$12,480",
    delta: { value: "+3", direction: "bad-up" },
    actionLabel: "Run dunning playbook",
    conf: "fact",
  },
  {
    id: "c2",
    problem: "Gone dark, renewal in 30 days",
    count: 9,
    mrrAtRisk: "$8,910",
    delta: { value: "+1", direction: "bad-up" },
    actionLabel: "Send re-engagement",
    conf: "projection",
    confDetail: "based on login + email signals",
  },
  {
    id: "c3",
    problem: "Logins down 50%+ in 30 days",
    count: 22,
    mrrAtRisk: "$19,640",
    delta: { value: "+5", direction: "bad-up" },
    actionLabel: "Trigger nudge sequence",
    conf: "fact",
  },
];

// ─── Layer 3: Evidence ────────────────────────────────────────────────────────
export const evidence = {
  agencyScore: 47,
  agencyBand: "watch" as Band,
  distribution: [
    { band: "thriving" as Band, n: 135, pct: 6 },
    { band: "healthy" as Band, n: 455, pct: 21 },
    { band: "watch" as Band, n: 660, pct: 31 },
    { band: "atrisk" as Band, n: 912, pct: 42 },
  ] satisfies EvidenceBandRow[],
  // 60-day declining series, ~12 sample points from ~76 → 47
  trend: [
    { day: 0, score: 76 },
    { day: 5, score: 74 },
    { day: 10, score: 71 },
    { day: 15, score: 69 },
    { day: 20, score: 66 },
    { day: 25, score: 63 },
    { day: 30, score: 60 },
    { day: 35, score: 57 },
    { day: 40, score: 54 },
    { day: 45, score: 52 },
    { day: 50, score: 50 },
    { day: 55, score: 48 },
    { day: 59, score: 47 },
  ] satisfies TrendPoint[],
  pillarWeights: { pas: 50, revenue: 30, login: 5, feedback: 15 },
  methodologyFactors: [
    { text: "Product Adoption below band (−18, biggest drag)", pillar: "pas", dir: "down" },
    { text: "Revenue steady", pillar: "revenue", dir: "flat" },
    { text: "Logins down 22% over 30 days", pillar: "login", dir: "down" },
    { text: "Feedback fine", pillar: "feedback", dir: "flat" },
  ] satisfies MethodologyFactor[],
};
