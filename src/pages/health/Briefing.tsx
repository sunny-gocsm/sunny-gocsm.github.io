import { Link, useSearchParams } from "react-router-dom";
import {
  BriefingHeader,
  DigestTristat,
  LiveStatus,
  Icon,
  SignalCard,
  Queue,
  ActionButton,
  SaveWindow,
  Mono,
  MetricCard,
  Delta,
  QuickWinsChecklist,
  EvidenceBoundary,
  HealthScoreEvidence,
  HealthTile,
  PillarBar,
  MethodologyExplainer,
  TeamPulseStrip,
  MyQueue,
  FixItCard,
  ExecChip,
  Tabs,
} from "@/gocsm-ds";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import {
  header,
  digest,
  signals,
  type BriefingSignal,
  vitals,
  isNewAgency,
  coldStart,
  evidence,
  teamMember,
  teamPulse,
  cohorts,
} from "./briefing.fixtures";

function greetingFor(name: string) {
  const h = new Date().getHours();
  const part = h < 12 ? "morning" : h < 18 ? "afternoon" : "evening";
  return `Good ${part}, ${name}.`;
}

// ─── Layer 1: Verdict ─────────────────────────────────────────────────────────
function VerdictLayer() {
  const handleWaiting = () => {
    const el = document.getElementById("briefing-queue");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section aria-label="Verdict" className="flex flex-col gap-4">
      <BriefingHeader
        greeting={`${greetingFor(header.ownerName)} Here's what GoCSM did overnight, and what needs you today.`}
        sync={<LiveStatus state="fresh" label={`Synced ${header.lastSync}`} />}
      />
      <DigestTristat
        sent={digest.sent}
        alerted={digest.alerted}
        waiting={digest.waiting}
        line={digest.line}
        onWaiting={handleWaiting}
      />
      <div>
        <Link
          to="/activity"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "var(--s-1)",
            color: "var(--text-3, var(--text))",
            fontSize: 13,
            textDecoration: "none",
          }}
        >
          See activity log <Icon name="arrow-right" />
        </Link>
      </div>
    </section>
  );
}

// ─── Layer 2: Action / Queue ──────────────────────────────────────────────────
function FactorPeek({ signal }: { signal: BriefingSignal }) {
  return (
    <details
      style={{
        display: "inline-block",
        fontSize: 12,
        color: "var(--text-3, var(--text))",
      }}
    >
      <summary
        style={{
          cursor: "pointer",
          listStyle: "none",
          display: "inline-flex",
          alignItems: "center",
          gap: "var(--s-1)",
        }}
      >
        Evidence <Icon name="chevron-down" />
      </summary>
      <ul
        style={{
          margin: "var(--s-2) 0 0",
          paddingLeft: "var(--s-4)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--s-1)",
        }}
      >
        {signal.factors.map((f, i) => (
          <li key={i}>{f.text}</li>
        ))}
      </ul>
    </details>
  );
}

function VitalsStrip() {
  if (!vitals.length) return null;
  return (
    <section aria-label="Your agency this week" className="flex flex-col gap-3">
      <h3 className="text-sm" style={{ color: "var(--text-3)", margin: 0 }}>
        Your agency this week
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {vitals.map((v) => (
          <MetricCard
            key={v.label}
            label={v.label}
            value={v.value}
            context={v.context}
            accent={v.tone || null}
            delta={
              v.delta ? (
                <Delta value={v.delta.value} direction={v.delta.direction} />
              ) : null
            }
          />
        ))}
      </div>
    </section>
  );
}

function CohortLane() {
  if (!cohorts.length) return null;
  return (
    <section aria-label="Act by problem" className="flex flex-col gap-3">
      <header className="flex flex-col gap-1">
        <h3 className="text-base" style={{ color: "var(--text)", margin: 0 }}>
          Act by problem
        </h3>
        <p className="text-sm" style={{ color: "var(--text-3, var(--text))", margin: 0 }}>
          GoCSM grouped these accounts because they share the same problem. Fix them as one group.
        </p>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {cohorts.map((c) => (
          <FixItCard
            key={c.id}
            icon="users"
            tag="Group"
            text={
              <span>
                {c.problem} · <Mono>{c.count}</Mono> accounts ·{" "}
                <Mono>{c.mrrAtRisk}</Mono> at risk
              </span>
            }
            conf={c.conf}
            confDetail={c.confDetail}
            action={<ActionButton>{c.actionLabel}</ActionButton>}
          />
        ))}
      </div>
    </section>
  );
}

function ActionLayer({ mode }: { mode: "solo" | "team" }) {
  if (isNewAgency) {
    return (
      <section aria-label="Action">
        <QuickWinsChecklist
          eyebrow="New agency"
          promise={coldStart.banner}
          plays={coldStart.plays.map((p) => ({ ...p, on: false, onToggle: () => {} }))}
          onActivateAll={() => {}}
        />
      </section>
    );
  }

  const isTeam = mode === "team";

  const queueCards = (
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
          exec={
            isTeam && s.assignee
              ? s.assignee === "Auto"
                ? <ExecChip auto />
                : <ExecChip member={s.assignee} reassignable />
              : null
          }
          saveWindow={s.saveWindow ? <SaveWindow>{s.saveWindow}</SaveWindow> : null}
          provenance={<FactorPeek signal={s} />}
          onSeePlaybook={() => {}}
          action={<ActionButton>{s.actionLabel}</ActionButton>}
        />
      ))}
    </>
  );

  return (
    <section
      id="briefing-queue"
      aria-label="Action"
      className="flex flex-col gap-6"
    >
      {isTeam ? (
        <TeamPulseStrip
          title={teamPulse.title}
          sub={teamPulse.sub}
          load={teamPulse.load}
          members={teamPulse.members}
          escalations={teamPulse.escalations}
        />
      ) : null}

      <div className="flex flex-col gap-3">
        {isTeam ? (
          <MyQueue
            member={teamMember.name}
            scope={teamMember.scope}
            queue={<Queue>{queueCards}</Queue>}
          />
        ) : (
          <>
            <header className="flex flex-col gap-1">
              <h2 className="text-lg" style={{ color: "var(--text)", margin: 0 }}>
                <Mono>{signals.length}</Mono> customers need you today.
              </h2>
              <p
                className="text-sm"
                style={{ color: "var(--text-3, var(--text))", margin: 0 }}
              >
                GoCSM tried what it could — these need a human.
              </p>
            </header>
            <Queue>{queueCards}</Queue>
          </>
        )}
      </div>

      {isTeam ? <CohortLane /> : null}

      <VitalsStrip />
    </section>
  );
}

// ─── Layer 3: Evidence ────────────────────────────────────────────────────────
function AgencyTrendChart() {
  return (
    <div style={{ width: "100%", height: 200 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={evidence.trend} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
          <defs>
            <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--viz-area-fill, var(--blue-7))" stopOpacity={0.5} />
              <stop offset="100%" stopColor="var(--viz-area-fill, var(--blue-7))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--viz-grid)" strokeDasharray="2 4" vertical={false} />
          <XAxis
            dataKey="day"
            stroke="var(--viz-axis)"
            tick={{ fill: "var(--viz-axis)", fontFamily: "JetBrains Mono, monospace", fontSize: 11 }}
            tickFormatter={(d) => `d${d}`}
          />
          <YAxis
            domain={[0, 100]}
            stroke="var(--viz-axis)"
            tick={{ fill: "var(--viz-axis)", fontFamily: "JetBrains Mono, monospace", fontSize: 11 }}
            width={32}
          />
          <Tooltip
            contentStyle={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              fontFamily: "JetBrains Mono, monospace",
              fontSize: 12,
              color: "var(--text)",
            }}
            labelFormatter={(d) => `Day ${d}`}
          />
          <Area type="monotone" dataKey="score" stroke="var(--blue-7)" strokeWidth={2} fill="url(#trendFill)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function EvidenceLayer() {
  const summary = (
    <div className="flex flex-col gap-1">
      <div className="text-sm" style={{ color: "var(--text-3, var(--text))" }}>
        Agency-level evidence
      </div>
      <div style={{ color: "var(--text)" }}>
        Score, distribution, trend, and methodology behind today's verdict.
      </div>
    </div>
  );

  return (
    <section aria-label="Evidence" className="flex flex-col gap-4">
      <EvidenceBoundary summary={summary} label="Explore the data">
        <div className="flex flex-col gap-6" style={{ paddingTop: "var(--s-3)" }}>
          <HealthScoreEvidence
            score={evidence.agencyScore}
            band={evidence.agencyBand}
            tag="Agency health · triage instrument"
            trend="-12 / 60d"
            onHowScored={() => {
              const el = document.getElementById("briefing-methodology");
              if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          />

          <div className="flex flex-col gap-2">
            <h4 className="text-sm" style={{ color: "var(--text-3)", margin: 0 }}>
              Distribution across <Mono>2,162</Mono> sub-accounts
            </h4>
            <div className="grid grid-cols-4 gap-3">
              {evidence.distribution.map((d) => (
                <HealthTile key={d.band} band={d.band} count={d.n} pct={`${d.pct}%`} />
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <h4 className="text-sm" style={{ color: "var(--text-3)", margin: 0 }}>
              60-day agency trend
            </h4>
            <AgencyTrendChart />
          </div>

          <div className="flex flex-col gap-2">
            <h4 className="text-sm" style={{ color: "var(--text-3)", margin: 0 }}>
              Pillar weights
            </h4>
            <PillarBar weights={evidence.pillarWeights} legend />
          </div>

          <div id="briefing-methodology" className="flex flex-col gap-2">
            <h4 className="text-sm" style={{ color: "var(--text-3)", margin: 0 }}>
              How is health scored?
            </h4>
            <MethodologyExplainer
              lede="Health is a weighted read across four pillars. Today's score is dragged down most by Product Adoption; Revenue is steady."
              pillars={evidence.pillarWeights}
              factors={evidence.methodologyFactors}
            />
          </div>

          <div>
            <Link
              to="/sub-accounts"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "var(--s-1)",
                color: "var(--text-3, var(--text))",
                fontSize: 13,
                textDecoration: "none",
              }}
            >
              See all sub-accounts <Icon name="arrow-right" />
            </Link>
          </div>
        </div>
      </EvidenceBoundary>
    </section>
  );
}

export default function Briefing() {
  const [params, setParams] = useSearchParams();
  const mode: "solo" | "team" = params.get("mode") === "team" ? "team" : "solo";

  const setMode = (m: "solo" | "team") => {
    const next = new URLSearchParams(params);
    if (m === "team") next.set("mode", "team");
    else next.delete("mode");
    setParams(next, { replace: true });
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-end">
        <div
          role="tablist"
          aria-label="Briefing mode"
          style={{
            display: "inline-flex",
            border: "1px solid var(--border)",
            borderRadius: 8,
            overflow: "hidden",
            fontSize: 12,
          }}
        >
          {(["solo", "team"] as const).map((m) => {
            const sel = mode === m;
            return (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={sel}
                onClick={() => setMode(m)}
                style={{
                  padding: "var(--s-1) var(--s-3)",
                  background: sel ? "var(--surface-2, var(--surface))" : "transparent",
                  color: sel ? "var(--text)" : "var(--text-3, var(--text))",
                  border: "none",
                  cursor: "pointer",
                  textTransform: "capitalize",
                }}
              >
                {m}
              </button>
            );
          })}
        </div>
      </div>
      <VerdictLayer />
      <ActionLayer mode={mode} />
      <EvidenceLayer />
    </div>
  );
}
