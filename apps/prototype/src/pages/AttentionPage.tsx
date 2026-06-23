import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Button, Icon, Mono, Badge, FixItCard, ConfTag } from "@gocsm/design-system";
import { useIsAutopilot } from "@/state/autopilot";
import { useHealthConfigured, healthConfigStore } from "@/state/healthConfig";
import { hasDraft } from "@/state/workflowDrafts";
import { AttentionActivation } from "@/components/attention/AttentionActivation";
import { type Recipe } from "@/fixtures/recipes";
import { attentionQueue, queueAccountCount, recipeForSignal, type QueueItem } from "@/fixtures/attentionSignals";
import { triedButFailed, triedUnconfirmed, type Attempt } from "@/fixtures/attempts";

// ----- Needs-attention queue row: one HL-native (or, in Phase 2, health) event -----
// Leads with the plain event (title) → a one-line "what this means" (meta, Pattern 2) →
// one clear action (Pattern 7). Carries forward the autopilot / draft states.
function QueueRow({ item, onSetup }: { item: QueueItem; onSetup: (item: QueueItem) => void }) {
  const on = useIsAutopilot(item.playbookId);
  const draft = hasDraft(item.id);
  const title = item.title(item.count);

  if (on) {
    return (
      <FixItCard
        icon={item.icon}
        tag={null}
        title={title}
        meta={item.meaning}
        badge={<Badge variant="pos" dot={false}>On · autopilot</Badge>}
        note="A playbook handles new matches automatically · next run tonight."
        action={
          <Button variant="ghost" className="btn-accent" size="sm" icon={<Icon name="pencil" />} onClick={() => onSetup(item)}>
            Edit
          </Button>
        }
      />
    );
  }
  return (
    <FixItCard
      icon={item.icon}
      tag={null}
      title={title}
      meta={item.meaning}
      badge={
        draft ? (
          <Badge variant="warn" dot={false}>Draft</Badge>
        ) : item.tier === "health" ? (
          <Badge variant="blue" dot={false}>From Health</Badge>
        ) : undefined
      }
      data-clickable="true"
      onClick={() => onSetup(item)}
      action={
        <Button
          variant="ghost"
          className="btn-accent"
          size="sm"
          iconRight={<Icon name="arrow-right" />}
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            onSetup(item);
          }}
        >
          {draft ? "Resume setup" : "Set up playbook"}
        </Button>
      }
    />
  );
}

// ----- Step-in: a playbook ran but the account still needs a human -----
function ContactActions({ name }: { name: string }) {
  return (
    <span className="ai-actions">
      <a className="ai-act" href="tel:+15555550100"><Icon name="phone" /> Call</a>
      <a className="ai-act" href={`mailto:owner@example.com?subject=${encodeURIComponent(`Checking in — ${name}`)}`}><Icon name="mail" /> Email</a>
      <a className="ai-act" href="sms:+15555550100"><Icon name="message-square" /> SMS</a>
    </span>
  );
}

function JobBCard({ attempt, onOpen, healthConfigured }: { attempt: Attempt; onOpen: (id: string) => void; healthConfigured: boolean }) {
  const high = attempt.confidence === "high";
  // Phase 1 stays HL-native ("the issue is still open"); Phase 2 may name the health pillar.
  const reason = high
    ? healthConfigured
      ? `${attempt.targetPillarLabel} still ${attempt.status === "worse" ? "falling" : "flat"} ${attempt.ranDaysAgo} day${attempt.ranDaysAgo === 1 ? "" : "s"} after “${attempt.playbookTitle}” ran.`
      : `“${attempt.playbookTitle}” ran ${attempt.ranDaysAgo} day${attempt.ranDaysAgo === 1 ? "" : "s"} ago — the issue is still open.`
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
  const healthConfigured = useHealthConfigured();
  const [activation, setActivation] = useState<Recipe | null>(null);

  // The needs-attention queue — HL-native events in Phase 1; health-derived events join
  // the same list once Health Config exists (Phase 2). Re-derives when the phase flips.
  const queue = useMemo(() => attentionQueue(healthConfigured), [healthConfigured]);
  const needing = useMemo(() => queueAccountCount(queue), [queue]);

  const failed = useMemo(() => triedButFailed(), []);
  const unconfirmed = useMemo(() => triedUnconfirmed(), []);
  const jobB = [...failed, ...unconfirmed];

  const openAccount = (id: string) => navigate(`/accounts/${id}`);

  return (
    <main className="today-main" style={{ maxWidth: 1080, margin: "0 auto", color: "var(--text)", display: "flex", flexDirection: "column" }}>
      {/* Hero — the page's thesis */}
      <header style={{ display: "flex", flexDirection: "column", gap: "var(--s-3)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--s-3)", flexWrap: "wrap" }}>
          <h1 style={{ fontSize: "var(--t-display-xl)", fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.05, margin: 0 }}>Needs attention</h1>
          {needing > 0 ? <Badge variant="danger" dot={false}><Mono>{needing}</Mono> sub-account{needing === 1 ? "" : "s"}</Badge> : null}
        </div>
        <p style={{ margin: 0, fontSize: "var(--t-body-lg)", color: "var(--text-2, var(--text))", maxWidth: 640 }}>
          What’s happening across your sub-accounts right now — start a playbook to handle each one.
        </p>
      </header>

      {/* Step in — a playbook ran but the account still needs a human. Shown FIRST when it
          exists so this time-sensitive, easy-to-miss work is never buried. */}
      {jobB.length > 0 ? (
        <section style={{ marginTop: "var(--s-10)", display: "flex", flexDirection: "column", gap: "var(--s-4)" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <h2 style={{ fontSize: "var(--t-heading)", fontWeight: 700, margin: 0 }}>Step in — automation couldn’t fix this</h2>
            <p style={{ margin: 0, fontSize: "var(--t-body-sm)", color: "var(--text-3, var(--text))" }}>
              A playbook ran but the account still needs you. Reach them directly.
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-2)" }}>
            {jobB.map((a) => (
              <JobBCard key={a.id} attempt={a} onOpen={openAccount} healthConfigured={healthConfigured} />
            ))}
          </div>
        </section>
      ) : null}

      {/* Needs-attention queue — the action layer's core list. Each row leads with a plain
          HL-native event, a one-line "what this means", and one clear action. */}
      <section style={{ marginTop: "var(--s-10)", display: "flex", flexDirection: "column", gap: "var(--s-4)" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <h2 style={{ fontSize: "var(--t-heading)", fontWeight: 700, margin: 0 }}>What needs attention</h2>
          <p style={{ margin: 0, fontSize: "var(--t-body-sm)", color: "var(--text-3, var(--text))" }}>
            One playbook handles every matching account — pick an event to set it up.
          </p>
        </div>
        {queue.length === 0 ? (
          <Card padded><p style={{ margin: 0, fontSize: "var(--t-body)", color: "var(--text-2, var(--text))" }}>Nothing needs attention right now — GoCSM is watching your sub-accounts.</p></Card>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-2)" }}>
            {queue.map((item) => (
              <QueueRow key={item.id} item={item} onSetup={(it) => setActivation(recipeForSignal(it))} />
            ))}
          </div>
        )}
      </section>

      {/* Prototype-only control — flips Health Config (Phase 1 ⇆ Phase 2) so health-derived
          signals join the queue. Not a customer-facing affordance. */}
      <div style={{ marginTop: "var(--s-10)", paddingTop: "var(--s-4)", borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "var(--s-3)", flexWrap: "wrap" }}>
        <span style={{ fontSize: "var(--t-caption)", textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--text-3, var(--text))", fontWeight: 600 }}>
          Prototype preview
        </span>
        <span style={{ fontSize: "var(--t-body-sm)", color: "var(--text-2, var(--text))" }}>
          Health Config is {healthConfigured ? "on (Phase 2)" : "off (Phase 1)"}.
        </span>
        <Button variant="ghost" size="sm" icon={<Icon name={healthConfigured ? "toggle-right" : "toggle-left"} />} onClick={() => healthConfigStore.toggle()}>
          {healthConfigured ? "Turn Health off" : "Preview with Health on"}
        </Button>
      </div>

      {activation ? <AttentionActivation recipe={activation} onClose={() => setActivation(null)} /> : null}
    </main>
  );
}
