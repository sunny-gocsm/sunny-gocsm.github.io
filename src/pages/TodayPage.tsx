import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  Button,
  Icon,
  Mono,
  MetricCard,
  Delta,
  HealthTile,
  TeamPulseStrip,
  Verdict,
  LiveStatus,
} from "@/gocsm-ds";
import { PageRibbon } from "@/components/PageRibbon";
import {
  atRiskByUrgency,
  renewalsWindow,
  failedPayments,
  lostStickySetups,
  stalledOnboarding,
  dormantGrowth,
  agencyRollup,
  healthDistribution,
  signalsForAccount,
  daysUntil,
  bandLabel,
  allAccounts,
  type Account,
} from "@/fixtures";
import { PlaybookActivationDrawer, type DrawerScope } from "@/components/playbooks/PlaybookActivationDrawer";


// ----------------------------------------------------------------------------
// helpers
// ----------------------------------------------------------------------------

const fmtMoney = (n: number) => "$" + Math.round(n).toLocaleString();

const greetingFor = (name: string) => {
  const h = new Date().getHours();
  const part = h < 12 ? "morning" : h < 18 ? "afternoon" : "evening";
  return `Good ${part}, ${name}.`;
};

// One-sentence plain reason for an at-risk account — uses the newest signal if
// available, else falls back to risk signals / login.
function reasonFor(a: Account): string {
  const sigs = signalsForAccount(a.identity.id);
  const sticky = sigs.find((s) => s.sticky && s.direction === "reverse");
  if (sticky) {
    return `${a.identity.name} ${sticky.label.toLowerCase()} — they may be moving to another platform.`;
  }
  const failed = sigs.find((s) => s.subject === "Payment" && s.direction === "reverse");
  if (failed) return `Payment failed — ${failed.label.toLowerCase()}.`;
  if (a.health.riskSignals[0]) return a.health.riskSignals[0];
  if (a.login.lastLoginDaysAgo >= 21)
    return `No login in ${a.login.lastLoginDaysAgo} days.`;
  return `Health dropped to ${a.health.score}.`;
}

// ----------------------------------------------------------------------------
// Cohort card
// ----------------------------------------------------------------------------

interface CohortCardProps {
  icon: string;
  title: string;
  blurb: string;
  accounts: Account[];
  renderLine?: (a: Account) => React.ReactNode;
  onView: () => void;
  onApply?: () => void;
  accent: "atrisk" | "healthy" | "warn" | "pos" | "slate" | "info" | "neg" | "watch" | "thriving";
  emptyLine: string;
}

function CohortCard({
  icon,
  title,
  blurb,
  accounts,
  renderLine,
  onView,
  onApply,
  accent,
  emptyLine,
}: CohortCardProps) {
  const top = accounts.slice(0, 3);
  const mrr = accounts.reduce((sum, a) => sum + a.revenue.mrr, 0);
  const accentClasses = `accent-t ${accent}`;
  const extraStyle = accent === "slate" ? { borderTopColor: "var(--n-7)" } : undefined;
  return (
    <Card padded className={accentClasses} style={extraStyle}>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-3)" }}>
        <header style={{ display: "flex", alignItems: "center", gap: "var(--s-2)" }}>
          <span className={`icon-chip ${accent}`} aria-hidden>
            <Icon name={icon} />
          </span>
          <span style={{ font: "var(--t-meta)", color: "var(--text-3, var(--text))", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            {title}
          </span>
          <span style={{ marginLeft: "auto", font: "var(--t-meta)", color: "var(--text-3, var(--text))" }}>
            <Mono>{accounts.length}</Mono>
            {mrr > 0 ? <> · <Mono>{fmtMoney(mrr)}</Mono></> : null}
          </span>
        </header>

        <p style={{ font: "var(--t-body)", color: "var(--text-2, var(--text))", margin: 0 }}>
          {blurb}
        </p>

        {top.length ? (
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "var(--s-2)" }}>
            {top.map((a) => (
              <li
                key={a.identity.id}
                style={{
                  display: "flex",
                  gap: "var(--s-2)",
                  alignItems: "baseline",
                  font: "var(--t-body)",
                  color: "var(--text)",
                }}
              >
                <span style={{ fontWeight: 500 }}>{a.identity.name}</span>
                <span style={{ color: "var(--text-3, var(--text))", fontSize: 13, flex: 1, minWidth: 0 }}>
                  {renderLine ? renderLine(a) : reasonFor(a)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ font: "var(--t-body-sm)", color: "var(--text-2, var(--text))", margin: 0 }}>
            {emptyLine}
          </p>
        )}

        <div style={{ marginTop: "var(--s-1)", display: "flex", gap: "var(--s-2)" }}>
          <Button variant="ghost" size="sm" onClick={onView} icon={<Icon name="arrow-right" />}>
            View all
          </Button>
          {onApply && accounts.length > 0 ? (
            <Button variant="secondary" size="sm" onClick={onApply} icon={<Icon name="book-open" />}>
              Apply a Playbook
            </Button>
          ) : null}
        </div>
      </div>
    </Card>
  );
}

// ----------------------------------------------------------------------------
// Page
// ----------------------------------------------------------------------------

export default function TodayPage() {
  const navigate = useNavigate();
  const [drawerScope, setDrawerScope] = useState<DrawerScope | null>(null);
  const openApply = (accs: Account[], suggested?: string) =>
    setDrawerScope({
      kind: "accounts",
      accountIds: accs.map((a) => a.identity.id),
      suggested,
    });


  const queue = useMemo(() => atRiskByUrgency().slice(0, 8), []);
  const renewingAtRisk = useMemo(
    () =>
      renewalsWindow(0, 30).filter(
        (a) => a.health.band === "atrisk" || a.health.band === "watch",
      ),
    [],
  );
  const failed = useMemo(() => failedPayments(), []);
  const lostSticky = useMemo(() => lostStickySetups(), []);
  const stalled = useMemo(() => stalledOnboarding(), []);
  const dormantUp = useMemo(() => dormantGrowth(), []);
  const goneQuiet = useMemo(
    () =>
      atRiskByUrgency()
        .filter(
          (a) => a.login.lastLoginDaysAgo >= 21 && a.lifecycle.stage !== "onboarding",
        )
        .slice(0, 6),
    [],
  );

  const rollup = useMemo(() => agencyRollup(), []);
  const dist = useMemo(() => healthDistribution(), []);
  const liveCount = rollup.liveAccounts || 1;

  const briefingLine = useMemo(() => {
    const parts: string[] = [];
    if (lostSticky.length)
      parts.push(`${lostSticky.length} just lost a sticky setup — heaviest regression signal`);
    if (failed.length) parts.push(`${failed.length} with failed payments`);
    if (renewingAtRisk.length)
      parts.push(`${renewingAtRisk.length} at-risk accounts renew in ≤30 days`);
    return parts.join(" · ") || "Quiet night — nothing urgent.";
  }, [lostSticky.length, failed.length, renewingAtRisk.length]);

  const topReason = queue[0]
    ? reasonFor(queue[0])
    : "All clear — nothing urgent on the board.";
  const topTone: "pos" | "watch" | "risk" =
    queue[0]?.health.band === "atrisk"
      ? "risk"
      : queue[0]
      ? "watch"
      : "pos";

  const [handled, setHandled] = useState<Set<string>>(new Set());
  const toggleHandled = (id: string) =>
    setHandled((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  const activeQueue = queue.filter((a) => !handled.has(a.identity.id));
  const handledCount = queue.filter((a) => handled.has(a.identity.id)).length;

  const initials = (name: string) =>
    name
      .split(/\s+/)
      .map((w) => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase();

  const bandColor = (band: Account["health"]["band"]) =>
    band === "thriving"
      ? "var(--health-thriving-strong)"
      : band === "healthy"
      ? "var(--health-healthy-strong)"
      : band === "watch"
      ? "var(--health-watch-strong)"
      : "var(--health-atrisk-strong)";

  const renderQueueRow = (a: Account) => {
    const days = daysUntil(a.revenue.renewalDate);
    const breach = days >= 0 && days <= 7;
    const isHandled = handled.has(a.identity.id);
    return (
      <div
        key={a.identity.id}
        className="queue-row"
        style={{
          opacity: isHandled ? 0.5 : 1,
          textDecoration: isHandled ? "line-through" : "none",
        }}
      >
        <input
          type="checkbox"
          aria-label={`Mark ${a.identity.name} handled`}
          checked={isHandled}
          onChange={() => toggleHandled(a.identity.id)}
          style={{ flexShrink: 0, width: 16, height: 16, cursor: "pointer" }}
        />
        <span
          aria-hidden
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 28,
            height: 28,
            borderRadius: 999,
            background: "var(--surface-2)",
            color: "var(--text-2, var(--text))",
            fontSize: 11,
            fontWeight: 600,
            flexShrink: 0,
          }}
        >
          {initials(a.identity.name)}
        </span>
        <span
          aria-hidden
          title={bandLabel(a.health.band)}
          style={{
            width: 8,
            height: 8,
            borderRadius: 999,
            background: bandColor(a.health.band),
            flexShrink: 0,
          }}
        />
        <div style={{ flex: 1, minWidth: 0, fontSize: 14 }}>
          <strong style={{ color: "var(--text)", fontWeight: 600 }}>{a.identity.name}</strong>{" "}
          <span style={{ color: "var(--text-2, var(--text))" }}>· {reasonFor(a)}</span>
        </div>
        <span className="queue-impact">{fmtMoney(a.revenue.mrr)}</span>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontVariantNumeric: "tabular-nums",
            fontSize: 11,
            fontWeight: 600,
            padding: "3px 8px",
            borderRadius: 999,
            background: breach ? "var(--health-atrisk-soft)" : "var(--surface-2)",
            color: breach ? "var(--health-atrisk-strong)" : "var(--text-2, var(--text))",
            flexShrink: 0,
          }}
        >
          {days >= 0 ? `${days}d to renewal` : `${Math.abs(days)}d overdue`}
        </span>
        <span style={{ display: "inline-flex", gap: "var(--s-1)", flexShrink: 0 }}>
          <Button
            size="sm"
            variant="primary"
            icon={<Icon name="book-open" />}
            onClick={() => openApply([a])}
          >
            Apply play
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => navigate(`/accounts/${a.identity.id}`)}
          >
            Open
          </Button>
        </span>
      </div>
    );
  };


  const teamMembers = [
    {
      name: "Sinan",
      stats: [
        { v: 4, l: "open" },
        { v: 1, l: "due", tone: "warn" },
      ],
    },
    {
      name: "Maya",
      stats: [
        { v: 3, l: "open" },
        { v: 2, l: "breach", tone: "neg" },
      ],
    },
    {
      name: "Auto",
      stats: [{ v: 6, l: "handled overnight", tone: "pos" }],
    },
  ];

  return (
    <main
      style={{
        padding: "var(--s-8) var(--s-6)",
        maxWidth: 1280,
        margin: "0 auto",
        color: "var(--text)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--s-7)",
      }}
    >
      {/* 1 — Briefing ribbon (tinted band) */}
      <section
        aria-label="Briefing"
        style={{
          background:
            "linear-gradient(180deg, var(--blue-2, var(--surface-2)) 0%, var(--surface) 100%)",
          borderRadius: "var(--r-lg)",
          padding: "var(--s-5) var(--s-5) var(--s-4)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--s-3)",
        }}
      >
        <PageRibbon
          title={greetingFor("there")}
          description={briefingLine}
          trailing={<LiveStatus state="fresh" label="Synced moments ago" />}
          kpis={[
            { label: "On the board", value: <Mono>{activeQueue.length}</Mono> },
            { label: "MRR at risk", value: <Mono>{fmtMoney(rollup.mrrAtRisk)}</Mono> },
            { label: "Renewals · 30d", value: <Mono>{renewalsWindow(0, 30).length}</Mono> },
          ]}
        />
        <Verdict tone={topTone}>{topReason}</Verdict>
      </section>

      {/* 2 — Urgency queue (the visual focus) */}
      <section
        aria-label="Today's queue"
        id="urgency-queue"
        style={{ display: "flex", flexDirection: "column", gap: "var(--s-3)" }}
      >
        <header
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            gap: "var(--s-3)",
          }}
        >
          <h2 style={{ font: "var(--t-h3)", margin: 0 }}>Today's queue</h2>
          <span style={{ font: "var(--t-meta)", color: "var(--text-2, var(--text))" }}>
            <Mono>{handledCount}</Mono> of <Mono>{queue.length}</Mono> handled today
          </span>
        </header>
        <Card padded={false}>
          {activeQueue.length ? (
            <div>{activeQueue.map(renderQueueRow)}</div>
          ) : (
            <div
              style={{
                padding: "var(--s-6)",
                textAlign: "center",
                color: "var(--text-2, var(--text))",
                font: "var(--t-body)",
              }}
            >
              All caught up — no one needs you right now.
            </div>
          )}
        </Card>
      </section>


      {/* 3 — Problem cohorts */}
      <section aria-label="Act by problem" style={{ display: "flex", flexDirection: "column", gap: "var(--s-3)" }}>
        <header style={{ display: "flex", flexDirection: "column", gap: "var(--s-1)" }}>
          <h2 style={{ font: "var(--t-h3)", margin: 0 }}>Act by problem</h2>
          <p style={{ font: "var(--t-body)", color: "var(--text-3, var(--text))", margin: 0 }}>
            GoCSM grouped these accounts because they share the same problem.
          </p>
        </header>
        <div
          style={{
            display: "grid",
            gap: "var(--s-3)",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          }}
        >
          <CohortCard
            icon="alert-triangle"
            title="Setup lost — may be leaving"
            blurb="A sticky setup (domain, A2P, funnel) just went backwards. Heaviest regression signal."
            accounts={lostSticky}
            accent="atrisk"
            emptyLine="All setups holding steady — nothing sliding backward."
            renderLine={(a) => {
              const sig = signalsForAccount(a.identity.id).find(
                (s) => s.sticky && s.direction === "reverse",
              );
              return sig
                ? `${sig.label.toLowerCase()} — may be moving to another platform`
                : "lost a sticky setup";
            }}
            onView={() => navigate("/accounts")}
            onApply={() => openApply(lostSticky, "pb-save-domain")}
          />
          <CohortCard
            icon="calendar-clock"
            title="Renewing soon & at risk"
            blurb="At-risk or watch accounts with a renewal in the next 30 days."
            accounts={renewingAtRisk}
            accent="healthy"
            emptyLine="No renewals in danger — the pipeline looks calm."
            renderLine={(a) => `renews in ${daysUntil(a.revenue.renewalDate)}d · ${bandLabel(a.health.band)}`}
            onView={() => navigate("/accounts?renewing=30")}
            onApply={() => openApply(renewingAtRisk, "pb-no-login")}
          />
          <CohortCard
            icon="credit-card"
            title="Payment failed"
            blurb="Cards declined or invoices unpaid in the last cycle."
            accounts={failed}
            accent="atrisk"
            emptyLine="Payments are flowing — no cards need attention."
            renderLine={(a) => `${a.revenue.paymentAttempts.filter(p => p.status === "failed").length || 1} failed attempt(s)`}
            onView={() => navigate("/accounts")}
            onApply={() => openApply(failed, "pb-payment-failed")}
          />
          <CohortCard
            icon="moon"
            title="Gone quiet"
            blurb="No meaningful logins for 3+ weeks."
            accounts={goneQuiet}
            accent="slate"
            emptyLine="Everyone’s still showing up — no one’s gone dark."
            renderLine={(a) => `last login ${a.login.lastLoginDaysAgo}d ago`}
            onView={() => navigate("/accounts")}
            onApply={() => openApply(goneQuiet, "pb-no-login")}
          />
          <CohortCard
            icon="rocket"
            title="Onboarding stalled"
            blurb="New accounts stuck on a setup step past SLA."
            accounts={stalled}
            accent="warn"
            emptyLine="New accounts are moving — no one stuck at the gate."
            renderLine={(a) =>
              `stuck on "${a.onboarding.current_step}" for ${a.onboarding.days_on_current_step}d`
            }
            onView={() => navigate("/onboarding")}
            onApply={() => openApply(stalled, "pb-onboarding-stalled")}
          />
          <CohortCard
            icon="sparkles"
            title="Coming back to life"
            blurb="Dormant accounts trending up — worth a warm nudge."
            accounts={dormantUp}
            accent="pos"
            emptyLine="No comebacks yet — your saves are holding."
            renderLine={(a) => `health +${a.health.delta} this week`}
            onView={() => navigate("/accounts")}
            onApply={() => openApply(dormantUp, "pb-expansion-ready")}
          />
        </div>
      </section>

      {/* 4 — Money / counts strip */}
      <section aria-label="Agency rollup" style={{ display: "flex", flexDirection: "column", gap: "var(--s-3)" }}>
        <h2 style={{ font: "var(--t-h3)", margin: 0 }}>The book, in numbers</h2>
        <div
          style={{
            display: "grid",
            gap: "var(--s-3)",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          }}
        >
          <MetricCard
            label="Total MRR"
            value={<Mono>{fmtMoney(rollup.mrr)}</Mono>}
            icon={<Icon name="wallet" />}
            iconTone="pos"
            delta={<Delta value="+4%" direction="up" />}
            context="vs last month"
          />
          <MetricCard
            label="MRR at risk"
            value={<Mono>{fmtMoney(rollup.mrrAtRisk)}</Mono>}
            icon={<Icon name="alert-triangle" />}
            iconTone="neg"
            accent="neg"
            delta={<Delta value={`${Math.round((rollup.mrrAtRisk / Math.max(1, rollup.mrr)) * 100)}%`} direction="bad-up" />}
            context="of total MRR"
          />
          <MetricCard
            label="At-risk accounts"
            value={<Mono>{dist.atrisk}</Mono>}
            icon={<Icon name="users" />}
            iconTone="warn"
            delta={<Delta value={`${Math.round((dist.atrisk / liveCount) * 100)}%`} direction="bad-up" />}
            context="of the book"
          />
          <MetricCard
            label="Renewals · 30d"
            value={<Mono>{renewalsWindow(0, 30).length}</Mono>}
            icon={<Icon name="calendar-clock" />}
            iconTone="info"
            delta={<Delta value={`${renewingAtRisk.length} at risk`} direction="flat" />}
            context="of those renewing"
          />
        </div>

        <div
          style={{
            display: "grid",
            gap: "var(--s-3)",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          }}
        >
          {(["thriving", "healthy", "watch", "atrisk"] as const).map((b) => (
            <HealthTile
              key={b}
              band={b}
              count={<Mono>{dist[b]}</Mono>}
              pct={`${Math.round((dist[b] / liveCount) * 100)}%`}
              label={bandLabel(b)}
            />
          ))}
        </div>
      </section>

      {/* 5 — Team pulse */}
      <section aria-label="Team pulse">
        <TeamPulseStrip
          title="Team pulse"
          sub="What humans are carrying today"
          load={{ open: 7, due: 3, breach: 2 }}
          members={teamMembers}
          escalations={[
            { text: "Modern Physio — renewal call needs an owner (Sinan)" },
          ]}
        />
      </section>

      <PlaybookActivationDrawer
        open={!!drawerScope}
        scope={drawerScope}
        accounts={allAccounts()}
        onClose={() => setDrawerScope(null)}
      />
    </main>
  );
}
