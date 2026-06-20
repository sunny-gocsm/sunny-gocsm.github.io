import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  Button,
  Icon,
  Mono,
  Badge,
  LiveStatus,
  BriefingHeader,
  Verdict,
  SignalCard,
  Queue,
  FixItCard,
  ActionButton,
  ActionReceipt,
  ActivityLog,
  MetricCard,
} from "@/gocsm-ds";
import { useIsAutopilot, useAllAutopilotOn, autopilotStore } from "@/state/autopilot";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import {
  autopilotSentEmails,
  pendingEmailsForPlaybooks,
  type AutopilotEmail,
} from "@/fixtures/autopilotActivity";
import {
  atRiskByUrgency,
  renewalsWindow,
  failedPayments,
  lostStickySetups,
  stalledOnboarding,
  dormantGrowth,
  upsellReady,
  agencyRollup,
  signalsForAccount,
  daysUntil,
  allAccounts,
  type Account,
} from "@/fixtures";
import { PlaybookActivationDrawer, type DrawerScope, type DrawerInitial } from "@/components/playbooks/PlaybookActivationDrawer";
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

function fmtMoneySmall(n: number) {
  return "$" + Math.round(n).toLocaleString();
}

// ----------------------------------------------------------------------------
// Cohort card — a "Fix a problem" cohort, rendered on the DS FixItCard.
// Kept as its own component so the per-cohort autopilot hook is legal.
// ----------------------------------------------------------------------------

interface CohortFixItCardProps {
  icon: string;
  title: string;
  tag: string;
  accounts: Account[];
  actionLabel: string;
  emptyLine: string;
  size?: "md" | "lg";
  playbookId?: string;
  onView: () => void;
  onApply?: () => void;
  onEditRule?: (playbookId: string) => void;
  onOpenHighLevel?: (playbookId: string) => void;
}

function CohortFixItCard({
  icon,
  title,
  tag,
  accounts,
  actionLabel,
  emptyLine,
  size = "md",
  playbookId,
  onView,
  onApply,
  onEditRule,
  onOpenHighLevel,
}: CohortFixItCardProps) {
  const { toast: t } = useToast();
  const onAutopilot = useIsAutopilot(playbookId ?? "");
  const mrr = accounts.reduce((sum, a) => sum + a.revenue.mrr, 0);
  const count = accounts.length;

  if (count === 0) {
    // All-clear: green "clean" treatment, no action.
    return <FixItCard size={size} icon={icon} tag={tag} clean doneLabel="Clear" text={emptyLine} />;
  }

  const text = (
    <>
      <strong>{title}</strong> · <Mono>{count}</Mono> account{count === 1 ? "" : "s"} ·{" "}
      <Mono>{fmtMoney(mrr)}</Mono> at risk
    </>
  );

  if (onAutopilot && playbookId) {
    return (
      <FixItCard
        size={size}
        icon={icon}
        tag={tag}
        text={text}
        badge={<Badge variant="pos" dot={false}>On · autopilot</Badge>}
        note="New matches handled automatically."
        action={
          <>
            <Button
              variant="ghost"
              size="sm"
              icon={<Icon name="pause" />}
              onClick={() => {
                autopilotStore.pause(playbookId);
                t({ title: "Autopilot paused", description: "Sends stopped — the rule is kept." });
              }}
            >
              Pause
            </Button>
            <Button variant="ghost" size="sm" icon={<Icon name="sliders" />} onClick={() => onEditRule?.(playbookId)}>
              Edit rule
            </Button>
            <Button
              variant="ghost"
              size="sm"
              icon={<Icon name="external-link" />}
              onClick={() => onOpenHighLevel?.(playbookId)}
              title="Reopen the HighLevel workflow to change the message"
            >
              Open in HighLevel
            </Button>
          </>
        }
      />
    );
  }

  return (
    <FixItCard
      size={size}
      icon={icon}
      tag={tag}
      text={text}
      action={
        <>
          {onApply ? (
            <ActionButton size="sm" icon="play" onClick={onApply}>
              {actionLabel}
            </ActionButton>
          ) : null}
          <Button variant="ghost" size="sm" icon={<Icon name="arrow-right" />} onClick={onView}>
            View all
          </Button>
        </>
      }
    />
  );
}


// ----------------------------------------------------------------------------
// Good-news card — a positive opportunity (upsell / comeback), on the DS
// FixItCard with the emerald tone="pos". Hidden when the cohort is empty.
// ----------------------------------------------------------------------------

interface GoodNewsCardProps {
  icon: string;
  title: string;
  tag: string;
  accounts: Account[];
  actionLabel: string;
  onView: () => void;
  onAction: () => void;
}

function GoodNewsCard({ icon, title, tag, accounts, actionLabel, onView, onAction }: GoodNewsCardProps) {
  const count = accounts.length;
  if (count === 0) return null;
  const mrr = accounts.reduce((sum, a) => sum + a.revenue.mrr, 0);
  const text = (
    <>
      <strong>{title}</strong> · <Mono>{count}</Mono> account{count === 1 ? "" : "s"} ·{" "}
      <Mono>{fmtMoney(mrr)}</Mono> MRR
    </>
  );
  return (
    <FixItCard
      tone="pos"
      icon={icon}
      tag={tag}
      text={text}
      action={
        <>
          <ActionButton size="sm" icon="sparkles" onClick={onAction}>
            {actionLabel}
          </ActionButton>
          <Button variant="ghost" size="sm" icon={<Icon name="arrow-right" />} onClick={onView}>
            View all
          </Button>
        </>
      }
    />
  );
}


// ----------------------------------------------------------------------------
// Reassurance line — "GoCSM handled X overnight" as a positive Verdict, with an
// expandable ActivityLog of wins and an ActionReceipt list of emails sent.
// ----------------------------------------------------------------------------

interface RecapItem {
  id: string;
  accountId: string;
  accountName: string;
  did: string;
  outcome: string;
  tag: "Autopilot" | "You approved";
  amount?: number;
  daysAgo: number;
}

function ReassuranceLine({
  onOpenAccount,
}: {
  onOpenAccount: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [emailsOpen, setEmailsOpen] = useState(false);

  const recent = allOutcomes.filter((o) => o.daysAgo <= 7);
  const autopilot = recent.filter((o) => o.attribution === "playbook-solo");
  const approved = recent.filter((o) => o.attribution === "playbook-assist");

  const totalHandled = autopilot.length + approved.length;
  const protectedAmount =
    autopilot.reduce((s, o) => s + (o.amount ?? 0), 0) +
    approved.reduce((s, o) => s + (o.amount ?? 0), 0);

  // The overnight recap is a fixed historical fact: what GoCSM sent overnight,
  // independent of which plays are on now — so the count never drops when you turn one on.
  const sentEmails: AutopilotEmail[] = autopilotSentEmails;
  const sentCount = sentEmails.length;

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
        daysAgo: o.daysAgo,
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
        daysAgo: o.daysAgo,
      };
    }),
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-3)" }}>
      <Verdict
        tone="pos"
        attribution="GoCSM AI"
        actions={
          <>
            {sentCount > 0 ? (
              <Button variant="ghost" size="sm" icon={<Icon name="mail" />} onClick={() => setEmailsOpen((o) => !o)}>
                {emailsOpen ? "Hide emails" : `See ${sentCount} email${sentCount === 1 ? "" : "s"}`}
              </Button>
            ) : null}
            <Button
              variant="ghost"
              size="sm"
              icon={<Icon name={open ? "chevron-up" : "arrow-right"} />}
              onClick={() => setOpen((o) => !o)}
            >
              {open ? "Hide" : "See what it did"}
            </Button>
          </>
        }
      >
        GoCSM handled <Mono>{totalHandled}</Mono> {totalHandled === 1 ? "thing" : "things"} overnight
        {sentCount > 0 ? (
          <>
            {" "}and sent <Mono>{sentCount}</Mono> client email{sentCount === 1 ? "" : "s"}.
          </>
        ) : (
          <>
            {" "}and protected <Mono>{fmtMoneySmall(protectedAmount)}</Mono> this week.
          </>
        )}
      </Verdict>

      {emailsOpen ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-2)" }}>
          {sentEmails.map((e) => (
            <ActionReceipt
              key={e.id}
              state="sent"
              title={`${e.accountName} · ${e.subject}`}
              scope={e.snippet}
              blastRadius="Sent to the account owner — not their clients."
              reportBack={e.whenLabel}
            />
          ))}
          <span style={{ font: "var(--t-meta)", color: "var(--text-3, var(--text))", fontStyle: "italic" }}>
            These are the exact messages you approved in HighLevel at setup.
          </span>
        </div>
      ) : null}

      {open ? (
        items.length === 0 ? (
          <Card padded>
            <p style={{ font: "var(--t-body-sm)", color: "var(--text-2, var(--text))", margin: 0 }}>
              Quiet week — nothing verified yet. We'll log wins here as downstream signals confirm them.
            </p>
          </Card>
        ) : (
          <ActivityLog
            rows={items.map((item) => ({
              time: item.daysAgo === 0 ? "today" : `${item.daysAgo}d ago`,
              actor: "GoCSM",
              line: (
                <>
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={() => onOpenAccount(item.accountId)}
                    onKeyDown={(ev: React.KeyboardEvent) => {
                      if (ev.key === "Enter" || ev.key === " ") onOpenAccount(item.accountId);
                    }}
                    style={{ fontWeight: 600, color: "var(--text)", cursor: "pointer" }}
                  >
                    {item.accountName}
                  </span>{" "}
                  — {item.did} · {item.outcome}
                </>
              ),
              outcome: item.tag,
              outcomeState: "ok",
              auto: item.tag === "Autopilot",
            }))}
          />
        )
      ) : null}
    </div>
  );
}


// ----------------------------------------------------------------------------
// Pending approvals — ONLY surfaces when an autopilot play is on "Ease in" or
// "Review every send". Absent/empty when every on-play is "Send automatically".
// (Kept on Card + Buttons: ActionReceipt's "pending" countdown copy doesn't fit
//  the "waiting for your OK" semantics — see report.)
// ----------------------------------------------------------------------------

function PendingApprovalsItem() {
  const onIds = useAllAutopilotOn();
  const [open, setOpen] = useState(false);
  const [approvedIds, setApprovedIds] = useState<Set<string>>(new Set());

  // Only the heavier oversight modes generate pending sends.
  const heavyIds = onIds.filter((id) => {
    const m = autopilotStore.oversee(id);
    return m === "ease" || m === "review";
  });
  const pending = pendingEmailsForPlaybooks(heavyIds).filter((e) => !approvedIds.has(e.id));

  if (pending.length === 0) return null;

  const approve = (id: string) => {
    setApprovedIds((prev) => new Set(prev).add(id));
  };
  const approveAll = () => {
    setApprovedIds((prev) => {
      const next = new Set(prev);
      pending.forEach((p) => next.add(p.id));
      return next;
    });
  };

  return (
    <Card padded className="accent-t warn">
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-3)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--s-3)", flexWrap: "wrap" }}>
          <span className="icon-chip warn" aria-hidden>
            <Icon name="mail" />
          </span>
          <span style={{ flex: 1, minWidth: 0, font: "var(--t-body)", color: "var(--text)" }}>
            <strong style={{ fontWeight: 600 }}>
              <Mono>{pending.length}</Mono> client email{pending.length === 1 ? "" : "s"}
            </strong>{" "}
            waiting for your OK
            <span style={{ color: "var(--text-2, var(--text))" }}>
              {" "}— from plays you set to review before sending.
            </span>
          </span>
          <Button
            variant="ghost"
            size="sm"
            icon={<Icon name={open ? "chevron-up" : "arrow-right"} />}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? "Hide" : "Review"}
          </Button>
        </div>
        {open ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-2)" }}>
            {pending.map((e) => (
              <div
                key={e.id}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "var(--s-3)",
                  padding: "var(--s-3)",
                  borderRadius: "var(--r-md)",
                  background: "var(--surface-2)",
                  border: "1px solid var(--border)",
                }}
              >
                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                  <div style={{ display: "flex", gap: "var(--s-2)", alignItems: "baseline", flexWrap: "wrap" }}>
                    <strong style={{ color: "var(--text)", fontWeight: 600 }}>{e.accountName}</strong>
                    <span style={{ color: "var(--text-2, var(--text))", font: "var(--t-body-sm)" }}>
                      · {e.subject}
                    </span>
                    <span style={{ marginLeft: "auto", font: "var(--t-meta)", color: "var(--text-3, var(--text))" }}>
                      {e.whenLabel}
                    </span>
                  </div>
                  <span style={{ font: "var(--t-body-sm)", color: "var(--text-2, var(--text))" }}>
                    {e.snippet}
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="primary"
                  icon={<Icon name="check" />}
                  onClick={() => approve(e.id)}
                >
                  Approve & send
                </Button>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <Button size="sm" variant="ghost" onClick={approveAll}>
                Approve all ({pending.length})
              </Button>
            </div>
          </div>
        ) : null}
      </div>
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
  const [drawerInitial, setDrawerInitial] = useState<DrawerInitial | undefined>(undefined);
  const openApply = (accs: Account[], suggested?: string) => {
    setDrawerInitial(undefined);
    setDrawerScope({
      kind: "accounts",
      accountIds: accs.map((a) => a.identity.id),
      suggested,
    });
  };
  const openAutopilotEditor = (playbookId: string, step: 1 | 2 = 1, showHandoff = false) => {
    setDrawerScope({ kind: "playbook", playbookId });
    setDrawerInitial({ mode: "autopilot", step, showHandoff });
  };


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
  const upsell = useMemo(() => upsellReady(), []);
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

  const renderNeedsYouCard = (item: NeedsYouItem) => {
    const a = item.account;
    return (
      <SignalCard
        key={item.id}
        band={a.health.band}
        account={a.identity.name}
        mrr={a.revenue.mrr}
        story={
          <>
            {item.problem} <span style={{ color: "var(--text-2, var(--text))" }}>· {item.helper}</span>
          </>
        }
        onSeePlaybook={() => navigate(`/accounts/${a.identity.id}`)}
        saveWindow={
          item.urgencyLabel ? (
            <Badge variant={item.urgencyHot ? "danger" : "neutral"} dot={false}>
              {item.urgencyLabel}
            </Badge>
          ) : null
        }
        action={
          <>
            <ActionButton
              size="sm"
              icon={item.mode === "human" ? "phone" : "play"}
              onClick={() => (item.mode === "play" ? runPlay(item) : logHuman(item))}
            >
              {item.actionLabel}
            </ActionButton>
            <Button size="sm" variant="ghost" title="Clear this row from today" onClick={() => markHandled(item.id, "dismissed")}>
              Not now
            </Button>
          </>
        }
      />
    );
  };

  // Cohorts for "Fix a problem" — sorted so the biggest is the hero (size=lg).
  const cohorts = [
    {
      icon: "alert-triangle",
      title: "Setup lost — may be leaving",
      tag: "Retention",
      accounts: lostSticky,
      actionLabel: "Win them back",
      emptyLine: "All setups holding steady.",
      playbookId: "pb-save-domain",
      onView: () => navigate("/accounts"),
      onApply: () => openApply(lostSticky, "pb-save-domain"),
    },
    {
      icon: "calendar-clock",
      title: "Renewing soon & at risk",
      tag: "Renewals",
      accounts: renewingAtRisk,
      actionLabel: "Protect these renewals",
      emptyLine: "No renewals in danger.",
      playbookId: "pb-renewal-save",
      onView: () => navigate("/accounts?renewing=30"),
      onApply: () => openApply(renewingAtRisk, "pb-renewal-save"),
    },
    {
      icon: "credit-card",
      title: "Payment failed",
      tag: "Billing",
      accounts: failed,
      actionLabel: "Recover payments",
      emptyLine: "Payments are flowing.",
      playbookId: "pb-payment-failed",
      onView: () => navigate("/accounts"),
      onApply: () => openApply(failed, "pb-payment-failed"),
    },
    {
      icon: "moon",
      title: "Gone quiet",
      tag: "Engagement",
      accounts: goneQuiet,
      actionLabel: "Send a nudge",
      emptyLine: "Everyone's still showing up.",
      playbookId: "pb-no-login",
      onView: () => navigate("/accounts"),
      onApply: () => openApply(goneQuiet, "pb-no-login"),
    },
    {
      icon: "rocket",
      title: "Onboarding stalled",
      tag: "Onboarding",
      accounts: stalled,
      actionLabel: "Unblock onboarding",
      emptyLine: "New accounts are moving.",
      playbookId: "pb-onboarding-stalled",
      onView: () => navigate("/onboarding"),
      onApply: () => openApply(stalled, "pb-onboarding-stalled"),
    },
  ].sort((a, b) => b.accounts.length - a.accounts.length);

  // Single entry point: the biggest open problem is the obvious first action.
  const topCohort = cohorts.find((c) => c.accounts.length > 0);

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
      {/* 1 — Briefing: greeting + AI verdict heroing $ at risk + secondary stats */}
      <section aria-label="Briefing" style={{ display: "flex", flexDirection: "column", gap: "var(--s-3)" }}>
        <BriefingHeader
          greeting={greetingFor("there")}
          sync={<LiveStatus state="fresh" label="Synced moments ago" />}
        />
        <Verdict
          tone={rollup.mrrAtRisk > 0 ? "risk" : "watch"}
          attribution="GoCSM AI"
          score={rollup.mrrAtRisk > 0 ? fmtMoney(rollup.mrrAtRisk) : null}
          band="atrisk"
          stamp={
            rollup.mrrAtRisk > 0 ? (
              <span style={{ font: "var(--t-meta)", color: "var(--text-3, var(--text))" }}>MRR at risk</span>
            ) : null
          }
          actions={
            topCohort ? (
              <ActionButton size="sm" icon="arrow-right" onClick={topCohort.onApply}>
                Start here: {topCohort.actionLabel}
              </ActionButton>
            ) : null
          }
        >
          {briefingLine}
        </Verdict>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: "var(--s-3)",
          }}
        >
          <MetricCard
            label="Needs you"
            value={activeNeeds.length}
            icon={<Icon name="inbox" />}
            iconTone={activeNeeds.length > 0 ? "warn" : "info"}
          />
          <MetricCard
            label="Renewals · 30d"
            value={renewalsWindow(0, 30).length}
            icon={<Icon name="calendar-clock" />}
          />
        </div>
      </section>

      <ReassuranceLine onOpenAccount={(id) => navigate(`/accounts/${id}`)} />

      <PendingApprovalsItem />

      {/* 3 — Needs you */}
      <section
        aria-label="Needs you"
        id="urgency-queue"
        style={{ display: "flex", flexDirection: "column", gap: "var(--s-3)" }}
      >
        <header style={{ display: "flex", flexDirection: "column", gap: "var(--s-2)" }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "var(--s-3)" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--s-2)" }}>
                <h2 style={{ font: "var(--t-h3)", margin: 0, color: "var(--text)", fontWeight: 600 }}>
                  Needs you
                </h2>
                <Badge variant="danger" dot={false}>
                  <Mono>{activeNeeds.length}</Mono>
                </Badge>
              </div>
              <p style={{ font: "var(--t-body-sm)", color: "var(--text-2, var(--text))", margin: 0 }}>
                GoCSM did what it could. These need a person.
              </p>
            </div>
            <span
              style={{
                font: "var(--t-meta)",
                color: handledCount > 0 ? "var(--pos-7)" : "var(--text-2, var(--text))",
                fontWeight: handledCount > 0 ? 600 : 400,
              }}
            >
              {handledCount === totalNeeds && totalNeeds > 0 ? "🎉 " : ""}
              <Mono>{handledCount}</Mono> of <Mono>{totalNeeds}</Mono> handled today
            </span>
          </div>
          {totalNeeds > 0 && (
            <div
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={totalNeeds}
              aria-valuenow={handledCount}
              style={{ height: 6, borderRadius: 999, background: "var(--surface-2)", overflow: "hidden" }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${(handledCount / totalNeeds) * 100}%`,
                  background: "linear-gradient(90deg, var(--pos-soft) 0%, var(--pos-7) 100%)",
                  transition: "width 360ms ease",
                }}
              />
            </div>
          )}
        </header>

        <Queue
          empty={visibleNeeds.length === 0}
          emptyLabel={
            handledCount > 0
              ? "🎉 Inbox zero — nice work. GoCSM is watching the board."
              : "Nothing needs you right now. GoCSM is watching the board."
          }
          footer={
            overflowCount > 0 ? (
              <Button
                size="sm"
                variant="ghost"
                icon={<Icon name="arrow-right" />}
                onClick={() => navigate("/accounts?filter=needs-you")}
              >
                See all ({activeNeeds.length})
              </Button>
            ) : null
          }
        >
          {visibleNeeds.map(renderNeedsYouCard)}
        </Queue>
      </section>

      {/* 4 — Fix a problem (DS FixItCard lane; biggest cohort is the hero) */}
      <section aria-label="Fix a problem" style={{ display: "flex", flexDirection: "column", gap: "var(--s-3)" }}>
        <header style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <h2 style={{ font: "var(--t-h3, var(--t-body))", margin: 0, color: "var(--text)", fontWeight: 600 }}>
            Fix a problem
          </h2>
          <p style={{ font: "var(--t-body-sm)", color: "var(--text-2, var(--text))", margin: 0 }}>
            Same problem across several accounts — fix them together.
          </p>
        </header>
        <div>
          {cohorts.map((c, i) => (
            <CohortFixItCard
              key={c.title}
              size={i === 0 ? "lg" : "md"}
              icon={c.icon}
              title={c.title}
              tag={c.tag}
              accounts={c.accounts}
              actionLabel={c.actionLabel}
              emptyLine={c.emptyLine}
              playbookId={c.playbookId}
              onView={c.onView}
              onApply={c.onApply}
              onEditRule={(id) => openAutopilotEditor(id, 1)}
              onOpenHighLevel={(id) => openAutopilotEditor(id, 2, true)}
            />
          ))}
        </div>
      </section>

      {/* 5 — Good news: positive opportunities (upsell + comebacks), tone="pos" */}
      {(upsell.length > 0 || dormantUp.length > 0) && (
        <section aria-label="Good news" style={{ display: "flex", flexDirection: "column", gap: "var(--s-3)" }}>
          <header style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <h2 style={{ font: "var(--t-h3, var(--t-body))", margin: 0, color: "var(--text)", fontWeight: 600 }}>
              Good news
            </h2>
            <p style={{ font: "var(--t-body-sm)", color: "var(--text-2, var(--text))", margin: 0 }}>
              Momentum worth a nudge — grow the accounts that are already winning.
            </p>
          </header>
          <div>
            <GoodNewsCard
              icon="trending-up"
              tag="Expansion"
              title="On the rise — worth a nudge"
              accounts={upsell}
              actionLabel="Suggest an upgrade"
              onView={() => navigate("/accounts")}
              onAction={() => openApply(upsell, "pb-expansion-ready")}
            />
            <GoodNewsCard
              icon="sparkles"
              tag="Comeback"
              title="Coming back to life"
              accounts={dormantUp}
              actionLabel="Ask for a testimonial"
              onView={() => navigate("/accounts")}
              onAction={() => openApply(dormantUp, "pb-expansion-ready")}
            />
          </div>
        </section>
      )}

      <PlaybookActivationDrawer
        open={!!drawerScope}
        scope={drawerScope}
        accounts={allAccounts()}
        initial={drawerInitial}
        onClose={() => {
          setDrawerScope(null);
          setDrawerInitial(undefined);
        }}
      />
    </main>
  );
}
