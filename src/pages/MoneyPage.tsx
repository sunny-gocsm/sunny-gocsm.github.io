// Money — Revenue Intelligence portfolio surface.
// Three tabs: Overview (KPIs + 3 charts), Accounts (revenue DataTable),
// Churn (lost-revenue analysis). KPI cards filter the inner Accounts tab.
// Each cohort can also "send to Today" as a problem cohort.
//
// All chart colors come from --viz tokens (never band colors).

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
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
  DataTable,
  Delta,
  Icon,
  MetricCard,
  Mono,
  Tabs,
} from "@/gocsm-ds";
import { PageRibbon } from "@/components/PageRibbon";
import {
  agencyRollup,
  allAccounts,
  byUrgency,
  daysUntil,
  failedPayments,
  type Account,
} from "@/fixtures";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const fmtMoney = (n: number) => "$" + Math.round(n).toLocaleString();
const MONTH = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const fmtShort = (iso: string) => {
  const d = new Date(iso);
  return `${MONTH[d.getUTCMonth()]} ${d.getUTCDate()}`;
};

// ---------------------------------------------------------------------------
// Cohort selectors
// ---------------------------------------------------------------------------
const accounts = allAccounts();
const liveOnly = (a: Account) =>
  a.status.enabled === "Enabled" && a.lifecycle.stage !== "churned";

const live = accounts.filter(liveOnly);

const topSpenders = (n = 10) =>
  live.slice().sort((a, b) => b.revenue.mrr - a.revenue.mrr).slice(0, n);

const leastSpenders = (n = 10) =>
  live.slice().sort((a, b) => a.revenue.mrr - b.revenue.mrr).slice(0, n);

const nonSaaS = () => live.filter((a) => a.identity.isNonSaaS);

const renewsIn = (lo: number, hi: number) =>
  live.filter((a) => {
    const d = daysUntil(a.revenue.renewalDate);
    return d >= lo && d <= hi;
  });

const planChangesIn = (kind: "upgrade" | "downgrade", days = 30) =>
  live.filter((a) =>
    a.revenue.planChanges.some(
      (c) =>
        c.type === kind &&
        Math.abs(daysUntil(c.date)) <= days &&
        daysUntil(c.date) <= 0,
    ),
  );

const churnedAccounts = () =>
  accounts.filter((a) => a.lifecycle.stage === "churned");

// ---------------------------------------------------------------------------
// Chart series
// ---------------------------------------------------------------------------
function dailySeries(totalMrr: number, totalCost: number) {
  // 30-day synthetic series — deterministic noise based on day index.
  const out: { day: string; mrr: number; cost: number; margin: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const dayMs = 86_400_000;
    const iso = new Date(Date.now() - i * dayMs).toISOString();
    // gentle wave + slow drift so it actually reads as a chart
    const wave = 1 + Math.sin(i / 4) * 0.04 + (29 - i) * 0.001;
    const mrr = Math.round((totalMrr / 30) * wave);
    const cost = Math.round((totalCost / 30) * (1 + Math.sin(i / 5) * 0.06));
    out.push({ day: fmtShort(iso), mrr, cost, margin: Math.max(0, mrr - cost) });
  }
  return out;
}

function revenueByPlan() {
  const map = new Map<string, number>();
  for (const a of live) {
    map.set(a.identity.plan, (map.get(a.identity.plan) ?? 0) + a.revenue.mrr);
  }
  return Array.from(map.entries())
    .map(([plan, mrr]) => ({ plan, mrr: Math.round(mrr) }))
    .sort((a, b) => b.mrr - a.mrr);
}

function revenueByProduct() {
  // SaaS subscription = sum of MRR.
  // Wallet spend (Email/SMS/WhatsApp/Premium actions) ≈ walletSpend30d, split with
  // a fixed editorial mix — labelled as a projection.
  const saas = live.reduce((s, a) => s + a.revenue.mrr, 0);
  const wallet30 = live.reduce((s, a) => s + (a.revenue.walletSpend30d || 0), 0);
  const mix = { Email: 0.32, SMS: 0.41, WhatsApp: 0.14, "Premium actions": 0.13 };
  const rows: { product: string; mrr: number }[] = [
    { product: "SaaS subscription", mrr: Math.round(saas) },
  ];
  for (const [k, w] of Object.entries(mix)) {
    rows.push({ product: k, mrr: Math.round(wallet30 * w) });
  }
  return rows;
}

// ---------------------------------------------------------------------------
// KPI definitions (cohort + filter)
// ---------------------------------------------------------------------------
type FilterKey =
  | "all"
  | "top"
  | "least"
  | "failed"
  | "renew030"
  | "renew3160"
  | "nonsaas"
  | "upgrades"
  | "downgrades"
  | "churned";

interface Kpi {
  key: FilterKey;
  label: string;
  icon: string;
  accent?: "neg" | "pos" | "info";
  rows: Account[];
  /** Optional override formatter for the metric value. */
  format?: (rows: Account[]) => React.ReactNode;
  /** Delta tone — Money inverts churn/cost. */
  deltaDir?: "up" | "down" | "flat" | "bad-up" | "good-down";
  deltaValue?: string;
  context?: string;
}

function useKpis(): Kpi[] {
  const failed = failedPayments();
  const renew030 = renewsIn(0, 30);
  const renew3160 = renewsIn(31, 60);
  const nons = nonSaaS();
  const ups = planChangesIn("upgrade");
  const downs = planChangesIn("downgrade");
  const churned = churnedAccounts();
  const top = topSpenders(10);
  const least = leastSpenders(10);

  const lostMrr = churned.reduce((s, a) => {
    const c = a.revenue.planChanges.find((p) => p.type === "churn");
    return s + Math.abs(c?.mrrImpact ?? a.revenue.mrr);
  }, 0);
  const failedAmt = failed.reduce(
    (s, a) =>
      s +
      a.revenue.paymentAttempts
        .filter((p) => p.status === "failed")
        .reduce((sa, p) => sa + p.amount, 0),
    0,
  );

  return [
    {
      key: "top",
      label: "Top 10 spenders",
      icon: "trending-up",
      rows: top,
      format: () => <Mono>{fmtMoney(top.reduce((s, a) => s + a.revenue.mrr, 0))}</Mono>,
      deltaValue: `${top.length} accounts`,
      deltaDir: "flat",
      context: "combined MRR",
    },
    {
      key: "least",
      label: "Bottom 10 spenders",
      icon: "trending-down",
      rows: least,
      format: () => <Mono>{fmtMoney(least.reduce((s, a) => s + a.revenue.mrr, 0))}</Mono>,
      deltaValue: `${least.length} accounts`,
      deltaDir: "flat",
      context: "combined MRR",
    },
    {
      key: "failed",
      label: "Failed payments",
      icon: "credit-card",
      accent: "neg",
      rows: failed,
      format: () => <Mono>{failed.length}</Mono>,
      deltaValue: fmtMoney(failedAmt),
      deltaDir: "bad-up",
      context: "exposure",
    },
    {
      key: "renew030",
      label: "Renewals · 0–30d",
      icon: "calendar-clock",
      rows: renew030,
      format: () => <Mono>{renew030.length}</Mono>,
      deltaValue: fmtMoney(renew030.reduce((s, a) => s + a.revenue.mrr, 0)),
      deltaDir: "flat",
      context: "MRR up for renewal",
    },
    {
      key: "renew3160",
      label: "Renewals · 31–60d",
      icon: "calendar",
      rows: renew3160,
      format: () => <Mono>{renew3160.length}</Mono>,
      deltaValue: fmtMoney(renew3160.reduce((s, a) => s + a.revenue.mrr, 0)),
      deltaDir: "flat",
      context: "MRR in the next window",
    },
    {
      key: "nonsaas",
      label: "Non-SaaS accounts",
      icon: "user",
      rows: nons,
      format: () => <Mono>{nons.length}</Mono>,
      deltaValue: fmtMoney(nons.reduce((s, a) => s + a.revenue.mrr, 0)),
      deltaDir: "flat",
      context: "wallet-only / non-recurring",
    },
    {
      key: "upgrades",
      label: "Upgrades · 30d",
      icon: "arrow-up-right",
      rows: ups,
      format: () => <Mono>{ups.length}</Mono>,
      deltaValue: fmtMoney(
        ups.reduce(
          (s, a) =>
            s +
            a.revenue.planChanges
              .filter((p) => p.type === "upgrade")
              .reduce((sa, p) => sa + p.mrrImpact, 0),
          0,
        ),
      ),
      deltaDir: "up",
      context: "MRR added",
    },
    {
      key: "downgrades",
      label: "Downgrades · 30d",
      icon: "arrow-down-right",
      accent: "neg",
      rows: downs,
      format: () => <Mono>{downs.length}</Mono>,
      deltaValue: fmtMoney(
        Math.abs(
          downs.reduce(
            (s, a) =>
              s +
              a.revenue.planChanges
                .filter((p) => p.type === "downgrade")
                .reduce((sa, p) => sa + p.mrrImpact, 0),
            0,
          ),
        ),
      ),
      deltaDir: "bad-up",
      context: "MRR lost",
    },
    {
      key: "churned",
      label: "Churned (lifetime)",
      icon: "user-minus",
      accent: "neg",
      rows: churned,
      format: () => <Mono>{churned.length}</Mono>,
      deltaValue: fmtMoney(lostMrr),
      deltaDir: "bad-up",
      context: "MRR lost",
    },
  ];
}

// ---------------------------------------------------------------------------
// Charts
// ---------------------------------------------------------------------------
function DailyChart() {
  const totals = agencyRollup();
  const totalCost = live.reduce((s, a) => s + a.revenue.totalCost, 0);
  const data = useMemo(() => dailySeries(totals.mrr, totalCost), [totals.mrr, totalCost]);
  return (
    <Card padded>
      <header style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "var(--s-2)" }}>
        <h3 style={{ font: "var(--t-h3)", margin: 0 }}>Daily revenue, cost, and margin</h3>
        <ConfTag basis="projection" detail="Estimate — limited data" />
      </header>
      <div style={{ width: "100%", height: 240 }}>
        <ResponsiveContainer>
          <AreaChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="mrrDay" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--viz-1)" stopOpacity={0.30} />
                <stop offset="100%" stopColor="var(--viz-1)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--viz-grid)" vertical={false} />
            <XAxis dataKey="day" stroke="var(--viz-axis)" fontSize={11} interval={4} />
            <YAxis stroke="var(--viz-axis)" fontSize={11} width={56} tickFormatter={(v) => "$" + v} />
            <Tooltip
              contentStyle={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                color: "var(--text)",
                fontSize: 12,
              }}
              formatter={(v: number) => fmtMoney(v)}
            />
            <Area dataKey="mrr" stroke="var(--viz-1)" fill="url(#mrrDay)" strokeWidth={2} />
            <Line dataKey="cost" stroke="var(--viz-4)" strokeWidth={2} dot={false} type="monotone" />
            <Line dataKey="margin" stroke="var(--viz-2)" strokeWidth={2} dot={false} type="monotone" />
            <Legend wrapperStyle={{ fontSize: 12 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

function PlanChart() {
  const data = useMemo(() => revenueByPlan(), []);
  return (
    <Card padded>
      <header style={{ marginBottom: "var(--s-2)" }}>
        <h3 style={{ font: "var(--t-h3)", margin: 0 }}>Revenue by plan</h3>
      </header>
      <div style={{ width: "100%", height: 220 }}>
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
            <CartesianGrid stroke="var(--viz-grid)" vertical={false} />
            <XAxis dataKey="plan" stroke="var(--viz-axis)" fontSize={11} />
            <YAxis stroke="var(--viz-axis)" fontSize={11} width={56} tickFormatter={(v) => "$" + v} />
            <Tooltip
              contentStyle={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                color: "var(--text)",
                fontSize: 12,
              }}
              formatter={(v: number) => fmtMoney(v)}
            />
            <Bar dataKey="mrr" radius={[6, 6, 0, 0]}>
              {data.map((_, i) => (
                <Cell key={i} fill={`var(--viz-${(i % 5) + 1})`} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

function ProductChart() {
  const data = useMemo(() => revenueByProduct(), []);
  return (
    <Card padded>
      <header style={{ marginBottom: "var(--s-2)", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <h3 style={{ font: "var(--t-h3)", margin: 0 }}>Revenue by product</h3>
        <ConfTag basis="projection" detail="wallet split is editorial" />
      </header>
      <div style={{ width: "100%", height: 220 }}>
        <ResponsiveContainer>
          <BarChart layout="vertical" data={data} margin={{ top: 8, right: 12, bottom: 0, left: 24 }}>
            <CartesianGrid stroke="var(--viz-grid)" horizontal={false} />
            <XAxis type="number" stroke="var(--viz-axis)" fontSize={11} tickFormatter={(v) => "$" + v} />
            <YAxis type="category" dataKey="product" stroke="var(--viz-axis)" fontSize={11} width={150} />
            <Tooltip
              contentStyle={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                color: "var(--text)",
                fontSize: 12,
              }}
              formatter={(v: number) => fmtMoney(v)}
            />
            <Bar dataKey="mrr" radius={[0, 6, 6, 0]}>
              {data.map((_, i) => (
                <Cell key={i} fill={`var(--viz-${(i % 5) + 1})`} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Revenue accounts table
// ---------------------------------------------------------------------------
function RevenueTable({
  rows,
  onOpen,
}: {
  rows: Account[];
  onOpen: (a: Account) => void;
}) {
  const columns = [
    {
      key: "name",
      header: "Account",
      sortable: true,
      sortAccessor: (a: Account) => a.identity.name,
      render: (a: Account) => (
        <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
          <span style={{ fontWeight: 500 }}>{a.identity.name}</span>
          <span style={{ font: "var(--t-meta)", color: "var(--text-3, var(--text))" }}>
            {a.identity.plan}
            {a.identity.isNonSaaS ? " · non-SaaS" : ""}
          </span>
        </div>
      ),
    },
    {
      key: "mrr",
      header: "MRR",
      align: "right" as const,
      mono: true,
      sortable: true,
      sortAccessor: (a: Account) => a.revenue.mrr,
      render: (a: Account) => fmtMoney(a.revenue.mrr),
    },
    {
      key: "spend",
      header: "Spend trend",
      align: "right" as const,
      sortable: true,
      sortAccessor: (a: Account) => a.revenue.spendTrend,
      render: (a: Account) => {
        const v = a.revenue.spendTrend;
        return (
          <Delta
            value={`${v > 0 ? "+" : ""}${Math.round(v)}%`}
            direction={v > 0 ? "up" : v < 0 ? "down" : "flat"}
          />
        );
      },
    },
    {
      key: "renewal",
      header: "Renewal",
      align: "right" as const,
      mono: true,
      sortable: true,
      sortAccessor: (a: Account) => daysUntil(a.revenue.renewalDate),
      render: (a: Account) => {
        const d = daysUntil(a.revenue.renewalDate);
        return <span>{d >= 0 ? `${d}d` : `${d}d`}</span>;
      },
    },
    {
      key: "wallet",
      header: "Wallet",
      align: "right" as const,
      mono: true,
      sortable: true,
      sortAccessor: (a: Account) => a.revenue.walletBalance,
      render: (a: Account) => fmtMoney(a.revenue.walletBalance),
    },
    {
      key: "margin",
      header: "Margin",
      align: "right" as const,
      sortable: true,
      sortAccessor: (a: Account) => a.revenue.margin,
      render: (a: Account) => {
        const v = a.revenue.margin;
        // Cost-style inversion: a falling margin is bad.
        return (
          <Delta
            value={`${v > 0 ? "+" : ""}${Math.round(v)}%`}
            direction={v >= 30 ? "up" : v >= 15 ? "flat" : "bad-up"}
          />
        );
      },
    },
    {
      key: "risk",
      header: "Risk tags",
      render: (a: Account) =>
        a.revenue.riskTags.length ? (
          <span style={{ display: "inline-flex", flexWrap: "wrap", gap: "var(--s-1)" }}>
            {a.revenue.riskTags.map((t) => (
              <Badge key={t} variant="danger" dot={false}>{t}</Badge>
            ))}
          </span>
        ) : (
          <span style={{ color: "var(--text-3, var(--text))" }}>—</span>
        ),
    },
  ];

  return (
    <DataTable<Account>
      rows={rows}
      columns={columns}
      getRowId={(a) => a.identity.id}
      onRowClick={(a) => onOpen(a)}
      stickyHeader
    />
  );
}

// ---------------------------------------------------------------------------
// Churn analysis
// ---------------------------------------------------------------------------
function ChurnPanel({ onOpen, onSendToToday }: { onOpen: (a: Account) => void; onSendToToday: () => void }) {
  const churned = useMemo(() => churnedAccounts(), []);
  const lostMrr = churned.reduce((s, a) => {
    const c = a.revenue.planChanges.find((p) => p.type === "churn");
    return s + Math.abs(c?.mrrImpact ?? a.revenue.mrr);
  }, 0);
  const byPlan = useMemo(() => {
    const map = new Map<string, { count: number; lost: number }>();
    for (const a of churned) {
      const k = a.identity.plan;
      const c = a.revenue.planChanges.find((p) => p.type === "churn");
      const cur = map.get(k) ?? { count: 0, lost: 0 };
      cur.count++;
      cur.lost += Math.abs(c?.mrrImpact ?? a.revenue.mrr);
      map.set(k, cur);
    }
    return Array.from(map.entries()).map(([plan, v]) => ({ plan, ...v }));
  }, [churned]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-4)" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "var(--s-3)",
        }}
      >
        <MetricCard
          label="Churned accounts"
          value={<Mono>{churned.length}</Mono>}
          icon={<Icon name="user-minus" />}
          accent="neg"
          context="lifetime"
        />
        <MetricCard
          label="Lost MRR"
          value={<Mono>{fmtMoney(lostMrr)}</Mono>}
          icon={<Icon name="trending-down" />}
          accent="neg"
          delta={<Delta value={`${churned.length}`} direction="bad-up" />}
          context="from churn events"
        />
        <MetricCard
          label="Avg lost / account"
          value={
            <Mono>
              {fmtMoney(churned.length ? lostMrr / churned.length : 0)}
            </Mono>
          }
          icon={<Icon name="calculator" />}
          context="averaged"
        />
      </div>

      <Card padded>
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--s-3)" }}>
          <h3 style={{ font: "var(--t-h3)", margin: 0 }}>Lost revenue by plan</h3>
          <Button variant="ghost" size="sm" icon={<Icon name="send" />} onClick={onSendToToday}>
            Send to Today
          </Button>
        </header>
        {byPlan.length === 0 ? (
          <span style={{ font: "var(--t-body)", color: "var(--text-3, var(--text))" }}>
            No churn in the current window.
          </span>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {byPlan.map((g) => (
              <li
                key={g.plan}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "var(--s-2) 0",
                  borderTop: "1px solid var(--border)",
                }}
              >
                <Badge variant="neutral" dot={false}>{g.plan}</Badge>
                <span style={{ display: "inline-flex", gap: "var(--s-3)", alignItems: "baseline" }}>
                  <span style={{ font: "var(--t-meta)", color: "var(--text-3, var(--text))" }}>
                    <Mono>{g.count}</Mono> accounts
                  </span>
                  <span style={{ font: "var(--t-body)" }}>
                    <Mono>{fmtMoney(g.lost)}</Mono> lost
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card padded>
        <h3 style={{ font: "var(--t-h3)", margin: 0, marginBottom: "var(--s-3)" }}>Churned accounts</h3>
        <RevenueTable rows={byUrgency(churned)} onOpen={onOpen} />
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
const TABS = [
  { id: "overview", label: "Overview" },
  { id: "accounts", label: "Accounts" },
  { id: "churn", label: "Churn Analysis" },
];

export default function MoneyPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"overview" | "accounts" | "churn">("overview");
  const [filter, setFilter] = useState<FilterKey>("all");
  const kpis = useKpis();
  const rollup = agencyRollup();
  const totalCost = live.reduce((s, a) => s + a.revenue.totalCost, 0);

  const activeKpi = kpis.find((k) => k.key === filter);
  const filteredRows = useMemo(() => {
    if (filter === "all") return byUrgency(live);
    return byUrgency(activeKpi?.rows ?? []);
  }, [filter, activeKpi]);

  const onKpi = (key: FilterKey) => {
    setFilter(key);
    setTab("accounts");
  };

  const openAccount = (a: Account) => navigate(`/accounts/${a.identity.id}`);
  const sendToToday = () => navigate("/today");

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
        title="Money"
        description="The portfolio's revenue story — every cohort can be sent to Today as a problem cohort."
        kpis={[
          { label: "Total MRR", value: <Mono>{fmtMoney(rollup.mrr)}</Mono> },
          { label: "MRR at risk", value: <Mono>{fmtMoney(rollup.mrrAtRisk)}</Mono> },
          { label: "Total cost", value: <Mono>{fmtMoney(totalCost)}</Mono> },
          { label: "Live accounts", value: <Mono>{rollup.liveAccounts}</Mono> },
        ]}
      />

      <Tabs tabs={TABS} active={tab} onChange={(id) => setTab(id as typeof tab)} />

      {tab === "overview" ? (
        <>
          <section
            style={{
              display: "grid",
              gap: "var(--s-3)",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            }}
          >
            {kpis.map((k) => (
              <div key={k.key} onClick={() => onKpi(k.key)} style={{ cursor: "pointer" }}>
                <MetricCard
                  label={k.label}
                  value={k.format ? k.format(k.rows) : <Mono>{k.rows.length}</Mono>}
                  icon={<Icon name={k.icon} />}
                  iconTone={k.accent === "neg" ? "neg" : k.accent === "pos" ? "pos" : "info"}
                  accent={k.accent === "neg" ? "neg" : k.accent === "pos" ? "pos" : null}
                  delta={k.deltaValue ? <Delta value={k.deltaValue} direction={k.deltaDir ?? "flat"} /> : undefined}
                  context={k.context}
                />
              </div>
            ))}
          </section>

          <section
            style={{
              display: "grid",
              gap: "var(--s-3)",
              gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1fr)",
            }}
          >
            <DailyChart />
            <PlanChart />
          </section>

          <ProductChart />
        </>
      ) : null}

      {tab === "accounts" ? (
        <>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--s-2)", alignItems: "center" }}>
            <span style={{ font: "var(--t-meta)", color: "var(--text-3, var(--text))" }}>Cohort</span>
            <Badge
              variant={filter === "all" ? "blue" : "neutral"}
              dot={false}
              onClick={() => setFilter("all")}
              style={{ cursor: "pointer" }}
            >
              All live ({live.length})
            </Badge>
            {kpis.map((k) => (
              <Badge
                key={k.key}
                variant={filter === k.key ? (k.accent === "neg" ? "danger" : "blue") : "neutral"}
                dot={false}
                onClick={() => setFilter(k.key)}
                style={{ cursor: "pointer" }}
              >
                {k.label} ({k.rows.length})
              </Badge>
            ))}
            <span style={{ marginLeft: "auto", display: "inline-flex", gap: "var(--s-2)" }}>
              {activeKpi ? (
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<Icon name="send" />}
                  onClick={sendToToday}
                  disabled={activeKpi.rows.length === 0}
                >
                  Send cohort to Today
                </Button>
              ) : null}
            </span>
          </div>
          <Card padded>
            <RevenueTable rows={filteredRows} onOpen={openAccount} />
          </Card>
        </>
      ) : null}

      {tab === "churn" ? <ChurnPanel onOpen={openAccount} onSendToToday={sendToToday} /> : null}
    </main>
  );
}
