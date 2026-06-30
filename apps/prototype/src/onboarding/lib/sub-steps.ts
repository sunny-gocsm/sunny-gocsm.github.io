// Sub-step model + derivation helpers.
//
// A parent step that has named GHL assets (workflows, funnels, forms) breaks
// into one auto-generated sub-step per asset. Auto-generation is the default:
// when an agency names assets, GoCSM creates one sub-step per asset with
// completionSource='auto' and the GoCSM white-label video for that asset type.
// Zero configuration required.
//
// Parent state is DERIVED from sub-steps (never set directly when sub-steps
// exist). Header progress sums TRACKABLE sub-steps (auto | webhook | manual)
// across the whole journey — guidance_only sub-steps never count.

import type {
  AssetType,
  Step,
  StepAsset,
  StepState,
  SubStep,
  SubStepCompletionSource,
} from "./types";

/* ---------- defaults ---------- */

/** Map a parent step `type` to the default asset type for its sub-steps. */
export function defaultAssetTypeFor(stepType: string): AssetType {
  switch (stepType) {
    case "snapshot_workflows":
      return "workflow";
    case "funnel_publish":
      return "funnel";
    case "form_create":
      return "form";
    default:
      // Most parents won't have assets; when they do without a hint, default
      // to "workflow" — caller may override via Step.assetType / asset.assetType.
      return "workflow";
  }
}

/** Default white-label GoCSM tutorial reference for an asset type.
 *  Resolved at render time by src/lib/video.ts (treats "default" as the
 *  GoCSM tutorial). We tag the type so renderers can pick the right
 *  white-label asset once distinct videos ship per type. */
export function defaultVideoForAsset(assetType: AssetType): string {
  return `default:${assetType}`;
}

/* ---------- generation ---------- */

function stateFromAsset(a: StepAsset): StepState {
  if (a.state) return a.state;
  return a.done ? "done" : "not_started";
}

function subStepIdFor(parentId: string, idx: number, label: string): string {
  const slug = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 32);
  return `${parentId}.a${idx + 1}${slug ? `-${slug}` : ""}`;
}

/** Auto-generate sub-steps from a step's `assets`. Each asset becomes one
 *  sub-step with completionSource='auto' and the default white-label video.
 *  Per-asset overrides on `StepAsset` (assetType, completionSource, videoRef,
 *  guidanceText, state) take precedence. */
export function autoGenerateSubSteps(step: Step): SubStep[] {
  if (!step.assets || step.assets.length === 0) return [];
  const parentDefault = step.assetType ?? defaultAssetTypeFor(step.type);
  return step.assets.map((a, i) => {
    const assetType: AssetType = a.assetType ?? parentDefault;
    const completionSource: SubStepCompletionSource = a.completionSource ?? "auto";
    return {
      id: subStepIdFor(step.id, i, a.name),
      parentStepId: step.id,
      label: a.name,
      assetType,
      videoRef: a.videoRef ?? defaultVideoForAsset(assetType),
      guidanceText: a.guidanceText,
      completionSource,
      state: stateFromAsset(a),
    };
  });
}

/** Canonical sub-step list for a step: explicit `subSteps` wins; otherwise
 *  auto-generated from `assets`. Returns [] when neither exists. */
export function getSubSteps(step: Step): SubStep[] {
  if (step.subSteps && step.subSteps.length > 0) return step.subSteps;
  return autoGenerateSubSteps(step);
}

/* ---------- derivation ---------- */

/** A sub-step is "trackable" iff its completion counts toward progress totals. */
export function isTrackable(sub: SubStep): boolean {
  return sub.completionSource !== "guidance_only";
}

/** Derive the parent step state from its sub-steps. Returns `fallback`
 *  (the parent's own `state`) when there are no sub-steps. */
export function deriveParentState(
  subSteps: SubStep[],
  fallback: StepState,
): StepState {
  if (subSteps.length === 0) return fallback;
  const tracked = subSteps.filter(isTrackable);
  if (tracked.length === 0) return fallback;

  // Any failure surfaces on the parent.
  if (tracked.some((s) => s.state === "needs_attention")) return "needs_attention";
  if (tracked.some((s) => s.state === "verifying")) return "verifying";
  if (tracked.some((s) => s.state === "waiting_on_agency")) return "waiting_on_agency";

  const doneOrSkipped = tracked.filter(
    (s) => s.state === "done" || s.state === "skipped",
  ).length;
  if (doneOrSkipped === tracked.length) return "done";

  const anyStarted = tracked.some(
    (s) =>
      s.state === "in_progress" ||
      s.state === "done" ||
      s.state === "skipped",
  );
  if (anyStarted) return "in_progress";

  // None started — preserve the parent's own resting state (e.g. locked).
  return fallback;
}

/** Resolve a step's effective state, accounting for sub-step derivation. */
export function effectiveStepState(step: Step): StepState {
  const subs = getSubSteps(step);
  return deriveParentState(subs, step.state);
}

/* ---------- progress totals ---------- */

export interface ProgressCount {
  /** Trackable sub-steps that are done (or skipped). */
  done: number;
  /** Total trackable sub-steps (auto | webhook | manual). */
  total: number;
}

/** "X of Y done" — sums trackable sub-steps across the journey. Steps with
 *  no sub-steps contribute exactly 1 to total (and 1 to done iff their
 *  effective state is done/skipped). */
export function countTrackable(steps: Step[]): ProgressCount {
  let done = 0;
  let total = 0;
  for (const step of steps) {
    const subs = getSubSteps(step);
    const tracked = subs.filter(isTrackable);
    if (tracked.length > 0) {
      total += tracked.length;
      done += tracked.filter(
        (s) => s.state === "done" || s.state === "skipped",
      ).length;
    } else {
      total += 1;
      const eff = effectiveStepState(step);
      if (eff === "done" || eff === "skipped") done += 1;
    }
  }
  return { done, total };
}
