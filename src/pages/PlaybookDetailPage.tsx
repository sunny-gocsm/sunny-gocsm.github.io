import { useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  Badge,
  Button,
  Card,
  Icon,
  Mono,
  PlaybookDetail,
  ConfTag,
  AccountRow,
} from "@/gocsm-ds";
import { AttentionActivation } from "@/components/attention/AttentionActivation";
import { recipeForPlaybook, type Recipe } from "@/fixtures/recipes";
import { useAutopilotStatus } from "@/state/autopilot";
import {
  playbookById,
  matchesToday,
  type Playbook,
  type PlaybookState,
} from "@/fixtures/playbooks";

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

export default function PlaybookDetailPage() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const playbook = useMemo(() => playbookById(id), [id]);

  const status = useAutopilotStatus(playbook?.id ?? "");
  const [actions, setActions] = useState<SeedAction[]>(() => (playbook ? actionsFor(playbook) : []));
  const [setupOpen, setSetupOpen] = useState(false);

  if (!playbook) {
    return (
      <main style={{ padding: "var(--s-8) var(--s-6)", maxWidth: 800, margin: "0 auto", color: "var(--text)" }}>
        <h1 style={{ fontSize: "var(--t-display-lg)", fontWeight: 700, margin: 0 }}>Playbook not found</h1>
        <div style={{ marginTop: "var(--s-3)" }}>
          <Button variant="secondary" size="sm" onClick={() => navigate("/playbooks")}>
            Back to Library
          </Button>
        </div>
      </main>
    );
  }

  const matches = matchesToday(playbook);
  const isOn = status === "on";
  const playbookState: PlaybookState = isOn ? "on" : "off";
  const baseRecipe = recipeForPlaybook(playbook.id);
  const recipe: Recipe = {
    id: playbook.id,
    icon: playbook.icon,
    label: playbook.title,
    blurb: playbook.subtitle,
    set: baseRecipe?.set ?? { match: "all", criteria: [] },
    playbookId: playbook.id,
  };

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

  return (
    <main
      style={{
        padding: "var(--s-8) var(--s-6)",
        maxWidth: 1180,
        margin: "0 auto",
        color: "var(--text)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--s-5)",
      }}
    >
      {/* Breadcrumb — quiet back nav only */}
      <Link
        to="/playbooks"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          fontSize: "var(--t-caption)",
          color: "var(--text-3, var(--text))",
          textDecoration: "none",
          width: "fit-content",
        }}
      >
        <Icon name="arrow-left" /> All playbooks
      </Link>

      {/* Hero — the single source of identity + the one focal action */}
      <header style={{ display: "flex", alignItems: "flex-start", gap: "var(--s-4)", flexWrap: "wrap" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "var(--s-2)", minWidth: 280 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--s-3)", flexWrap: "wrap" }}>
            <h1 style={{ fontSize: "var(--t-display-lg)", fontWeight: 700, lineHeight: 1.15, margin: 0 }}>
              {playbook.title}
            </h1>
            <Badge variant={isOn ? "pos" : "neutral"} dot>
              {isOn ? "On · autopilot" : "Off"}
            </Badge>
          </div>
          <p style={{ fontSize: "var(--t-body-lg)", color: "var(--text-2, var(--text))", margin: 0 }}>
            {playbook.subtitle}
          </p>
        </div>
        <div className="pbd-hero__cta" style={{ display: "flex", flexDirection: "column", gap: "var(--s-1)" }}>
          <Button variant="primary" onClick={() => setSetupOpen(true)}>
            {isOn ? "Manage workflow" : "Set up workflow"}
          </Button>
          <span style={{ fontSize: "var(--t-caption)", color: "var(--text-3, var(--text))" }}>
            {matches.length === 0 ? (
              "Nothing matches today"
            ) : (
              <>
                <Mono>{matches.length}</Mono> account{matches.length === 1 ? "" : "s"} match today
              </>
            )}
          </span>
        </div>
      </header>

      {/* Anatomy — identity is the hero above (hideIdentity); the condition lives
          once, in "What it watches for", derived from the play's own problem so it
          can never drift from what the play actually matches. */}
      <PlaybookDetail
        hideIdentity
        state={playbookState}
        icon={playbook.icon}
        outcome={playbook.outcome}
        watch={{ summary: playbook.problem, cadence: watchLines.cadence, via: watchLines.via }}
        actions={actions.map((a, i) => ({
          icon: a.icon,
          title: a.title,
          desc: a.desc,
          on: a.on,
          supervised: a.supervised,
          onToggle: (on: boolean) =>
            setActions((prev) => prev.map((x, idx) => (idx === i ? { ...x, on } : x))),
        }))}
        videoLabel="Watch a 2-min walkthrough"
        limits={[
          "Client-facing messages stay supervised until you opt up.",
          "Anything sent is reversible during a 5-second grace window.",
        ]}
      />

      {/* Who matches — preview list */}
      <section style={{ display: "flex", flexDirection: "column", gap: "var(--s-2)" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <h3 style={{ fontSize: "var(--t-heading)", fontWeight: 700, margin: 0 }}>Who it affects today</h3>
          <ConfTag basis="fact" />
        </div>
        {matches.length === 0 ? (
          <Card padded>
            <span style={{ fontSize: "var(--t-body-lg)", color: "var(--pos-7)" }}>
              ✓ Nothing matches today — this play is armed and watching.
            </span>
          </Card>
        ) : (
          <div className="mw-rows">
            {matches.slice(0, 8).map((a) => (
              <AccountRow
                key={a.identity.id}
                name={a.identity.name}
                band={a.health.band}
                value={`$${Math.round(a.revenue.mrr).toLocaleString()}`}
              />
            ))}
            {matches.length > 8 ? (
              <span style={{ fontSize: "var(--t-caption)", color: "var(--text-3, var(--text))" }}>
                + <Mono>{matches.length - 8}</Mono> more
              </span>
            ) : null}
          </div>
        )}
      </section>

      {/* The workflow builder — the same full-page flow used on the Attention page,
          pre-seeded from this playbook (consistent activation everywhere). */}
      {setupOpen ? <AttentionActivation recipe={recipe} backLabel="Playbooks" onClose={() => setSetupOpen(false)} /> : null}
    </main>
  );
}
