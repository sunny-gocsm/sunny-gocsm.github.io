// Triggers fixture — the catalog of trigger shapes a Playbook can be built on.
// Owner never picks "workflow vs agent"; GoCSM decides via the `via` line.

import { playbooks, matchCount, type Playbook } from "./playbooks";

export type TriggerClass =
  | "single-signal"
  | "recency-frequency"
  | "agentic-scheduler"
  | "reversal";

export interface TriggerSpec {
  id: string;
  class: TriggerClass;
  title: string;
  /** Plain-language "when" sentence. */
  when: string;
  /** How often it checks. */
  cadence: string;
  /** GoCSM decides workflow vs agent — surfaced honestly. */
  via: "workflow watch" | "AI watch";
  /** Sample population today (matches against the unified fixtures). */
  populationPlaybookId?: string;
  /** Optional human note. */
  note?: string;
}

export const triggers: TriggerSpec[] = [
  // ----- Single-signal thresholds -----
  {
    id: "trg-payment-failed",
    class: "single-signal",
    title: "Payment fails",
    when: "A payment is declined or marked failed.",
    cadence: "On each billing event.",
    via: "workflow watch",
    populationPlaybookId: "billing-failed",
  },
  {
    id: "trg-nps-detractor",
    class: "single-signal",
    title: "NPS detractor",
    when: "A response is recorded as 0–6.",
    cadence: "On submit.",
    via: "workflow watch",
  },

  // ----- Recency / frequency rules -----
  {
    id: "trg-no-login-21",
    class: "recency-frequency",
    title: "No login in 21 days",
    when: "Owner hasn't logged in for 21 or more days.",
    cadence: "Checks nightly.",
    via: "workflow watch",
    populationPlaybookId: "retention-noLogin",
  },
  {
    id: "trg-feature-drop",
    class: "recency-frequency",
    title: "Core feature usage dropped",
    when: "A core feature was used N times last month, fewer than half this month.",
    cadence: "Checks weekly.",
    via: "AI watch",
    populationPlaybookId: "adoption-featuredrop",
  },

  // ----- Agentic / cross-pillar scheduler -----
  {
    id: "trg-quiet-renewal-soon",
    class: "agentic-scheduler",
    title: "Quiet account + renewal in 30 days",
    when: "Activity is low and a renewal lands inside 30 days.",
    cadence: "Checks daily.",
    via: "AI watch",
    note: "Cross-pillar: blends login, lifecycle, and revenue.",
  },
  {
    id: "trg-thriving-expansion",
    class: "agentic-scheduler",
    title: "Established + thriving + positive movement",
    when: "Lifecycle is established, health is thriving, and a positive signal arrived.",
    cadence: "Checks weekly.",
    via: "AI watch",
    populationPlaybookId: "expansion-thriving",
    note: "Composed from health, lifecycle, and signal direction.",
  },

  // ----- Reversal / defection (sticky setup lost) -----
  {
    id: "trg-domain-disconnected",
    class: "reversal",
    title: "Domain disconnected",
    when: "A previously connected domain came off.",
    cadence: "Checks every 15 minutes.",
    via: "workflow watch",
    populationPlaybookId: "save-domain",
    note: "Sticky-setup reversal — heaviest defection signal.",
  },
  {
    id: "trg-a2p-deregistered",
    class: "reversal",
    title: "A2P registration removed",
    when: "Active A2P brand went back to unregistered.",
    cadence: "Checks every 15 minutes.",
    via: "workflow watch",
    populationPlaybookId: "save-a2p",
  },
  {
    id: "trg-integration-removed",
    class: "reversal",
    title: "Key integration removed",
    when: "A previously connected integration was disconnected.",
    cadence: "Checks hourly.",
    via: "AI watch",
    populationPlaybookId: "save-integration",
  },
];

export const TRIGGER_CLASS_LABEL: Record<TriggerClass, string> = {
  "single-signal": "Single-signal threshold",
  "recency-frequency": "Recency / frequency rule",
  "agentic-scheduler": "Agentic scheduler (cross-pillar)",
  reversal: "Reversal / defection",
};

export function populationFor(trg: TriggerSpec): number {
  if (!trg.populationPlaybookId) return 0;
  const p = playbooks.find((x) => x.id === trg.populationPlaybookId);
  return p ? matchCount(p) : 0;
}

export function playbookOf(trg: TriggerSpec): Playbook | undefined {
  if (!trg.populationPlaybookId) return undefined;
  return playbooks.find((x) => x.id === trg.populationPlaybookId);
}
