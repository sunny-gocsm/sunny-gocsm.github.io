import { useMemo, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  SegmentedControl,
  EventRow,
  Card,
  Icon,
  Mono,
  Badge,
  Button,
  FilterChip,
  Input,
  Monogram,
  StackedBar,
} from "@gocsm/design-system";
import { PageRibbon } from "@/components/PageRibbon";
import {
  filterEvents,
  impactSummary,
  impactVerdict,
  playbookScorecard,
  effectivenessLead,
  channelBreakdown,
  loggedAccounts,
  loggedChannels,
  CATEGORY_META,
  CHANNEL_META,
  ACTION_META,
  RESULT_META,
  VERDICT_LABEL,
  VERDICT_HINT,
  type Window as TimeWindow,
  type EventFilter,
  type OutcomeEvent,
  type EventCategory,
  type EventResult,
  type PlaybookScore,
  type ImpactSummary,
} from "@/fixtures/outcomeLog";

type LogFilter = Omit<EventFilter, "window">;
type SliceMode = "flat" | "playbook" | "customer" | "channel";

const WINDOW_OPTIONS = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "lifetime", label: "Lifetime" },
];
const SLICE_OPTIONS = [
  { value: "flat", label: "Timeline" },
  { value: "playbook", label: "By playbook" },
  { value: "customer", label: "By customer" },
  { value: "channel", label: "By channel" },
];
const RESULTS: EventResult[] = ["worked", "no_change", "failed", "pending"];
const PAGE = 25;

const fmt$ = (n: number) => "$" + Math.round(n).toLocaleString();
const roiText = (x: number) => (x >= 10 ? `${Math.round(x)}×` : `${x.toFixed(1)}×`);

function relTime(d: number): string {
  if (d <= 0) return "Today";
  if (d === 1) return "1d";
  if (d < 7) return `${d}d`;
  if (d < 30) return `${Math.round(d / 7)}w`;
  if (d < 365) return `${Math.round(d / 30)}mo`;
  return `${Math.round(d / 365)}y`;
}

export default function OutcomesPage() {
  const navigate = useNavigate();
  const [windowSel, setWindowSel] = useState<TimeWindow>("lifetime");
  const [filter, setFilter] = useState<LogFilter>({});
  const [sliceBy, setSliceBy] = useState<SliceMode>("flat");
  const [visible, setVisible] = useState(PAGE);
  const [detail, setDetail] = useState<OutcomeEvent | null>(null);
  const logRef = useRef<HTMLDivElement>(null);

  const impact = useMemo(() => impactSummary(windowSel), [windowSel]);
  const verdict = useMemo(() => impactVerdict(windowSel), [windowSel]);
  const scorecard = useMemo(() => playbookScorecard(windowSel), [windowSel]);
  const lead = useMemo(() => effectivenessLead(windowSel), [windowSel]);
  const accounts = useMemo(() => loggedAccounts(), []);
  const channels = useMemo(() => loggedChannels(), []);
  const events = useMemo(() => filterEvents({ window: windowSel, ...filter }), [windowSel, filter]);

  function patch(p: LogFilter) {
    setVisible(PAGE);
    setFilter((f) => ({ ...f, ...p }));
  }
  function scrollToLog() {
    logRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function setWindow(w: TimeWindow) {
    setVisible(PAGE);
    setWindowSel(w);
  }
  // A claim higher on the page → the receipts that prove it. The single retraceability move.
  function drillTo(p: LogFilter, slice: SliceMode = "flat") {
    setVisible(PAGE);
    setFilter(p);
    setSliceBy(slice);
    scrollToLog();
  }

  // Active-filter chips — every applied slice, individually removable.
  const chips: { key: string; label: string; clear: () => void }[] = [];
  if (filter.category) chips.push({ key: "cat", label: CATEGORY_META[filter.category].label, clear: () => patch({ category: undefined }) });
  if (filter.channel) chips.push({ key: "ch", label: CHANNEL_META[filter.channel]?.label ?? filter.channel, clear: () => patch({ channel: undefined }) });
  if (filter.result) chips.push({ key: "res", label: RESULT_META[filter.result].label, clear: () => patch({ result: undefined }) });
  if (filter.accountId) {
    const a = accounts.find((x) => x.id === filter.accountId);
    chips.push({ key: "acc", label: a?.name ?? "Customer", clear: () => patch({ accountId: undefined }) });
  }
  if (filter.query) chips.push({ key: "q", label: `“${filter.query}”`, clear: () => patch({ query: undefined }) });

  return (
    <main className="oc-main">
      <PageRibbon
        title="Outcomes"
        description="What your playbooks did, whether they worked, and what GoCSM is worth."
      >
        <div style={{ marginTop: "var(--s-1)" }}>
          <SegmentedControl options={WINDOW_OPTIONS} value={windowSel} onChange={(v) => setWindow(v as TimeWindow)} />
        </div>
      </PageRibbon>

      {/* RUNG 1 — IMPACT · "Is GoCSM worth it?" */}
      <section className="oc-rung">
        <RungHeader question="Is GoCSM worth it?" sub="The bottom line first — what GoCSM put back on the table." />
        <ImpactHero impact={impact} verdict={verdict} window={windowSel} onMechanism={(c) => drillTo({ category: c, result: "worked" }, "playbook")} />
      </section>

      {/* RUNG 2 — EFFECTIVENESS · "Are the playbooks working?" */}
      {scorecard.length ? (
        <section className="oc-rung">
          <RungHeader question="Are the playbooks working?" sub="Every playbook you turned on — and whether it's hitting its goal." />
          {lead ? (
            <p className="oc-ai-line">
              <span className="oc-ai-ico" aria-hidden><Icon name="sparkles" /></span>
              <span>{lead.line}</span>
              <span className="oc-ai-stamp">{lead.stamp}</span>
            </p>
          ) : null}
          <div className="oc-meter-legend" aria-hidden>
            <span className="oc-legend-lead">Each bar:</span>
            <span><span className="oc-key pos" />Worked</span>
            <span><span className="oc-key warn" />In progress</span>
            <span><span className="oc-key neutral" />No change</span>
            <span><span className="oc-key neg" />Didn't land</span>
          </div>
          <div className="oc-scorecard">
            {scorecard.map((row) => (
              <ScorecardRow key={row.category} row={row} active={filter.category === row.category} onPick={() => drillTo({ category: row.category }, "flat")} />
            ))}
          </div>
        </section>
      ) : null}

      {/* RUNG 3 — AUDIT LOG · "What exactly happened?" */}
      <section ref={logRef} className="oc-rung" style={{ scrollMarginTop: "var(--s-5)" }}>
        <RungHeader question="What exactly happened?" sub="Every action a playbook took, on the record — slice it any way you like." />

        <div className="oc-log-controls">
          <Badge variant="neutral" dot={false}>
            <Mono>{events.length}</Mono> action{events.length === 1 ? "" : "s"}
          </Badge>
          <span style={{ marginLeft: "auto" }}>
            <SegmentedControl options={SLICE_OPTIONS} value={sliceBy} onChange={(v) => setSliceBy(v as SliceMode)} />
          </span>
        </div>

        {/* Filter bar — search + customer / channel / outcome. Time scope is the page window above. */}
        <div className="oc-filterbar">
          <Input placeholder="Search customers or actions…" value={filter.query ?? ""} onChange={(e) => patch({ query: e.target.value || undefined })} />
          <Input as="select" value={filter.accountId ?? ""} onChange={(e) => patch({ accountId: e.target.value || undefined })} aria-label="Customer">
            <option value="">All customers</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </Input>
          <Input as="select" value={filter.channel ?? ""} onChange={(e) => patch({ channel: e.target.value || undefined })} aria-label="Channel">
            <option value="">All channels</option>
            {channels.map((c) => (
              <option key={c} value={c}>{CHANNEL_META[c]?.label ?? c}</option>
            ))}
          </Input>
          <Input as="select" value={filter.result ?? ""} onChange={(e) => patch({ result: (e.target.value || undefined) as EventResult | undefined })} aria-label="Outcome">
            <option value="">Any outcome</option>
            {RESULTS.map((r) => (
              <option key={r} value={r}>{RESULT_META[r].label}</option>
            ))}
          </Input>
        </div>

        {chips.length ? (
          <div className="oc-chips">
            {chips.map((c) => (
              <FilterChip key={c.key} label={c.label} onRemove={c.clear} />
            ))}
            <button className="oc-clear" onClick={() => { setFilter({}); setVisible(PAGE); }}>Clear all</button>
          </div>
        ) : null}

        <ActivityList
          events={events}
          sliceBy={sliceBy}
          visible={visible}
          onShowMore={() => setVisible((v) => v + PAGE)}
          onOpen={setDetail}
          onClear={chips.length ? () => { setFilter({}); setVisible(PAGE); } : undefined}
        />
      </section>

      {detail ? (
        <EventDetail event={detail} onClose={() => setDetail(null)} onAccount={() => navigate(`/accounts/${detail.accountId}`)} />
      ) : null}
    </main>
  );
}

// ---------------------------------------------------------------------------
// Rung header — labels each section with the plain-English question it answers.
// ---------------------------------------------------------------------------
function RungHeader({ question, sub }: { question: string; sub: string }) {
  return (
    <div className="oc-rung-head">
      <h2 className="oc-rung-q">{question}</h2>
      <p className="oc-rung-sub">{sub}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Rung 1 — Impact hero. One big number (the $ appears exactly once), an honest ROI
// multiple (lifetime only), the "work GoCSM did for you" context sentence, and an
// inspectable "how is this counted?" breakdown that drills to the receipts.
// ---------------------------------------------------------------------------
function ImpactHero({
  impact,
  verdict,
  window,
  onMechanism,
}: {
  impact: ImpactSummary;
  verdict: ReturnType<typeof impactVerdict>;
  window: TimeWindow;
  onMechanism: (c: EventCategory) => void;
}) {
  const phrase = window === "lifetime" ? "since you installed GoCSM" : window === "30d" ? "in the last 30 days" : "in the last 7 days";

  if (verdict.light) {
    return (
      <Card padded className="oc-impact light">
        <div className="oc-impact-top">
          <span className="oc-ai-eyebrow"><span className="oc-ai-ico" aria-hidden><Icon name="sparkles" /></span>GoCSM AI</span>
          <span className="oc-stamp">{verdict.stamp}</span>
        </div>
        <p className="oc-impact-quiet">{verdict.line}</p>
        <p className="oc-impact-quiet-sub">A slow stretch is normal — GoCSM keeps watching so you don't have to.</p>
      </Card>
    );
  }

  const showRoi = window === "lifetime" && impact.roiMultiple >= 1;
  return (
    <Card padded className="oc-impact">
      <span className="oc-ai-eyebrow"><span className="oc-ai-ico" aria-hidden><Icon name="sparkles" /></span>GoCSM AI</span>

      <div className="oc-impact-figure">
        <span className="oc-impact-num"><Mono>{fmt$(impact.totalValue)}</Mono></span>
      </div>
      <p className="oc-impact-cap">Revenue GoCSM recovered, saved, or kept on board {phrase}.</p>
      <span className="oc-stamp oc-stamp-inline">{verdict.stamp}</span>

      {showRoi ? (
        <p className="oc-impact-roi">
          You've paid <Mono>{fmt$(impact.gocsmCost)}</Mono> for GoCSM over that time — so it's earned back about{" "}
          <strong><Mono>{roiText(impact.roiMultiple)}</Mono> its cost</strong>.
        </p>
      ) : null}

      <p className="oc-impact-line">
        That's <strong><Mono>{impact.customersKept}</Mono> customer{impact.customersKept === 1 ? "" : "s"}</strong> kept across{" "}
        <Mono>{impact.actionsRun}</Mono> action{impact.actionsRun === 1 ? "" : "s"} — GoCSM sent <Mono>{impact.autopilotCount}</Mono> of them
        automatically.{impact.stillInPlayCount > 0 ? <> Another <Mono>{fmt$(impact.stillInPlayValue)}</Mono> is still in progress.</> : null}
      </p>

      <details className="oc-disc">
        <summary>
          <Icon name="chevron-right" className="oc-disc-caret" /> How is this counted?
        </summary>
        <div className="oc-disc-body">
          <p>
            We add up the monthly revenue of every customer a playbook reached who then came back, paid, or renewed —
            <strong> counted once per customer</strong>, even if more than one playbook helped. Recovered payments and saved renewals are
            exact dollars; win-backs, usage nudges and expansions are <strong>estimated</strong> at a share of the customer's monthly
            revenue. We can't prove every save was GoCSM's, so treat this as an honest best estimate.
          </p>
          <div className="oc-mech-list">
            {impact.byMechanism.map((m) => (
              <button key={m.category} type="button" className="oc-mech" onClick={() => onMechanism(m.category)}>
                <span className="oc-mech-ico" aria-hidden><Icon name={m.icon} /></span>
                <span className="oc-mech-label">{m.title}</span>
                <Badge variant={m.hard ? "pos" : "neutral"} dot={false} className="oc-mech-tag">{m.hard ? "exact" : "estimated"}</Badge>
                <span className="oc-mech-val">
                  <Mono>{m.count}</Mono> customer{m.count === 1 ? "" : "s"} · <Mono>{fmt$(m.value)}</Mono>
                </span>
                <Icon name="arrow-right" className="oc-mech-go" />
              </button>
            ))}
          </div>
          {showRoi ? (
            <p className="oc-disc-roi">
              <Mono>{fmt$(impact.totalValue)}</Mono> kept ÷ <Mono>{fmt$(impact.gocsmCost)}</Mono> paid over {impact.installMonths} months
              ≈ <strong><Mono>{roiText(impact.roiMultiple)}</Mono></strong> back.
            </p>
          ) : null}
        </div>
      </details>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Rung 2 — one row per activated playbook: its goal, an outcome meter, the honest
// numbers, and a one-glance verdict. The whole row drills to its receipts.
// ---------------------------------------------------------------------------
function meterSegments(row: PlaybookScore) {
  const total = row.fired || 1;
  const segs: { pct: number; tone: "pos" | "neutral" | "neg" | "warn"; label: string }[] = [];
  if (row.worked) segs.push({ pct: (row.worked / total) * 100, tone: "pos", label: "Worked" });
  if (row.pending) segs.push({ pct: (row.pending / total) * 100, tone: "warn", label: "In progress" });
  if (row.noChange) segs.push({ pct: (row.noChange / total) * 100, tone: "neutral", label: "No change" });
  if (row.failed) segs.push({ pct: (row.failed / total) * 100, tone: "neg", label: "Didn't land" });
  return segs;
}

function ScorecardRow({ row, active, onPick }: { row: PlaybookScore; active: boolean; onPick: () => void }) {
  // Only show a success % once enough has resolved to be meaningful (no "(100%)" off n=1).
  const showRate = row.resolved >= 3;
  return (
    <button type="button" className={["oc-score", active ? "is-active" : ""].filter(Boolean).join(" ")} onClick={onPick}>
      <span className="oc-score-ico" aria-hidden><Icon name={row.icon} /></span>
      <div className="oc-score-body">
        <div className="oc-score-head">
          <span className="oc-score-title">{row.title}</span>
          <Badge variant={row.verdictTone} dot title={VERDICT_HINT[row.verdict]}>{VERDICT_LABEL[row.verdict]}</Badge>
        </div>
        <p className="oc-score-obj">{row.objective}</p>
        <StackedBar segments={meterSegments(row)} height={7} className="oc-score-meter" />
        <p className="oc-score-nums">
          Ran on <Mono>{row.fired}</Mono> customer{row.fired === 1 ? "" : "s"} ·{" "}
          {row.worked > 0 ? (
            <>
              <strong><Mono>{row.worked}</Mono> {row.goalVerb}</strong>
              {showRate ? <> (<Mono>{Math.round(row.successRate * 100)}</Mono>%)</> : null} · kept <Mono>{fmt$(row.value)}</Mono>
            </>
          ) : row.pending > 0 ? (
            <><Mono>{row.pending}</Mono> still in progress</>
          ) : (
            <>no wins yet</>
          )}
        </p>
      </div>
      <Icon name="arrow-right" className="oc-score-go" />
    </button>
  );
}

// ---------------------------------------------------------------------------
// Rung 3 — Activity list: flat timeline or grouped by playbook / customer / channel.
// ---------------------------------------------------------------------------
type Group = { key: string; title: string; icon: string | null; monogram?: string; value: number; meta: string; items: OutcomeEvent[] };

function buildGroups(evs: OutcomeEvent[], by: SliceMode): Group[] {
  const map = new Map<string, OutcomeEvent[]>();
  for (const e of evs) {
    const key = by === "customer" ? e.accountId : by === "channel" ? e.channel : e.playbookId;
    const arr = map.get(key);
    if (arr) arr.push(e);
    else map.set(key, [e]);
  }
  return Array.from(map.entries())
    .map(([key, items]) => {
      const value = items.reduce((s, e) => s + e.amount, 0);
      const worked = items.filter((e) => e.result === "worked").length;
      const accountsCt = new Set(items.map((e) => e.accountId)).size;
      let title: string, icon: string | null, monogram: string | undefined, meta: string;
      if (by === "customer") {
        title = items[0].accountName;
        icon = null;
        monogram = items[0].accountName;
        meta = `${value > 0 ? `${fmt$(value)} kept · ` : ""}${items.length} action${items.length === 1 ? "" : "s"}`;
      } else if (by === "channel") {
        title = CHANNEL_META[items[0].channel]?.label ?? items[0].channel;
        icon = CHANNEL_META[items[0].channel]?.icon ?? "circle";
        meta = `${items.length} sent · ${worked} worked${value > 0 ? ` · ${fmt$(value)} kept` : ""}`;
      } else {
        title = items[0].playbookTitle;
        icon = CATEGORY_META[items[0].category].icon;
        meta = `${value > 0 ? `${fmt$(value)} kept · ` : ""}${items.length} action${items.length === 1 ? "" : "s"} · ${accountsCt} customer${accountsCt === 1 ? "" : "s"}`;
      }
      return { key, title, icon, monogram, value, meta, items: [...items].sort((a, b) => a.daysAgo - b.daysAgo) };
    })
    .sort((a, b) => b.value - a.value || b.items.length - a.items.length);
}

function rowProps(e: OutcomeEvent) {
  const r = RESULT_META[e.result];
  // "No change" is the quiet majority — the row's own words already say "no reply yet", so we
  // drop the redundant grey pill and only badge the outcomes that matter (worked/failed/pending).
  const showStatus = e.result !== "no_change";
  return {
    time: relTime(e.daysAgo),
    name: e.accountName,
    actionIcon: ACTION_META[e.action].icon,
    actionLabel: ACTION_META[e.action].label,
    summary: e.summary,
    status: showStatus ? r.label : undefined,
    statusTone: r.tone,
    value: e.amount > 0 ? `+${fmt$(e.amount)}` : undefined,
  };
}

function ActivityList({
  events,
  sliceBy,
  visible,
  onShowMore,
  onOpen,
  onClear,
}: {
  events: OutcomeEvent[];
  sliceBy: SliceMode;
  visible: number;
  onShowMore: () => void;
  onOpen: (e: OutcomeEvent) => void;
  onClear?: () => void;
}) {
  if (events.length === 0) {
    return (
      <Card padded>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--s-3)", padding: "var(--s-6) var(--s-4)", textAlign: "center" }}>
          <span aria-hidden style={{ color: "var(--text-3, #6a7689)" }}><Icon name="search-x" /></span>
          <span style={{ fontSize: "var(--t-body)", color: "var(--text-2, #46536b)" }}>
            {onClear ? "No actions match these filters." : "No playbook activity in this window yet — GoCSM is watching; nothing needed your attention."}
          </span>
          {onClear ? <Button variant="secondary" size="sm" onClick={onClear}>Clear filters</Button> : null}
        </div>
      </Card>
    );
  }

  if (sliceBy === "flat") {
    const shown = events.slice(0, visible);
    return (
      <>
        <Card padded={false}>
          <div className="oc-log">
            {shown.map((e) => (
              <EventRow key={e.id} {...rowProps(e)} onClick={() => onOpen(e)} />
            ))}
          </div>
        </Card>
        {events.length > visible ? (
          <div style={{ display: "flex", justifyContent: "center" }}>
            <Button variant="secondary" size="sm" onClick={onShowMore} icon={<Icon name="chevron-down" />}>
              Show {Math.min(PAGE, events.length - visible)} more
            </Button>
          </div>
        ) : null}
      </>
    );
  }

  const groups = buildGroups(events, sliceBy);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-3)" }}>
      {groups.map((g) => (
        <Card key={g.key} padded={false}>
          <div className="oc-group">
            <div className="oc-group-head">
              {g.monogram ? <Monogram name={g.monogram} size={24} /> : <span className="oc-group-ico" aria-hidden><Icon name={g.icon ?? "book-open"} /></span>}
              <span className="oc-group-title">{g.title}</span>
              <span className="oc-group-meta">{g.meta}</span>
            </div>
            <div className="oc-log">
              {g.items.map((e) => (
                <EventRow key={e.id} {...rowProps(e)} hideName={sliceBy === "customer"} onClick={() => onOpen(e)} />
              ))}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Event detail — slide-over with the full action record. The deepest drill-in.
// ---------------------------------------------------------------------------
function EventDetail({ event, onClose, onAccount }: { event: OutcomeEvent; onClose: () => void; onAccount: () => void }) {
  const r = RESULT_META[event.result];
  const cm = CATEGORY_META[event.category];
  const am = ACTION_META[event.action];
  const rows: { k: string; v: ReactNode }[] = [
    { k: "Action", v: (<><Icon name={am.icon} /> {am.label}</>) },
    { k: "Playbook", v: (<><Icon name={cm.icon} /> {event.playbookTitle}</>) },
    { k: "Channel", v: CHANNEL_META[event.channel]?.label ?? event.channel },
    { k: "When", v: `${relTime(event.daysAgo)} ago` },
    { k: "Outcome", v: <Badge variant={r.tone === "neg" ? "danger" : r.tone} dot>{r.label}</Badge> },
    { k: "Value", v: event.amount > 0 ? <span style={{ color: "var(--pos-9, #1f6e12)", fontWeight: 700 }}>+{fmt$(event.amount)}/mo</span> : "—" },
    { k: "Ran by", v: event.attribution === "autopilot" ? "GoCSM, automatically" : "You or your team" },
  ];
  return (
    <div className="oc-drawer-scrim" onClick={onClose}>
      <aside className="oc-drawer" role="dialog" aria-label="Action detail" onClick={(e) => e.stopPropagation()}>
        <div className="oc-drawer-head">
          <Monogram name={event.accountName} size={34} />
          <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
            <span style={{ fontSize: "var(--t-body-lg)", fontWeight: 700, color: "var(--text)" }}>{event.accountName}</span>
            <span style={{ fontSize: "var(--t-caption)", color: "var(--text-3, #6a7689)" }}>{event.plan}</span>
          </div>
          <button className="oc-drawer-close" onClick={onClose} aria-label="Close"><Icon name="x" /></button>
        </div>

        <p style={{ margin: 0, fontSize: "var(--t-subheading)", fontWeight: 600, lineHeight: 1.35, color: "var(--text)" }}>{event.summary}.</p>

        <div className="oc-drawer-rows">
          {rows.map((row) => (
            <div key={row.k} className="oc-drow">
              <span className="oc-drow-k">{row.k}</span>
              <span className="oc-drow-v">{row.v}</span>
            </div>
          ))}
        </div>

        <Button variant="secondary" size="md" onClick={onAccount} icon={<Icon name="user" />} style={{ alignSelf: "flex-start" }}>
          View account
        </Button>
      </aside>
    </div>
  );
}
