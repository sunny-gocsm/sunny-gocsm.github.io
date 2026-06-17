// Outcomes fixture — verified wins, observational (never causal).
// Each outcome is a closed loop: a Playbook ran, then something changed.
// Plain-language `lead` + `rest` mirror Receipts/ActionReceipt copy.

import { playbookById, type Playbook } from "./playbooks";
import { accounts, type Account } from "./index";

export type OutcomeKind = "save" | "recovery" | "adoption" | "renewal" | "expansion" | "onboarding";

export interface Outcome {
  id: string;
  playbookId: string;
  kind: OutcomeKind;
  accountId: string;
  /** Bold opener — what happened in plain words. */
  lead: string;
  /** Sentence continuation; reference $amounts/counts as plain text. */
  rest: string;
  /** Receipt stats: a couple of small figures. */
  stats: { v: string; l: string; tone?: "pos" | "muted" }[];
  /** Days ago this verified. */
  daysAgo: number;
  /** Who got attributed (assist vs solo). */
  attribution: "playbook-solo" | "playbook-assist";
  /** Owner-readable amount (USD) if money-shaped. */
  amount?: number;
}

const byName = (n: string): Account | undefined =>
  accounts.find((a) => a.identity.name === n);

function pick(name: string): string {
  return byName(name)?.identity.id ?? accounts[0].identity.id;
}

export const outcomes: Outcome[] = [
  {
    id: "out-1",
    playbookId: "save-domain",
    kind: "save",
    accountId: pick("Modern Physio"),
    lead: "You reached out and saved a $1,490 renewal.",
    rest: " Domain came back online within 36 hours of the warm note.",
    stats: [
      { v: "$1,490", l: "renewal saved", tone: "pos" },
      { v: "1.5d", l: "to recover" },
    ],
    daysAgo: 2,
    attribution: "playbook-assist",
    amount: 1490,
  },
  {
    id: "out-2",
    playbookId: "billing-failed",
    kind: "recovery",
    accountId: pick("Bright Smile Dental"),
    lead: "Dunning recovered a failed payment.",
    rest: " Card updated on the 2nd retry — no human touch needed.",
    stats: [
      { v: "$890", l: "recovered", tone: "pos" },
      { v: "2", l: "retries" },
    ],
    daysAgo: 4,
    attribution: "playbook-solo",
    amount: 890,
  },
  {
    id: "out-3",
    playbookId: "retention-noLogin",
    kind: "renewal",
    accountId: pick("Forge Fitness"),
    lead: "A warm check-in pulled a quiet account back.",
    rest: " They logged in the next day and booked a strategy call.",
    stats: [
      { v: "1d", l: "to first login", tone: "pos" },
      { v: "1", l: "call booked" },
    ],
    daysAgo: 6,
    attribution: "playbook-assist",
  },
  {
    id: "out-4",
    playbookId: "adoption-featuredrop",
    kind: "adoption",
    accountId: pick("Stellar Studios"),
    lead: "An adoption nudge brought workflow usage back.",
    rest: " 3 workflows reactivated in the week after the how-to went out.",
    stats: [
      { v: "+3", l: "workflows active", tone: "pos" },
      { v: "12%", l: "usage delta" },
    ],
    daysAgo: 9,
    attribution: "playbook-solo",
  },
  {
    id: "out-5",
    playbookId: "save-a2p",
    kind: "save",
    accountId: pick("Atlas Legal"),
    lead: "You reached out and protected $2,300 of MRR.",
    rest: " A2P was redeposited the same week — sticky setup restored.",
    stats: [
      { v: "$2,300", l: "MRR protected", tone: "pos" },
      { v: "5d", l: "to restore" },
    ],
    daysAgo: 11,
    attribution: "playbook-assist",
    amount: 2300,
  },
  {
    id: "out-6",
    playbookId: "onboarding-stalled",
    kind: "onboarding",
    accountId: pick("Lumen Wellness"),
    lead: "An unblock call moved a stalled launch forward.",
    rest: " Funnel + workflow shipped two days later — first SMS sent.",
    stats: [
      { v: "2d", l: "to unblock", tone: "pos" },
      { v: "1", l: "launch live" },
    ],
    daysAgo: 13,
    attribution: "playbook-assist",
  },
  {
    id: "out-7",
    playbookId: "expansion-thriving",
    kind: "expansion",
    accountId: pick("Northwind Realty"),
    lead: "A roadmap chat opened an expansion lane.",
    rest: " They asked about adding 2 sub-accounts within the same brand.",
    stats: [
      { v: "+2", l: "sub-accounts", tone: "pos" },
      { v: "1", l: "expansion call" },
    ],
    daysAgo: 16,
    attribution: "playbook-assist",
  },
];

export function outcomesFor(playbookId: string): Outcome[] {
  return outcomes.filter((o) => o.playbookId === playbookId);
}

export function outcomePlaybook(o: Outcome): Playbook | undefined {
  return playbookById(o.playbookId);
}

/** Aggregate dollars saved/recovered/protected this week. */
export function weeklyTotals() {
  const recent = outcomes.filter((o) => o.daysAgo <= 7);
  const sent = recent.length;
  const recovered = recent.reduce(
    (s, o) => s + (o.kind === "recovery" || o.kind === "save" ? o.amount ?? 0 : 0),
    0,
  );
  const protectedMrr = recent.reduce(
    (s, o) => s + (o.kind === "save" ? o.amount ?? 0 : 0),
    0,
  );
  return { sent, recovered, protected: protectedMrr };
}

export function outcomeAccount(o: Outcome): Account | undefined {
  return accounts.find((a) => a.identity.id === o.accountId);
}
