import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Badge,
  Card,
  PlaybookCard,
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
  matchCount,
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
import { useIsAutopilot, useAutopilotStatus, autopilotStore, type AutopilotStatus } from "@/state/autopilot";
import { toast } from "sonner";
import { PlayVideoButton } from "@/components/playbooks/PlayVideoButton";
import { PlaybookActivationDrawer, type DrawerScope, type DrawerInitial } from "@/components/playbooks/PlaybookActivationDrawer";
import { outcomesFor } from "@/fixtures/outcomes";
import { allAccounts } from "@/fixtures";



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

const STATE_LABEL: Record<PlaybookState, string> = {
  off: "Off",
  ranonce: "✓ Ran once",
  on: "● On · autopilot",
  paused: "Paused",
};

const STATE_VARIANT: Record<PlaybookState, "neutral" | "warn" | "pos" | "blue"> = {
  off: "neutral",
  ranonce: "blue",
  on: "pos",
  paused: "warn",
};

const ZERO_LINE: Record<Playbook["kind"], string> = {
  billing: "Nothing to do — payments are clean. Armed and watching.",
  retention: "All renewals look calm. Armed and watching.",
  save: "No one needs saving right now. Armed and watching.",
  adoption: "Adoption is steady. Armed and watching.",
  onboarding: "Setups are on track. Armed and watching.",
  expansion: "No expansion signals today. Armed and watching.",
};

function activateLabel(state: PlaybookState): string {
  switch (state) {
    case "off": return "Run it once";
    case "ranonce": return "Keep it running";
    case "on": return "Manage";
    case "paused": return "Resume";
  }
}

export default function PlaybooksPage() {
  const [tab, setTab] = useState<TabId>("library");
  const [filter, setFilter] = useState<Filter>("all");
  const navigate = useNavigate();
  const [overrides, setOverrides] = useState<Record<string, PlaybookState>>({});

  // Drawer wiring — reuses Step 1 (Edit rule) and Step 2 (Review steps) of the
  // autopilot setup for already-configured plays.
  const [drawerScope, setDrawerScope] = useState<DrawerScope | null>(null);
  const [drawerInitial, setDrawerInitial] = useState<DrawerInitial | undefined>(undefined);
  const openAutopilotEditor = (playbookId: string, step: 1 | 2, showHandoff = false) => {
    setDrawerScope({ kind: "playbook", playbookId });
    setDrawerInitial({ mode: "autopilot", step, showHandoff });
  };



  const enriched = useMemo(
    () =>
      playbooks.map((p) => ({
        ...p,
        state: overrides[p.id] ?? p.state,
        count: matchCount(p),
      })),
    [overrides],
  );

  const filtered = enriched
    .filter((p) => filter === "all" || p.kind === filter)
    .sort((a, b) => {
      const am = a.count > 0 ? 0 : 1;
      const bm = b.count > 0 ? 0 : 1;
      if (am !== bm) return am - bm;
      return b.count - a.count;
    });

  const totalMatches = enriched.reduce((s, p) => s + p.count, 0);
  const onCount = enriched.filter((p) => p.state === "on").length;
  const saveCount = enriched.filter((p) => p.kind === "save").length;

  const advance = (p: Playbook & { state: PlaybookState }) => {
    setOverrides((o) => {
      const next: PlaybookState =
        p.state === "off" ? "ranonce" : p.state === "ranonce" ? "on" : p.state === "paused" ? "on" : "paused";
      return { ...o, [p.id]: next };
    });
  };

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
        description="One situation, one playbook. Every play is grounded in a live signal."
        kpis={[
          { label: "Plays", value: <Mono>{enriched.length}</Mono> },
          { label: "On autopilot", value: <Mono>{onCount}</Mono> },
          { label: "Save plays", value: <Mono>{saveCount}</Mono> },
          { label: "Matches today", value: <Mono>{totalMatches}</Mono> },
        ]}
      />

      <Tabs tabs={TABS} active={tab} onChange={(id) => setTab(id as TabId)} />

      {tab === "library" ? (
        <>
          {/* Filter chips */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--s-2)", alignItems: "center" }}>
            <span style={{ font: "var(--t-meta)", color: "var(--text-3, var(--text))" }}>Filter</span>
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
            <span style={{ marginLeft: "auto" }}>
              <ConfTag basis="projection" detail="seed catalog — pending workflow snapshot" />
            </span>
          </div>

          {/* Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: "var(--s-4)",
            }}
          >
            {filtered.map((p) => (
              <div
                key={p.id}
                style={{ display: "flex", flexDirection: "column", gap: "var(--s-2)", cursor: "pointer" }}
                onClick={() => navigate(`/playbooks/${p.id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") navigate(`/playbooks/${p.id}`);
                }}
              >
                <PlaybookCard
                  state={p.state}
                  icon={p.icon}
                  title={p.title}
                  subtitle={p.subtitle}
                  matchCount={p.count}
                  problem={p.problem}
                  does={p.does}
                  outcome={p.outcome}
                  activateLabel={activateLabel(p.state)}
                  onActivate={() => advance(p)}
                  data-kind={p.kind}
                />
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "var(--s-2)",
                    paddingInline: "var(--s-2)",
                  }}
                >
                  <Badge variant={STATE_VARIANT[p.state]} dot={p.state === "off"}>
                    {STATE_LABEL[p.state]}
                  </Badge>
                  {p.count > 0 ? (
                    <span style={{ font: "var(--t-meta)", color: "var(--text-3, var(--text))" }}>
                      <Mono
                        style={{
                          color:
                            p.kind === "billing" || p.kind === "save"
                              ? "var(--health-atrisk-strong)"
                              : p.kind === "expansion"
                              ? "var(--pos-7)"
                              : "var(--warn-7)",
                          fontWeight: 700,
                          fontSize: 14,
                        }}
                      >
                        {p.count}
                      </Mono>{" "}
                      account{p.count === 1 ? "" : "s"} match today
                    </span>
                  ) : (
                    <span
                      style={{
                        font: "var(--t-meta)",
                        color: "var(--pos-7)",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <Icon name="shield-check" /> {ZERO_LINE[p.kind]}
                    </span>
                  )}
                </div>

                {/* Automation state row — calm and scannable.
                    Conditions live behind Edit rule, not on this page. */}
                <span onClick={(e) => e.stopPropagation()}>
                  <PlaybookAutomationRow
                    playbook={p}
                    onEditRule={() => openAutopilotEditor(p.id, 1)}
                    onOpenHighLevel={() => openAutopilotEditor(p.id, 2, true)}
                  />
                </span>


              </div>
            ))}
            {filtered.length === 0 ? (
              <Card padded>
                <span style={{ font: "var(--t-body)", color: "var(--text-2, var(--text))" }}>
                  Nothing in this filter — try a different category, or clear filters to see your full library.
                </span>
              </Card>
            ) : null}
          </div>
        </>
      ) : tab === "triggers" ? (
        <TriggersTab />
      ) : (
        <OutcomesTab />
      )}

      <PlaybookActivationDrawer
        open={!!drawerScope}
        scope={drawerScope}
        accounts={allAccounts()}
        initial={drawerInitial}
        onClose={() => {
          setDrawerScope(null);
          setDrawerInitial(undefined);
        }}
      />
    </main>
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

// ---------------------------------------------------------------------------
// PlaybookAutomationRow — per-row automation state and controls.
//
// Shows: On autopilot / Paused / Off, a one-line rule summary when the rule
// exists, last run (if any), and the Pause/Resume, Edit rule, Review steps,
// Watch (1 min) controls. Conditions live behind "Edit rule" — never on this
// page directly.
// ---------------------------------------------------------------------------

const AUTOPILOT_STATUS_LABEL: Record<AutopilotStatus, string> = {
  on: "On autopilot",
  paused: "Paused",
  off: "Off",
};

const AUTOPILOT_STATUS_VARIANT: Record<AutopilotStatus, "blue" | "warn" | "neutral"> = {
  on: "blue",
  paused: "warn",
  off: "neutral",
};

// Plain-English rule summary built from the playbook's own problem sentence.
// Kept here (and intentionally short) so the page reads calmly without
// exposing any condition syntax.
function ruleSummary(p: Playbook): string {
  const tail = p.problem.replace(/^The /, "").replace(/\.$/, "").toLowerCase();
  return `Runs for accounts where ${tail}`;
}

function lastRunLabel(playbookId: string): string | null {
  const recent = outcomesFor(playbookId).sort((a, b) => a.daysAgo - b.daysAgo)[0];
  if (!recent) return null;
  if (recent.daysAgo === 0) return "Last run: today";
  if (recent.daysAgo === 1) return "Last run: yesterday";
  return `Last run: ${recent.daysAgo}d ago`;
}

function PlaybookAutomationRow({
  playbook,
  onEditRule,

}: {
  playbook: Playbook;
  onEditRule: () => void;
}) {

  const status = useAutopilotStatus(playbook.id);
  const hasRule = status !== "off";
  const lastRun = lastRunLabel(playbook.id);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--s-2)",
        padding: "var(--s-3)",
        marginInline: "var(--s-2)",
        borderRadius: "var(--r-md)",
        background: "var(--surface-2)",
        border: "1px solid var(--border)",
      }}
    >
      {/* Status + rule summary */}
      <div style={{ display: "flex", alignItems: "center", gap: "var(--s-2)", flexWrap: "wrap" }}>
        <Badge variant={AUTOPILOT_STATUS_VARIANT[status]} dot={status === "off"}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            {status === "on" ? <Icon name="zap" /> : status === "paused" ? <Icon name="pause" /> : null}
            {AUTOPILOT_STATUS_LABEL[status]}
          </span>
        </Badge>
        {hasRule ? (
          <span style={{ font: "var(--t-body-sm)", color: "var(--text-2, var(--text))" }}>
            {ruleSummary(playbook)}
          </span>
        ) : (
          <span style={{ font: "var(--t-body-sm)", color: "var(--text-3, var(--text))" }}>
            No autopilot rule yet — run it once to set one up.
          </span>
        )}
        {lastRun ? (
          <span style={{ marginLeft: "auto", font: "var(--t-meta)", color: "var(--text-3, var(--text))" }}>
            {lastRun}
          </span>
        ) : null}
      </div>

      {/* Controls — Pause/Resume, Edit rule, Review steps, Watch */}
      <div style={{ display: "flex", alignItems: "center", gap: "var(--s-2)", flexWrap: "wrap" }}>
        {status === "on" ? (
          <Button
            variant="ghost"
            size="sm"
            icon={<Icon name="pause" />}
            onClick={() => {
              autopilotStore.pause(playbook.id);
              toast("Autopilot paused — the rule is kept.");
            }}
          >
            Pause
          </Button>
        ) : status === "paused" ? (
          <Button
            variant="ghost"
            size="sm"
            icon={<Icon name="play" />}
            onClick={() => {
              autopilotStore.resume(playbook.id);
              toast.success("Autopilot resumed.");
            }}
          >
            Resume
          </Button>
        ) : null}
        <Button
          variant="ghost"
          size="sm"
          icon={<Icon name="sliders" />}
          onClick={onEditRule}
          disabled={!hasRule}
        >
          Edit rule
        </Button>
        {/* "Review messages" removed — message editing lives in HighLevel. */}

        <PlayVideoButton playbook={playbook} label="Watch (1 min)" />
      </div>
    </div>
  );
}

