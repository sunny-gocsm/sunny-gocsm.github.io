// Attempts — the closed-loop signal behind Attention's job (b) ("we tried, it didn't
// land"). An attempt = a workflow that RAN against a specific account, plus the
// targeted pillar's score at run-time vs now. This is the HONEST modelling of a signal
// the production data cannot yet substantiate (no run-ledger + known per-account
// aggregation issues) — see docs/_handoff.md → NEEDS KARTHIK.
//
// status "flat"/"worse" + confidence "high" → we may claim "tried but didn't work".
// confidence "low" → we must NOT claim failure; the UI degrades to "outcome not yet
// confirmed" with the same call/email/SMS actions.
//
// Derived from the live fixtures so accountIds are always valid and bands are real.

import { byBand, type Account } from "./index";
import type { PillarScores } from "./index";

export type AttemptStatus = "improved" | "flat" | "worse" | "unconfirmed";

export interface Attempt {
  id: string;
  accountId: string;
  accountName: string;
  playbookId: string;
  playbookTitle: string;
  ranDaysAgo: number;
  targetPillar: keyof PillarScores | "score";
  targetPillarLabel: string;
  preScore: number;
  postScore: number;
  status: AttemptStatus;
  confidence: "high" | "low";
}

// Pool of accounts that still need attention (so a "tried but didn't move" claim is
// coherent — the account is genuinely still Watch/At-Risk after the attempt).
const pool: Account[] = [...byBand("atrisk"), ...byBand("watch")];

interface Seed {
  playbookId: string;
  playbookTitle: string;
  ranDaysAgo: number;
  targetPillar: keyof PillarScores | "score";
  targetPillarLabel: string;
  status: AttemptStatus;
  confidence: "high" | "low";
  /** postScore − preScore, applied to the pillar's current value to derive preScore. */
  movement: number;
}

const seeds: Seed[] = [
  { playbookId: "pb-no-login", playbookTitle: "Gone quiet", ranDaysAgo: 2, targetPillar: "login", targetPillarLabel: "Login", status: "flat", confidence: "high", movement: 0 },
  { playbookId: "pb-feature-drop", playbookTitle: "Adoption slipping", ranDaysAgo: 3, targetPillar: "productAdoption", targetPillarLabel: "Product adoption", status: "worse", confidence: "high", movement: -4 },
  { playbookId: "pb-renewal-save", playbookTitle: "Protect the renewal", ranDaysAgo: 2, targetPillar: "score", targetPillarLabel: "Overall health", status: "flat", confidence: "high", movement: 1 },
  // Low-confidence: ran, but our per-account signal isn't trustworthy → no failure claim.
  { playbookId: "pb-payment-failed", playbookTitle: "Recover payment", ranDaysAgo: 1, targetPillar: "revenue", targetPillarLabel: "Revenue", status: "unconfirmed", confidence: "low", movement: 0 },
];

const pillarNow = (a: Account, p: keyof PillarScores | "score"): number =>
  p === "score" ? a.health.score : a.health.pillarScores[p];

export const attempts: Attempt[] = seeds
  .map((s, i): Attempt | null => {
    const a = pool[i];
    if (!a) return null;
    const post = pillarNow(a, s.targetPillar);
    return {
      id: `att-${i + 1}`,
      accountId: a.identity.id,
      accountName: a.identity.name,
      playbookId: s.playbookId,
      playbookTitle: s.playbookTitle,
      ranDaysAgo: s.ranDaysAgo,
      targetPillar: s.targetPillar,
      targetPillarLabel: s.targetPillarLabel,
      preScore: post - s.movement,
      postScore: post,
      status: s.status,
      confidence: s.confidence,
    };
  })
  .filter((x): x is Attempt => x !== null);

/** High-confidence "we tried and it didn't move" — safe to assert failure. */
export const triedButFailed = (): Attempt[] =>
  attempts.filter(
    (t) => t.confidence === "high" && (t.status === "flat" || t.status === "worse") && t.ranDaysAgo >= 1,
  );

/** Ran, but the signal is too weak to claim failure — honest "outcome not yet confirmed". */
export const triedUnconfirmed = (): Attempt[] => attempts.filter((t) => t.confidence === "low");
