import { useState } from "react";
import { Icon, Mono, SegmentedControl, VideoCard } from "@gocsm/design-system";
import { CriteriaBuilder } from "./CriteriaBuilder";
import { MatchWall } from "./MatchWall";
import { useHealthConfigured } from "@/state/healthConfig";
import { matchAccounts, describeSet, isAdvanced, nodesOf, type CriteriaSet } from "@/fixtures/criteriaMatch";

// TriggerStep — the "When & who it runs on" step (design-loop, 2026-06-25).
//   • A distinct HERO box at the top — "WHO THIS FIRES FOR" — restates the audience in plain
//     English and updates LIVE as the user edits the criteria (the differentiator, made the
//     unmistakable hero of the step per Karthik's "bring back the distinct box on top").
//   • A control row: a blue "watch how triggers work" video link + the Simple/Advanced toggle.
//   • The builder body. SIMPLE = a PLAYBOOK-AWARE prebuilt quick-add list (account-level plays
//     show account filters; user-activity plays layer in user filters too — see
//     defaultFiltersFor); ADVANCED = the NL box + the nested rule builder.
//   • A live count band that expands to show exactly which accounts match right now.

const fmtMoney = (n: number) => "$" + Math.round(n).toLocaleString();

export function TriggerStep({
  set,
  onChange,
  quickAddFields,
}: {
  set: CriteriaSet;
  onChange: (s: CriteriaSet) => void;
  /** Playbook-aware Simple-view default filters (from `defaultFiltersFor(playbook)`). */
  quickAddFields?: string[];
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

  // The hero sentence — the actual audience, in plain English, recomputed live on every edit.
  // The eyebrow already says "who this fires for", so the line is just the audience itself.
  const restateLine = hasFilters
    ? describeSet(set) + "."
    : "Every account — add a filter below to narrow who it runs on (optional).";

  const switchMode = (next: "simple" | "advanced") => {
    if (next === "simple" && advancedLocked) return; // disabled while genuine nesting exists
    setMode(next);
  };

  const topAccounts = [...matched].sort((a, b) => b.revenue.mrr - a.revenue.mrr);
  const canExpand = n > 0;

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", display: "flex", flexDirection: "column", gap: "var(--s-4)" }}>
      <div className="ts-who">
        {/* HERO box — who this fires for, in plain English, updated live. */}
        <div className="ts-fires">
          <span className="ts-fires-eyebrow"><Icon name="filter" /> Who this fires for</span>
          <p className="ts-fires-line" aria-live="polite">{restateLine}</p>
        </div>

        {/* Control row — a blue "how it works" video link + the Simple/Advanced toggle. */}
        <div className="ts-who-head">
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

        {/* On-demand explainer — width-capped so it never rivals the hero or the focal action. */}
        {videoOpen ? (
          <div className="ts-video"><VideoCard title="How triggers work" duration="1 min" /></div>
        ) : null}

        {advancedLocked && effectiveMode === "advanced" ? (
          <span className="cb-mode-note"><Icon name="info" /> This rule has groups — editing in Advanced.</span>
        ) : null}

        <CriteriaBuilder set={set} onChange={onChange} mode={effectiveMode} quickAddFields={quickAddFields} />
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
