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
  LiveStatus,
} from "@/gocsm-ds";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
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
import { outcomes as allOutcomes, outcomeAccount, outcomePlaybook } from "@/fixtures/outcomes";



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
          <span style={{ font: "var(--t-h5, var(--t-body))", color: "var(--text)", fontWeight: 600 }}>
            {title}
          </span>
          <span style={{ marginLeft: "auto", font: "var(--t-meta)", color: "var(--text-2, var(--text))" }}>
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
                <span style={{ color: "var(--text-2, var(--text))", fontSize: 13, flex: 1, minWidth: 0 }}>
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
          {onApply && accounts.length > 0 ? (
            <Button variant="primary" size="sm" onClick={onApply} icon={<Icon name="book-open" />}>
              Apply a Playbook
            </Button>
          ) : null}
          <Button variant="ghost" size="sm" onClick={onView} icon={<Icon name="arrow-right" />}>
            View all
          </Button>
        </div>
      </div>
    </Card>
  );
}

// ----------------------------------------------------------------------------
// Reassurance line (collapsed recap)
// ----------------------------------------------------------------------------

interface RecapItem {
  id: string;
  accountId: string;
  accountName: string;
  did: string;
  outcome: string;
  tag: "Autopilot" | "You approved";
  amount?: number;
}

function fmtMoneySmall(n: number) {
  return "$" + Math.round(n).toLocaleString();
}

function ReassuranceLine({
  onOpenAccount,
}: {
  onOpenAccount: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);

  const recent = allOutcomes.filter((o) => o.daysAgo <= 7);
  const autopilot = recent.filter((o) => o.attribution === "playbook-solo");
  const approved = recent.filter((o) => o.attribution === "playbook-assist");

  const totalHandled = autopilot.length + approved.length;
  const protectedAmount =
    autopilot.reduce((s, o) => s + (o.amount ?? 0), 0) +
    approved.reduce((s, o) => s + (o.amount ?? 0), 0);

  const items: RecapItem[] = [
    ...autopilot.slice(0, 3).map<RecapItem>((o) => {
      const acc = outcomeAccount(o);
      return {
        id: o.id,
        accountId: acc?.identity.id ?? "",
        accountName: acc?.identity.name ?? "Account",
        did: outcomePlaybook(o)?.title ?? "Playbook ran",
        outcome:
          o.amount != null
            ? `recovered ${fmtMoneySmall(o.amount)} — no touch needed`
            : `${o.lead.toLowerCase().replace(/\.$/, "")} — no touch needed`,
        tag: "Autopilot",
        amount: o.amount,
      };
    }),
    ...approved.slice(0, 3).map<RecapItem>((o) => {
      const acc = outcomeAccount(o);
      return {
        id: o.id,
        accountId: acc?.identity.id ?? "",
        accountName: acc?.identity.name ?? "Account",
        did: outcomePlaybook(o)?.title ?? "Playbook ran",
        outcome:
          o.amount != null
            ? `saved ${fmtMoneySmall(o.amount)} — you approved the note`
            : `${o.lead.toLowerCase().replace(/\.$/, "")} — you approved the note`,
        tag: "You approved",
        amount: o.amount,
      };
    }),
  ];

  const tagStyle = (tag: RecapItem["tag"]): React.CSSProperties => {
    const map = {
      Autopilot: { bg: "var(--pos-soft)", fg: "var(--pos-7)" },
      "You approved": { bg: "var(--info-soft, var(--blue-2))", fg: "var(--info-7, var(--text))" },
    } as const;
    const c = map[tag];
    return {
      font: "var(--t-meta)",
      fontWeight: 600,
      padding: "2px 8px",
      borderRadius: 999,
      background: c.bg,
      color: c.fg,
      whiteSpace: "nowrap",
    };
  };

  return (
    <Card padded>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--s-3)",
          flexWrap: "wrap",
        }}
      >
        <span className="icon-chip pos" aria-hidden>
          <Icon name="shield-check" />
        </span>
        <span style={{ flex: 1, minWidth: 0, font: "var(--t-body)", color: "var(--text)" }}>
          GoCSM handled <strong style={{ fontWeight: 600 }}><Mono>{totalHandled}</Mono> things</strong> overnight and protected{" "}
          <strong style={{ fontWeight: 600 }}><Mono>{fmtMoneySmall(protectedAmount)}</Mono></strong> this week.
        </span>
        <Button
          variant="ghost"
          size="sm"
          icon={<Icon name={open ? "chevron-up" : "arrow-right"} />}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? "Hide" : "See what it did"}
        </Button>
      </div>

      {open ? (
        <div style={{ marginTop: "var(--s-4)", display: "flex", flexDirection: "column", gap: "var(--s-2)" }}>
          {items.length === 0 ? (
            <p style={{ font: "var(--t-body-sm)", color: "var(--text-2, var(--text))", margin: 0 }}>
              Quiet week — nothing verified yet. We'll log wins here as downstream signals confirm them.
            </p>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  gap: "var(--s-3)",
                  alignItems: "flex-start",
                  padding: "var(--s-3)",
                  borderRadius: "var(--r-md)",
                  background: "var(--surface)",
                  borderLeft:
                    item.tag === "Autopilot"
                      ? "3px solid var(--pos-7)"
                      : "3px solid var(--info-7, var(--blue-7, var(--text-2)))",
                }}
              >
                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--s-2)", flexWrap: "wrap" }}>
                    <strong style={{ color: "var(--text)", fontWeight: 600 }}>{item.accountName}</strong>
                    <span style={tagStyle(item.tag)}>{item.tag}</span>
                  </div>
                  <span style={{ font: "var(--t-body-sm)", color: "var(--text-2, var(--text))" }}>
                    GoCSM: {item.did} — <span style={{ color: "var(--text)" }}>{item.outcome}</span>
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<Icon name="arrow-right" />}
                  onClick={() => onOpenAccount(item.accountId)}
                >
                  See log
                </Button>
              </div>
            ))
          )}
          <p
            style={{
              margin: "var(--s-2) 0 0",
              font: "var(--t-meta)",
              color: "var(--text-2, var(--text))",
              fontStyle: "italic",
            }}
          >
            Wins are only counted when a downstream signal confirmed the change.
          </p>
        </div>
      ) : null}
    </Card>
  );
}

// ----------------------------------------------------------------------------
// Page
// ----------------------------------------------------------------------------

export default function TodayPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
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
      parts.push(`${lostSticky.length} ${lostSticky.length === 1 ? "account" : "accounts"} just lost a sticky setup — biggest backwards move`);
    if (failed.length) parts.push(`${failed.length} with failed payment${failed.length === 1 ? "" : "s"}`);
    if (renewingAtRisk.length)
      parts.push(`${renewingAtRisk.length} at-risk account${renewingAtRisk.length === 1 ? "" : "s"} renew in ≤30 days`);
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
  const markHandled = (id: string, reason: "applied" | "dismissed") => {
    setHandled((prev) => new Set(prev).add(id));
    const acc = queue.find((a) => a.identity.id === id);
    toast({
      title: reason === "applied" ? "Play queued for this account" : "Marked done",
      description: acc ? `${acc.identity.name} cleared from today.` : undefined,
      action: (
        <ToastAction
          altText="Undo"
          onClick={() =>
            setHandled((prev) => {
              const next = new Set(prev);
              next.delete(id);
              return next;
            })
          }
        >
          Undo
        </ToastAction>
      ),
    });
  };
  const applyToOne = (a: Account) => {
    openApply([a]);
    markHandled(a.identity.id, "applied");
  };
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
    return (
      <div key={a.identity.id} className="queue-row">
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
            onClick={() => applyToOne(a)}
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
          <Button
            size="sm"
            variant="ghost"
            title="Clear this row from today"
            icon={<Icon name="check" />}
            onClick={() => markHandled(a.identity.id, "dismissed")}
          >
            Mark done
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

  const AiAttribution = (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "1px 6px",
        borderRadius: 999,
        background: "var(--ai-soft, var(--surface-2))",
        color: "var(--ai-strong, var(--text-2, var(--text)))",
        font: "var(--t-meta)",
        fontWeight: 600,
        marginRight: 6,
        verticalAlign: "baseline",
      }}
    >
      <Icon name="sparkles" />
      GoCSM AI
    </span>
  );

  return (
    <main
      style={{
        padding: "var(--s-8) var(--s-6)",
        maxWidth: 1280,
        margin: "0 auto",
        color: "var(--text)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--s-9, var(--s-8))",
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
          description={
            <span style={{ color: "var(--text-2, var(--text))" }}>
              {AiAttribution}
              {briefingLine}
            </span>
          }
          trailing={<LiveStatus state="fresh" label="Synced moments ago" />}
          kpis={[
            { label: "On the board", value: <Mono>{activeQueue.length}</Mono> },
            { label: "MRR at risk", value: <Mono>{fmtMoney(rollup.mrrAtRisk)}</Mono> },
            { label: "Renewals · 30d", value: <Mono>{renewalsWindow(0, 30).length}</Mono> },
          ]}
        />
        {queue[0] ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--s-3)",
              padding: "var(--s-2) var(--s-3)",
              borderRadius: "var(--r-md)",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              font: "var(--t-body-sm)",
              color: "var(--text)",
            }}
          >
            <span
              aria-hidden
              style={{
                width: 8,
                height: 8,
                borderRadius: 999,
                background:
                  topTone === "risk"
                    ? "var(--health-atrisk-strong)"
                    : topTone === "watch"
                    ? "var(--health-watch-strong)"
                    : "var(--pos-7)",
                flexShrink: 0,
              }}
            />
            <span style={{ flex: 1, minWidth: 0 }}>
              Highest priority right now: <strong style={{ fontWeight: 600 }}>{queue[0].identity.name}</strong> — {reasonFor(queue[0])}
            </span>
            <Button
              size="sm"
              variant="primary"
              icon={<Icon name="arrow-right" />}
              onClick={() => applyToOne(queue[0])}
            >
              Start here
            </Button>
          </div>
        ) : null}
      </section>

      <SinceLastReview onOpenAccount={(id) => navigate(`/accounts/${id}`)} failedAccounts={failed} />

      {/* 2 — Act by customer */}
      <section
        aria-label="Act by customer"
        id="urgency-queue"
        style={{ display: "flex", flexDirection: "column", gap: "var(--s-3)" }}
      >
        <header
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--s-2)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              gap: "var(--s-3)",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <h2 style={{ font: "var(--t-h3)", margin: 0, color: "var(--text)", fontWeight: 600 }}>
                Act by customer
              </h2>
              <p style={{ font: "var(--t-body-sm)", color: "var(--text-2, var(--text))", margin: 0 }}>
                Account by account, most urgent first.
              </p>
            </div>
            <span
              style={{
                font: "var(--t-meta)",
                color: handledCount > 0 ? "var(--pos-7)" : "var(--text-2, var(--text))",
                fontWeight: handledCount > 0 ? 600 : 400,
              }}
            >
              {handledCount === queue.length && queue.length > 0 ? "🎉 " : ""}
              <Mono>{handledCount}</Mono> of <Mono>{queue.length}</Mono> handled today
            </span>
          </div>
          {queue.length > 0 && (
            <div
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={queue.length}
              aria-valuenow={handledCount}
              style={{
                height: 6,
                borderRadius: 999,
                background: "var(--surface-2)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${(handledCount / queue.length) * 100}%`,
                  background:
                    "linear-gradient(90deg, var(--pos-soft) 0%, var(--pos-7) 100%)",
                  transition: "width 360ms ease",
                }}
              />
            </div>
          )}
        </header>
        <Card padded={false}>
          {activeQueue.length ? (
            <div>{activeQueue.map(renderQueueRow)}</div>
          ) : (
            <div
              style={{
                padding: "var(--s-6)",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "var(--s-2)",
                background:
                  "linear-gradient(135deg, var(--pos-soft) 0%, var(--blue-2) 100%)",
                borderRadius: 12,
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 999,
                  background: "var(--surface)",
                  color: "var(--pos-7)",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon name="check-circle" />
              </div>
              <strong style={{ font: "var(--t-h4)" }}>
                {handledCount > 0 ? "Inbox zero — nice work." : "All caught up."}
              </strong>
              <span style={{ font: "var(--t-meta)", color: "var(--text-2, var(--text))" }}>
                GoCSM is watching the board. We'll surface the next thing the moment it matters.
              </span>
            </div>
          )}
        </Card>
      </section>



      {/* 3 — Problem cohorts */}
      <section aria-label="Act by problem" style={{ display: "flex", flexDirection: "column", gap: "var(--s-3)" }}>
        <header style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <h2 style={{ font: "var(--t-h3)", margin: 0, color: "var(--text)", fontWeight: 600 }}>
            Act by problem
          </h2>
          <p style={{ font: "var(--t-body-sm)", color: "var(--text-2, var(--text))", margin: 0 }}>
            Grouped by the problem they share.
          </p>
        </header>
        <div
          style={{
            display: "grid",
            gap: "var(--s-3)",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          }}
        >
          {[
            {
              icon: "alert-triangle",
              title: "Setup lost — may be leaving",
              blurb: "A sticky setup (domain, A2P, funnel) just went backwards — the biggest backwards move on the board.",
              accounts: lostSticky,
              accent: "atrisk" as const,
              emptyLine: "All setups holding steady — nothing sliding backward.",
              renderLine: (a: Account) => {
                const sig = signalsForAccount(a.identity.id).find(
                  (s) => s.sticky && s.direction === "reverse",
                );
                return sig
                  ? `${sig.label.toLowerCase()} — may be moving to another platform`
                  : "lost a sticky setup";
              },
              onView: () => navigate("/accounts"),
              onApply: () => openApply(lostSticky, "pb-save-domain"),
            },
            {
              icon: "calendar-clock",
              title: "Renewing soon & at risk",
              blurb: "At-risk or watch accounts with a renewal in the next 30 days.",
              accounts: renewingAtRisk,
              accent: "healthy" as const,
              emptyLine: "No renewals in danger — the pipeline looks calm.",
              renderLine: (a: Account) => `renews in ${daysUntil(a.revenue.renewalDate)}d · ${bandLabel(a.health.band)}`,
              onView: () => navigate("/accounts?renewing=30"),
              onApply: () => openApply(renewingAtRisk, "pb-no-login"),
            },
            {
              icon: "credit-card",
              title: "Payment failed",
              blurb: "Cards declined or invoices unpaid in the last cycle.",
              accounts: failed,
              accent: "atrisk" as const,
              emptyLine: "Payments are flowing — no cards need attention.",
              renderLine: (a: Account) => `${a.revenue.paymentAttempts.filter((p: { status: string }) => p.status === "failed").length || 1} failed attempt(s)`,
              onView: () => navigate("/accounts"),
              onApply: () => openApply(failed, "pb-payment-failed"),
            },
            {
              icon: "moon",
              title: "Gone quiet",
              blurb: "No meaningful logins for 3+ weeks.",
              accounts: goneQuiet,
              accent: "slate" as const,
              emptyLine: "Everyone’s still showing up — no one’s gone dark.",
              renderLine: (a: Account) => `last login ${a.login.lastLoginDaysAgo}d ago`,
              onView: () => navigate("/accounts"),
              onApply: () => openApply(goneQuiet, "pb-no-login"),
            },
            {
              icon: "rocket",
              title: "Onboarding stalled",
              blurb: "New accounts stuck on a setup step past SLA.",
              accounts: stalled,
              accent: "warn" as const,
              emptyLine: "New accounts are moving — no one stuck at the gate.",
              renderLine: (a: Account) => `stuck on "${a.onboarding.current_step}" for ${a.onboarding.days_on_current_step}d`,
              onView: () => navigate("/onboarding"),
              onApply: () => openApply(stalled, "pb-onboarding-stalled"),
            },
            {
              icon: "sparkles",
              title: "Coming back to life",
              blurb: "Dormant accounts trending up — worth a warm nudge.",
              accounts: dormantUp,
              accent: "pos" as const,
              emptyLine: "No comebacks yet — your saves are holding.",
              renderLine: (a: Account) => `health +${a.health.delta} this week`,
              onView: () => navigate("/accounts"),
              onApply: () => openApply(dormantUp, "pb-expansion-ready"),
            },
          ]
            .sort((a, b) => b.accounts.length - a.accounts.length)
            .map((c) => (
              <CohortCard
                key={c.title}
                icon={c.icon}
                title={c.title}
                blurb={c.blurb}
                accounts={c.accounts}
                accent={c.accent}
                emptyLine={c.emptyLine}
                renderLine={c.renderLine}
                onView={c.onView}
                onApply={c.onApply}
              />
            ))}
        </div>
      </section>

      {/* 4 — Money / counts strip */}
      <section aria-label="Agency rollup" style={{ display: "flex", flexDirection: "column", gap: "var(--s-3)" }}>
        <h2 style={{ font: "var(--t-h3)", margin: 0, color: "var(--text)", fontWeight: 600 }}>The book, in numbers</h2>
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
