import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge, Card, DataTable, Delta, MetricCard, Mono, ConfTag, Icon } from "@gocsm/design-system";
import type { Account, PaymentAttempt, PlanChange } from "@/fixtures";
import { daysUntil } from "@/fixtures";
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString(undefined,{month:"short",day:"numeric"});

const fmtMoney = (n: number) => "$" + Math.round(n).toLocaleString();
const fmtPct = (n: number) => `${n > 0 ? "+" : ""}${Math.round(n)}%`;

const STATUS_VARIANT: Record<PaymentAttempt["status"], "pos" | "warn" | "danger"> = {
  succeeded: "pos",
  pending: "warn",
  failed: "danger",
};

const PLAN_VARIANT: Record<PlanChange["type"], "pos" | "warn" | "danger" | "blue"> = {
  upgrade: "pos",
  reactivation: "blue",
  downgrade: "warn",
  churn: "danger",
};

const RH_VARIANT: Record<"healthy" | "watch" | "atrisk", "pos" | "warn" | "danger"> = {
  healthy: "pos",
  watch: "warn",
  atrisk: "danger",
};

interface PaymentRow extends PaymentAttempt {
  id: string;
}
interface PlanRow extends PlanChange {
  id: string;
}

// Derive a synthetic 6-month revenue/cost/margin series from current values + spendTrend.
function deriveSeries(mrr: number, cost: number, spendTrend: number) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  return months.map((m, i) => {
    const t = (i - (months.length - 1)) / (months.length - 1); // -1..0
    const factor = 1 + (spendTrend / 100) * t; // older months scaled inversely to trend
    const mrrVal = Math.max(0, Math.round(mrr * factor));
    const costVal = Math.max(0, Math.round(cost * (1 + 0.05 * t)));
    return {
      month: m,
      mrr: mrrVal,
      cost: costVal,
      margin: Math.max(0, mrrVal - costVal),
    };
  });
}

export function RevenueTab({ account }: { account: Account }) {
  const { revenue, identity } = account;
  const renewalDays = daysUntil(revenue.renewalDate);

  const series = useMemo(
    () => deriveSeries(revenue.mrr, revenue.totalCost, revenue.spendTrend),
    [revenue.mrr, revenue.totalCost, revenue.spendTrend],
  );

  const paymentRows: PaymentRow[] = revenue.paymentAttempts.map((p, i) => ({
    ...p,
    id: `${identity.id}-pay-${i}`,
  }));
  const planRows: PlanRow[] = revenue.planChanges.map((p, i) => ({
    ...p,
    id: `${identity.id}-plan-${i}`,
  }));

  const lowMargin = revenue.margin < 20;
  const lowData = paymentRows.length === 0 && planRows.length === 0;

  // Single worst metric per tab (R8): pick the most critical card; only that one gets an accent.
  type WorstKey = "margin" | "renewal" | "wallet" | "revenueHealth" | "spendTrend" | null;
  const worst: WorstKey = (() => {
    if (revenue.revenueHealth === "atrisk") return "revenueHealth";
    if (lowMargin) return "margin";
    if (renewalDays <= 14) return "renewal";
    if (revenue.walletBalance < revenue.walletSpend30d * 0.25) return "wallet";
    if (revenue.spendTrend < -10) return "spendTrend";
    return null;
  })();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-5)" }}>
      {/* Summary metrics */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "var(--s-3)",
        }}
      >
        <MetricCard
          label="MRR"
          value={<Mono>{fmtMoney(revenue.mrr)}</Mono>}
          icon={<Icon name="dollar-sign" />}
          iconTone={revenue.mrr > 0 ? "pos" : "neg"}
        />
        <MetricCard
          label="Spend trend · MoM"
          value={<Mono>{fmtPct(revenue.spendTrend)}</Mono>}
          icon={<Icon name="trending-up" />}
          iconTone={revenue.spendTrend >= 0 ? "pos" : "warn"}
          accent={worst === "spendTrend" ? "neg" : null}
          delta={
            <Delta
              value={fmtPct(revenue.spendTrend)}
              direction={revenue.spendTrend > 0 ? "up" : revenue.spendTrend < 0 ? "down" : "flat"}
            />
          }
        />
        <MetricCard
          label="Revenue health"
          value={
            <Badge variant={RH_VARIANT[revenue.revenueHealth]} dot>
              {revenue.revenueHealth === "atrisk" ? "At risk" : revenue.revenueHealth}
            </Badge>
          }
          icon={<Icon name="activity" />}
          iconTone={revenue.revenueHealth === "healthy" ? "pos" : revenue.revenueHealth === "watch" ? "warn" : "neg"}
          accent={worst === "revenueHealth" ? "neg" : null}
        />
        <MetricCard
          label="Renewal"
          value={
            <span>
              <Mono>{fmtDate(revenue.renewalDate)}</Mono> · <Mono>{renewalDays}d</Mono>
            </span>
          }
          icon={<Icon name="calendar" />}
          iconTone={renewalDays <= 30 ? "warn" : "info"}
          accent={worst === "renewal" ? "neg" : null}
        />
        <MetricCard
          label="Wallet balance"
          value={<Mono>{fmtMoney(revenue.walletBalance)}</Mono>}
          icon={<Icon name="wallet" />}
          iconTone={revenue.walletBalance < revenue.walletSpend30d * 0.25 ? "warn" : "info"}
          accent={worst === "wallet" ? "neg" : null}
        />
        <MetricCard
          label="Wallet spend · 30d"
          value={<Mono>{fmtMoney(revenue.walletSpend30d)}</Mono>}
          icon={<Icon name="trending-up" />}
          iconTone="info"
        />
        <MetricCard
          label="Wallet spend · 90d"
          value={<Mono>{fmtMoney(revenue.walletSpend90d)}</Mono>}
          icon={<Icon name="trending-up" />}
          iconTone="info"
        />
        <MetricCard
          label="Total cost"
          value={<Mono>{fmtMoney(revenue.totalCost)}</Mono>}
          icon={<Icon name="receipt" />}
          iconTone={lowMargin ? "warn" : "info"}
          delta={
            <Delta
              value={fmtPct(-Math.round(revenue.spendTrend / 2))}
              direction="bad-up"
              context="vs last period"
            />
          }
        />
        <MetricCard
          label="Margin"
          value={<Mono>{fmtPct(revenue.margin)}</Mono>}
          icon={<Icon name="percent" />}
          iconTone={revenue.margin >= 40 ? "pos" : revenue.margin >= 20 ? "warn" : "neg"}
          accent={worst === "margin" ? "neg" : null}
        />
      </div>

      {/* Risk tags */}
      {revenue.riskTags.length ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--s-2)", alignItems: "center" }}>
          <span style={{ font: "var(--t-meta)", color: "var(--text-3, var(--text))", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Risk tags
          </span>
          {revenue.riskTags.map((t) => (
            <Badge key={t} variant="warn" dot>
              {t}
            </Badge>
          ))}
        </div>
      ) : null}

      {/* Revenue/cost/margin chart */}
      <Card padded>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-2)" }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "var(--s-2)" }}>
            <h4 style={{ font: "var(--t-h4)", margin: 0 }}>Revenue, cost, margin · 6mo</h4>
            <span style={{ font: "var(--t-meta)", color: "var(--text-3, var(--text))" }}>
              Estimate — limited data
            </span>
          </div>
          <div style={{ width: "100%", height: 200 }}>
            <ResponsiveContainer>
              <AreaChart data={series} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="mrrFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--viz-seq-5)" stopOpacity={0.32} />
                    <stop offset="100%" stopColor="var(--viz-seq-5)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--viz-grid)" vertical={false} />
                <XAxis dataKey="month" stroke="var(--viz-axis)" fontSize={11} />
                <YAxis stroke="var(--viz-axis)" fontSize={11} width={48} />
                <Tooltip
                  contentStyle={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    font: "var(--t-meta)",
                  }}
                  formatter={(v: number) => fmtMoney(v)}
                />
                <Area type="monotone" dataKey="mrr" stroke="var(--viz-seq-5)" fill="url(#mrrFill)" strokeWidth={2} />
                <Line type="monotone" dataKey="cost" stroke="var(--viz-seq-3)" strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
                <Line type="monotone" dataKey="margin" stroke="var(--viz-seq-6)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: "flex", gap: "var(--s-3)", font: "var(--t-meta)", color: "var(--text-3, var(--text))" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: "var(--viz-seq-5)" }} /> MRR
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: "var(--viz-seq-3)" }} /> Cost
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: "var(--viz-seq-6)" }} /> Margin
            </span>
          </div>
        </div>
      </Card>

      {/* Payment history */}
      <section style={{ display: "flex", flexDirection: "column", gap: "var(--s-2)" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <h4 style={{ font: "var(--t-h4)", margin: 0 }}>Payment attempts</h4>
          {paymentRows.length === 0 ? (
            <ConfTag basis="guess" detail="no attempts on file" />
          ) : null}
        </div>
        <DataTable<PaymentRow>
          rows={paymentRows}
          stickyHeader
          defaultSort={{ key: "date", dir: "desc" }}
          columns={[
            {
              key: "date",
              header: "Date",
              sortable: true,
              mono: true,
              render: (r) => <Mono>{fmtDate(r.date)}</Mono>,
            },
            {
              key: "amount",
              header: "Amount",
              sortable: true,
              mono: true,
              align: "right",
              render: (r) => <Mono>{fmtMoney(r.amount)}</Mono>,
            },
            {
              key: "status",
              header: "Status",
              sortable: true,
              render: (r) => (
                <Badge variant={STATUS_VARIANT[r.status]} dot>
                  {r.status}
                </Badge>
              ),
            },
            {
              key: "failureReason",
              header: "Reason",
              render: (r) => (
                <span style={{ color: "var(--text-3, var(--text))" }}>
                  {r.failureReason ?? "—"}
                </span>
              ),
            },
          ]}
          empty={<span style={{ color: "var(--pos-7)" }}>✓ No failed attempts — payments are clean.</span>}
        />
      </section>

      {/* Plan-change history */}
      <section style={{ display: "flex", flexDirection: "column", gap: "var(--s-2)" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <h4 style={{ font: "var(--t-h4)", margin: 0 }}>Plan changes</h4>
          {planRows.length === 0 ? <ConfTag basis="guess" detail="no plan changes on file" /> : null}
        </div>
        <DataTable<PlanRow>
          rows={planRows}
          stickyHeader
          defaultSort={{ key: "date", dir: "desc" }}
          columns={[
            {
              key: "date",
              header: "Date",
              sortable: true,
              mono: true,
              render: (r) => <Mono>{fmtDate(r.date)}</Mono>,
            },
            {
              key: "change",
              header: "Change",
              render: (r) => (
                <span>
                  <Mono>{r.from}</Mono> → <Mono>{r.to}</Mono>
                </span>
              ),
            },
            {
              key: "type",
              header: "Type",
              sortable: true,
              render: (r) => (
                <Badge variant={PLAN_VARIANT[r.type]} dot>
                  {r.type}
                </Badge>
              ),
            },
            {
              key: "mrrImpact",
              header: "MRR impact",
              sortable: true,
              mono: true,
              align: "right",
              render: (r) => (
                <Delta
                  value={`${r.mrrImpact > 0 ? "+" : ""}${fmtMoney(r.mrrImpact)}`}
                  direction={r.mrrImpact > 0 ? "up" : r.mrrImpact < 0 ? "down" : "flat"}
                />
              ),
            },
          ]}
          empty={<span style={{ color: "var(--text-2, var(--text))" }}>Plan's been steady — no upgrades or downgrades on file.</span>}
        />
      </section>

      {lowData ? (
        <span style={{ font: "var(--t-meta)", color: "var(--text-3, var(--text))" }}>
          <ConfTag basis="projection" detail="limited billing history" /> Numbers shown reflect current state; series is projected from spend trend.
        </span>
      ) : null}
    </div>
  );
}
