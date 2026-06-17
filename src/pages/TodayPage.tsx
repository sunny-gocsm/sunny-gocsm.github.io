import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BriefingHeader,
  Card,
  Button,
  Icon,
  Mono,
  MetricCard,
  Delta,
  HealthTile,
  MyQueue,
  QueueRow,
  TeamPulseStrip,
  Verdict,
  LiveStatus,
} from "@/gocsm-ds";
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
  heavy?: boolean;
}

function CohortCard({
  icon,
  title,
  blurb,
  accounts,
  renderLine,
  onView,
  heavy,
}: CohortCardProps) {
  const top = accounts.slice(0, 3);
  const mrr = accounts.reduce((sum, a) => sum + a.revenue.mrr, 0);
  return (
    <Card padded>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-3)" }}>
        <header style={{ display: "flex", alignItems: "center", gap: "var(--s-2)" }}>
          <span
            aria-hidden
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 28,
              height: 28,
              borderRadius: 8,
              background: heavy ? "var(--red-1, var(--surface-2))" : "var(--surface-2)",
              color: heavy ? "var(--red-7, var(--text))" : "var(--text-2, var(--text))",
            }}
          >
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
          <p style={{ font: "var(--t-meta)", color: "var(--text-3, var(--text))", margin: 0 }}>
            Nothing in this group right now.
          </p>
        )}

        <div style={{ marginTop: "var(--s-1)" }}>
          <Button variant="ghost" size="sm" onClick={onView} icon={<Icon name="arrow-right" />}>
            View all
          </Button>
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

  const queueNode = (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-2)" }}>
      {queue.map((a) => {
        const days = daysUntil(a.revenue.renewalDate);
        const breach = days >= 0 && days <= 7;
        return (
          <QueueRow
            key={a.identity.id}
            subject={
              <span>
                <strong style={{ color: "var(--text)" }}>{a.identity.name}</strong>{" "}
                <span style={{ color: "var(--text-3, var(--text))" }}>· {reasonFor(a)}</span>
              </span>
            }
            impact={<Mono>{fmtMoney(a.revenue.mrr)}</Mono>}
            blockedBy={a.onboarding.blocked_by ?? undefined}
            sla={days >= 0 ? `${days}d to renewal` : `${Math.abs(days)}d overdue`}
            slaBreach={breach}
            action={
              <Button
                size="sm"
                variant="secondary"
                onClick={() => navigate(`/accounts/${a.identity.id}`)}
              >
                Open
              </Button>
            }
          />
        );
      })}
    </div>
  );

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
      {/* 1 — Briefing */}
      <section aria-label="Briefing" style={{ display: "flex", flexDirection: "column", gap: "var(--s-4)" }}>
        <BriefingHeader
          greeting={`${greetingFor("there")} Here's what GoCSM did overnight, and what needs you today.`}
          promise={briefingLine}
          sync={<LiveStatus state="fresh" label="Synced moments ago" />}
        />
        <Verdict tone={queue[0]?.health.band === "atrisk" ? "risk" : "watch"}>
          {topReason}
        </Verdict>
      </section>

      {/* 2 — Urgency queue */}
      <section aria-label="Urgency queue" id="urgency-queue">
        <MyQueue
          member="Today"
          scope={queue.length}
          queue={queueNode}
          empty="All caught up — no one needs you right now."
        />
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
            renderLine={(a) => {
              const sig = signalsForAccount(a.identity.id).find(
                (s) => s.sticky && s.direction === "reverse",
              );
              return sig
                ? `${sig.label.toLowerCase()} — may be moving to another platform`
                : "lost a sticky setup";
            }}
            onView={() => navigate("/accounts")}
            heavy
          />
          <CohortCard
            icon="calendar-clock"
            title="Renewing soon & at risk"
            blurb="At-risk or watch accounts with a renewal in the next 30 days."
            accounts={renewingAtRisk}
            renderLine={(a) => `renews in ${daysUntil(a.revenue.renewalDate)}d · ${bandLabel(a.health.band)}`}
            onView={() => navigate("/accounts?renewing=30")}
          />
          <CohortCard
            icon="credit-card"
            title="Payment failed"
            blurb="Cards declined or invoices unpaid in the last cycle."
            accounts={failed}
            renderLine={(a) => `${a.revenue.paymentAttempts.filter(p => p.status === "failed").length || 1} failed attempt(s)`}
            onView={() => navigate("/accounts")}
          />
          <CohortCard
            icon="moon"
            title="Gone quiet"
            blurb="No meaningful logins for 3+ weeks."
            accounts={goneQuiet}
            renderLine={(a) => `last login ${a.login.lastLoginDaysAgo}d ago`}
            onView={() => navigate("/accounts")}
          />
          <CohortCard
            icon="rocket"
            title="Onboarding stalled"
            blurb="New accounts stuck on a setup step past SLA."
            accounts={stalled}
            renderLine={(a) =>
              `stuck on "${a.onboarding.current_step}" for ${a.onboarding.days_on_current_step}d`
            }
            onView={() => navigate("/onboarding")}
          />
          <CohortCard
            icon="sparkles"
            title="Coming back to life"
            blurb="Dormant accounts trending up — worth a warm nudge."
            accounts={dormantUp}
            renderLine={(a) => `health +${a.health.delta} this week`}
            onView={() => navigate("/accounts")}
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
    </main>
  );
}
