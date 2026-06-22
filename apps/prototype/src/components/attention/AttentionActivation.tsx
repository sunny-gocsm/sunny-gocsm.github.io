import { useEffect, useState } from "react";
import { Button, Icon, Mono, Stepper, Toggle, Checkbox, Badge, VideoCard, AccountRow } from "@/gocsm-ds";
import { CriteriaBuilder } from "./CriteriaBuilder";
import { autopilotStore } from "@/state/autopilot";
import { saveDraft, loadDraft, clearDraft } from "@/state/workflowDrafts";
import { toast } from "sonner";
import { matchCount, describeSet, type CriteriaSet } from "@/fixtures/criteriaMatch";
import type { Recipe } from "@/fixtures/recipes";
import type { Account } from "@/fixtures";

// AttentionActivation — the FULL-PAGE workflow builder. Three clear steps:
//   ① Who it runs on (criteria + live preview) → ② Set up the workflow (watch the
//   walkthrough, customize our snapshot in HighLevel, publish it) → ③ Go live (run it).
// The build autosaves as a draft, so a user who leaves returns with their criteria
// prefilled — straight to the workflow step. The persistent header + stepper + footer
// answer "why / where am I / what's next" from every step (the ADHD orientation contract).

type Step = "criteria" | "workflow" | "review";
const STEP_INDEX: Record<Step, number> = { criteria: 0, workflow: 1, review: 2 };
const STEP_BY_INDEX: Step[] = ["criteria", "workflow", "review"];
const STEPS = [{ label: "Who it runs on" }, { label: "Set up the workflow" }, { label: "Go live" }];

const ACTION_STEPS = [
  { icon: "zap", label: "When an account matches", optional: false },
  { icon: "bell", label: "Alert you in GoCSM", optional: false },
  { icon: "mail", label: "Send the owner a drafted note — your OK first", optional: true },
  { icon: "clock", label: "If still unresolved after 7 days, escalate", optional: true },
];

function WorkflowStep({
  contextLabel,
  n,
  workflowReady,
  setWorkflowReady,
}: {
  contextLabel: string;
  n: number;
  workflowReady: boolean;
  setWorkflowReady: (v: boolean) => void;
}) {
  const openHighLevel = () => window.open("https://app.gohighlevel.com/", "_blank", "noopener,noreferrer");
  return (
    <div className="aa-step2">
      <div className="aa-pinned-chip">
        <Icon name="users" /> Running on <Mono>{n}</Mono> account{n === 1 ? "" : "s"} · {contextLabel}
      </div>

      <div className="aa-setup-head">
        <Badge variant={workflowReady ? "pos" : "warn"} dot>{workflowReady ? "Published" : "Not set up yet"}</Badge>
        <h2 style={{ fontSize: "var(--t-heading)", fontWeight: 700, margin: 0 }}>Set up your workflow</h2>
        <p style={{ margin: 0, fontSize: "var(--t-body)", color: "var(--text-2, var(--text))" }}>
          We've built a starter workflow for this playbook. Watch the 2-minute walkthrough, then open it in
          HighLevel to tweak the steps and messages for your agency — and publish it. It's not live until you do.
        </p>
      </div>

      <VideoCard title="How this workflow works" duration="2 min" />

      <div className="aa-snapshot">
        <span className="aa-snapshot-label">What's in the starter workflow</span>
        <div className="aa-steplist">
          {ACTION_STEPS.map((s, i) => (
            <div key={i} className="aa-stepline">
              <Icon name={s.icon} />
              <span style={{ flex: 1 }}>{s.label}</span>
              {s.optional ? <span className="aa-opt">optional</span> : null}
            </div>
          ))}
        </div>
      </div>

      <div className="aa-setup-actions">
        <Button variant="primary" iconRight={<Icon name="external-link" />} onClick={openHighLevel}>
          Open workflow in HighLevel
        </Button>
        <label className="aa-publish-confirm">
          <Checkbox checked={workflowReady} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWorkflowReady(e.target.checked)} />
          <span>I've customized and published it in HighLevel</span>
        </label>
      </div>
    </div>
  );
}

function ReviewStep({
  contextLabel,
  n,
  autopilot,
  setAutopilot,
  showAutopilot,
  onEditWho,
  onEditWhat,
}: {
  contextLabel: string;
  n: number;
  autopilot: boolean;
  setAutopilot: (v: boolean) => void;
  showAutopilot: boolean;
  onEditWho: () => void;
  onEditWhat: () => void;
}) {
  return (
    <div className="aa-review">
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-1)" }}>
        <h2 style={{ fontSize: "var(--t-heading)", fontWeight: 700, margin: 0 }}>Review &amp; go live</h2>
        <p style={{ margin: 0, fontSize: "var(--t-body-sm)", color: "var(--text-3, var(--text))" }}>
          One look before it starts running.
        </p>
      </div>

      <div className="aa-summary-card">
        <div className="aa-sc-head">
          <span><Icon name="users" /> Who it runs on</span>
          <button type="button" className="aa-sc-edit" onClick={onEditWho}>Edit</button>
        </div>
        <p className="aa-sc-body"><Mono>{n}</Mono> account{n === 1 ? "" : "s"} · {contextLabel}</p>
      </div>

      <div className="aa-summary-card">
        <div className="aa-sc-head">
          <span><Icon name="list-checks" /> Workflow</span>
          <button type="button" className="aa-sc-edit" onClick={onEditWhat}>Edit</button>
        </div>
        <p className="aa-sc-body">Published in HighLevel · alert you, drafted note (your OK first), escalate after 7 days.</p>
      </div>

      {showAutopilot ? (
        <div className="aa-summary-card">
          <div className="aa-sc-head"><span><Icon name="zap" /> Autopilot</span></div>
          <div className="aa-autopilot-row">
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <strong style={{ fontSize: "var(--t-body-sm)", fontWeight: 600 }}>Keep running on new matches</strong>
              <span style={{ fontSize: "var(--t-caption)", color: "var(--text-3, var(--text))" }}>
                New accounts that qualify are handled automatically — no setup each time.
              </span>
            </div>
            <Toggle on={autopilot} onChange={setAutopilot} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

// Step 1 when the user pre-selected specific accounts (e.g. from the Accounts table):
// a fixed list instead of the criteria builder — the workflow runs once on these.
function FixedSelectionStep({ accounts }: { accounts: Account[] }) {
  const sorted = [...accounts].sort((a, b) => b.revenue.mrr - a.revenue.mrr);
  return (
    <div style={{ maxWidth: 680, margin: "0 auto", display: "flex", flexDirection: "column", gap: "var(--s-4)" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-1)" }}>
        <h2 style={{ fontSize: "var(--t-heading)", fontWeight: 700, margin: 0 }}>Who it runs on</h2>
        <p style={{ margin: 0, fontSize: "var(--t-body-sm)", color: "var(--text-3, var(--text))" }}>
          The {accounts.length} account{accounts.length === 1 ? "" : "s"} you selected — the workflow runs once on these.
        </p>
      </div>
      <div className="mw-rows">
        {sorted.map((a) => (
          <AccountRow
            key={a.identity.id}
            name={a.identity.name}
            band={a.health.band}
            value={`$${Math.round(a.revenue.mrr).toLocaleString()}`}
          />
        ))}
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
  const [step, setStep] = useState<Step>(() => {
    const d = recipeId ? loadDraft(recipeId) : undefined;
    return d?.step ?? "criteria";
  });
  const [set, setSet] = useState<CriteriaSet>(() => {
    const d = recipeId ? loadDraft(recipeId) : undefined;
    return d ? { match: d.match, criteria: d.criteria } : recipe ? recipe.set : { match: "all", criteria: [] };
  });
  const [workflowReady, setWorkflowReady] = useState<boolean>(() => (recipeId ? loadDraft(recipeId)?.workflowReady ?? false : false));
  const [autopilot, setAutopilot] = useState(true);
  const [live, setLive] = useState(false);

  const fixed = !!fixedAccounts && fixedAccounts.length > 0;
  const n = fixed ? fixedAccounts!.length : matchCount(set);
  const playbookId = recipe?.playbookId ?? "pb-no-login";
  const problemName = recipe?.label ?? (fixed ? "Selected accounts" : "New workflow");
  const contextLabel = fixed ? "hand-picked from Accounts" : describeSet(set);

  // Tell the user we restored their draft (only when reopening with saved progress).
  useEffect(() => {
    if (recipeId && loadDraft(recipeId)) {
      toast("Picked up where you left off", { description: "Your criteria are restored." });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Autosave the draft as the build progresses.
  useEffect(() => {
    if (!recipeId || live) return;
    saveDraft({ recipeId, match: set.match, criteria: set.criteria, step, workflowReady, savedAt: Date.now() });
  }, [recipeId, set, step, workflowReady, live]);

  const goLive = () => {
    if (!fixed) autopilotStore.enable(playbookId, "review");
    if (recipeId) clearDraft(recipeId);
    toast.success(fixed ? "Workflow started" : "Workflow is live", {
      description: `Running on ${n} account${n === 1 ? "" : "s"} now.`,
    });
    setLive(true);
  };

  return (
    <div className="aa-fullpage" role="dialog" aria-modal>
      {/* Persistent problem-context header */}
      <header className="aa-top">
        <button type="button" className="aa-back" onClick={onClose}>
          <Icon name="arrow-left" /> {backLabel}
        </button>
        <div className="aa-top-title">
          <span className="aa-eyebrow">Set up a workflow</span>
          <h1>{problemName}</h1>
        </div>
        <span className="aa-saved"><Icon name="check" /> Saved</span>
      </header>

      {/* Stepper */}
      {!live ? (
        <div className="aa-stepper-band">
          <Stepper steps={STEPS} current={STEP_INDEX[step]} onStepClick={(i) => setStep(STEP_BY_INDEX[i])} />
        </div>
      ) : null}

      {/* Body */}
      <div className="aa-body">
        <div className="aa-body-inner">
          {live ? (
            <div className="aa-done">
              <span className="aa-done-ico" aria-hidden><Icon name="check-circle" /></span>
              <h2 style={{ fontSize: "var(--t-display-lg)", fontWeight: 700, margin: 0 }}>It's live</h2>
              <p style={{ margin: 0, fontSize: "var(--t-body)", color: "var(--text-2, var(--text))", textAlign: "center", maxWidth: 460 }}>
                {fixed ? (
                  <>Running on your <Mono>{n}</Mono> selected account{n === 1 ? "" : "s"} now. We'll surface anyone it doesn't move on the Attention page.</>
                ) : (
                  <>Auto-running on <Mono>{n}</Mono> account{n === 1 ? "" : "s"} now — and on new matches the moment they qualify. We'll surface anyone it doesn't move on the Attention page.</>
                )}
              </p>
              <Button variant="primary" onClick={onClose}>Back to {backLabel}</Button>
            </div>
          ) : step === "criteria" ? (
            fixed ? <FixedSelectionStep accounts={fixedAccounts!} /> : <CriteriaBuilder set={set} onChange={setSet} />
          ) : step === "workflow" ? (
            <WorkflowStep contextLabel={contextLabel} n={n} workflowReady={workflowReady} setWorkflowReady={setWorkflowReady} />
          ) : (
            <ReviewStep
              contextLabel={contextLabel}
              n={n}
              autopilot={autopilot}
              setAutopilot={setAutopilot}
              showAutopilot={!fixed}
              onEditWho={() => setStep("criteria")}
              onEditWhat={() => setStep("workflow")}
            />
          )}
        </div>
      </div>

      {/* Sticky footer nav */}
      {!live ? (
        <footer className="aa-foot">
          {step === "criteria" ? (
            <>
              <span className="aa-foot-note">
                {fixed ? (
                  <><Mono>{n}</Mono> account{n === 1 ? "" : "s"} selected</>
                ) : n === 0 ? (
                  "Add a condition to see who matches"
                ) : (
                  <><Mono>{n}</Mono> account{n === 1 ? "" : "s"} match</>
                )}
              </span>
              <Button variant="primary" iconRight={<Icon name="arrow-right" />} disabled={n === 0} onClick={() => setStep("workflow")}>
                Continue to setup
              </Button>
            </>
          ) : step === "workflow" ? (
            <>
              <Button variant="ghost" className="btn-accent" icon={<Icon name="arrow-left" />} onClick={() => setStep("criteria")}>
                Back
              </Button>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--s-3)" }}>
                {!workflowReady ? <span className="aa-foot-note">Publish it in HighLevel to continue</span> : null}
                <Button variant="primary" iconRight={<Icon name="arrow-right" />} disabled={!workflowReady} onClick={() => setStep("review")}>
                  Continue to go-live
                </Button>
              </div>
            </>
          ) : (
            <>
              <Button variant="ghost" className="btn-accent" icon={<Icon name="arrow-left" />} onClick={() => setStep("workflow")}>
                Back
              </Button>
              <Button variant="primary" icon={<Icon name="zap" />} onClick={goLive}>
                Start the run
              </Button>
            </>
          )}
        </footer>
      ) : null}
    </div>
  );
}
