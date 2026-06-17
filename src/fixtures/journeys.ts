// Journeys fixture — onboarding journey catalog + step catalog.
// Tiers: A = launch-critical, B = recommended, C = nice-to-have.
// Owner: who must complete it (client vs agency).
// `jargonFlags` are derived in the UI; this file just carries the raw text.

export type JourneyStatus = "draft" | "published" | "archived";
export type StepTier = "A" | "B" | "C";
export type StepOwner = "client" | "agency";
export type Experience = "guided" | "tracking_only";
export type Placement = "banner" | "floating" | "menu" | "embed";

export interface StepCatalogItem {
  key: string;
  /** Operator-facing title (concise, can carry shorthand). */
  title: string;
  /** Client-facing title — plain, no jargon. */
  clientTitle: string;
  /** Why it matters, plain language. */
  why: string;
  tier: StepTier;
  owner: StepOwner;
  /** Default SLA days at the step level. */
  slaDays: number;
}

/** The full step catalog the builder picks from. */
export const STEP_CATALOG: StepCatalogItem[] = [
  { key: "account",  title: "Account created",        clientTitle: "Create your account",         why: "We need a workspace before anything else.",    tier: "A", owner: "agency", slaDays: 1 },
  { key: "domain",   title: "Connect domain (CNAME)", clientTitle: "Connect your website",         why: "So emails and pages come from your brand.",     tier: "A", owner: "client", slaDays: 5 },
  { key: "dkim",     title: "DKIM + DMARC",           clientTitle: "Help us prove emails are you", why: "Carriers trust your sending domain.",           tier: "B", owner: "client", slaDays: 5 },
  { key: "phone",    title: "Add phone number",       clientTitle: "Pick a phone number",          why: "Lets you text and call from inside the app.",   tier: "A", owner: "client", slaDays: 3 },
  { key: "a2p",      title: "A2P registration + KYC", clientTitle: "Register to text customers",   why: "Carriers need to approve you before SMS sends.",tier: "A", owner: "client", slaDays: 7 },
  { key: "imports",  title: "Imports",                clientTitle: "Bring in your contacts",       why: "Your list is the foundation of everything else.",tier:"B", owner: "client", slaDays: 5 },
  { key: "funnel",   title: "First funnel published", clientTitle: "Publish your first page",      why: "Gives leads a place to land.",                  tier: "A", owner: "client", slaDays: 4 },
  { key: "workflow", title: "First workflow live",    clientTitle: "Turn on your first automation",why: "Automates the first follow-up.",                tier: "A", owner: "client", slaDays: 4 },
  { key: "calendar", title: "Calendar synced (OAuth)",clientTitle: "Connect your calendar",        why: "So bookings land on your real schedule.",       tier: "B", owner: "client", slaDays: 3 },
  { key: "payments", title: "Payments connected",     clientTitle: "Get ready to accept payments", why: "Needed to bill customers from inside the app.", tier: "B", owner: "client", slaDays: 3 },
  { key: "team",     title: "Invite team",            clientTitle: "Invite your team",             why: "More hands on the same workspace.",             tier: "C", owner: "client", slaDays: 7 },
  { key: "launch",   title: "Go live",                clientTitle: "You're live",                  why: "Ready to send real campaigns.",                 tier: "A", owner: "agency", slaDays: 2 },
];

export interface Journey {
  id: string;
  name: string;
  version: string;
  status: JourneyStatus;
  /** Days from journey start → launch step done. */
  targetDays: number;
  /** Active sub-account count using this journey. */
  clientCount: number;
  /** Step order — references STEP_CATALOG.key. */
  steps: string[];
  experience: Experience;
  placement: Placement;
  description: string;
}

export const journeys: Journey[] = [
  {
    id: "j-standard-v1",
    name: "Standard",
    version: "v1",
    status: "published",
    targetDays: 28,
    clientCount: 18,
    steps: ["account", "domain", "phone", "a2p", "imports", "funnel", "workflow", "launch"],
    experience: "guided",
    placement: "floating",
    description: "The default 8-step path for new agency clients.",
  },
  {
    id: "j-fast-v2",
    name: "Fast-track",
    version: "v2",
    status: "published",
    targetDays: 14,
    clientCount: 6,
    steps: ["account", "domain", "phone", "funnel", "workflow", "launch"],
    experience: "guided",
    placement: "banner",
    description: "Lean path for clients who already have a domain and contacts.",
  },
  {
    id: "j-enterprise-v1",
    name: "Enterprise",
    version: "v1",
    status: "draft",
    targetDays: 45,
    clientCount: 0,
    steps: ["account", "domain", "dkim", "phone", "a2p", "calendar", "payments", "imports", "funnel", "workflow", "team", "launch"],
    experience: "tracking_only",
    placement: "menu",
    description: "Long path with compliance + payments + team setup.",
  },
  {
    id: "j-legacy-v0",
    name: "Legacy",
    version: "v0",
    status: "archived",
    targetDays: 35,
    clientCount: 0,
    steps: ["account", "domain", "phone", "imports", "launch"],
    experience: "tracking_only",
    placement: "embed",
    description: "Pre-2024 path. Kept for reference.",
  },
];

export const stepByKey = (key: string): StepCatalogItem | undefined =>
  STEP_CATALOG.find((s) => s.key === key);

// ----- Jargon / plain-language audit ----------------------------------------

const JARGON_TERMS = ["A2P", "DKIM", "DMARC", "CNAME", "OAuth", "KYC", "SPF", "MX"];

export interface JargonAudit {
  jargon: string[];     // surface terms found
  multiAction: boolean; // contains " and " (two asks bundled)
  tooLong: boolean;     // > 7 words
  ok: boolean;
}

export function auditTitle(title: string): JargonAudit {
  const jargon = JARGON_TERMS.filter((t) => new RegExp(`\\b${t}\\b`, "i").test(title));
  const multiAction = / and /i.test(title);
  const tooLong = title.trim().split(/\s+/).length > 7;
  return { jargon, multiAction, tooLong, ok: !jargon.length && !multiAction && !tooLong };
}
