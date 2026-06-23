import { useEffect, useMemo, useState } from "react";
import { Button, Icon, Mono, Stepper, Toggle, Badge, VideoCard, AccountRow } from "@gocsm/design-system";
import { TriggerStep } from "./TriggerStep";
import { autopilotStore } from "@/state/autopilot";
import { useHealthConfigured } from "@/state/healthConfig";
import { saveDraft, loadDraft, clearDraft } from "@/state/workflowDrafts";
import { toast } from "sonner";
import { matchCount, matchAccounts, describeSet, normalize, nodesOf, isGroup, withNodes, type CriteriaSet, type Criterion } from "@/fixtures/criteriaMatch";
import { playbookById, type Playbook } from "@/fixtures/playbooks";
import type { Recipe } from "@/fixtures/recipes";
import type { Account } from "@/fixtures";

// AttentionActivation — the ONE full-page playbook setup flow, reused everywhere a user
// sets up a playbook (the Attention queue, the Playbooks catalog, the Accounts table).
// Three clear steps, outcome-first:
//   ① What it does (hero video + the actions; open & modify in HighLevel, then "I've
//      completed") → ② When & who it runs on (configure the trigger; HL-native only until
//      Health Config exists) → ③ Review & publish (the two conditions in plain English).
// The build autosaves as a draft, so a user who leaves returns with their progress.
// The persistent header + stepper + footer answer "why / where am I / what's next" from
// every step (the ADHD orientation contract).

type Step = "criteria" | "workflow" | "review";
// Display order is What-it-does (workflow) → When & who (criteria) → Review & publish.
const STEP_INDEX: Record<Step, number> = { workflow: 0, criteria: 1, review: 2 };
const STEP_BY_INDEX: Step[] = ["workflow", "criteria", "review"];
const STEPS = [{ label: "What it does" }, { label: "When & who" }, { label: "Review & publish" }];

const fmtCompact = (n: number) =>
  n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, "") + "k" : String(n);

// Phase 1: strip any Health (`health.*`) criteria from a seeded trigger so coined chips
// never render in the no-config state — gracefully degrades a health-seeded recipe to its
// HL-native parts (e.g. "at-risk & renewing" → "renewing in 30 days").
function stripHealth(s: CriteriaSet): CriteriaSet {
  const kept = nodesOf(s)
    .map((node) => (isGroup(node) ? { ...node, criteria: node.criteria.filter((c) => !c.fieldId.startsWith("health.")) } : node))
    .filter((node) => (isGroup(node) ? node.criteria.length > 0 : !(node as Criterion).fieldId.startsWith("health.")));
  return withNodes(s, kept);
}

function WorkflowStep({
  playbook,
  workflowReady,
  setWorkflowReady,
}: {
  playbook?: Playbook;
  workflowReady: boolean;
  setWorkflowReady: (v: boolean) => void;
}) {
  const openHighLevel = () => window.open("https://app.gohighlevel.com/", "_blank", "noopener,noreferrer");
  return (
      <div className="aa-step2">
        <div className="aa-setup-head">
          <Badge variant={workflowReady ? "pos" : "warn"} dot>{workflowReady ? "Ready" : "Not set up yet"}</Badge>
          <h2 style={{ fontSize: "var(--t-heading)", fontWeight: 700, margin: 0 }}>What this playbook does</h2>
          <p className="aa-setup-lede">
            {playbook ? playbook.outcome : "We built this starter playbook for you — open it, tweak the wording, then come back."}
          </p>
        </div>

        {/* Hero video — the first thing the user sees; owners rely on it to understand the
            playbook before customizing in HighLevel. Prominent card, not a buried link.
            NEEDS KARTHIK: a real per-playbook recording (placeholder card until then). */}
        <VideoCard title="How this playbook works" duration="2 min" />

        {/* What it actually does — the play's real, plain-language actions. */}
        {playbook ? (
          <div className="aa-snapshot">
            <span className="aa-snapshot-label">What it does</span>
            <p style={{ margin: 0, fontSize: "var(--t-body)", color: "var(--text-2, var(--text))" }}>{playbook.does}</p>
          </div>
        ) : null}

        {/* Social proof (Pattern 1: a number always paired with a plain subtext). */}
        {playbook ? (
          <span className="aa-setup-hint" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Icon name="users" /> Used by {fmtCompact(playbook.usedByAgencies)} agencies · {fmtCompact(playbook.totalRuns)} runs across all customers.
          </span>
        ) : null}

        {/* Open & modify in HighLevel, then confirm. The confirm is a real button + state,
            not fine print — it's the gate to continue to the trigger step. */}
        <div className="aa-setup-actions">
          <div className="aa-setup-step">
            <span className="aa-setup-num">1</span>
            <div className="aa-setup-step-body">
              <Button variant="primary" iconRight={<Icon name="external-link" />} onClick={openHighLevel}>
                Open &amp; modify it
              </Button>
              <span className="aa-setup-hint">Tweak the messages if you want, then switch it to <strong>Publish</strong> in HighLevel — top-right. Come back when it's done.</span>
            </div>
          </div>
          <div className="aa-setup-step">
            <span className={`aa-setup-num${workflowReady ? " done" : ""}`}>{workflowReady ? <Icon name="check" /> : "2"}</span>
            <div className="aa-setup-step-body">
              {workflowReady ? (
                <div className="aa-published">
                  <span className="aa-published-badge"><Icon name="check-circle" /> Completed</span>
                  <button type="button" className="aa-published-undo" onClick={() => setWorkflowReady(false)}>Not yet</button>
                </div>
              ) : (
                <button type="button" className="aa-confirm-btn" onClick={() => setWorkflowReady(true)}>
                  I've completed this
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
  );
}

function ReviewStep({
  whenLine,
  doesLine,
  n,
  previewAccounts,
  autopilot,
  setAutopilot,
  showAutopilot,
  healthConfigured,
  onEditWho,
  onEditWhat,
}: {
  whenLine: string;
  doesLine: string;
  n: number;
  previewAccounts: Account[];
  autopilot: boolean;
  setAutopilot: (v: boolean) => void;
  showAutopilot: boolean;
  healthConfigured: boolean;
  onEditWho: () => void;
  onEditWhat: () => void;
}) {
  const top = previewAccounts.slice(0, 5);
  const more = n - top.length;
  return (
    <div className="aa-review">
      <div className="aa-golive-hero">
        <h2 style={{ fontSize: "var(--t-heading)", fontWeight: 700, margin: 0 }}>Review &amp; publish</h2>
        <span className="aa-golive-count-label">Two things, in plain English — then publish.</span>
      </div>

      {/* Condition 1 — what it does. */}
      <div className="aa-summary-card">
        <div className="aa-sc-head">
          <span><Icon name="list-checks" /> What it does</span>
          <button type="button" className="aa-sc-edit" onClick={onEditWhat}>Edit</button>
        </div>
        <p className="aa-sc-body">{doesLine}</p>
      </div>

      {/* Condition 2 — when & who it runs on. Real accounts only once Health is set up. */}
      <div className="aa-summary-card">
        <div className="aa-sc-head">
          <span><Icon name="zap" /> When &amp; who it runs on</span>
          <button type="button" className="aa-sc-edit" onClick={onEditWho}>Edit</button>
        </div>
        <p className="aa-sc-body">{whenLine}.</p>
        {healthConfigured && top.length > 0 ? (
          <>
            <div className="mw-rows" style={{ marginTop: "var(--s-2)" }}>
              {top.map((a) => (
                <AccountRow key={a.identity.id} name={a.identity.name} band={a.health.band} value={`$${Math.round(a.revenue.mrr).toLocaleString()}`} />
              ))}
            </div>
            {more > 0 ? <span className="aa-golive-more">+{more} more account{more === 1 ? "" : "s"}</span> : null}
          </>
        ) : (
          <span className="aa-golive-sub"><Mono>{n}</Mono> account{n === 1 ? "" : "s"} match right now.</span>
        )}
      </div>

      {/* Autopilot — set-and-forget, reversibility stated in one line. */}
      {showAutopilot ? (
        <div className="aa-summary-card">
          <div className="aa-autopilot-row">
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <strong style={{ fontSize: "var(--t-body-sm)", fontWeight: 600 }}>Keep handling new matches</strong>
              <span style={{ fontSize: "var(--t-caption)", color: "var(--text-3, var(--text))" }}>
                New accounts that match from here on are handled automatically — pause anytime.
              </span>
            </div>
            <Toggle on={autopilot} onChange={setAutopilot} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

// The calm, right-sized confirmation after going live — a milestone beat (not a corner
// toast): what happened · what's next · a path forward + a quiet pause. No confetti.
// Step 1 when the user pre-selected specific accounts (e.g. from the Accounts table):
// a fixed list instead of the criteria builder — the workflow runs once on these.
function FixedSelectionStep({ accounts, healthConfigured }: { accounts: Account[]; healthConfigured: boolean }) {
  const sorted = [...accounts].sort((a, b) => b.revenue.mrr - a.revenue.mrr);
  return (
    <div style={{ maxWidth: 680, margin: "0 auto", display: "flex", flexDirection: "column", gap: "var(--s-4)" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-1)" }}>
        <h2 style={{ fontSize: "var(--t-heading)", fontWeight: 700, margin: 0 }}>When &amp; who it runs on</h2>
        <p style={{ margin: 0, fontSize: "var(--t-body-sm)", color: "var(--text-3, var(--text))" }}>
          The {accounts.length} account{accounts.length === 1 ? "" : "s"} you selected — the playbook runs once on these.
        </p>
      </div>
      <div className="mw-rows">
        {sorted.map((a) =>
          healthConfigured ? (
            <AccountRow key={a.identity.id} name={a.identity.name} band={a.health.band} value={`$${Math.round(a.revenue.mrr).toLocaleString()}`} />
          ) : (
            <div key={a.identity.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "var(--s-2) var(--s-3)", borderBottom: "1px solid var(--border)", fontSize: "var(--t-body-sm)" }}>
              <span>{a.identity.name}</span>
              <Mono>${Math.round(a.revenue.mrr).toLocaleString()}</Mono>
            </div>
          ),
        )}
      </div>
    </div>
  );
}

export function AttentionActivation({
  recipe,
  fixedAccounts,
  onClose,
  backLabel = "Attention",
}: {
  recipe?: Recipe;
  fixedAccounts?: Account[];
  onClose: () => void;
  backLabel?: string;
}) {
  const recipeId = recipe?.id;
  const healthConfigured = useHealthConfigured();
  const [step, setStep] = useState<Step>(() => {
    const d = recipeId ? loadDraft(recipeId) : undefined;
    return d?.step ?? "workflow"; // start at "What it does"
  });
  const [set, setSet] = useState<CriteriaSet>(() => {
    const d = recipeId ? loadDraft(recipeId) : undefined;
    const base = d
      ? normalize({ match: d.match, criteria: d.criteria, nodes: d.nodes })
      : recipe
        ? normalize(recipe.set)
        : normalize({ match: "all", criteria: [] });
    return healthConfigured ? base : stripHealth(base);
  });
  const [workflowReady, setWorkflowReady] = useState<boolean>(() => (recipeId ? loadDraft(recipeId)?.workflowReady ?? false : false));
  const [autopilot, setAutopilot] = useState(true);

  const fixed = !!fixedAccounts && fixedAccounts.length > 0;
  const n = fixed ? fixedAccounts!.length : matchCount(set);
  const playbookId = recipe?.playbookId ?? "pb-no-login";
  const playbook = playbookById(playbookId);
  const problemName = recipe?.label ?? playbook?.title ?? (fixed ? "Selected accounts" : "New playbook");
  const whenLine = fixed ? `Runs once on the ${n} account${n === 1 ? "" : "s"} you picked` : describeSet(set);
  const doesLine = playbook?.does ?? "Published in HighLevel · alerts you, sends the drafted note (your OK first), then escalates if it's still open.";

  // The playbook's baked-in behavioral trigger — read-only "fact you confirm" in Step 2.
  // (Health-stripped in Phase 1 so no coined vocab leaks.) The narrowing layers onto this.
  const baseTrigger = useMemo(() => {
    const b = recipe ? normalize(recipe.set) : normalize({ match: "all", criteria: [] });
    return healthConfigured ? b : stripHealth(b);
  }, [recipe, healthConfigured]);
  const triggerText = useMemo(() => {
    if (nodesOf(baseTrigger).length > 0) return describeSet(baseTrigger).replace(/^Accounts where /i, "");
    return healthConfigured && playbook?.problem ? playbook.problem.replace(/\.$/, "") : "this playbook’s built-in signals fire";
  }, [baseTrigger, healthConfigured, playbook]);
  // The real accounts this run touches — sorted by value, top first — for the go-live preview.
  const previewAccounts = (fixed ? fixedAccounts! : matchAccounts(set))
    .slice()
    .sort((a, b) => b.revenue.mrr - a.revenue.mrr);

  // Tell the user we restored their draft (only when reopening with saved progress).
  useEffect(() => {
    if (recipeId && loadDraft(recipeId)) {
      toast("Picked up where you left off", { description: "Your criteria are restored." });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Autosave the draft as the build progresses.
  useEffect(() => {
    if (!recipeId) return;
    saveDraft({ recipeId, match: set.match, criteria: set.criteria, nodes: set.nodes, step, workflowReady, savedAt: Date.now() });
  }, [recipeId, set, step, workflowReady]);

  // Publish: enable autopilot (per the toggle), clear the draft, fire a single green
  // success toast, and return the user to wherever they came from (no separate success page).
  const goLive = () => {
    if (!fixed && autopilot) autopilotStore.enable(playbookId, "review");
    if (recipeId) clearDraft(recipeId);
    toast.success("Your playbook is now live", {
      description: fixed
        ? `${problemName} — running on ${n} account${n === 1 ? "" : "s"} now.`
        : `${problemName} — first check runs tonight.`,
      duration: 6000,
      // Force green (the app's sonner config overrides success styling to neutral).
      style: { background: "var(--pos-soft, #e8f8e3)", border: "1px solid var(--pos-7, #2f9e1b)", color: "var(--pos-9, #1f6e12)" },
    });
    onClose();
  };

  return (
    <div className="aa-fullpage" role="dialog" aria-modal>
      {/* Persistent problem-context header */}
      <header className="aa-top">
        <button type="button" className="aa-back" onClick={onClose}>
          <Icon name="arrow-left" /> {backLabel}
        </button>
        <div className="aa-top-title">
          <span className="aa-eyebrow">Set up a playbook</span>
          <h1>{problemName}</h1>
        </div>
        <span className="aa-saved"><Icon name="check" /> Draft saved</span>
      </header>

      {/* Stepper */}
      <div className="aa-stepper-band">
        <Stepper steps={STEPS} current={STEP_INDEX[step]} onStepClick={(i) => setStep(STEP_BY_INDEX[i])} />
      </div>

      {/* Body — the review step centers its content so it never floats in a void. */}
      <div className={["aa-body", step === "review" ? "aa-body--center" : ""].filter(Boolean).join(" ")}>
        <div className="aa-body-inner">
          {step === "workflow" ? (
            <WorkflowStep playbook={playbook} workflowReady={workflowReady} setWorkflowReady={setWorkflowReady} />
          ) : step === "criteria" ? (
            fixed ? (
              <FixedSelectionStep accounts={fixedAccounts!} healthConfigured={healthConfigured} />
            ) : (
              <TriggerStep baseTrigger={baseTrigger} triggerText={triggerText} set={set} onChange={setSet} />
            )
          ) : (
            <ReviewStep
              whenLine={whenLine}
              doesLine={doesLine}
              n={n}
              previewAccounts={previewAccounts}
              autopilot={autopilot}
              setAutopilot={setAutopilot}
              showAutopilot={!fixed}
              healthConfigured={healthConfigured}
              onEditWho={() => setStep("criteria")}
              onEditWhat={() => setStep("workflow")}
            />
          )}
        </div>
      </div>

      {/* Sticky footer nav — What it does → When & who → Review & publish */}
      <footer className="aa-foot">
        {step === "workflow" ? (
          <>
            <span className="aa-foot-note">{workflowReady ? "Nice — next, set when it should run." : "Open & modify it, then mark it complete to continue."}</span>
            <Button variant="primary" iconRight={<Icon name="arrow-right" />} disabled={!workflowReady} onClick={() => setStep("criteria")}>
              Continue
            </Button>
          </>
        ) : step === "criteria" ? (
          <>
            <Button variant="ghost" className="btn-accent" icon={<Icon name="arrow-left" />} onClick={() => setStep("workflow")}>
              Back
            </Button>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--s-3)" }}>
              <span className="aa-foot-note">
                {fixed ? (
                  <><Mono>{n}</Mono> account{n === 1 ? "" : "s"} selected</>
                ) : n === 0 ? (
                  "No accounts match yet — adjust the trigger"
                ) : (
                  <><Mono>{n}</Mono> account{n === 1 ? "" : "s"} match</>
                )}
              </span>
              <Button variant="primary" iconRight={<Icon name="arrow-right" />} disabled={!fixed && n === 0} onClick={() => setStep("review")}>
                Continue
              </Button>
            </div>
          </>
        ) : (
          <>
            <Button variant="ghost" className="btn-accent" icon={<Icon name="arrow-left" />} onClick={() => setStep("criteria")}>
              Back
            </Button>
            <div className="aa-foot-commit">
              <span className="aa-foot-note">Starts tonight · pause anytime · we'll send you a summary</span>
              <Button variant="primary" icon={<Icon name="zap" />} onClick={goLive}>
                {fixed ? <>Publish on <Mono>{n}</Mono> account{n === 1 ? "" : "s"}</> : "Publish"}
              </Button>
            </div>
          </>
        )}
      </footer>
    </div>
  );
}
