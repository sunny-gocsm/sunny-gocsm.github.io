// Fixtures v2 — unified, Signal-based Account model.
// Pure TS, no UI, no backend. Mock data only.
// Anchored to a fixed "today" so derived days are deterministic.

export const TODAY = new Date("2026-06-17T00:00:00Z");

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

export type ActivityStatus = "highly" | "moderately" | "low" | "ghosting";

export type AssetType =
  | "Workflow"
  | "Calendar"
  | "Opportunity"
  | "BusinessProfile"
  | "Phone"
  | "Email"
  | "WebsiteFunnel"
  | "Dashboard"
  | "Course"
  | "Community"
  | "Facebook"
  | "Reputation"
  | "Payment"
  | "CustomMenuLink";

export type OnboardingStepState =
  | "in_progress"
  | "verifying"
  | "needs_attention"
  | "waiting_on_agency"
  | "done";

export type CompletionSource = "auto" | "manual" | "agency_verified";

// ---------- Signal backbone ----------
export type SignalSubject =
  | "Domain"
  | "Phone"
  | "A2P"
  | "Funnel"
  | "Workflow"
  | "Login"
  | "Payment"
  | "NPS";

export interface Signal {
  id: string;
  accountId: string;
  subject: SignalSubject;
  type: "setup" | "usage";
  direction: "forward" | "reverse";
  sticky: boolean;
  weight: number;
  label: string;
  detectedAt: string; // ISO
  source: string;
}

// ---------- Account sub-objects ----------
export interface AccountIdentity {
  id: string;
  name: string;
  avatar: string;
  industry: string;
  plan: string;
  isNonSaaS: boolean;
  clientSince: string; // ISO date
  activeDays: number;
}

export interface AccountOwnership {
  owner: string;
  ownerStatus: "active" | "inactive" | "transferring";
  assignedCSM: string;
  teamSize: number;
}

export interface AccountStatus {
  enabled: "Enabled" | "Disabled";
  tracked: boolean;
  previouslyTracked: boolean;
  pendingStop: boolean;
  isPriority: boolean;
}

export interface AccountLifecycle {
  stage: LifecycleStage;
  reactivated: boolean;
}

export interface AccountPipeline {
  stage: string; // free string mirroring native HL
}

export interface PillarScores {
  productAdoption: number;
  revenue: number;
  login: number;
  sentiment: number;
}

export interface AccountHealth {
  score: number; // 0-100
  delta: number;
  band: HealthBand;
  trend90d: number[];
  pillarScores: PillarScores;
  riskSignals: string[];
  opportunities: string[];
}

export interface LoginUser {
  name: string;
  role: "owner" | "admin" | "user";
  keyUser: boolean;
  lastLogin: string; // ISO
  timeSpent: number; // minutes / 30d
  status: "active" | "inactive";
  history: { date: string; minutes: number }[];
}

export interface AccountLogin {
  activeUsers: number;
  totalLoggedInTime: number; // minutes / 30d
  lastLoginDaysAgo: number;
  activityStatus: ActivityStatus;
  users: LoginUser[];
}

export interface AdoptionFeature {
  name: string;
  assetCount: number;
  activeAssetCount: number;
  engagement: number; // 0-100
  timeSpent: number;
}

export interface AdoptionAsset {
  type: AssetType;
  id: string;
  name: string;
  accounts: string[];
  users: string[];
}

export interface AccountAdoption {
  features: AdoptionFeature[];
  assets: AdoptionAsset[];
  topFeatures: string[];
  underutilizedFeatures: string[];
}

export interface PaymentAttempt {
  date: string;
  amount: number;
  status: "succeeded" | "failed" | "pending";
  failureReason?: string;
}

export interface PlanChange {
  date: string;
  from: string;
  to: string;
  type: "upgrade" | "downgrade" | "reactivation" | "churn";
  mrrImpact: number;
}

export interface AccountRevenue {
  mrr: number;
  spendTrend: number; // signed %
  revenueHealth: "healthy" | "watch" | "atrisk";
  renewalDate: string; // ISO
  lastPaymentStatus: "succeeded" | "failed" | "pending";
  walletBalance: number;
  walletSpend30d: number;
  walletSpend90d: number;
  totalCost: number;
  margin: number; // signed
  paymentAttempts: PaymentAttempt[];
  planChanges: PlanChange[];
  riskTags: string[];
  arpa: number;
}

export interface FeedbackResponse {
  date: string;
  score: number;
  comment?: string;
}

export interface AccountFeedback {
  npsScore: number;
  sentiment: "positive" | "neutral" | "negative";
  promoters: number;
  passives: number;
  detractors: number;
  responses: FeedbackResponse[];
  lastFeedbackDate: string | null;
  widgetEnabled: boolean;
}

export interface OnboardingIntervention {
  type: string;
  days_ago: number;
  outcome: string;
}

export interface AccountOnboarding {
  journeyName: string;
  journeyVersion: string;
  steps_total: number;
  steps_done: number;
  pct_complete: number;
  current_step: string;
  current_step_state: OnboardingStepState;
  days_on_current_step: number;
  sla_days: number;
  stalled: boolean;
  blocked_by: "client" | "agency" | null;
  journey_started_days_ago: number;
  last_intervention: OnboardingIntervention | null;
  completionSource: CompletionSource;
}

export interface Account {
  identity: AccountIdentity;
  ownership: AccountOwnership;
  status: AccountStatus;
  lifecycle: AccountLifecycle;
  pipeline: AccountPipeline;
  health: AccountHealth;
  login: AccountLogin;
  adoption: AccountAdoption;
  revenue: AccountRevenue;
  feedback: AccountFeedback;
  onboarding: AccountOnboarding;
}

// ============================================================
// HELPERS
// ============================================================

const dayMs = 86_400_000;
const iso = (daysFromToday: number): string =>
  new Date(TODAY.getTime() + daysFromToday * dayMs).toISOString();

export function daysUntil(isoDate: string): number {
  return Math.round((Date.parse(isoDate) - TODAY.getTime()) / dayMs);
}

export function daysSince(isoDate: string): number {
  return Math.round((TODAY.getTime() - Date.parse(isoDate)) / dayMs);
}

export const bandLabel = (b: HealthBand): string =>
  b === "atrisk" ? "At risk" : b[0].toUpperCase() + b.slice(1);

// Reusable mini-factories to keep account literals readable.
const baseLogin = (
  active: number,
  lastDays: number,
  status: ActivityStatus,
  total = active * 120,
): AccountLogin => ({
  activeUsers: active,
  totalLoggedInTime: total,
  lastLoginDaysAgo: lastDays,
  activityStatus: status,
  users: Array.from({ length: Math.max(1, active) }, (_, i) => ({
    name: i === 0 ? "Owner" : `User ${i + 1}`,
    role: i === 0 ? "owner" : i === 1 ? "admin" : "user",
    keyUser: i === 0,
    lastLogin: iso(-lastDays - i),
    timeSpent: Math.max(5, Math.round(total / Math.max(1, active)) - i * 10),
    status: lastDays < 30 ? "active" : "inactive",
    history: [],
  })),
});

const baseAdoption = (
  features: { name: string; engagement: number }[],
  top: string[] = [],
  under: string[] = [],
): AccountAdoption => ({
  features: features.map((f) => ({
    name: f.name,
    assetCount: 3 + Math.round(f.engagement / 20),
    activeAssetCount: Math.round((3 + f.engagement / 20) * (f.engagement / 100)),
    engagement: f.engagement,
    timeSpent: f.engagement * 2,
  })),
  assets: [],
  topFeatures: top,
  underutilizedFeatures: under,
});

const emptyFeedback = (): AccountFeedback => ({
  npsScore: 0,
  sentiment: "neutral",
  promoters: 0,
  passives: 0,
  detractors: 0,
  responses: [],
  lastFeedbackDate: null,
  widgetEnabled: false,
});

const noOnboarding = (): AccountOnboarding => ({
  journeyName: "Standard",
  journeyVersion: "v1",
  steps_total: 8,
  steps_done: 8,
  pct_complete: 100,
  current_step: "Done",
  current_step_state: "done",
  days_on_current_step: 0,
  sla_days: 14,
  stalled: false,
  blocked_by: null,
  journey_started_days_ago: 120,
  last_intervention: null,
  completionSource: "auto",
});

const stalledOnb = (
  step: string,
  days: number,
  blocked: "client" | "agency",
  done = 4,
): AccountOnboarding => ({
  journeyName: "Standard",
  journeyVersion: "v1",
  steps_total: 8,
  steps_done: done,
  pct_complete: Math.round((done / 8) * 100),
  current_step: step,
  current_step_state: "needs_attention",
  days_on_current_step: days,
  sla_days: 5,
  stalled: true,
  blocked_by: blocked,
  journey_started_days_ago: days + done * 3,
  last_intervention: { type: "email", days_ago: Math.max(1, days - 2), outcome: "no reply" },
  completionSource: "manual",
});

// ============================================================
// ACCOUNTS — ~20 spanning every stage / band / renewal window
// ============================================================

interface Seed {
  id: string;
  name: string;
  industry: string;
  plan: string;
  isNonSaaS?: boolean;
  clientSinceDays: number;
  owner: string;
  csm: string;
  enabled?: "Enabled" | "Disabled";
  tracked?: boolean;
  pendingStop?: boolean;
  priority?: boolean;
  stage: LifecycleStage;
  reactivated?: boolean;
  pipeline: string;
  score: number;
  band: HealthBand;
  delta: number;
  pillars: PillarScores;
  riskSignals?: string[];
  opportunities?: string[];
  loginDays: number;
  activeUsers: number;
  activity: ActivityStatus;
  features: { name: string; engagement: number }[];
  top?: string[];
  under?: string[];
  mrr: number;
  spendTrend: number;
  renewalInDays: number;
  lastPayment?: "succeeded" | "failed" | "pending";
  margin: number;
  paymentAttempts?: PaymentAttempt[];
  planChanges?: PlanChange[];
  riskTags?: string[];
  nps?: number;
  sentiment?: "positive" | "neutral" | "negative";
  onb?: AccountOnboarding;
}

const seeds: Seed[] = [
  // ----- AT-RISK / urgent renewals -----
  {
    id: "a-modern-physio", name: "Modern Physio", industry: "Healthcare", plan: "Pro",
    clientSinceDays: 540, owner: "Sinan", csm: "Sinan", priority: true,
    stage: "lapsing", pipeline: "Retention review",
    score: 28, band: "atrisk", delta: -12,
    pillars: { productAdoption: 30, revenue: 40, login: 15, sentiment: 25 },
    riskSignals: ["Logins collapsed", "Cancelled SMS add-on"],
    loginDays: 21, activeUsers: 2, activity: "low",
    features: [{ name: "Workflow", engagement: 22 }, { name: "Calendar", engagement: 35 }],
    mrr: 2400, spendTrend: -18, renewalInDays: 6, margin: 38,
    riskTags: ["renewal-urgent"],
  },
  {
    id: "a-badasslink", name: "Brightlink Media", industry: "Agency", plan: "Pro",
    clientSinceDays: 380, owner: "Maya", csm: "Maya",
    stage: "lapsing", pipeline: "Save",
    score: 22, band: "atrisk", delta: -9,
    pillars: { productAdoption: 25, revenue: 18, login: 35, sentiment: 20 },
    riskSignals: ["Card declined", "Dunning ignored"],
    loginDays: 14, activeUsers: 1, activity: "low",
    features: [{ name: "Email", engagement: 30 }, { name: "Workflow", engagement: 18 }],
    mrr: 1850, spendTrend: -10, renewalInDays: 11, lastPayment: "failed", margin: 22,
    paymentAttempts: [
      { date: iso(-45), amount: 1850, status: "failed", failureReason: "card_declined" },
      { date: iso(-30), amount: 1850, status: "failed", failureReason: "card_declined" },
    ],
    riskTags: ["failed-payment"],
  },
  {
    id: "a-organize-online-biz", name: "Organize Your Online Biz", industry: "Coaching", plan: "Starter",
    clientSinceDays: 290, owner: "Auto", csm: "Maya",
    stage: "dormant", pipeline: "At risk",
    score: 31, band: "atrisk", delta: -6,
    pillars: { productAdoption: 20, revenue: 45, login: 10, sentiment: 50 },
    riskSignals: ["No campaigns in 50 days"],
    loginDays: 34, activeUsers: 1, activity: "ghosting",
    features: [{ name: "Email", engagement: 12 }],
    mrr: 1200, spendTrend: -22, renewalInDays: 9, margin: 30,
  },
  {
    id: "a-cedar-clinic", name: "Cedar Clinic", industry: "Healthcare", plan: "Pro",
    clientSinceDays: 410, owner: "Sinan", csm: "Sinan",
    stage: "lapsing", pipeline: "Save",
    score: 35, band: "atrisk", delta: -4,
    pillars: { productAdoption: 35, revenue: 50, login: 25, sentiment: 30 },
    riskSignals: ["A2P registration lapsed"],
    loginDays: 18, activeUsers: 2, activity: "low",
    features: [{ name: "Phone", engagement: 20 }, { name: "Calendar", engagement: 40 }],
    mrr: 1600, spendTrend: -8, renewalInDays: 27, margin: 28,
  },

  // ----- WATCH -----
  {
    id: "a-greenfield-partners", name: "Greenfield Partners", industry: "Real estate", plan: "Pro",
    clientSinceDays: 720, owner: "Sinan", csm: "Sinan",
    stage: "lapsing", pipeline: "Check-in",
    score: 48, band: "watch", delta: -3,
    pillars: { productAdoption: 50, revenue: 60, login: 45, sentiment: 40 },
    loginDays: 9, activeUsers: 3, activity: "moderately",
    features: [{ name: "Opportunity", engagement: 55 }, { name: "Workflow", engagement: 40 }],
    mrr: 3100, spendTrend: -4, renewalInDays: 22, margin: 41,
  },
  {
    id: "a-lauren-fondriest", name: "Lauren Fondriest", industry: "Coaching", plan: "Starter",
    clientSinceDays: 220, owner: "Maya", csm: "Maya",
    stage: "activated", pipeline: "Adopt",
    score: 54, band: "watch", delta: 1,
    pillars: { productAdoption: 55, revenue: 60, login: 50, sentiment: 55 },
    loginDays: 7, activeUsers: 2, activity: "moderately",
    features: [{ name: "Workflow", engagement: 50 }, { name: "Email", engagement: 45 }],
    mrr: 780, spendTrend: 2, renewalInDays: 41, margin: 36,
  },
  {
    id: "a-northside-dental", name: "Northside Dental", industry: "Healthcare", plan: "Pro",
    clientSinceDays: 900, owner: "Sinan", csm: "Sinan",
    stage: "established", pipeline: "Quarterly review",
    score: 51, band: "watch", delta: -1,
    pillars: { productAdoption: 55, revenue: 65, login: 45, sentiment: 50 },
    loginDays: 11, activeUsers: 4, activity: "moderately",
    features: [{ name: "Calendar", engagement: 65 }, { name: "Reputation", engagement: 40 }],
    mrr: 1450, spendTrend: 1, renewalInDays: 60, margin: 44,
  },

  // ----- HEALTHY -----
  {
    id: "a-this-is-wellbeing", name: "This is Wellbeing", industry: "Coaching", plan: "Pro",
    clientSinceDays: 640, owner: "Maya", csm: "Maya",
    stage: "established", pipeline: "Advocate",
    score: 72, band: "healthy", delta: 4,
    pillars: { productAdoption: 75, revenue: 70, login: 78, sentiment: 80 },
    opportunities: ["Testimonial-ready"],
    loginDays: 1, activeUsers: 4, activity: "highly",
    features: [{ name: "Workflow", engagement: 78 }, { name: "Email", engagement: 70 }],
    top: ["Workflow", "Email"],
    mrr: 1650, spendTrend: 6, renewalInDays: 95, margin: 52,
    nps: 9, sentiment: "positive",
  },
  {
    id: "a-coastline-realty", name: "Coastline Realty", industry: "Real estate", plan: "Pro",
    clientSinceDays: 510, owner: "Sinan", csm: "Sinan",
    stage: "established", pipeline: "Renew",
    score: 68, band: "healthy", delta: 2,
    pillars: { productAdoption: 70, revenue: 72, login: 68, sentiment: 65 },
    loginDays: 2, activeUsers: 5, activity: "highly",
    features: [{ name: "Opportunity", engagement: 72 }, { name: "WebsiteFunnel", engagement: 60 }],
    mrr: 2100, spendTrend: 5, renewalInDays: 73, margin: 48,
  },
  {
    id: "a-mile-high-fitness", name: "Mile High Fitness", industry: "Fitness", plan: "Starter",
    clientSinceDays: 180, owner: "Maya", csm: "Maya",
    stage: "activated", pipeline: "Adopt",
    score: 66, band: "healthy", delta: 3,
    pillars: { productAdoption: 65, revenue: 60, login: 70, sentiment: 70 },
    loginDays: 3, activeUsers: 2, activity: "highly",
    features: [{ name: "Workflow", engagement: 62 }, { name: "Calendar", engagement: 70 }],
    mrr: 690, spendTrend: 8, renewalInDays: 51, margin: 40,
  },
  {
    id: "a-paws-and-claws", name: "Paws & Claws Vet", industry: "Healthcare", plan: "Starter",
    clientSinceDays: 480, owner: "Sinan", csm: "Sinan",
    stage: "established", pipeline: "Renew",
    score: 64, band: "healthy", delta: 0,
    pillars: { productAdoption: 60, revenue: 65, login: 70, sentiment: 62 },
    loginDays: 4, activeUsers: 3, activity: "moderately",
    features: [{ name: "Calendar", engagement: 70 }, { name: "Reputation", engagement: 55 }],
    mrr: 980, spendTrend: 3, renewalInDays: 110, margin: 45,
  },
  {
    id: "a-harborline-legal", name: "Harborline Legal", industry: "Legal", plan: "Pro",
    clientSinceDays: 95, owner: "Sinan", csm: "Sinan",
    stage: "onboarding", pipeline: "Onboarding",
    score: 62, band: "healthy", delta: 5,
    pillars: { productAdoption: 55, revenue: 60, login: 70, sentiment: 65 },
    loginDays: 2, activeUsers: 2, activity: "moderately",
    features: [{ name: "Workflow", engagement: 55 }, { name: "Email", engagement: 60 }],
    mrr: 920, spendTrend: 0, renewalInDays: 92, margin: 38,
    onb: {
      journeyName: "Standard", journeyVersion: "v1",
      steps_total: 8, steps_done: 6, pct_complete: 75,
      current_step: "First workflow live", current_step_state: "verifying",
      days_on_current_step: 2, sla_days: 5, stalled: false, blocked_by: null,
      journey_started_days_ago: 12, last_intervention: null, completionSource: "agency_verified",
    },
  },

  // ----- THRIVING / advocates -----
  {
    id: "a-summit-marketing", name: "Summit Marketing", industry: "Agency", plan: "Pro+",
    clientSinceDays: 820, owner: "Sinan", csm: "Sinan",
    stage: "established", pipeline: "Expansion",
    score: 88, band: "thriving", delta: 6,
    pillars: { productAdoption: 90, revenue: 85, login: 92, sentiment: 88 },
    opportunities: ["Plan cap hit — upsell"],
    loginDays: 1, activeUsers: 8, activity: "highly",
    features: [{ name: "Workflow", engagement: 92 }, { name: "Opportunity", engagement: 88 }],
    top: ["Workflow", "Opportunity", "WebsiteFunnel"],
    mrr: 3400, spendTrend: 14, renewalInDays: 140, margin: 58,
    nps: 10, sentiment: "positive",
  },
  {
    id: "a-evergreen-studio", name: "Evergreen Studio", industry: "Agency", plan: "Pro",
    clientSinceDays: 700, owner: "Maya", csm: "Maya",
    stage: "established", pipeline: "Advocate",
    score: 84, band: "thriving", delta: 3,
    pillars: { productAdoption: 85, revenue: 80, login: 88, sentiment: 85 },
    loginDays: 1, activeUsers: 6, activity: "highly",
    features: [{ name: "WebsiteFunnel", engagement: 86 }, { name: "Workflow", engagement: 82 }],
    mrr: 1750, spendTrend: 9, renewalInDays: 120, margin: 55,
    nps: 10, sentiment: "positive",
  },

  // ----- ONBOARDING (one stalled, one healthy, one waiting on agency) -----
  {
    id: "a-bright-orbit", name: "Bright Orbit", industry: "Agency", plan: "Starter",
    clientSinceDays: 18, owner: "Auto", csm: "Maya",
    stage: "onboarding", pipeline: "Onboarding",
    score: 45, band: "watch", delta: -2,
    pillars: { productAdoption: 30, revenue: 60, login: 50, sentiment: 40 },
    riskSignals: ["Stalled on domain"],
    loginDays: 6, activeUsers: 1, activity: "low",
    features: [{ name: "Email", engagement: 25 }],
    mrr: 540, spendTrend: 0, renewalInDays: 88, margin: 28,
    onb: stalledOnb("Connect domain", 7, "client", 3),
  },
  {
    id: "a-northpoint-creative", name: "Northpoint Creative", industry: "Agency", plan: "Pro",
    clientSinceDays: 22, owner: "Sinan", csm: "Sinan",
    stage: "onboarding", pipeline: "Onboarding",
    score: 50, band: "watch", delta: 0,
    pillars: { productAdoption: 40, revenue: 65, login: 55, sentiment: 50 },
    riskSignals: ["A2P waiting on agency"],
    loginDays: 5, activeUsers: 2, activity: "moderately",
    features: [{ name: "Phone", engagement: 30 }],
    mrr: 1100, spendTrend: 0, renewalInDays: 88, margin: 32,
    onb: stalledOnb("A2P registration", 9, "agency", 4),
  },

  // ----- REACTIVATED -----
  {
    id: "a-westmount-tutoring", name: "Westmount Tutoring", industry: "Education", plan: "Starter",
    clientSinceDays: 360, owner: "Maya", csm: "Maya", reactivated: true,
    stage: "activated", pipeline: "Adopt",
    score: 60, band: "healthy", delta: 8,
    pillars: { productAdoption: 55, revenue: 60, login: 70, sentiment: 60 },
    loginDays: 2, activeUsers: 2, activity: "moderately",
    features: [{ name: "Calendar", engagement: 55 }, { name: "Email", engagement: 50 }],
    mrr: 460, spendTrend: 12, renewalInDays: 80, margin: 35,
    planChanges: [
      { date: iso(-120), from: "Starter", to: "—", type: "churn", mrrImpact: -460 },
      { date: iso(-14), from: "—", to: "Starter", type: "reactivation", mrrImpact: 460 },
    ],
  },

  // ----- DORMANT / non-SaaS / disabled / churned -----
  {
    id: "a-quiet-lane-studio", name: "Quiet Lane Studio", industry: "Creative", plan: "Starter",
    isNonSaaS: true,
    clientSinceDays: 540, owner: "Maya", csm: "Maya",
    stage: "dormant", pipeline: "Dormant",
    score: 38, band: "atrisk", delta: -5,
    pillars: { productAdoption: 20, revenue: 35, login: 15, sentiment: 60 },
    loginDays: 52, activeUsers: 1, activity: "ghosting",
    features: [{ name: "WebsiteFunnel", engagement: 18 }],
    mrr: 0, spendTrend: -30, renewalInDays: 180, margin: -5,
    riskTags: ["non-saas-dormant"],
  },
  {
    id: "a-old-river-collective", name: "Old River Collective", industry: "Coaching", plan: "Starter",
    clientSinceDays: 420, owner: "Auto", csm: "Maya",
    enabled: "Disabled", tracked: false,
    stage: "churned", pipeline: "Churned",
    score: 0, band: "atrisk", delta: 0,
    pillars: { productAdoption: 0, revenue: 0, login: 0, sentiment: 0 },
    loginDays: 75, activeUsers: 0, activity: "ghosting",
    features: [],
    mrr: 0, spendTrend: 0, renewalInDays: -30, margin: 0,
  },
  {
    id: "a-tidewater-spa", name: "Tidewater Spa", industry: "Wellness", plan: "Pro",
    clientSinceDays: 300, owner: "Sinan", csm: "Sinan",
    pendingStop: true,
    stage: "lapsing", pipeline: "Save",
    score: 33, band: "atrisk", delta: -7,
    pillars: { productAdoption: 30, revenue: 45, login: 25, sentiment: 30 },
    riskSignals: ["Funnel disconnected"],
    loginDays: 19, activeUsers: 1, activity: "low",
    features: [{ name: "WebsiteFunnel", engagement: 20 }, { name: "Calendar", engagement: 35 }],
    mrr: 1350, spendTrend: -15, renewalInDays: 16, margin: 25,
  },
];

function buildAccount(s: Seed): Account {
  return {
    identity: {
      id: s.id, name: s.name, avatar: s.name.slice(0, 2).toUpperCase(),
      industry: s.industry, plan: s.plan, isNonSaaS: !!s.isNonSaaS,
      clientSince: iso(-s.clientSinceDays), activeDays: Math.max(0, s.clientSinceDays - 7),
    },
    ownership: {
      owner: s.owner, ownerStatus: "active", assignedCSM: s.csm, teamSize: Math.max(1, s.activeUsers),
    },
    status: {
      enabled: s.enabled ?? "Enabled",
      tracked: s.tracked ?? (s.enabled !== "Disabled"),
      previouslyTracked: true,
      pendingStop: !!s.pendingStop,
      isPriority: !!s.priority,
    },
    lifecycle: { stage: s.stage, reactivated: !!s.reactivated },
    pipeline: { stage: s.pipeline },
    health: {
      score: s.score, delta: s.delta, band: s.band,
      trend90d: Array.from({ length: 12 }, (_, i) =>
        Math.max(0, Math.min(100, s.score - s.delta + Math.round((s.delta * i) / 11))),
      ),
      pillarScores: s.pillars,
      riskSignals: s.riskSignals ?? [],
      opportunities: s.opportunities ?? [],
    },
    login: baseLogin(s.activeUsers, s.loginDays, s.activity),
    adoption: baseAdoption(s.features, s.top, s.under),
    revenue: {
      mrr: s.mrr,
      spendTrend: s.spendTrend,
      revenueHealth: s.mrr === 0 ? "atrisk" : s.band === "atrisk" ? "atrisk" : s.band === "watch" ? "watch" : "healthy",
      renewalDate: iso(s.renewalInDays),
      lastPaymentStatus: s.lastPayment ?? "succeeded",
      walletBalance: Math.round(s.mrr * 0.4),
      walletSpend30d: Math.round(s.mrr * 0.6),
      walletSpend90d: Math.round(s.mrr * 1.7),
      totalCost: Math.round(s.mrr * (1 - s.margin / 100)),
      margin: s.margin,
      paymentAttempts: s.paymentAttempts ?? [],
      planChanges: s.planChanges ?? [],
      riskTags: s.riskTags ?? [],
      arpa: s.mrr,
    },
    feedback: s.nps != null
      ? {
          npsScore: s.nps, sentiment: s.sentiment ?? "neutral",
          promoters: s.nps >= 9 ? 1 : 0, passives: s.nps >= 7 && s.nps <= 8 ? 1 : 0,
          detractors: s.nps <= 6 ? 1 : 0,
          responses: [{ date: iso(-30), score: s.nps }],
          lastFeedbackDate: iso(-30), widgetEnabled: true,
        }
      : emptyFeedback(),
    onboarding: s.onb ?? (s.stage === "onboarding"
      ? { ...noOnboarding(), steps_done: 5, pct_complete: 62, current_step: "Imports", current_step_state: "in_progress", stalled: false, journey_started_days_ago: 14 }
      : noOnboarding()),
  };
}

export const accounts: Account[] = seeds.map(buildAccount);

// ============================================================
// SIGNALS — seed history with reverse-on-sticky-setup cases
// ============================================================

interface SeedSignal {
  accountId: string;
  subject: SignalSubject;
  type: "setup" | "usage";
  direction: "forward" | "reverse";
  sticky: boolean;
  weight: number;
  label: string;
  daysAgo: number;
  source?: string;
}

const seedSignals: SeedSignal[] = [
  // Sticky setups gained (forward) then lost (reverse) — the "lost sticky setup" cohort
  { accountId: "a-cedar-clinic", subject: "A2P", type: "setup", direction: "forward", sticky: true, weight: 8, label: "A2P registration approved", daysAgo: 200 },
  { accountId: "a-cedar-clinic", subject: "A2P", type: "setup", direction: "reverse", sticky: true, weight: 9, label: "A2P registration lapsed", daysAgo: 9 },

  { accountId: "a-tidewater-spa", subject: "Funnel", type: "setup", direction: "forward", sticky: true, weight: 7, label: "Funnel connected", daysAgo: 180 },
  { accountId: "a-tidewater-spa", subject: "Funnel", type: "setup", direction: "reverse", sticky: true, weight: 8, label: "Funnel disconnected", daysAgo: 5 },

  { accountId: "a-bright-orbit", subject: "Domain", type: "setup", direction: "forward", sticky: true, weight: 6, label: "Domain verification started", daysAgo: 14 },
  { accountId: "a-bright-orbit", subject: "Domain", type: "setup", direction: "reverse", sticky: true, weight: 7, label: "Domain verification failed", daysAgo: 6 },

  // Forward setups (healthy accounts)
  { accountId: "a-summit-marketing", subject: "Domain", type: "setup", direction: "forward", sticky: true, weight: 5, label: "Domain connected", daysAgo: 800 },
  { accountId: "a-summit-marketing", subject: "A2P", type: "setup", direction: "forward", sticky: true, weight: 8, label: "A2P approved", daysAgo: 700 },
  { accountId: "a-this-is-wellbeing", subject: "Workflow", type: "setup", direction: "forward", sticky: false, weight: 4, label: "First workflow live", daysAgo: 500 },
  { accountId: "a-evergreen-studio", subject: "Funnel", type: "setup", direction: "forward", sticky: true, weight: 5, label: "Funnel connected", daysAgo: 600 },
  { accountId: "a-harborline-legal", subject: "Workflow", type: "setup", direction: "forward", sticky: false, weight: 3, label: "First workflow live", daysAgo: 2 },

  // Payment signals
  { accountId: "a-badasslink", subject: "Payment", type: "usage", direction: "reverse", sticky: false, weight: 9, label: "Card declined", daysAgo: 45 },
  { accountId: "a-badasslink", subject: "Payment", type: "usage", direction: "reverse", sticky: false, weight: 9, label: "Second payment failure", daysAgo: 30 },
  { accountId: "a-modern-physio", subject: "Payment", type: "usage", direction: "reverse", sticky: false, weight: 4, label: "Cancelled SMS add-on", daysAgo: 28 },

  // Login signals
  { accountId: "a-modern-physio", subject: "Login", type: "usage", direction: "reverse", sticky: false, weight: 5, label: "Login frequency dropped", daysAgo: 60 },
  { accountId: "a-organize-online-biz", subject: "Login", type: "usage", direction: "reverse", sticky: false, weight: 6, label: "No login in 30+ days", daysAgo: 34 },
  { accountId: "a-quiet-lane-studio", subject: "Login", type: "usage", direction: "reverse", sticky: false, weight: 6, label: "No login in 50+ days", daysAgo: 52 },

  // NPS
  { accountId: "a-this-is-wellbeing", subject: "NPS", type: "usage", direction: "forward", sticky: false, weight: 4, label: "NPS 9 submitted", daysAgo: 30 },
  { accountId: "a-summit-marketing", subject: "NPS", type: "usage", direction: "forward", sticky: false, weight: 5, label: "NPS 10 submitted", daysAgo: 21 },
  { accountId: "a-evergreen-studio", subject: "NPS", type: "usage", direction: "forward", sticky: false, weight: 5, label: "NPS 10 submitted", daysAgo: 40 },

  // Workflow usage
  { accountId: "a-greenfield-partners", subject: "Workflow", type: "usage", direction: "reverse", sticky: false, weight: 3, label: "Workflow runs −40%", daysAgo: 25 },
  { accountId: "a-lauren-fondriest", subject: "Workflow", type: "usage", direction: "reverse", sticky: false, weight: 2, label: "Workflow runs −30%", daysAgo: 20 },
];

export const signals: Signal[] = seedSignals.map((s, i) => ({
  id: `sig-${i + 1}`,
  accountId: s.accountId,
  subject: s.subject,
  type: s.type,
  direction: s.direction,
  sticky: s.sticky,
  weight: s.weight,
  label: s.label,
  detectedAt: iso(-s.daysAgo),
  source: s.source ?? (s.subject === "Payment" ? "billing" : s.subject === "Login" ? "auth" : s.subject === "NPS" ? "survey" : "ghl"),
}));

// ============================================================
// SELECTORS — pure, derived. No hardcoded counts.
// ============================================================

const liveOnly = (a: Account) =>
  a.status.enabled === "Enabled" && a.lifecycle.stage !== "churned";

export const allAccounts = (): Account[] => accounts;

export const accountById = (id: string): Account | undefined =>
  accounts.find((a) => a.identity.id === id);

export const byBand = (band: HealthBand): Account[] =>
  accounts.filter((a) => liveOnly(a) && a.health.band === band);

export const byLifecycle = (stage: LifecycleStage): Account[] =>
  accounts.filter((a) => a.lifecycle.stage === stage);

export const healthDistribution = (): Record<HealthBand, number> => {
  const out: Record<HealthBand, number> = { thriving: 0, healthy: 0, watch: 0, atrisk: 0 };
  for (const a of accounts) if (liveOnly(a)) out[a.health.band]++;
  return out;
};

export const renewalsWindow = (minDays: number, maxDays: number): Account[] =>
  accounts.filter((a) => {
    if (!liveOnly(a)) return false;
    const d = daysUntil(a.revenue.renewalDate);
    return d >= minDays && d <= maxDays;
  });

const urgencyScore = (a: Account): number => {
  const riskWeight = (100 - a.health.score) / 100; // 0..1
  const days = Math.max(0, daysUntil(a.revenue.renewalDate));
  const renewalProximity = Math.max(0, 1 - days / 90); // 0..1
  // Bands at-risk / watch get a floor of urgency from band alone
  const bandFloor = a.health.band === "atrisk" ? 0.4 : a.health.band === "watch" ? 0.2 : 0;
  return Math.max(riskWeight * renewalProximity, bandFloor * renewalProximity || bandFloor);
};

export const atRiskByUrgency = (): Account[] =>
  accounts
    .filter((a) => liveOnly(a) && (a.health.band === "atrisk" || a.health.band === "watch"))
    .slice()
    .sort((a, b) => urgencyScore(b) - urgencyScore(a));

/** Generic urgency sort across all live accounts (used by Accounts table). */
export const byUrgency = (input: Account[] = accounts): Account[] =>
  input
    .slice()
    .sort((a, b) => {
      const liveA = liveOnly(a) ? 0 : 1;
      const liveB = liveOnly(b) ? 0 : 1;
      if (liveA !== liveB) return liveA - liveB;
      return urgencyScore(b) - urgencyScore(a);
    });

export const failedPayments = (): Account[] =>
  accounts.filter(
    (a) =>
      liveOnly(a) &&
      (a.revenue.lastPaymentStatus === "failed" ||
        a.revenue.paymentAttempts.some((p) => p.status === "failed")),
  );

export const stalledOnboarding = (): Account[] =>
  accounts.filter((a) => liveOnly(a) && a.onboarding.stalled);

export const stalledByImpact = (): Account[] =>
  stalledOnboarding()
    .slice()
    .sort((a, b) => b.revenue.mrr - a.revenue.mrr);

const STICKY_REVERSE_WINDOW_DAYS = 30;

export const lostStickySetups = (): Account[] => {
  const recent = signals.filter(
    (s) =>
      s.sticky &&
      s.direction === "reverse" &&
      s.type === "setup" &&
      daysSince(s.detectedAt) <= STICKY_REVERSE_WINDOW_DAYS,
  );
  const ids = new Set(recent.map((s) => s.accountId));
  return accounts.filter((a) => ids.has(a.identity.id) && liveOnly(a));
};

export const dormantGrowth = (): Account[] =>
  accounts.filter(
    (a) =>
      liveOnly(a) &&
      a.lifecycle.stage === "dormant" &&
      a.health.delta > 0 &&
      a.login.lastLoginDaysAgo <= 14,
  );

/** Healthy/thriving accounts with rising usage — good upgrade/expansion candidates. */
export const upsellReady = (): Account[] =>
  accounts
    .filter(
      (a) =>
        liveOnly(a) &&
        (a.health.band === "thriving" || a.health.band === "healthy") &&
        a.health.delta > 0 &&
        a.revenue.spendTrend > 0 &&
        a.login.lastLoginDaysAgo <= 14,
    )
    .slice()
    .sort((x, y) => y.revenue.mrr - x.revenue.mrr);

export interface AgencyRollup {
  totalAccounts: number;
  liveAccounts: number;
  mrr: number;
  mrrAtRisk: number;
}

export const agencyRollup = (): AgencyRollup => {
  const live = accounts.filter(liveOnly);
  return {
    totalAccounts: accounts.length,
    liveAccounts: live.length,
    mrr: live.reduce((sum, a) => sum + a.revenue.mrr, 0),
    mrrAtRisk: live
      .filter((a) => a.health.band === "atrisk")
      .reduce((sum, a) => sum + a.revenue.mrr, 0),
  };
};

export const signalsForAccount = (accountId: string): Signal[] =>
  signals
    .filter((s) => s.accountId === accountId)
    .slice()
    .sort((a, b) => Date.parse(b.detectedAt) - Date.parse(a.detectedAt));
