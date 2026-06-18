// 4-step Playbook activation drawer.
// Opened from:
//   • Today → Needs you (single account)
//   • Today → Fix a problem (cohort, N accounts)
//   • Accounts page multi-select
//   • Playbook detail page
//
// Steps: pick (GoCSM's pick) → setup (review steps) → done (success) → autopilot offer.
// Never shows the full play catalog by default. The quiet "Choose a different play"
// reveals only plays valid for this signal.

import { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Button,
  Card,
  Icon,
  Mono,
  Toggle,
} from "@/gocsm-ds";
import { toast } from "sonner";
import {
  playbooks,
  matchesToday,
  type Playbook,
} from "@/fixtures/playbooks";
import type { Account } from "@/fixtures";

export type DrawerScope =
  | { kind: "playbook"; playbookId: string }
  | { kind: "accounts"; accountIds: string[]; suggested?: string };

interface Props {
  open: boolean;
  scope: DrawerScope | null;
  accounts: Account[]; // available pool to resolve ids
  onClose: () => void;
}

type Step = "pick" | "setup" | "done";

type StepKind = "client" | "internal" | "task";
interface PlayStep {
  id: string;
  label: string;
  kind: StepKind;
  preview?: string; // for client-facing
  needsConnect?: boolean; // for internal Slack steps
}

// Split a playbook's "does" sentence into 2-3 plain steps and classify each.
function deriveSteps(p: Playbook): PlayStep[] {
  const chunks = p.does
    .split(/,| and (?=[a-z])/i)
    .map((s) => s.trim().replace(/\.$/, ""))
    .filter(Boolean);

  return chunks.map((label, i) => {
    const l = label.toLowerCase();
    let kind: StepKind = "task";
    if (/email|message|sms|note|check-?in|sequence|drip/.test(l)) kind = "client";
    else if (/slack|alert|notif|flag|pause|surface|cs[mt]|owner/.test(l)) kind = "internal";
    else if (/call|task|book|queue|schedule|tour/.test(l)) kind = "task";

    const step: PlayStep = {
      id: `${p.id}-step-${i}`,
      label: label.charAt(0).toUpperCase() + label.slice(1),
      kind,
    };
    if (kind === "client") {
      step.preview = `Hi {first_name} — we noticed ${p.problem
        .replace(/^The /, "the ")
        .replace(/\.$/, "")}. Want to jump on a quick call this week?`;
    }
    if (kind === "internal" && /slack/.test(l)) {
      step.needsConnect = true;
    }
    return step;
  });
}

// Plain-English trigger phrase from the playbook's problem.
function plainTrigger(p: Playbook): string {
  const t = p.problem.replace(/^The /, "the ").replace(/\.$/, "");
  return t;
}

export function PlaybookActivationDrawer({ open, scope, accounts, onClose }: Props) {
  const [step, setStep] = useState<Step>("pick");
  const [selectedId, setSelectedId] = useState<string>("");
  const [showAlternates, setShowAlternates] = useState(false);
  const [stepToggles, setStepToggles] = useState<Record<string, boolean>>({});
  const [previewOpenFor, setPreviewOpenFor] = useState<string | null>(null);
  const [previewDraft, setPreviewDraft] = useState<string>("");
  const [autopilotChoice, setAutopilotChoice] = useState<"pending" | "on" | "no">("pending");
  // 0 = not in setup; 1..3 = stepped autopilot setup inside the drawer
  const [autopilotSetupStep, setAutopilotSetupStep] = useState<0 | 1 | 2 | 3>(0);

  // Resolve the effective playbook
  const playbookId = useMemo(() => {
    if (!scope) return "";
    if (scope.kind === "playbook") return scope.playbookId;
    if (selectedId) return selectedId;
    return scope.suggested ?? "";
  }, [scope, selectedId]);

  const playbook = useMemo(
    () => playbooks.find((p) => p.id === playbookId),
    [playbookId],
  );

  // Resolve targeted accounts
  const targets = useMemo<Account[]>(() => {
    if (!scope) return [];
    if (scope.kind === "accounts") {
      const set = new Set(scope.accountIds);
      return accounts.filter((a) => set.has(a.identity.id));
    }
    return playbook ? matchesToday(playbook) : [];
  }, [scope, accounts, playbook]);

  // Alternate plays — only those matching at least one targeted account.
  const alternates = useMemo(() => {
    if (!scope || scope.kind !== "accounts") return [];
    const ids = new Set(scope.accountIds);
    const list = playbooks
      .filter((p) => p.id !== playbookId)
      .map((p) => ({
        p,
        overlap: matchesToday(p).filter((a) => ids.has(a.identity.id)).length,
      }))
      .filter((x) => x.overlap > 0)
      .sort((a, b) => b.overlap - a.overlap)
      .slice(0, 5);
    return list;
  }, [scope, playbookId]);

  const playSteps = useMemo(() => (playbook ? deriveSteps(playbook) : []), [playbook]);

  // Default all steps ON when playbook changes
  useEffect(() => {
    if (!playbook) return;
    const next: Record<string, boolean> = {};
    playSteps.forEach((s) => (next[s.id] = true));
    setStepToggles(next);
  }, [playbook, playSteps]);

  if (!open || !scope) return null;

  const reset = () => {
    setStep("pick");
    setSelectedId("");
    setShowAlternates(false);
    setStepToggles({});
    setPreviewOpenFor(null);
    setPreviewDraft("");
    setAutopilotChoice("pending");
    setAutopilotSetupStep(0);
  };
  const close = () => {
    reset();
    onClose();
  };

  const targetCount = targets.length;
  const isBatch = targetCount > 1;
  const batchSuffix = isBatch ? ` for all ${targetCount}` : "";

  const runNow = () => {
    if (!playbook) return;
    const enabled = playSteps.filter((s) => stepToggles[s.id]);
    toast.success(`${playbook.title} — running${batchSuffix}`, {
      description: `${enabled.length} step${enabled.length === 1 ? "" : "s"} queued · undo for 5 seconds.`,
      duration: 5000,
      action: {
        label: "Undo",
        onClick: () => toast("Stopped — nothing was sent."),
      },
    });
    setStep("done");
  };

  const turnOnAutopilot = () => {
    setAutopilotChoice("on");
    toast.success("Autopilot on", {
      description: `GoCSM will run ${playbook?.title} whenever this happens. Change anytime in Playbooks.`,
    });
  };

  // ---------- render ----------

  return (
    <div
      role="dialog"
      aria-modal
      onClick={close}
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
          width: "min(620px, 100%)",
          background: "var(--surface)",
          borderLeft: "1px solid var(--border)",
          overflowY: "auto",
          padding: "var(--s-5)",
          color: "var(--text)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--s-4)",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ font: "var(--t-meta)", color: "var(--text-3, var(--text))" }}>
            {step === "done" ? "Done" : step === "setup" ? "Review & set up" : "GoCSM's pick"} · scoped to{" "}
            <Mono>{targetCount}</Mono> account{targetCount === 1 ? "" : "s"}
          </span>
          <Button variant="ghost" size="sm" onClick={close}>
            Close <Icon name="x" />
          </Button>
        </div>

        {/* ============= STEP 1 — PICK ============= */}
        {step === "pick" && playbook ? (
          <>
            <Card padded>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-2)" }}>
                <span style={{ font: "var(--t-meta)", textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--text-3, var(--text))" }}>
                  The problem
                </span>
                <p style={{ font: "var(--t-body)", margin: 0, color: "var(--text)" }}>
                  {playbook.problem}
                </p>
              </div>
            </Card>

            <Card
              padded
              className="accent-t info"
              style={{ borderTopColor: "var(--info-7, var(--blue-7))" }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-3)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--s-2)" }}>
                  <span className="icon-chip info" aria-hidden>
                    <Icon name="sparkles" />
                  </span>
                  <span style={{ font: "var(--t-meta)", fontWeight: 600, color: "var(--info-7, var(--text-2))" }}>
                    GoCSM recommends
                  </span>
                  <Badge variant="blue" dot={false}>
                    <Mono>{targetCount}</Mono> match{targetCount === 1 ? "" : "es"}
                  </Badge>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <strong style={{ font: "var(--t-h4, var(--t-body))", color: "var(--text)", fontWeight: 600 }}>
                    {playbook.title}
                  </strong>
                  <span style={{ font: "var(--t-body)", color: "var(--text-2, var(--text))" }}>
                    {playbook.does}
                  </span>
                </div>
                <div style={{ display: "flex", gap: "var(--s-2)", marginTop: "var(--s-1)" }}>
                  <Button variant="primary" onClick={() => setStep("setup")} icon={<Icon name="arrow-right" />}>
                    Review & set up
                  </Button>
                  {scope.kind === "accounts" && alternates.length > 0 ? (
                    <Button variant="ghost" size="sm" onClick={() => setShowAlternates((s) => !s)}>
                      {showAlternates ? "Hide" : "Choose a different play"}
                    </Button>
                  ) : null}
                </div>
              </div>
            </Card>

            {showAlternates && alternates.length > 0 ? (
              <Card padded>
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-2)" }}>
                  <span style={{ font: "var(--t-meta)", color: "var(--text-3, var(--text))" }}>
                    Other plays that fit this signal
                  </span>
                  <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                    {alternates.map(({ p, overlap }) => (
                      <li
                        key={p.id}
                        onClick={() => {
                          setSelectedId(p.id);
                          setShowAlternates(false);
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "var(--s-2)",
                          padding: "var(--s-2) 0",
                          borderTop: "1px solid var(--border)",
                          cursor: "pointer",
                        }}
                      >
                        <Icon name={p.icon} />
                        <span style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                          <span style={{ font: "var(--t-body)", color: "var(--text)" }}>{p.title}</span>
                          <span style={{ font: "var(--t-meta)", color: "var(--text-3, var(--text))" }}>
                            {p.subtitle}
                          </span>
                        </span>
                        <Badge variant="blue" dot={false}>
                          <Mono>{overlap}</Mono> match{overlap === 1 ? "" : "es"}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>
            ) : null}
          </>
        ) : null}

        {/* ============= STEP 2 — SETUP ============= */}
        {step === "setup" && playbook ? (
          <>
            <Card padded>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-3)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--s-2)" }}>
                  <Icon name={playbook.icon} />
                  <strong style={{ font: "var(--t-h4, var(--t-body))", fontWeight: 600 }}>{playbook.title}</strong>
                </div>
                <span style={{ font: "var(--t-body-sm)", color: "var(--text-2, var(--text))" }}>
                  Here's what will happen{isBatch ? ` for each of the ${targetCount} accounts` : ""}:
                </span>

                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "var(--s-2)" }}>
                  {playSteps.map((s) => {
                    const on = !!stepToggles[s.id];
                    return (
                      <li
                        key={s.id}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "var(--s-2)",
                          padding: "var(--s-3)",
                          borderRadius: "var(--r-md)",
                          background: "var(--surface-2)",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "var(--s-2)" }}>
                          <Toggle
                            on={on}
                            onChange={(next) =>
                              setStepToggles((prev) => ({ ...prev, [s.id]: next }))
                            }
                          />
                          <span style={{ flex: 1, font: "var(--t-body)", color: "var(--text)" }}>
                            {s.label}
                          </span>
                          {s.kind === "client" ? (
                            <Badge variant="warn" dot={false}>needs your OK</Badge>
                          ) : s.kind === "internal" ? (
                            <Badge variant="neutral" dot={false}>internal</Badge>
                          ) : (
                            <Badge variant="neutral" dot={false}>task</Badge>
                          )}
                        </div>

                        {on && s.kind === "client" ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-2)" }}>
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={<Icon name={previewOpenFor === s.id ? "chevron-up" : "eye"} />}
                              onClick={() => {
                                if (previewOpenFor === s.id) {
                                  setPreviewOpenFor(null);
                                } else {
                                  setPreviewOpenFor(s.id);
                                  setPreviewDraft(s.preview ?? "");
                                }
                              }}
                            >
                              {previewOpenFor === s.id ? "Hide preview" : isBatch ? "Preview on one account" : "Preview & edit"}
                            </Button>
                            {previewOpenFor === s.id ? (
                              <textarea
                                value={previewDraft}
                                onChange={(e) => setPreviewDraft(e.target.value)}
                                rows={4}
                                style={{
                                  width: "100%",
                                  font: "var(--t-body-sm)",
                                  color: "var(--text)",
                                  background: "var(--surface)",
                                  border: "1px solid var(--border)",
                                  borderRadius: "var(--r-md)",
                                  padding: "var(--s-2)",
                                  resize: "vertical",
                                }}
                              />
                            ) : null}
                          </div>
                        ) : null}

                        {on && s.kind === "internal" && s.needsConnect ? (
                          <Button variant="ghost" size="sm" icon={<Icon name="link" />}>
                            Connect Slack
                          </Button>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>

                <p
                  style={{
                    margin: 0,
                    font: "var(--t-meta)",
                    color: "var(--text-2, var(--text))",
                    fontStyle: "italic",
                  }}
                >
                  Nothing sends until you hit Run · undo for 5 seconds.
                </p>

                <div style={{ display: "flex", gap: "var(--s-2)", justifyContent: "space-between", alignItems: "center" }}>
                  <Button variant="ghost" size="sm" onClick={() => setStep("pick")} icon={<Icon name="arrow-left" />}>
                    Back
                  </Button>
                  <Button variant="primary" onClick={runNow} icon={<Icon name="play" />}>
                    Run it{batchSuffix}
                  </Button>
                </div>
              </div>
            </Card>
          </>
        ) : null}

        {/* ============= STEP 3 + 4 — DONE + AUTOPILOT ============= */}
        {step === "done" && playbook ? (
          <>
            <Card
              padded
              className="accent-t pos"
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-2)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--s-2)" }}>
                  <span className="icon-chip pos" aria-hidden>
                    <Icon name="check-circle" />
                  </span>
                  <strong style={{ font: "var(--t-h4, var(--t-body))", fontWeight: 600 }}>
                    {playbook.title} is running{batchSuffix}.
                  </strong>
                </div>
                <span style={{ font: "var(--t-body-sm)", color: "var(--text-2, var(--text))" }}>
                  We'll report back with what changed within 24h. The originating item is cleared from Today.
                </span>
              </div>
            </Card>

            {autopilotChoice === "pending" && autopilotSetupStep === 0 ? (
              <Card padded className="accent-t info">
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-3)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--s-2)" }}>
                    <span className="icon-chip info" aria-hidden>
                      <Icon name="zap" />
                    </span>
                    <strong style={{ font: "var(--t-body)", fontWeight: 600 }}>
                      Do this automatically next time?
                    </strong>
                  </div>
                  <p style={{ margin: 0, font: "var(--t-body)", color: "var(--text-2, var(--text))" }}>
                    Whenever {plainTrigger(playbook)}, GoCSM will run <strong>{playbook.title}</strong> for you — and still ask before emailing anyone.
                  </p>
                  <div style={{ display: "flex", gap: "var(--s-2)", alignItems: "center" }}>
                    <Button variant="primary" onClick={() => setAutopilotSetupStep(1)} icon={<Icon name="zap" />}>
                      Turn on autopilot
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setAutopilotChoice("no")}>
                      No thanks
                    </Button>
                  </div>
                  <span style={{ font: "var(--t-meta)", color: "var(--text-3, var(--text))" }}>
                    Change anytime in Playbooks.
                  </span>
                </div>
              </Card>
            ) : autopilotChoice === "pending" && autopilotSetupStep > 0 ? (
              <AutopilotSetup
                playbook={playbook}
                stepIndex={autopilotSetupStep as 1 | 2 | 3}
                onStepChange={(n) => setAutopilotSetupStep(n as 1 | 2 | 3)}
                targetCount={targetCount}
                onNotNow={() => setAutopilotSetupStep(0)}
                onPublish={turnOnAutopilot}
              />
            ) : (
              <Card padded>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--s-2)" }}>
                  <Icon name={autopilotChoice === "on" ? "zap" : "check"} />
                  <span style={{ font: "var(--t-body)", color: "var(--text)" }}>
                    {autopilotChoice === "on"
                      ? `Autopilot is on for "${playbook.title}".`
                      : "No autopilot — you'll be asked next time."}
                  </span>
                </div>
              </Card>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <Button variant="ghost" onClick={close}>
                Close
              </Button>
            </div>
          </>
        ) : null}

        {/* Fallback: no playbook resolved (no suggestion provided) */}
        {!playbook ? (
          <Card padded>
            <span style={{ font: "var(--t-body)", color: "var(--text-2, var(--text))" }}>
              No play selected yet.
            </span>
          </Card>
        ) : null}
      </div>
    </div>
  );
}

// ============================================================
// Autopilot setup — 3-step flow inside the same drawer.
// ============================================================

const AP_STEPS: { n: 1 | 2 | 3; label: string }[] = [
  { n: 1, label: "Who it runs for" },
  { n: 2, label: "Review the steps" },
  { n: 3, label: "Publish" },
];

function StepDots({ current }: { current: 1 | 2 | 3 }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "var(--s-2)", flexWrap: "wrap" }}>
      {AP_STEPS.map((s, i) => {
        const done = s.n < current;
        const active = s.n === current;
        return (
          <div key={s.n} style={{ display: "flex", alignItems: "center", gap: "var(--s-2)" }}>
            <span
              aria-current={active ? "step" : undefined}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 22,
                height: 22,
                borderRadius: "999px",
                background: done
                  ? "var(--pos-7, var(--success-7))"
                  : active
                  ? "var(--info-7, var(--blue-7))"
                  : "var(--surface-2)",
                color: done || active ? "var(--on-accent, #fff)" : "var(--text-3, var(--text))",
                font: "var(--t-meta)",
                fontWeight: 600,
                border: "1px solid var(--border)",
              }}
            >
              {done ? <Icon name="check" /> : s.n}
            </span>
            <span
              style={{
                font: "var(--t-meta)",
                color: active ? "var(--text)" : "var(--text-3, var(--text))",
                fontWeight: active ? 600 : 400,
              }}
            >
              {s.label}
            </span>
            {i < AP_STEPS.length - 1 ? (
              <span
                aria-hidden
                style={{ width: 18, height: 1, background: "var(--border)" }}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

interface AutopilotSetupProps {
  playbook: Playbook;
  stepIndex: 1 | 2 | 3;
  onStepChange: (n: 1 | 2 | 3) => void;
  targetCount: number;
  onNotNow: () => void;
  onPublish: () => void;
}

function AutopilotSetup({
  playbook,
  stepIndex,
  onStepChange,
  targetCount,
  onNotNow,
  onPublish,
}: AutopilotSetupProps) {
  return (
    <Card padded className="accent-t info">
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-4)" }}>
        <StepDots current={stepIndex} />

        <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-2)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--s-2)" }}>
            <span className="icon-chip info" aria-hidden>
              <Icon name={playbook.icon} />
            </span>
            <strong style={{ font: "var(--t-h4, var(--t-body))", fontWeight: 600 }}>
              {playbook.title}
            </strong>
          </div>
          <p style={{ margin: 0, font: "var(--t-body)", color: "var(--text-2, var(--text))" }}>
            {playbook.does}
          </p>
          <Button variant="ghost" size="sm" icon={<Icon name="play" />}>
            What this play does · Watch (1 min)
          </Button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-3)" }}>
          {stepIndex === 1 ? <Step1Audience playbook={playbook} /> : null}

          {stepIndex === 2 ? <Step2Actions playbook={playbook} /> : null}

          {stepIndex === 3 ? (
            <p style={{ margin: 0, font: "var(--t-body)", color: "var(--text-2, var(--text))" }}>
              Ready to keep this running? You can turn it off anytime from Playbooks.
            </p>
          ) : null}
        </div>


        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "var(--s-2)",
          }}
        >
          <Button variant="ghost" size="sm" onClick={onNotNow}>
            Not now
          </Button>
          <div style={{ display: "flex", gap: "var(--s-2)" }}>
            {stepIndex > 1 ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onStepChange((stepIndex - 1) as 1 | 2 | 3)}
                icon={<Icon name="arrow-left" />}
              >
                Back
              </Button>
            ) : null}
            {stepIndex < 3 ? (
              <Button
                variant="primary"
                onClick={() => onStepChange((stepIndex + 1) as 1 | 2 | 3)}
                icon={<Icon name="arrow-right" />}
              >
                {stepIndex === 2 ? "Continue to publish" : "Next"}
              </Button>
            ) : (
              <Button variant="primary" onClick={onPublish} icon={<Icon name="zap" />}>
                Publish
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

// ============================================================
// Step 1 — "Who it runs for" with AI-assisted refiner (simulated)
// ============================================================

type CondKind = "band" | "minMrr" | "noLoginDays" | "plan" | "notify" | "other";
interface Cond {
  id: string;
  kind: CondKind;
  group: "audience" | "signal" | "notify";
  label: string;
  // applied to the candidate pool — undefined means display-only (no filter)
  predicate?: (a: Account) => boolean;
}

// Short, plain-English phrase for the play's fixed event.
function eventPhrase(p: Playbook): string {
  const map: Record<string, string> = {
    "pb-save-a2p": "lose A2P registration",
    "pb-save-domain": "disconnect their custom domain",
    "pb-save-integration": "remove a key integration",
    "pb-payment-failed": "have a failed payment",
    "pb-no-login": "go quiet for 21+ days",
    "pb-onboarding-stalled": "stall in onboarding",
    "pb-plan-downgrade": "downgrade or drop an add-on",
    "pb-feature-drop": "stop using a core feature",
    "pb-expansion-ready": "look ready to expand",
  };
  return map[p.id] ?? p.problem.replace(/^The /, "").replace(/\.$/, "").toLowerCase();
}

const SUGGESTED: Omit<Cond, "id">[] = [
  {
    kind: "band",
    group: "audience",
    label: "Only at-risk",
    predicate: (a) => a.health.band === "atrisk",
  },
  {
    kind: "plan",
    group: "audience",
    label: "Annual plans",
    // No billing-cycle field in fixtures — display-only chip.
  },
  {
    kind: "minMrr",
    group: "audience",
    label: "Over $500 MRR",
    predicate: (a) => a.revenue.mrr > 500,
  },
  {
    kind: "noLoginDays",
    group: "signal",
    label: "No login in 30 days",
    predicate: (a) => a.login.lastLoginDaysAgo >= 30,
  },
  {
    kind: "notify",
    group: "notify",
    label: "Notify Sinan",
  },
];

// Very small NL → chip parser. Real wiring lands later.
function parsePhrase(raw: string): Omit<Cond, "id"> | null {
  const s = raw.trim().toLowerCase();
  if (!s) return null;
  if (/at[- ]?risk/.test(s)) return SUGGESTED[0];
  if (/annual/.test(s)) return SUGGESTED[1];
  const mrr = s.match(/\$?\s*(\d{2,5})\s*(?:mrr|\/mo|\b)/);
  if (mrr) {
    const n = parseInt(mrr[1], 10);
    return {
      kind: "minMrr",
      group: "audience",
      label: `Over $${n} MRR`,
      predicate: (a) => a.revenue.mrr > n,
    };
  }
  const noLogin = s.match(/no login.*?(\d+)/);
  if (noLogin) {
    const n = parseInt(noLogin[1], 10);
    return {
      kind: "noLoginDays",
      group: "signal",
      label: `No login in ${n} days`,
      predicate: (a) => a.login.lastLoginDaysAgo >= n,
    };
  }
  const notify = s.match(/notify\s+([a-z]+)/);
  if (notify) {
    const name = notify[1][0].toUpperCase() + notify[1].slice(1);
    return { kind: "notify", group: "notify", label: `Notify ${name}` };
  }
  return { kind: "other", group: "audience", label: raw.trim() };
}

const GROUP_LABEL: Record<Cond["group"], string> = {
  audience: "Audience",
  signal: "And also…",
  notify: "Notify",
};

function ChipBadge({ cond, onRemove }: { cond: Cond; onRemove: () => void }) {
  return (
    <Badge variant="neutral" dot={false}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
        {cond.label}
        <button
          aria-label={`Remove ${cond.label}`}
          onClick={onRemove}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            background: "transparent",
            border: 0,
            padding: 0,
            color: "inherit",
            cursor: "pointer",
          }}
        >
          <Icon name="x" />
        </button>
      </span>
    </Badge>
  );
}

function Step1Audience({ playbook }: { playbook: Playbook }) {
  const [mode, setMode] = useState<"auto" | "review">("auto");
  const [conds, setConds] = useState<Cond[]>([]);
  const [draft, setDraft] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [freqDays, setFreqDays] = useState(30);
  const [skipOpenTask, setSkipOpenTask] = useState(true);

  const base = useMemo(() => matchesToday(playbook), [playbook]);
  const matches = useMemo(() => {
    const preds = conds.filter((c) => c.predicate).map((c) => c.predicate!);
    return base.filter((a) => preds.every((p) => p(a)));
  }, [base, conds]);

  const addCond = (c: Omit<Cond, "id">) => {
    setConds((prev) => [...prev, { ...c, id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` }]);
  };
  const removeCond = (id: string) => setConds((prev) => prev.filter((c) => c.id !== id));

  const submitDraft = () => {
    const parsed = parsePhrase(draft);
    if (parsed) addCond(parsed);
    setDraft("");
  };

  const grouped = (g: Cond["group"]) => conds.filter((c) => c.group === g);
  const expanded = mode === "review";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-3)" }}>
      {/* The rule sentence + live count */}
      <p style={{ margin: 0, font: "var(--t-body)", color: "var(--text-2, var(--text))" }}>
        Runs automatically for accounts that {eventPhrase(playbook)} —{" "}
        <strong style={{ color: "var(--text)", font: "var(--t-h4, var(--t-body))" }}>
          <Mono>{matches.length}</Mono>
        </strong>{" "}
        right now.
      </p>

      {/* Mode toggle (segmented) */}
      <div
        role="tablist"
        style={{
          display: "inline-flex",
          gap: 4,
          padding: 4,
          borderRadius: "var(--r-md)",
          background: "var(--surface-2)",
          alignSelf: "flex-start",
        }}
      >
        {([
          { v: "auto", label: "Let GoCSM set it up" },
          { v: "review", label: "Review each piece" },
        ] as const).map((opt) => {
          const on = mode === opt.v;
          return (
            <button
              key={opt.v}
              role="tab"
              aria-selected={on}
              onClick={() => setMode(opt.v)}
              style={{
                border: 0,
                cursor: "pointer",
                padding: "6px 12px",
                borderRadius: "var(--r-sm)",
                background: on ? "var(--surface)" : "transparent",
                color: on ? "var(--text)" : "var(--text-3, var(--text))",
                font: "var(--t-meta)",
                fontWeight: on ? 600 : 400,
                boxShadow: on ? "var(--elev-1, 0 1px 2px rgba(0,0,0,0.06))" : "none",
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Fixed event (read-only) */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--s-2)",
          padding: "var(--s-2) var(--s-3)",
          borderRadius: "var(--r-md)",
          background: "var(--surface-2)",
          font: "var(--t-meta)",
          color: "var(--text-2, var(--text))",
        }}
      >
        <Icon name="lock" />
        <span>
          Runs when an account {eventPhrase(playbook)}.
        </span>
      </div>

      {/* Narrow it (refiner) */}
      {expanded ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-3)" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-2)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--s-2)" }}>
              <Icon name="sparkles" />
              <span style={{ font: "var(--t-meta)", fontWeight: 600, color: "var(--text)" }}>
                Narrow it
              </span>
              <Badge variant="neutral" dot={false}>simulated · plain-language wiring lands later</Badge>
            </div>

            <div style={{ display: "flex", gap: "var(--s-2)" }}>
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    submitDraft();
                  }
                }}
                placeholder="Tell GoCSM who this should run for…"
                style={{
                  flex: 1,
                  font: "var(--t-body-sm)",
                  color: "var(--text)",
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--r-md)",
                  padding: "var(--s-2) var(--s-3)",
                }}
              />
              <Button variant="ghost" size="sm" onClick={submitDraft} icon={<Icon name="plus" />}>
                Add
              </Button>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--s-2)" }}>
              {SUGGESTED.map((s) => (
                <button
                  key={s.label}
                  onClick={() => addCond(s)}
                  style={{
                    cursor: "pointer",
                    border: "1px dashed var(--border)",
                    background: "transparent",
                    color: "var(--text-2, var(--text))",
                    padding: "4px 10px",
                    borderRadius: "999px",
                    font: "var(--t-meta)",
                  }}
                >
                  + {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Grouped chips */}
          {(["audience", "signal", "notify"] as const).map((g) => {
            const list = grouped(g);
            if (list.length === 0) return null;
            return (
              <div key={g} style={{ display: "flex", flexDirection: "column", gap: "var(--s-2)" }}>
                <span style={{ font: "var(--t-meta)", textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--text-3, var(--text))" }}>
                  {GROUP_LABEL[g]}
                </span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--s-2)" }}>
                  {list.map((c) => (
                    <ChipBadge key={c.id} cond={c} onRemove={() => removeCond(c.id)} />
                  ))}
                </div>
              </div>
            );
          })}

          {/* Guardrails */}
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-2)" }}>
            <span style={{ font: "var(--t-meta)", textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--text-3, var(--text))" }}>
              Guardrails
            </span>

            <label style={{ display: "flex", alignItems: "center", gap: "var(--s-2)", font: "var(--t-body-sm)", color: "var(--text-2, var(--text))" }}>
              Run at most once every
              <input
                type="number"
                min={1}
                value={freqDays}
                onChange={(e) => setFreqDays(Math.max(1, parseInt(e.target.value || "1", 10)))}
                style={{
                  width: 64,
                  font: "var(--t-body-sm)",
                  color: "var(--text)",
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--r-sm)",
                  padding: "2px 6px",
                  textAlign: "right",
                }}
              />
              days per account
            </label>

            <div style={{ display: "flex", alignItems: "center", gap: "var(--s-2)" }}>
              <Toggle on={true} onChange={() => {}} />
              <span style={{ font: "var(--t-body-sm)", color: "var(--text-2, var(--text))" }}>
                Client emails always ask for your OK
              </span>
              <Badge variant="neutral" dot={false}>locked</Badge>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "var(--s-2)" }}>
              <Toggle on={skipOpenTask} onChange={setSkipOpenTask} />
              <span style={{ font: "var(--t-body-sm)", color: "var(--text-2, var(--text))" }}>
                Skip accounts with an open task
              </span>
            </div>
          </div>
        </div>
      ) : (
        <p style={{ margin: 0, font: "var(--t-meta)", color: "var(--text-3, var(--text))" }}>
          GoCSM picked sensible defaults. Switch to <em>Review each piece</em> to narrow it down.
        </p>
      )}

      {/* Preview who this affects */}
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-2)" }}>
        <Button
          variant="ghost"
          size="sm"
          icon={<Icon name={showPreview ? "chevron-up" : "eye"} />}
          onClick={() => setShowPreview((s) => !s)}
        >
          {showPreview ? "Hide preview" : `Preview who this affects (${matches.length})`}
        </Button>
        {showPreview ? (
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 6 }}>
            {matches.length === 0 ? (
              <li style={{ font: "var(--t-meta)", color: "var(--text-3, var(--text))" }}>
                No accounts match right now.
              </li>
            ) : (
              matches.slice(0, 8).map((a) => (
                <li
                  key={a.identity.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "var(--s-2)",
                    padding: "6px 10px",
                    borderRadius: "var(--r-sm)",
                    background: "var(--surface-2)",
                    font: "var(--t-body-sm)",
                  }}
                >
                  <span style={{ color: "var(--text)" }}>{a.identity.name}</span>
                  <span style={{ color: "var(--text-3, var(--text))" }}>
                    <Mono>${a.revenue.mrr}</Mono> · {a.health.band}
                  </span>
                </li>
              ))
            )}
            {matches.length > 8 ? (
              <li style={{ font: "var(--t-meta)", color: "var(--text-3, var(--text))" }}>
                +{matches.length - 8} more
              </li>
            ) : null}
          </ul>
        ) : null}
      </div>
    </div>
  );
}

// ============================================================
// Step 2 — "Review the steps" (actions review)
// ============================================================

type AudienceGroup = "team" | "customer";
type ActionKind = "notify" | "slack" | "task" | "email" | "sms";

interface ActionItem {
  id: string;
  group: AudienceGroup;
  kind: ActionKind;
  label: string;
  coreDefault?: boolean;
  draft?: string;
}

interface EscalationItem {
  id: string;
  sentence: string;
}

interface PlayPlan {
  actions: ActionItem[];
  escalation?: EscalationItem;
}

function buildPlayPlan(p: Playbook): PlayPlan {
  const byId: Record<string, PlayPlan> = {
    "pb-save-a2p": {
      actions: [
        { id: "a-notify", group: "team", kind: "notify", label: "Alert the account owner in GoCSM", coreDefault: true },
        { id: "a-slack", group: "team", kind: "slack", label: "Post to #cs-saves in Slack" },
        { id: "a-task", group: "team", kind: "task", label: "Create a re-registration assist task" },
        {
          id: "a-email",
          group: "customer",
          kind: "email",
          label: "Email the owner with a re-registration offer",
          draft:
            "Hi {first_name} — heads up: your A2P registration just lapsed, which means your SMS will stop sending. We can help you re-register today — want us to take it from here?",
        },
        { id: "a-sms", group: "customer", kind: "sms", label: "SMS the owner a short heads-up" },
      ],
      escalation: { id: "esc-a2p", sentence: "If still unregistered after 7 days, alert you directly." },
    },
    "pb-payment-failed": {
      actions: [
        { id: "p-notify", group: "team", kind: "notify", label: "Alert the account owner in GoCSM", coreDefault: true },
        { id: "p-slack", group: "team", kind: "slack", label: "Post to #cs-billing in Slack" },
        { id: "p-task", group: "team", kind: "task", label: "Create a dunning follow-up task" },
        {
          id: "p-email",
          group: "customer",
          kind: "email",
          label: "Send the dunning email",
          draft:
            "Hi {first_name} — your last payment didn't go through. Most of the time it's just an expired card. Update it here and we'll keep everything running.",
        },
        { id: "p-sms", group: "customer", kind: "sms", label: "SMS a payment reminder" },
      ],
      escalation: { id: "esc-pay", sentence: "If still unpaid after 7 days, alert you." },
    },
    "pb-no-login": {
      actions: [
        { id: "n-notify", group: "team", kind: "notify", label: "Alert the assigned CSM", coreDefault: true },
        { id: "n-slack", group: "team", kind: "slack", label: "Post to #cs-watch in Slack" },
        { id: "n-task", group: "team", kind: "task", label: "Queue a follow-up call task" },
        {
          id: "n-email",
          group: "customer",
          kind: "email",
          label: "Send a warm check-in email",
          draft:
            "Hi {first_name} — noticed it's been a couple of weeks since you logged in. Anything we can help unblock? Happy to hop on a quick call.",
        },
        { id: "n-sms", group: "customer", kind: "sms", label: "SMS a short check-in" },
      ],
      escalation: { id: "esc-login", sentence: "If no reply after 5 days, alert you." },
    },
  };

  if (byId[p.id]) return byId[p.id];

  return {
    actions: [
      { id: "g-notify", group: "team", kind: "notify", label: `Alert the account owner about ${p.title.toLowerCase()}`, coreDefault: true },
      { id: "g-slack", group: "team", kind: "slack", label: "Post a heads-up to Slack" },
      { id: "g-task", group: "team", kind: "task", label: "Create a follow-up task" },
      {
        id: "g-email",
        group: "customer",
        kind: "email",
        label: "Send a check-in email",
        draft: `Hi {first_name} — quick note from our team about ${p.problem
          .replace(/^The /, "the ")
          .replace(/\.$/, "")}. Want us to help sort it out?`,
      },
      { id: "g-sms", group: "customer", kind: "sms", label: "SMS a short follow-up" },
    ],
    escalation: { id: "esc-g", sentence: "If nothing changes after 7 days, alert you." },
  };
}

const ACTION_ICON: Record<ActionKind, string> = {
  notify: "bell",
  slack: "message-square",
  task: "check-square",
  email: "mail",
  sms: "smartphone",
};

function Step2Actions({ playbook }: { playbook: Playbook }) {
  const plan = useMemo(() => buildPlayPlan(playbook), [playbook]);

  const [enabled, setEnabled] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    let coreUsed = false;
    plan.actions.forEach((a) => {
      const on = !coreUsed && !!a.coreDefault;
      if (on) coreUsed = true;
      init[a.id] = on;
    });
    if (plan.escalation) init[plan.escalation.id] = false;
    return init;
  });

  const [drafts, setDrafts] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    plan.actions.forEach((a) => {
      if (a.kind === "email" && a.draft) init[a.id] = a.draft;
    });
    return init;
  });

  const [previewOpen, setPreviewOpen] = useState<Record<string, boolean>>({});

  const setOn = (id: string, on: boolean) => setEnabled((p) => ({ ...p, [id]: on }));

  const groupActions = (g: AudienceGroup) => plan.actions.filter((a) => a.group === g);

  const renderRow = (a: ActionItem) => {
    const on = !!enabled[a.id];
    return (
      <li
        key={a.id}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--s-2)",
          padding: "var(--s-3)",
          borderRadius: "var(--r-md)",
          background: "var(--surface-2)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "var(--s-2)" }}>
          <Toggle on={on} onChange={(next) => setOn(a.id, next)} />
          <Icon name={ACTION_ICON[a.kind]} />
          <span style={{ flex: 1, font: "var(--t-body)", color: "var(--text)" }}>{a.label}</span>
          {a.kind === "email" ? (
            <Badge variant="warn" dot={false}>needs your OK</Badge>
          ) : a.group === "team" ? (
            <Badge variant="neutral" dot={false}>internal</Badge>
          ) : (
            <Badge variant="neutral" dot={false}>customer</Badge>
          )}
        </div>

        {on && a.kind === "email" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-2)" }}>
            <Button
              variant="ghost"
              size="sm"
              icon={<Icon name={previewOpen[a.id] ? "chevron-up" : "eye"} />}
              onClick={() => setPreviewOpen((p) => ({ ...p, [a.id]: !p[a.id] }))}
            >
              {previewOpen[a.id] ? "Hide preview" : "Preview & edit"}
            </Button>
            {previewOpen[a.id] ? (
              <textarea
                value={drafts[a.id] ?? ""}
                onChange={(e) => setDrafts((p) => ({ ...p, [a.id]: e.target.value }))}
                rows={5}
                style={{
                  width: "100%",
                  font: "var(--t-body-sm)",
                  color: "var(--text)",
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--r-md)",
                  padding: "var(--s-2)",
                  resize: "vertical",
                }}
              />
            ) : null}
          </div>
        ) : null}
      </li>
    );
  };

  const Section = ({ title, items }: { title: string; items: ActionItem[] }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-2)" }}>
      <span
        style={{
          font: "var(--t-meta)",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          color: "var(--text-3, var(--text))",
        }}
      >
        {title}
      </span>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "var(--s-2)" }}>
        {items.map(renderRow)}
      </ul>
    </div>
  );

  const teamItems = groupActions("team");
  const customerItems = groupActions("customer");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-4)" }}>
      <p style={{ margin: 0, font: "var(--t-body-sm)", color: "var(--text-2, var(--text))" }}>
        Everything's off by default — switch on only what you want to run.
      </p>

      {teamItems.length > 0 ? <Section title="What your team sees" items={teamItems} /> : null}
      {customerItems.length > 0 ? <Section title="What the customer gets" items={customerItems} /> : null}

      {plan.escalation ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-2)" }}>
          <span
            style={{
              font: "var(--t-meta)",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              color: "var(--text-3, var(--text))",
            }}
          >
            If it doesn't work
          </span>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--s-2)",
              padding: "var(--s-3)",
              borderRadius: "var(--r-md)",
              background: "var(--surface-2)",
            }}
          >
            <Toggle
              on={!!enabled[plan.escalation.id]}
              onChange={(next) => setOn(plan.escalation!.id, next)}
            />
            <span style={{ flex: 1, font: "var(--t-body)", color: "var(--text)" }}>
              {plan.escalation.sentence}
            </span>
          </div>
        </div>
      ) : null}

      <p
        style={{
          margin: 0,
          font: "var(--t-meta)",
          color: "var(--text-2, var(--text))",
          fontStyle: "italic",
        }}
      >
        This is your automation. The next step opens it in your HighLevel workflow builder to
        review and publish.
      </p>
    </div>
  );
}
