import { useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  Card,
  Tabs,
  Button,
  Icon,
  Mono,
  HealthBadge,
  StageBadge,
  Badge,
  LiveStatus,
  Verdict,
  ActivityLog,
} from "@/gocsm-ds";
import {
  accountById,
  signalsForAccount,
  daysUntil,
  daysSince,
  bandLabel,
  type Signal,
} from "@/fixtures";
import { HealthTab } from "@/components/account/HealthTab";

const TAB_IDS = [
  "health",
  "adoption",
  "revenue",
  "login",
  "feedback",
  "onboarding",
] as const;
type TabId = (typeof TAB_IDS)[number];

const TABS = [
  { id: "health", label: "Health" },
  { id: "adoption", label: "Product Adoption" },
  { id: "revenue", label: "Revenue" },
  { id: "login", label: "Login" },
  { id: "feedback", label: "Feedback" },
  { id: "onboarding", label: "Onboarding" },
];

const fmtMoney = (n: number) => "$" + Math.round(n).toLocaleString();
const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

// ----- Signal → human line ---------------------------------------------------

function lineForSignal(s: Signal): string {
  if (s.sticky && s.direction === "reverse") {
    return `${s.label} — Save play running.`;
  }
  if (s.subject === "Payment" && s.direction === "reverse") {
    return `${s.label} — dunning sequence in flight.`;
  }
  if (s.subject === "NPS" && s.direction === "forward") {
    return `${s.label} — testimonial opportunity flagged.`;
  }
  if (s.subject === "Login" && s.direction === "reverse") {
    return `${s.label} — Win-back watch enabled.`;
  }
  if (s.direction === "forward" && s.type === "setup") {
    return `${s.label} — setup completed.`;
  }
  return s.label;
}

function outcomeForSignal(s: Signal): { label: string; state: "ok" | "pending" | "muted" } {
  if (s.direction === "reverse" && s.sticky) return { label: "regression · sticky", state: "pending" };
  if (s.direction === "reverse") return { label: "regression", state: "pending" };
  if (s.subject === "NPS") return { label: "promoter", state: "ok" };
  if (s.type === "setup") return { label: "completed", state: "ok" };
  return { label: "noted", state: "muted" };
}

function dayLabel(iso: string): string {
  const d = daysSince(iso);
  if (d <= 0) return "Today";
  if (d === 1) return "Yesterday";
  if (d <= 7) return `${d} days ago`;
  if (d <= 30) return `${Math.round(d / 7)} weeks ago`;
  if (d <= 365) return `${Math.round(d / 30)} months ago`;
  return `${Math.round(d / 365)} years ago`;
}

function groupSignalsByDay(signals: Signal[]) {
  const groups = new Map<string, Signal[]>();
  for (const s of signals) {
    const key = dayLabel(s.detectedAt);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(s);
  }
  return Array.from(groups.entries()).map(([label, rows]) => ({
    label,
    count: rows.length,
    rows: rows.map((s) => ({
      time: fmtTime(s.detectedAt),
      actor: "GoCSM",
      auto: true,
      line: lineForSignal(s),
      outcome: outcomeForSignal(s).label,
      outcomeState: outcomeForSignal(s).state,
    })),
  }));
}

// ----- Page ------------------------------------------------------------------

export default function AccountDetailPage() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabId>("health");

  const account = useMemo(() => accountById(id), [id]);
  const signals = useMemo(() => (account ? signalsForAccount(account.identity.id) : []), [account]);
  const days = useMemo(() => groupSignalsByDay(signals), [signals]);

  if (!account) {
    return (
      <main style={{ padding: "var(--s-8) var(--s-6)", maxWidth: 800, margin: "0 auto", color: "var(--text)" }}>
        <h1 style={{ font: "var(--t-h2)", margin: 0 }}>Account not found</h1>
        <p style={{ font: "var(--t-body)", color: "var(--text-3, var(--text))", marginTop: "var(--s-2)" }}>
          We couldn't find an account with that id.
        </p>
        <div style={{ marginTop: "var(--s-4)" }}>
          <Button variant="secondary" size="sm" onClick={() => navigate("/accounts")}>
            Back to Accounts
          </Button>
        </div>
      </main>
    );
  }

  const { identity, ownership, status, lifecycle, pipeline, health, revenue } = account;
  const renewalDays = daysUntil(revenue.renewalDate);

  // Verdict line — the one-sentence headline state.
  const verdictLine = (() => {
    const reverseSticky = signals.find((s) => s.sticky && s.direction === "reverse");
    if (reverseSticky)
      return `${identity.name} ${reverseSticky.label.toLowerCase()} — they may be moving to another platform.`;
    if (revenue.lastPaymentStatus === "failed")
      return `${identity.name} has an unpaid invoice — Save play is running.`;
    if (health.band === "atrisk")
      return `${identity.name} is at risk — health ${health.score} and trending down.`;
    if (health.band === "watch")
      return `${identity.name} needs a check-in — health ${health.score}, ${renewalDays}d to renewal.`;
    if (health.band === "thriving")
      return `${identity.name} is thriving — health ${health.score}, advocacy-ready.`;
    return `${identity.name} is healthy — health ${health.score}, steady.`;
  })();

  return (
    <main
      style={{
        padding: "var(--s-7) var(--s-6)",
        maxWidth: 1180,
        margin: "0 auto",
        color: "var(--text)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--s-6)",
      }}
    >
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: "var(--s-1)", font: "var(--t-meta)", color: "var(--text-3, var(--text))" }}>
        <Link to="/accounts" style={{ color: "inherit", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}>
          <Icon name="arrow-left" /> Accounts
        </Link>
        <span>·</span>
        <span>{identity.name}</span>
      </div>

      {/* Header */}
      <header
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--s-4)",
          paddingBottom: "var(--s-5)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: "var(--s-4)", flexWrap: "wrap" }}>
          <span
            aria-hidden
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 56,
              height: 56,
              borderRadius: 12,
              background: "var(--surface-2)",
              color: "var(--text-2, var(--text))",
              font: "var(--t-h3)",
              fontWeight: 600,
            }}
          >
            {identity.avatar}
          </span>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-2)", flex: 1, minWidth: 240 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--s-3)", flexWrap: "wrap" }}>
              <h1 style={{ font: "var(--t-h2)", margin: 0 }}>{identity.name}</h1>
              {status.enabled === "Disabled" ? (
                <Badge variant="neutral" dot={false}>Disabled</Badge>
              ) : status.tracked ? (
                <Badge variant="pos" dot>Tracked</Badge>
              ) : (
                <Badge variant="warn" dot>Untracked</Badge>
              )}
              {status.isPriority ? <Badge variant="warn" dot={false}>★ Priority</Badge> : null}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--s-3)", font: "var(--t-meta)", color: "var(--text-3, var(--text))" }}>
              <span>{identity.industry}</span>
              <span>· {identity.plan}{identity.isNonSaaS ? " · non-SaaS" : ""}</span>
              <span>· Client for <Mono>{Math.round(daysSince(identity.clientSince) / 30)}mo</Mono></span>
              <span>· <Mono>{identity.activeDays}d</Mono> active</span>
              <span>· Owner <strong style={{ color: "var(--text-2, var(--text))" }}>{ownership.owner}</strong></span>
              <span>· CSM <strong style={{ color: "var(--text-2, var(--text))" }}>{ownership.assignedCSM}</strong></span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--s-2)", flexWrap: "wrap" }}>
              <StageBadge stage={lifecycle.stage} reactivated={lifecycle.reactivated} />
              {pipeline.stage ? (
                <Badge variant="neutral" dot={false} title="Native HighLevel pipeline">
                  HL · {pipeline.stage}
                </Badge>
              ) : null}
              {status.enabled !== "Disabled" ? (
                <HealthBadge band={health.band} label={`${bandLabel(health.band)} · ${health.score}`} />
              ) : null}
              <span style={{ marginLeft: "auto" }}>
                <LiveStatus state="fresh" label="Synced 3m ago" watchingCount={1} />
              </span>
            </div>
          </div>
        </div>

        {/* Verdict */}
        <Verdict tone={health.band === "atrisk" ? "risk" : health.band === "watch" ? "watch" : "pos"} band={health.band} score={<Mono>{health.score}</Mono>}>
          {verdictLine}
        </Verdict>
      </header>

      {/* Timeline — primary, above tabs */}
      <section aria-label="Timeline" style={{ display: "flex", flexDirection: "column", gap: "var(--s-3)" }}>
        <header style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "var(--s-3)" }}>
          <div>
            <h2 style={{ font: "var(--t-h3)", margin: 0 }}>Timeline</h2>
            <p style={{ font: "var(--t-body)", color: "var(--text-3, var(--text))", margin: "var(--s-1) 0 0" }}>
              The story of what changed, in order. Setup, adoption, lifecycle, and outcomes meet here.
            </p>
          </div>
          <span style={{ font: "var(--t-meta)", color: "var(--text-3, var(--text))" }}>
            <Mono>{signals.length}</Mono> signals
          </span>
        </header>
        {days.length ? (
          <ActivityLog days={days} live />
        ) : (
          <Card padded>
            <p style={{ font: "var(--t-body)", color: "var(--text-3, var(--text))", margin: 0 }}>
              No signals recorded for this account yet — GoCSM is watching.
            </p>
          </Card>
        )}
      </section>

      {/* Tabs scaffold */}
      <section aria-label="Detail">
        <Tabs tabs={TABS} active={tab} onChange={(id) => setTab(id as TabId)} />
        <div style={{ marginTop: "var(--s-4)" }}>
          {tab === "health" ? (
            <HealthTab account={account} onNavigateTab={(t) => setTab(t)} />
          ) : (
            <Card padded>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-2)" }}>
                <span style={{ font: "var(--t-meta)", textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--text-3, var(--text))" }}>
                  {TABS.find((t) => t.id === tab)?.label}
                </span>
                <p style={{ font: "var(--t-body)", color: "var(--text-2, var(--text))", margin: 0 }}>
                  {tab === "revenue"
                    ? `MRR ${fmtMoney(revenue.mrr)} · renews in ${renewalDays}d. Detail panel ships next.`
                    : "Detail panel ships next."}
                </p>
              </div>
            </Card>
          )}
        </div>
      </section>
    </main>
  );
}
