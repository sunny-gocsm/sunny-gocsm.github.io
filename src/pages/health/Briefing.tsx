import { useState } from "react";
import {
  BriefingHeader,
  DigestTristat,
  BriefingBody,
  SignalCard,
  MetricCard,
  Delta,
  LiveStatus,
  ActionButton,
  EvidenceBoundary,
  HealthScoreEvidence,
  MethodologyExplainer,
  Card,
  Mono,
} from "@/gocsm-ds";
import {
  header,
  digest,
  signals,
  vitals,
  isNewAgency,
  coldStart,
  cohorts,
  evidence,
} from "./briefing.fixtures";

type Mode = "solo" | "team";

function greetingFor(name: string) {
  const h = new Date().getHours();
  const part = h < 12 ? "morning" : h < 18 ? "afternoon" : "evening";
  return `Good ${part}, ${name}.`;
}

function ModeToggle({ mode, onChange }: { mode: Mode; onChange: (m: Mode) => void }) {
  return (
    <div
      style={{
        position: "fixed",
        bottom: 16,
        right: 16,
        zIndex: 50,
        display: "flex",
        gap: 4,
        padding: 4,
        borderRadius: 8,
        background: "var(--surface)",
        border: "1px solid var(--border)",
        fontSize: 12,
      }}
    >
      {(["solo", "team"] as Mode[]).map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => onChange(m)}
          style={{
            padding: "4px 10px",
            borderRadius: 6,
            background: mode === m ? "var(--blue-7)" : "transparent",
            color: mode === m ? "white" : "var(--text)",
            border: "none",
            cursor: "pointer",
          }}
        >
          {m}
        </button>
      ))}
    </div>
  );
}

// ─── Layer 1: Verdict ─────────────────────────────────────────────────────────
function VerdictLayer({ mode }: { mode: Mode }) {
  return (
    <section aria-label="Verdict" className="flex flex-col gap-4">
      <BriefingHeader
        greeting={greetingFor(header.ownerName)}
        promise={
          mode === "team"
            ? "Here's what your team needs to act on today."
            : "Here's what needs you today."
        }
        sync={<LiveStatus state="recent" label={`synced ${header.lastSync}`} />}
      />
      <DigestTristat
        sent={digest.sent}
        alerted={digest.alerted}
        waiting={digest.waiting}
        line={digest.line}
      />
      {isNewAgency ? (
        <Card>
          <div style={{ padding: "var(--s-4)", display: "flex", justifyContent: "space-between", gap: "var(--s-4)", alignItems: "center" }}>
            <div>{coldStart.banner}</div>
            <ActionButton>{coldStart.ctaLabel}</ActionButton>
          </div>
        </Card>
      ) : null}
    </section>
  );
}

// ─── Layer 2: Action ──────────────────────────────────────────────────────────
function ActionLayer({ mode }: { mode: Mode }) {
  const queue = (
    <>
      {signals.map((s) => (
        <SignalCard
          key={s.id}
          band={s.band}
          account={s.account}
          mrr={s.mrr}
          story={s.story}
          conf={s.conf}
          confDetail={s.confDetail}
          saveWindow={s.saveWindow ? <span>{s.saveWindow}</span> : null}
          exec={mode === "team" && s.assignee ? <span>{s.assignee}</span> : null}
          action={<ActionButton>{s.actionLabel}</ActionButton>}
        />
      ))}
    </>
  );

  return (
    <section aria-label="Action" className="flex flex-col gap-6">
      <BriefingBody
        count={signals.length}
        queue={queue}
        vitals={vitals.map((v) => ({
          label: v.label,
          value: v.value,
          tone: v.tone ?? undefined,
          delta: v.delta ? <Delta value={v.delta.value} direction={v.delta.direction} /> : undefined,
        }))}
        className="grid gap-4"
      />

      {mode === "team" ? (
        <div className="flex flex-col gap-3">
          <div className="text-sm" style={{ color: "var(--text-muted, var(--text))" }}>
            Act by problem
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {cohorts.map((c) => (
              <Card key={c.id}>
                <div style={{ padding: "var(--s-4)", display: "flex", flexDirection: "column", gap: "var(--s-3)" }}>
                  <div>{c.problem}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--s-3)" }}>
                    <Mono>{c.count}</Mono>
                    {c.delta ? <Delta value={c.delta.value} direction={c.delta.direction} /> : null}
                  </div>
                  <div>
                    <ActionButton>{c.actionLabel}</ActionButton>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

// ─── Layer 3: Evidence ────────────────────────────────────────────────────────
function EvidenceLayer(_: { mode: Mode }) {
  const bands = evidence.distribution.map((d) => ({
    band: d.band,
    n: d.n,
  }));

  return (
    <section aria-label="Evidence">
      <EvidenceBoundary
        label="Explore the data"
        summary={
          <div>
            Agency score is <Mono>{evidence.agencyScore}</Mono> — band{" "}
            <strong>{evidence.agencyBand}</strong>. Trend beats level.
          </div>
        }
      >
        <div className="flex flex-col gap-6">
          <HealthScoreEvidence
            score={evidence.agencyScore}
            band={evidence.agencyBand}
            bands={bands}
          />

          {/* Trend placeholder — Recharts will go here in a follow-up */}
          <Card>
            <div style={{ padding: "var(--s-4)" }}>
              <div className="text-sm mb-2">60-day trend (placeholder)</div>
              <div style={{ fontFamily: "monospace", fontSize: 12 }}>
                {evidence.trend.map((t) => `d${t.day}:${t.score}`).join("  ")}
              </div>
            </div>
          </Card>

          <MethodologyExplainer
            lede="How agency health is scored."
            pillars={evidence.pillarWeights}
            factors={evidence.methodologyFactors}
          />
        </div>
      </EvidenceBoundary>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Briefing() {
  const [mode, setMode] = useState<Mode>("solo");
  return (
    <div className="flex flex-col gap-8">
      <VerdictLayer mode={mode} />
      <ActionLayer mode={mode} />
      <EvidenceLayer mode={mode} />
      <ModeToggle mode={mode} onChange={setMode} />
    </div>
  );
}
