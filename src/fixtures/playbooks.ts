// Playbooks fixture — seed catalog grounded in the Signal model.
// matchesToday() derives live counts from the unified accounts/signals fixtures.
// Marked seed-pending-snapshot: production catalog absorbs additional plays
// from the 10+ workflow snapshot once provided; surface is unchanged.

import {
  accounts,
  signals,
  daysSince,
  failedPayments,
  stalledOnboarding,
  lostStickySetups,
  type Account,
  type SignalSubject,
} from "./index";

export type PlaybookState = "off" | "ranonce" | "on" | "paused";
export type PlaybookKind = "save" | "retention" | "adoption" | "billing" | "onboarding" | "expansion";

export interface Playbook {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  state: PlaybookState;
  kind: PlaybookKind;
  /** One-sentence Situation (the named problem). */
  problem: string;
  /** A few pre-written moves, plain language. */
  does: string;
  /** The outcome it's trying to produce. */
  outcome: string;
  /** Pure predicate against the unified fixtures. */
  match: (a: Account) => boolean;
  /** Short explainer video for this play (~1 min). Placeholder until real video lands. */
  videoUrl: string;
  /** Optional poster image shown before the video plays. */
  videoPoster?: string;
}

// Single placeholder while real per-play recordings are produced.
const PLACEHOLDER_VIDEO = "https://www.w3schools.com/html/mov_bbb.mp4";

const STICKY_REVERSE_DAYS = 30;
const stickyReverseSubjects = (a: Account, subjects: SignalSubject[]): boolean =>
  signals.some(
    (s) =>
      s.accountId === a.identity.id &&
      s.sticky &&
      s.direction === "reverse" &&
      s.type === "setup" &&
      subjects.includes(s.subject) &&
      daysSince(s.detectedAt) <= STICKY_REVERSE_DAYS,
  );

const usageReverse = (a: Account, subjects: SignalSubject[], windowDays = 60): boolean =>
  signals.some(
    (s) =>
      s.accountId === a.identity.id &&
      s.type === "usage" &&
      s.direction === "reverse" &&
      subjects.includes(s.subject) &&
      daysSince(s.detectedAt) <= windowDays,
  );

export const playbooks: Playbook[] = [
  // ----- Retention / lifecycle -----
  {
    id: "pb-no-login",
    title: "No recent login",
    subtitle: "Re-engage owners who've gone quiet",
    icon: "log-in",
    state: "on",
    kind: "retention",
    problem: "The owner hasn't logged in for 21+ days.",
    does: "Alerts the assigned CSM, sends a warm check-in email, and queues a follow-up call task.",
    outcome: "Bring them back into the workspace before the relationship drifts.",
    match: (a) =>
      a.status.enabled === "Enabled" &&
      a.lifecycle.stage !== "onboarding" &&
      a.lifecycle.stage !== "churned" &&
      a.login.lastLoginDaysAgo >= 21,
  },
  {
    id: "pb-payment-failed",
    title: "Payment failed",
    subtitle: "Recover the invoice before churn",
    icon: "credit-card",
    state: "on",
    kind: "billing",
    problem: "A recent payment failed or the card was declined.",
    does: "Runs the dunning sequence, flags the account for the owner, and pauses outbound risk plays.",
    outcome: "Recover the invoice and keep the account live.",
    match: (a) => failedPayments().some((x) => x.identity.id === a.identity.id),
  },
  {
    id: "pb-plan-downgrade",
    title: "Plan downgrade",
    subtitle: "Save the relationship after a step-down",
    icon: "arrow-down-circle",
    state: "ranonce",
    kind: "retention",
    problem: "The account just downgraded or churned a paid add-on.",
    does: "Books a value-check call and surfaces three features they aren't using yet.",
    outcome: "Stop the slide before it becomes a full cancel.",
    match: (a) =>
      a.revenue.planChanges.some(
        (p) => (p.type === "downgrade" || p.type === "churn") && daysSince(p.date) <= 60,
      ),
  },
  {
    id: "pb-feature-drop",
    title: "Feature engagement dropped",
    subtitle: "Catch silent disengagement early",
    icon: "trending-down",
    state: "on",
    kind: "adoption",
    problem: "A core feature's usage has fallen 30%+ in the last month.",
    does: "Nudges the owner with a short how-to and notifies the CSM if no response in 7 days.",
    outcome: "Re-anchor adoption before the habit breaks.",
    match: (a) => usageReverse(a, ["Workflow"], 30) || a.adoption.underutilizedFeatures.length > 0,
  },
  {
    id: "pb-onboarding-stalled",
    title: "Onboarding stalled",
    subtitle: "Move setup forward when it gets stuck",
    icon: "alert-triangle",
    state: "on",
    kind: "onboarding",
    problem: "The account has been on the same setup step past its SLA.",
    does: "Pings the blocker (client or agency), books a 10-minute unblock call, and offers a done-with-you path.",
    outcome: "Get to first value before momentum dies.",
    match: (a) => stalledOnboarding().some((x) => x.identity.id === a.identity.id),
  },

  // ----- Save plays (sticky-setup reverse, weighted heavy) -----
  {
    id: "pb-save-domain",
    title: "Domain disconnected — win them back",
    subtitle: "Save play · sticky setup lost",
    icon: "globe",
    state: "on",
    kind: "save",
    problem: "The custom domain is no longer connected — a strong leaving-signal.",
    does: "Owner alert, white-glove reconnect offer, and a hold on any outbound until it's resolved.",
    outcome: "Reconnect the domain and confirm they're staying.",
    match: (a) => stickyReverseSubjects(a, ["Domain"]),
  },
  {
    id: "pb-save-integration",
    title: "Key integration removed",
    subtitle: "Save play · sticky setup lost",
    icon: "plug",
    state: "ranonce",
    kind: "save",
    problem: "A funnel, workflow, or other sticky integration was removed.",
    does: "Owner alert, root-cause check, and a re-install playbook from the CSM.",
    outcome: "Restore the integration before they fully migrate away.",
    match: (a) => stickyReverseSubjects(a, ["Funnel", "Workflow"]),
  },
  {
    id: "pb-save-a2p",
    title: "A2P deregistered — win them back",
    subtitle: "Save play · sticky setup lost",
    icon: "message-square-x",
    state: "off",
    kind: "save",
    problem: "A2P registration lapsed — SMS is going dark.",
    does: "Owner alert, re-registration assist, and pause any campaigns relying on SMS.",
    outcome: "Get SMS approved again and keep the account active.",
    match: (a) => stickyReverseSubjects(a, ["A2P", "Phone"]),
  },

  // ----- Expansion (positive direction) -----
  {
    id: "pb-expansion-ready",
    title: "Expansion ready",
    subtitle: "Established + thriving — time to grow",
    icon: "sparkles",
    state: "off",
    kind: "expansion",
    problem: "Established account, thriving health, and a recent positive signal.",
    does: "Surfaces an upsell-ready summary, offers a roadmap call, and queues a testimonial ask.",
    outcome: "Turn momentum into expansion revenue or advocacy.",
    match: (a) =>
      a.status.enabled === "Enabled" &&
      a.lifecycle.stage === "established" &&
      a.health.band === "thriving",
  },
];

// ----- Selectors -----

export const matchesToday = (p: Playbook): Account[] =>
  accounts.filter((a) => a.status.enabled === "Enabled" && p.match(a));

export const matchCount = (p: Playbook): number => matchesToday(p).length;

export const playbookById = (id: string): Playbook | undefined =>
  playbooks.find((p) => p.id === id);
