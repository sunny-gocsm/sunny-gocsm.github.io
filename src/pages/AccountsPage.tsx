import { useMemo, useState } from "react";
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

// Derived risk-tag universe (no hardcoded counts).
const ALL_RISK_TAGS = Array.from(
  new Set(accounts.flatMap((a) => a.revenue.riskTags)),
).sort();

// Set of accounts that recently lost a sticky setup — used for the row flag
// and the "at-risk setup lost" filter.
const lostStickyIds = new Set(lostStickySetups().map((a) => a.identity.id));

// ----- Filter chip ----------------------------------------------------------

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

// ----- Avatar ---------------------------------------------------------------

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

// (Account 360 lives at /accounts/:id — row click navigates there.)


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

  const baseRows = useMemo(() => byUrgency(accounts), []);
  const rows = useMemo(
    () =>
      baseRows.filter((a) => {
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
      }),
    [
      baseRows,
      bandFilter,
      stageFilter,
      activityFilter,
      riskTagFilter,
      renewWin,
      trackedOnly,
      setupLostOnly,
    ],
  );

  const toggle = <T,>(set: Set<T>, value: T, setter: (s: Set<T>) => void) => {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    setter(next);
  };




  // ----- Toolbar (filter chips) -------------------------------------------

  const Divider = () => (
    <span
      aria-hidden
      style={{ width: 1, height: 18, background: "var(--border)", margin: "0 var(--s-1)" }}
    />
  );

  const toolbar = (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--s-2)", alignItems: "center" }}>
      {BANDS.map((b) => (
        <FilterChip
          key={b}
          active={bandFilter.has(b)}
          onClick={() => toggle(bandFilter, b, setBandFilter)}
        >
          {bandLabel(b)}
        </FilterChip>
      ))}
      <Divider />
      {STAGES.map((s) => (
        <FilterChip
          key={s}
          active={stageFilter.has(s)}
          onClick={() => toggle(stageFilter, s, setStageFilter)}
        >
          {STAGE_LABEL[s]}
        </FilterChip>
      ))}
      <Divider />
      {ACTIVITY.map((a) => (
        <FilterChip
          key={a}
          active={activityFilter.has(a)}
          onClick={() => toggle(activityFilter, a, setActivityFilter)}
        >
          {ACTIVITY_LABEL[a]}
        </FilterChip>
      ))}
      {ALL_RISK_TAGS.length ? (
        <>
          <Divider />
          {ALL_RISK_TAGS.map((t) => (
            <FilterChip
              key={t}
              active={riskTagFilter.has(t)}
              onClick={() => toggle(riskTagFilter, t, setRiskTagFilter)}
              variant="danger"
            >
              {t}
            </FilterChip>
          ))}
        </>
      ) : null}
      <Divider />
      {(["all", "0-30", "31-60", "61-90"] as RenewalWindow[]).map((w) => (
        <FilterChip
          key={w}
          active={renewWin === w}
          onClick={() => setRenewWin(w)}
        >
          {w === "all" ? "Any renewal" : `Renews ${w}d`}
        </FilterChip>
      ))}
      <Divider />
      <FilterChip active={trackedOnly} onClick={() => setTrackedOnly((v) => !v)}>
        Tracked only
      </FilterChip>
      <FilterChip
        active={setupLostOnly}
        onClick={() => setSetupLostOnly((v) => !v)}
        variant="danger"
      >
        ⚠ Setup lost
      </FilterChip>
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
      header: "Pipeline",
      headerTitle: "Native HighLevel pipeline stage (read-through)",
      sortable: true,
      sortAccessor: (a: Account) => a.pipeline.stage || "",
      render: (a: Account) =>
        a.pipeline.stage ? (
          <Badge variant="neutral" dot={false} title="From HighLevel">
            {a.pipeline.stage}
          </Badge>
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
          description="Every sub-account in your book. Filter, multi-select, and apply a Playbook."
          kpis={[
            { label: "Customers", value: <Mono>{baseRows.length}</Mono> },
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
        onClose={() => setDrawerScope(null)}
      />
    </main>
  );
}
