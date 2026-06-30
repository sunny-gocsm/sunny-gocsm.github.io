// Onboarding journey templates — the wizard's Step 1.
// Three outcome-labelled starting points, each a REAL subset of the 15-step
// standard catalog (no placeholder steps). Picking one decides ~most of the
// feature list + sequence; the user customizes from there. (Design-loop 2026-06.)

import { STANDARD_GHL_JOURNEY, newDraftId } from "./types";
import type { Journey, Step } from "./types";
import { PLAIN_TITLE } from "./plain-content";
import { ASSET_TYPES } from "./catalog";

export interface Template {
  id: string;
  name: string;
  /** Outcome-framed one-liner ("which one is me?"). */
  tagline: string;
  /** Rough target, in weeks. */
  weeks: number;
  recommended?: boolean;
  /** Real catalog step types this template includes, in standard order. */
  stepTypes: string[];

  // --- derived / legacy fields (kept for back-compat with older surfaces) ---
  stepCount: number;
  estDuration: string;
  peek: string[];
  badge?: string;
}

const ALL_TYPES = STANDARD_GHL_JOURNEY.steps.map((s) => s.type);

function make(
  id: string,
  name: string,
  tagline: string,
  weeks: number,
  stepTypes: string[],
  recommended = false,
): Template {
  return {
    id,
    name,
    tagline,
    weeks,
    recommended,
    stepTypes,
    stepCount: stepTypes.length,
    estDuration: `~${weeks} weeks`,
    peek: stepTypes.slice(0, 5).map((t) => PLAIN_TITLE[t] ?? t),
    badge: recommended ? "Recommended" : undefined,
  };
}

export const TEMPLATES: Template[] = [
  make(
    "standard",
    "Standard onboarding",
    "The full launch path most agencies use.",
    2,
    ALL_TYPES,
    true,
  ),
  make(
    "fast-track",
    "Fast-track",
    "The essentials only — for clients who are mostly set up already.",
    2,
    [
      "phone_purchase",
      "business_profile",
      "snapshot_workflows",
      "calendar_sync",
      "form_create",
      "pipeline_setup",
      "kickoff_call",
    ],
  ),
  make(
    "local-services",
    "Local services",
    "Built for local businesses — texting, reviews, social, and booking.",
    3,
    [
      "phone_purchase",
      "a2p_brand",
      "a2p_campaign",
      "business_profile",
      "calendar_sync",
      "form_create",
      "gbp_connect",
      "facebook_connect",
      "kickoff_call",
    ],
  ),
];

export function getTemplate(id: string): Template | undefined {
  return TEMPLATES.find((t) => t.id === id);
}

/** Build real Step[] from a list of catalog types, sourced from the standard
 *  journey so deep links / assets / booking URLs carry over. */
function buildSteps(stepTypes: string[]): Step[] {
  const byType = new Map(STANDARD_GHL_JOURNEY.steps.map((s) => [s.type, s]));
  const picked = stepTypes
    .map((t) => byType.get(t))
    .filter((s): s is Step => Boolean(s));
  const includedIds = new Set(picked.map((s) => s.id));
  return picked.map((s, i) => {
    const isAsset = ASSET_TYPES.has(s.type);
    return {
      ...s,
      order: i + 1,
      state: "not_started",
      daysOnStep: undefined,
      completionSource: undefined,
      // Asset steps (workflows/funnels) default to "any asset counts" with
      // nothing pre-named — the agency opts a step into a specific named asset
      // only if they want to. Non-asset steps carry no client progress.
      assets: isAsset ? undefined : s.assets?.map((a) => ({ ...a, done: false, state: undefined })),
      assetScope: isAsset ? "any" : s.assetScope,
      snapshotAccountId: isAsset ? undefined : s.snapshotAccountId,
      // prune dependencies that point at steps this template excludes
      dependencies: s.dependencies.filter((d) => includedIds.has(d)),
      mapping: { confidence: "fact" as const, source: "template" },
    };
  });
}

export function cloneTemplate(id: string): Journey {
  const t = getTemplate(id) ?? TEMPLATES[0];
  return {
    id: newDraftId(),
    name: t.id === "standard" ? "Standard agency onboarding" : t.name,
    status: "draft",
    version: 1,
    targetDays: t.weeks * 7,
    clientCount: 0,
    steps: buildSteps(t.stepTypes),
  };
}

export function createEmptyDraft(): Journey {
  return {
    id: newDraftId(),
    name: "Your onboarding journey",
    status: "draft",
    version: 1,
    targetDays: 14,
    clientCount: 0,
    steps: [],
  };
}
