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
import { accounts as allAccounts, type Account, type HealthBand } from "@/fixtures";

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
          {stepIndex === 1 ? (
            <p style={{ margin: 0, font: "var(--t-body)", color: "var(--text-2, var(--text))" }}>
              GoCSM will run this for any account where {playbook.problem
                .replace(/^The /, "the ")
                .replace(/\.$/, "")}.
              {targetCount > 0 ? (
                <>
                  {" "}Right now that's <strong>{targetCount}</strong> account{targetCount === 1 ? "" : "s"}.
                </>
              ) : null}
            </p>
          ) : null}

          {stepIndex === 2 ? (
            <p style={{ margin: 0, font: "var(--t-body)", color: "var(--text-2, var(--text))" }}>
              The same steps you just approved will run each time — and GoCSM will still ask before
              emailing anyone.
            </p>
          ) : null}

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
                Next
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
