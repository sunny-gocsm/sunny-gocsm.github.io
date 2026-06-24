import { useState } from "react";
import { Icon, Mono, SegmentedControl, VideoCard } from "@gocsm/design-system";
import { CriteriaBuilder } from "./CriteriaBuilder";
import { MatchWall } from "./MatchWall";
import { useHealthConfigured } from "@/state/healthConfig";
import { matchAccounts, describeSet, isAdvanced, nodesOf, type CriteriaSet } from "@/fixtures/criteriaMatch";

// TriggerStep — the "When & who it runs on" step (design-loop v2, 2026-06-24).
// ONE coherent surface with exactly TWO modes:
//   • Who it runs on — a control row (quiet eyebrow · a collapsed "watch how triggers work"
//     video disclosure · the Simple/Advanced toggle) over the LIVE plain-English restatement
//     of the audience (the hero, full width below the controls). SIMPLE = prebuilt quick-add
//     list (no AI); ADVANCED = the NL "describe your audience" box + the nested rule builder.
//   • A live audience-count band that is itself a disclosure: "N match · See who" expands an
//     inline list of exactly which accounts qualify right now (plain name + $ in Phase 1;
//     the richer MatchWall once Health is configured).
// The restatement lives here, once, at the top; the explainer video is secondary/on-demand
// (Step 1 already carries the big "how this playbook works" hero).

const fmtMoney = (n: number) => "$" + Math.round(n).toLocaleString();

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
  const [videoOpen, setVideoOpen] = useState(false);
  const [accountsOpen, setAccountsOpen] = useState(false);
  const effectiveMode = advancedLocked ? "advanced" : mode;

  const matched = matchAccounts(set);
  const n = matched.length;
  const hasFilters = nodesOf(set).length > 0;

  // The live restatement: a real plain-English audience sentence when filters exist; one
  // inviting teach line when there are none. Always leads with "Runs on" (the automation cue).
  const restateLine = hasFilters
    ? "Runs on " + describeSet(set).replace(/^Accounts where /i, "accounts where ") + "."
    : "Runs on every account — add a filter to narrow who it runs on (optional).";

  const switchMode = (next: "simple" | "advanced") => {
    if (next === "simple" && advancedLocked) return; // disabled while genuine nesting exists
    setMode(next);
  };

  const topAccounts = [...matched].sort((a, b) => b.revenue.mrr - a.revenue.mrr);
  const canExpand = n > 0;

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", display: "flex", flexDirection: "column", gap: "var(--s-4)" }}>
      <div className="ts-who">
        {/* Control row: eyebrow · secondary video disclosure · mode toggle. */}
        <div className="ts-who-head">
          <span className="ts-who-title"><Icon name="users" /> Who it runs on</span>
          <div className="ts-who-head-right">
            <button
              type="button"
              className="ts-video-toggle"
              aria-expanded={videoOpen}
              onClick={() => setVideoOpen((v) => !v)}
            >
              <Icon name={videoOpen ? "chevron-down" : "chevron-right"} /> Watch how triggers work
              <span className="ts-video-dur">· 1 min</span>
            </button>
            <SegmentedControl
              options={[
                { value: "simple", label: "Simple" },
                { value: "advanced", label: "Advanced" },
              ]}
              value={effectiveMode}
              onChange={(v: string) => switchMode(v as "simple" | "advanced")}
            />
          </div>
        </div>

        {/* On-demand explainer — width-capped so it never rivals the hero or the focal action. */}
        {videoOpen ? (
          <div className="ts-video"><VideoCard title="How triggers work" duration="1 min" /></div>
        ) : null}

        {/* The hero — live plain-English restatement, full width. */}
        <p className="ts-who-restate">{restateLine}</p>

        {advancedLocked && effectiveMode === "advanced" ? (
          <span className="cb-mode-note"><Icon name="info" /> This rule has groups — editing in Advanced.</span>
        ) : null}

        <CriteriaBuilder set={set} onChange={onChange} mode={effectiveMode} />
      </div>

      {/* Live audience count — a disclosure. Expand to see exactly who matches right now. */}
      <div className="ts-count-wrap">
        <button
          type="button"
          className="ts-count"
          aria-expanded={accountsOpen}
          disabled={!canExpand}
          onClick={() => canExpand && setAccountsOpen((o) => !o)}
        >
          <Mono className="ts-count-n">{n}</Mono>
          <span className="ts-count-label">of your accounts match right now.</span>
          {canExpand ? (
            <span className="ts-count-see">
              {accountsOpen ? "Hide" : "See who"} <Icon name={accountsOpen ? "chevron-up" : "chevron-down"} />
            </span>
          ) : null}
        </button>

        {accountsOpen && canExpand ? (
          <div className="ts-matches">
            {healthConfigured ? (
              // Phase 2 — the richer wall (rows with bands, breadth, forecast).
              <MatchWall set={set} hideCount />
            ) : (
              // Phase 1 — HL-native only: plain name + monthly $, sorted by value, scrollable.
              <div className="ts-matches-list">
                {topAccounts.map((a) => (
                  <div key={a.identity.id} className="ts-match-row">
                    <span className="ts-match-name">{a.identity.name}</span>
                    <Mono className="ts-match-mrr">{fmtMoney(a.revenue.mrr)}/mo</Mono>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
