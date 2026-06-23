import { useMemo, useState, type ReactNode } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Badge, Button, Card, Icon, Mono, StatCard } from "@gocsm/design-system";
import { AttentionActivation } from "@/components/attention/AttentionActivation";
import { recipeForPlaybook, type Recipe } from "@/fixtures/recipes";
import { autopilotStore, useAutopilotStatus } from "@/state/autopilot";
import { useHealthConfigured } from "@/state/healthConfig";
import { triggers, type TriggerSpec } from "@/fixtures/triggers";
import { toast } from "sonner";
import { playbookById, matchesToday, EFFORT_LABEL, type Playbook } from "@/fixtures/playbooks";

const fmtMoney = (n: number) => "$" + Math.round(n).toLocaleString();
const fmtCompact = (n: number) =>
  n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, "") + "k" : String(n);

// A trigger is "health-based" (coined, Phase-2) if it composes the health/lifecycle/pillar
// model; everything else is HL-native (payment, login, workflow, sub-account, reversal).
// NEEDS KARTHIK #1: step structure confirmed as What → Trigger → Review/Activate.
const isHealthTrigger = (t?: TriggerSpec): boolean =>
  !!t && (t.class === "agentic-scheduler" || /\bhealth\b|lifecycle|thriving|established|pillar/i.test(`${t.title} ${t.when} ${t.note ?? ""}`));

// One short, plain-English line restating what the play achieves (Pattern 6: sell the
// outcome). Uses `outcome` — phrased as an imperative, so it reads after "GoCSM will …".
function actionPhrase(p: Playbook): string {
  return p.outcome.replace(/\.$/, "");
}

// ── Video block ─────────────────────────────────────────────────────────────
// Renders the real clip when one exists; otherwise a tasteful "coming soon"
// placeholder — never a generic stand-in (the fixture's stated convention).
// NEEDS KARTHIK #2 (hero video per playbook) and #3 (trigger-config explainer clip):
// source the assets; until then both fall back to this placeholder.
function VideoBlock({ src, poster, label, hero = false }: { src?: string; poster?: string; label: string; hero?: boolean }) {
  const has = !!src;
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: hero ? "16 / 9" : "16 / 7",
        borderRadius: "var(--r-lg, 14px)",
        overflow: "hidden",
        background: poster ? `center/cover no-repeat url(${poster})` : "linear-gradient(135deg, var(--blue-1, #eef3fc), var(--surface-2, #f4f6fb))",
        border: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {has ? (
        <video controls poster={poster} src={src} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--s-2)", color: "var(--text-3, var(--text))", textAlign: "center", padding: "var(--s-4)" }}>
          <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: hero ? 56 : 40, height: hero ? 56 : 40, borderRadius: "999px", background: "var(--surface, #fff)", border: "1px solid var(--border)", color: "var(--blue-7, #1558c0)" }}>
            <Icon name="play" />
          </span>
          <span style={{ fontSize: hero ? "var(--t-body)" : "var(--t-body-sm)", fontWeight: 600 }}>{label}</span>
          <span style={{ fontSize: "var(--t-caption)" }}>Walkthrough coming soon</span>
        </div>
      )}
    </div>
  );
}

// ── Stepped activation: one numbered step ─────────────────────────────────────
function StepCard({ n, title, subtitle, children }: { n: number; title: string; subtitle: string; children: ReactNode }) {
  return (
    <Card padded>
      <div style={{ display: "flex", gap: "var(--s-3)", alignItems: "flex-start" }}>
        <span aria-hidden style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: "999px", background: "var(--blue-7, #1558c0)", color: "#fff", fontWeight: 700, fontSize: "var(--t-body-sm)", fontVariantNumeric: "tabular-nums" }}>
          {n}
        </span>
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "var(--s-2)" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <h3 style={{ fontSize: "var(--t-subheading)", fontWeight: 700, margin: 0 }}>{title}</h3>
            <p style={{ fontSize: "var(--t-body-sm)", color: "var(--text-3, var(--text))", margin: 0 }}>{subtitle}</p>
          </div>
          {children}
        </div>
      </div>
    </Card>
  );
}

export default function PlaybookDetailPage() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const healthConfigured = useHealthConfigured();
  const playbook = useMemo(() => playbookById(id), [id]);
  const status = useAutopilotStatus(playbook?.id ?? "");
  const [confirming, setConfirming] = useState(false);
  const [scopeOpen, setScopeOpen] = useState(false);

  if (!playbook) {
    return (
      <main style={{ padding: "var(--s-8) var(--s-6)", maxWidth: 800, margin: "0 auto", color: "var(--text)" }}>
        <h1 style={{ fontSize: "var(--t-display-lg)", fontWeight: 700, margin: 0 }}>Playbook not found</h1>
        <div style={{ marginTop: "var(--s-3)" }}>
          <Button variant="secondary" size="sm" onClick={() => navigate("/playbooks")}>Back to Playbooks</Button>
        </div>
      </main>
    );
  }

  const matches = matchesToday(playbook);
  const impactMrr = matches.reduce((s, a) => s + (a.revenue?.mrr ?? 0), 0);

  // This play's trigger. A playbook whose firing condition is Health-derived (coined vocab,
  // whether from the trigger or its own problem statement) is GATED in Phase 1 — the advanced
  // play is simply unavailable until Health Config exists (Pattern 4); no coined term leaks.
  const trigger = useMemo(() => triggers.find((t) => t.populationPlaybookId === playbook.id), [playbook.id]);
  const COINED = /\b(health|healthy|thriving|watch|at[-\s]?risk|atrisk|lifecycle|established|dormant|lapsing|pillar|sentiment|churn)\b/i;
  const rawWhen = trigger ? trigger.when : playbook.problem;
  const phase1Gated = !healthConfigured && (isHealthTrigger(trigger) || COINED.test(rawWhen) || COINED.test(playbook.problem));
  const triggerWhen = trigger ? trigger.when : playbook.problem;
  // Lower-cased, trailing-period stripped — safe to embed mid-sentence ("…whenever X.").
  const triggerWhenClean = (triggerWhen.charAt(0).toLowerCase() + triggerWhen.slice(1)).replace(/\.$/, "");
  const cadence = trigger?.cadence ?? "Checks automatically in the background.";

  const recipe: Recipe = {
    id: playbook.id,
    icon: playbook.icon,
    label: playbook.title,
    blurb: playbook.subtitle,
    set: recipeForPlaybook(playbook.id)?.set ?? { match: "all", criteria: [] },
    playbookId: playbook.id,
  };

  const activate = () => {
    autopilotStore.enable(playbook.id, "auto");
    setConfirming(false);
    toast.success(`${playbook.title} is live`, {
      description: `GoCSM will ${actionPhrase(playbook).toLowerCase()} whenever ${triggerWhenClean}.`,
    });
  };

  const StatusBadge =
    status === "on" ? <Badge variant="pos" dot>Live</Badge>
    : status === "paused" ? <Badge variant="warn" dot>Paused</Badge>
    : status === "archived" ? <Badge variant="neutral" dot>Archived</Badge>
    : <Badge variant="neutral" dot={false}>Available</Badge>;

  return (
    <main style={{ padding: "var(--s-8) var(--s-6)", maxWidth: 880, margin: "0 auto", color: "var(--text)", display: "flex", flexDirection: "column", gap: "var(--s-5)" }}>
      {/* Quiet back nav */}
      <Link to="/playbooks" style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: "var(--t-caption)", color: "var(--text-3, var(--text))", textDecoration: "none", width: "fit-content" }}>
        <Icon name="arrow-left" /> All playbooks
      </Link>

      {/* 1 — VIDEO UP FRONT: the first thing the user sees. */}
      <VideoBlock src={playbook.videoUrl || undefined} poster={playbook.videoPoster} label={`How “${playbook.title}” works`} hero />

      {/* Identity + the plain-English outcome directly below the video (Pattern 6). */}
      <header style={{ display: "flex", flexDirection: "column", gap: "var(--s-2)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--s-3)", flexWrap: "wrap" }}>
          <h1 style={{ fontSize: "var(--t-display-lg)", fontWeight: 700, lineHeight: 1.15, margin: 0 }}>{playbook.title}</h1>
          {StatusBadge}
        </div>
        <p style={{ fontSize: "var(--t-body-lg)", color: "var(--text-2, var(--text))", margin: 0 }}>{playbook.outcome}</p>
      </header>

      {/* 3 — SOCIAL PROOF / EXPECTED IMPACT (Pattern 1: every value has a subtext). */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "var(--s-3)" }}>
        <StatCard
          icon="users"
          label="Used by"
          value={`${fmtCompact(playbook.usedByAgencies)} agencies`}
          caption={`${fmtCompact(playbook.totalRuns)} runs across all customers · ${EFFORT_LABEL[playbook.effort].toLowerCase()}.`}
        />
        {!phase1Gated && matches.length > 0 ? (
          <StatCard
            icon="target"
            label="Could act on now"
            value={`${matches.length} sub-account${matches.length === 1 ? "" : "s"}`}
            caption={
              healthConfigured
                ? `${fmtMoney(impactMrr)} at risk across the accounts that match today.`
                : `${fmtMoney(impactMrr)} in monthly revenue across the accounts that match today.`
            }
          />
        ) : null}
      </div>

      {/* 2 — STEPPED ACTIVATION (outcome-first): what → trigger → review & activate. */}
      <section style={{ display: "flex", flexDirection: "column", gap: "var(--s-3)" }}>
        <StepCard n={1} title="What needs to be done" subtitle="The action this playbook runs for you.">
          <p style={{ margin: 0, fontSize: "var(--t-body)", color: "var(--text-2, var(--text))" }}>{playbook.does}</p>
        </StepCard>

        <StepCard n={2} title="The trigger" subtitle="When the playbook fires — set it once and it runs on its own.">
          <Card padded style={{ background: "var(--surface-2, #f7f9fc)", border: "1px solid var(--border)" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "var(--s-2)" }}>
              <span style={{ color: "var(--blue-7, #1558c0)", marginTop: 2 }}><Icon name={phase1Gated ? "lock" : "zap"} /></span>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {phase1Gated ? (
                  <>
                    <span style={{ fontSize: "var(--t-body)", fontWeight: 600 }}>This playbook runs on Health signals.</span>
                    <span style={{ fontSize: "var(--t-body-sm)", color: "var(--text-3, var(--text))" }}>Set up Health Config (Step 3) to switch it on — until then it stays available, not running.</span>
                  </>
                ) : (
                  <>
                    <span style={{ fontSize: "var(--t-body)", fontWeight: 600 }}>Fires when {triggerWhenClean}.</span>
                    <span style={{ fontSize: "var(--t-body-sm)", color: "var(--text-3, var(--text))" }}>{cadence}</span>
                  </>
                )}
              </div>
            </div>
          </Card>
          {/* The "how to configure triggers" explainer clip (NEEDS KARTHIK #3). */}
          <VideoBlock label="How to set up triggers" />
        </StepCard>

        <StepCard n={3} title="Review scope & activate" subtitle="Confirm what it does and who it runs on, then start it.">
          {phase1Gated ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-2)", padding: "var(--s-3)", borderRadius: "var(--r-md, 10px)", background: "var(--blue-1, #eef3fc)", border: "1px solid var(--blue-3, #cdddf7)" }}>
              <span style={{ fontSize: "var(--t-body)", color: "var(--text)" }}>
                This playbook works on <strong>Health</strong> signals. Set up Health Config to switch it on — it’ll then run on its own.
              </span>
              <div>
                <Button variant="primary" icon={<Icon name="sliders" />} onClick={() => navigate("/configure")}>Set up Health Config</Button>
              </div>
            </div>
          ) : (
          <>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-2)" }}>
            <p style={{ margin: 0, fontSize: "var(--t-body)", color: "var(--text-2, var(--text))" }}>
              GoCSM will <strong>{actionPhrase(playbook).toLowerCase()}</strong> whenever <strong>{triggerWhenClean}</strong>.
            </p>
            <button
              type="button"
              onClick={() => setScopeOpen((v) => !v)}
              style={{ alignSelf: "flex-start", border: 0, background: "transparent", padding: 0, cursor: "pointer", fontSize: "var(--t-body-sm)", color: "var(--blue-7, #1558c0)", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}
            >
              {matches.length > 0 ? (
                <>Runs on <Mono>{matches.length}</Mono> sub-account{matches.length === 1 ? "" : "s"} today</>
              ) : (
                <>Nothing matches today — it watches and runs when something does</>
              )}
              {matches.length > 0 ? <Icon name={scopeOpen ? "chevron-up" : "chevron-down"} /> : null}
            </button>
            {scopeOpen && matches.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-1)", borderTop: "1px solid var(--border)", paddingTop: "var(--s-2)" }}>
                {matches.slice(0, 8).map((a) => (
                  <div key={a.identity.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "var(--t-body-sm)" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "var(--s-2)" }}>
                      {a.identity.name}
                      {healthConfigured ? <Badge variant={a.health.band === "atrisk" ? "danger" : a.health.band === "watch" ? "warn" : "pos"} dot={false}>{a.health.band === "atrisk" ? "At-Risk" : a.health.band === "watch" ? "Watch" : "Healthy"}</Badge> : null}
                    </span>
                    <Mono>{fmtMoney(a.revenue.mrr)}/mo</Mono>
                  </div>
                ))}
                {matches.length > 8 ? <span style={{ fontSize: "var(--t-caption)", color: "var(--text-3, var(--text))" }}>+ <Mono>{matches.length - 8}</Mono> more</span> : null}
              </div>
            ) : null}
          </div>

          {/* 4 — THE CTA. Confirmation restates trigger + action in one sentence first. */}
          <div style={{ marginTop: "var(--s-2)" }}>
            {status === "on" ? (
              <div style={{ display: "flex", gap: "var(--s-2)", flexWrap: "wrap" }}>
                <Button variant="ghost" className="btn-accent" icon={<Icon name="pause" />} onClick={() => { autopilotStore.pause(playbook.id); toast("Playbook paused", { description: "Stopped running. Resume anytime." }); }}>Pause</Button>
                <Button variant="ghost" className="btn-accent" icon={<Icon name="archive" />} onClick={() => { autopilotStore.archive(playbook.id); toast("Archived", { description: "Moved to Archived. History kept." }); }}>Archive</Button>
                <Button variant="secondary" icon={<Icon name="sliders" />} onClick={() => setScopeOpen(true)}>Adjust who it runs on</Button>
              </div>
            ) : status === "paused" ? (
              <Button variant="primary" icon={<Icon name="zap" />} onClick={() => { autopilotStore.resume(playbook.id); toast.success("Playbook live again", { description: `${playbook.title} is running.` }); }}>Resume playbook</Button>
            ) : status === "archived" ? (
              <Button variant="primary" icon={<Icon name="rotate-ccw" />} onClick={() => { autopilotStore.restore(playbook.id); toast("Restored", { description: "Back in Paused — turn it on when ready." }); }}>Restore playbook</Button>
            ) : confirming ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-2)", padding: "var(--s-3)", borderRadius: "var(--r-md, 10px)", background: "var(--blue-1, #eef3fc)", border: "1px solid var(--blue-3, #cdddf7)" }}>
                <span style={{ fontSize: "var(--t-body)", color: "var(--text)" }}>
                  Start now? GoCSM will <strong>{actionPhrase(playbook).toLowerCase()}</strong> whenever <strong>{triggerWhenClean}</strong>.
                </span>
                <div style={{ display: "flex", gap: "var(--s-2)" }}>
                  <Button variant="primary" icon={<Icon name="zap" />} onClick={activate}>Start playbook</Button>
                  <Button variant="ghost" onClick={() => setConfirming(false)}>Not yet</Button>
                </div>
              </div>
            ) : (
              <Button variant="primary" icon={<Icon name="zap" />} onClick={() => setConfirming(true)}>Activate playbook</Button>
            )}
          </div>
          </>
          )}
        </StepCard>
      </section>

      {/* The full criteria builder, pre-seeded — opened from "Adjust who it runs on" when
          live. Kept off the clean activation path (Pattern 7) but never removed. */}
      {status === "on" && scopeOpen ? (
        <AttentionActivation recipe={recipe} backLabel="Playbooks" onClose={() => setScopeOpen(false)} />
      ) : null}
    </main>
  );
}
