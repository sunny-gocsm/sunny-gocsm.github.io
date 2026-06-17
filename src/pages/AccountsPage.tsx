import { useMemo, useState } from "react";
import {
  DataTable,
  HealthBadge,
  StageBadge,
  Badge,
  Button,
  Icon,
} from "@/gocsm-ds";
import {
  accounts,
  byUrgency,
  bandLabel,
  type Account,
  type HealthBand,
  type LifecycleStage,
} from "@/fixtures";

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

interface ChipProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function FilterChip({ active, onClick, children }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: "transparent",
        border: 0,
        padding: 0,
        cursor: "pointer",
      }}
    >
      <Badge variant={active ? "blue" : "neutral"} dot={false}>
        {children}
      </Badge>
    </button>
  );
}

interface AccountDrawerProps {
  account: Account;
  onClose: () => void;
}

function AccountDrawer({ account, onClose }: AccountDrawerProps) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        zIndex: 50,
        display: "flex",
        justifyContent: "flex-end",
      }}
    >
      <aside
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(440px, 100%)",
          background: "var(--surface)",
          borderLeft: "1px solid var(--border)",
          padding: "var(--s-6)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--s-4)",
          color: "var(--text)",
          overflowY: "auto",
        }}
      >
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "var(--s-3)",
          }}
        >
          <h2 style={{ font: "var(--t-h3)", margin: 0 }}>{account.name}</h2>
          <Button variant="ghost" size="sm" onClick={onClose} icon={<Icon name="x" />}>
            Close
          </Button>
        </header>
        <p
          style={{
            font: "var(--t-body)",
            color: "var(--text-3, var(--text-2, var(--text)))",
            margin: 0,
          }}
        >
          Account 360 — coming next.
        </p>
      </aside>
    </div>
  );
}

export default function AccountsPage() {
  const [bandFilter, setBandFilter] = useState<Set<HealthBand>>(new Set());
  const [stageFilter, setStageFilter] = useState<Set<LifecycleStage>>(new Set());
  const [renewingSoon, setRenewingSoon] = useState(false);
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);
  const [openAccountId, setOpenAccountId] = useState<string | null>(null);

  const baseRows = useMemo(() => byUrgency(accounts), []);
  const rows = useMemo(() => {
    return baseRows.filter((a) => {
      if (bandFilter.size > 0 && !bandFilter.has(a.healthBand)) return false;
      if (stageFilter.size > 0 && !stageFilter.has(a.lifecycleStage)) return false;
      if (renewingSoon && !(a.renewalInDays > 0 && a.renewalInDays <= 30)) return false;
      return true;
    });
  }, [baseRows, bandFilter, stageFilter, renewingSoon]);

  const toggle = <T,>(set: Set<T>, value: T, setter: (s: Set<T>) => void) => {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    setter(next);
  };

  const total = baseRows.length;
  const openAccount = openAccountId
    ? accounts.find((a) => a.id === openAccountId) ?? null
    : null;

  const toolbar = (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "var(--s-2)",
        alignItems: "center",
      }}
    >
      {BANDS.map((b) => (
        <FilterChip
          key={b}
          active={bandFilter.has(b)}
          onClick={() => toggle(bandFilter, b, setBandFilter)}
        >
          {bandLabel(b)}
        </FilterChip>
      ))}
      <span
        aria-hidden
        style={{
          width: 1,
          height: 18,
          background: "var(--border)",
          margin: "0 var(--s-1)",
        }}
      />
      {STAGES.map((s) => (
        <FilterChip
          key={s}
          active={stageFilter.has(s)}
          onClick={() => toggle(stageFilter, s, setStageFilter)}
        >
          {STAGE_LABEL[s]}
        </FilterChip>
      ))}
      <span
        aria-hidden
        style={{
          width: 1,
          height: 18,
          background: "var(--border)",
          margin: "0 var(--s-1)",
        }}
      />
      <FilterChip
        active={renewingSoon}
        onClick={() => setRenewingSoon((v) => !v)}
      >
        Renewing ≤30 days
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
        onClick={() => {
          // Placeholder for the real PlaybookActivation drawer.
          // eslint-disable-next-line no-console
          console.log("Apply a Playbook to", selectedIds);
        }}
      >
        Apply a Playbook
      </Button>
      <Button variant="ghost" size="sm" onClick={() => setSelectedIds([])}>
        Clear
      </Button>
    </div>
  );

  const columns = [
    { key: "name", header: "Account", field: "name", sortable: true },
    {
      key: "health",
      header: "Health",
      sortable: true,
      sortAccessor: (a: Account) => a.healthScore,
      render: (a: Account) => (
        <HealthBadge band={a.healthBand} label={bandLabel(a.healthBand)} />
      ),
    },
    {
      key: "stage",
      header: "Lifecycle",
      render: (a: Account) => (
        <StageBadge stage={a.lifecycleStage} reactivated={a.reactivated} />
      ),
    },
    {
      key: "pipeline",
      header: "Pipeline",
      render: (a: Account) => a.pipelineStage || "—",
    },
    {
      key: "mrr",
      header: "MRR",
      align: "right" as const,
      mono: true,
      sortable: true,
      sortAccessor: (a: Account) => a.mrr,
      render: (a: Account) => "$" + a.mrr.toLocaleString(),
    },
    {
      key: "renewal",
      header: "Renewal",
      align: "right" as const,
      mono: true,
      sortable: true,
      sortAccessor: (a: Account) => a.renewalInDays,
      render: (a: Account) => "in " + a.renewalInDays + "d",
    },
    {
      key: "lastLogin",
      header: "Last login",
      align: "right" as const,
      mono: true,
      sortable: true,
      sortAccessor: (a: Account) => a.lastLoginDays,
      render: (a: Account) => a.lastLoginDays + "d ago",
    },
    {
      key: "owner",
      header: "Owner",
      field: "owner",
      hideable: true,
      defaultHidden: true,
    },
  ];

  return (
    <main
      style={{
        padding: "var(--s-8) var(--s-6)",
        maxWidth: 1280,
        margin: "0 auto",
        color: "var(--text)",
      }}
    >
      <header style={{ marginBottom: "var(--s-6)" }}>
        <h1 style={{ font: "var(--t-h2)", margin: 0 }}>Accounts</h1>
        <p
          style={{
            font: "var(--t-body)",
            color: "var(--text-3, var(--text-2, var(--text)))",
            margin: "var(--s-1) 0 0",
          }}
        >
          {total} customers
        </p>
      </header>

      <DataTable<Account>
        rows={rows}
        columns={columns}
        getRowId={(a) => a.id}
        selectable
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        toolbar={toolbar}
        selectionActions={selectionActions}
        onRowClick={(a) => setOpenAccountId(a.id)}
        stickyHeader
      />

      {openAccount && (
        <AccountDrawer
          account={openAccount}
          onClose={() => setOpenAccountId(null)}
        />
      )}
    </main>
  );
}
