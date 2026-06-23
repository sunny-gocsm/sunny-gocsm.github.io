import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Button, Icon, Mono, Tabs } from "@gocsm/design-system";
import { toast } from "sonner";
import { PageRibbon } from "@/components/PageRibbon";
import {
  playbooks,
  playbookImpact,
  isNewPlaybook,
  categoryLabel,
  CATEGORIES,
  EFFORT_LABEL,
  SIGNALS,
  SIGNAL_LABEL,
  type Playbook,
  type PlaybookCategory,
  type PlaybookEffort,
  type PlaybookSignal,
} from "@/fixtures/playbooks";
import {
  autopilotStore,
  useAutopilotStatus,
  useAutopilotVersion,
  type AutopilotStatus,
} from "@/state/autopilot";
import { RECIPES, type Recipe } from "@/fixtures/recipes";
import { hasDraft, clearDraft } from "@/state/workflowDrafts";
import { AttentionActivation } from "@/components/attention/AttentionActivation";

// PlaybooksPage — the Playbooks LIBRARY. Two tabs:
//   • Library — browse the full catalog in an Amazon-style storefront: a sticky left
//     filter rail (Category · Setup effort · Highlights) + search + sort, and the
//     COMPLETE grid of plays on the right (every play visible, narrowed by the facets).
//     A single AI-pick hero leads the unfiltered view. Status lives ON each card.
//   • Your playbooks — what you've deployed: Live · Paused · Drafts · Archived, with manage.
// Adding ≠ activating: "Set up" opens the detail (preview the bundle) → go live via the
// existing setup flow. Lifecycle is Pause/Unpublish → Archive (soft) — never hard-delete.

type TabId = "library" | "mine";

const fmtMoney = (n: number) => "$" + Math.round(n).toLocaleString();
const fmtCompact = (n: number) =>
  n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, "") + "k" : String(n);

// Library status for a card, derived from the lifecycle store.
function marketStatus(s: AutopilotStatus): "available" | "live" | "paused" {
  if (s === "on") return "live";
  if (s === "paused") return "paused";
  return "available"; // off | archived → re-installable from the catalog
}

export default function PlaybooksPage() {
  const [tab, setTab] = useState<TabId>("library");
  // activation overlay: a recipe to resume/edit, or {} for create-from-scratch
  const [activation, setActivation] = useState<{ recipe?: Recipe } | null>(null);
  const navigate = useNavigate();
  useAutopilotVersion(); // re-render on any lifecycle change

  // Live impact per playbook (matching accounts + $), computed once.
  const impacts = useMemo(() => {
    const m = new Map<string, { count: number; mrr: number }>();
    playbooks.forEach((p) => m.set(p.id, playbookImpact(p)));
    return m;
  }, []);
  const impactOf = (p: Playbook) => impacts.get(p.id) ?? { count: 0, mrr: 0 };

  // Your-playbooks count for the tab label (re-renders via useAutopilotVersion above).
  const mineCount =
    autopilotStore.listOn().length +
    autopilotStore.listPaused().length +
    RECIPES.filter((r) => hasDraft(r.id) && autopilotStore.status(r.playbookId) !== "on").length;

  const open = (id: string) => navigate(`/playbooks/${id}`);

  return (
    <main className="mk-main">
      <PageRibbon
        title="Playbooks"
        description="A growing library of ready-made customer-success automations. Turn one on, customize it, done."
        trailing={
          <Button variant="ghost" className="btn-accent" size="sm" icon={<Icon name="plus" />} onClick={() => setActivation({})}>
            Create from scratch
          </Button>
        }
      />

      <Tabs
        tabs={[
          { id: "library", label: "Library" },
          { id: "mine", label: `Your playbooks${mineCount ? ` (${mineCount})` : ""}` },
        ]}
        active={tab}
        onChange={(id) => setTab(id as TabId)}
      />

      {tab === "library" ? (
        <LibraryTab impactOf={impactOf} onOpen={open} />
      ) : (
        <YourPlaybooksTab impactOf={impactOf} onOpen={open} onResume={(recipe) => setActivation({ recipe })} onBrowse={() => setTab("library")} />
      )}

      {activation ? (
        <AttentionActivation
          recipe={activation.recipe}
          backLabel="Playbooks"
          onClose={() => setActivation(null)}
        />
      ) : null}
    </main>
  );
}

type SortKey = "used" | "impact" | "new";

// ─────────────────────────────── Library tab (storefront) ───────────────────────────────
function LibraryTab({
  impactOf,
  onOpen,
}: {
  impactOf: (p: Playbook) => { count: number; mrr: number };
  onOpen: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<PlaybookCategory | "all">("all");
  const [efforts, setEfforts] = useState<Set<PlaybookEffort>>(new Set());
  const [sigs, setSigs] = useState<Set<PlaybookSignal>>(new Set());
  const [flags, setFlags] = useState<Set<"new" | "trending">>(new Set());
  const [sort, setSort] = useState<SortKey>("used");

  const q = query.trim().toLowerCase();
  const anyFilter = cat !== "all" || efforts.size > 0 || sigs.size > 0 || flags.size > 0 || q.length > 0;

  const matchText = (p: Playbook) =>
    !q || `${p.title} ${p.subtitle} ${p.problem} ${categoryLabel(p.category)}`.toLowerCase().includes(q);
  const matchEffort = (p: Playbook) => efforts.size === 0 || efforts.has(p.effort);
  const matchSignal = (p: Playbook) => sigs.size === 0 || sigs.has(p.signal);
  const matchFlags = (p: Playbook) =>
    flags.size === 0 || (flags.has("new") && isNewPlaybook(p)) || (flags.has("trending") && p.trending);

  // Category counts honour the OTHER active facets (standard faceted-search behaviour).
  const catCounts = useMemo(() => {
    const base = playbooks.filter((p) => matchEffort(p) && matchSignal(p) && matchFlags(p) && matchText(p));
    const by = new Map<string, number>();
    for (const p of base) by.set(p.category, (by.get(p.category) ?? 0) + 1);
    return { all: base.length, by };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [efforts, sigs, flags, q]);

  // Situation counts honour every OTHER facet (category, effort, highlights, text) —
  // but not the Situation selection itself, so all bands stay switchable.
  const sigCounts = useMemo(() => {
    const base = playbooks.filter(
      (p) => (cat === "all" || p.category === cat) && matchEffort(p) && matchFlags(p) && matchText(p),
    );
    const by = new Map<PlaybookSignal, number>();
    for (const p of base) by.set(p.signal, (by.get(p.signal) ?? 0) + 1);
    return by;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cat, efforts, flags, q]);

  const results = useMemo(() => {
    const list = playbooks.filter(
      (p) => (cat === "all" || p.category === cat) && matchEffort(p) && matchSignal(p) && matchFlags(p) && matchText(p),
    );
    const byUsed = (a: Playbook, b: Playbook) => b.usedByAgencies - a.usedByAgencies;
    const byImpact = (a: Playbook, b: Playbook) =>
      impactOf(b).mrr - impactOf(a).mrr || impactOf(b).count - impactOf(a).count || byUsed(a, b);
    const byNew = (a: Playbook, b: Playbook) => a.launchedDaysAgo - b.launchedDaysAgo;
    return list.sort(sort === "impact" ? byImpact : sort === "new" ? byNew : byUsed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cat, efforts, sigs, flags, q, sort]);

  // AI pick — only on the unfiltered landing view; promoted out of the grid below.
  const aiPick = useMemo(() => {
    if (anyFilter) return null;
    const notLive = (p: Playbook) => autopilotStore.status(p.id) !== "on";
    return (
      playbooks.slice().filter(notLive).sort((a, b) => impactOf(b).mrr - impactOf(a).mrr).find((p) => impactOf(p).mrr > 0) ??
      playbooks.slice().filter(notLive).sort((a, b) => b.usedByAgencies - a.usedByAgencies)[0] ??
      null
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anyFilter]);

  const gridItems = aiPick ? results.filter((p) => p.id !== aiPick.id) : results;

  const toggleEffort = (e: PlaybookEffort) =>
    setEfforts((s) => { const n = new Set(s); n.has(e) ? n.delete(e) : n.add(e); return n; });
  const toggleSignal = (sig: PlaybookSignal) =>
    setSigs((s) => { const n = new Set(s); n.has(sig) ? n.delete(sig) : n.add(sig); return n; });
  const toggleFlag = (f: "new" | "trending") =>
    setFlags((s) => { const n = new Set(s); n.has(f) ? n.delete(f) : n.add(f); return n; });
  const clearAll = () => { setCat("all"); setEfforts(new Set()); setSigs(new Set()); setFlags(new Set()); setQuery(""); };

  return (
    <div className="mk-catalog">
      {/* Sticky left filter rail — accessible while the catalog scrolls. */}
      <aside className="mk-filters">
        <div className="mk-search">
          <Icon name="search" />
          <input
            className="mk-search-input"
            value={query}
            placeholder="Search playbooks…"
            onChange={(e) => setQuery(e.target.value)}
          />
          {query ? (
            <button type="button" className="mk-search-clear" aria-label="Clear" onClick={() => setQuery("")}>
              <Icon name="x" />
            </button>
          ) : null}
        </div>

        <div className="mk-facet">
          <p className="mk-facet-title">Category</p>
          <button type="button" className={`mk-facet-item${cat === "all" ? " on" : ""}`} onClick={() => setCat("all")}>
            <Icon name="layout-grid" /><span className="lbl">All playbooks</span><span className="cnt">{catCounts.all}</span>
          </button>
          {CATEGORIES.map((cdef) => (
            <button
              key={cdef.id}
              type="button"
              className={`mk-facet-item${cat === cdef.id ? " on" : ""}`}
              onClick={() => setCat(cat === cdef.id ? "all" : cdef.id)}
            >
              <Icon name={cdef.icon} /><span className="lbl">{cdef.label}</span>
              <span className="cnt">{catCounts.by.get(cdef.id) ?? 0}</span>
            </button>
          ))}
        </div>

        <div className="mk-facet">
          <p className="mk-facet-title">Situation</p>
          {SIGNALS.map((s) => (
            <button key={s.id} type="button" className={`mk-facet-item${sigs.has(s.id) ? " on" : ""}`} onClick={() => toggleSignal(s.id)}>
              <span className="mk-facet-check">{sigs.has(s.id) ? <Icon name="check" /> : null}</span>
              <span className={`mk-sig-dot ${s.id}`} aria-hidden />
              <span className="lbl">{SIGNAL_LABEL[s.id]}</span>
              <span className="cnt">{sigCounts.get(s.id) ?? 0}</span>
            </button>
          ))}
        </div>

        <div className="mk-facet">
          <p className="mk-facet-title">Setup effort</p>
          {(["ready", "quick", "custom"] as PlaybookEffort[]).map((e) => (
            <button key={e} type="button" className={`mk-facet-item${efforts.has(e) ? " on" : ""}`} onClick={() => toggleEffort(e)}>
              <span className="mk-facet-check">{efforts.has(e) ? <Icon name="check" /> : null}</span>
              <span className="lbl">{EFFORT_LABEL[e]}</span>
            </button>
          ))}
        </div>

        <div className="mk-facet">
          <p className="mk-facet-title">Highlights</p>
          <button type="button" className={`mk-facet-item${flags.has("new") ? " on" : ""}`} onClick={() => toggleFlag("new")}>
            <span className="mk-facet-check">{flags.has("new") ? <Icon name="check" /> : null}</span>
            <span className="lbl">New this week</span>
          </button>
          <button type="button" className={`mk-facet-item${flags.has("trending") ? " on" : ""}`} onClick={() => toggleFlag("trending")}>
            <span className="mk-facet-check">{flags.has("trending") ? <Icon name="check" /> : null}</span>
            <span className="lbl">Trending</span>
          </button>
        </div>

        {anyFilter ? (
          <button type="button" className="mk-filters-clear" onClick={clearAll}>Clear all filters</button>
        ) : null}
      </aside>

      <div className="mk-catalog-main">
        {aiPick ? <AiPickCard p={aiPick} impact={impactOf(aiPick)} onOpen={() => onOpen(aiPick.id)} /> : null}

        <div className="mk-toolbar">
          <span className="mk-toolbar-count">
            {results.length} playbook{results.length === 1 ? "" : "s"}
            {cat !== "all" ? ` in ${categoryLabel(cat as PlaybookCategory)}` : ""}
          </span>
          <label className="mk-sort">
            <Icon name="arrow-up-down" /> Sort
            <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
              <option value="used">Most used</option>
              <option value="impact">Highest impact</option>
              <option value="new">Newest</option>
            </select>
          </label>
        </div>

        {results.length === 0 ? (
          <Card padded>
            <p className="mk-empty">
              Nothing matches these filters.{" "}
              <button type="button" className="mk-filters-clear" onClick={clearAll}>Clear all</button>
            </p>
          </Card>
        ) : (
          <div className="mk-grid">
            {gridItems.map((p) => (
              <MarketCard key={p.id} p={p} impact={impactOf(p)} onOpen={() => onOpen(p.id)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// AI pick hero — the single highest-impact available playbook, ranked by YOUR at-risk $.
function AiPickCard({ p, impact, onOpen }: { p: Playbook; impact: { count: number; mrr: number }; onOpen: () => void }) {
  return (
    <Card padded className="mk-aipick" data-clickable="true" role="button" tabIndex={0} onClick={onOpen} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onOpen()}>
      <div className="mk-aipick-body">
        <span className="mk-aipick-eyebrow"><Icon name="sparkles" /> AI pick for you</span>
        {impact.mrr > 0 ? (
          <>
            <h2 className="mk-aipick-title">{p.title}</h2>
            <p className="mk-aipick-line">
              Turn this on first — it works on <span className="at-risk"><Mono>{fmtMoney(impact.mrr)}</Mono> at risk</span> across <Mono>{impact.count}</Mono> of your account{impact.count === 1 ? "" : "s"} today.
            </p>
            <p className="mk-aipick-why">Picked because it covers the most at-risk revenue across your accounts right now.</p>
          </>
        ) : (
          <>
            <h2 className="mk-aipick-title">{p.title}</h2>
            <p className="mk-aipick-line">A popular place to start — used by <Mono>{fmtCompact(p.usedByAgencies)}</Mono> agencies.</p>
            <p className="mk-aipick-why">Picked because nothing's at risk today — this is the most-trusted way to get ahead.</p>
          </>
        )}
      </div>
      <Button variant="primary" iconRight={<Icon name="arrow-right" />} onClick={(e: React.MouseEvent) => { e.stopPropagation(); onOpen(); }}>
        Set up
      </Button>
    </Card>
  );
}

// Churn↔expansion rating — a colored dot + band label (Critical → Very positive).
// Present on every card, so the grid reads as an at-a-glance urgency column.
function SignalPill({ signal }: { signal: PlaybookSignal }) {
  return (
    <span className={`mk-sig ${signal}`} title={`Situation: ${SIGNAL_LABEL[signal]}`}>
      <span className="mk-sig-dot" aria-hidden />
      {SIGNAL_LABEL[signal]}
    </span>
  );
}

// One library card — outcome title → one meta line → ONE CTA. Status lives here.
function MarketCard({ p, impact, onOpen, rail }: { p: Playbook; impact: { count: number; mrr: number }; onOpen: () => void; rail?: boolean }) {
  const status = marketStatus(useAutopilotStatus(p.id));
  const isNew = isNewPlaybook(p);
  const cta = status === "live" ? "Manage" : status === "paused" ? "Resume" : "Set up";
  return (
    <Card padded className={`mk-card${rail ? " rail" : ""}`} data-clickable="true" role="button" tabIndex={0} onClick={onOpen} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onOpen()}>
      <div className="mk-card-top">
        <span className="mk-card-ico" aria-hidden><Icon name={p.icon} /></span>
        <span className="mk-card-tags">
          {status === "live" ? (
            <span className="mk-status live"><Icon name="check" /> Live</span>
          ) : status === "paused" ? (
            <span className="mk-status paused"><Icon name="pause" /> Paused</span>
          ) : isNew ? (
            <span className="mk-status new">New</span>
          ) : p.trending ? (
            <span className="mk-status trend"><Icon name="trending-up" /> Trending</span>
          ) : null}
          <SignalPill signal={p.signal} />
        </span>
      </div>
      <h3 className="mk-card-title">{p.title}</h3>
      <p className="mk-card-sub">{p.subtitle}</p>

      {/* Social proof leads on every card (the differentiator); a quiet $ line only
          appears where there are real matches today. Live cards show what's running. */}
      <div className="mk-card-meta">
        {status === "live" ? (
          <span className="mk-card-impact"><Icon name="users" /> Running on <Mono>{impact.count}</Mono> client{impact.count === 1 ? "" : "s"}</span>
        ) : (
          <>
            <span className="mk-card-proof"><Icon name="users" /> {fmtCompact(p.usedByAgencies)} agencies · {fmtCompact(p.totalRuns)} runs</span>
            {impact.mrr > 0 ? (
              <span className="mk-card-risk"><span className="at-risk"><Mono>{fmtMoney(impact.mrr)}</Mono> at risk</span> · <Mono>{impact.count}</Mono> account{impact.count === 1 ? "" : "s"} now</span>
            ) : null}
          </>
        )}
      </div>

      {/* The whole card is the click target (role=button above). The CTA is a
          quiet visual affordance — never a filled button — so a wall of cards
          never competes with the single solid-blue AI-pick focal action. */}
      <div className="mk-card-foot">
        <span className="mk-effort">{EFFORT_LABEL[p.effort]}</span>
        <span className="mk-cta">{cta} <Icon name="arrow-right" /></span>
      </div>
    </Card>
  );
}

// ─────────────────────────────── Your playbooks tab ───────────────────────────────
function YourPlaybooksTab({
  impactOf,
  onOpen,
  onResume,
  onBrowse,
}: {
  impactOf: (p: Playbook) => { count: number; mrr: number };
  onOpen: (id: string) => void;
  onResume: (recipe: Recipe) => void;
  onBrowse: () => void;
}) {
  useAutopilotVersion();
  const byId = (id: string) => playbooks.find((p) => p.id === id);
  const live = autopilotStore.listOn().map(byId).filter(Boolean) as Playbook[];
  const paused = autopilotStore.listPaused().map(byId).filter(Boolean) as Playbook[];
  const archived = autopilotStore.listArchived().map(byId).filter(Boolean) as Playbook[];
  // Drafts: recipes with a saved draft whose playbook isn't already live.
  const drafts = RECIPES.filter((r) => hasDraft(r.id) && autopilotStore.status(r.playbookId) !== "on");

  const empty = !live.length && !paused.length && !drafts.length && !archived.length;
  if (empty) {
    return (
      <Card padded className="mk-empty-card">
        <Icon name="book-open" />
        <p className="mk-empty">No live playbooks yet. Browse the library and turn one on — it takes about a minute.</p>
        <Button variant="primary" icon={<Icon name="arrow-left" />} onClick={onBrowse}>Browse the library</Button>
      </Card>
    );
  }

  return (
    <div className="mk-mine">
      {live.length ? (
        <ManageSection title="Live" tone="pos" note="Running automatically.">
          {live.map((p) => <ManageRow key={p.id} p={p} status="on" impact={impactOf(p)} onOpen={() => onOpen(p.id)} />)}
        </ManageSection>
      ) : null}

      {drafts.length ? (
        <ManageSection title="Drafts" tone="warn" note="Started but not live yet.">
          {drafts.map((r) => <DraftRow key={r.id} recipe={r} onResume={() => onResume(r)} />)}
        </ManageSection>
      ) : null}

      {paused.length ? (
        <ManageSection title="Paused" tone="warn" note="Set up, but not running.">
          {paused.map((p) => <ManageRow key={p.id} p={p} status="paused" impact={impactOf(p)} onOpen={() => onOpen(p.id)} />)}
        </ManageSection>
      ) : null}

      {archived.length ? (
        <ManageSection title="Archived" tone="muted" note="Removed from your active list — history kept. Restore anytime.">
          {archived.map((p) => <ManageRow key={p.id} p={p} status="archived" impact={impactOf(p)} onOpen={() => onOpen(p.id)} />)}
        </ManageSection>
      ) : null}
    </div>
  );
}

function ManageSection({ title, note, tone, children }: { title: string; note: string; tone: "pos" | "warn" | "muted"; children: React.ReactNode }) {
  return (
    <section className="mk-mine-sec">
      <div className="mk-mine-head">
        <h2 className={`mk-mine-title ${tone}`}>{title}</h2>
        <span className="mk-mine-note">{note}</span>
      </div>
      <div className="mk-mine-rows">{children}</div>
    </section>
  );
}

function ManageRow({ p, status, impact, onOpen }: { p: Playbook; status: AutopilotStatus; impact: { count: number; mrr: number }; onOpen: () => void }) {
  const meta =
    status === "on"
      ? <>Running on <Mono>{impact.count}</Mono> client{impact.count === 1 ? "" : "s"} · next run tonight</>
      : status === "paused"
        ? <>Paused · would run on <Mono>{impact.count}</Mono> account{impact.count === 1 ? "" : "s"}</>
        : <>Archived · history kept</>;
  return (
    <Card padded className="mk-manage">
      <span className="mk-card-ico" aria-hidden><Icon name={p.icon} /></span>
      <div className="mk-manage-body">
        <button type="button" className="mk-manage-name" onClick={onOpen}>{p.title}</button>
        <span className="mk-manage-meta">{meta}</span>
      </div>
      <div className="mk-manage-actions">
        {status === "on" ? (
          <>
            <Button variant="ghost" className="btn-accent" size="sm" icon={<Icon name="pencil" />} onClick={onOpen}>Edit</Button>
            <Button variant="ghost" className="btn-accent" size="sm" icon={<Icon name="pause" />} onClick={() => { autopilotStore.pause(p.id); toast("Playbook paused", { description: `${p.title} stopped running. Resume anytime.` }); }}>Pause</Button>
          </>
        ) : status === "paused" ? (
          <>
            <Button variant="primary" size="sm" icon={<Icon name="zap" />} onClick={() => { autopilotStore.resume(p.id); toast.success("Playbook live again", { description: `${p.title} is running.` }); }}>Resume</Button>
            <Button variant="ghost" className="btn-accent" size="sm" icon={<Icon name="archive" />} onClick={() => { autopilotStore.archive(p.id); toast("Archived", { description: `${p.title} moved to Archived. History kept.` }); }}>Archive</Button>
          </>
        ) : (
          <Button variant="ghost" className="btn-accent" size="sm" icon={<Icon name="rotate-ccw" />} onClick={() => { autopilotStore.restore(p.id); toast("Restored", { description: `${p.title} is back in Paused — turn it on when ready.` }); }}>Restore</Button>
        )}
      </div>
    </Card>
  );
}

function DraftRow({ recipe, onResume }: { recipe: Recipe; onResume: () => void }) {
  return (
    <Card padded className="mk-manage">
      <span className="mk-card-ico" aria-hidden><Icon name={recipe.icon} /></span>
      <div className="mk-manage-body">
        <button type="button" className="mk-manage-name" onClick={onResume}>{recipe.label}</button>
        <span className="mk-manage-meta">Draft · {recipe.blurb}</span>
      </div>
      <div className="mk-manage-actions">
        <Button variant="primary" size="sm" iconRight={<Icon name="arrow-right" />} onClick={onResume}>Resume setup</Button>
        <Button variant="ghost" className="btn-accent" size="sm" icon={<Icon name="trash-2" />} onClick={() => { clearDraft(recipe.id); toast("Draft discarded", { description: `${recipe.label} setup removed.` }); }}>Discard</Button>
      </div>
    </Card>
  );
}
