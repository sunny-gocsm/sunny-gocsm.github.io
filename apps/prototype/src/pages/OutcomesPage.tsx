import { useMemo, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  StatCard,
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
} from "@gocsm/design-system";
import { PageRibbon } from "@/components/PageRibbon";
import {
  filterEvents,
  reportCardCompare,
  outcomeSummary,
  loggedAccounts,
  CATEGORY_META,
  ACTION_META,
  RESULT_META,
  type Window as TimeWindow,
  type EventFilter,
  type OutcomeEvent,
  type EventCategory,
  type ActionKind,
  type EventResult,
  type ReportCard,
  type SummaryBullet,
  type OutcomeSummary,
} from "@/fixtures/outcomeLog";

type LogFilter = Omit<EventFilter, "window">;
type GroupMode = "flat" | "customer" | "workflow";

const WINDOW_OPTIONS = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "lifetime", label: "Lifetime" },
];
const GROUP_OPTIONS = [
  { value: "flat", label: "Timeline" },
  { value: "customer", label: "By customer" },
  { value: "workflow", label: "By workflow" },
];
const ACTION_KINDS: ActionKind[] = ["email", "sms", "call", "dunning", "alert", "task"];
const RESULTS: EventResult[] = ["worked", "no_change", "failed", "pending"];
const PAGE = 25;

const fmt$ = (n: number) => "$" + Math.round(n).toLocaleString();
const priorPhrase = (w: TimeWindow) => (w === "7d" ? "prev 7 days" : "prev 30 days");

function relTime(d: number): string {
  if (d <= 0) return "Today";
  if (d === 1) return "1d";
  if (d < 7) return `${d}d`;
  if (d < 30) return `${Math.round(d / 7)}w`;
  if (d < 365) return `${Math.round(d / 30)}mo`;
  return `${Math.round(d / 365)}y`;
}

/** Signed delta vs the prior period → drives the StatCard arrow + a short % label. */
function pctDelta(cur: number, prior: number | null | undefined): { delta: number; text: string } | null {
  if (prior == null) return null;
  const d = cur - prior;
  if (prior === 0) return d > 0 ? { delta: 1, text: "New" } : null;
  const pct = Math.round((d / prior) * 100);
  if (pct === 0) return { delta: 0, text: "Flat" };
  return { delta: d, text: `${pct > 0 ? "+" : ""}${pct}%` };
}

export default function OutcomesPage() {
  const navigate = useNavigate();
  const [windowSel, setWindowSel] = useState<TimeWindow>("lifetime");
  const [filter, setFilter] = useState<LogFilter>({});
  const [groupBy, setGroupBy] = useState<GroupMode>("flat");
  const [visible, setVisible] = useState(PAGE);
  const [detail, setDetail] = useState<OutcomeEvent | null>(null);
  const logRef = useRef<HTMLDivElement>(null);

  const summary = useMemo(() => outcomeSummary(windowSel), [windowSel]);
  const { current, prior } = useMemo(() => reportCardCompare(windowSel), [windowSel]);
  const accounts = useMemo(() => loggedAccounts(), []);
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
  function drillCategory(c: EventCategory) {
    patch({ category: filter.category === c ? undefined : c });
    scrollToLog();
  }
  function applyBullet(bf: Partial<EventFilter>) {
    const { window: _w, ...rest } = bf;
    setVisible(PAGE);
    setFilter(rest);
    scrollToLog();
  }

  // Active-filter chips — every applied slice, individually removable.
  const chips: { key: string; label: string; clear: () => void }[] = [];
  if (filter.category) chips.push({ key: "cat", label: CATEGORY_META[filter.category].label, clear: () => patch({ category: undefined }) });
  if (filter.action) chips.push({ key: "act", label: ACTION_META[filter.action].label, clear: () => patch({ action: undefined }) });
  if (filter.result) chips.push({ key: "res", label: RESULT_META[filter.result].label, clear: () => patch({ result: undefined }) });
  if (filter.accountId) {
    const a = accounts.find((x) => x.id === filter.accountId);
    chips.push({ key: "acc", label: a?.name ?? "Customer", clear: () => patch({ accountId: undefined }) });
  }
  if (filter.query) chips.push({ key: "q", label: `“${filter.query}”`, clear: () => patch({ query: undefined }) });

  return (
    <main
      style={{
        padding: "var(--s-8) var(--s-6)",
        maxWidth: 1140,
        margin: "0 auto",
        color: "var(--text)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--s-6)",
      }}
    >
      <PageRibbon
        title="Outcomes"
        description="Everything GoCSM has done to keep your customers — and the revenue it kept on the table."
      >
        <div style={{ marginTop: "var(--s-1)" }}>
          <SegmentedControl
            options={WINDOW_OPTIONS}
            value={windowSel}
            onChange={(v) => setWindow(v as TimeWindow)}
          />
        </div>
      </PageRibbon>

      <AiSummary summary={summary} onBullet={applyBullet} />

      <ReportCardSection current={current} prior={prior} window={windowSel} active={filter.category} onCategory={drillCategory} />

      <section ref={logRef} style={{ display: "flex", flexDirection: "column", gap: "var(--s-3)", scrollMarginTop: "var(--s-5)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--s-3)", flexWrap: "wrap" }}>
          <h2 style={{ fontSize: "var(--t-heading)", fontWeight: 700, margin: 0 }}>Activity log</h2>
          <Badge variant="neutral" dot={false}>
            <Mono>{events.length}</Mono> action{events.length === 1 ? "" : "s"}
          </Badge>
          <span style={{ marginLeft: "auto" }}>
            <SegmentedControl options={GROUP_OPTIONS} value={groupBy} onChange={(v) => setGroupBy(v as GroupMode)} />
          </span>
        </div>

        {/* Filter bar — search + customer / action / outcome. Timeline is the page window above. */}
        <div className="oc-filterbar">
          <Input
            placeholder="Search customers or actions…"
            value={filter.query ?? ""}
            onChange={(e) => patch({ query: e.target.value || undefined })}
          />
          <Input as="select" value={filter.accountId ?? ""} onChange={(e) => patch({ accountId: e.target.value || undefined })} aria-label="Customer">
            <option value="">All customers</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </Input>
          <Input as="select" value={filter.action ?? ""} onChange={(e) => patch({ action: (e.target.value || undefined) as ActionKind | undefined })} aria-label="Action">
            <option value="">All actions</option>
            {ACTION_KINDS.map((k) => (
              <option key={k} value={k}>{ACTION_META[k].label}</option>
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
          groupBy={groupBy}
          visible={visible}
          onShowMore={() => setVisible((v) => v + PAGE)}
          onOpen={setDetail}
          onClear={chips.length ? () => { setFilter({}); setVisible(PAGE); } : undefined}
        />
      </section>

      {detail ? (
        <EventDetail
          event={detail}
          onClose={() => setDetail(null)}
          onAccount={() => { navigate(`/accounts/${detail.accountId}`); }}
        />
      ) : null}
    </main>
  );
}

// ---------------------------------------------------------------------------
// AI summary — grounded verdict + click-to-source bullets + scope line.
// Every number is computed in the data layer; the wording is a template around it.
// ---------------------------------------------------------------------------
function AiSummary({ summary, onBullet }: { summary: OutcomeSummary; onBullet: (f: Partial<EventFilter>) => void }) {
  return (
    <Card padded>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-3)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--s-2)" }}>
          <span aria-hidden style={{ width: 28, height: 28, borderRadius: 8, display: "grid", placeItems: "center", background: "var(--blue-2, #e5f1fe)", color: "var(--blue-8, #0c5aae)" }}>
            <Icon name="sparkles" />
          </span>
          <span style={{ fontSize: "var(--t-caption)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-3, #6a7689)" }}>
            What this means
          </span>
          <span style={{ marginLeft: "auto", fontSize: "var(--t-caption)", color: "var(--text-3, #6a7689)" }}>{summary.asOf}</span>
        </div>

        <p style={{ margin: 0, fontSize: "var(--t-subheading)", fontWeight: 650, lineHeight: 1.3, color: "var(--text)" }}>{summary.verdict}</p>

        {summary.bullets.length ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-2)" }}>
            {summary.bullets.map((b: SummaryBullet, i: number) => (
              <button key={i} type="button" className="oc-bullet" onClick={() => onBullet(b.filter)}>
                <span className={`oc-dot ${b.tone}`} aria-hidden>
                  <Icon name={b.tone === "pos" ? "check" : "alert-circle"} />
                </span>
                <span className="oc-bullet-text">{b.text}</span>
                <Icon name="arrow-right" className="oc-bullet-go" />
              </button>
            ))}
          </div>
        ) : null}

        {summary.contextLine ? (
          <p style={{ margin: 0, fontSize: "var(--t-body-sm)", color: "var(--text-2, #46536b)" }}>{summary.contextLine}</p>
        ) : null}
        <p style={{ margin: 0, fontSize: "var(--t-caption)", color: "var(--text-3, #6a7689)", borderTop: "1px solid var(--border)", paddingTop: "var(--s-2)" }}>
          {summary.scopeLine}
        </p>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Report card — one hero $ total + a grid of dual-axis category cards.
// ---------------------------------------------------------------------------
function ReportCardSection({
  current,
  prior,
  window,
  active,
  onCategory,
}: {
  current: ReportCard;
  prior: ReportCard | null;
  window: TimeWindow;
  active?: EventCategory;
  onCategory: (c: EventCategory) => void;
}) {
  const heroDelta = pctDelta(current.totalValue, prior?.totalValue);
  const priorByCat = new Map((prior?.byCategory ?? []).map((c) => [c.category, c.value]));
  const cats = [...current.byCategory].filter((c) => c.value > 0 || c.count > 0).sort((a, b) => b.value - a.value);

  const heroSecondary =
    window === "lifetime"
      ? `Since you installed GoCSM · ${current.accountsHelped} customer${current.accountsHelped === 1 ? "" : "s"} helped`
      : `${current.accountsHelped} customer${current.accountsHelped === 1 ? "" : "s"} helped · ${current.actionsRun} action${current.actionsRun === 1 ? "" : "s"} run`;

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: "var(--s-4)" }}>
      <StatCard
        size="hero"
        tone="brand"
        icon="shield-check"
        label="Total value delivered"
        value={fmt$(current.totalValue)}
        secondary={heroSecondary}
        delta={heroDelta?.delta}
        deltaText={heroDelta ? `${heroDelta.text} vs ${priorPhrase(window)}` : undefined}
      />

      {cats.length ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "var(--s-3)" }}>
          {cats.map((c) => {
            const d = prior ? pctDelta(c.value, priorByCat.get(c.category) ?? 0) : null;
            const meta = CATEGORY_META[c.category];
            return (
              <StatCard
                key={c.category}
                label={meta.label}
                icon={meta.icon}
                value={fmt$(c.value)}
                secondary={`${c.count} account${c.count === 1 ? "" : "s"}`}
                delta={d?.delta}
                deltaText={d?.text}
                onClick={() => onCategory(c.category)}
                className={active === c.category ? "is-active" : undefined}
              />
            );
          })}
        </div>
      ) : null}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Activity list — flat timeline or grouped by customer / workflow.
// ---------------------------------------------------------------------------
type Group = { key: string; title: string; icon: string | null; value: number; accounts: number; items: OutcomeEvent[] };

function buildGroups(evs: OutcomeEvent[], by: GroupMode): Group[] {
  const map = new Map<string, OutcomeEvent[]>();
  for (const e of evs) {
    const key = by === "customer" ? e.accountId : e.playbookId;
    const arr = map.get(key);
    if (arr) arr.push(e);
    else map.set(key, [e]);
  }
  return Array.from(map.entries())
    .map(([key, items]) => ({
      key,
      title: by === "customer" ? items[0].accountName : items[0].playbookTitle,
      icon: by === "customer" ? null : CATEGORY_META[items[0].category].icon,
      value: items.reduce((s, e) => s + e.amount, 0),
      accounts: new Set(items.map((e) => e.accountId)).size,
      items: [...items].sort((a, b) => a.daysAgo - b.daysAgo),
    }))
    .sort((a, b) => b.value - a.value || b.items.length - a.items.length);
}

function rowProps(e: OutcomeEvent) {
  const r = RESULT_META[e.result];
  return {
    time: relTime(e.daysAgo),
    name: e.accountName,
    actionIcon: ACTION_META[e.action].icon,
    actionLabel: ACTION_META[e.action].label,
    summary: e.summary,
    status: r.label,
    statusTone: r.tone,
    value: e.amount > 0 ? `+${fmt$(e.amount)}` : undefined,
  };
}

function ActivityList({
  events,
  groupBy,
  visible,
  onShowMore,
  onOpen,
  onClear,
}: {
  events: OutcomeEvent[];
  groupBy: GroupMode;
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
          <span style={{ fontSize: "var(--t-body)", color: "var(--text-2, #46536b)" }}>No actions match these filters.</span>
          {onClear ? <Button variant="secondary" size="sm" onClick={onClear}>Clear filters</Button> : null}
        </div>
      </Card>
    );
  }

  if (groupBy === "flat") {
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

  const groups = buildGroups(events, groupBy);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-3)" }}>
      {groups.map((g) => (
        <Card key={g.key} padded={false}>
          <div className="oc-group">
            <div className="oc-group-head">
              {groupBy === "customer" ? (
                <Monogram name={g.title} size={24} />
              ) : (
                <span className="oc-group-ico" aria-hidden><Icon name={g.icon ?? "book-open"} /></span>
              )}
              <span className="oc-group-title">{g.title}</span>
              <span className="oc-group-meta">
                {g.value > 0 ? `${fmt$(g.value)} kept · ` : ""}
                {g.items.length} action{g.items.length === 1 ? "" : "s"}
                {groupBy === "workflow" ? ` · ${g.accounts} account${g.accounts === 1 ? "" : "s"}` : ""}
              </span>
            </div>
            <div className="oc-log">
              {g.items.map((e) => (
                <EventRow key={e.id} {...rowProps(e)} hideName={groupBy === "customer"} onClick={() => onOpen(e)} />
              ))}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Event detail — slide-over with the full action record. The drill-in.
// ---------------------------------------------------------------------------
function EventDetail({ event, onClose, onAccount }: { event: OutcomeEvent; onClose: () => void; onAccount: () => void }) {
  const r = RESULT_META[event.result];
  const cm = CATEGORY_META[event.category];
  const am = ACTION_META[event.action];
  const rows: { k: string; v: ReactNode }[] = [
    { k: "Action", v: (<><Icon name={am.icon} /> {am.label}</>) },
    { k: "Workflow", v: (<><Icon name={cm.icon} /> {event.playbookTitle}</>) },
    { k: "Channel", v: event.channel },
    { k: "When", v: `${relTime(event.daysAgo)} ago` },
    { k: "Outcome", v: <span className={`er-status tone-${r.tone}`}>{r.label}</span> },
    { k: "Value", v: event.amount > 0 ? <span style={{ color: "var(--pos-9, #1f6e12)", fontWeight: 700 }}>+{fmt$(event.amount)} MRR</span> : "—" },
    { k: "Ran by", v: event.attribution === "autopilot" ? "GoCSM autopilot" : "You approved it" },
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
