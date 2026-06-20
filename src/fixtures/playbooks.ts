// Playbooks fixture — seed catalog grounded in the Signal model.
// matchesToday() derives live counts from the unified accounts/signals fixtures.
// Marked seed-pending-snapshot: production catalog absorbs additional plays
// from the 10+ workflow snapshot once provided; surface is unchanged.

import {
  accounts,
  signals,
  daysSince,
  daysUntil,
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

// Per-play video assignments. All point to the placeholder for now;
// production swaps these for the real recordings keyed by play id.
const PLAY_VIDEOS: Record<string, string> = {
  "pb-no-login": PLACEHOLDER_VIDEO,
  "pb-renewal-save": PLACEHOLDER_VIDEO,
  "pb-payment-failed": PLACEHOLDER_VIDEO,
  "pb-plan-downgrade": PLACEHOLDER_VIDEO,
  "pb-feature-drop": PLACEHOLDER_VIDEO,
  "pb-onboarding-stalled": PLACEHOLDER_VIDEO,
  "pb-save-domain": PLACEHOLDER_VIDEO,
  "pb-save-integration": PLACEHOLDER_VIDEO,
  "pb-save-a2p": PLACEHOLDER_VIDEO,
  "pb-expansion-ready": PLACEHOLDER_VIDEO,
};

type PlaybookSeed = Omit<Playbook, "videoUrl">;

const playbookSeeds: PlaybookSeed[] = [
  // ----- Retention / lifecycle -----
  {
    id: "pb-no-login",
    title: "No recent login",
    subtitle: "Win back owners who've gone quiet",
    icon: "log-in",
    state: "on",
    kind: "retention",
    problem: "The owner hasn't logged in for 21+ days.",
    does: "Alerts your team, sends a warm check-in email, and sets a follow-up call.",
    outcome: "Bring them back into the workspace before the relationship drifts.",
    match: (a) =>
      a.status.enabled === "Enabled" &&
      a.lifecycle.stage !== "onboarding" &&
      a.lifecycle.stage !== "churned" &&
      a.login.lastLoginDaysAgo >= 21,
  },
  {
    id: "pb-renewal-save",
    title: "Renewing soon & at risk",
    subtitle: "Protect the renewal before it lapses",
    icon: "calendar-clock",
    state: "off",
    kind: "retention",
    problem: "Renews within 30 days and showing warning signs.",
    does: "Alerts your team, sends a renewal check-in, and shares a quick value recap before renewal.",
    outcome: "Lock in the renewal before it slips.",
    match: (a) => {
      const d = daysUntil(a.revenue.renewalDate);
      return d >= 0 && d <= 30 && (a.health.band === "atrisk" || a.health.band === "watch");
    },
  },
  {
    id: "pb-payment-failed",
    title: "Payment failed",
    subtitle: "Recover the invoice before churn",
    icon: "credit-card",
    state: "on",
    kind: "billing",
    problem: "A recent payment failed or the card was declined.",
    does: "Sends payment reminders, flags the account for you, and pauses other messages.",
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
    problem: "The account just downgraded or dropped a paid add-on.",
    does: "Books a value-check call and shows three features they aren't using yet.",
    outcome: "Stop the slide before it becomes a full cancel.",
    match: (a) =>
      a.revenue.planChanges.some(
        (p) => (p.type === "downgrade" || p.type === "churn") && daysSince(p.date) <= 60,
      ),
  },
  {
    id: "pb-feature-drop",
    title: "Usage dropping",
    subtitle: "Catch quiet drop-off early",
    icon: "trending-down",
    state: "on",
    kind: "adoption",
    problem: "A key feature's usage fell 30%+ this month.",
    does: "Nudges the owner with a short how-to, and tells your team if there's no reply in 7 days.",
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
    problem: "The account has been stuck on the same setup step too long.",
    does: "Nudges whoever's stuck, books a 10-minute call, and offers to do it with them.",
    outcome: "Get to first value before momentum dies.",
    match: (a) => stalledOnboarding().some((x) => x.identity.id === a.identity.id),
  },

  // ----- Save plays (sticky-setup reverse, weighted heavy) -----
  {
    id: "pb-save-domain",
    title: "Website disconnected — win them back",
    subtitle: "Save play · key setup lost",
    icon: "globe",
    state: "on",
    kind: "save",
    problem: "Their website is no longer connected — a strong sign they're leaving.",
    does: "Alerts you, offers a hands-on reconnect, and pauses messages until it's fixed.",
    outcome: "Reconnect their website and confirm they're staying.",
    match: (a) => stickyReverseSubjects(a, ["Domain"]),
  },
  {
    id: "pb-save-integration",
    title: "Key integration removed",
    subtitle: "Save play · key setup lost",
    icon: "plug",
    state: "ranonce",
    kind: "save",
    problem: "A page, automation, or other key setup was removed.",
    does: "Alerts you, finds the cause, and gives your team a re-setup playbook.",
    outcome: "Restore the integration before they fully migrate away.",
    match: (a) => stickyReverseSubjects(a, ["Funnel", "Workflow"]),
  },
  {
    id: "pb-save-a2p",
    title: "Texting registration lost — win them back",
    subtitle: "Save play · key setup lost",
    icon: "message-square-x",
    state: "off",
    kind: "save",
    problem: "Their phone-texting registration lapsed — texts are about to stop.",
    does: "Alerts you, helps them re-register, and pauses texts until it's fixed.",
    outcome: "Get texting approved again and keep the account active.",
    match: (a) => stickyReverseSubjects(a, ["A2P", "Phone"]),
  },

  // ----- Expansion (positive direction) -----
  {
    id: "pb-expansion-ready",
    title: "Expansion ready",
    subtitle: "Doing great — time to grow",
    icon: "sparkles",
    state: "off",
    kind: "expansion",
    problem: "Doing great, healthy, and trending up.",
    does: "Shows what to upsell, offers a planning call, and asks for a testimonial.",
    outcome: "Turn momentum into expansion revenue or advocacy.",
    match: (a) =>
      a.status.enabled === "Enabled" &&
      a.lifecycle.stage === "established" &&
      a.health.band === "thriving",
  },
];

export const playbooks: Playbook[] = playbookSeeds.map((p) => ({
  ...p,
  videoUrl: PLAY_VIDEOS[p.id] ?? PLACEHOLDER_VIDEO,
}));

// ----- Selectors -----

export const matchesToday = (p: Playbook): Account[] =>
  accounts.filter((a) => a.status.enabled === "Enabled" && p.match(a));

export const matchCount = (p: Playbook): number => matchesToday(p).length;

export const playbookById = (id: string): Playbook | undefined =>
  playbooks.find((p) => p.id === id);
