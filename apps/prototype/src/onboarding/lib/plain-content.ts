// Plain-language layer for the customer-facing onboarding surfaces.
// The journey data keeps operator titles + types; every NEW-USER surface (the
// setup wizard, the summary, the client preview) speaks the customer's words via
// this single source. Outcome groups follow HighLevel LaunchPad's "by outcome,
// not by feature" model. (Design-loop, 2026-06.)

import { getCatalogEntry, effectiveDetector, canAutoDetect } from "./catalog";
import type { Journey, Step, StepDetector } from "./types";

export interface OutcomeGroup {
  id: string;
  label: string;
  /** One-line plain explainer. */
  sub: string;
  types: string[];
}

export const OUTCOME_GROUPS: OutcomeGroup[] = [
  {
    id: "phone",
    label: "Phone & texting",
    sub: "So your clients can call and text their leads.",
    types: ["phone_purchase", "a2p_brand", "a2p_campaign"],
  },
  {
    id: "web",
    label: "Website, forms & email",
    sub: "So leads can find them and get in touch.",
    types: ["funnel_publish", "custom_domain", "form_create", "email_domain"],
  },
  {
    id: "sales",
    label: "Calendar & sales pipeline",
    sub: "So bookings and deals never slip through.",
    types: ["calendar_sync", "pipeline_setup"],
  },
  {
    id: "connect",
    label: "Automations & connected accounts",
    sub: "So the day-to-day busywork runs itself.",
    types: [
      "business_profile",
      "snapshot_workflows",
      "gbp_connect",
      "facebook_connect",
      "stripe_connect",
    ],
  },
  {
    id: "kickoff",
    label: "Kickoff",
    sub: "Start the relationship face to face.",
    types: ["kickoff_call"],
  },
];

export const OTHER_GROUP: OutcomeGroup = {
  id: "other",
  label: "Other steps",
  sub: "Steps you've added on top of the recommended set.",
  types: [],
};

/** Short, plain, customer-facing titles. Falls back to the catalog label. */
export const PLAIN_TITLE: Record<string, string> = {
  phone_purchase: "Get a business phone number",
  a2p_brand: "Register to send text messages",
  a2p_campaign: "Get your text messages approved",
  email_domain: "Set up your email",
  funnel_publish: "Publish your website",
  custom_domain: "Use your own web address",
  form_create: "Add a lead-capture form",
  calendar_sync: "Connect your calendar",
  pipeline_setup: "Set up your sales pipeline",
  business_profile: "Fill in your business details",
  snapshot_workflows: "Turn on your automations",
  gbp_connect: "Connect Google Business",
  facebook_connect: "Connect Facebook & Instagram",
  stripe_connect: "Turn on payments",
  kickoff_call: "Book the kickoff call",
};

export function plainTitle(type: string, fallback = ""): string {
  return PLAIN_TITLE[type] ?? getCatalogEntry(type).label ?? fallback;
}

function firstSentence(s: string): string {
  if (!s) return "";
  const m = s.match(/^[^.!?]*[.!?]/);
  return (m ? m[0] : s).trim();
}

/** One-line plain explainer for a step type (from the catalog client copy). */
export function plainSub(type: string): string {
  return firstSentence(getCatalogEntry(type).clientInstructions);
}

/* ----------------------------------------------------------------------------
   Completion-method badges — make the auto-tracking USP visible per step.
   Four levels: GoCSM auto-checks (default) · client confirms · web event ·
   read-only/for-reference. Icon + colour + label + tooltip (never colour alone).
---------------------------------------------------------------------------- */

export type CompletionTone = "auto" | "manual" | "webhook" | "info";

export interface CompletionBadge {
  label: string;
  tone: CompletionTone;
  tip: string;
}

const COMPLETION_BADGES: Record<StepDetector, CompletionBadge> = {
  auto: {
    label: "Auto-verified",
    tone: "auto",
    tip: "GoCSM verifies this in your client's HighLevel and ticks it off the moment it's really done — no one watches a video or ticks a box.",
  },
  manual: {
    label: "Client confirms",
    tone: "manual",
    tip: "Your client marks this one done themselves.",
  },
  inbound_webhook: {
    label: "Web event",
    tone: "webhook",
    tip: "Completes automatically when your webhook event fires.",
  },
  read_only: {
    label: "For reference",
    tone: "info",
    tip: "Just so they know — nothing to confirm. Never counted in progress.",
  },
};

export function completionBadge(step: Step): CompletionBadge {
  // Out-of-the-box HighLevel features are ALWAYS auto-verified by GoCSM — the
  // agency can't override that. Only custom steps (which GoCSM can't see) carry
  // an agency-chosen method.
  if (canAutoDetect(step.type)) return COMPLETION_BADGES.auto;
  return COMPLETION_BADGES[effectiveDetector(step)] ?? COMPLETION_BADGES.manual;
}

/** Which outcome group a step type belongs to (OTHER if none). */
export function groupOf(type: string): string {
  const g = OUTCOME_GROUPS.find((grp) => grp.types.includes(type));
  return g ? g.id : OTHER_GROUP.id;
}

/** Group a journey's steps by outcome, preserving order within each group. */
export function groupSteps(steps: Step[]): Map<string, Step[]> {
  const map = new Map<string, Step[]>();
  for (const grp of [...OUTCOME_GROUPS, OTHER_GROUP]) map.set(grp.id, []);
  for (const s of steps) map.get(groupOf(s.type))!.push(s);
  return map;
}

/** True when the agency has renamed a step away from its catalog default title. */
export function isCustomTitle(step: Step): boolean {
  return Boolean(step.title) && step.title !== getCatalogEntry(step.type).defaultTitle;
}

/**
 * What the client actually sees: a pristine render of a journey — fresh (nothing
 * done yet), the agency's custom title when set else the plain client title, and
 * the per-asset sub-steps kept (so "activate these 3 workflows" shows as 3 tasks).
 * The source journey is never mutated.
 */
export function previewJourney(journey: Journey): Journey {
  return {
    ...journey,
    status: "draft",
    steps: journey.steps.map((s) => ({
      ...s,
      title: isCustomTitle(s) ? s.title : plainTitle(s.type, s.title),
      state: "not_started",
      daysOnStep: undefined,
      completionSource: undefined,
      // keep assets (the sub-steps the agency configured) but reset progress
      assets: s.assets?.map((a) => ({ ...a, done: false, state: undefined })),
      subSteps: undefined,
    })),
  };
}
