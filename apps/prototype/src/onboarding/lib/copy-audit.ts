// Copy audit — the "3-second check" dev tool that runs over a CatalogEntry
// and returns structural flags when the card breaches the spec's simplicity
// budget. Pure function, no UI. Used only on /doer-demo.

import type { CatalogEntry } from "./state-catalog";

export type AuditFlagKind = "multi-action" | "too-long" | "bare-jargon";

export interface AuditFlag {
  kind: AuditFlagKind;
  detail: string;
}

const JARGON_BLOCKLIST = ["A2P", "DKIM", "CNAME", "OAuth", "KYC"] as const;

/** Strip parenthetical substrings; spec explicitly allows a single
 *  parenthetical mention of jargon for searchability. */
function stripParentheticals(s: string): string {
  return s.replace(/\([^)]*\)/g, " ");
}

function countSentences(body: string): number {
  const trimmed = body.trim();
  if (!trimmed) return 0;
  // Split on sentence-terminating punctuation followed by whitespace.
  const parts = trimmed.split(/(?<=[.!?])\s+/).filter((p) => p.trim().length > 0);
  return parts.length || 1;
}

export function auditEntry(entry: CatalogEntry): AuditFlag[] {
  const flags: AuditFlag[] = [];

  // 1. multi-action — primary CTA AND dispute affordance both rendering.
  if (entry.primaryAction && entry.showDispute) {
    flags.push({
      kind: "multi-action",
      detail: "Card has a primary action AND a dispute link — pick one.",
    });
  }

  // 2. too-long — body over the 2-sentence budget.
  const sentences = countSentences(entry.clientCopy.body);
  if (sentences > 2) {
    flags.push({
      kind: "too-long",
      detail: `Body is ${sentences} sentences (budget: 2).`,
    });
  }

  // 3. bare-jargon — blocklist token appearing outside a parenthetical.
  const haystack = stripParentheticals(
    `${entry.clientCopy.title} ${entry.clientCopy.body}`,
  );
  const hits: string[] = [];
  for (const token of JARGON_BLOCKLIST) {
    const re = new RegExp(`\\b${token}\\b`);
    if (re.test(haystack)) hits.push(token);
  }
  if (hits.length > 0) {
    flags.push({
      kind: "bare-jargon",
      detail: `Contains bare jargon: ${hits
        .map((t) => `"${t}"`)
        .join(", ")} — wrap in (parentheses) or rewrite.`,
    });
  }

  return flags;
}
