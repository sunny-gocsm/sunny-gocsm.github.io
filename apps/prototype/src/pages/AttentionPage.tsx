import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Button, Icon, Mono, Badge, FixItCard, ConfTag } from "@gocsm/design-system";
import { useIsAutopilot } from "@/state/autopilot";
import { hasDraft } from "@/state/workflowDrafts";
import { AttentionActivation } from "@/components/attention/AttentionActivation";
import { RECIPES, type Recipe } from "@/fixtures/recipes";
import { matchAccounts } from "@/fixtures/criteriaMatch";
import { triedButFailed, triedUnconfirmed, type Attempt } from "@/fixtures/attempts";
import { type Account } from "@/fixtures";

const fmtMoney = (n: number) => "$" + Math.round(n).toLocaleString();
const atRiskMrr = (accs: Account[]) =>
  accs.filter((a) => a.health.band === "atrisk").reduce((s, a) => s + a.revenue.mrr, 0);

// ----- Job (a): one row per recipe-cohort that currently has matches -----
function JobARow({ recipe, accounts, onSetup }: { recipe: Recipe; accounts: Account[]; onSetup: () => void }) {
  const on = useIsAutopilot(recipe.playbookId);
  const mrr = atRiskMrr(accounts);
  const count = accounts.length;
  const meta = (
    <>
      <Mono>{count}</Mono> account{count === 1 ? "" : "s"}
      {mrr > 0 ? (
        <> · <span className="at-risk"><Mono>{fmtMoney(mrr)}</Mono> at risk</span></>
      ) : null}
    </>
  );

  if (on) {
    return (
      <FixItCard
        icon={recipe.icon}
        tag={null}
        title={recipe.label}
        meta={meta}
        badge={<Badge variant="pos" dot={false}>On · autopilot</Badge>}
        note="Next run tonight · new matches handled automatically."
        action={
          <Button variant="ghost" className="btn-accent" size="sm" icon={<Icon name="pencil" />} onClick={(e: React.MouseEvent) => { e.stopPropagation(); onSetup(); }}>
            Edit
          </Button>
        }
      />
    );
  }
  const draft = hasDraft(recipe.id);
  return (
    <FixItCard
      icon={recipe.icon}
      tag={null}
      title={recipe.label}
      meta={meta}
      badge={draft ? <Badge variant="warn" dot={false}>Draft</Badge> : undefined}
      data-clickable="true"
      onClick={onSetup}
      action={
        <Button variant="ghost" className="btn-accent" size="sm" iconRight={<Icon name="arrow-right" />} onClick={(e: React.MouseEvent) => { e.stopPropagation(); onSetup(); }}>
          {draft ? "Resume setup" : "Set up playbook"}
        </Button>
      }
    />
  );
}

// ----- Job (b): a workflow ran but health didn't move (honest, confidence-gated) -----
function ContactActions({ name }: { name: string }) {
  return (
    <span className="ai-actions">
      <a className="ai-act" href="tel:+15555550100"><Icon name="phone" /> Call</a>
      <a className="ai-act" href={`mailto:owner@example.com?subject=${encodeURIComponent(`Checking in — ${name}`)}`}><Icon name="mail" /> Email</a>
      <a className="ai-act" href="sms:+15555550100"><Icon name="message-square" /> SMS</a>
    </span>
  );
}

function JobBCard({ attempt, onOpen }: { attempt: Attempt; onOpen: (id: string) => void }) {
  const high = attempt.confidence === "high";
  const reason = high
    ? `${attempt.targetPillarLabel} still ${attempt.status === "worse" ? "falling" : "flat"} ${attempt.ranDaysAgo} day${attempt.ranDaysAgo === 1 ? "" : "s"} after “${attempt.playbookTitle}” ran.`
    : `“${attempt.playbookTitle}” ran ${attempt.ranDaysAgo} day${attempt.ranDaysAgo === 1 ? "" : "s"} ago — outcome not yet confirmed.`;

  return (
    <Card padded className={high ? "accent-t risk" : undefined}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "var(--s-3)" }}>
        <span className={["icon-chip", high ? "risk" : "info"].join(" ")} aria-hidden>
          <Icon name={high ? "alert-triangle" : "clock"} />
        </span>
        <div style={{ flex: 1, minWidth: 220, display: "flex", flexDirection: "column", gap: 2 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--s-2)", flexWrap: "wrap" }}>
            <button type="button" onClick={() => onOpen(attempt.accountId)}
              style={{ border: 0, background: "transparent", padding: 0, cursor: "pointer", fontSize: "var(--t-body-lg)", fontWeight: 700, color: "var(--text)" }}>
              {attempt.accountName}
            </button>
            {high ? null : <ConfTag basis="guess" detail="unverified" />}
          </div>
          <span style={{ fontSize: "var(--t-body-sm)", color: "var(--text-2, var(--text))" }}>{reason}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--s-3)", flexWrap: "wrap" }}>
          <ContactActions name={attempt.accountName} />
          <Button variant="ghost" size="sm" iconRight={<Icon name="arrow-right" />} onClick={() => onOpen(attempt.accountId)}>
            Why
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default function AttentionPage() {
  const navigate = useNavigate();
  const [activation, setActivation] = useState<Recipe | null>(null);

  const jobA = useMemo(
    () =>
      RECIPES.map((recipe) => ({ recipe, accounts: matchAccounts(recipe.set) }))
        .filter((x) => x.accounts.length > 0)
        .sort((a, b) => atRiskMrr(b.accounts) - atRiskMrr(a.accounts)),
    [],
  );
  const failed = useMemo(() => triedButFailed(), []);
  const unconfirmed = useMemo(() => triedUnconfirmed(), []);
  const jobB = [...failed, ...unconfirmed];

  // Unique accounts across cohorts (recipes overlap) — never overclaim the count.
  const totalNeeding = useMemo(() => {
    const ids = new Set<string>();
    jobA.forEach((x) => x.accounts.forEach((a) => ids.add(a.identity.id)));
    return ids.size;
  }, [jobA]);
  const openAccount = (id: string) => navigate(`/accounts/${id}`);

  return (
    <main className="today-main" style={{ maxWidth: 1080, margin: "0 auto", color: "var(--text)", display: "flex", flexDirection: "column" }}>
      {/* Hero — the page's thesis */}
      <header style={{ display: "flex", flexDirection: "column", gap: "var(--s-3)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--s-3)", flexWrap: "wrap" }}>
          <h1 style={{ fontSize: "var(--t-display-xl)", fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.05, margin: 0 }}>Needs attention</h1>
          {totalNeeding > 0 ? <Badge variant="danger" dot={false}><Mono>{totalNeeding}</Mono> need a playbook</Badge> : null}
        </div>
        <p style={{ margin: 0, fontSize: "var(--t-body-lg)", color: "var(--text-2, var(--text))", maxWidth: 640 }}>
          Start a playbook for the accounts that need one — and reach the ones a playbook ran on but didn't move.
        </p>
      </header>

      {/* Job (b) — a playbook ran but didn't move; a human must step in. Shown FIRST
          (top of page) so this time-sensitive, easy-to-miss work is never buried —
          but only when it exists, so a brand-new user (no runs yet) lands straight
          on the activation job below. */}
      {jobB.length > 0 ? (
        <section style={{ marginTop: "var(--s-10)", display: "flex", flexDirection: "column", gap: "var(--s-4)" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <h2 style={{ fontSize: "var(--t-heading)", fontWeight: 700, margin: 0 }}>Step in — automation couldn't fix this</h2>
            <p style={{ margin: 0, fontSize: "var(--t-body-sm)", color: "var(--text-3, var(--text))" }}>
              A playbook ran but the account still needs you. Reach them directly.
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-2)" }}>
            {jobB.map((a) => (
              <JobBCard key={a.id} attempt={a} onOpen={openAccount} />
            ))}
          </div>
        </section>
      ) : null}

      {/* Job (a) — needs a playbook */}
      <section style={{ marginTop: "var(--s-10)", display: "flex", flexDirection: "column", gap: "var(--s-4)" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <h2 style={{ fontSize: "var(--t-heading)", fontWeight: 700, margin: 0 }}>Needs a playbook</h2>
          <p style={{ margin: 0, fontSize: "var(--t-body-sm)", color: "var(--text-3, var(--text))" }}>
            Pick a problem — one playbook handles every matching account.
          </p>
        </div>
        {jobA.length === 0 ? (
          <Card padded><p style={{ margin: 0, fontSize: "var(--t-body)", color: "var(--text-2, var(--text))" }}>Nothing needs a new playbook — GoCSM is watching.</p></Card>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-2)" }}>
            {jobA.map(({ recipe, accounts }) => (
              <JobARow key={recipe.id} recipe={recipe} accounts={accounts} onSetup={() => setActivation(recipe)} />
            ))}
          </div>
        )}
      </section>

      {activation ? <AttentionActivation recipe={activation} onClose={() => setActivation(null)} /> : null}
    </main>
  );
}
