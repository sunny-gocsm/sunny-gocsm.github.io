import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  DataTable,
  HealthBadge,
  StageBadge,
  Badge,
  Button,
  Icon,
  Mono,
  Delta,
} from "@/gocsm-ds";
import {
  allAccounts,
  byUrgency,
  bandLabel,
  daysUntil,
  lostStickySetups,
  type Account,
  type HealthBand,
  type LifecycleStage,
  type ActivityStatus,
} from "@/fixtures";
import { PlaybookActivationDrawer, type DrawerScope } from "@/components/playbooks/PlaybookActivationDrawer";
import { PageRibbon } from "@/components/PageRibbon";

const accounts = allAccounts();

const BANDS: HealthBand[] = ["thriving", "healthy", "watch", "atrisk"];
const STAGES: LifecycleStage[] = [
  "onboarding",
  "activated",
  "established",
  "lapsing",
  "dormant",
  "churned",
];
const STAGE_LABEL: Record<LifecycleStage, string> = {
  onboarding: "Onboarding",
  activated: "Activated",
  established: "Established",
  lapsing: "Lapsing",
  dormant: "Dormant",
  churned: "Churned",
};

const ACTIVITY: ActivityStatus[] = ["highly", "moderately", "low", "ghosting"];
const ACTIVITY_LABEL: Record<ActivityStatus, string> = {
  highly: "Highly active",
  moderately: "Moderately active",
  low: "Low activity",
  ghosting: "Ghosting",
};

type RenewalWindow = "all" | "0-30" | "31-60" | "61-90";

const ALL_RISK_TAGS = Array.from(
  new Set(accounts.flatMap((a) => a.revenue.riskTags)),
).sort();

const lostStickyIds = new Set(lostStickySetups().map((a) => a.identity.id));

// ----- Granular filter snapshot --------------------------------------------

interface FilterSnapshot {
  bands: HealthBand[];
  stages: LifecycleStage[];
  activity: ActivityStatus[];
  riskTags: string[];
  renewWin: RenewalWindow;
  trackedOnly: boolean;
  setupLostOnly: boolean;
}

const EMPTY: FilterSnapshot = {
  bands: [],
  stages: [],
  activity: [],
  riskTags: [],
  renewWin: "all",
  trackedOnly: false,
  setupLostOnly: false,
};

// ----- Preset Views --------------------------------------------------------

interface ViewDef {
  id: string;
  label: string;
  predicate: (a: Account) => boolean;
}

const PRESET_VIEWS: ViewDef[] = [
  {
    id: "needs",
    label: "Needs attention",
    predicate: (a) =>
      a.status.enabled !== "Disabled" &&
      (a.health.band === "atrisk" ||
        a.health.band === "watch" ||
        lostStickyIds.has(a.identity.id) ||
        (() => {
          const d = daysUntil(a.revenue.renewalDate);
          return d >= 0 && d <= 14;
        })()),
  },
  {
    id: "renewing",
    label: "Renewing soon",
    predicate: (a) => {
      const d = daysUntil(a.revenue.renewalDate);
      return d >= 0 && d <= 30;
    },
  },
  {
    id: "myatrisk",
    label: "My at-risk",
    predicate: (a) => a.status.tracked && a.health.band === "atrisk",
  },
  {
    id: "setuplost",
    label: "Setup lost",
    predicate: (a) => lostStickyIds.has(a.identity.id),
  },
  {
    id: "healthy",
    label: "Healthy",
    predicate: (a) => a.health.band === "thriving" || a.health.band === "healthy",
  },
];

interface SavedView {
  id: string;
  name: string;
  snapshot: FilterSnapshot;
  basePresetId: string | null;
}

const STORAGE_KEY = "gocsm.accounts.savedViews";
const HL_TIP_KEY = "gocsm.accounts.hlTipSeen";

function loadSavedViews(): SavedView[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SavedView[];
  } catch {
    return [];
  }
}

// ----- Avatar --------------------------------------------------------------

function Avatar({ name, initials }: { name: string; initials: string }) {
  return (
    <span
      aria-hidden
      title={name}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 28,
        height: 28,
        borderRadius: 8,
        background: "var(--surface-2)",
        color: "var(--text-2, var(--text))",
        font: "var(--t-meta)",
        fontWeight: 600,
        flex: "0 0 auto",
      }}
    >
      {initials}
    </span>
  );
}

// ----- View chip -----------------------------------------------------------

function ViewChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: active ? "var(--blue-2)" : "var(--surface)",
        color: active ? "var(--blue-7)" : "var(--text-2, var(--text))",
        border: `1px solid ${active ? "var(--blue-7)" : "var(--border)"}`,
        padding: "6px 12px",
        borderRadius: 999,
        cursor: "pointer",
        font: "var(--t-body)",
        fontWeight: active ? 600 : 500,
        lineHeight: 1.2,
      }}
    >
      {children}
    </button>
  );
}

// ----- Generic filter chip (for "More filters" disclosure) ----------------

interface ChipProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  variant?: "neutral" | "blue" | "danger";
}
function FilterChip({ active, onClick, children, variant = "blue" }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ background: "transparent", border: 0, padding: 0, cursor: "pointer" }}
    >
      <Badge variant={active ? variant : "neutral"} dot={false}>
        {children}
      </Badge>
    </button>
  );
}

// ----- Helpers --------------------------------------------------------------

const MONTH = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function fmtDate(iso: string) {
  const d = new Date(iso);
  return `${MONTH[d.getUTCMonth()]} ${d.getUTCDate()}`;
}
function adoptionPct(a: Account): number {
  const { features } = a.adoption;
  if (!features.length) return 0;
  const total = features.reduce((s, f) => s + f.assetCount, 0);
  const active = features.reduce((s, f) => s + f.activeAssetCount, 0);
  return total ? Math.round((active / total) * 100) : 0;
}

// ----- Page ----------------------------------------------------------------

export default function AccountsPage() {
  const navigate = useNavigate();

  // Active view: preset id, saved id, or "custom" once user touches granular filters.
  const [activeViewId, setActiveViewId] = useState<string>("needs");
  const [showMore, setShowMore] = useState(false);

  const [bandFilter, setBandFilter] = useState<Set<HealthBand>>(new Set());
  const [stageFilter, setStageFilter] = useState<Set<LifecycleStage>>(new Set());
  const [activityFilter, setActivityFilter] = useState<Set<ActivityStatus>>(new Set());
  const [riskTagFilter, setRiskTagFilter] = useState<Set<string>>(new Set());
  const [renewWin, setRenewWin] = useState<RenewalWindow>("all");
  const [trackedOnly, setTrackedOnly] = useState(false);
  const [setupLostOnly, setSetupLostOnly] = useState(false);

  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);
  const [drawerScope, setDrawerScope] = useState<DrawerScope | null>(null);
  const [hiddenColumns, setHiddenColumns] = useState<string[]>([
    "adoption",
    "feedback",
    "owner",
    "csm",
  ]);

  const [savedViews, setSavedViews] = useState<SavedView[]>(() => loadSavedViews());
  const [hlTipOpen, setHlTipOpen] = useState<boolean>(() => {
    try { return !localStorage.getItem(HL_TIP_KEY); } catch { return false; }
  });

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(savedViews)); } catch { /* noop */ }
  }, [savedViews]);

  // Mark active view as custom when a granular filter is touched.
  const markCustom = () => {
    if (activeViewId !== "custom") setActiveViewId("custom");
  };

  const toggleBand = (v: HealthBand) => {
    markCustom();
    const next = new Set(bandFilter);
    next.has(v) ? next.delete(v) : next.add(v);
    setBandFilter(next);
  };
  const toggleStage = (v: LifecycleStage) => {
    markCustom();
    const next = new Set(stageFilter);
    next.has(v) ? next.delete(v) : next.add(v);
    setStageFilter(next);
  };
  const toggleActivity = (v: ActivityStatus) => {
    markCustom();
    const next = new Set(activityFilter);
    next.has(v) ? next.delete(v) : next.add(v);
    setActivityFilter(next);
  };
  const toggleRisk = (v: string) => {
    markCustom();
    const next = new Set(riskTagFilter);
    next.has(v) ? next.delete(v) : next.add(v);
    setRiskTagFilter(next);
  };

  const baseRows = useMemo(() => byUrgency(accounts), []);

  const granularFilter = (a: Account) => {
    if (bandFilter.size && !bandFilter.has(a.health.band)) return false;
    if (stageFilter.size && !stageFilter.has(a.lifecycle.stage)) return false;
    if (activityFilter.size && !activityFilter.has(a.login.activityStatus)) return false;
    if (riskTagFilter.size && !a.revenue.riskTags.some((t) => riskTagFilter.has(t))) return false;
    if (renewWin !== "all") {
      const d = daysUntil(a.revenue.renewalDate);
      const [lo, hi] = renewWin.split("-").map(Number);
      if (!(d >= lo && d <= hi)) return false;
    }
    if (trackedOnly && !a.status.tracked) return false;
    if (setupLostOnly && !lostStickyIds.has(a.identity.id)) return false;
    return true;
  };

  const rows = useMemo(() => {
    const preset = PRESET_VIEWS.find((v) => v.id === activeViewId);
    const saved = savedViews.find((v) => v.id === activeViewId);
    return baseRows.filter((a) => {
      if (preset) return preset.predicate(a);
      if (saved) {
        const s = saved.snapshot;
        if (s.bands.length && !s.bands.includes(a.health.band)) return false;
        if (s.stages.length && !s.stages.includes(a.lifecycle.stage)) return false;
        if (s.activity.length && !s.activity.includes(a.login.activityStatus)) return false;
        if (s.riskTags.length && !a.revenue.riskTags.some((t) => s.riskTags.includes(t))) return false;
        if (s.renewWin !== "all") {
          const d = daysUntil(a.revenue.renewalDate);
          const [lo, hi] = s.renewWin.split("-").map(Number);
          if (!(d >= lo && d <= hi)) return false;
        }
        if (s.trackedOnly && !a.status.tracked) return false;
        if (s.setupLostOnly && !lostStickyIds.has(a.identity.id)) return false;
        // If saved view was built on top of a preset, intersect with that preset.
        const base = saved.basePresetId
          ? PRESET_VIEWS.find((v) => v.id === saved.basePresetId)
          : null;
        if (base && !base.predicate(a)) return false;
        return true;
      }
      return granularFilter(a);
    });
  }, [
    baseRows,
    activeViewId,
    savedViews,
    bandFilter,
    stageFilter,
    activityFilter,
    riskTagFilter,
    renewWin,
    trackedOnly,
    setupLostOnly,
  ]);

  const pickView = (id: string) => {
    setActiveViewId(id);
    // Reset granular filters when switching to a preset/saved view.
    setBandFilter(new Set());
    setStageFilter(new Set());
    setActivityFilter(new Set());
    setRiskTagFilter(new Set());
    setRenewWin("all");
    setTrackedOnly(false);
    setSetupLostOnly(false);
  };

  const handleSaveView = () => {
    const name = window.prompt("Name this view");
    if (!name?.trim()) return;
    const snapshot: FilterSnapshot =
      activeViewId === "custom"
        ? {
            bands: [...bandFilter],
            stages: [...stageFilter],
            activity: [...activityFilter],
            riskTags: [...riskTagFilter],
            renewWin,
            trackedOnly,
            setupLostOnly,
          }
        : EMPTY;
    const basePresetId =
      activeViewId !== "custom" && PRESET_VIEWS.some((v) => v.id === activeViewId)
        ? activeViewId
        : null;
    const id = `saved-${Date.now()}`;
    setSavedViews((prev) => [...prev, { id, name: name.trim(), snapshot, basePresetId }]);
    setActiveViewId(id);
  };

  const removeSavedView = (id: string) => {
    setSavedViews((prev) => prev.filter((v) => v.id !== id));
    if (activeViewId === id) setActiveViewId("needs");
  };

  // ----- Toolbar ----------------------------------------------------------

  const toolbar = (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-3)", width: "100%" }}>
      {/* Views row */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--s-2)", alignItems: "center" }}>
        <span style={{ font: "var(--t-meta)", textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--text-3, var(--text))", marginRight: "var(--s-1)" }}>
          View
        </span>
        {PRESET_VIEWS.map((v) => (
          <ViewChip key={v.id} active={activeViewId === v.id} onClick={() => pickView(v.id)}>
            {v.label}
          </ViewChip>
        ))}
        {savedViews.map((v) => (
          <span key={v.id} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <ViewChip active={activeViewId === v.id} onClick={() => pickView(v.id)}>
              ★ {v.name}
            </ViewChip>
            <button
              type="button"
              onClick={() => removeSavedView(v.id)}
              title="Remove saved view"
              style={{
                background: "transparent",
                border: 0,
                color: "var(--text-3, var(--text))",
                cursor: "pointer",
                padding: 2,
                lineHeight: 1,
              }}
              aria-label={`Remove ${v.name}`}
            >
              ×
            </button>
          </span>
        ))}
        {activeViewId === "custom" ? (
          <Badge variant="warn" dot={false}>Custom</Badge>
        ) : null}
        <span style={{ flex: 1 }} />
        <Button variant="ghost" size="sm" icon={<Icon name="bookmark" />} onClick={handleSaveView}>
          Save this view
        </Button>
        <Button
          variant="ghost"
          size="sm"
          icon={<Icon name={showMore ? "chevron-up" : "sliders-horizontal"} />}
          onClick={() => setShowMore((v) => !v)}
        >
          More filters
        </Button>
      </div>

      {/* Disclosed granular filters */}
      {showMore ? (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "var(--s-2)",
            alignItems: "center",
            padding: "var(--s-3)",
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            borderRadius: "var(--r-md, 8px)",
          }}
        >
          <span style={{ font: "var(--t-meta)", color: "var(--text-3, var(--text))" }}>Health</span>
          {BANDS.map((b) => (
            <FilterChip key={b} active={bandFilter.has(b)} onClick={() => toggleBand(b)}>
              {bandLabel(b)}
            </FilterChip>
          ))}
          <span style={{ width: 1, height: 18, background: "var(--border)", margin: "0 var(--s-1)" }} />
          <span style={{ font: "var(--t-meta)", color: "var(--text-3, var(--text))" }}>Lifecycle</span>
          {STAGES.map((s) => (
            <FilterChip key={s} active={stageFilter.has(s)} onClick={() => toggleStage(s)}>
              {STAGE_LABEL[s]}
            </FilterChip>
          ))}
          <span style={{ width: 1, height: 18, background: "var(--border)", margin: "0 var(--s-1)" }} />
          <span style={{ font: "var(--t-meta)", color: "var(--text-3, var(--text))" }}>Activity</span>
          {ACTIVITY.map((a) => (
            <FilterChip key={a} active={activityFilter.has(a)} onClick={() => toggleActivity(a)}>
              {ACTIVITY_LABEL[a]}
            </FilterChip>
          ))}
          {ALL_RISK_TAGS.length ? (
            <>
              <span style={{ width: 1, height: 18, background: "var(--border)", margin: "0 var(--s-1)" }} />
              <span style={{ font: "var(--t-meta)", color: "var(--text-3, var(--text))" }}>Risk tags</span>
              {ALL_RISK_TAGS.map((t) => (
                <FilterChip
                  key={t}
                  active={riskTagFilter.has(t)}
                  onClick={() => toggleRisk(t)}
                  variant="danger"
                >
                  {t}
                </FilterChip>
              ))}
            </>
          ) : null}
          <span style={{ width: 1, height: 18, background: "var(--border)", margin: "0 var(--s-1)" }} />
          <span style={{ font: "var(--t-meta)", color: "var(--text-3, var(--text))" }}>Renewal</span>
          {(["all", "0-30", "31-60", "61-90"] as RenewalWindow[]).map((w) => (
            <FilterChip
              key={w}
              active={renewWin === w}
              onClick={() => { markCustom(); setRenewWin(w); }}
            >
              {w === "all" ? "Any" : `${w}d`}
            </FilterChip>
          ))}
          <span style={{ width: 1, height: 18, background: "var(--border)", margin: "0 var(--s-1)" }} />
          <FilterChip active={trackedOnly} onClick={() => { markCustom(); setTrackedOnly((v) => !v); }}>
            Tracked only
          </FilterChip>
          <FilterChip
            active={setupLostOnly}
            onClick={() => { markCustom(); setSetupLostOnly((v) => !v); }}
            variant="danger"
          >
            ⚠ Setup lost
          </FilterChip>
        </div>
      ) : null}
    </div>
  );

  const selectionActions = (
    <div style={{ display: "flex", gap: "var(--s-2)", alignItems: "center" }}>
      <span style={{ font: "var(--t-meta)", color: "var(--text-2, var(--text))" }}>
        {selectedIds.length} selected
      </span>
      <Button
        variant="primary"
        size="sm"
        icon={<Icon name="book-open" />}
        onClick={() =>
          setDrawerScope({
            kind: "accounts",
            accountIds: selectedIds.map(String),
          })
        }
      >
        Apply a Playbook
      </Button>
      <Button variant="ghost" size="sm" onClick={() => setSelectedIds([])}>
        Clear
      </Button>
    </div>
  );

  // ----- HL pipeline header (with one-time hint) --------------------------

  const HLGlyph = () => (
    <span
      aria-hidden
      title="HighLevel"
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 16,
        height: 16,
        borderRadius: 4,
        background: "var(--n-3)",
        color: "var(--n-9)",
        font: "var(--t-meta)",
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: 0,
      }}
    >
      HL
    </span>
  );

  const dismissHlTip = () => {
    try { localStorage.setItem(HL_TIP_KEY, "1"); } catch { /* noop */ }
    setHlTipOpen(false);
  };

  const PipelineHeader = (
    <span style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: 6 }}>
      <span>Pipeline</span>
      <HLGlyph />
      <span style={{ color: "var(--text-3, var(--text))", font: "var(--t-meta)" }}>(HighLevel)</span>
      {hlTipOpen ? (
        <span
          role="tooltip"
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            zIndex: 5,
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            padding: "var(--s-2) var(--s-3)",
            boxShadow: "var(--shadow-md, 0 4px 12px rgba(0,0,0,0.08))",
            font: "var(--t-meta)",
            color: "var(--text-2, var(--text))",
            width: 240,
            whiteSpace: "normal",
            lineHeight: 1.4,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          Mirrors the pipeline stage from HighLevel — read-only here.
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); dismissHlTip(); }}
            style={{
              display: "block",
              marginTop: 6,
              background: "transparent",
              border: 0,
              color: "var(--blue-7)",
              cursor: "pointer",
              padding: 0,
              font: "var(--t-meta)",
              fontWeight: 600,
            }}
          >
            Got it
          </button>
        </span>
      ) : null}
    </span>
  );

  // ----- Columns ----------------------------------------------------------

  const columns = [
    {
      key: "name",
      header: "Account",
      sortable: true,
      sortAccessor: (a: Account) => a.identity.name,
      render: (a: Account) => (
        <div style={{ display: "flex", alignItems: "center", gap: "var(--s-2)", minWidth: 0 }}>
          <Avatar name={a.identity.name} initials={a.identity.avatar} />
          <span style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
            <span style={{ fontWeight: 500, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {a.identity.name}
            </span>
            <span style={{ font: "var(--t-meta)", color: "var(--text-3, var(--text))" }}>
              {a.identity.industry}
              {a.identity.isNonSaaS ? " · non-SaaS" : ""}
            </span>
          </span>
          {lostStickyIds.has(a.identity.id) ? (
            <span style={{ marginLeft: "var(--s-1)" }}>
              <Badge variant="danger" dot={false} title="Lost a sticky setup recently">
                ⚠ Setup lost
              </Badge>
            </span>
          ) : null}
        </div>
      ),
    },
    {
      key: "health",
      header: "Health",
      sortable: true,
      sortAccessor: (a: Account) => a.health.score,
      render: (a: Account) =>
        a.status.enabled === "Disabled" ? (
          <span style={{ color: "var(--text-3, var(--text))" }}>—</span>
        ) : (
          <HealthBadge band={a.health.band} label={bandLabel(a.health.band)} />
        ),
    },
    {
      key: "stage",
      header: "Lifecycle",
      sortable: true,
      sortAccessor: (a: Account) => STAGES.indexOf(a.lifecycle.stage),
      render: (a: Account) => (
        <StageBadge stage={a.lifecycle.stage} reactivated={a.lifecycle.reactivated} />
      ),
    },
    {
      key: "pipeline",
      header: PipelineHeader,
      headerTitle: "Mirrors the pipeline stage from your HighLevel sub-account.",
      sortable: true,
      sortAccessor: (a: Account) => a.pipeline.stage || "",
      render: (a: Account) =>
        a.pipeline.stage ? (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <HLGlyph />
            <Badge variant="neutral" dot={false} title="From HighLevel">
              {a.pipeline.stage}
            </Badge>
          </span>
        ) : (
          <span style={{ color: "var(--text-3, var(--text))" }}>—</span>
        ),
    },
    {
      key: "mrr",
      header: "MRR",
      align: "right" as const,
      mono: true,
      sortable: true,
      sortAccessor: (a: Account) => a.revenue.mrr,
      render: (a: Account) => "$" + Math.round(a.revenue.mrr).toLocaleString(),
    },
    {
      key: "renewal",
      header: "Renewal",
      align: "right" as const,
      sortable: true,
      sortAccessor: (a: Account) => daysUntil(a.revenue.renewalDate),
      render: (a: Account) => {
        const d = daysUntil(a.revenue.renewalDate);
        return (
          <span style={{ display: "inline-flex", flexDirection: "column", alignItems: "flex-end", lineHeight: 1.2 }}>
            <span>{fmtDate(a.revenue.renewalDate)}</span>
            <span style={{ font: "var(--t-meta)", color: d >= 0 && d <= 14 ? "var(--red-7, var(--text))" : "var(--text-3, var(--text))" }}>
              {d >= 0 ? `${d}d` : `${d}d`}
            </span>
          </span>
        );
      },
    },
    {
      key: "lastLogin",
      header: "Last login",
      align: "right" as const,
      sortable: true,
      sortAccessor: (a: Account) => a.login.lastLoginDaysAgo,
      render: (a: Account) => a.login.lastLoginDaysAgo + "d ago",
    },
    {
      key: "adoption",
      header: "Adoption",
      align: "right" as const,
      mono: true,
      sortable: true,
      hideable: true,
      defaultHidden: true,
      sortAccessor: (a: Account) => adoptionPct(a),
      render: (a: Account) => {
        const pct = adoptionPct(a);
        return (
          <span style={{ display: "inline-flex", alignItems: "center", gap: "var(--s-1)" }}>
            <Mono>{pct}%</Mono>
            {a.health.delta !== 0 ? (
              <Delta
                value={`${a.health.delta > 0 ? "+" : ""}${a.health.delta}`}
                direction={a.health.delta > 0 ? "up" : "down"}
              />
            ) : null}
          </span>
        );
      },
    },
    {
      key: "feedback",
      header: "NPS",
      align: "right" as const,
      mono: true,
      sortable: true,
      hideable: true,
      defaultHidden: true,
      sortAccessor: (a: Account) => a.feedback.npsScore,
      render: (a: Account) =>
        a.feedback.npsScore ? <Mono>{a.feedback.npsScore}</Mono> : <span style={{ color: "var(--text-3, var(--text))" }}>—</span>,
    },
    {
      key: "owner",
      header: "Owner",
      sortable: true,
      hideable: true,
      defaultHidden: true,
      sortAccessor: (a: Account) => a.ownership.owner,
      render: (a: Account) => a.ownership.owner,
    },
    {
      key: "csm",
      header: "CSM",
      sortable: true,
      hideable: true,
      defaultHidden: true,
      sortAccessor: (a: Account) => a.ownership.assignedCSM,
      render: (a: Account) => a.ownership.assignedCSM,
    },
  ];

  return (
    <main
      style={{
        padding: "var(--s-8) var(--s-6)",
        maxWidth: 1320,
        margin: "0 auto",
        color: "var(--text)",
      }}
    >
      <div style={{ marginBottom: "var(--s-6)" }}>
        <PageRibbon
          title="Accounts"
          description="Every sub-account in your book. Pick a View, multi-select, and apply a Playbook."
          kpis={[
            { label: "Customers", value: <Mono>{baseRows.length}</Mono> },
            { label: "Showing", value: <Mono>{rows.length}</Mono> },
            { label: "Sort", value: "by urgency" },
          ]}
        />
      </div>

      <DataTable<Account>
        rows={rows}
        columns={columns}
        getRowId={(a) => a.identity.id}
        selectable
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        toolbar={toolbar}
        selectionActions={selectionActions}
        onRowClick={(a) => navigate(`/accounts/${a.identity.id}`)}
        stickyHeader
        showColumnChooser
        hiddenColumns={hiddenColumns}
        onHiddenColumnsChange={setHiddenColumns}
      />

      <PlaybookActivationDrawer
        open={!!drawerScope}
        scope={drawerScope}
        accounts={accounts}
        onClose={() => setDrawerScope((null as unknown) as DrawerScope | null)}
      />
    </main>
  );
}
