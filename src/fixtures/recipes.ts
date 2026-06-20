// Starter recipes — the criteria-builder empty-state on-ramp (tappable, seeded from
// real pillar data) AND the pre-seed source when the flow opens from a job-(a) row.
// Picking one drops a fully-formed, editable CriteriaSet into the builder so the user
// adjusts rather than authors from zero (ThoughtSpot suggested-questions pattern).

import type { CriteriaSet } from "./criteriaMatch";

export interface Recipe {
  id: string;
  icon: string;
  label: string;
  blurb: string;
  set: CriteriaSet;
  /** The playbook this recipe activates downstream (the action half of the flow). */
  playbookId: string;
}

export const RECIPES: Recipe[] = [
  {
    id: "rec-pas-quiet",
    icon: "activity",
    label: "Slipping adoption + gone quiet",
    blurb: "Product use is dropping and the owner has stopped logging in.",
    playbookId: "pb-feature-drop",
    set: {
      match: "all",
      criteria: [
        { id: "c1", fieldId: "health.productAdoption", op: "lt", value: 50 },
        { id: "c2", fieldId: "user.lastLoginDaysAgo", op: "gt", value: 14 },
      ],
    },
  },
  {
    id: "rec-highmrr-down",
    icon: "trending-down",
    label: "High-MRR, trending down",
    blurb: "Your biggest accounts whose health is falling.",
    playbookId: "pb-renewal-save",
    set: {
      match: "all",
      criteria: [
        { id: "c1", fieldId: "account.mrr", op: "gt", value: 1500 },
        { id: "c2", fieldId: "health.delta", op: "falling" },
      ],
    },
  },
  {
    id: "rec-renew-risk",
    icon: "calendar-clock",
    label: "Renewing in 30 days & at-risk",
    blurb: "Renewals inside a month that aren't healthy.",
    playbookId: "pb-renewal-save",
    set: {
      match: "all",
      criteria: [
        { id: "c1", fieldId: "account.renewalInDays", op: "between", value: [0, 30] },
        { id: "c2", fieldId: "health.band", op: "isAnyOf", value: ["atrisk", "watch"] },
      ],
    },
  },
  {
    id: "rec-quiet",
    icon: "moon",
    label: "Gone quiet",
    blurb: "Owners who haven't logged in for 21+ days.",
    playbookId: "pb-no-login",
    set: {
      match: "all",
      criteria: [{ id: "c1", fieldId: "user.lastLoginDaysAgo", op: "gt", value: 21 }],
    },
  },
  {
    id: "rec-payment",
    icon: "credit-card",
    label: "Payment failed",
    blurb: "A charge was declined or failed.",
    playbookId: "pb-payment-failed",
    set: {
      match: "all",
      criteria: [{ id: "c1", fieldId: "account.lastPayment", op: "is", value: "failed" }],
    },
  },
  {
    id: "rec-low-sentiment",
    icon: "frown",
    label: "Sentiment slipping",
    blurb: "Accounts whose sentiment signal has dropped low.",
    playbookId: "pb-no-login",
    set: {
      match: "all",
      criteria: [{ id: "c1", fieldId: "health.sentiment", op: "lt", value: 40 }],
    },
  },
];

export const recipeById = (id: string): Recipe | undefined => RECIPES.find((r) => r.id === id);

/** Map a playbookId (a job-(a) cohort) to the recipe that pre-seeds its builder. */
export const recipeForPlaybook = (playbookId: string): Recipe | undefined =>
  RECIPES.find((r) => r.playbookId === playbookId);
