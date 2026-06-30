import React, { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { X, Check, Lock, Zap, ArrowRight } from "lucide-react";
import { STANDARD_GHL_JOURNEY } from "@onb/lib/types";
import type { OnboardingAccount, Step } from "@onb/lib/types";
import { REQUIRED_TYPE } from "@onb/lib/catalog";
import { WorkflowTriggerPopover } from "@onb/components/onboarding/WorkflowTriggerPopover";
import { ActionReceipt } from "@onb/components/agentic/ActionReceipt";

function isManualConfirm(step: Step): boolean {
  return step.tier === "C" || step.type === "custom_manual";
}
import {
  currentStartedDay,
  fmtDate,
  isPastTarget,
  journeyDay,
  startDate,
  synthStepDays,
} from "@onb/lib/journey-day";

function dateForDay(account: OnboardingAccount, dayN: number): Date {
  const d = startDate(account);
  d.setDate(d.getDate() + dayN);
  return d;
}

interface Props {
  account: OnboardingAccount | null;
  onClose: () => void;
  onTriggerWorkflow: (account: string, workflow: string) => void;
  onUndoWorkflow: (account: string) => void;
  receipt?: { state: "pending" | "sent" | "stopped"; remaining: number; workflow: string };
}

type RowKind = "done" | "current" | "future" | "locked";
interface Row {
  step: Step;
  kind: RowKind;
  actualDays?: number;
  expectedDays: number;
  doneOnDay?: number;
}

function findCurrentIdx(currentStepTitle: string | null, stepsDone: number): number {
  if (!currentStepTitle) return stepsDone;
  const steps = STANDARD_GHL_JOURNEY.steps;
  const exact = steps.findIndex((s) => s.title === currentStepTitle);
  if (exact >= 0) return exact;
  const lc = currentStepTitle.toLowerCase();
  const fuzzy = steps.findIndex(
    (s) =>
      s.title.toLowerCase().includes(lc) ||
      lc.includes(s.title.toLowerCase().split(" ").slice(0, 3).join(" "))
  );
  if (fuzzy >= 0) return fuzzy;
  return stepsDone;
}

export function AccountStoryDrawer({ account, onClose, onTriggerWorkflow, onUndoWorkflow, receipt }: Props) {
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const [manualDone, setManualDone] = useState<Set<string>>(() => new Set());

  // Reset manual overrides when switching accounts.
  useEffect(() => {
    setManualDone(new Set());
  }, [account?.account]);

  useEffect(() => {
    if (!account) return;
    closeBtnRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [account, onClose]);

  const rows: Row[] = useMemo(() => {
    if (!account) return [];
    const steps = STANDARD_GHL_JOURNEY.steps;
    const currentIdx = findCurrentIdx(account.current_step, account.steps_done);
    const doneCount = Math.min(account.steps_done, steps.length);
    const doneTypes = new Set(steps.slice(0, doneCount).map((s) => s.type));
    const todayDay = journeyDay(account);
    let cum = 0;
    return steps.map((step, i) => {
      const expectedDays = Math.max(1, Math.round(step.slaHours / 24));
      if (i < doneCount) {
        const actualDays = synthStepDays(account.account, step.id, expectedDays);
        cum += actualDays;
        return {
          step,
          kind: "done" as RowKind,
          actualDays,
          expectedDays,
          doneOnDay: cum,
        };
      }
      // Agency-verified manual override → render as done.
      if (manualDone.has(step.id)) {
        return {
          step: { ...step, completionSource: "agency_verified" as const },
          kind: "done" as RowKind,
          expectedDays,
          doneOnDay: todayDay,
        };
      }
      if (i === currentIdx && doneCount < steps.length) {
        return { step, kind: "current" as RowKind, expectedDays };
      }
      const reqType = REQUIRED_TYPE[step.type];
      const hasReqInJourney = reqType ? steps.some((s) => s.type === reqType) : false;
      const unmet = !!reqType && hasReqInJourney && !doneTypes.has(reqType);
      return { step, kind: unmet ? ("locked" as RowKind) : ("future" as RowKind), expectedDays };
    });
  }, [account, manualDone]);


  if (!account) return null;

  const TARGET = STANDARD_GHL_JOURNEY.targetDays;
  const dayLate = account.journey_started_days_ago > TARGET;
  const isComplete = account.steps_done >= account.steps_total;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Account story"
      style={{ position: "fixed", inset: 0, zIndex: 60 }}
    >
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.32)",
          animation: "fadeIn 120ms var(--ease-out, ease-out)",
        }}
      />
      <aside
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          bottom: 0,
          width: 480,
          background: "var(--surface)",
          boxShadow: "var(--sh-sheet, 0 24px 64px rgba(0,0,0,0.18))",
          display: "flex",
          flexDirection: "column",
          animation: "slideInRight 200ms var(--ease-out, ease-out)",
        }}
      >
        {/* HEADER */}
        <div
          style={{
            padding: 24,
            borderBottom: "1px solid var(--border-soft)",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>
                {account.account}
              </div>
            </div>
            <button
              ref={closeBtnRef}
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="btn btn-ghost"
              style={{ padding: 6 }}
            >
              <X size={16} aria-hidden />
            </button>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontSize: 12,
              color: "var(--text-2)",
              flexWrap: "wrap",
            }}
          >
            <span className="mono">${account.mrr}</span>
            <span style={{ color: "var(--text-3)" }}>·</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <MiniRing pct={account.pct_complete} />
              <span className="mono" style={{ color: "var(--text-2)" }}>
                {account.pct_complete}%
              </span>
            </span>
            <span style={{ color: "var(--text-3)" }}>·</span>
            <span style={{ color: dayLate ? "var(--neg-9)" : "var(--text-2)" }}>
              Day <span className="mono">{journeyDay(account)}</span> of{" "}
              <span className="mono">{TARGET}</span> target{" "}
              <span style={{ color: "var(--text-3)" }}>· {fmtDate(dateForDay(account, TARGET))}</span>
            </span>
            <span style={{ color: "var(--text-3)" }}>·</span>
            <span style={{ color: "var(--text-3)" }}>
              started {fmtDate(startDate(account))}
            </span>
          </div>
        </div>

        {/* BODY */}
        <div style={{ padding: 24, overflowY: "auto", flex: 1 }}>
          <div
            style={{
              fontSize: 11,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--text-3)",
              marginBottom: 12,
            }}
          >
            Timeline
          </div>
          <div style={{ position: "relative" }}>
            {/* rail */}
            <div
              aria-hidden
              style={{
                position: "absolute",
                left: 11,
                top: 6,
                bottom: 6,
                width: 1,
                background: "var(--border)",
              }}
            />
            {rows.map((r) => (
              <TimelineRow
                key={r.step.id}
                row={r}
                account={account}
                allSteps={STANDARD_GHL_JOURNEY.steps}
                canMarkDone={isManualConfirm(r.step) && r.kind !== "done"}
                onMarkDone={() =>
                  setManualDone((prev) => {
                    const next = new Set(prev);
                    next.add(r.step.id);
                    return next;
                  })
                }
              />
            ))}
            {isComplete && (
              <div style={{ paddingLeft: 36, marginTop: 12 }}>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "3px 10px",
                    borderRadius: "var(--r-pill)",
                    background: "var(--pos-soft)",
                    color: "var(--pos-9)",
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                >
                  <Check size={11} aria-hidden /> Complete
                </span>
              </div>
            )}
          </div>
        </div>

        {/* FOOTER */}
        <div
          style={{
            padding: 24,
            borderTop: "1px solid var(--border-soft)",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {receipt && (
            <ActionReceipt
              state={receipt.state}
              title={
                <>
                  Sent: {receipt.workflow} → <span>{account.account}</span>
                </>
              }
              scope={`Triggers your "${receipt.workflow}" workflow via HighLevel`}
              blastRadius="Sends to the account owner. Nothing goes to their customers."
              graceSeconds={receipt.remaining}
              reportBack="GoCSM will report back when the step completes."
              onUndo={() => onUndoWorkflow(account.account)}
            />
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ flex: 1 }}>
              {!receipt && (
                <ContextualAction account={account} onTriggerWorkflow={onTriggerWorkflow} />
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                // stub
                console.info("Open Account Health Hub", account.account);
              }}
              style={{
                height: 28,
                padding: "0 12px",
                fontSize: 12,
                fontWeight: 600,
                border: "1px solid var(--border)",
                background: "var(--surface)",
                color: "var(--text)",
                borderRadius: "var(--r-sm)",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              Open Account Health Hub <ArrowRight size={14} aria-hidden />
            </button>
          </div>
        </div>
      </aside>

      <style>{`
        @keyframes slideInRight { from { transform: translateX(24px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @media (prefers-reduced-motion: reduce) {
          [role="dialog"] *, [role="dialog"] { animation: none !important; }
        }
      `}</style>
    </div>
  );
}

function MiniRing({ pct }: { pct: number }) {
  const r = 9;
  const c = 2 * Math.PI * r;
  const dash = c * (pct / 100);
  return (
    <svg width={22} height={22} viewBox="0 0 22 22" aria-hidden>
      <circle cx={11} cy={11} r={r} fill="none" stroke="var(--n-3)" strokeWidth={2} />
      <circle
        cx={11}
        cy={11}
        r={r}
        fill="none"
        stroke="var(--info-7)"
        strokeWidth={2}
        strokeDasharray={`${dash} ${c}`}
        strokeLinecap="round"
        transform="rotate(-90 11 11)"
      />
    </svg>
  );
}

function TimelineRow({
  row,
  account,
  allSteps,
  canMarkDone,
  onMarkDone,
}: {
  row: Row;
  account: OnboardingAccount;
  allSteps: Step[];
  canMarkDone?: boolean;
  onMarkDone?: () => void;
}) {
  const { step, kind } = row;
  const over = kind === "done" && row.actualDays && row.actualDays > row.expectedDays * 1.5;
  const stalled = kind === "current" && account.stalled;

  const dotBase: CSSProperties = {
    width: 14,
    height: 14,
    borderRadius: "50%",
    display: "grid",
    placeItems: "center",
    background: "var(--surface)",
    boxShadow: "0 0 0 3px var(--surface)",
  };
  let dot: React.ReactElement;
  if (kind === "done") {
    dot = (
      <span
        style={{
          ...dotBase,
          background: "var(--pos-7)",
          color: "#fff",
        }}
      >
        <Check size={9} strokeWidth={3} aria-hidden />
      </span>
    );
  } else if (kind === "current") {
    dot = (
      <span
        style={{
          ...dotBase,
          border: `2px solid ${stalled ? "var(--warn-7)" : "var(--info-7)"}`,
        }}
      />
    );
  } else if (kind === "locked") {
    dot = (
      <span style={{ ...dotBase, border: "1.5px solid var(--n-3)" }}>
        <Lock size={8} aria-hidden style={{ color: "var(--text-3)" }} />
      </span>
    );
  } else {
    dot = <span style={{ ...dotBase, border: "1.5px solid var(--n-3)" }} />;
  }

  const titleColor =
    kind === "done"
      ? "var(--text)"
      : kind === "current"
        ? "var(--text)"
        : "var(--text-3)";

  let meta: React.ReactElement | null = null;
  if (kind === "done") {
    meta = (
      <div
        style={{
          marginTop: 2,
          fontSize: 11,
          color: "var(--text-3)",
          display: "inline-flex",
          alignItems: "baseline",
          gap: 6,
          flexWrap: "wrap",
        }}
      >
        <span>
          Done · Day{" "}
          <span className="mono" style={{ color: "var(--text-2)" }}>
            {row.doneOnDay ?? 0}
          </span>
        </span>
        <span style={{ color: "var(--text-3)" }}>
          · {fmtDate(dateForDay(account, row.doneOnDay ?? 0))}
        </span>
        {over && (
          <span style={{ color: "var(--warn-9)" }}>· slow</span>
        )}
      </div>
    );
  } else if (kind === "current") {
    const today = journeyDay(account);
    const started = currentStartedDay(account);
    const past = isPastTarget(account, STANDARD_GHL_JOURNEY.targetDays);
    meta = (
      <div
        style={{
          fontSize: 11,
          color: "var(--text-2)",
          marginTop: 2,
          display: "inline-flex",
          alignItems: "baseline",
          gap: 6,
          flexWrap: "wrap",
        }}
      >
        <span>
          Started Day <span className="mono">{started}</span>{" "}
          <span style={{ color: "var(--text-3)" }}>· {fmtDate(dateForDay(account, started))}</span>
        </span>
        <span aria-hidden style={{ color: "var(--text-3)", opacity: 0.6 }}>·</span>
        <span style={{ color: stalled || past ? "var(--neg-9)" : "var(--text-2)" }}>
          today Day <span className="mono">{today}</span>{" "}
          <span style={{ color: "var(--text-3)", fontWeight: 400 }}>· {fmtDate(dateForDay(account, today))}</span>
        </span>
      </div>
    );
  } else if (kind === "locked") {
    const reqType = REQUIRED_TYPE[step.type];
    const blocker = reqType ? allSteps.find((s) => s.type === reqType) : undefined;
    meta = blocker ? (
      <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>
        Needs {blocker.title}
      </div>
    ) : null;
  }

  return (
    <>
      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "flex-start",
          padding: "8px 0",
          position: "relative",
        }}
      >
        <div style={{ width: 22, display: "grid", placeItems: "center", paddingTop: 2 }}>
          {dot}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 8,
            }}
          >
            <div
              style={{
                flex: 1,
                minWidth: 0,
                fontSize: 13,
                fontWeight: kind === "current" ? 600 : 500,
                color: titleColor,
                lineHeight: 1.4,
              }}
            >
              {step.title}
            </div>
            {canMarkDone && onMarkDone && (
              <button
                type="button"
                onClick={onMarkDone}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  fontSize: 11,
                  color: "var(--text-3)",
                  textDecoration: "underline",
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              >
                Mark done
              </button>
            )}
          </div>
          {meta}
          {kind === "done" && row.step.completionSource === "agency_verified" && (
            <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>
              marked by you
            </div>
          )}
        </div>
      </div>
      {kind === "current" && account.last_intervention && (
        <InterventionMarker li={account.last_intervention} account={account} />
      )}
    </>
  );
}

function InterventionMarker({
  li,
  account,
}: {
  li: NonNullable<OnboardingAccount["last_intervention"]>;
  account: OnboardingAccount;
}) {
  const nudgeDay = Math.max(0, journeyDay(account) - li.days_ago);
  let tail: string;
  if (li.outcome === "moved" || li.outcome === "completed_after_nudge") {
    tail = li.days_ago <= 1 ? "completed same day" : "completed since";
  } else if (li.outcome === "no_movement") {
    tail = "no movement since";
  } else {
    tail = li.outcome.replace(/_/g, " ");
  }
  const text = (
    <>
      Workflow · Day <span className="mono">{nudgeDay}</span>{" "}
      <span style={{ color: "var(--text-3)" }}>· {fmtDate(dateForDay(account, nudgeDay))}</span> · {tail}
    </>
  );
  return (
    <div
      style={{
        marginLeft: 34,
        marginBottom: 6,
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontSize: 11,
        color: "var(--text-2)",
      }}
    >
      <Zap size={12} aria-hidden style={{ color: "var(--info-7)" }} />
      {text}
    </div>
  );
}

function ContextualAction({
  account,
  onTriggerWorkflow,
}: {
  account: OnboardingAccount;
  onTriggerWorkflow: (account: string, workflow: string) => void;
}) {
  if (account.blocked_by === "agency") {
    return (
      <div style={{ display: "flex", gap: 6 }}>
        <button
          type="button"
          style={{
            height: 32,
            padding: "0 14px",
            fontSize: 13,
            fontWeight: 600,
            border: "1px solid var(--border)",
            background: "var(--surface)",
            color: "var(--text)",
            borderRadius: "var(--r-sm)",
            cursor: "pointer",
          }}
        >
          Assign
        </button>
        <button
          type="button"
          style={{
            height: 32,
            padding: "0 14px",
            fontSize: 13,
            fontWeight: 500,
            border: "none",
            background: "transparent",
            color: "var(--text-2)",
            borderRadius: "var(--r-sm)",
            cursor: "pointer",
          }}
        >
          Open calendar
        </button>
      </div>
    );
  }
  return (
    <WorkflowTriggerPopover
      account={account.account}
      currentStep={account.current_step}
      onPick={(wf) => onTriggerWorkflow(account.account, wf)}
    >
      <button
        type="button"
        style={{
          height: 32,
          padding: "0 14px",
          fontSize: 13,
          fontWeight: 600,
          border: "1px solid var(--border)",
          background: "var(--surface)",
          color: "var(--text)",
          borderRadius: "var(--r-sm)",
          cursor: "pointer",
        }}
      >
        Trigger workflow
      </button>
    </WorkflowTriggerPopover>
  );
}
