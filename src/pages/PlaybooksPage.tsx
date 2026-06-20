import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Badge,
  Card,
  FixItCard,
  Tabs,
  ConfTag,
  Icon,
  Mono,
  Button,
  Toggle,
  ReceiptStrip,
  WeeklyDigest,
  AssignmentRuleEditor,
  SkillScheduleCard,
} from "@/gocsm-ds";
import { PageRibbon } from "@/components/PageRibbon";
import {
  playbooks,
  matchesToday,
  type Playbook,
  type PlaybookState,
} from "@/fixtures/playbooks";
import {
  outcomes,
  weeklyTotals,
  outcomeAccount,
  outcomePlaybook,
} from "@/fixtures/outcomes";
import {
  triggers,
  populationFor,
  playbookOf,
  TRIGGER_CLASS_LABEL,
  type TriggerClass,
} from "@/fixtures/triggers";



type TabId = "library" | "triggers" | "outcomes";

const TABS = [
  { id: "library", label: "Library" },
  { id: "triggers", label: "Triggers" },
  { id: "outcomes", label: "Outcomes" },
];

type Filter = "all" | "save" | "retention" | "billing" | "adoption" | "onboarding" | "expansion";
const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "save", label: "Save plays" },
  { id: "retention", label: "Retention" },
  { id: "billing", label: "Billing" },
  { id: "adoption", label: "Adoption" },
  { id: "onboarding", label: "Onboarding" },
  { id: "expansion", label: "Expansion" },
];

// State chip shown on a library row — only when the play is actually doing
// something (Ran once / On / Paused). "Off" shows no chip, to keep the list calm.
const STATE_CHIP: Record<PlaybookState, { variant: "pos" | "warn" | "blue"; icon: string; label: string } | null> = {
  off: null,
  ranonce: { variant: "blue", icon: "check", label: "Ran once" },
  on: { variant: "pos", icon: "zap", label: "On · autopilot" },
  paused: { variant: "warn", icon: "pause", label: "Paused" },
};

// Which kinds frame their dollars as risk vs upside on the stakes line.
const RISK_KINDS = new Set<Playbook["kind"]>(["save", "billing", "retention", "onboarding"]);
const UPSIDE_KINDS = new Set<Playbook["kind"]>(["expansion"]);

type EnrichedRow = Playbook & { count: number; mrr: number };

export default function PlaybooksPage() {
  const [tab, setTab] = useState<TabId>("library");
  const [filter, setFilter] = useState<Filter>("all");
  const navigate = useNavigate();

  const enriched = useMemo<EnrichedRow[]>(
    () =>
      playbooks.map((p) => {
        const accts = matchesToday(p);
        return {
          ...p,
          count: accts.length,
          mrr: accts.reduce((s, a) => s + (a.revenue?.mrr ?? 0), 0),
        };
      }),
    [],
  );

  const filtered = enriched.filter((p) => filter === "all" || p.kind === filter);
  const needsYou = filtered.filter((p) => p.count > 0).sort((a, b) => b.count - a.count);
  const watching = filtered.filter((p) => p.count === 0);

  const onCount = enriched.filter((p) => p.state === "on").length;
  const needsYouCount = enriched.filter((p) => p.count > 0).length;

  return (
    <main
      style={{
        padding: "var(--s-7) var(--s-6)",
        maxWidth: 1280,
        margin: "0 auto",
        color: "var(--text)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--s-5)",
      }}
    >
      <PageRibbon
        title="Playbooks"
        description="Ready-made fixes for the moments that cost you customers. Open one to run it."
        kpis={[
          { label: "Playbooks", value: <Mono>{enriched.length}</Mono> },
          { label: "Need you today", value: <Mono>{needsYouCount}</Mono> },
          { label: "On autopilot", value: <Mono>{onCount}</Mono> },
        ]}
      />

      <Tabs tabs={TABS} active={tab} onChange={(id) => setTab(id as TabId)} />

      {tab === "library" ? (
        <div style={{ maxWidth: 920, width: "100%", display: "flex", flexDirection: "column", gap: "var(--s-5)" }}>
          {/* Filter chips */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--s-2)", alignItems: "center" }}>
            <span style={{ fontSize: "var(--t-caption)", color: "var(--text-3, var(--text))" }}>Filter</span>
            {FILTERS.map((f) => (
              <Badge
                key={f.id}
                variant={filter === f.id ? "blue" : "neutral"}
                dot={false}
                onClick={() => setFilter(f.id)}
                style={{ cursor: "pointer" }}
              >
                {f.label}
              </Badge>
            ))}
          </div>

          {needsYou.length === 0 && watching.length === 0 ? (
            <Card padded>
              <span style={{ fontSize: "var(--t-body)", color: "var(--text-2, var(--text))" }}>
                Nothing in this filter — try a different category, or clear it to see your full library.
              </span>
            </Card>
          ) : null}

          {needsYou.length ? (
            <section style={{ display: "flex", flexDirection: "column", gap: "var(--s-3)" }}>
              <h2 style={{ fontSize: "var(--t-heading)", fontWeight: 700, margin: 0 }}>Need you today</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-2)" }}>
                {needsYou.map((p) => (
                  <PlaybookRow key={p.id} p={p} onOpen={() => navigate(`/playbooks/${p.id}`)} />
                ))}
              </div>
            </section>
          ) : null}

          {watching.length ? (
            <section style={{ display: "flex", flexDirection: "column", gap: "var(--s-3)" }}>
              <h2
                style={{
                  fontSize: "var(--t-heading)",
                  fontWeight: 700,
                  margin: 0,
                  color: "var(--text-2, var(--text))",
                }}
              >
                Armed &amp; watching
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-2)" }}>
                {watching.map((p) => (
                  <PlaybookRow key={p.id} p={p} onOpen={() => navigate(`/playbooks/${p.id}`)} />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      ) : tab === "triggers" ? (
        <TriggersTab />
      ) : (
        <OutcomesTab />
      )}
    </main>
  );
}

// ---------------------------------------------------------------------------
// PlaybookRow — one calm, scannable library row: state eyebrow → bold name →
// who it affects right now (with $ at risk / upside) → drill-in chevron. The
// whole row is the tap target; running and rule-management live on the detail
// page, so the library stays a quiet catalog you scan, not a control panel.
// ---------------------------------------------------------------------------

function StakesMeta({ p }: { p: EnrichedRow }) {
  const count = (
    <>
      <strong style={{ fontWeight: 700, color: "var(--text)" }}>{p.count}</strong>{" "}
      account{p.count === 1 ? "" : "s"} match today
    </>
  );
  if (p.mrr > 0 && UPSIDE_KINDS.has(p.kind)) {
    return (
      <>
        {count} · <span style={{ color: "var(--pos-7)", fontWeight: 600 }}>${p.mrr.toLocaleString()} upside</span>
      </>
    );
  }
  if (p.mrr > 0 && RISK_KINDS.has(p.kind)) {
    return (
      <>
        {count} · <span className="at-risk">${p.mrr.toLocaleString()} at risk</span>
      </>
    );
  }
  return count;
}

function PlaybookRow({ p, onOpen }: { p: EnrichedRow; onOpen: () => void }) {
  const chip = STATE_CHIP[p.state];
  return (
    <FixItCard
      icon={p.icon}
      tag={null}
      title={p.title}
      meta={
        p.count > 0 ? (
          <StakesMeta p={p} />
        ) : (
          <span style={{ color: "var(--text-3, var(--text))" }}>{p.subtitle}</span>
        )
      }
      action={
        <span style={{ display: "inline-flex", alignItems: "center", gap: "var(--s-3)" }}>
          {chip ? (
            <Badge variant={chip.variant} dot={false}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                <Icon name={chip.icon} /> {chip.label}
              </span>
            </Badge>
          ) : null}
          <Icon name="chevron-right" />
        </span>
      }
      data-clickable="true"
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onOpen();
      }}
    />
  );
}

// ============================================================================
// Outcomes tab — the story loop
// ============================================================================

function OutcomesTab() {
  const totals = weeklyTotals();
  const navigate = useNavigate();
  const sorted = [...outcomes].sort((a, b) => a.daysAgo - b.daysAgo);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-6)" }}>
      {/* Win-loop hero band */}
      <section
        style={{
          borderRadius: "var(--r-lg, 14px)",
          padding: "var(--s-5) var(--s-5)",
          background:
            "linear-gradient(135deg, var(--pos-soft) 0%, var(--blue-2) 60%, var(--surface) 100%)",
          border: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--s-3)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "var(--s-2)" }}>
          <span
            aria-hidden
            style={{
              width: 36, height: 36, borderRadius: 11,
              display: "grid", placeItems: "center",
              background: "var(--pos-soft)", color: "var(--pos-7)",
            }}
          >
            <Icon name="trophy" />
          </span>
          <h2 style={{ font: "var(--t-h2)", margin: 0 }}>This week, in plain words</h2>
          <span style={{ marginLeft: "auto" }}>
            <ConfTag basis="fact" detail="verified via signal change after a play ran" />
          </span>
        </div>
        <Card padded>
          <WeeklyDigest
            greeting="Here's what your Playbooks did this week."
            stats={{
              sent: totals.sent,
              recovered: `$${totals.recovered.toLocaleString()}`,
              protected: `$${totals.protected.toLocaleString()}`,
            }}
            actions={[
              { icon: "mail", n: totals.sent, label: "outreach messages sent (you approved)" },
              { icon: "shield", n: outcomes.filter((o) => o.kind === "save").length, label: "saves verified" },
              { icon: "credit-card", n: outcomes.filter((o) => o.kind === "recovery").length, label: "payments recovered" },
            ]}
            autopilot={{ on: 3, of: 9 }}
            sync="Wins are reported only when a downstream signal confirmed the change."
          />
        </Card>
      </section>

      {/* The story feed */}
      <section style={{ display: "flex", flexDirection: "column", gap: "var(--s-3)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--s-2)" }}>
          <span
            aria-hidden
            style={{
              width: 30, height: 30, borderRadius: 9,
              display: "grid", placeItems: "center",
              background: "var(--info-soft)", color: "var(--info-7)",
            }}
          >
            <Icon name="check-circle" />
          </span>
          <h3 style={{ font: "var(--t-h2)", margin: 0 }}>Verified wins</h3>
          <span style={{ font: "var(--t-meta)", color: "var(--text-3, var(--text))", marginLeft: "auto" }}>
            <Mono>{sorted.length}</Mono> this week
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-3)" }}>
          {sorted.map((o) => {
            const pb = outcomePlaybook(o);
            const acct = outcomeAccount(o);
            return (
              <Card key={o.id} padded className={o.daysAgo === 0 ? "celebrate-pop" : undefined}>
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-3)" }}>
                  <ReceiptStrip
                    lead={o.lead}
                    stats={o.stats}
                    onSeeLog={pb ? () => navigate(`/playbooks/${pb.id}`) : undefined}
                  >
                    {" "}
                    {o.rest}
                  </ReceiptStrip>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "var(--s-2)",
                      alignItems: "center",
                      font: "var(--t-meta)",
                      color: "var(--text-3, var(--text))",
                    }}
                  >
                    {acct ? (
                      <Badge
                        variant="neutral"
                        dot={false}
                        onClick={() => navigate(`/accounts/${acct.identity.id}`)}
                        style={{ cursor: "pointer" }}
                      >
                        {acct.identity.name}
                      </Badge>
                    ) : null}
                    {pb ? (
                      <Badge
                        variant="blue"
                        dot={false}
                        onClick={() => navigate(`/playbooks/${pb.id}`)}
                        style={{ cursor: "pointer" }}
                      >
                        <Icon name={pb.icon} /> {pb.title}
                      </Badge>
                    ) : null}
                    <span>·</span>
                    <span>
                      {o.attribution === "playbook-solo" ? "Solo (autopilot)" : "Assist (you approved)"}
                    </span>
                    <span style={{ marginLeft: "auto" }}>
                      verified {o.daysAgo}d ago
                    </span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}

// ============================================================================
// Triggers tab — the catalog + composer
// ============================================================================

const CLASS_ORDER: TriggerClass[] = [
  "single-signal",
  "recency-frequency",
  "agentic-scheduler",
  "reversal",
];

function TriggersTab() {
  const [simulate, setSimulate] = useState(true);
  const [assignMode, setAssignMode] = useState<"by-rule" | "round-robin">("by-rule");
  const [rules, setRules] = useState([
    { when: "Health band", is: "At risk", to: "Sinan" },
    { when: "Renewal", is: "≤ 14 days", to: "Maya" },
  ]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-5)" }}>
      <Card padded>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-2)" }}>
          <h3 style={{ font: "var(--t-h3)", margin: 0 }}>How triggers work</h3>
          <p style={{ font: "var(--t-body)", color: "var(--text-2, var(--text))", margin: 0 }}>
            Every play watches for one of these shapes. You don't pick how it runs —
            GoCSM decides whether it's a workflow watch or an AI watch and labels it
            honestly on each trigger.
          </p>
          <div style={{ display: "flex", gap: "var(--s-3)", alignItems: "center" }}>
            <Toggle
              on={simulate}
              onChange={setSimulate}
              label="Simulate before publish"
            />
            <span style={{ font: "var(--t-meta)", color: "var(--text-3, var(--text))" }}>
              Required by safety policy — see who would have matched before turning a trigger live.
            </span>
          </div>
        </div>
      </Card>

      {CLASS_ORDER.map((cls) => {
        const items = triggers.filter((t) => t.class === cls);
        if (!items.length) return null;
        return (
          <section
            key={cls}
            style={{ display: "flex", flexDirection: "column", gap: "var(--s-3)" }}
          >
            <header style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
              <h3 style={{ font: "var(--t-h3)", margin: 0 }}>{TRIGGER_CLASS_LABEL[cls]}</h3>
              {cls === "reversal" ? (
                <Badge variant="danger" dot>Defection class — heaviest weight</Badge>
              ) : cls === "agentic-scheduler" ? (
                <Badge variant="blue" dot={false}>Composed across pillars</Badge>
              ) : null}
            </header>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                gap: "var(--s-3)",
              }}
            >
              {items.map((t) => {
                const pop = populationFor(t);
                const pb = playbookOf(t);
                return (
                  <Card key={t.id} padded>
                    <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-2)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "var(--s-2)" }}>
                        <Icon name={cls === "reversal" ? "alert-triangle" : cls === "agentic-scheduler" ? "sparkles" : "filter"} />
                        <span style={{ font: "var(--t-body)", fontWeight: 600 }}>{t.title}</span>
                        <span style={{ marginLeft: "auto" }}>
                          <Badge variant={t.via === "AI watch" ? "blue" : "neutral"} dot={false}>
                            {t.via}
                          </Badge>
                        </span>
                      </div>
                      <p style={{ font: "var(--t-meta)", color: "var(--text-2, var(--text))", margin: 0 }}>
                        {t.when}
                      </p>
                      <p style={{ font: "var(--t-meta)", color: "var(--text-3, var(--text))", margin: 0 }}>
                        {t.cadence}
                      </p>
                      {t.note ? (
                        <p style={{ font: "var(--t-meta)", color: "var(--text-3, var(--text))", margin: 0, fontStyle: "italic" }}>
                          {t.note}
                        </p>
                      ) : null}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "var(--s-2)",
                          paddingTop: "var(--s-2)",
                          borderTop: "1px solid var(--border)",
                        }}
                      >
                        <span style={{ font: "var(--t-meta)", color: "var(--text-3, var(--text))" }}>
                          Live population
                        </span>
                        <Badge variant={pop > 0 ? "warn" : "neutral"} dot={false}>
                          <Mono>{pop}</Mono> match{pop === 1 ? "" : "es"} today
                        </Badge>
                        {pb ? (
                          <Badge variant="blue" dot={false}>
                            <Icon name="book-open" /> {pb.title}
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>
        );
      })}

      {/* Agentic scheduler — a scheduled AI skill card example */}
      <section style={{ display: "flex", flexDirection: "column", gap: "var(--s-3)" }}>
        <h3 style={{ font: "var(--t-h3)", margin: 0 }}>Scheduled AI skill · example</h3>
        <SkillScheduleCard
          desc="Nightly scan that composes health, lifecycle, and revenue to surface quiet renewals."
          cadence="Nightly · 02:00 local"
          scope="All live accounts"
          autonomy="approve"
          liveLabel="ran 8 hours ago"
          lastRun={{
            stats: [
              { v: "14", l: "matched", tone: "pos" },
              { v: "3", l: "queued for approval" },
            ],
          }}
          lastRunLabel="last night"
          state="running"
          onPause={() => undefined}
          onEdit={() => undefined}
          onSeeLog={() => undefined}
        />
      </section>

      {/* Composer — assignment rules + simulate-before-publish */}
      <section style={{ display: "flex", flexDirection: "column", gap: "var(--s-3)" }}>
        <header style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <h3 style={{ font: "var(--t-h3)", margin: 0 }}>Compose a trigger</h3>
          <ConfTag basis="projection" detail="population preview" />
        </header>
        <AssignmentRuleEditor
          mode={assignMode}
          rules={rules}
          onModeChange={setAssignMode}
          onAddRule={() =>
            setRules((r) => [...r, { when: "Plan", is: "Pro", to: "Account owner" }])
          }
          onRemoveRule={(i: number) => setRules((r) => r.filter((_, idx) => idx !== i))}
        />
        <Card padded>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-2)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--s-2)" }}>
              <Icon name="play" />
              <span style={{ font: "var(--t-body)", fontWeight: 600 }}>
                Simulate before publish
              </span>
              <Badge variant={simulate ? "pos" : "neutral"} dot>
                {simulate ? "On" : "Off"}
              </Badge>
            </div>
            <p style={{ font: "var(--t-body)", color: "var(--text-2, var(--text))", margin: 0 }}>
              When on, publishing a new trigger runs a dry pass first. You see exactly
              who would have matched in the last 30 days and what each action would
              have done — nothing leaves GoCSM until you approve.
            </p>
            <div style={{ display: "flex", gap: "var(--s-2)", alignItems: "center" }}>
              <Button variant="secondary" size="sm" icon={<Icon name="play" />}>
                Run a dry pass
              </Button>
              <Button variant="primary" size="sm" disabled={!simulate}>
                Publish trigger
              </Button>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}
