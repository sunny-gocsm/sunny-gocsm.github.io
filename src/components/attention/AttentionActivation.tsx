import { useState } from "react";
import { Button, Icon, Card, Mono } from "@/gocsm-ds";
import { CriteriaBuilder } from "./CriteriaBuilder";
import { autopilotStore } from "@/state/autopilot";
import { toast } from "sonner";
import { matchCount, describeSet, type CriteriaSet } from "@/fixtures/criteriaMatch";
import type { Recipe } from "@/fixtures/recipes";

// AttentionActivation — the COLLAPSED activation flow (replaces the old 6-step drawer):
//   criteria → workflow → publish (== activate, auto-runs) → done.
// No "list of actions" screen, no separate Run step, no "do you want autopilot?" — per
// the brief, publishing IS activation. A wide full-screen overlay because the criteria
// builder needs room for its two-column "controls + live wall" layout.

type Step = "criteria" | "workflow" | "done";

const ACTION_STEPS = [
  { icon: "zap", label: "When an account matches", optional: false },
  { icon: "bell", label: "Alert you in GoCSM", optional: false },
  { icon: "mail", label: "Send the owner a drafted note — your OK first", optional: true },
  { icon: "clock", label: "If still unresolved after 7 days, escalate", optional: true },
];

export function AttentionActivation({ recipe, onClose }: { recipe?: Recipe; onClose: () => void }) {
  const [step, setStep] = useState<Step>("criteria");
  const [set, setSet] = useState<CriteriaSet>(recipe ? recipe.set : { match: "all", criteria: [] });
  const n = matchCount(set);
  const playbookId = recipe?.playbookId ?? "pb-no-login";

  const publish = () => {
    autopilotStore.enable(playbookId, "review");
    toast.success("Workflow is live", { description: `Auto-running on ${n} account${n === 1 ? "" : "s"} now — and new matches as they qualify.` });
    setStep("done");
  };

  return (
    <div className="aa-overlay" role="dialog" aria-modal>
      <div className="aa-sheet">
        {/* Header */}
        <header className="aa-head">
          <div className="aa-steps">
            <span className={["aa-step", step === "criteria" ? "on" : "done"].join(" ")}>1 · Who</span>
            <Icon name="chevron-right" />
            <span className={["aa-step", step === "workflow" ? "on" : step === "done" ? "done" : ""].join(" ")}>2 · Workflow</span>
            <Icon name="chevron-right" />
            <span className={["aa-step", step === "done" ? "on" : ""].join(" ")}>3 · Live</span>
          </div>
          <Button variant="ghost" size="sm" icon={<Icon name="x" />} onClick={onClose} aria-label="Close">
            Close
          </Button>
        </header>

        {/* Body */}
        <div className="aa-body">
          {step === "criteria" ? (
            <CriteriaBuilder set={set} onChange={setSet} />
          ) : step === "workflow" ? (
            <div className="aa-workflow">
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-1)" }}>
                <h2 style={{ fontSize: "var(--t-heading)", fontWeight: 700, margin: 0 }}>The workflow</h2>
                <p style={{ margin: 0, fontSize: "var(--t-body-sm)", color: "var(--text-3, var(--text))" }}>
                  Pre-built and ready. Publishing turns it on — it runs automatically from then on.
                </p>
              </div>
              <Card padded className="accent-t info">
                <div style={{ display: "flex", alignItems: "center", gap: "var(--s-2)", marginBottom: "var(--s-3)" }}>
                  <span className="icon-chip info" aria-hidden><Icon name="radar" /></span>
                  <span style={{ fontSize: "var(--t-body-sm)", color: "var(--text)" }}>
                    Trigger: <strong style={{ fontWeight: 600 }}>{describeSet(set)}</strong> · <Mono>{n}</Mono> match now
                  </span>
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
              </Card>
            </div>
          ) : (
            <div className="aa-done">
              <span className="aa-done-ico" aria-hidden><Icon name="check-circle" /></span>
              <h2 style={{ fontSize: "var(--t-display-lg)", fontWeight: 700, margin: 0 }}>It's live</h2>
              <p style={{ margin: 0, fontSize: "var(--t-body)", color: "var(--text-2, var(--text))", textAlign: "center", maxWidth: 460 }}>
                Auto-running on <Mono>{n}</Mono> account{n === 1 ? "" : "s"} now — and on new matches the moment they qualify.
                We'll surface anyone it doesn't move on the Attention page.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="aa-foot">
          {step === "criteria" ? (
            <>
              <span style={{ fontSize: "var(--t-body-sm)", color: "var(--text-3, var(--text))" }}>
                <Mono>{n}</Mono> account{n === 1 ? "" : "s"} match
              </span>
              <Button variant="primary" iconRight={<Icon name="arrow-right" />} disabled={n === 0} onClick={() => setStep("workflow")}>
                Continue to workflow
              </Button>
            </>
          ) : step === "workflow" ? (
            <>
              <Button variant="ghost" size="sm" icon={<Icon name="arrow-left" />} onClick={() => setStep("criteria")}>
                Back
              </Button>
              <Button variant="primary" icon={<Icon name="zap" />} onClick={publish}>
                Publish &amp; turn on
              </Button>
            </>
          ) : (
            <Button variant="primary" onClick={onClose}>
              Done
            </Button>
          )}
        </footer>
      </div>
    </div>
  );
}
