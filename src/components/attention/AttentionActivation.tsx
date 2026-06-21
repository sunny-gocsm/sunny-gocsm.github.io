import { useState } from "react";
import { Button, Icon, Mono, Stepper, Toggle } from "@/gocsm-ds";
import { CriteriaBuilder } from "./CriteriaBuilder";
import { autopilotStore } from "@/state/autopilot";
import { toast } from "sonner";
import { matchCount, describeSet, type CriteriaSet } from "@/fixtures/criteriaMatch";
import type { Recipe } from "@/fixtures/recipes";

// AttentionActivation — the FULL-PAGE workflow builder (replaces the cramped modal).
// A focused, full-viewport takeover with three clear steps:
//   ① Who it runs on (criteria + live preview) → ② What happens (the workflow) →
//   ③ Go live (review + autopilot → Start the run).
// The persistent header (problem name) + the stepper + the sticky footer answer
// "why / where am I / what's next" from every step — the ADHD orientation contract.

type Step = "criteria" | "workflow" | "review";
const STEP_INDEX: Record<Step, number> = { criteria: 0, workflow: 1, review: 2 };
const STEP_BY_INDEX: Step[] = ["criteria", "workflow", "review"];
const STEPS = [{ label: "Who it runs on" }, { label: "What happens" }, { label: "Go live" }];

const ACTION_STEPS = [
  { icon: "zap", label: "When an account matches", optional: false },
  { icon: "bell", label: "Alert you in GoCSM", optional: false },
  { icon: "mail", label: "Send the owner a drafted note — your OK first", optional: true },
  { icon: "clock", label: "If still unresolved after 7 days, escalate", optional: true },
];

function WorkflowStep({ set, n }: { set: CriteriaSet; n: number }) {
  return (
    <div className="aa-step2">
      <div className="aa-pinned-chip">
        <Icon name="users" /> Running on <Mono>{n}</Mono> account{n === 1 ? "" : "s"} · {describeSet(set)}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-1)" }}>
        <h2 style={{ fontSize: "var(--t-heading)", fontWeight: 700, margin: 0 }}>What happens when an account matches</h2>
        <p style={{ margin: 0, fontSize: "var(--t-body-sm)", color: "var(--text-3, var(--text))" }}>
          Pre-built and ready. Optional steps are off until you turn them on.
        </p>
      </div>
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
  );
}

function ReviewStep({
  set,
  n,
  autopilot,
  setAutopilot,
  onEditWho,
  onEditWhat,
}: {
  set: CriteriaSet;
  n: number;
  autopilot: boolean;
  setAutopilot: (v: boolean) => void;
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
        <p className="aa-sc-body"><Mono>{n}</Mono> account{n === 1 ? "" : "s"} · {describeSet(set)}</p>
      </div>

      <div className="aa-summary-card">
        <div className="aa-sc-head">
          <span><Icon name="list-checks" /> What happens</span>
          <button type="button" className="aa-sc-edit" onClick={onEditWhat}>Edit</button>
        </div>
        <p className="aa-sc-body">Alert you · send a drafted note (your OK first) · escalate if unresolved after 7 days.</p>
      </div>

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
    </div>
  );
}

export function AttentionActivation({ recipe, onClose }: { recipe?: Recipe; onClose: () => void }) {
  const [step, setStep] = useState<Step>("criteria");
  const [set, setSet] = useState<CriteriaSet>(recipe ? recipe.set : { match: "all", criteria: [] });
  const [autopilot, setAutopilot] = useState(true);
  const [published, setPublished] = useState(false);
  const n = matchCount(set);
  const playbookId = recipe?.playbookId ?? "pb-no-login";
  const problemName = recipe?.label ?? "New workflow";

  const publish = () => {
    autopilotStore.enable(playbookId, "review");
    toast.success("Workflow is live", { description: `Auto-running on ${n} account${n === 1 ? "" : "s"} now.` });
    setPublished(true);
  };

  return (
    <div className="aa-fullpage" role="dialog" aria-modal>
      {/* Persistent problem-context header */}
      <header className="aa-top">
        <button type="button" className="aa-back" onClick={onClose}>
          <Icon name="arrow-left" /> Attention
        </button>
        <div className="aa-top-title">
          <span className="aa-eyebrow">Set up a workflow</span>
          <h1>{problemName}</h1>
        </div>
        <span className="aa-saved"><Icon name="check" /> Saved</span>
      </header>

      {/* Stepper */}
      {!published ? (
        <div className="aa-stepper-band">
          <Stepper steps={STEPS} current={STEP_INDEX[step]} onStepClick={(i) => setStep(STEP_BY_INDEX[i])} />
        </div>
      ) : null}

      {/* Body */}
      <div className="aa-body">
        <div className="aa-body-inner">
          {published ? (
            <div className="aa-done">
              <span className="aa-done-ico" aria-hidden><Icon name="check-circle" /></span>
              <h2 style={{ fontSize: "var(--t-display-lg)", fontWeight: 700, margin: 0 }}>It's live</h2>
              <p style={{ margin: 0, fontSize: "var(--t-body)", color: "var(--text-2, var(--text))", textAlign: "center", maxWidth: 460 }}>
                Auto-running on <Mono>{n}</Mono> account{n === 1 ? "" : "s"} now — and on new matches the moment they qualify.
                We'll surface anyone it doesn't move on the Attention page.
              </p>
              <Button variant="primary" onClick={onClose}>Back to Attention</Button>
            </div>
          ) : step === "criteria" ? (
            <CriteriaBuilder set={set} onChange={setSet} />
          ) : step === "workflow" ? (
            <WorkflowStep set={set} n={n} />
          ) : (
            <ReviewStep
              set={set}
              n={n}
              autopilot={autopilot}
              setAutopilot={setAutopilot}
              onEditWho={() => setStep("criteria")}
              onEditWhat={() => setStep("workflow")}
            />
          )}
        </div>
      </div>

      {/* Sticky footer nav */}
      {!published ? (
        <footer className="aa-foot">
          {step === "criteria" ? (
            <>
              <span className="aa-foot-note">
                {n === 0 ? "Add a condition to see who matches" : <><Mono>{n}</Mono> account{n === 1 ? "" : "s"} match</>}
              </span>
              <Button variant="primary" iconRight={<Icon name="arrow-right" />} disabled={n === 0} onClick={() => setStep("workflow")}>
                Continue to actions
              </Button>
            </>
          ) : step === "workflow" ? (
            <>
              <Button variant="ghost" className="btn-accent" icon={<Icon name="arrow-left" />} onClick={() => setStep("criteria")}>
                Back
              </Button>
              <Button variant="primary" iconRight={<Icon name="arrow-right" />} onClick={() => setStep("review")}>
                Continue to go-live
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" className="btn-accent" icon={<Icon name="arrow-left" />} onClick={() => setStep("workflow")}>
                Back
              </Button>
              <Button variant="primary" icon={<Icon name="zap" />} onClick={publish}>
                Start the run
              </Button>
            </>
          )}
        </footer>
      ) : null}
    </div>
  );
}
