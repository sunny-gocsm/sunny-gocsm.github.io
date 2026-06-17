// Onboarding — the agency-facing surface.
// Two tabs: "Stall dashboard" (funnel + bottlenecks + stalled-by-impact +
// SLA tone + median days to activate + intervention outcomes) and "Journeys"
// (list / detail / builder with jargon audit + client preview).
//
// stalled is operator-only. Client preview uses plain language.
// Funnel chart colors come from --viz tokens only.

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Badge,
  Button,
  Card,
  ConfTag,
  Delta,
  Icon,
  MetricCard,
  Mono,
  OnboardingStep,
  QueueRow,
  Tabs,
  Toggle,
} from "@/gocsm-ds";
import {
  allAccounts,
  stalledByImpact,
  stalledOnboarding,
  type Account,
} from "@/fixtures";
import {
  STEP_CATALOG,
  auditTitle,
  journeys as journeyFixtures,
  stepByKey,
  type Experience,
  type Journey,
  type Placement,
  type StepCatalogItem,
} from "@/fixtures/journeys";
import { PageRibbon } from "@/components/PageRibbon";

const fmtMoney = (n: number) => "$" + Math.round(n).toLocaleString();

// ---------------------------------------------------------------------------
// Cross-cutting helpers
// ---------------------------------------------------------------------------

const accounts = allAccounts();
const onboardingAccounts = accounts.filter((a) => a.lifecycle.stage === "onboarding");

/** Median journey_started_days_ago across accounts that have reached activated. */
function medianDaysToActivate(): number {
  const xs = accounts
    .filter((a) => a.lifecycle.stage === "activated" || a.lifecycle.stage === "established")
    .map((a) => a.onboarding.journey_started_days_ago)
    .filter((d) => d > 0)
    .sort((a, b) => a - b);
  if (!xs.length) return 28;
  const mid = Math.floor(xs.length / 2);
  return xs.length % 2 ? xs[mid] : Math.round((xs[mid - 1] + xs[mid]) / 2);
}

// Use the same 8-step shape as the per-account view for the funnel.
const FUNNEL_STEPS = ["Account", "Domain", "Phone", "A2P", "Imports", "Funnel", "Workflow", "Launch"];

interface FunnelRow {
  step: string;
  reached: number;
  drop: number;
}

function funnelData(): FunnelRow[] {
  const total = onboardingAccounts.length || 1;
  // accounts reached step i = those with steps_done >= i (or further in lifecycle).
  return FUNNEL_STEPS.map((label, i) => {
    const reached =
      onboardingAccounts.filter((a) => a.onboarding.steps_done >= i).length +
      // activated/established already cleared the funnel
      accounts.filter((a) => a.lifecycle.stage !== "onboarding" && a.lifecycle.stage !== "churned" && a.lifecycle.stage !== "dormant").length;
    return { step: label, reached, drop: 0, _i: i } as FunnelRow & { _i: number };
  }).map((r, i, arr) => ({
    ...r,
    drop: i === 0 ? 0 : Math.max(0, arr[i - 1].reached - r.reached),
  }));
}

/** Aggregate intervention outcomes from accounts.last_intervention. */
function interventionTally() {
  let nudged = 0;
  let completed = 0;
  let noReply = 0;
  for (const a of accounts) {
    const last = a.onboarding.last_intervention;
    if (!last) continue;
    nudged++;
    const o = (last.outcome || "").toLowerCase();
    if (o.includes("complete") || o.includes("done")) completed++;
    else if (o.includes("no reply") || o.includes("no movement")) noReply++;
  }
  return { nudged, completed, noReply };
}

// ---------------------------------------------------------------------------
// Stall dashboard
// ---------------------------------------------------------------------------

function StallDashboard({ onSendToToday }: { onSendToToday: (a: Account) => void }) {
  const stalled = useMemo(() => stalledOnboarding(), []);
  const ranked = useMemo(() => stalledByImpact(), []);
  const median = useMemo(() => medianDaysToActivate(), []);
  const funnel = useMemo(() => funnelData(), []);
  const interventions = useMemo(() => interventionTally(), []);
  const totalMrrAtRisk = stalled.reduce((s, a) => s + a.revenue.mrr, 0);
  const navigate = useNavigate();

  // Bottleneck = the step with the biggest drop in the funnel.
  const bottleneck = funnel
    .slice(1)
    .reduce<{ step: string; drop: number } | null>(
      (acc, r) => (acc && acc.drop >= r.drop ? acc : { step: r.step, drop: r.drop }),
      null,
    );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-5)" }}>
      {/* KPI strip */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "var(--s-3)",
        }}
      >
        <MetricCard
          label="Stalled onboardings"
          value={<Mono>{stalled.length}</Mono>}
          icon={<Icon name="alert-triangle" />}
          iconTone="warn"
          accent={stalled.length > 0 ? "neg" : null}
          delta={<Delta value={fmtMoney(totalMrrAtRisk)} direction="bad-up" />}
          context="MRR exposed"
        />
        <MetricCard
          label="Median time to activate"
          value={
            <span>
              {median}
              <span style={{ font: "var(--t-meta)", color: "var(--text-3, var(--text))" }}> days</span>
            </span>
          }
          icon={<Icon name="calendar-clock" />}
          iconTone="info"
          delta={
            <Delta
              value={`${median - 28 >= 0 ? "+" : ""}${median - 28}d vs target`}
              direction={median <= 28 ? "up" : "bad-up"}
            />
          }
          context="baseline 28d"
        />
        <MetricCard
          label="Bottleneck step"
          value={
            <span style={{ font: "var(--t-h3)" }}>
              {bottleneck?.step ?? "—"}
            </span>
          }
          icon={<Icon name="filter" />}
          iconTone="warn"
          delta={
            bottleneck ? (
              <Delta value={`-${bottleneck.drop}`} direction="bad-up" />
            ) : undefined
          }
          context="biggest drop in the funnel"
        />
        <MetricCard
          label="Interventions"
          value={<Mono>{interventions.nudged}</Mono>}
          icon={<Icon name="send" />}
          iconTone="info"
          delta={
            <Delta
              value={`${interventions.completed} → completed`}
              direction={interventions.completed > 0 ? "up" : "flat"}
            />
          }
          context={`${interventions.noReply} no reply`}
        />
      </section>

      {/* Funnel chart */}
      <Card padded>
        <header
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            marginBottom: "var(--s-2)",
          }}
        >
          <h3 style={{ font: "var(--t-h3)", margin: 0 }}>Activation funnel</h3>
          <ConfTag basis="fact" detail="reached per step / drop per step" />
        </header>
        <div style={{ width: "100%", height: 240 }}>
          <ResponsiveContainer>
            <BarChart data={funnel} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
              <CartesianGrid stroke="var(--viz-grid)" vertical={false} />
              <XAxis dataKey="step" stroke="var(--viz-axis)" fontSize={11} />
              <YAxis stroke="var(--viz-axis)" fontSize={11} width={40} />
              <Tooltip
                contentStyle={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  color: "var(--text)",
                  fontSize: 12,
                }}
              />
              <Bar dataKey="reached" radius={[6, 6, 0, 0]}>
                {funnel.map((r) => (
                  <Cell
                    key={r.step}
                    fill={
                      bottleneck && r.step === bottleneck.step
                        ? "var(--viz-seq-6)"
                        : "var(--viz-seq-3)"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p style={{ font: "var(--t-meta)", color: "var(--text-3, var(--text))", margin: "var(--s-2) 0 0" }}>
          {bottleneck
            ? `Biggest drop at "${bottleneck.step}" — ${bottleneck.drop} accounts didn't reach the next step.`
            : "No clear bottleneck in this cohort."}
        </p>
      </Card>

      {/* Stalled by impact */}
      <section style={{ display: "flex", flexDirection: "column", gap: "var(--s-2)" }}>
        <header
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
          }}
        >
          <h3 style={{ font: "var(--t-h3)", margin: 0 }}>
            Stalled accounts, ranked by impact
          </h3>
          <Badge variant="neutral" dot={false}>
            <Mono>{ranked.length}</Mono> stalled · operator-only
          </Badge>
        </header>
        {ranked.length === 0 ? (
          <Card padded>
            <span style={{ font: "var(--t-body)", color: "var(--text-3, var(--text))" }}>
              No onboardings are stalled right now.
            </span>
          </Card>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-2)" }}>
            {ranked.map((a) => {
              const onb = a.onboarding;
              const breach = onb.days_on_current_step > onb.sla_days;
              const intervention = onb.last_intervention;
              return (
                <QueueRow
                  key={a.identity.id}
                  subject={
                    <span>
                      <strong style={{ color: "var(--text)" }}>{a.identity.name}</strong>{" "}
                      <span style={{ color: "var(--text-3, var(--text))" }}>
                        · stuck on "{onb.current_step}" for {onb.days_on_current_step}d
                      </span>
                    </span>
                  }
                  impact={<Mono>{fmtMoney(a.revenue.mrr)}</Mono>}
                  blockedBy={onb.blocked_by ?? undefined}
                  sla={`${onb.days_on_current_step}d / ${onb.sla_days}d SLA`}
                  slaBreach={breach}
                  memory={
                    intervention
                      ? `${intervention.type} ${intervention.days_ago}d ago — ${intervention.outcome}`
                      : undefined
                  }
                  action={
                    <span style={{ display: "inline-flex", gap: "var(--s-1)" }}>
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={<Icon name="book-open" />}
                        onClick={() => onSendToToday(a)}
                      >
                        Run a Playbook
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => navigate(`/accounts/${a.identity.id}`)}
                      >
                        Open
                      </Button>
                    </span>
                  }
                />
              );
            })}
          </div>
        )}
      </section>

      {/* Intervention outcomes */}
      <Card padded>
        <header
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            marginBottom: "var(--s-2)",
          }}
        >
          <h3 style={{ font: "var(--t-h3)", margin: 0 }}>Intervention outcomes</h3>
          <ConfTag basis="fact" detail="from last_intervention on each account" />
        </header>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "var(--s-3)",
            font: "var(--t-body)",
          }}
        >
          <span>
            <Mono>{interventions.nudged}</Mono> nudged
          </span>
          <span>→</span>
          <span style={{ color: "var(--text)" }}>
            <Mono>{interventions.completed}</Mono> completed
          </span>
          <span>·</span>
          <span style={{ color: "var(--text-3, var(--text))" }}>
            <Mono>{interventions.noReply}</Mono> no reply
          </span>
          <span style={{ marginLeft: "auto", color: "var(--text-3, var(--text))", font: "var(--t-meta)" }}>
            Interventions ship as Playbooks — see the catalog for the action loop.
          </span>
        </div>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Journeys — list / detail / builder
// ---------------------------------------------------------------------------

const STATUS_VARIANT: Record<Journey["status"], "pos" | "neutral" | "warn"> = {
  published: "pos",
  draft: "warn",
  archived: "neutral",
};

function JourneyList({
  onSelect,
}: {
  onSelect: (j: Journey) => void;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
        gap: "var(--s-3)",
      }}
    >
      {journeyFixtures.map((j) => (
        <Card key={j.id} padded>
          <div
            onClick={() => onSelect(j)}
            style={{ display: "flex", flexDirection: "column", gap: "var(--s-2)", cursor: "pointer" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "var(--s-2)" }}>
              <span style={{ font: "var(--t-h3)" }}>{j.name}</span>
              <Badge variant="neutral" dot={false}>{j.version}</Badge>
              <span style={{ marginLeft: "auto" }}>
                <Badge variant={STATUS_VARIANT[j.status]} dot>{j.status}</Badge>
              </span>
            </div>
            <p style={{ font: "var(--t-meta)", color: "var(--text-3, var(--text))", margin: 0 }}>
              {j.description}
            </p>
            <div
              style={{
                display: "flex",
                gap: "var(--s-3)",
                font: "var(--t-meta)",
                color: "var(--text-3, var(--text))",
              }}
            >
              <span><Mono>{j.steps.length}</Mono> steps</span>
              <span>{j.targetDays}d target</span>
              <span><Mono>{j.clientCount}</Mono> clients</span>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

const TIER_VARIANT: Record<StepCatalogItem["tier"], "pos" | "blue" | "neutral"> = {
  A: "pos",
  B: "blue",
  C: "neutral",
};

const PLACEMENTS: Placement[] = ["banner", "floating", "menu", "embed"];

function JourneyDetail({
  journey,
  onBack,
  onEdit,
}: {
  journey: Journey;
  onBack: () => void;
  onEdit: () => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-4)" }}>
      <header style={{ display: "flex", alignItems: "center", gap: "var(--s-2)", flexWrap: "wrap" }}>
        <Button variant="ghost" size="sm" icon={<Icon name="arrow-left" />} onClick={onBack}>
          Journeys
        </Button>
        <h2 style={{ font: "var(--t-h2)", margin: 0 }}>{journey.name}</h2>
        <Badge variant="neutral" dot={false}>{journey.version}</Badge>
        <Badge variant={STATUS_VARIANT[journey.status]} dot>{journey.status}</Badge>
        <span style={{ marginLeft: "auto", display: "inline-flex", gap: "var(--s-2)" }}>
          <Button variant="secondary" size="sm" icon={<Icon name="sliders-horizontal" />} onClick={onEdit}>
            Edit in builder
          </Button>
        </span>
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "var(--s-3)",
        }}
      >
        <MetricCard label="Steps" value={<Mono>{journey.steps.length}</Mono>} icon={<Icon name="list" />} />
        <MetricCard label="Target days" value={<span>{journey.targetDays}</span>} icon={<Icon name="calendar-clock" />} />
        <MetricCard label="Clients on this journey" value={<Mono>{journey.clientCount}</Mono>} icon={<Icon name="users" />} />
        <MetricCard
          label="Experience"
          value={<span style={{ font: "var(--t-h3)" }}>{journey.experience === "guided" ? "Guided" : "Tracking only"}</span>}
          icon={<Icon name="sparkles" />}
        />
      </div>

      <Card padded>
        <h3 style={{ font: "var(--t-h3)", margin: "0 0 var(--s-3)" }}>Steps</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-2)" }}>
          {journey.steps.map((key, i) => {
            const step = stepByKey(key);
            if (!step) return null;
            const audit = auditTitle(step.title);
            return (
              <div key={key} style={{ display: "flex", flexDirection: "column", gap: "var(--s-1)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--s-2)" }}>
                  <Badge variant={TIER_VARIANT[step.tier]} dot={false}>Tier {step.tier}</Badge>
                  <Badge variant={step.owner === "agency" ? "blue" : "neutral"} dot={false}>
                    {step.owner === "agency" ? "agency owns" : "client owns"}
                  </Badge>
                  <span style={{ font: "var(--t-meta)", color: "var(--text-3, var(--text))" }}>
                    SLA {step.slaDays}d
                  </span>
                  {!audit.ok ? (
                    <Badge variant="warn" dot={false} title="Plain-language audit flagged this title">
                      audit: {audit.jargon[0] ?? (audit.multiAction ? "multi-action" : "too long")}
                    </Badge>
                  ) : null}
                </div>
                <OnboardingStep
                  state={i === 0 ? "done" : i === 1 ? "in_progress" : "not_started"}
                  title={step.title}
                  sub={step.why}
                />
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function JourneyBuilder({
  journey,
  onBack,
}: {
  journey: Journey;
  onBack: () => void;
}) {
  const [selected, setSelected] = useState<string[]>(journey.steps);
  const [experience, setExperience] = useState<Experience>(journey.experience);
  const [placement, setPlacement] = useState<Placement>(journey.placement);

  const add = (key: string) => {
    if (selected.includes(key)) return;
    setSelected((s) => [...s, key]);
  };
  const remove = (key: string) => setSelected((s) => s.filter((k) => k !== key));
  const move = (key: string, dir: -1 | 1) => {
    setSelected((s) => {
      const i = s.indexOf(key);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= s.length) return s;
      const next = s.slice();
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };

  const auditedTitles = selected
    .map(stepByKey)
    .filter((x): x is StepCatalogItem => !!x)
    .map((s) => ({ step: s, audit: auditTitle(s.title) }));

  const flagged = auditedTitles.filter((a) => !a.audit.ok);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-4)" }}>
      <header style={{ display: "flex", alignItems: "center", gap: "var(--s-2)" }}>
        <Button variant="ghost" size="sm" icon={<Icon name="arrow-left" />} onClick={onBack}>
          Back to journey
        </Button>
        <h2 style={{ font: "var(--t-h2)", margin: 0 }}>Edit · {journey.name}</h2>
        <span style={{ marginLeft: "auto" }}>
          <Badge variant="warn" dot>builder · prototype</Badge>
        </span>
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr)",
          gap: "var(--s-3)",
        }}
      >
        {/* Catalog */}
        <Card padded>
          <h3 style={{ font: "var(--t-h3)", margin: "0 0 var(--s-2)" }}>Step catalog</h3>
          <p style={{ font: "var(--t-meta)", color: "var(--text-3, var(--text))", margin: "0 0 var(--s-3)" }}>
            Add a step. Order is the activation sequence.
          </p>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column" }}>
            {STEP_CATALOG.map((s) => {
              const inUse = selected.includes(s.key);
              return (
                <li
                  key={s.key}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--s-2)",
                    padding: "var(--s-2) 0",
                    borderTop: "1px solid var(--border)",
                  }}
                >
                  <Badge variant={TIER_VARIANT[s.tier]} dot={false}>{s.tier}</Badge>
                  <span style={{ flex: 1, font: "var(--t-body)" }}>{s.title}</span>
                  <Button
                    variant={inUse ? "ghost" : "secondary"}
                    size="sm"
                    disabled={inUse}
                    onClick={() => add(s.key)}
                  >
                    {inUse ? "Added" : "Add"}
                  </Button>
                </li>
              );
            })}
          </ul>
        </Card>

        {/* Sequence + config */}
        <Card padded>
          <h3 style={{ font: "var(--t-h3)", margin: "0 0 var(--s-2)" }}>Sequence</h3>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column" }}>
            {selected.map((key, i) => {
              const s = stepByKey(key);
              if (!s) return null;
              const audit = auditTitle(s.title);
              return (
                <li
                  key={key}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--s-2)",
                    padding: "var(--s-2) 0",
                    borderTop: "1px solid var(--border)",
                  }}
                >
                  <Mono>{i + 1}</Mono>
                  <span style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                    <span style={{ font: "var(--t-body)" }}>{s.title}</span>
                    <span style={{ font: "var(--t-meta)", color: "var(--text-3, var(--text))" }}>
                      {s.owner} · SLA {s.slaDays}d
                      {!audit.ok ? (
                        <>
                          {" · "}
                          <span style={{ color: "var(--amber-7, var(--text))" }}>
                            audit: {audit.jargon[0] ?? (audit.multiAction ? "multi-action" : "too long")}
                          </span>
                        </>
                      ) : null}
                    </span>
                  </span>
                  <Button variant="ghost" size="sm" icon={<Icon name="chevron-up" />} onClick={() => move(key, -1)} aria-label="Move up" />
                  <Button variant="ghost" size="sm" icon={<Icon name="chevron-down" />} onClick={() => move(key, 1)} aria-label="Move down" />
                  <Button variant="ghost" size="sm" icon={<Icon name="x" />} onClick={() => remove(key)} aria-label="Remove" />
                </li>
              );
            })}
          </ul>

          <div
            style={{
              marginTop: "var(--s-4)",
              display: "flex",
              flexDirection: "column",
              gap: "var(--s-2)",
            }}
          >
            <span style={{ font: "var(--t-meta)", color: "var(--text-3, var(--text))" }}>Experience</span>
            <div style={{ display: "flex", gap: "var(--s-2)" }}>
              <Toggle
                on={experience === "guided"}
                onChange={(v) => setExperience(v ? "guided" : "tracking_only")}
                label="Guided (walks the client through each step)"
              />
            </div>
            <span style={{ font: "var(--t-meta)", color: "var(--text-3, var(--text))" }}>Placement</span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--s-2)" }}>
              {PLACEMENTS.map((p) => (
                <Badge
                  key={p}
                  variant={placement === p ? "blue" : "neutral"}
                  dot={false}
                  onClick={() => setPlacement(p)}
                  style={{ cursor: "pointer" }}
                >
                  {p}
                </Badge>
              ))}
            </div>
          </div>
        </Card>

        {/* Live client preview + audit summary */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-3)" }}>
          <Card padded>
            <h3 style={{ font: "var(--t-h3)", margin: "0 0 var(--s-2)" }}>
              Plain-language audit
            </h3>
            {flagged.length === 0 ? (
              <p style={{ font: "var(--t-body)", color: "var(--text-3, var(--text))", margin: 0 }}>
                All step titles read in plain language. Nothing to flag.
              </p>
            ) : (
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "var(--s-2)" }}>
                {flagged.map(({ step, audit }) => (
                  <li key={step.key} style={{ display: "flex", flexDirection: "column", gap: "var(--s-1)" }}>
                    <span style={{ font: "var(--t-body)" }}>{step.title}</span>
                    <span style={{ font: "var(--t-meta)", color: "var(--text-3, var(--text))" }}>
                      {audit.jargon.length ? `bare jargon: ${audit.jargon.join(", ")}` : null}
                      {audit.multiAction ? " · multi-action ('and')" : ""}
                      {audit.tooLong ? " · too long (>7 words)" : ""}
                    </span>
                    <span style={{ font: "var(--t-meta)", color: "var(--text-2, var(--text))" }}>
                      Client surface uses: "{step.clientTitle}"
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card padded>
            <header style={{ display: "flex", alignItems: "center", gap: "var(--s-2)", marginBottom: "var(--s-2)" }}>
              <h3 style={{ font: "var(--t-h3)", margin: 0 }}>Live client preview</h3>
              <Badge variant="neutral" dot={false}>plain · calm · blame-free</Badge>
            </header>
            <p style={{ font: "var(--t-meta)", color: "var(--text-3, var(--text))", margin: "0 0 var(--s-3)" }}>
              No GoCSM brand · no operator signals (stalled, SLA) shown to the client.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-1)" }}>
              {selected.slice(0, 5).map((key, i) => {
                const s = stepByKey(key);
                if (!s) return null;
                return (
                  <OnboardingStep
                    key={key}
                    state={i === 0 ? "done" : i === 1 ? "in_progress" : "not_started"}
                    title={s.clientTitle}
                    sub={s.why}
                  />
                );
              })}
              {selected.length > 5 ? (
                <span style={{ font: "var(--t-meta)", color: "var(--text-3, var(--text))", paddingTop: "var(--s-2)" }}>
                  + <Mono>{selected.length - 5}</Mono> more steps after these
                </span>
              ) : null}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

const TABS = [
  { id: "stalls", label: "Stall dashboard" },
  { id: "journeys", label: "Journeys" },
];

type View = { kind: "list" } | { kind: "detail"; journey: Journey } | { kind: "builder"; journey: Journey };

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"stalls" | "journeys">("stalls");
  const [view, setView] = useState<View>({ kind: "list" });

  return (
    <main
      style={{
        padding: "var(--s-7) var(--s-6)",
        maxWidth: 1320,
        margin: "0 auto",
        color: "var(--text)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--s-5)",
      }}
    >
      <PageRibbon
        title="Onboarding"
        description="Operator view of stalled accounts and the journeys they're moving through. Stalls send to Today; the client view stays plain."
        kpis={[
          { label: "Stalled", value: <Mono>{stalledOnboarding().length}</Mono> },
          { label: "Journeys", value: <Mono>{journeyFixtures.length}</Mono> },
        ]}
      />

      <Tabs
        tabs={TABS}
        active={tab}
        onChange={(id) => {
          setTab(id as "stalls" | "journeys");
          if (id === "journeys") setView({ kind: "list" });
        }}
      />

      {tab === "stalls" ? (
        <StallDashboard onSendToToday={() => navigate("/today")} />
      ) : view.kind === "list" ? (
        <JourneyList onSelect={(j) => setView({ kind: "detail", journey: j })} />
      ) : view.kind === "detail" ? (
        <JourneyDetail
          journey={view.journey}
          onBack={() => setView({ kind: "list" })}
          onEdit={() => setView({ kind: "builder", journey: view.journey })}
        />
      ) : (
        <JourneyBuilder
          journey={view.journey}
          onBack={() => setView({ kind: "detail", journey: view.journey })}
        />
      )}
    </main>
  );
}
