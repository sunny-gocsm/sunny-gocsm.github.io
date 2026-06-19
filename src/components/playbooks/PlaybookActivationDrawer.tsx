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

import * as React from "react";
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
import { autopilotStore } from "@/state/autopilot";
import { PlayVideoButton } from "@/components/playbooks/PlayVideoButton";
import { WhatGoCSMDoes, getChannelsForPlay } from "@/components/playbooks/WhatGoCSMDoes";
import type { ChannelId } from "@/components/playbooks/WhatGoCSMDoes";

export type DrawerScope =
  | { kind: "playbook"; playbookId: string }
  | { kind: "accounts"; accountIds: string[]; suggested?: string };

// Optional deep-link: jump straight into the autopilot setup at a given step.
// Used by the Playbooks page "Edit rule" / "Review steps" controls so the same
// setup screens (Step 1 / Step 2) are reused for editing an existing play.
export type DrawerInitial = { mode: "autopilot"; step: 1 | 2 | 3 };

interface Props {
  open: boolean;
  scope: DrawerScope | null;
  accounts: Account[]; // available pool to resolve ids
  onClose: () => void;
  initial?: DrawerInitial;
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

export function PlaybookActivationDrawer({ open, scope, accounts, onClose, initial }: Props) {
  const directAutopilot = initial?.mode === "autopilot";
  const [step, setStep] = useState<Step>(directAutopilot ? "done" : "pick");
  const [selectedId, setSelectedId] = useState<string>("");
  const [showAlternates, setShowAlternates] = useState(false);
  const [stepToggles, setStepToggles] = useState<Record<string, boolean>>({});
  const [previewOpenFor, setPreviewOpenFor] = useState<string | null>(null);
  const [previewDraft, setPreviewDraft] = useState<string>("");
  const [autopilotChoice, setAutopilotChoice] = useState<"pending" | "on" | "no">("pending");
  // True once the play has been run one-time in this session — autopilot then
  // skips Step 1 ("What it does", already configured) and opens at Step 2.
  const [ranOnce, setRanOnce] = useState(false);
  // 0 = not in setup; 1..3 = stepped autopilot setup inside the drawer
  const [autopilotSetupStep, setAutopilotSetupStep] = useState<0 | 1 | 2 | 3>(
    directAutopilot ? (initial!.step as 1 | 2 | 3) : 0,
  );

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
    setRanOnce(false);
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
    setRanOnce(true);
    setStep("done");
  };

  const turnOnAutopilot = () => {
    if (!playbook) return;
    autopilotStore.enable(playbook.id);
    setAutopilotChoice("on");
    toast.success(`${playbook.title} is on autopilot`, {
      description: "Reversible · undo for 5 seconds. Change or pause anytime in Playbooks.",
      duration: 5000,
      action: {
        label: "Undo",
        onClick: () => {
          autopilotStore.disable(playbook.id);
          toast("Autopilot paused.");
        },
      },
    });
    // Close the drawer shortly after so the brief success card is visible.
    setTimeout(() => close(), 600);
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
            {directAutopilot ? "Edit autopilot" : step === "done" ? "Done" : step === "setup" ? "What GoCSM does" : "GoCSM's pick"} · scoped to{" "}
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
                    Review what GoCSM does
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

        {/* ============= STEP 2 — WHAT GOCSM DOES (one-time run) =============
            Reuses the same surface as the autopilot actions step. No inline
            editor — message editing happens in HighLevel. */}
        {step === "setup" && playbook ? (
          <>
            <Card padded>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-3)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--s-2)" }}>
                  <Icon name={playbook.icon} />
                  <strong style={{ font: "var(--t-h4, var(--t-body))", fontWeight: 600 }}>
                    What GoCSM does
                  </strong>
                </div>

                <WhatGoCSMDoes playbook={playbook} />

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
                    Run it now{batchSuffix}
                  </Button>
                </div>
              </div>
            </Card>
          </>
        ) : null}


        {/* ============= STEP 3 + 4 — DONE + AUTOPILOT ============= */}
        {step === "done" && playbook ? (
          <>
            {!directAutopilot ? (
              <Card padded className="accent-t pos">
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
            ) : null}

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
                    <Button variant="primary" onClick={() => setAutopilotSetupStep(ranOnce ? 2 : 1)} icon={<Icon name="zap" />}>
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
  { n: 1, label: "What it does" },
  { n: 2, label: "When it runs" },
  { n: 3, label: "Finish & publish" },
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
  // Lifted summary state, populated by Step1/Step2 and read by Step3.
  const [ruleSentence, setRuleSentence] = useState<string>("");
  const [ruleCount, setRuleCount] = useState<number>(0);
  const [enabledLabels, setEnabledLabels] = useState<string[]>([]);
  const [editedIds, setEditedIds] = useState<ChannelId[]>([]);

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
          <PlayVideoButton playbook={playbook} label="What this play does · Watch (1 min)" />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-3)" }}>
          <div style={{ display: stepIndex === 1 ? "block" : "none" }}>
            <WhatGoCSMDoes
              playbook={playbook}
              onEnabledChange={setEnabledLabels}
              onEditedChange={setEditedIds}
            />
          </div>

          <div style={{ display: stepIndex === 2 ? "block" : "none" }}>
            <WhenItRuns
              playbook={playbook}
              onRuleChange={(sentence, count) => {
                setRuleSentence(sentence);
                setRuleCount(count);
              }}
            />
          </div>

          {stepIndex === 3 ? (
            <Step3Summary
              ruleSentence={ruleSentence}
              ruleCount={ruleCount}
              enabledLabels={enabledLabels}
              editedLabels={useMemo(() => getChannelsForPlay(playbook).filter(c => editedIds.includes(c.id)).map(c => c.label), [playbook, editedIds])}
            />
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
                Publish automation
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

// ============================================================
// Step 2 — "When it runs"
//   Path A: Let GoCSM decide (recommended) — the play's smart default rule.
//   Path B: Choose myself — a guided 4-question wizard. Tappable, skippable,
//           one question at a time. No free-text chat (NL wiring lands later).
// ============================================================

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

type WhoAns = "all" | "atrisk" | "pick";
type PlanAns = "all" | "annual" | "pick";
type SizeAns = "any" | "over500" | "custom";
type NotifyAns = "me" | "teammate" | "slack";

const HEALTH_BANDS = ["thriving", "healthy", "steady", "atrisk"] as const;
type Band = typeof HEALTH_BANDS[number];

const BAND_LABEL: Record<Band, string> = {
  thriving: "Thriving",
  healthy: "Healthy",
  steady: "Steady",
  atrisk: "At-risk",
};

const PLAN_OPTIONS = ["Starter", "Pro", "Agency", "Enterprise"];
const TEAMMATES = ["Alex", "Sinan", "Jordan", "Priya"];
const SLACK_CHANNELS = ["#cs-watch", "#cs-saves", "#cs-billing"];

interface Answers {
  who: WhoAns;
  whoBands: Band[];
  plan: PlanAns;
  planPicks: string[];
  size: SizeAns;
  sizeAmt: number;
  notify: NotifyAns;
  notifyName: string;
  notifyChannel: string;
}

const DEFAULT_ANSWERS: Answers = {
  who: "all",
  whoBands: [],
  plan: "all",
  planPicks: [],
  size: "any",
  sizeAmt: 500,
  notify: "me",
  notifyName: TEAMMATES[0],
  notifyChannel: SLACK_CHANNELS[0],
};

function extrasFor(a: Answers): string[] {
  const out: string[] = [];
  if (a.who === "atrisk") out.push("only at-risk");
  else if (a.who === "pick" && a.whoBands.length > 0)
    out.push(a.whoBands.map((b) => BAND_LABEL[b].toLowerCase()).join(" / "));
  if (a.plan === "annual") out.push("annual plans");
  else if (a.plan === "pick" && a.planPicks.length > 0)
    out.push(`${a.planPicks.join(", ")} plans`);
  if (a.size === "over500") out.push("over $500 MRR");
  else if (a.size === "custom") out.push(`over $${a.sizeAmt} MRR`);
  return out;
}

function notifyPhrase(a: Answers): string {
  if (a.notify === "me") return "notify me";
  if (a.notify === "teammate") return `notify ${a.notifyName}`;
  return `post to ${a.notifyChannel}`;
}

function applyPredicates(base: Account[], a: Answers): Account[] {
  return base.filter((acc) => {
    const band = acc.health.band as Band;
    if (a.who === "atrisk" && band !== "atrisk") return false;
    if (a.who === "pick" && a.whoBands.length > 0 && !a.whoBands.includes(band)) return false;
    if (a.size === "over500" && !(acc.revenue.mrr > 500)) return false;
    if (a.size === "custom" && !(acc.revenue.mrr > a.sizeAmt)) return false;
    // Plan is display-only (no plan field on fixtures).
    return true;
  });
}

function buildRuleSentence(p: Playbook, a: Answers, extra: ExtraCond[] = []): string {
  const parts = [...extrasFor(a), ...extra.map((c) => c.label.toLowerCase())];
  const tail = parts.length ? ` (${parts.join(", ")})` : "";
  return `Runs for accounts that ${eventPhrase(p)}${tail}.`;
}

// ---- Advanced refiner (quiet, secondary) -----------------------------------

export type ExtraCondId = "no-login-30" | "stage" | "age" | "tag" | "signal";
export type LifecycleStage = "onboarding" | "established" | "churned";
export type AgeBucket = "under90" | "90-365" | "over365";
export type OtherSignal = "a2p-lost" | "domain-lost" | "integration-lost";

export const TAGS = ["VIP", "Enterprise", "Beta", "Trial"] as const;

const STAGE_LABEL: Record<LifecycleStage, string> = {
  onboarding: "Onboarding",
  established: "Established",
  churned: "Churned",
};
const AGE_LABEL: Record<AgeBucket, string> = {
  under90: "Under 90 days old",
  "90-365": "90-365 days old",
  over365: "Over 1 year old",
};
const SIGNAL_LABEL: Record<OtherSignal, string> = {
  "a2p-lost": "A2P registration lost",
  "domain-lost": "Domain disconnected",
  "integration-lost": "Integration removed",
};

export interface ExtraCond {
  id: ExtraCondId;
  label: string;
  predicate?: (a: Account) => boolean;
}

interface ExtraCondPicks {
  stagePick: LifecycleStage;
  agePick: AgeBucket;
  tagPick: string;
  signalPick: OtherSignal;
}

function buildExtraCond(id: ExtraCondId, picks: ExtraCondPicks): ExtraCond {
  switch (id) {
    case "no-login-30":
      return {
        id,
        label: "No login in 30 days",
        predicate: (a) => a.login.lastLoginDaysAgo >= 30,
      };
    case "stage":
      return {
        id,
        label: `Stage: ${STAGE_LABEL[picks.stagePick]}`,
        predicate: (a) => (a.lifecycle.stage as LifecycleStage) === picks.stagePick,
      };
    case "age":
      return { id, label: `Age: ${AGE_LABEL[picks.agePick]}` };
    case "tag":
      return { id, label: `Tag: ${picks.tagPick}` };
    case "signal":
      return { id, label: SIGNAL_LABEL[picks.signalPick] };
  }
}


// ---- Tap card primitives ----------------------------------------------------

function PillRow<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { v: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "var(--s-2)", flexWrap: "wrap" }}>
      <span style={{ font: "var(--t-meta)", color: "var(--text-3, var(--text))" }}>{label}</span>
      {options.map((o) => {
        const on = value === o.v;
        return (
          <button
            key={o.v}
            onClick={() => onChange(o.v)}
            aria-pressed={on}
            style={{
              cursor: "pointer",
              padding: "4px 10px",
              borderRadius: 999,
              border: `1px solid ${on ? "var(--info-7, var(--blue-7))" : "var(--border)"}`,
              background: on ? "var(--surface-2)" : "transparent",
              color: "var(--text)",
              font: "var(--t-meta)",
              fontWeight: on ? 600 : 400,
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function TapCard({
  active,
  onClick,
  title,
  hint,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  title: string;
  hint?: string;
  children?: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      style={{
        cursor: "pointer",
        textAlign: "left",
        padding: "var(--s-3)",
        borderRadius: "var(--r-md)",
        border: `1px solid ${active ? "var(--info-7, var(--blue-7))" : "var(--border)"}`,
        background: active ? "var(--surface-2)" : "var(--surface)",
        color: "var(--text)",
        display: "flex",
        flexDirection: "column",
        gap: 4,
        font: "var(--t-body)",
      }}
    >
      <span style={{ fontWeight: 600 }}>{title}</span>
      {hint ? (
        <span style={{ font: "var(--t-meta)", color: "var(--text-3, var(--text))" }}>{hint}</span>
      ) : null}
      {children}
    </button>
  );
}

function MiniProgress({ step, total }: { step: number; total: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "var(--s-2)" }}>
      <span style={{ font: "var(--t-meta)", color: "var(--text-3, var(--text))" }}>
        <Mono>{step}</Mono> of <Mono>{total}</Mono>
      </span>
      <div style={{ display: "flex", gap: 4 }}>
        {Array.from({ length: total }).map((_, i) => (
          <span
            key={i}
            aria-hidden
            style={{
              width: 28,
              height: 4,
              borderRadius: 999,
              background: i < step ? "var(--info-7, var(--blue-7))" : "var(--surface-2)",
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ---- Path B questions -------------------------------------------------------

interface QProps {
  answers: Answers;
  set: (next: Answers) => void;
}

function Q1Who({ answers, set }: QProps) {
  const toggleBand = (b: Band) => {
    const has = answers.whoBands.includes(b);
    const next = has ? answers.whoBands.filter((x) => x !== b) : [...answers.whoBands, b];
    set({ ...answers, who: "pick", whoBands: next });
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-3)" }}>
      <h4 style={{ margin: 0, font: "var(--t-h4, var(--t-body))", fontWeight: 600 }}>
        Which accounts should this run for?
      </h4>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "var(--s-2)" }}>
        <TapCard
          active={answers.who === "all"}
          onClick={() => set({ ...answers, who: "all", whoBands: [] })}
          title="All accounts"
          hint="No restriction"
        />
        <TapCard
          active={answers.who === "atrisk"}
          onClick={() => set({ ...answers, who: "atrisk", whoBands: [] })}
          title="Only at-risk"
          hint="Health band: At-risk"
        />
        <TapCard
          active={answers.who === "pick"}
          onClick={() => set({ ...answers, who: "pick" })}
          title="Pick health bands"
          hint={
            answers.who === "pick" && answers.whoBands.length > 0
              ? answers.whoBands.map((b) => BAND_LABEL[b]).join(", ")
              : "Choose one or more"
          }
        />
      </div>
      {answers.who === "pick" ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--s-2)" }}>
          {HEALTH_BANDS.map((b) => {
            const on = answers.whoBands.includes(b);
            return (
              <button
                key={b}
                onClick={() => toggleBand(b)}
                aria-pressed={on}
                style={{
                  cursor: "pointer",
                  padding: "6px 12px",
                  borderRadius: 999,
                  border: `1px solid ${on ? "var(--info-7, var(--blue-7))" : "var(--border)"}`,
                  background: on ? "var(--surface-2)" : "transparent",
                  color: "var(--text)",
                  font: "var(--t-meta)",
                  fontWeight: on ? 600 : 400,
                }}
              >
                {BAND_LABEL[b]}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function Q2Plan({ answers, set }: QProps) {
  const togglePlan = (name: string) => {
    const has = answers.planPicks.includes(name);
    const next = has ? answers.planPicks.filter((x) => x !== name) : [...answers.planPicks, name];
    set({ ...answers, plan: "pick", planPicks: next });
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-3)" }}>
      <h4 style={{ margin: 0, font: "var(--t-h4, var(--t-body))", fontWeight: 600 }}>
        Which plans?
      </h4>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "var(--s-2)" }}>
        <TapCard
          active={answers.plan === "all"}
          onClick={() => set({ ...answers, plan: "all", planPicks: [] })}
          title="All plans"
          hint="No restriction"
        />
        <TapCard
          active={answers.plan === "annual"}
          onClick={() => set({ ...answers, plan: "annual", planPicks: [] })}
          title="Only annual"
          hint="Annual billing cycle"
        />
        <TapCard
          active={answers.plan === "pick"}
          onClick={() => set({ ...answers, plan: "pick" })}
          title="Pick plans"
          hint={
            answers.plan === "pick" && answers.planPicks.length > 0
              ? answers.planPicks.join(", ")
              : "Choose one or more"
          }
        />
      </div>
      {answers.plan === "pick" ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--s-2)" }}>
          {PLAN_OPTIONS.map((p) => {
            const on = answers.planPicks.includes(p);
            return (
              <button
                key={p}
                onClick={() => togglePlan(p)}
                aria-pressed={on}
                style={{
                  cursor: "pointer",
                  padding: "6px 12px",
                  borderRadius: 999,
                  border: `1px solid ${on ? "var(--info-7, var(--blue-7))" : "var(--border)"}`,
                  background: on ? "var(--surface-2)" : "transparent",
                  color: "var(--text)",
                  font: "var(--t-meta)",
                  fontWeight: on ? 600 : 400,
                }}
              >
                {p}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function Q3Size({ answers, set }: QProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-3)" }}>
      <h4 style={{ margin: 0, font: "var(--t-h4, var(--t-body))", fontWeight: 600 }}>
        Any minimum account size?
      </h4>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "var(--s-2)" }}>
        <TapCard
          active={answers.size === "any"}
          onClick={() => set({ ...answers, size: "any" })}
          title="Any size"
          hint="No restriction"
        />
        <TapCard
          active={answers.size === "over500"}
          onClick={() => set({ ...answers, size: "over500" })}
          title="Over $500 MRR"
          hint="Standard threshold"
        />
        <TapCard
          active={answers.size === "custom"}
          onClick={() => set({ ...answers, size: "custom" })}
          title="Set amount"
          hint={answers.size === "custom" ? `Over $${answers.sizeAmt} MRR` : "Pick a number"}
        />
      </div>
      {answers.size === "custom" ? (
        <label style={{ display: "flex", alignItems: "center", gap: "var(--s-2)", font: "var(--t-body-sm)", color: "var(--text-2, var(--text))" }}>
          Over $
          <input
            type="number"
            min={0}
            step={50}
            value={answers.sizeAmt}
            onChange={(e) => set({ ...answers, sizeAmt: Math.max(0, parseInt(e.target.value || "0", 10)) })}
            style={{
              width: 96,
              font: "var(--t-body-sm)",
              color: "var(--text)",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--r-sm)",
              padding: "4px 8px",
              textAlign: "right",
            }}
          />
          MRR
        </label>
      ) : null}
    </div>
  );
}

function Q4Notify({ answers, set }: QProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-3)" }}>
      <h4 style={{ margin: 0, font: "var(--t-h4, var(--t-body))", fontWeight: 600 }}>
        Who should GoCSM notify when this runs?
      </h4>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "var(--s-2)" }}>
        <TapCard
          active={answers.notify === "me"}
          onClick={() => set({ ...answers, notify: "me" })}
          title="Just me"
          hint="Notify you directly"
        />
        <TapCard
          active={answers.notify === "teammate"}
          onClick={() => set({ ...answers, notify: "teammate" })}
          title="A teammate"
          hint={answers.notify === "teammate" ? answers.notifyName : "Pick a teammate"}
        />
        <TapCard
          active={answers.notify === "slack"}
          onClick={() => set({ ...answers, notify: "slack" })}
          title="A Slack channel"
          hint={answers.notify === "slack" ? answers.notifyChannel : "Pick a channel"}
        />
      </div>
      {answers.notify === "teammate" ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--s-2)" }}>
          {TEAMMATES.map((t) => {
            const on = answers.notifyName === t;
            return (
              <button
                key={t}
                onClick={() => set({ ...answers, notifyName: t })}
                aria-pressed={on}
                style={{
                  cursor: "pointer",
                  padding: "6px 12px",
                  borderRadius: 999,
                  border: `1px solid ${on ? "var(--info-7, var(--blue-7))" : "var(--border)"}`,
                  background: on ? "var(--surface-2)" : "transparent",
                  color: "var(--text)",
                  font: "var(--t-meta)",
                  fontWeight: on ? 600 : 400,
                }}
              >
                {t}
              </button>
            );
          })}
        </div>
      ) : null}
      {answers.notify === "slack" ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--s-2)" }}>
          {SLACK_CHANNELS.map((c) => {
            const on = answers.notifyChannel === c;
            return (
              <button
                key={c}
                onClick={() => set({ ...answers, notifyChannel: c })}
                aria-pressed={on}
                style={{
                  cursor: "pointer",
                  padding: "6px 12px",
                  borderRadius: 999,
                  border: `1px solid ${on ? "var(--info-7, var(--blue-7))" : "var(--border)"}`,
                  background: on ? "var(--surface-2)" : "transparent",
                  color: "var(--text)",
                  font: "var(--t-meta)",
                  fontWeight: on ? 600 : 400,
                }}
              >
                {c}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

// ---- Top-level Step 2 surface ----------------------------------------------

function WhenItRuns({
  playbook,
  onRuleChange,
}: {
  playbook: Playbook;
  onRuleChange?: (sentence: string, count: number) => void;
}) {
  const [path, setPath] = useState<"auto" | "guided">("auto");
  const [answers, setAnswers] = useState<Answers>(DEFAULT_ANSWERS);
  const [qIdx, setQIdx] = useState<0 | 1 | 2 | 3>(0);
  const [showPreview, setShowPreview] = useState(false);

  // Advanced refiner — quiet, hidden until asked for.
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [extras, setExtras] = useState<ExtraCondId[]>([]);
  const [stagePick, setStagePick] = useState<LifecycleStage>("established");
  const [agePick, setAgePick] = useState<AgeBucket>("under90");
  const [tagPick, setTagPick] = useState<string>(TAGS[0]);
  const [signalPick, setSignalPick] = useState<OtherSignal>("a2p-lost");

  // Guardrails.
  const [frequencyDays, setFrequencyDays] = useState(30);
  const [skipOpenTask, setSkipOpenTask] = useState(true);

  const extraConds = useMemo<ExtraCond[]>(
    () => extras.map((id) => buildExtraCond(id, { stagePick, agePick, tagPick, signalPick })),
    [extras, stagePick, agePick, tagPick, signalPick],
  );

  const base = useMemo(() => matchesToday(playbook), [playbook]);
  const activeAnswers: Answers = path === "auto" ? DEFAULT_ANSWERS : answers;
  const matches = useMemo(() => {
    const afterAnswers = applyPredicates(base, activeAnswers);
    return afterAnswers.filter((a) => extraConds.every((c) => (c.predicate ? c.predicate(a) : true)));
  }, [base, activeAnswers, extraConds]);

  const ruleSentence = useMemo(() => {
    const baseSentence = buildRuleSentence(playbook, activeAnswers, extraConds);
    if (path === "auto" && extraConds.length === 0) return baseSentence;
    return `${baseSentence.replace(/\.$/, "")} · ${notifyPhrase(activeAnswers)}.`;
  }, [playbook, activeAnswers, path, extraConds]);

  useEffect(() => {
    onRuleChange?.(ruleSentence, matches.length);
  }, [ruleSentence, matches.length, onRuleChange]);


  const TOTAL = 4;
  const next = () => setQIdx((i) => (Math.min(TOTAL - 1, i + 1) as 0 | 1 | 2 | 3));
  const back = () => setQIdx((i) => (Math.max(0, i - 1) as 0 | 1 | 2 | 3));
  const skip = () => {
    // Skip = reset this question's answer to its default and advance.
    const reset = { ...answers };
    if (qIdx === 0) { reset.who = "all"; reset.whoBands = []; }
    if (qIdx === 1) { reset.plan = "all"; reset.planPicks = []; }
    if (qIdx === 2) { reset.size = "any"; }
    if (qIdx === 3) { reset.notify = "me"; }
    setAnswers(reset);
    if (qIdx < TOTAL - 1) next();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-3)" }}>
      {/* Path selector */}
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
          { v: "auto", label: "Let GoCSM decide (recommended)" },
          { v: "guided", label: "Choose myself" },
        ] as const).map((opt) => {
          const on = path === opt.v;
          return (
            <button
              key={opt.v}
              role="tab"
              aria-selected={on}
              onClick={() => setPath(opt.v)}
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

      {/* Fixed event readout */}
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
        <span>Runs when an account {eventPhrase(playbook)}.</span>
      </div>

      {/* PATH A — Let GoCSM decide */}
      {path === "auto" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-3)" }}>
          <p style={{ margin: 0, font: "var(--t-body)", color: "var(--text)" }}>
            Runs for accounts that {eventPhrase(playbook)} —{" "}
            <strong style={{ font: "var(--t-h4, var(--t-body))" }}>
              <Mono>{matches.length}</Mono>
            </strong>{" "}
            right now.
          </p>
          <span style={{ font: "var(--t-meta)", color: "var(--text-3, var(--text))" }}>
            Sensible defaults — switch to <em>Choose myself</em> to narrow it down.
          </span>
        </div>
      ) : null}

      {/* PATH B — Guided wizard */}
      {path === "guided" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-3)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <MiniProgress step={qIdx + 1} total={TOTAL} />
            <Badge variant="neutral" dot={false}>
              simulated · plain-language wiring lands later
            </Badge>
          </div>

          <Card padded>
            {qIdx === 0 ? <Q1Who answers={answers} set={setAnswers} /> : null}
            {qIdx === 1 ? <Q2Plan answers={answers} set={setAnswers} /> : null}
            {qIdx === 2 ? <Q3Size answers={answers} set={setAnswers} /> : null}
            {qIdx === 3 ? <Q4Notify answers={answers} set={setAnswers} /> : null}
          </Card>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Button variant="ghost" size="sm" onClick={back} disabled={qIdx === 0} icon={<Icon name="arrow-left" />}>
              Back
            </Button>
            <div style={{ display: "flex", gap: "var(--s-2)" }}>
              <Button variant="ghost" size="sm" onClick={skip}>
                Skip
              </Button>
              {qIdx < TOTAL - 1 ? (
                <Button variant="primary" size="sm" onClick={next} icon={<Icon name="arrow-right" />}>
                  Next question
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {/* Add more conditions — quiet, secondary, hidden until asked for */}
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-2)" }}>
        <Button
          variant="ghost"
          size="sm"
          icon={<Icon name={showAdvanced ? "chevron-up" : "plus"} />}
          onClick={() => setShowAdvanced((s) => !s)}
        >
          {showAdvanced ? "Hide advanced conditions" : `Add more conditions${extras.length ? ` (${extras.length})` : ""}`}
        </Button>
        {showAdvanced ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--s-3)",
              padding: "var(--s-3)",
              borderRadius: "var(--r-md)",
              border: "1px dashed var(--border)",
              background: "var(--surface)",
            }}
          >
            <span style={{ font: "var(--t-meta)", color: "var(--text-3, var(--text))" }}>
              For power users — tap to add. Choices fold into the rule above.
            </span>

            {/* Tappable chips */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--s-2)" }}>
              {([
                { id: "no-login-30" as const, label: "No login in 30 days" },
                { id: "stage" as const, label: `Lifecycle stage: ${STAGE_LABEL[stagePick]} ▾` },
                { id: "age" as const, label: `Account age: ${AGE_LABEL[agePick]} ▾` },
                { id: "tag" as const, label: `Tag: ${tagPick} ▾` },
                { id: "signal" as const, label: `Other signals: ${SIGNAL_LABEL[signalPick]} ▾` },
              ]).map((c) => {
                const on = extras.includes(c.id);
                return (
                  <button
                    key={c.id}
                    onClick={() =>
                      setExtras((prev) => (on ? prev.filter((x) => x !== c.id) : [...prev, c.id]))
                    }
                    aria-pressed={on}
                    style={{
                      cursor: "pointer",
                      padding: "6px 12px",
                      borderRadius: 999,
                      border: `1px solid ${on ? "var(--info-7, var(--blue-7))" : "var(--border)"}`,
                      background: on ? "var(--surface-2)" : "transparent",
                      color: "var(--text)",
                      font: "var(--t-meta)",
                      fontWeight: on ? 600 : 400,
                    }}
                  >
                    {on ? "✓ " : "+ "}
                    {c.label}
                  </button>
                );
              })}
            </div>

            {/* Submenus for the active dropdown-style chips */}
            {extras.includes("stage") ? (
              <PillRow
                label="Stage"
                value={stagePick}
                options={(["onboarding", "established", "churned"] as LifecycleStage[]).map((v) => ({ v, label: STAGE_LABEL[v] }))}
                onChange={(v) => setStagePick(v as LifecycleStage)}
              />
            ) : null}
            {extras.includes("age") ? (
              <PillRow
                label="Age"
                value={agePick}
                options={(["under90", "90-365", "over365"] as AgeBucket[]).map((v) => ({ v, label: AGE_LABEL[v] }))}
                onChange={(v) => setAgePick(v as AgeBucket)}
              />
            ) : null}
            {extras.includes("tag") ? (
              <PillRow
                label="Tag"
                value={tagPick}
                options={TAGS.map((v) => ({ v, label: v }))}
                onChange={setTagPick}
              />
            ) : null}
            {extras.includes("signal") ? (
              <PillRow
                label="Signal"
                value={signalPick}
                options={(["a2p-lost", "domain-lost", "integration-lost"] as OtherSignal[]).map((v) => ({ v, label: SIGNAL_LABEL[v] }))}
                onChange={(v) => setSignalPick(v as OtherSignal)}
              />
            ) : null}
          </div>
        ) : null}
      </div>

      {/* Guardrails */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--s-2)",
          padding: "var(--s-3)",
          borderRadius: "var(--r-md)",
          background: "var(--surface-2)",
        }}
      >
        <span style={{ font: "var(--t-meta)", textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--text-3, var(--text))" }}>
          Guardrails
        </span>
        <label style={{ display: "flex", alignItems: "center", gap: "var(--s-2)", font: "var(--t-body-sm)", color: "var(--text-2, var(--text))", flexWrap: "wrap" }}>
          Run at most once every
          <input
            type="number"
            min={1}
            value={frequencyDays}
            onChange={(e) => setFrequencyDays(Math.max(1, parseInt(e.target.value || "1", 10)))}
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
          <Toggle on={true} locked onChange={() => {}} />
          <span style={{ flex: 1, font: "var(--t-body-sm)", color: "var(--text-2, var(--text))" }}>
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


      {/* Running summary + live count */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 4,
          padding: "var(--s-3)",
          borderRadius: "var(--r-md)",
          background: "var(--surface-2)",
          border: "1px solid var(--border)",
        }}
      >
        <span style={{ font: "var(--t-meta)", textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--text-3, var(--text))" }}>
          Your rule so far
        </span>
        <span style={{ font: "var(--t-body)", color: "var(--text)" }}>{ruleSentence}</span>
        <span style={{ font: "var(--t-meta)", color: "var(--text-3, var(--text))" }}>
          Runs for <Mono>{matches.length}</Mono> account{matches.length === 1 ? "" : "s"} right now.
        </span>
      </div>

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
// Step 3 — "Publish" (summary + reassurance)
// ============================================================

function Step3Summary({
  ruleSentence,
  ruleCount,
  enabledLabels,
  editedLabels,
}: {
  ruleSentence: string;
  ruleCount: number;
  enabledLabels: string[];
  editedLabels: string[];
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-3)" }}>
      <p style={{ margin: 0, font: "var(--t-body)", color: "var(--text-2, var(--text))" }}>
        Quick recap before you publish.
      </p>

      {/* THE RULE */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 4,
          padding: "var(--s-3)",
          borderRadius: "var(--r-md)",
          background: "var(--surface-2)",
        }}
      >
        <span
          style={{
            font: "var(--t-meta)",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            color: "var(--text-3, var(--text))",
          }}
        >
          The rule
        </span>
        <span style={{ font: "var(--t-body)", color: "var(--text)" }}>
          {ruleSentence || "Runs automatically when the play's signal appears."}
        </span>
        <span style={{ font: "var(--t-meta)", color: "var(--text-3, var(--text))" }}>
          <Mono>{ruleCount}</Mono> account{ruleCount === 1 ? "" : "s"} match right now.
        </span>
      </div>

      {/* WHAT GOCSM WILL DO */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--s-2)",
          padding: "var(--s-3)",
          borderRadius: "var(--r-md)",
          background: "var(--surface-2)",
        }}
      >
        <span
          style={{
            font: "var(--t-meta)",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            color: "var(--text-3, var(--text))",
          }}
        >
          What GoCSM will do
        </span>
        {enabledLabels.length === 0 ? (
          <span style={{ font: "var(--t-body-sm)", color: "var(--text-2, var(--text))" }}>
            Nothing enabled yet — go back to Step 1 to switch on at least one channel.
          </span>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 4 }}>
            {enabledLabels.map((l, i) => (
              <li
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--s-2)",
                  font: "var(--t-body-sm)",
                  color: "var(--text)",
                }}
              >
                <Icon name="check" />
                <span>{l}</span>
                {editedLabels.includes(l) ? (
                  <Badge variant="pos" dot={false}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                      <Icon name="check" /> edited in HighLevel
                    </span>
                  </Badge>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Reassurance */}
      <p style={{ margin: 0, font: "var(--t-meta)", color: "var(--text-2, var(--text))" }}>
        Client emails still ask for your OK · reversible · change or pause anytime in Playbooks.
      </p>
      <p
        style={{
          margin: 0,
          font: "var(--t-meta)",
          color: "var(--text-3, var(--text))",
          fontStyle: "italic",
        }}
      >
        In production this opens your HighLevel workflow to review the flow and publish.
      </p>
    </div>
  );
}
