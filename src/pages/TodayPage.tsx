import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  Button,
  Icon,
  Mono,
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

  const briefingLine = useMemo(() => {
    const parts: string[] = [];
    if (lostSticky.length)
      parts.push(`${lostSticky.length} ${lostSticky.length === 1 ? "account" : "accounts"} just lost a sticky setup — biggest backwards move`);
    if (failed.length) parts.push(`${failed.length} with failed payment${failed.length === 1 ? "" : "s"}`);
    if (renewingAtRisk.length)
      parts.push(`${renewingAtRisk.length} at-risk account${renewingAtRisk.length === 1 ? "" : "s"} renew in ≤30 days`);
    return parts.join(" · ") || "Quiet night — nothing urgent.";
  }, [lostSticky.length, failed.length, renewingAtRisk.length]);

  // ---- Needs you: prioritized list of human-required actions ----
  type NeedsYouMode = "play" | "human";
  interface NeedsYouItem {
    id: string;
    account: Account;
    problem: string;
    urgencyLabel?: string;
    urgencyHot?: boolean;
    helper: string;
    mode: NeedsYouMode;
    actionLabel: string;
    playId?: string;
  }

  const needsYouAll: NeedsYouItem[] = useMemo(() => {
    const failedIds = new Set(failed.map((a) => a.identity.id));
    const lostIds = new Set(lostSticky.map((a) => a.identity.id));
    const stalledIds = new Set(stalled.map((a) => a.identity.id));
    const goneQuietIds = new Set(goneQuiet.map((a) => a.identity.id));

    return queue.map<NeedsYouItem>((a) => {
      const days = daysUntil(a.revenue.renewalDate);
      const urgencyHot = days >= 0 && days <= 7;
      const urgencyLabel =
        days >= 0 ? `Renews in ${days} ${days === 1 ? "day" : "days"}` : `${Math.abs(days)}d overdue`;
      const problem = reasonFor(a);

      // Failed payment → exhausted automation, needs a call
      if (failedIds.has(a.identity.id)) {
        const attempts = a.revenue.paymentAttempts.filter((p) => p.status === "failed").length || 3;
        return {
          id: a.identity.id,
          account: a,
          problem,
          urgencyLabel,
          urgencyHot,
          helper: `GoCSM tried dunning (${attempts} retries) — it needs you now.`,
          mode: "human",
          actionLabel: `Call ${a.identity.name}`,
        };
      }

      // Lost sticky setup → fixable with a save play
      if (lostIds.has(a.identity.id)) {
        return {
          id: a.identity.id,
          account: a,
          problem,
          urgencyLabel,
          urgencyHot,
          helper: "GoCSM suggests: Save the setup",
          mode: "play",
          actionLabel: "Win them back",
          playId: "pb-save-domain",
        };
      }

      // Onboarding stalled → unblock
      if (stalledIds.has(a.identity.id)) {
        return {
          id: a.identity.id,
          account: a,
          problem: `Stuck on "${a.onboarding.current_step}" for ${a.onboarding.days_on_current_step}d`,
          urgencyLabel,
          urgencyHot,
          helper: "GoCSM suggests: Unblock onboarding",
          mode: "play",
          actionLabel: "Unblock setup",
          playId: "pb-onboarding-stalled",
        };
      }

      // Renewal near + at risk → call
      if (urgencyHot && a.health.band === "atrisk") {
        return {
          id: a.identity.id,
          account: a,
          problem,
          urgencyLabel,
          urgencyHot,
          helper: "GoCSM tried reminders — it needs you now.",
          mode: "human",
          actionLabel: `Call ${a.identity.name}`,
        };
      }

      // Gone quiet → check-in
      if (goneQuietIds.has(a.identity.id)) {
        return {
          id: a.identity.id,
          account: a,
          problem,
          urgencyLabel,
          urgencyHot,
          helper: "GoCSM suggests: Send a check-in",
          mode: "play",
          actionLabel: "Send a check-in",
          playId: "pb-no-login",
        };
      }

      // Default: a play can still help
      return {
        id: a.identity.id,
        account: a,
        problem,
        urgencyLabel,
        urgencyHot,
        helper: "GoCSM suggests: Send a check-in",
        mode: "play",
        actionLabel: "Send a check-in",
        playId: "pb-no-login",
      };
    });
  }, [queue, failed, lostSticky, stalled, goneQuiet]);

  const [handled, setHandled] = useState<Set<string>>(new Set());
  const markHandled = (id: string, reason: "applied" | "called" | "dismissed") => {
    setHandled((prev) => new Set(prev).add(id));
    const item = needsYouAll.find((n) => n.id === id);
    const title =
      reason === "applied"
        ? "Play queued"
        : reason === "called"
        ? "Marked as handled"
        : "Cleared from today";
    toast({
      title,
      description: item ? `${item.account.identity.name} cleared from today.` : undefined,
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

  const runPlay = (item: NeedsYouItem) => {
    openApply([item.account], item.playId);
    markHandled(item.id, "applied");
  };
  const logHuman = (item: NeedsYouItem) => {
    markHandled(item.id, "called");
  };

  const activeNeeds = needsYouAll.filter((n) => !handled.has(n.id));
  const visibleNeeds = activeNeeds.slice(0, 5);
  const overflowCount = Math.max(0, activeNeeds.length - visibleNeeds.length);
  const totalNeeds = needsYouAll.length;
  const handledCount = needsYouAll.filter((n) => handled.has(n.id)).length;

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

  const renderNeedsYouRow = (item: NeedsYouItem) => {
    const a = item.account;
    const onRowClick = () => navigate(`/accounts/${a.identity.id}`);
    const stop = (e: React.MouseEvent) => e.stopPropagation();
    return (
      <div
        key={item.id}
        className="queue-row"
        role="button"
        tabIndex={0}
        onClick={onRowClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onRowClick();
          }
        }}
        style={{ cursor: "pointer", alignItems: "flex-start", padding: "var(--s-3) var(--s-4)" }}
      >
        <span
          aria-hidden
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 32,
            height: 32,
            borderRadius: 999,
            background: "var(--surface-2)",
            color: "var(--text-2, var(--text))",
            fontSize: 11,
            fontWeight: 600,
            flexShrink: 0,
            marginTop: 2,
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
            marginTop: 14,
          }}
        />
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "var(--s-2)", flexWrap: "wrap" }}>
            <strong style={{ color: "var(--text)", fontWeight: 600, fontSize: 14 }}>
              {a.identity.name}
            </strong>
            <span style={{ color: "var(--text-2, var(--text))", fontSize: 13 }}>· {item.problem}</span>
            {item.urgencyLabel ? (
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontVariantNumeric: "tabular-nums",
                  fontSize: 11,
                  fontWeight: 600,
                  padding: "2px 8px",
                  borderRadius: 999,
                  background: item.urgencyHot ? "var(--health-atrisk-soft)" : "var(--surface-2)",
                  color: item.urgencyHot ? "var(--health-atrisk-strong)" : "var(--text-2, var(--text))",
                }}
              >
                {item.urgencyLabel}
              </span>
            ) : null}
          </div>
          <span style={{ font: "var(--t-meta)", color: "var(--text-2, var(--text))" }}>
            {item.helper}
          </span>
        </div>
        <span
          style={{ display: "inline-flex", gap: "var(--s-2)", flexShrink: 0, alignItems: "center" }}
          onClick={stop}
        >
          <Button
            size="sm"
            variant="primary"
            icon={<Icon name={item.mode === "human" ? "phone" : "play"} />}
            onClick={() => (item.mode === "play" ? runPlay(item) : logHuman(item))}
          >
            {item.actionLabel}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            title="Clear this row from today"
            onClick={() => markHandled(item.id, "dismissed")}
          >
            Not now
          </Button>
        </span>
      </div>
    );
  };






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
      </section>

      <ReassuranceLine onOpenAccount={(id) => navigate(`/accounts/${id}`)} />


      {/* 3 — Needs you */}
      <section
        aria-label="Needs you"
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
                Needs you
              </h2>
              <p style={{ font: "var(--t-body-sm)", color: "var(--text-2, var(--text))", margin: 0 }}>
                Accounts where a human is still required — most urgent first.
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



      {/* 4 — Fix a problem */}
      <section aria-label="Fix a problem" style={{ display: "flex", flexDirection: "column", gap: "var(--s-3)" }}>
        <header style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <h2 style={{ font: "var(--t-h3)", margin: 0, color: "var(--text)", fontWeight: 600 }}>
            Fix a problem
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

      <PlaybookActivationDrawer
        open={!!drawerScope}
        scope={drawerScope}
        accounts={allAccounts()}
        onClose={() => setDrawerScope(null)}
      />
    </main>
  );
}
