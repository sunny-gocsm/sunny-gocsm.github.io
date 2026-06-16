// Self-contained mock data for the Overview "Briefing" page.
// Do NOT derive anything here from subAccountsData — these values are the spec.

export type HealthBand = "thriving" | "healthy" | "watch" | "atrisk";
export type Confidence = "fact" | "projection" | "guess";
export type BriefingMode = "solo" | "team";

export interface SignalFactor {
  text: string;
  pillar: "pas" | "revenue" | "login" | "feedback";
  dir: "up" | "down";
}

export interface QueueSignal {
  id: string;
  band: HealthBand;
  account: string;
  mrr: number;
  story: string;
  conf: Confidence;
  confDetail?: string;
  saveWindow?: string;
  action: { label: string };
  /** Team-mode assignee shown in the exec slot. "Auto" = handled by GoCSM. */
  assignee?: string;
  factors: SignalFactor[];
}

export interface Vital {
  label: string;
  value: string;
  context?: string;
  delta?: { value: string; direction: "up" | "down" | "flat" | "bad-up" | "good-down" };
  tone?: "pos" | "neg" | null;
}

export interface BandTile {
  band: HealthBand;
  count: number;
  pct: number;
}

export interface TrendPoint {
  day: string; // e.g. "Day 1"
  score: number;
}

export interface MethodologyFactor {
  text: string;
  pillar: "pas" | "revenue" | "login" | "feedback";
  dir: "up" | "down";
}

export interface BriefingFixtures {
  isNewAgency: boolean;
  header: {
    ownerName: string;
    lastSync: string;
    syncState: "fresh" | "recent" | "stale";
  };
  digest: {
    line: string;
    sent: number;
    alerted: number;
    waiting: number;
  };
  queue: QueueSignal[];
  vitals: Vital[];
  problemCohorts: {
    id: string;
    label: string;
    count: number;
    assignee: string;
    note: string;
  }[];
  coldStart: { banner: string; cta: string };
  evidence: {
    score: number;
    band: HealthBand;
    distribution: BandTile[];
    trend: TrendPoint[];
    pillarWeights: { pas: number; revenue: number; login: number; feedback: number };
    factors: MethodologyFactor[];
  };
}

// --- 60-day declining trend, ~76 → 47, ~12 points ---
const TREND: TrendPoint[] = [
  { day: "Day 1", score: 76 },
  { day: "Day 6", score: 74 },
  { day: "Day 11", score: 72 },
  { day: "Day 16", score: 69 },
  { day: "Day 21", score: 66 },
  { day: "Day 26", score: 63 },
  { day: "Day 31", score: 60 },
  { day: "Day 36", score: 57 },
  { day: "Day 41", score: 54 },
  { day: "Day 46", score: 51 },
  { day: "Day 51", score: 49 },
  { day: "Day 60", score: 47 },
];

export const briefingFixtures: BriefingFixtures = {
  isNewAgency: false,
  header: {
    ownerName: "Karthik",
    lastSync: "this morning",
    syncState: "fresh",
  },
  digest: {
    line: "Overnight, GoCSM ran 12 plays across 8 playbooks and reached 47 customers for you.",
    sent: 47,
    alerted: 8,
    waiting: 3,
  },
  queue: [
    {
      id: "q1",
      band: "atrisk",
      account: "Organize Your Online Biz",
      mrr: 1639,
      story:
        "Gone dark 32 days. Renewal in 14 days. GoCSM sent a reminder, no reply.",
      conf: "fact",
      saveWindow: "Renewal in 14 days",
      action: { label: "Call today" },
      assignee: "Sinan",
      factors: [
        { text: "No login in 32 days", pillar: "login", dir: "down" },
        { text: "Reminder sent, no reply", pillar: "feedback", dir: "down" },
        { text: "Renewal in 14 days", pillar: "revenue", dir: "down" },
      ],
    },
    {
      id: "q2",
      band: "atrisk",
      account: "BadassLink",
      mrr: 890,
      story: "Payment failed 9 days ago. Dunning ran, still no card update.",
      conf: "fact",
      action: { label: "Call to fix" },
      assignee: "Auto",
      factors: [
        { text: "Payment failed 9 days ago", pillar: "revenue", dir: "down" },
        { text: "Dunning sequence completed, no resolution", pillar: "revenue", dir: "down" },
      ],
    },
    {
      id: "q3",
      band: "atrisk",
      account: "Modern Physio",
      mrr: 1190,
      story:
        "Domain moved off GoCSM 6 days ago, workflows switched off. Still paying — heading for the door.",
      conf: "projection",
      confDetail: "based on infra + usage signals",
      action: { label: "Call today" },
      assignee: "Sinan",
      factors: [
        { text: "Domain moved off GoCSM 6 days ago", pillar: "pas", dir: "down" },
        { text: "Workflows switched off", pillar: "pas", dir: "down" },
        { text: "Billing still active", pillar: "revenue", dir: "up" },
      ],
    },
    {
      id: "q4",
      band: "watch",
      account: "Lauren Fondriest",
      mrr: 540,
      story:
        "Recovering — owner logged in 2 days ago, score climbing. Now's the moment to engage.",
      conf: "fact",
      action: { label: "Send check-in" },
      assignee: "Maya",
      factors: [
        { text: "Logged in 2 days ago", pillar: "login", dir: "up" },
        { text: "Score trending up", pillar: "pas", dir: "up" },
      ],
    },
    {
      id: "q5",
      band: "thriving",
      account: "This is Wellbeing",
      mrr: 1290,
      story:
        "Crushing it. Conversations 3× last month. Perfect moment for a testimonial ask.",
      conf: "fact",
      action: { label: "Ask testimonial" },
      assignee: "Maya",
      factors: [
        { text: "Conversations 3× last month", pillar: "pas", dir: "up" },
        { text: "High feedback signal", pillar: "feedback", dir: "up" },
      ],
    },
  ],
  vitals: [
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
    },
    {
      label: "Agency health",
      value: "47",
      context: "60 days",
      delta: { value: "-38%", direction: "bad-up" },
      tone: "neg",
    },
  ],
  problemCohorts: [
    { id: "c1", label: "Payment failures", count: 6, assignee: "Auto", note: "Dunning in flight" },
    { id: "c2", label: "Renewals at risk (30d)", count: 8, assignee: "Sinan", note: "Calls queued" },
    { id: "c3", label: "Gone dark 30+ days", count: 11, assignee: "Maya", note: "Re-engage sequence" },
    { id: "c4", label: "Domain moved off platform", count: 2, assignee: "Sinan", note: "Urgent review" },
  ],
  coldStart: {
    banner:
      "Most agencies see fewer cancellations within 14 days of turning on these 3 playbooks.",
    cta: "Start setup",
  },
  evidence: {
    score: 47,
    band: "watch",
    distribution: [
      { band: "thriving", count: 135, pct: 6 },
      { band: "healthy", count: 455, pct: 21 },
      { band: "watch", count: 660, pct: 31 },
      { band: "atrisk", count: 912, pct: 42 },
    ],
    trend: TREND,
    pillarWeights: { pas: 50, revenue: 30, login: 5, feedback: 15 },
    factors: [
      { text: "Product Adoption below band (−18, biggest drag)", pillar: "pas", dir: "down" },
      { text: "Logins down 22% over 30 days", pillar: "login", dir: "down" },
      { text: "Revenue steady", pillar: "revenue", dir: "up" },
      { text: "Feedback fine", pillar: "feedback", dir: "up" },
    ],
  },
};
