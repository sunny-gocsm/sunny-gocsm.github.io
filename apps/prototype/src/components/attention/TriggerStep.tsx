import { useState } from "react";
import { Icon, Mono, SegmentedControl } from "@gocsm/design-system";
import { CriteriaBuilder } from "./CriteriaBuilder";
import { MatchWall } from "./MatchWall";
import { useHealthConfigured } from "@/state/healthConfig";
import { matchCount, describeSet, isAdvanced, nodesOf, type CriteriaSet } from "@/fixtures/criteriaMatch";

// TriggerStep — the "When & who it runs on" step (design-loop v2, 2026-06-24).
// ONE coherent surface with exactly TWO modes (collapsed from the old three: a narrowing
// view that dropped into a separate builder with its own Simple/Advanced toggle):
//   • Who it runs on — a quiet eyebrow over the LIVE plain-English restatement of the audience
//     (the differentiator; it reads as a single sentence the owner can say aloud), the
//     Simple/Advanced toggle, and the builder body. SIMPLE = prebuilt quick-add list (no AI);
//     ADVANCED = the NL "describe your audience" box + the nested rule builder.
//   • Live audience count (+ MatchWall once Health is configured).
// The restatement is the play's seeded trigger + any narrowing, in plain English — it lives
// HERE, once, at the top, and is never duplicated. (We removed the old separate "Runs
// automatically when…" fact card: it restated the same condition that already shows as an
// editable chip, which made an ADHD owner ask "is this a fact or a second choice?".)

export function TriggerStep({
  set,
  onChange,
}: {
  set: CriteriaSet;
  onChange: (s: CriteriaSet) => void;
}) {
  const healthConfigured = useHealthConfigured();
  const advancedLocked = isAdvanced(set); // genuine nesting → Simple is disabled (lossless)
  const [mode, setMode] = useState<"simple" | "advanced">(() => (advancedLocked ? "advanced" : "simple"));
  const effectiveMode = advancedLocked ? "advanced" : mode;

  const n = matchCount(set);
  const hasFilters = nodesOf(set).length > 0;

  // The live restatement: a real plain-English audience sentence when filters exist; one
  // inviting teach line when there are none. Always leads with "Runs on" (the automation cue),
  // never references "the trigger above" (no eye-bounce, no spatial bookkeeping).
  const restateLine = hasFilters
    ? "Runs on " + describeSet(set).replace(/^Accounts where /i, "accounts where ") + "."
    : "Runs on every account — add a filter to narrow who it runs on (optional).";

  const switchMode = (next: "simple" | "advanced") => {
    if (next === "simple" && advancedLocked) return; // disabled while genuine nesting exists
    setMode(next);
  };

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", display: "flex", flexDirection: "column", gap: "var(--s-4)" }}>
      {/* Who it runs on — quiet eyebrow + LIVE plain-English restatement (hero) + Simple/Advanced toggle. */}
      <div className="ts-who">
        <div className="ts-who-head">
          <div className="ts-who-head-text">
            <span className="ts-who-title"><Icon name="users" /> Who it runs on</span>
            <p className="ts-who-restate">{restateLine}</p>
          </div>
          <SegmentedControl
            options={[
              { value: "simple", label: "Simple" },
              { value: "advanced", label: "Advanced" },
            ]}
            value={effectiveMode}
            onChange={(v: string) => switchMode(v as "simple" | "advanced")}
          />
        </div>
        {advancedLocked && effectiveMode === "advanced" ? (
          <span className="cb-mode-note"><Icon name="info" /> This rule has groups — editing in Advanced.</span>
        ) : null}

        <CriteriaBuilder set={set} onChange={onChange} mode={effectiveMode} />
      </div>

      {/* Live audience count — the accept-and-publish confidence builder (the single count on this step). */}
      <div className="ts-count">
        <Mono className="ts-count-n">{n}</Mono>
        <span className="ts-count-label">of your accounts match right now.</span>
      </div>
      {healthConfigured ? <MatchWall set={set} hideCount /> : null}
    </div>
  );
}
