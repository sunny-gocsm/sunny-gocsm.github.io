// Starter recipes — the criteria-builder empty-state on-ramp (tappable, seeded from
// REAL §6 fields) AND the pre-seed source when the flow opens from a job-(a) row.
// Picking one drops a fully-formed, editable CriteriaSet into the builder so the user
// adjusts rather than authors from zero. The six recipes are CPDO §7; every PAS / pillar
// recipe is gone. Each keeps its downstream playbookId mapping (the action half).

import { normalize, type Criterion, type CriteriaSet } from "./criteriaMatch";
import type { DateRelValue } from "./criteriaCatalog";

export interface Recipe {
  id: string;
  icon: string;
  label: string;
  blurb: string;
  set: CriteriaSet;
  /** The playbook this recipe activates downstream (the action half of the flow). */
  playbookId: string;
}

let rc = 0;
const cid = () => `r${++rc}`;
const c = (fieldId: string, op: Criterion["op"], value?: Criterion["value"]): Criterion => ({
  id: cid(),
  fieldId,
  op,
  value,
});
const next = (n: number): DateRelValue => ({ verb: "inNext", n, unit: "days" });

const flat = (match: "all" | "any", ...criteria: Criterion[]): CriteriaSet =>
  normalize({ match, criteria });

export const RECIPES: Recipe[] = [
  {
    id: "rec-atrisk-renewing",
    icon: "calendar-clock",
    label: "At-risk & renewing soon",
    blurb: "Shaky accounts with a renewal inside the next month.",
    playbookId: "pb-renewal-save",
    set: flat(
      "all",
      c("health.band", "isAnyOf", ["atrisk", "watch"]),
      c("revenue.renewsWithin", "inNext", next(30)),
    ),
  },
  {
    id: "rec-big-downhill",
    icon: "trending-down",
    label: "Big accounts going downhill",
    blurb: "Your biggest accounts whose health is falling.",
    playbookId: "pb-renewal-save",
    set: flat(
      "all",
      c("revenue.mrr", "gt", 1500),
      c("health.trend", "falling"),
    ),
  },
  {
    id: "rec-gone-quiet",
    icon: "moon",
    label: "Gone quiet",
    blurb: "Owners who haven't logged in for 21+ days.",
    playbookId: "pb-no-login",
    set: flat("all", c("engagement.lastLoginDays", "gt", 21)),
  },
  {
    id: "rec-quiet-no-core",
    icon: "plug",
    label: "Quiet and not using Workflows",
    blurb: "Gone quiet and never turned on Workflows.",
    playbookId: "pb-feature-drop",
    set: flat(
      "all",
      c("engagement.lastLoginDays", "gt", 21),
      c("feature.inUse", "isNoneOf", ["Workflow"]),
    ),
  },
  {
    id: "rec-payment-failed",
    icon: "credit-card",
    label: "Payment failed",
    blurb: "A charge was declined or failed.",
    playbookId: "pb-payment-failed",
    set: flat("all", c("revenue.failedPayment", "is", true)),
  },
  {
    id: "rec-slipping-engagement",
    icon: "activity",
    label: "Slipping engagement",
    blurb: "Feature use is falling and health is shaky.",
    playbookId: "pb-feature-drop",
    set: flat(
      "all",
      c("feature.engagementTrend", "falling"),
      c("health.band", "isAnyOf", ["watch", "atrisk"]),
    ),
  },
];

export const recipeById = (id: string): Recipe | undefined => RECIPES.find((r) => r.id === id);

/** Map a playbookId (a job-(a) cohort) to the recipe that pre-seeds its builder. */
export const recipeForPlaybook = (playbookId: string): Recipe | undefined =>
  RECIPES.find((r) => r.playbookId === playbookId);
