import { useEffect, useState } from "react";
import { Button, Icon, Mono, Stepper, Toggle, Badge, VideoCard, AccountRow } from "@gocsm/design-system";
import { CriteriaBuilder } from "./CriteriaBuilder";
import { autopilotStore } from "@/state/autopilot";
import { saveDraft, loadDraft, clearDraft } from "@/state/workflowDrafts";
import { toast } from "sonner";
import { matchCount, matchAccounts, describeSet, normalize, type CriteriaSet } from "@/fixtures/criteriaMatch";
import type { Recipe } from "@/fixtures/recipes";
import type { Account } from "@/fixtures";

// AttentionActivation — the FULL-PAGE playbook builder. Three clear steps:
//   ① Who it runs on (criteria + live preview) → ② What it does (the pre-built starter
//   playbook; switch it on in HighLevel) → ③ Go live (review the real accounts it touches
//   + autopilot, then start). Going live shows a calm in-flow success beat, not just a toast.
// The build autosaves as a draft, so a user who leaves returns with their criteria
// prefilled — straight to the workflow step. The persistent header + stepper + footer
// answer "why / where am I / what's next" from every step (the ADHD orientation contract).
// See docs/design/cpdo-brief-activation-steps-2-3.md for the fidelity contract.

type Step = "criteria" | "workflow" | "review";
const STEP_INDEX: Record<Step, number> = { criteria: 0, workflow: 1, review: 2 };
const STEP_BY_INDEX: Step[] = ["criteria", "workflow", "review"];
const STEPS = [{ label: "Who it runs on" }, { label: "What it does" }, { label: "Go live" }];

const ACTION_STEPS = [
  { icon: "zap", label: "When an account matches", optional: false },
  { icon: "bell", label: "Alert you in GoCSM", optional: false },
  { icon: "mail", label: "Send the owner a drafted note — your OK first", optional: true },
  { icon: "clock", label: "If still unresolved after 7 days, escalate", optional: true },
];

// Full-width, single-line, tap-to-edit "who it runs on" scope band. Rendered in the
// fixed header stack (NOT inside the scroll area) so it's always visible and content
// scrolls cleanly beneath it — no sticky overlap. Criteria text truncates, never wraps.
function ScopeBand({ n, contextLabel, onEdit }: { n: number; contextLabel: string; onEdit: () => void }) {
  return (
    <div className="aa-scopeband">
      <button type="button" className="aa-pinned-chip" onClick={onEdit} title="Edit who it runs on">
        <Icon name="users" />
        <span className="aa-scope-text">
          Runs on <Mono>{n}</Mono> account{n === 1 ? "" : "s"} · {contextLabel}
        </span>
        <span className="aa-pinned-edit"><Icon name="pencil" /> Edit</span>
      </button>
    </div>
  );
}

function WorkflowStep({
  workflowReady,
  setWorkflowReady,
}: {
  workflowReady: boolean;
  setWorkflowReady: (v: boolean) => void;
}) {
  const openHighLevel = () => window.open("https://app.gohighlevel.com/", "_blank", "noopener,noreferrer");
  return (
      <div className="aa-step2">
        <div className="aa-setup-head">
          <Badge variant={workflowReady ? "pos" : "warn"} dot>{workflowReady ? "Published" : "Not set up yet"}</Badge>
          <h2 style={{ fontSize: "var(--t-heading)", fontWeight: 700, margin: 0 }}>What this playbook does</h2>
          <p className="aa-setup-lede">
            We built this starter playbook for you. Switch it on in HighLevel and it's live.
          </p>
        </div>

        {/* The 2-minute walkthrough is a focal element — owners rely on it to understand
            the playbook before customizing in HighLevel. Prominent card, not a buried link. */}
        <VideoCard title="How this playbook works" duration="2 min" />

        {/* What the starter playbook actually does — solid rows, this is what we built. */}
        <div className="aa-snapshot">
          <span className="aa-snapshot-label">What's in the starter playbook</span>
          <div className="aa-steplist">
            {ACTION_STEPS.map((s, i) => (
              <div key={i} className="aa-stepline">
                <span className="aa-stepline-ico" aria-hidden><Icon name={s.icon} /></span>
                <span style={{ flex: 1 }}>{s.label}</span>
                {s.optional ? <span className="aa-opt">optional</span> : null}
              </div>
            ))}
          </div>
        </div>

        {/* Two clear steps: open & publish in HighLevel, then confirm. The confirm is a
            real button + confirmed state, not a fine-print checkbox — it's the gate to go live. */}
        <div className="aa-setup-actions">
          <div className="aa-setup-step">
            <span className="aa-setup-num">1</span>
            <div className="aa-setup-step-body">
              <Button variant="primary" iconRight={<Icon name="external-link" />} onClick={openHighLevel}>
                Open in HighLevel
              </Button>
              <span className="aa-setup-hint">Tweak the messages if you want, then switch it to <strong>Publish</strong> — top-right. Come back when it's on.</span>
            </div>
          </div>
          <div className="aa-setup-step">
            <span className={`aa-setup-num${workflowReady ? " done" : ""}`}>{workflowReady ? <Icon name="check" /> : "2"}</span>
            <div className="aa-setup-step-body">
              {workflowReady ? (
                <div className="aa-published">
                  <span className="aa-published-badge"><Icon name="check-circle" /> Published in HighLevel</span>
                  <button type="button" className="aa-published-undo" onClick={() => setWorkflowReady(false)}>Not yet</button>
                </div>
              ) : (
                <button type="button" className="aa-confirm-btn" onClick={() => setWorkflowReady(true)}>
                  I've published it in HighLevel
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
  );
}

function ReviewStep({
  contextLabel,
  n,
  previewAccounts,
  autopilot,
  setAutopilot,
  showAutopilot,
  onEditWho,
  onEditWhat,
}: {
  contextLabel: string;
  n: number;
  previewAccounts: Account[];
  autopilot: boolean;
  setAutopilot: (v: boolean) => void;
  showAutopilot: boolean;
  onEditWho: () => void;
  onEditWhat: () => void;
}) {
  // Show the real accounts this touches — the one thing the persona actually reads at
  // go-live ("who is this about to hit?"). Truth made tangible is the only thing we add.
  const top = previewAccounts.slice(0, 5);
  const more = n - top.length;
  return (
    <div className="aa-review">
      {/* Hero: the audience count is the page's thesis — the now half of now-vs-future. */}
      <div className="aa-golive-hero">
        <span className="aa-golive-count"><Mono>{n}</Mono></span>
        <span className="aa-golive-count-label">account{n === 1 ? " gets" : "s get"} this playbook</span>
      </div>

      {/* Who it runs on — a glanceable preview of the real accounts. */}
      <div className="aa-summary-card">
        <div className="aa-sc-head">
          <span><Icon name="users" /> Who it runs on</span>
          <button type="button" className="aa-sc-edit" onClick={onEditWho}>Edit</button>
        </div>
        <div className="mw-rows">
          {top.map((a) => (
            <AccountRow
              key={a.identity.id}
              name={a.identity.name}
              band={a.health.band}
              value={`$${Math.round(a.revenue.mrr).toLocaleString()}`}
            />
          ))}
        </div>
        {more > 0 ? <span className="aa-golive-more">+{more} more account{more === 1 ? "" : "s"}</span> : null}
        <p className="aa-golive-sub">{contextLabel}</p>
      </div>

      {/* What it does — recap, links back to step 2. */}
      <div className="aa-summary-card">
        <div className="aa-sc-head">
          <span><Icon name="list-checks" /> What it does</span>
          <button type="button" className="aa-sc-edit" onClick={onEditWhat}>Edit</button>
        </div>
        <p className="aa-sc-body">Published in HighLevel · alert you, drafted note (your OK first), escalate after 7 days.</p>
      </div>

      {/* Autopilot — the future half, made legible against the "now" hero above.
          Default ON (the set-and-forget promise), with reversibility stated in one line. */}
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
function LiveSuccess({ n, showPause, onDone, onPause }: { n: number; showPause: boolean; onDone: () => void; onPause: () => void }) {
  return (
    <div className="aa-live">
      <span className="aa-live-check" aria-hidden><Icon name="check-circle" /></span>
      <h1 className="aa-live-title">Your playbook is live</h1>
      <p className="aa-live-body">Running on <Mono>{n}</Mono> account{n === 1 ? "" : "s"}.</p>
      <p className="aa-live-next">First check runs tonight. We'll send you a summary.</p>
      <div className="aa-live-actions">
        <Button variant="primary" onClick={onDone}>Done</Button>
        {showPause ? (
          <button type="button" className="aa-live-pause" onClick={onPause}>Pause for now</button>
        ) : null}
      </div>
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
          The {accounts.length} account{accounts.length === 1 ? "" : "s"} you selected — the playbook runs once on these.
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
    return d
      ? normalize({ match: d.match, criteria: d.criteria, nodes: d.nodes })
      : recipe
        ? normalize(recipe.set)
        : { match: "all", criteria: [], nodes: [] };
  });
  const [workflowReady, setWorkflowReady] = useState<boolean>(() => (recipeId ? loadDraft(recipeId)?.workflowReady ?? false : false));
  const [autopilot, setAutopilot] = useState(true);
  const [live, setLive] = useState(false); // shows the in-flow success beat after go-live

  const fixed = !!fixedAccounts && fixedAccounts.length > 0;
  const n = fixed ? fixedAccounts!.length : matchCount(set);
  const playbookId = recipe?.playbookId ?? "pb-no-login";
  const problemName = recipe?.label ?? (fixed ? "Selected accounts" : "New playbook");
  const contextLabel = fixed ? "hand-picked from Accounts" : describeSet(set);
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

  // Go live: enable autopilot (per the toggle), clear the draft, and show a calm in-flow
  // success beat — a real milestone confirmation, not just a corner toast.
  const goLive = () => {
    if (!fixed && autopilot) autopilotStore.enable(playbookId, "review");
    if (recipeId) clearDraft(recipeId);
    setLive(true);
  };

  // From the success beat: "Done" echoes a toast on the page we return to; "Pause for now"
  // keeps the playbook but stops auto-runs (resumable later).
  const doneLive = () => {
    toast.success(fixed ? "Playbook started" : "Playbook is live", {
      description: `Running on ${n} account${n === 1 ? "" : "s"} now.`,
      duration: 6000,
    });
    onClose();
  };
  const pauseLive = () => {
    if (!fixed) autopilotStore.pause(playbookId);
    toast("Autopilot paused", { description: "The playbook is set up — resume it anytime." });
    onClose();
  };

  if (live) {
    return (
      <div className="aa-fullpage aa-fullpage--done" role="dialog" aria-modal>
        <LiveSuccess n={n} showPause={!fixed} onDone={doneLive} onPause={pauseLive} />
      </div>
    );
  }

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

      {/* Scope band — pinned "who it runs on" context for step 2 (fixed in the header
          stack, so it never overlaps the scrolling content below). */}
      {step === "workflow" ? <ScopeBand n={n} contextLabel={contextLabel} onEdit={() => setStep("criteria")} /> : null}

      {/* Body — the review step centers its content so go-live never floats in a void. */}
      <div className={["aa-body", step === "review" ? "aa-body--center" : ""].filter(Boolean).join(" ")}>
        <div className="aa-body-inner">
          {step === "criteria" ? (
            fixed ? <FixedSelectionStep accounts={fixedAccounts!} /> : <CriteriaBuilder set={set} onChange={setSet} />
          ) : step === "workflow" ? (
            <WorkflowStep workflowReady={workflowReady} setWorkflowReady={setWorkflowReady} />
          ) : (
            <ReviewStep
              contextLabel={contextLabel}
              n={n}
              previewAccounts={previewAccounts}
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
      <footer className="aa-foot">
        {step === "criteria" ? (
          <>
            <span className="aa-foot-note">
              {fixed ? (
                <><Mono>{n}</Mono> account{n === 1 ? "" : "s"} selected</>
              ) : n === 0 ? (
                "No accounts match — try loosening a condition"
              ) : (
                <><Mono>{n}</Mono> account{n === 1 ? "" : "s"} match</>
              )}
            </span>
            <Button variant="primary" iconRight={<Icon name="arrow-right" />} disabled={n === 0} onClick={() => setStep("workflow")}>
              Continue
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
                Continue to go live
              </Button>
            </div>
          </>
        ) : (
          <>
            <Button variant="ghost" className="btn-accent" icon={<Icon name="arrow-left" />} onClick={() => setStep("workflow")}>
              Back
            </Button>
            <div className="aa-foot-commit">
              <span className="aa-foot-note">Starts tonight · pause anytime · we'll send you a summary</span>
              <Button variant="primary" icon={<Icon name="zap" />} onClick={goLive}>
                {fixed ? <>Start on <Mono>{n}</Mono> account{n === 1 ? "" : "s"}</> : "Start playbook"}
              </Button>
            </div>
          </>
        )}
      </footer>
    </div>
  );
}
