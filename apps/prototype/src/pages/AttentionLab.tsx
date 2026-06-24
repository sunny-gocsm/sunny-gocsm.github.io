import { useState } from "react";
import { SegmentedControl } from "@gocsm/design-system";
import { CriteriaBuilder } from "@/components/attention/CriteriaBuilder";
import type { CriteriaSet } from "@/fixtures/criteriaMatch";

// Scratch dev surface for auditing the criteria builder + MatchWall in isolation
// (Phase 4 steps 2–4). Not linked in nav; reachable at /attention-lab. Removed
// before the macro loop. The builder body is now mode-controlled by its parent, so
// the lab carries its own Simple/Advanced toggle.

export default function AttentionLab() {
  const [set, setSet] = useState<CriteriaSet>({ match: "all", criteria: [] });
  const [mode, setMode] = useState<"simple" | "advanced">("simple");

  return (
    <main style={{ maxWidth: 1180, margin: "0 auto", padding: "var(--s-8) var(--s-6)", display: "flex", flexDirection: "column", gap: "var(--s-5)", color: "var(--text)" }}>
      <h1 style={{ fontSize: "var(--t-display-lg)", fontWeight: 700, margin: 0 }}>Criteria builder lab</h1>
      <SegmentedControl
        options={[
          { value: "simple", label: "Simple" },
          { value: "advanced", label: "Advanced" },
        ]}
        value={mode}
        onChange={(v: string) => setMode(v as "simple" | "advanced")}
      />
      <CriteriaBuilder set={set} onChange={setSet} mode={mode} />
    </main>
  );
}
