// Data model for onboarding journeys and steps.
// See onboarding-states.md (Knowledge) for the nine-state contract.

export type JourneyStatus = "draft" | "published" | "archived";

export type StepTier = "A" | "B" | "C";
export type StepOwner = "client" | "agency";

export type StepState =
  | "not_started"
  | "locked"
  | "in_progress"
  | "verifying"
  | "waiting_on_agency"
  | "needs_attention"
  | "done"
  | "skipped"
  | "stalled";

export type CompletionSource = "auto" | "manual" | "agency_verified";

export type ExperienceMode = "guided" | "tracking_only";

export type PlacementMode = "banner" | "floating" | "menu" | "embed";
export type FloatingPosition =
  | "bottom-right"
  | "bottom-left"
  | "bottom-right-offset";

export interface Placement {
  mode: PlacementMode;
  /** Only meaningful when mode === "floating". */
  position?: FloatingPosition;
}

export const DEFAULT_PLACEMENT: Placement = {
  mode: "banner",
};

export type StepConfidence = "fact" | "guess";
export interface StepMapping {
  confidence: StepConfidence;
  source: "paste" | "template" | "scratch";
}

/** Asset types a parent step can break into per-asset sub-steps. */
export type AssetType = "workflow" | "funnel" | "form";

/** How a single sub-step is completed.
 *  - "auto": GoCSM watches HighLevel directly (default for named assets).
 *  - "webhook": an external system POSTs done.
 *  - "manual": agency/client marks it done.
 *  - "guidance_only": informational; NEVER counted in progress totals. */
export type SubStepCompletionSource = "auto" | "webhook" | "manual" | "guidance_only";

export interface StepAsset {
  name: string;
  done: boolean;
  /** Optional per-asset overrides used when auto-generating sub-steps. */
  assetType?: AssetType;
  completionSource?: SubStepCompletionSource;
  videoRef?: string;
  guidanceText?: string;
  /** Optional per-asset state override; otherwise derived from `done`. */
  state?: StepState;
}

/** Per-asset sub-step. Auto-generated from `Step.assets` when not explicit.
 *  See src/lib/sub-steps.ts for generation + derivation helpers. */
export interface SubStep {
  id: string;
  parentStepId: string;
  label: string;
  assetType: AssetType;
  /** Defaults to the GoCSM white-label video for the asset type. */
  videoRef?: string;
  guidanceText?: string;
  completionSource: SubStepCompletionSource;
  state: StepState;
}

/** How completion is detected for a step. "auto" = GoCSM watches HighLevel directly,
 *  "manual" = client/agency marks it done, "inbound_webhook" = an external system
 *  POSTs to a per-step URL when the work is finished, "read_only" = informational
 *  only (nothing to confirm; never counted in progress). */
export type StepDetector = "auto" | "manual" | "inbound_webhook" | "read_only";

export interface Step {
  id: string;
  order: number;
  title: string;
  type: string;
  tier: StepTier;
  owner: StepOwner;
  state: StepState;
  slaHours: number;
  mapping?: StepMapping;
  deepLink?: string;
  videoRef?: string;
  dependencies: string[];
  completionSource?: CompletionSource;
  lastIntervention?: string;
  daysOnStep?: number;
  assets?: StepAsset[];
  /** Default asset type for this parent step; if omitted, derived from `type`
   *  by sub-steps helpers (snapshot_workflows→workflow, funnel_publish→funnel,
   *  form_create→form). */
  assetType?: AssetType;
  /** Explicit sub-steps. If omitted and `assets` is set, sub-steps are
   *  auto-generated (one per asset, completionSource='auto', default video). */
  subSteps?: SubStep[];
  /** Only meaningful for type === "kickoff_call". Embedded scheduler URL (Calendly, GHL Calendar, SavvyCal, Cal.com). */
  bookingEmbedUrl?: string;
  /** Configured detection mode. Falls back to defaultDetector(type) when absent. */
  detector?: StepDetector;
  /** Token for inbound_webhook detector; the URL is derived from this. */
  webhookToken?: string;
  /** Agency-customized "what your client sees" copy. Falls back to the catalog
   *  client instructions when absent. */
  instructions?: string;
  /** For asset steps (workflows/funnels): does ANY asset count, or must the
   *  client activate SPECIFIC named ones? Undefined → derived from whether
   *  `assets` is set. */
  assetScope?: "any" | "specific";
  /** The agency snapshot sub-account the specific assets are fetched from. */
  snapshotAccountId?: string;
}



/** Master plan id — used when a client has no explicit plan or a variant
 *  hasn't been authored. The master step list is always the fallback. */
export const MASTER_PLAN_ID = "master";

export interface PlanVariant {
  /** Stable id; "master" is reserved for the full journey. */
  id: string;
  /** Plan name shown in switcher and portfolio chip ("Pilot", "Growth"…). */
  name: string;
  /** Subset of Journey.steps[].id included for this plan, in display order.
   *  Omitted/empty → inherits the master step list (all steps). */
  stepIds?: string[];
  /** Per-plan target. Omitted → inherits Journey.targetDays. */
  targetDays?: number;
  /** True for the implicit master row; UI hides "delete" on it. */
  isMaster?: boolean;
}

/** @deprecated kept for back-compat with earlier wizard drafts. */
export interface JourneyPlan {
  id: string;
  name: string;
  derivedFromMaster: boolean;
}

export type PlanScoping = "single" | "per-plan";

export interface Journey {
  id: string;
  name: string;
  status: JourneyStatus;
  version: number;
  targetDays: number;
  clientCount: number;
  steps: Step[];
  /** Hex like "#ea7a26". Drives --client-accent on the client scope. Undefined → default. */
  brandColor?: string;
  /** "guided" (default) renders the GoCSM widget; "tracking_only" hides it entirely. */
  experienceMode?: ExperienceMode;
  /** Whether the same checklist applies to all plans, or per-plan variants exist. */
  planScoping?: PlanScoping;
  /** @deprecated superseded by planVariants. */
  plans?: JourneyPlan[];
  /** Plan variants — first entry is the master row. Absent or length ≤ 1 → single-plan journey. */
  planVariants?: PlanVariant[];
  /** Where the checklist surfaces inside HighLevel. Defaults to floating widget, bottom-right-offset. */
  placement?: Placement;
  /** Step 7 answer: will the agency attach per-step videos? `undefined` = unanswered. */
  showVideos?: boolean;

}

// Seed: Standard GHL Agency Onboarding (15-step catalog).
export const STANDARD_GHL_JOURNEY: Journey = {
  id: "j-std-ghl",
  name: "Standard agency onboarding",
  status: "published",
  version: 2,
  targetDays: 14,
  clientCount: 14,
  steps: [
    { id: "s01", order: 1, title: "Purchase phone number", type: "phone_purchase", tier: "A", owner: "client", slaHours: 24, dependencies: [], deepLink: "Settings → Phone Numbers", state: "done", completionSource: "auto" },
    { id: "s02", order: 2, title: "Register your business for text messaging (A2P brand)", type: "a2p_brand", tier: "B", owner: "client", slaHours: 72, dependencies: ["s01"], deepLink: "Settings → Phone Numbers → Trust Center", state: "verifying", daysOnStep: 2 },
    { id: "s03", order: 3, title: "Text-messaging campaign approval (A2P campaign)", type: "a2p_campaign", tier: "B", owner: "client", slaHours: 120, dependencies: ["s02"], deepLink: "Settings → Phone Numbers → Trust Center", state: "locked" },
    { id: "s04", order: 4, title: "Set up your email sending domain", type: "email_domain", tier: "B", owner: "client", slaHours: 48, dependencies: [], deepLink: "Settings → Email Services → Dedicated Domain", state: "done", completionSource: "auto" },
    { id: "s05", order: 5, title: "Complete your business profile", type: "business_profile", tier: "A", owner: "client", slaHours: 24, dependencies: [], deepLink: "Settings → Business Profile", state: "done", completionSource: "auto" },
    { id: "s06", order: 6, title: "Activate your workflows", type: "snapshot_workflows", tier: "B", owner: "client", slaHours: 48, dependencies: [], deepLink: "Automation → Workflows", state: "done", completionSource: "auto", assets: [{ name: "Lead nurture — new inquiry", done: true }, { name: "Missed-call text-back", done: true }, { name: "Review request", done: true }] },
    { id: "s07", order: 7, title: "Connect your custom domain", type: "custom_domain", tier: "B", owner: "client", slaHours: 48, dependencies: [], deepLink: "Settings → Domains", state: "not_started" },
    { id: "s08", order: 8, title: "Publish your website funnel", type: "funnel_publish", tier: "A", owner: "client", slaHours: 24, dependencies: ["s07"], deepLink: "Sites → Funnels", state: "done", completionSource: "manual", assets: [{ name: "Main lead-gen funnel", done: true }] },
    { id: "s09", order: 9, title: "Create your calendar and connect Google/Outlook", type: "calendar_sync", tier: "A", owner: "client", slaHours: 24, dependencies: [], deepLink: "Calendars → Calendar Settings", state: "done", completionSource: "auto" },
    { id: "s10", order: 10, title: "Create your lead form", type: "form_create", tier: "A", owner: "client", slaHours: 24, dependencies: [], deepLink: "Sites → Forms", state: "done", completionSource: "auto", assets: [{ name: "Contact form", done: true }, { name: "Quote-request form", done: true }] },
    { id: "s11", order: 11, title: "Set up your sales pipeline", type: "pipeline_setup", tier: "A", owner: "client", slaHours: 24, dependencies: [], deepLink: "Opportunities → Pipelines", state: "not_started" },
    { id: "s12", order: 12, title: "Connect Google Business Profile", type: "gbp_connect", tier: "A", owner: "client", slaHours: 24, dependencies: [], deepLink: "Settings → Integrations", state: "not_started" },
    { id: "s13", order: 13, title: "Connect Facebook / Instagram", type: "facebook_connect", tier: "A", owner: "client", slaHours: 24, dependencies: [], deepLink: "Settings → Integrations", state: "not_started" },
    { id: "s14", order: 14, title: "Connect payments (Stripe)", type: "stripe_connect", tier: "A", owner: "client", slaHours: 24, dependencies: [], deepLink: "Payments → Integrations", state: "not_started" },
    { id: "s15", order: 15, title: "Book your kickoff call", type: "kickoff_call", tier: "C", owner: "client", slaHours: 120, dependencies: [], deepLink: "", bookingEmbedUrl: "https://calendly.com/summit-digital/kickoff", state: "not_started" },

  ],
  planVariants: [
    { id: MASTER_PLAN_ID, name: "All plans", isMaster: true },
    {
      id: "pilot",
      name: "Pilot",
      targetDays: 7,
      // 10 steps — drop A2P (s02, s03), custom_domain (s07), funnel_publish (s08),
      // and stripe_connect (s14). Lighter pilot path.
      stepIds: ["s01", "s04", "s05", "s06", "s09", "s10", "s11", "s12", "s13", "s15"],
    },
  ],
};

/* ============ Plan-variant helpers ============ */

export function resolveVariant(j: Journey, planId?: string): PlanVariant {
  const variants = j.planVariants ?? [];
  if (planId) {
    const found = variants.find((v) => v.id === planId);
    if (found) return found;
  }
  return (
    variants.find((v) => v.isMaster) ?? {
      id: MASTER_PLAN_ID,
      name: "All plans",
      isMaster: true,
    }
  );
}

export function variantSteps(j: Journey, planId?: string): Step[] {
  const v = resolveVariant(j, planId);
  if (!v.stepIds || v.stepIds.length === 0) return j.steps;
  const byId = new Map(j.steps.map((s) => [s.id, s]));
  return v.stepIds
    .map((id) => byId.get(id))
    .filter((s): s is Step => Boolean(s))
    .map((s, i) => ({ ...s, order: i + 1 }));
}

export function variantTargetDays(j: Journey, planId?: string): number {
  const v = resolveVariant(j, planId);
  return v.targetDays ?? j.targetDays;
}

export function variantStepCount(j: Journey, planId?: string): number {
  const v = resolveVariant(j, planId);
  if (!v.stepIds || v.stepIds.length === 0) return j.steps.length;
  return v.stepIds.length;
}


const DRAFTS = new Map<string, Journey>();
const LS_PREFIX = "gocsm.journey.";

function lsAvailable(): boolean {
  try {
    return typeof window !== "undefined" && !!window.localStorage;
  } catch {
    return false;
  }
}

export function saveJourney(j: Journey): Journey {
  DRAFTS.set(j.id, j);
  if (lsAvailable()) {
    try {
      window.localStorage.setItem(LS_PREFIX + j.id, JSON.stringify(j));
    } catch {
      /* quota or serialization — ignore; in-memory copy still good */
    }
  }
  return j;
}

/** Dev-only: wipe in-memory drafts and any persisted journey keys. */
export function clearAllJourneys(): void {
  DRAFTS.clear();
  if (!lsAvailable()) return;
  try {
    const keys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith(LS_PREFIX)) keys.push(k);
    }
    keys.forEach((k) => window.localStorage.removeItem(k));
  } catch {
    /* ignore */
  }
}


export function getJourneyById(id: string): Journey | undefined {
  if (DRAFTS.has(id)) return DRAFTS.get(id);
  if (lsAvailable()) {
    try {
      const raw = window.localStorage.getItem(LS_PREFIX + id);
      if (raw) {
        const j = JSON.parse(raw) as Journey;
        DRAFTS.set(id, j);
        return j;
      }
    } catch {
      /* ignore */
    }
  }
  if (id === STANDARD_GHL_JOURNEY.id) return STANDARD_GHL_JOURNEY;
  return undefined;
}

export function newDraftId(): string {
  return "d-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
}

/**
 * Resolve the "current" operator journey:
 *   1. Most recently saved draft in DRAFTS (in-memory).
 *   2. Any single draft persisted to localStorage (hydrate, then return).
 *   3. STANDARD_GHL_JOURNEY if it's published (seed baseline).
 *   4. undefined → caller should render the creation experience.
 */
export function getCurrentJourney(): Journey | undefined {
  if (DRAFTS.size > 0) {
    // Return the most-recently inserted entry. Maps preserve insertion order.
    let last: Journey | undefined;
    for (const j of DRAFTS.values()) last = j;
    if (last) return last;
  }
  if (lsAvailable()) {
    try {
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (k && k.startsWith(LS_PREFIX)) {
          const raw = window.localStorage.getItem(k);
          if (raw) {
            const j = JSON.parse(raw) as Journey;
            DRAFTS.set(j.id, j);
            return j;
          }
        }
      }
    } catch {
      /* ignore */
    }
  }
  if (STANDARD_GHL_JOURNEY.status === "published") return STANDARD_GHL_JOURNEY;
  return undefined;
}

export type BlockedBy = "client" | "agency" | null;

export interface LastIntervention {
  type: "workflow_nudge" | string;
  days_ago: number;
  outcome: "no_movement" | "moved" | string;
}

export interface OnboardingAccount {
  account: string;
  mrr: number;
  steps_total: number;
  steps_done: number;
  pct_complete: number;
  current_step: string | null;
  days_on_current_step: number;
  sla_days: number;
  stalled: boolean;
  blocked_by: BlockedBy;
  journey_started_days_ago: number;
  last_intervention: LastIntervention | null;
  journey_version: string;
  /** PlanVariant.id; absent → master. */
  plan?: string;
  /** Live state of the current step. When "verifying", an external party
   *  (carrier, DNS) is processing — the dashboard treats this as calm
   *  "waiting on review", not "stuck", as long as we're inside budget. */
  current_step_state?: StepState;
  /** Days the external party has been processing the current step. */
  external_wait_days?: number;
  /** Expected wait ceiling for the current external check. Past this, the
   *  account is auto-promoted to the stuck queue. Falls back to
   *  defaultExternalBudgetDays(step type) when omitted. */
  external_budget_days?: number;
  /** Catalog entry id (e.g. "step02.failure.ein_name_mismatch") naming the
   *  account's current failure state. Renderer reads agencyCopy from
   *  src/lib/state-catalog.ts. Absent when the account has no explicit
   *  failure (slow / stalled with no detector signal). */
  current_failure_id?: string;
}



export interface FunnelStep {
  step: string;
  clients_reached: number;
}

export interface SlaCalibrationRow {
  step: string;
  sla_days: number;
  median_actual_days: number;
}

export interface OnboardingSeed {
  as_of: string;
  journey: string;
  accounts: OnboardingAccount[];
  funnel: FunnelStep[];
  sla_calibration: SlaCalibrationRow[];
  /** Prior-period median (days to onboard) for trend comparison on the
   *  Onboarded population card. Omit when history is too thin to compare;
   *  the renderer then shows only the current average, no arrow. */
  prior_median_days_to_activate?: number;
  /** Human label for the prior window. Defaults to "last quarter". */
  prior_window_label?: string;
}

