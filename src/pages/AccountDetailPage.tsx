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
import { PageRibbon } from "@/components/PageRibbon";
import {
  accountById,
  signalsForAccount,
  daysUntil,
  daysSince,
  bandLabel,
  type Signal,
} from "@/fixtures";
import { HealthTab } from "@/components/account/HealthTab";
import { LoginTab } from "@/components/account/LoginTab";
import { AdoptionTab } from "@/components/account/AdoptionTab";
import { RevenueTab } from "@/components/account/RevenueTab";
import { FeedbackTab } from "@/components/account/FeedbackTab";
import { OnboardingTab } from "@/components/account/OnboardingTab";

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

  const verdictTone: "risk" | "watch" | "pos" =
    health.band === "atrisk" ? "risk" : health.band === "watch" ? "watch" : "pos";

  // Next action — derive from verdict context
  const nextAction = (() => {
    if (revenue.lastPaymentStatus === "failed") return "Run Save play — unpaid invoice";
    if (health.band === "atrisk") return "Apply Win-back playbook";
    if (health.band === "watch") return "Schedule check-in call";
    if (health.band === "thriving") return "Invite to advocacy program";
    return "Keep watching — no action needed";
  })();

  const [timelineOpen, setTimelineOpen] = useState(false);

  return (
    <main
      style={{
        padding: "var(--s-7) var(--s-6)",
        maxWidth: 1280,
        margin: "0 auto",
        color: "var(--text)",
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) 280px",
        gap: "var(--s-6)",
        alignItems: "start",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-5)", minWidth: 0 }}>
        {/* Summary ribbon */}
        <Card padded>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-3)" }}>
            <Link to="/accounts" style={{ color: "var(--text-3, var(--text))", textDecoration: "none", font: "var(--t-meta)", display: "inline-flex", alignItems: "center", gap: 4 }}>
              <Icon name="arrow-left" /> Accounts
            </Link>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--s-4)", flexWrap: "wrap" }}>
              <span
                aria-hidden
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: "var(--surface-2)",
                  font: "var(--t-h3)",
                  fontWeight: 600,
                }}
              >
                {identity.avatar}
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <h1 style={{ font: "var(--t-h2)", margin: 0 }}>{identity.name}</h1>
                <span style={{ font: "var(--t-meta)", color: "var(--text-3, var(--text))" }}>
                  {identity.industry} · {identity.plan}
                </span>
              </div>
              <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "var(--s-2)" }}>
                {status.enabled === "Disabled" ? (
                  <Badge variant="neutral" dot={false}>Disabled</Badge>
                ) : status.tracked ? (
                  <Badge variant="pos" dot>Tracked</Badge>
                ) : (
                  <Badge variant="warn" dot>Untracked</Badge>
                )}
                {status.isPriority ? <Badge variant="warn" dot={false}>★ Priority</Badge> : null}
              </div>
            </div>

            {/* Compact facts band */}
            <div style={{ display: "flex", alignItems: "center", gap: "var(--s-4)", flexWrap: "wrap", padding: "var(--s-3) 0", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
              {status.enabled !== "Disabled" ? (
                <HealthBadge band={health.band} label={`${bandLabel(health.band)} · ${health.score}`} />
              ) : null}
              <StageBadge stage={lifecycle.stage} reactivated={lifecycle.reactivated} />
              <span style={{ font: "var(--t-meta)", color: "var(--text-3, var(--text))" }}>
                Renews {new Date(revenue.renewalDate).toLocaleDateString([], { month: "short", day: "numeric" })}
              </span>
              <span style={{ font: "var(--t-meta)", color: "var(--text-3, var(--text))" }}>
                MRR <Mono>${Math.round(revenue.mrr).toLocaleString()}</Mono>
              </span>
              <span style={{ font: "var(--t-meta)", color: "var(--text-3, var(--text))" }}>
                Owner {ownership.owner}
              </span>
              <span style={{ marginLeft: "auto" }}>
                <LiveStatus state="fresh" label="Synced 3m ago" watchingCount={1} />
              </span>
            </div>

            {/* One-line verdict */}
            <Verdict tone={verdictTone} band={health.band} score={<Mono>{health.score}</Mono>}>
              {verdictLine}
            </Verdict>
          </div>
        </Card>

        {/* Tabs directly under ribbon */}
        <section aria-label="Detail">
          <Tabs tabs={TABS} active={tab} onChange={(id) => setTab(id as TabId)} />
          <div style={{ marginTop: "var(--s-4)", display: "flex", flexDirection: "column", gap: "var(--s-4)" }}>
            {tab === "health" ? (
              <HealthTab account={account} onNavigateTab={(t) => setTab(t)} />
            ) : tab === "login" ? (
              <LoginTab account={account} />
            ) : tab === "adoption" ? (
              <AdoptionTab account={account} />
            ) : tab === "revenue" ? (
              <RevenueTab account={account} />
            ) : tab === "feedback" ? (
              <FeedbackTab account={account} />
            ) : tab === "onboarding" ? (
              <OnboardingTab account={account} />
            ) : null}

            {/* Collapsible Timeline — reference, not gateway */}
            <Card padded>
              <button
                type="button"
                onClick={() => setTimelineOpen((v) => !v)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  background: "transparent",
                  border: 0,
                  padding: 0,
                  cursor: "pointer",
                  color: "inherit",
                }}
                aria-expanded={timelineOpen}
              >
                <span style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 2 }}>
                  <span style={{ font: "var(--t-h3)" }}>What changed recently</span>
                  <span style={{ font: "var(--t-meta)", color: "var(--text-3, var(--text))" }}>
                    {signals.length} updates · reference only
                  </span>
                </span>
                <Icon name={timelineOpen ? "chevron-up" : "chevron-down"} />
              </button>
              {timelineOpen ? (
                <div style={{ marginTop: "var(--s-4)" }}>
                  {days.length ? (
                    <ActivityLog days={days} live />
                  ) : (
                    <p style={{ font: "var(--t-body)", color: "var(--text-3, var(--text))", margin: 0 }}>
                      No signals recorded yet — GoCSM is watching.
                    </p>
                  )}
                </div>
              ) : null}
            </Card>
          </div>
        </section>
      </div>

      {/* Persistent right sidebar — key facts */}
      <aside
        style={{
          position: "sticky",
          top: "var(--s-6)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--s-3)",
        }}
      >
        <Card padded>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-4)" }}>
            <h2 style={{ font: "var(--t-h3)", margin: 0 }}>Key facts</h2>

            <FactRow label="Health">
              <HealthBadge band={health.band} label={`${bandLabel(health.band)} · ${health.score}`} />
            </FactRow>

            <FactRow label="Renewal">
              <span style={{ font: "var(--t-body)" }}>
                {new Date(revenue.renewalDate).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
              </span>
              <span style={{ font: "var(--t-meta)", color: "var(--text-3, var(--text))" }}>
                in <Mono>{renewalDays}</Mono> days
              </span>
            </FactRow>

            <FactRow label="MRR">
              <Mono style={{ font: "var(--t-h3)" }}>${Math.round(revenue.mrr).toLocaleString()}</Mono>
            </FactRow>

            <FactRow label="Owner / CSM">
              <span style={{ font: "var(--t-body)" }}>{ownership.owner}</span>
              <span style={{ font: "var(--t-meta)", color: "var(--text-3, var(--text))" }}>
                CSM {ownership.assignedCSM}
              </span>
            </FactRow>

            <FactRow label="Next action">
              <span style={{ font: "var(--t-body)", color: "var(--text)" }}>{nextAction}</span>
              <Button size="sm" variant="secondary">Open playbook</Button>
            </FactRow>
          </div>
        </Card>
      </aside>
    </main>
  );
}

function FactRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-1)", paddingBottom: "var(--s-3)", borderBottom: "1px solid var(--border)" }}>
      <span style={{ font: "var(--t-meta)", textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--text-3, var(--text))" }}>
        {label}
      </span>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-1)", alignItems: "flex-start" }}>
        {children}
      </div>
    </div>
  );
}
