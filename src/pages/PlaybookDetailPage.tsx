import { useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  Badge,
  Button,
  Card,
  Icon,
  Mono,
  PlaybookDetail,
  PlaybookActivation,
  ActionReceipt,
  ConfTag,
} from "@/gocsm-ds";
import { DraftReviewSheet, AutonomyBadge } from "@/gocsm-ds";
import {
  playbookById,
  matchesToday,
  type Playbook,
  type PlaybookState,
} from "@/fixtures/playbooks";

type LadderState = "off" | "ranonce" | "on";

interface SeedAction {
  icon: string;
  title: string;
  desc: string;
  supervised: boolean; // client-facing → must be supervised
  on: boolean;
}

function actionsFor(p: Playbook): SeedAction[] {
  switch (p.kind) {
    case "save":
      return [
        { icon: "bell", title: "Alert the owner", desc: "In-app + email to the assigned CSM.", supervised: false, on: true },
        { icon: "mail", title: "Drafted save-outreach to the customer", desc: "Warm, blame-free copy — needs your OK before it sends.", supervised: true, on: true },
        { icon: "shield", title: "Pause outbound risk plays", desc: "No conflicting nudges while the save runs.", supervised: false, on: true },
      ];
    case "billing":
      return [
        { icon: "credit-card", title: "Run dunning sequence", desc: "Standard retry cadence (3 attempts).", supervised: false, on: true },
        { icon: "bell", title: "Flag the owner", desc: "Surface in Today with the failed-payment cohort.", supervised: false, on: true },
        { icon: "mail", title: "Drafted note to the customer", desc: "Polite reminder — needs your OK before it sends.", supervised: true, on: true },
      ];
    case "onboarding":
      return [
        { icon: "bell", title: "Ping the blocker", desc: "Client or agency — whoever's holding it up.", supervised: false, on: true },
        { icon: "calendar", title: "Offer a 10-min unblock call", desc: "Calendar link in a short, friendly message.", supervised: true, on: true },
        { icon: "user-check", title: "Open a done-with-you path", desc: "CSM finishes the step alongside the customer.", supervised: false, on: false },
      ];
    case "adoption":
      return [
        { icon: "book-open", title: "Send a short how-to", desc: "Targeted to the feature that dropped.", supervised: true, on: true },
        { icon: "bell", title: "Notify CSM if no response in 7d", desc: "Quiet ping, no escalation.", supervised: false, on: true },
      ];
    case "expansion":
      return [
        { icon: "sparkles", title: "Surface upsell-ready summary", desc: "Owner-only briefing — what to bring to the call.", supervised: false, on: true },
        { icon: "calendar", title: "Drafted roadmap-call invite", desc: "Warm tone — needs your OK before it sends.", supervised: true, on: true },
        { icon: "star", title: "Queue a testimonial ask", desc: "Only after the roadmap call lands.", supervised: true, on: false },
      ];
    case "retention":
    default:
      return [
        { icon: "bell", title: "Alert the assigned CSM", desc: "In-app + email.", supervised: false, on: true },
        { icon: "mail", title: "Drafted warm check-in", desc: "Friendly nudge — needs your OK before it sends.", supervised: true, on: true },
        { icon: "phone", title: "Queue a follow-up call task", desc: "Adds to the CSM's queue.", supervised: false, on: true },
      ];
  }
}

function draftsFor(p: Playbook) {
  const a = actionsFor(p).filter((x) => x.supervised && /mail|note|invite|outreach|drafted/i.test(x.title + " " + x.desc));
  const previews: Record<string, string> = {
    save:
      "We noticed your domain came off — wanted to make sure that was on purpose. If not, we'd love to help reconnect it.",
    billing:
      "Quick heads-up — your last invoice didn't go through. Want to update the card so nothing pauses?",
    adoption:
      "Here's a 2-minute look at a workflow that's saving folks a lot of time lately — thought you might find it useful.",
    onboarding:
      "Want a quick hand getting past this step? Grab any time on my calendar this week.",
    expansion:
      "You're getting a lot of value here — would a quick roadmap chat be useful? No pressure.",
    retention:
      "Haven't seen you in a bit — anything I can help with? Happy to jump on if it's easier.",
  };
  return a.map((x) => ({ channel: "Email", icon: "mail", preview: previews[p.kind] }));
}

function autonomyLevel(p: Playbook): "advise" | "agree" | "auto" {
  if (p.kind === "save" || p.kind === "expansion") return "advise"; // most supervised
  if (p.kind === "billing" || p.kind === "onboarding") return "agree";
  return "auto";
}

const STATE_LABEL: Record<PlaybookState, string> = {
  off: "Off",
  ranonce: "Ran once",
  on: "On · autopilot",
  paused: "Paused",
};

export default function PlaybookDetailPage() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const playbook = useMemo(() => playbookById(id), [id]);

  const [state, setState] = useState<LadderState>(
    playbook?.state === "on" ? "on" : playbook?.state === "ranonce" ? "ranonce" : "off",
  );
  const [actions, setActions] = useState<SeedAction[]>(() => (playbook ? actionsFor(playbook) : []));
  const [activationOpen, setActivationOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [ranCount, setRanCount] = useState(0);
  const [receipt, setReceipt] = useState<{ state: "pending" | "sent" | "stopped"; ranOn: number } | null>(null);
  const [draftOpen, setDraftOpen] = useState(false);

  if (!playbook) {
    return (
      <main style={{ padding: "var(--s-7) var(--s-6)", maxWidth: 800, margin: "0 auto", color: "var(--text)" }}>
        <h1 style={{ font: "var(--t-h2)", margin: 0 }}>Playbook not found</h1>
        <div style={{ marginTop: "var(--s-3)" }}>
          <Button variant="secondary" size="sm" onClick={() => navigate("/playbooks")}>
            Back to Library
          </Button>
        </div>
      </main>
    );
  }

  const matches = matchesToday(playbook);
  const drafts = draftsFor(playbook);
  const isSave = playbook.kind === "save";

  const watchLines = {
    save: {
      summary: `A sticky setup was reversed — ${playbook.title.toLowerCase()}.`,
      cadence: "Checks every 15 minutes.",
      via: "Runs as a workflow watch.",
    },
    billing: {
      summary: "A payment failed or was declined.",
      cadence: "Checks on each billing event.",
      via: "Runs as a workflow watch.",
    },
    onboarding: {
      summary: "The account has been on the same setup step past its SLA.",
      cadence: "Checks daily.",
      via: "Runs as a workflow watch.",
    },
    adoption: {
      summary: "Core-feature usage has fallen sharply in the last month.",
      cadence: "Checks nightly.",
      via: "Runs as an AI watch.",
    },
    expansion: {
      summary: "Established account, thriving health, and a fresh positive signal.",
      cadence: "Checks weekly.",
      via: "Runs as an AI watch.",
    },
    retention: {
      summary: "The owner hasn't logged in for 21+ days.",
      cadence: "Checks nightly.",
      via: "Runs as a workflow watch.",
    },
  }[playbook.kind];

  const blastRadius =
    "Nothing is sent to the account's own clients. Drafts to the customer always need your OK first.";

  const runOnce = () => {
    if (matches.length === 0) {
      setActivationOpen(false);
      return;
    }
    if (isSave) {
      // Save plays: first action is internal alert + drafted supervised outreach
      setDraftOpen(true);
      return;
    }
    setBusy(true);
    setReceipt({ state: "pending", ranOn: matches.length });
    // simulate grace period
    window.setTimeout(() => {
      setReceipt((r) => (r ? { ...r, state: "sent" } : r));
      setRanCount(matches.length);
      setState("ranonce");
      setBusy(false);
    }, 800);
  };

  const goAutopilot = () => {
    setState("on");
  };

  const turnOff = () => {
    setState("off");
    setReceipt(null);
    setRanCount(0);
  };

  const undoReceipt = () => {
    setReceipt((r) => (r ? { ...r, state: "stopped" } : r));
  };

  const approveDraft = () => {
    setDraftOpen(false);
    setBusy(true);
    setReceipt({ state: "pending", ranOn: matches.length });
    window.setTimeout(() => {
      setReceipt((r) => (r ? { ...r, state: "sent" } : r));
      setRanCount(matches.length);
      setState("ranonce");
      setBusy(false);
    }, 800);
  };

  return (
    <main
      style={{
        padding: "var(--s-7) var(--s-6)",
        maxWidth: 1180,
        margin: "0 auto",
        color: "var(--text)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--s-5)",
      }}
    >
      {/* Breadcrumb */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--s-1)",
          font: "var(--t-meta)",
          color: "var(--text-3, var(--text))",
        }}
      >
        <Link to="/playbooks" style={{ color: "inherit", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}>
          <Icon name="arrow-left" /> Playbooks
        </Link>
        <span>·</span>
        <span>{playbook.title}</span>
      </div>

      {/* Header */}
      <header style={{ display: "flex", alignItems: "flex-start", gap: "var(--s-4)", flexWrap: "wrap" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "var(--s-2)", minWidth: 280 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--s-2)", flexWrap: "wrap" }}>
            <h1 style={{ font: "var(--t-h2)", margin: 0 }}>{playbook.title}</h1>
            <Badge variant={state === "on" ? "pos" : state === "ranonce" ? "warn" : "neutral"} dot>
              {STATE_LABEL[state as PlaybookState]}
            </Badge>
            <AutonomyBadge level={autonomyLevel(playbook)} />
          </div>
          <p style={{ font: "var(--t-body)", color: "var(--text-3, var(--text))", margin: 0 }}>
            {playbook.subtitle}
          </p>
        </div>
        <div style={{ display: "flex", gap: "var(--s-2)", alignItems: "center" }}>
          <span style={{ font: "var(--t-meta)", color: "var(--text-3, var(--text))" }}>
            <Mono>{matches.length}</Mono> match{matches.length === 1 ? "" : "es"} today
          </span>
          <Button variant="primary" size="sm" onClick={() => setActivationOpen(true)}>
            {state === "off" ? "Run it once" : state === "ranonce" ? "Keep it running" : "Manage"}
          </Button>
        </div>
      </header>

      {/* The 5-part anatomy */}
      <PlaybookDetail
        state={state as PlaybookState}
        icon={playbook.icon}
        title={playbook.title}
        subtitle={playbook.subtitle}
        problem={playbook.problem}
        does={playbook.does}
        outcome={playbook.outcome}
        watch={watchLines}
        actions={actions.map((a, i) => ({
          icon: a.icon,
          title: a.title,
          desc: a.desc,
          on: a.on,
          supervised: a.supervised,
          onToggle: (on: boolean) =>
            setActions((prev) => prev.map((x, idx) => (idx === i ? { ...x, on } : x))),
        }))}
        proof={{
          matchCount: matches.length,
          drafts,
        }}
        videoLabel="Watch a 2-min walkthrough"
        primaryLabel={state === "off" ? "Run it once" : state === "ranonce" ? "Keep it running" : "Manage"}
        onRun={() => setActivationOpen(true)}
        onPreview={() => setActivationOpen(true)}
        limits={[
          "Client-facing messages stay supervised until you opt up.",
          "Anything sent is reversible during a 5-second grace window.",
        ]}
      />

      {/* Who matches — preview list */}
      <section style={{ display: "flex", flexDirection: "column", gap: "var(--s-2)" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <h3 style={{ font: "var(--t-h3)", margin: 0 }}>Who it affects · today</h3>
          <ConfTag basis="fact" />
        </div>
        <Card padded>
          {matches.length === 0 ? (
            <span style={{ font: "var(--t-body)", color: "var(--pos-7)" }}>
              ✓ Nothing matches today — this play is armed and watching.
            </span>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column" }}>
              {matches.slice(0, 8).map((a) => (
                <li
                  key={a.identity.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "var(--s-2) 0",
                    borderTop: "1px solid var(--border)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--s-2)" }}>
                    <span style={{ font: "var(--t-body)" }}>{a.identity.name}</span>
                    <span style={{ font: "var(--t-meta)", color: "var(--text-3, var(--text))" }}>
                      · {a.identity.plan}
                    </span>
                  </div>
                  <span style={{ font: "var(--t-meta)", color: "var(--text-3, var(--text))" }}>
                    MRR <Mono>${Math.round(a.revenue.mrr).toLocaleString()}</Mono>
                  </span>
                </li>
              ))}
              {matches.length > 8 ? (
                <li
                  style={{
                    padding: "var(--s-2) 0",
                    borderTop: "1px solid var(--border)",
                    font: "var(--t-meta)",
                    color: "var(--text-3, var(--text))",
                  }}
                >
                  + <Mono>{matches.length - 8}</Mono> more
                </li>
              ) : null}
            </ul>
          )}
        </Card>
      </section>

      {/* Live receipt (in-place, never a toast) */}
      {receipt ? (
        <ActionReceipt
          state={receipt.state}
          title={`${playbook.title} — running on ${receipt.ranOn} account${receipt.ranOn === 1 ? "" : "s"}`}
          scope={`${actions.filter((a) => a.on).length} action(s) will run per matching account.`}
          blastRadius={blastRadius}
          graceSeconds={5}
          reportBack="We'll report back with what changed within 24h."
          onUndo={undoReceipt}
        />
      ) : null}

      {/* Activation drawer */}
      {activationOpen ? (
        <Overlay onClose={() => setActivationOpen(false)}>
          <PlaybookActivation
            icon={playbook.icon}
            title={playbook.title}
            situation={
              isSave
                ? `A reversal was detected — ${playbook.problem.toLowerCase()}`
                : playbook.problem
            }
            state={state}
            proof={{ matchCount: matches.length, drafts }}
            ranCount={ranCount}
            busy={busy}
            onRunOnce={runOnce}
            onAutopilot={goAutopilot}
            onTurnOff={turnOff}
            onPreview={() => setDraftOpen(true)}
            onClose={() => setActivationOpen(false)}
          />
        </Overlay>
      ) : null}

      {/* Draft review sheet — required for Save plays' first send */}
      {draftOpen && matches[0] ? (
        <Overlay onClose={() => setDraftOpen(false)}>
          <DraftReviewSheet
            account={matches[0].identity.name}
            mrr={`$${Math.round(matches[0].revenue.mrr).toLocaleString()}`}
            play={playbook.title}
            band={matches[0].health.band}
            why={
              isSave
                ? "Sticky setup was reversed — warm, blame-free outreach before they fully drift."
                : "Match for this play today."
            }
            voice="warm, plain, blame-free"
            channel="Email"
            subject={isSave ? "Quick check on your setup" : "A quick note"}
            draft={drafts[0]?.preview ?? ""}
            onApprove={approveDraft}
            onEdit={() => setDraftOpen(false)}
            onSkip={() => setDraftOpen(false)}
          />
        </Overlay>
      ) : null}
    </main>
  );
}

// Lightweight modal overlay — DS doesn't ship a Sheet primitive.
function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      role="dialog"
      aria-modal
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(8, 14, 28, 0.55)",
        display: "flex",
        alignItems: "stretch",
        justifyContent: "flex-end",
        zIndex: 50,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(560px, 100%)",
          background: "var(--surface)",
          borderLeft: "1px solid var(--border)",
          overflowY: "auto",
          padding: "var(--s-5)",
          color: "var(--text)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "var(--s-2)" }}>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close <Icon name="x" />
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
}
