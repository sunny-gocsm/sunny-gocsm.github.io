import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge, Card, Button, Icon, Mono, Tabs } from "@gocsm/design-system";
import { toast } from "sonner";
import { PageRibbon } from "@/components/PageRibbon";
import {
  playbooks,
  playbookImpact,
  isNewPlaybook,
  categoryLabel,
  CATEGORIES,
  EFFORT_LABEL,
  type Playbook,
  type PlaybookCategory,
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

// PlaybooksPage — the Playbooks MARKETPLACE. Two tabs (research-backed, app-store model):
//   • Marketplace — browse the catalog. Lead with curated/personalized rows (AI pick,
//     Most deployed, New this week, Quick wins); a 7-category filter for deliberate
//     browsing; NL-ish search as the fallback. Status lives ON each card (Live ✓ / Set up).
//   • Your playbooks — what you've deployed: Live · Paused · Drafts · Archived, with manage.
// Adding ≠ activating: "Set up" opens the detail (preview the bundle) → go live via the
// existing setup flow. Lifecycle is Pause/Unpublish → Archive (soft) — never hard-delete.

type TabId = "marketplace" | "mine";

const fmtMoney = (n: number) => "$" + Math.round(n).toLocaleString();
const fmtCompact = (n: number) =>
  n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, "") + "k" : String(n);

// Marketplace status for a card, derived from the lifecycle store.
function marketStatus(s: AutopilotStatus): "available" | "live" | "paused" {
  if (s === "on") return "live";
  if (s === "paused") return "paused";
  return "available"; // off | archived → re-installable from the catalog
}

export default function PlaybooksPage() {
  const [tab, setTab] = useState<TabId>("marketplace");
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<PlaybookCategory | "all">("all");
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
      {/* Calm browse surface: no KPI metric ribbon here (Stripe/Linear — keep
          numeric density off a discovery view; "Live for you 0" read as a deficit).
          Freshness is carried by the "New this week" rail; the live count lives on
          the "Your playbooks" tab label. */}
      <PageRibbon
        title="Playbooks"
        description="A growing marketplace of ready-made customer-success automations. Turn one on, customize it, done."
        trailing={
          <Button variant="ghost" className="btn-accent" size="sm" icon={<Icon name="plus" />} onClick={() => setActivation({})}>
            Create from scratch
          </Button>
        }
      />

      <Tabs
        tabs={[
          { id: "marketplace", label: "Marketplace" },
          { id: "mine", label: `Your playbooks${mineCount ? ` (${mineCount})` : ""}` },
        ]}
        active={tab}
        onChange={(id) => setTab(id as TabId)}
      />

      {tab === "marketplace" ? (
        <MarketplaceTab
          query={query}
          setQuery={setQuery}
          cat={cat}
          setCat={setCat}
          impactOf={impactOf}
          onOpen={open}
        />
      ) : (
        <YourPlaybooksTab impactOf={impactOf} onOpen={open} onResume={(recipe) => setActivation({ recipe })} onBrowse={() => setTab("marketplace")} />
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

// ─────────────────────────────── Marketplace tab ───────────────────────────────
function MarketplaceTab({
  query,
  setQuery,
  cat,
  setCat,
  impactOf,
  onOpen,
}: {
  query: string;
  setQuery: (v: string) => void;
  cat: PlaybookCategory | "all";
  setCat: (c: PlaybookCategory | "all") => void;
  impactOf: (p: Playbook) => { count: number; mrr: number };
  onOpen: (id: string) => void;
}) {
  const q = query.trim().toLowerCase();
  const browsing = q.length > 0 || cat !== "all";

  const results = useMemo(() => {
    let list = playbooks.slice();
    if (cat !== "all") list = list.filter((p) => p.category === cat);
    if (q) list = list.filter((p) => `${p.title} ${p.subtitle} ${p.problem} ${categoryLabel(p.category)}`.toLowerCase().includes(q));
    return list;
  }, [q, cat]);

  // Curated rows (home view) — ranked, then DEDUPED so each playbook headlines only
  // one row (no repeats across rows). Computed inline so it reflects live lifecycle.
  const notLive = (p: Playbook) => autopilotStore.status(p.id) !== "on";
  const byImpact = (a: Playbook, b: Playbook) => impactOf(b).mrr - impactOf(a).mrr;
  const byUsed = (a: Playbook, b: Playbook) => b.usedByAgencies - a.usedByAgencies;
  const seen = new Set<string>();
  const take = (list: Playbook[], n: number) => {
    const out: Playbook[] = [];
    for (const p of list) {
      if (seen.has(p.id)) continue;
      out.push(p);
      seen.add(p.id);
      if (out.length >= n) break;
    }
    return out;
  };
  // AI pick: the not-live playbook addressing the most at-risk $; fall back to the
  // most-used not-live one so the hero never silently vanishes.
  const aiPick =
    playbooks.slice().filter(notLive).sort(byImpact).find((p) => impactOf(p).mrr > 0) ??
    playbooks.slice().filter(notLive).sort(byUsed)[0];
  if (aiPick) seen.add(aiPick.id);
  const mostUsed = take(playbooks.slice().sort(byUsed), 4);
  const newThisWeek = take(playbooks.filter(isNewPlaybook).slice().sort((a, b) => a.launchedDaysAgo - b.launchedDaysAgo), 4);
  const quickWins = take(playbooks.filter((p) => p.effort !== "custom" && impactOf(p).count > 0).slice().sort(byImpact), 4);

  return (
    <div className="mk-wrap">
      {/* Search (the fallback, not the hero) */}
      <div className="mk-search">
        <Icon name="search" />
        <input
          className="mk-search-input"
          value={query}
          placeholder="Search playbooks — churn, onboarding, renewals…"
          onChange={(e) => setQuery(e.target.value)}
        />
        {query ? (
          <button type="button" className="mk-search-clear" aria-label="Clear" onClick={() => setQuery("")}>
            <Icon name="x" />
          </button>
        ) : null}
      </div>

      {/* Category filter bar */}
      <div className="mk-cats">
        <button type="button" className={`mk-cat${cat === "all" ? " on" : ""}`} onClick={() => setCat("all")}>All</button>
        {CATEGORIES.map((c) => (
          <button key={c.id} type="button" className={`mk-cat${cat === c.id ? " on" : ""}`} onClick={() => setCat(c.id)}>
            <Icon name={c.icon} /> {c.label}
          </button>
        ))}
      </div>

      {browsing ? (
        // Filtered / searched → a flat grid
        results.length === 0 ? (
          <Card padded><p className="mk-empty">Nothing matches{cat !== "all" ? ` in ${categoryLabel(cat as PlaybookCategory)}` : ""}{q ? ` for "${query}"` : ""}. Try another category, or clear the filter.</p></Card>
        ) : (
          <>
            <div className="mk-rowhead"><h2 className="mk-rowtitle">{cat === "all" ? "Results" : categoryLabel(cat as PlaybookCategory)}</h2><span className="mk-rowmeta">{results.length} playbook{results.length === 1 ? "" : "s"}</span></div>
            <div className="mk-grid">
              {results.map((p) => (
                <MarketCard key={p.id} p={p} impact={impactOf(p)} onOpen={() => onOpen(p.id)} />
              ))}
            </div>
          </>
        )
      ) : (
        // Home → curated rows
        <>
          {aiPick ? <AiPickCard p={aiPick} impact={impactOf(aiPick)} onOpen={() => onOpen(aiPick.id)} /> : null}
          <CuratedRow title="Most used" sub="What agencies turn on most" items={mostUsed} impactOf={impactOf} onOpen={onOpen} />
          {newThisWeek.length ? <CuratedRow title="New this week" sub="Fresh from the team" items={newThisWeek} impactOf={impactOf} onOpen={onOpen} /> : null}
          {quickWins.length ? <CuratedRow title="Quick wins for you" sub="Low effort, matches your accounts now" items={quickWins} impactOf={impactOf} onOpen={onOpen} /> : null}
        </>
      )}
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

function CuratedRow({
  title,
  sub,
  items,
  impactOf,
  onOpen,
}: {
  title: string;
  sub: string;
  items: Playbook[];
  impactOf: (p: Playbook) => { count: number; mrr: number };
  onOpen: (id: string) => void;
}) {
  if (!items.length) return null;
  return (
    <section className="mk-row">
      <div className="mk-rowhead">
        <div><h2 className="mk-rowtitle">{title}</h2><span className="mk-rowsub">{sub}</span></div>
      </div>
      <div className="mk-grid">
        {items.map((p) => (
          <MarketCard key={p.id} p={p} impact={impactOf(p)} onOpen={() => onOpen(p.id)} />
        ))}
      </div>
    </section>
  );
}

// One marketplace card — outcome title → one meta line → ONE CTA. Status lives here.
function MarketCard({ p, impact, onOpen, rail }: { p: Playbook; impact: { count: number; mrr: number }; onOpen: () => void; rail?: boolean }) {
  const status = marketStatus(useAutopilotStatus(p.id));
  const isNew = isNewPlaybook(p);
  const cta = status === "live" ? "Manage" : status === "paused" ? "Resume" : "Set up";
  return (
    <Card padded className={`mk-card${rail ? " rail" : ""}`} data-clickable="true" role="button" tabIndex={0} onClick={onOpen} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onOpen()}>
      <div className="mk-card-top">
        <span className="mk-card-ico" aria-hidden><Icon name={p.icon} /></span>
        {status === "live" ? (
          <span className="mk-status live"><Icon name="check" /> Live</span>
        ) : status === "paused" ? (
          <span className="mk-status paused"><Icon name="pause" /> Paused</span>
        ) : isNew ? (
          <span className="mk-status new">New</span>
        ) : p.trending ? (
          <span className="mk-status trend"><Icon name="trending-up" /> Trending</span>
        ) : null}
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
              <span className="mk-card-impact"><span className="at-risk"><Mono>{fmtMoney(impact.mrr)}</Mono> at risk</span> in <Mono>{impact.count}</Mono> of your account{impact.count === 1 ? "" : "s"} now</span>
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
        <p className="mk-empty">No live playbooks yet. Browse the marketplace and turn one on — it takes about a minute.</p>
        <Button variant="primary" icon={<Icon name="arrow-left" />} onClick={onBrowse}>Browse the marketplace</Button>
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
