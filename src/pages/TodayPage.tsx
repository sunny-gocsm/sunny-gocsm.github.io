import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  Button,
  Icon,
  Mono,
  Badge,
  LiveStatus,
  Verdict,
  FixItCard,
  ActionButton,
  ActionReceipt,
  ActivityLog,
} from "@/gocsm-ds";
import { useIsAutopilot, useAllAutopilotOn, autopilotStore } from "@/state/autopilot";
import { useToast } from "@/hooks/use-toast";
import {
  autopilotSentEmails,
  pendingEmailsForPlaybooks,
  type AutopilotEmail,
} from "@/fixtures/autopilotActivity";
import {
  renewalsWindow,
  failedPayments,
  lostStickySetups,
  stalledOnboarding,
  upsellReady,
  atRiskByUrgency,
  allAccounts,
  type Account,
} from "@/fixtures";
import { PlaybookActivationDrawer, type DrawerScope, type DrawerInitial } from "@/components/playbooks/PlaybookActivationDrawer";
import { outcomes as allOutcomes, outcomeAccount, outcomePlaybook } from "@/fixtures/outcomes";



// ----------------------------------------------------------------------------
// helpers
// ----------------------------------------------------------------------------

const fmtMoney = (n: number) => "$" + Math.round(n).toLocaleString();

const greetingFor = (name?: string) => {
  const h = new Date().getHours();
  const part = h < 12 ? "morning" : h < 18 ? "afternoon" : "evening";
  return name ? `Good ${part}, ${name}.` : `Good ${part}.`;
};

function fmtMoneySmall(n: number) {
  return "$" + Math.round(n).toLocaleString();
}

// ----------------------------------------------------------------------------
// Cohort card — one row in the unified "What needs you today" list, rendered on
// the DS FixItCard. Kept as its own component so the per-cohort autopilot hook
// is legal.
// ----------------------------------------------------------------------------

interface CohortFixItCardProps {
  icon: string;
  title: string;
  accounts: Account[];
  actionLabel: string;
  emptyLine: string;
  size?: "md" | "lg";
  playbookId?: string;
  onApply?: () => void;
  onEditRule?: (playbookId: string) => void;
  onOpenHighLevel?: (playbookId: string) => void;
}

function CohortFixItCard({
  icon,
  title,
  accounts,
  actionLabel,
  emptyLine,
  size = "md",
  playbookId,
  onApply,
  onEditRule,
  onOpenHighLevel,
}: CohortFixItCardProps) {
  const { toast: t } = useToast();
  const onAutopilot = useIsAutopilot(playbookId ?? "");
  const mrr = accounts.reduce((sum, a) => sum + a.revenue.mrr, 0);
  const count = accounts.length;

  if (count === 0) {
    // All-clear: green "clean" treatment, no eyebrow, no action.
    return <FixItCard size={size} icon={icon} tag={null} clean doneLabel="Clear" text={emptyLine} />;
  }

  const meta = (
    <>
      <Mono>{count}</Mono> account{count === 1 ? "" : "s"}
      {mrr > 0 ? (
        <>
          {" · "}
          <span className="at-risk">
            <Mono>{fmtMoney(mrr)}</Mono> at risk
          </span>
        </>
      ) : null}
    </>
  );

  if (onAutopilot && playbookId) {
    // On autopilot — explicit quiet controls; not a whole-row tap target.
    return (
      <FixItCard
        size={size}
        icon={icon}
        tag={null}
        title={title}
        meta={meta}
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

  // Calm row: bold problem name + a quiet "N accounts · $X at risk" line, and a
  // clear soft-blue button CTA so it's obvious there's a workflow to trigger. The
  // whole row also taps to open. Every row gets the same accent CTA (consistently
  // clickable); the single solid-blue focal action lives in the Verdict above.
  return (
    <FixItCard
      size={size}
      icon={icon}
      tag={null}
      title={title}
      meta={meta}
      data-clickable="true"
      onClick={() => onApply?.()}
      action={
        <Button
          variant="ghost"
          className="btn-accent"
          size={size === "lg" ? "md" : "sm"}
          iconRight={<Icon name="arrow-right" />}
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            onApply?.();
          }}
        >
          {actionLabel}
        </Button>
      }
    />
  );
}




// ----------------------------------------------------------------------------
// Reassurance line — "GoCSM handled X overnight" as a quiet single line, with an
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
  upsellCount = 0,
  onActUpsell,
}: {
  onOpenAccount: (id: string) => void;
  upsellCount?: number;
  onActUpsell?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [emailsOpen, setEmailsOpen] = useState(false);

  const recent = allOutcomes.filter((o) => o.daysAgo <= 7);
  const autopilot = recent.filter((o) => o.attribution === "playbook-solo");
  const approved = recent.filter((o) => o.attribution === "playbook-assist");

  const totalHandled = autopilot.length + approved.length;

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
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-2)" }}>
      {/* Quiet full-width reassurance band — what GoCSM did while you were away.
          Secondary to the problem list, but its actions are real, clearly-clickable
          buttons (the actionable "Suggest upgrades" carries the blue accent; the two
          disclosures stay neutral). */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "var(--s-3)",
          padding: "var(--s-3) var(--s-4)",
          borderRadius: "var(--r-md)",
          background: "var(--bg-subtle)",
          border: "1px solid var(--border-soft)",
        }}
      >
        <span style={{ display: "inline-flex", color: "var(--pos-7)" }} aria-hidden>
          <Icon name="check-circle" />
        </span>
        <span style={{ font: "var(--t-body)", color: "var(--text-2, var(--text))" }}>
          GoCSM handled <Mono>{totalHandled}</Mono> {totalHandled === 1 ? "thing" : "things"} overnight
          {sentCount > 0 ? (
            <> · <Mono>{sentCount}</Mono> email{sentCount === 1 ? "" : "s"} sent</>
          ) : null}
          {upsellCount > 0 ? (
            <> · <Mono>{upsellCount}</Mono> on the rise</>
          ) : null}
        </span>
        <span style={{ flex: 1, minWidth: "var(--s-3)" }} />
        <div style={{ display: "flex", gap: "var(--s-2)", flexWrap: "wrap" }}>
          <Button
            variant="secondary"
            size="sm"
            iconRight={<Icon name={open ? "chevron-up" : "chevron-down"} />}
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
          >
            See what it did
          </Button>
          {sentCount > 0 ? (
            <Button
              variant="secondary"
              size="sm"
              iconRight={<Icon name={emailsOpen ? "chevron-up" : "chevron-down"} />}
              onClick={() => setEmailsOpen((o) => !o)}
              aria-expanded={emailsOpen}
            >
              Emails
            </Button>
          ) : null}
          {upsellCount > 0 && onActUpsell ? (
            <Button
              variant="ghost"
              className="btn-accent"
              size="sm"
              iconRight={<Icon name="arrow-right" />}
              onClick={onActUpsell}
            >
              Suggest upgrades
            </Button>
          ) : null}
        </div>
      </div>

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

  // ---- Unified "What needs you today" list -------------------------------
  // ONE row per problem (issue-grouped, so it scales to 1000 accounts). The
  // accounts that used to appear in a separate "Needs you" list now live inside
  // their matching problem here — no second framing of the same data. Sorted by
  // urgency × $ at risk so the most important problem is first (and the hero).
  const cohortDefs = [
    {
      icon: "credit-card",
      title: "Payment failed",
      tag: "Billing",
      accounts: failed,
      actionLabel: "Recover payments",
      emptyLine: "Payments are flowing.",
      playbookId: "pb-payment-failed",
      urgency: 5,
    },
    {
      icon: "alert-triangle",
      title: "Setup lost — may be leaving",
      tag: "Retention",
      accounts: lostSticky,
      actionLabel: "Win them back",
      emptyLine: "All setups holding steady.",
      playbookId: "pb-save-domain",
      urgency: 4,
    },
    {
      icon: "calendar-clock",
      title: "Renewing soon & at risk",
      tag: "Renewals",
      accounts: renewingAtRisk,
      actionLabel: "Protect these renewals",
      emptyLine: "No renewals in danger.",
      playbookId: "pb-renewal-save",
      urgency: 4,
    },
    {
      icon: "moon",
      title: "Gone quiet",
      tag: "Engagement",
      accounts: goneQuiet,
      actionLabel: "Send a nudge",
      emptyLine: "Everyone's still showing up.",
      playbookId: "pb-no-login",
      urgency: 2,
    },
    {
      icon: "rocket",
      title: "Onboarding stalled",
      tag: "Onboarding",
      accounts: stalled,
      actionLabel: "Unblock onboarding",
      emptyLine: "New accounts are moving.",
      playbookId: "pb-onboarding-stalled",
      urgency: 2,
    },
  ];
  const cohortMrr = (accs: Account[]) => accs.reduce((s, a) => s + a.revenue.mrr, 0);

  // Dedupe accounts so each appears under exactly ONE problem — claimed in
  // urgency order, so an account that has two problems shows under its most
  // urgent one (a failed payment outranks a renewal). Keeping the rows distinct
  // makes the hero totals equal the sum of the rows, so the page never shows two
  // "$ at risk" numbers that fail to reconcile.
  const claimed = new Set<string>();
  const cohorts = cohortDefs
    .filter((c) => c.accounts.length > 0)
    .sort((a, b) => b.urgency - a.urgency || cohortMrr(b.accounts) - cohortMrr(a.accounts))
    .map((c) => {
      const accounts = c.accounts.filter((a) => {
        if (claimed.has(a.identity.id)) return false;
        claimed.add(a.identity.id);
        return true;
      });
      return { ...c, accounts };
    })
    .filter((c) => c.accounts.length > 0)
    // Display order: the most pressing problem (urgency × $ at risk) first → hero.
    .sort((a, b) => b.urgency * cohortMrr(b.accounts) - a.urgency * cohortMrr(a.accounts));

  const MAX_VISIBLE = 5;
  const visibleCohorts = cohorts.slice(0, MAX_VISIBLE);
  const hiddenCount = cohorts.length - visibleCohorts.length;
  const topCohort = cohorts[0];
  const accountsNeeding = cohorts.reduce((s, c) => s + c.accounts.length, 0);
  // Hero "$ at risk" is the sum of the rows the user sees below — never a
  // separately-computed agency rollup that wouldn't add up.
  const mrrAtRisk = cohorts.reduce((s, c) => s + cohortMrr(c.accounts), 0);

  return (
    <main
      className="today-main"
      style={{
        maxWidth: 1080,
        margin: "0 auto",
        color: "var(--text)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--s-10)",
      }}
    >
      {/* 1 — Briefing: the AI verdict IS the hero (heroes $ at risk + one primary
          action). The old "Good afternoon" greeting added no value, so it's gone;
          only a small freshness chip remains as a quiet trust signal. */}
      <section aria-label="Briefing" style={{ display: "flex", flexDirection: "column", gap: "var(--s-2)" }}>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <LiveStatus state="fresh" label="Synced moments ago" />
        </div>
        <Verdict
          tone={mrrAtRisk > 0 ? "risk" : "watch"}
          attribution="GoCSM AI"
          score={mrrAtRisk > 0 ? fmtMoney(mrrAtRisk) : null}
          band="atrisk"
          stamp={
            mrrAtRisk > 0 ? (
              <span style={{ font: "var(--t-meta)", color: "var(--text-3, var(--text))" }}>at risk</span>
            ) : null
          }
          actions={
            topCohort ? (
              <ActionButton
                size="sm"
                icon="arrow-right"
                onClick={() => openApply(topCohort.accounts, topCohort.playbookId)}
              >
                Start here: {topCohort.actionLabel}
              </ActionButton>
            ) : null
          }
        >
          {accountsNeeding > 0
            ? `${accountsNeeding} ${accountsNeeding === 1 ? "account needs" : "accounts need"} you today.`
            : "You're all caught up today."}
        </Verdict>
      </section>

      <ReassuranceLine
        onOpenAccount={(id) => navigate(`/accounts/${id}`)}
        upsellCount={upsell.length}
        onActUpsell={() => openApply(upsell, "pb-expansion-ready")}
      />

      <PendingApprovalsItem />

      {/* 2 — One prioritized list: what needs you today (issue-grouped, scales) */}
      <section aria-label="What needs you today" style={{ display: "flex", flexDirection: "column", gap: "var(--s-3)" }}>
        <header style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "var(--s-3)" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-1)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--s-2)" }}>
              <h2 style={{ font: "var(--t-heading)", margin: 0, color: "var(--text)", fontWeight: 700, letterSpacing: "-0.01em" }}>
                What needs you today
              </h2>
              {accountsNeeding > 0 ? (
                <Badge variant="danger" dot={false}>
                  <Mono>{accountsNeeding}</Mono> accounts
                </Badge>
              ) : null}
            </div>
            <p style={{ font: "var(--t-body)", color: "var(--text-2, var(--text))", margin: 0 }}>
              Each row is one problem — fix it for all its accounts at once.
            </p>
          </div>
        </header>

        {cohorts.length === 0 ? (
          <Card padded>
            <p style={{ font: "var(--t-body)", color: "var(--text-2, var(--text))", margin: 0 }}>
              Nothing needs you today — GoCSM is watching your accounts.
            </p>
          </Card>
        ) : (
          <div>
            {visibleCohorts.map((c, i) => (
              <CohortFixItCard
                key={c.title}
                size={i === 0 ? "lg" : "md"}
                icon={c.icon}
                title={c.title}
                accounts={c.accounts}
                actionLabel={c.actionLabel}
                emptyLine={c.emptyLine}
                playbookId={c.playbookId}
                onApply={() => openApply(c.accounts, c.playbookId)}
                onEditRule={(id) => openAutopilotEditor(id, 1)}
                onOpenHighLevel={(id) => openAutopilotEditor(id, 2, true)}
              />
            ))}
            {hiddenCount > 0 ? (
              <div style={{ marginTop: "var(--s-3)" }}>
                <Button
                  size="sm"
                  variant="ghost"
                  icon={<Icon name="arrow-right" />}
                  onClick={() => navigate("/accounts?filter=needs-you")}
                >
                  See all ({cohorts.length} problems)
                </Button>
              </div>
            ) : null}
          </div>
        )}
      </section>

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
