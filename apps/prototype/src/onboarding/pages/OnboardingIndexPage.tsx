import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Link, useNavigate } from "@onb/router-compat";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Calendar,
  Check,
  ChevronDown,
  Clock3,
  ExternalLink,
  Lock,
  MoreHorizontal,
  ShieldCheck,
  UserPlus,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@onb/components/ui/dropdown-menu";

// Cumulative day-since-signup milestones for the funnel, by step name.
// x = operator target ("usually done by Day x"); y = client cumulative median
// where seeded from sla_calibration. Seeded to a 14-day journey ceiling.
const MILESTONE_X_BY_STEP: Record<string, number> = {
  "Purchase phone number": 1,
  "A2P brand registration": 4,
  "A2P campaign approval": 9,
  "Set up your email sending domain": 10,
  "Complete your business profile": 10,
  "Activate your workflows": 11,
  "Publish funnel": 11,
  "Connect your custom domain": 12,
  "Create calendar + sync": 12,
  "Create your lead form": 12,
  "Set up your sales pipeline": 13,
  "Connect Google Business Profile": 13,
  "Connect Facebook / Instagram": 13,
  "Connect Stripe": 14,
  "Book your kickoff call": 14,
};
const MILESTONE_Y_BY_STEP: Record<string, number> = {
  "A2P brand registration": 7,
  "Set up your email sending domain": 9,
  "Connect your custom domain": 14,
  "Book your kickoff call": 17,
};
import { ActionReceipt } from "@onb/components/agentic/ActionReceipt";
import { PageHeader } from "@onb/components/shell/PageHeader";
import { Verdict } from "@onb/components/insight/Verdict";
import { ConfTag } from "@onb/components/agentic/ConfTag";
import { QueueRow } from "@onb/components/onboarding/QueueRow";
import { AccountStoryDrawer } from "@onb/components/onboarding/AccountStoryDrawer";
import { WorkflowTriggerPopover } from "@onb/components/onboarding/WorkflowTriggerPopover";
import { getStuckReason, summarizeStuckReasons, matchesReasonKey } from "@onb/lib/stuck-reason";
import {
  getOnboardingSeed,
  selectActivationTrend,
  selectStalledAccounts,
  selectStalledByImpact,
  selectPendingExternalAccounts,
  selectFunnel,
  selectAllStepNames,
  accountStepState,
  accountId,
  isStuck,
  isOverExternalBudget,
  defaultExternalBudgetDays,
} from "@onb/lib/onboarding-data";
import type { OnboardingAccount, OnboardingSeed } from "@onb/lib/types";
import { STANDARD_GHL_JOURNEY, resolveVariant, variantTargetDays, variantStepCount, MASTER_PLAN_ID, clearAllJourneys } from "@onb/lib/types";
import { journeyDay, isPastTarget, fmtDate, startDate } from "@onb/lib/journey-day";



export default OnboardingIndexPage;

type DemoMode =
  | "default"
  | "zero-journeys"
  | "zero-stalls"
  | "agency-bottleneck"
  | "rollout-new"
  | "rollout-drafted"
  | "rollout-scanning"
  | "rollout-sparse";
type ReceiptState = { state: "pending" | "sent" | "stopped"; remaining: number; workflow: string };

function OnboardingIndexPage() {
  const navigate = useNavigate();
  const makeOnboardingTabs = (active: "overview" | "journey") => [
    {
      id: "overview",
      label: "Overview",
      active: active === "overview",
      onClick: () => navigate({ to: "/onboarding" }),
    },
    {
      id: "journey",
      label: "Journey",
      active: active === "journey",
      onClick: () => navigate({ to: "/onboarding/journey" }),
    },
  ];
  const seed = getOnboardingSeed();

  
  const [demo, setDemo] = useState<DemoMode>("default");
  const [pill, setPill] = useState<PillFilter>("all");
  const [step, setStep] = useState<string>("any");
  const [receipts, setReceipts] = useState<Record<string, ReceiptState>>({});
  const [openAccount, setOpenAccount] = useState<OnboardingAccount | null>(null);
  const [expectationOverrides, setExpectationOverrides] = useState<Record<string, number>>({});
  const [queueExpanded, setQueueExpanded] = useState(false);
  const [waitingExpanded, setWaitingExpanded] = useState(false);
  const [reasonFilter, setReasonFilter] = useState<string | null>(null);

  type Population = "onboarding" | "onboarded" | "not-started";
  const [population, setPopulation] = useState<Population>("onboarding");
  const [needsHelpOnly, setNeedsHelpOnly] = useState(true);
  const applyExpectation = (step: string, days: number) =>
    setExpectationOverrides((o) => ({ ...o, [step]: days }));

  // Sparse week-1: 2 accounts, no completions, no stalls. Synthesized in-component;
  // seed JSON is unchanged.
  const sparseSeed: OnboardingSeed = useMemo(
    () => ({
      ...seed,
      accounts: seed.accounts.slice(0, 2).map((a, i) => ({
        ...a,
        steps_done: i === 0 ? 1 : 2,
        pct_complete: i === 0 ? 7 : 13,
        stalled: false,
        blocked_by: "client" as const,
        journey_started_days_ago: i === 0 ? 1 : 3,
        last_intervention: null,
      })),
      funnel: seed.funnel.map((f) => ({ ...f, clients_reached: 0 })),
    }),
    [seed],
  );

  // Zero-stalls demo: nobody is stuck — clear stalls and demote any over-budget
  // external wait back inside budget, so the triage strip, verdict, and all-clear
  // queue all agree (no "Needs you 7" contradicting an all-caught-up queue).
  const zeroStallsSeed: OnboardingSeed = useMemo(
    () => ({
      ...seed,
      accounts: seed.accounts.map((a) => ({
        ...a,
        stalled: false,
        current_failure_id: undefined,
        external_wait_days:
          a.current_step_state === "verifying"
            ? Math.min(
                a.external_wait_days ?? 0,
                a.external_budget_days ?? defaultExternalBudgetDays(a.current_step),
              )
            : a.external_wait_days,
      })),
    }),
    [seed],
  );

  const isSparse = demo === "rollout-sparse";
  const isHero = demo === "rollout-new" || demo === "rollout-drafted";
  const isScanning = demo === "rollout-scanning";
  const effectiveSeed = isSparse
    ? sparseSeed
    : demo === "zero-stalls"
      ? zeroStallsSeed
      : seed;

  // DEV: "New customer" clears any saved/draft journeys so the Journey tab
  // shows the wizard on first load.
  useEffect(() => {
    if (demo !== "rollout-new") return;
    clearAllJourneys();
  }, [demo]);


  // Scanning sequence — progressive discovery of seed accounts.
  type ScanPhase = "scanning" | "complete" | "dismissed";
  const [scanPhase, setScanPhase] = useState<ScanPhase>("scanning");
  const [scanned, setScanned] = useState(0);
  const scanTotal = seed.accounts.length;

  // Reset on entering rollout-scanning; honor reduced-motion by jumping to complete.
  useEffect(() => {
    if (!isScanning) return;
    const reduced =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setScanned(scanTotal);
      setScanPhase("complete");
    } else {
      setScanned(0);
      setScanPhase("scanning");
    }
  }, [isScanning, scanTotal]);

  // Tick: one account per 600ms while scanning.
  useEffect(() => {
    if (!isScanning || scanPhase !== "scanning") return;
    const id = setInterval(() => {
      setScanned((n) => {
        if (n + 1 >= scanTotal) {
          clearInterval(id);
          setScanPhase("complete");
          return scanTotal;
        }
        return n + 1;
      });
    }, 600);
    return () => clearInterval(id);
  }, [isScanning, scanPhase, scanTotal]);

  const activationTrend = selectActivationTrend(effectiveSeed);
  const stalledRows = selectStalledByImpact(effectiveSeed);
  const pendingExternalRows = selectPendingExternalAccounts(effectiveSeed);

  const onboardedCount = effectiveSeed.accounts.filter((a) => a.steps_done === a.steps_total).length;
  const onboardingNowCount = effectiveSeed.accounts.filter((a) => a.steps_done > 0 && a.steps_done < a.steps_total).length;
  const notStartedCount = effectiveSeed.accounts.filter((a) => a.steps_done === 0).length;
  const stuckCount = selectStalledAccounts(effectiveSeed).length;
  const nudgedCompleted = effectiveSeed.accounts.filter(
    (a) => a.steps_done === a.steps_total && a.last_intervention?.outcome === "completed_after_nudge",
  ).length;
  const a2pSlowing = effectiveSeed.accounts.filter(
    (a) => a.current_step != null && /^A2P/.test(a.current_step) && a.steps_done < a.steps_total,
  ).length;
  // Triage axis (replaces the lifecycle census as primary orientation): mid-journey
  // accounts split into needs-you (stuck) · waiting-on-review (external, in budget) ·
  // on-pace (moving normally). Disjoint by construction — isStuck excludes
  // pendingExternal — so the three always sum to onboarding-now.
  const onPaceCount = Math.max(0, onboardingNowCount - stuckCount - pendingExternalRows.length);

  // SINGLE SOURCE for "expected days" per step on this page.
  const calMap = new Map(effectiveSeed.sla_calibration.map((r) => [r.step, r]));
  const expectedDaysFor = (stepName: string | null): number | null => {
    if (!stepName) return null;
    if (expectationOverrides[stepName] !== undefined) return expectationOverrides[stepName];
    return calMap.get(stepName)?.sla_days ?? null;
  };

  const bottleneck = selectBottleneck(effectiveSeed, expectedDaysFor);

  const cleanupTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // tick pending receipts every 1s; commit at 0
  useEffect(() => {
    const pendingKeys = Object.entries(receipts)
      .filter(([, r]) => r.state === "pending")
      .map(([k]) => k);
    if (pendingKeys.length === 0) return;
    const t = setTimeout(() => {
      setReceipts((prev) => {
        const next = { ...prev };
        for (const k of pendingKeys) {
          const r = next[k];
          if (!r || r.state !== "pending") continue;
          if (r.remaining <= 1) next[k] = { state: "sent", remaining: 0, workflow: r.workflow };
          else next[k] = { state: "pending", remaining: r.remaining - 1, workflow: r.workflow };
        }
        return next;
      });
    }, 1000);
    return () => clearTimeout(t);
  }, [receipts]);

  const triggerWorkflow = (account: string, workflow: string) => {
    setReceipts((r) => ({ ...r, [account]: { state: "pending", remaining: 5, workflow } }));
  };
  const undoWorkflow = (account: string) => {
    setReceipts((r) => {
      const existing = r[account];
      const workflow = existing?.workflow ?? "";
      return { ...r, [account]: { state: "stopped", remaining: 0, workflow } };
    });
    if (cleanupTimers.current[account]) clearTimeout(cleanupTimers.current[account]);
    cleanupTimers.current[account] = setTimeout(() => {
      setReceipts((r) => {
        const next = { ...r };
        delete next[account];
        return next;
      });
    }, 2000);
  };

  const scrollToSingleTable = () => {
    document.getElementById("population-table")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  void scrollToSingleTable;
  const selectPopulation = (p: Population, needsHelp = true) => {
    setPopulation(p);
    setNeedsHelpOnly(p === "onboarding" ? needsHelp : true);
    setTimeout(scrollToSingleTable, 50);
  };
  void selectPopulation;

  const [evidenceStripOpen, setEvidenceStripOpen] = useState(false);
  const stuckByStepMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const a of effectiveSeed.accounts) {
      if (isStuck(a) && a.current_step) m.set(a.current_step, (m.get(a.current_step) ?? 0) + 1);
    }
    return m;
  }, [effectiveSeed]);
  const topBottlenecks = useMemo(
    () => [...stuckByStepMap.entries()].sort((a, b) => b[1] - a[1]).map(([s]) => s),
    [stuckByStepMap],
  );
  const handleBarClick = (stepName: string, stuckCount: number) => {
    const isClearing = step === stepName;
    setStep(isClearing ? "any" : stepName);
    setPill(isClearing ? "all" : stuckCount > 0 ? "stuck" : "all");
    setPopulation("onboarding");
    setNeedsHelpOnly(false);
    setTimeout(scrollToSingleTable, 50);
  };


  const devStrip = <DevStrip mode={demo} onChange={setDemo} />;

  const differentiationLine = (
    <div style={{ fontSize: 12, color: "var(--text-2)", marginTop: 16 }}>
      GoCSM watches HighLevel and checks steps off automatically — no one marks checkboxes.
    </div>
  );

  if (demo === "zero-journeys") {
    return (
      <>
        {devStrip}
        <PageHeader
          title="Onboarding"
          tabs={makeOnboardingTabs("overview")}
        />
        {differentiationLine}

        <div className="card empty" style={{ padding: 48, marginTop: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: "var(--text)", margin: 0 }}>
            Create your first onboarding journey
          </h2>
          <p
            style={{
              fontSize: 14,
              color: "var(--text-2)",
              maxWidth: "60ch",
              margin: "10px auto 20px",
              lineHeight: 1.55,
            }}
          >
            Start from scratch or paste an existing checklist — GoCSM will map each line to a
            step and surface gaps as you go.
          </p>
          <Link
            to="/onboarding/journey"
            className="btn-primary"
            style={{
              display: "inline-block",
              height: 32,
              lineHeight: "32px",
              padding: "0 14px",
              fontSize: 13,
              fontWeight: 600,
              border: "none",
              borderRadius: "var(--r-sm)",
              textDecoration: "none",
            }}
          >
            Create journey →
          </Link>
        </div>
      </>
    );
  }

  const bodyContent = (
    <div style={{ display: "flex", flexDirection: "column", gap: 32, marginTop: 16 }}>
      

      <div style={{ display: "grid", gap: 16 }}>
      {isSparse ? (

        <Verdict tone="pos" attribution="GoCSM Analysis">
          <span className="mono">2</span> clients are early in setup — Day{" "}
          <span className="mono">1</span> and Day <span className="mono">3</span>. Nothing
          needs a push yet.
        </Verdict>
      ) : demo === "zero-stalls" ? (
        <Verdict tone="pos" attribution="GoCSM Analysis">
          Every client is on pace. <span className="mono">12</span> are moving through
          their setup right now.
        </Verdict>

      ) : (
        <>
          {demo === "agency-bottleneck" ? (() => {
            // Derive the team-bottleneck verdict from the SAME data the CTA reveals
            // (pill="agency" filters by blocked_by) so the headline number, the
            // named client, and the queue below can never disagree.
            const agencyRows = effectiveSeed.accounts.filter(
              (a) => a.blocked_by === "agency",
            );
            const oldestAgency = [...agencyRows].sort(
              (a, b) => b.days_on_current_step - a.days_on_current_step,
            )[0];
            return (
            <Verdict
              tone="watch"
              attribution="GoCSM Analysis"
              actions={
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => {
                    setPopulation("onboarding");
                    setNeedsHelpOnly(false);
                    setPill("agency");
                    setTimeout(scrollToSingleTable, 50);
                  }}
                  style={{
                    height: 32,
                    padding: "0 14px",
                    fontSize: 13,
                    fontWeight: 600,
                    border: "none",
                    borderRadius: "var(--r-sm)",
                    cursor: "pointer",
                  }}
                >
                  See who's waiting on your team ↓
                </button>
              }
            >
              <span className="mono">{agencyRows.length}</span> client
              {agencyRows.length === 1 ? " is" : "s are"} waiting on your team to move
              forward — these are yours to clear now.
              {oldestAgency && (
                <>
                  {" "}
                  <span style={{ fontWeight: 600 }}>{oldestAgency.account}</span> has
                  been parked the longest:{" "}
                  <span className="mono">{oldestAgency.days_on_current_step}</span> days
                  on "{oldestAgency.current_step}".
                </>
              )}
            </Verdict>
            );
          })() : (
            bottleneck && (() => {
              const secondary = topBottlenecks.filter((s) => s !== bottleneck.step).slice(0, 1);
              const hasSecondary = secondary.length > 0;
              return (
              <>
              <Verdict
                tone="watch"
                attribution="GoCSM Analysis"
                actions={
                  <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", width: "100%" }}>
                    <span
                      title="Counts and dollars are read directly from completion timestamps; only the sentence is AI-worded."
                      aria-label="Numbers are exact, computed from completion timestamps. The wording is AI-generated."
                      style={{
                        fontSize: 12,
                        color: "var(--text-3)",
                        cursor: "default",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Numbers exact · wording is AI
                    </span>
                    <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 16 }}>
                      <button
                        type="button"
                        className="prov-toggle"
                        aria-expanded={evidenceStripOpen}
                        aria-controls="evidence-strip-body"
                        onClick={() => setEvidenceStripOpen((v) => !v)}
                      >
                        Where clients get stuck
                        <ChevronDown size={14} />
                      </button>
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => selectPopulation("onboarding", true)}
                        style={{
                          height: 32,
                          padding: "0 14px",
                          fontSize: 13,
                          fontWeight: 600,
                          border: "none",
                          borderRadius: "var(--r-sm)",
                          cursor: "pointer",
                        }}
                      >
                        See who's stuck ↓
                      </button>
                    </div>
                  </div>
                }
              >
                <span className="mono">{bottleneck.accounts.length}</span> clients are
                stuck on "{bottleneck.step}" past Day{" "}
                <span className="mono">{STANDARD_GHL_JOURNEY.targetDays}</span> — that's
                where most of your onboarding pain is right now.{" "}
                <span style={{ fontWeight: 600 }}>
                  <span className="mono">
                    ${bottleneck.accounts.reduce((s, a) => s + a.mrr, 0)}
                  </span>
                  /mo is behind it.
                </span>
                {(bottleneck.step === "A2P brand registration" ||
                  bottleneck.step === "A2P campaign approval") && (
                  <> Carrier review is the holdup.</>
                )}
                {hasSecondary && (
                  <div style={{ fontSize: 13, fontWeight: 400, color: "var(--text-2)", marginTop: 4 }}>
                    Also slowing clients:{" "}
                    <strong style={{ color: "var(--text)", fontWeight: 600 }}>{secondary[0]}</strong>
                  </div>
                )}
              </Verdict>
              <div
                style={{
                  display: "grid",
                  gridTemplateRows: evidenceStripOpen ? "1fr" : "0fr",
                  transition: "grid-template-rows var(--d-base) var(--ease-out), margin-top var(--d-base) var(--ease-out)",
                  marginTop: evidenceStripOpen ? 12 : 0,
                }}
                aria-hidden={!evidenceStripOpen}
              >
                <div
                  id="evidence-strip-body"
                  style={{ overflow: "hidden", minHeight: 0 }}
                >
                  <EvidenceSection
                    seed={effectiveSeed}
                    onBarClick={handleBarClick}
                    activeStep={step === "any" ? null : step}
                    expectationOverrides={expectationOverrides}
                    applyExpectation={applyExpectation}
                    highlightStep={bottleneck.step}
                  />
                </div>
              </div>

              </>
              );
            })()
          )}
          {a2pSlowing >= 2 && (
            <Verdict
              tone="watch"
              attribution="GoCSM Analysis"
              actions={
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => {
                    setPopulation("onboarding");
                    setNeedsHelpOnly(false);
                    setStep("A2P brand registration");
                    setTimeout(scrollToSingleTable, 50);
                  }}
                  style={{
                    height: 32,
                    padding: "0 14px",
                    fontSize: 13,
                    fontWeight: 600,
                    border: "none",
                    borderRadius: "var(--r-sm)",
                    cursor: "pointer",
                  }}
                >
                  See who ↓
                </button>
              }
            >
              <span className="mono">{a2pSlowing}</span> clients are losing time waiting
              on carrier approval for text messaging.
            </Verdict>
          )}



        </>
      )}
      </div>

      {/* TRIAGE STRIP — the 3-second answer on the triage axis (JTBD 2/7).
          Replaces the lifecycle census as primary orientation. Only "Needs you"
          carries a saturated rail (Linear color discipline); the rest stay calm.
          Every count has a plain-English subtext — no naked numbers (Pattern 1). */}
      <div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            alignItems: "start",
            gap: 16,
          }}
        >
          <StatusCard
            label="Needs you"
            count={stuckCount}
            accent="var(--neg-7)"
            sub={stuckCount > 0 ? "stuck — you can unblock them" : "nobody's stuck right now"}
            muted={stuckCount === 0}
            active={population === "onboarding" && needsHelpOnly}
            onClick={() => selectPopulation("onboarding", true)}
          />
          <StatusCard
            label="Waiting on review"
            count={pendingExternalRows.length}
            accent="var(--warn-7)"
            sub="carrier or DNS — nothing for you to do"
            muted={pendingExternalRows.length === 0}
            onClick={() => {
              setPopulation("onboarding");
              setNeedsHelpOnly(true);
              setWaitingExpanded(true);
              setTimeout(
                () =>
                  document
                    .getElementById("waiting-strip")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" }),
                50,
              );
            }}
          />
          <StatusCard
            label="On pace"
            count={onPaceCount}
            accent="var(--pos-7)"
            sub="moving fine on their own"
            muted={onPaceCount === 0}
            active={population === "onboarding" && !needsHelpOnly}
            onClick={() => selectPopulation("onboarding", false)}
          />
        </div>

        {/* PROOF LINE — JTBD 6 (getting faster) + the onboarded census, in ONE line.
            Real data only (prior_median_days_to_activate); never a chart. */}
        {(() => {
          const showAvg = !isSparse && activationTrend.current !== null;
          const showTrend =
            showAvg &&
            activationTrend.prior !== null &&
            activationTrend.prior !== activationTrend.current;
          const faster =
            showTrend && (activationTrend.current as number) < (activationTrend.prior as number);
          const linkStyle: CSSProperties = {
            all: "unset",
            color: "var(--text)",
            fontWeight: 600,
            cursor: "pointer",
            borderBottom: "1px solid var(--border-strong)",
          };
          const parts: ReactNode[] = [];
          if (onboardedCount > 0) {
            parts.push(
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <Check size={13} color="var(--pos-7)" />
                <button type="button" style={linkStyle} onClick={() => selectPopulation("onboarded")}>
                  <span className="mono">{onboardedCount}</span> finished this week
                </button>
                {nudgedCompleted > 0 && (
                  <span style={{ color: "var(--text-3)" }}>
                    (<span className="mono">{nudgedCompleted}</span> after a nudge)
                  </span>
                )}
              </span>,
            );
          }
          if (showAvg) {
            parts.push(
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                avg <span className="mono">{activationTrend.current}</span> days to onboard
                {showTrend && (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 2,
                      // Improvement pops green; a regression stays honest (real
                      // arrow + number) but calm — a 2-day median slip shouldn't
                      // alarm the owner every morning.
                      color: faster ? "var(--pos-7)" : "var(--text-2)",
                      fontWeight: 500,
                    }}
                  >
                    {faster ? (
                      <ArrowDown size={12} strokeWidth={2} aria-hidden />
                    ) : (
                      <ArrowUp size={12} strokeWidth={2} aria-hidden />
                    )}
                    {faster ? "down" : "up"} from{" "}
                    <span className="mono">{activationTrend.prior}</span> {activationTrend.windowLabel}
                  </span>
                )}
              </span>,
            );
          }
          if (notStartedCount > 0) {
            parts.push(
              <button
                type="button"
                style={{ ...linkStyle, color: "var(--text-2)", fontWeight: 500 }}
                onClick={() => selectPopulation("not-started")}
              >
                <span className="mono">{notStartedCount}</span> not started yet
              </button>,
            );
          }
          if (parts.length === 0) return null;
          return (
            <div
              style={{
                marginTop: 12,
                fontSize: 12.5,
                color: "var(--text-2)",
                display: "flex",
                gap: 10,
                rowGap: 6,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              {parts.map((p, i) => (
                <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                  {i > 0 && <span style={{ color: "var(--text-3)" }}>·</span>}
                  {p}
                </span>
              ))}
            </div>
          );
        })()}
      </div>




      <section id="population-table" style={{ scrollMarginTop: 16 }}>
        {(() => {
          const headerInfo: { title: ReactNode; subtitle: string; toggle: ReactNode | null } = (() => {
            const toggleBtnStyle: CSSProperties = {
              all: "unset",
              fontSize: 12,
              color: "var(--text-2)",
              cursor: "pointer",
              padding: "4px 8px",
              borderRadius: "var(--r-sm)",
            };
            if (population === "onboarding" && needsHelpOnly) {
              return {
                title: <>Needs help today (<span className="mono">{stalledRows.length}</span>)</>,
                subtitle: "Your action queue — clients past target on their current step.",
                toggle: null,
              };
            }
            if (population === "onboarding") {
              return {
                title: <>Onboarding now (<span className="mono">{onboardingNowCount}</span>)</>,
                subtitle: "All accounts currently mid-journey.",
                toggle: stalledRows.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => setNeedsHelpOnly(true)}
                    style={toggleBtnStyle}
                  >
                    Show only needs help (<span className="mono">{stalledRows.length}</span>) →
                  </button>
                ) : null,
              };
            }
            if (population === "onboarded") {
              return {
                title: <>Onboarded (<span className="mono">{onboardedCount}</span>)</>,
                subtitle: "Accounts that crossed the finish line.",
                toggle: null,
              };
            }
            return {
              title: <>Not started (<span className="mono">{notStartedCount}</span>)</>,
              subtitle: "Accounts that haven't begun setup yet.",
              toggle: null,
            };
          })();
          return (
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 16,
                marginBottom: 10,
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <h2
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--text)",
                    margin: 0,
                  }}
                >
                  {headerInfo.title}
                </h2>
                <div style={{ fontSize: 12, fontWeight: 400, color: "var(--text-2)" }}>
                  {headerInfo.subtitle}
                </div>
              </div>
              {headerInfo.toggle}
            </div>
          );
        })()}

        {population === "onboarding" && needsHelpOnly ? (
          (() => {
            const reasonGroups = summarizeStuckReasons(stalledRows);
            const topGroups = reasonGroups.slice(0, 3);
            const showChips =
              stalledRows.length > 0 &&
              topGroups.length > 0 &&
              demo !== "zero-stalls" &&
              !isSparse;
            return (
              <>
                {showChips && (
                  <div
                    role="group"
                    aria-label="Filter queue by reason"
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 6,
                      marginBottom: 8,
                    }}
                  >
                    {reasonFilter !== null && (
                      <button
                        type="button"
                        onClick={() => setReasonFilter(null)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          height: 28,
                          padding: "0 10px",
                          fontSize: 12,
                          fontWeight: 500,
                          borderRadius: "var(--r-sm)",
                          border: "1px solid var(--border-strong)",
                          background: "var(--surface)",
                          color: "var(--text-2)",
                          cursor: "pointer",
                        }}
                      >
                        ← All reasons
                      </button>
                    )}
                    {topGroups.map((g) => {
                      const active = reasonFilter === g.key;
                      return (
                        <button
                          key={g.key}
                          type="button"
                          aria-pressed={active}
                          onClick={() =>
                            setReasonFilter(active ? null : g.key)
                          }
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            height: 28,
                            padding: "0 10px",
                            fontSize: 12,
                            fontWeight: 500,
                            borderRadius: "var(--r-sm)",
                            border: `1px solid ${active ? "var(--n-7)" : "var(--border-strong)"}`,
                            background: active
                              ? "var(--bg-subtle)"
                              : "var(--surface)",
                            color: "var(--text)",
                            cursor: "pointer",
                          }}
                        >
                          {g.label}{" "}
                          <span
                            className="mono"
                            style={{ color: "var(--text-3)" }}
                          >
                            ({g.count})
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
                <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            {demo === "zero-stalls" || isSparse || stalledRows.length === 0 ? (
              <div
                style={{
                  padding: "40px 24px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  gap: 8,
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    background: "var(--pos-soft)",
                    display: "grid",
                    placeItems: "center",
                    marginBottom: 4,
                  }}
                >
                  <Check size={24} color="var(--pos-7)" strokeWidth={2.4} />
                </div>
                <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text)" }}>
                  {isSparse ? "Nothing needs you yet" : "You're all caught up"}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: "var(--text-2)",
                    maxWidth: "46ch",
                    lineHeight: 1.5,
                  }}
                >
                  {isSparse
                    ? "Your newest clients just started — nothing's stuck. "
                    : "Every client who needed you, you've handled. "}
                  {onPaceCount > 0 ? (
                    <>
                      <span className="mono">{onPaceCount}</span>{" "}
                      {onPaceCount === 1 ? "client is" : "clients are"} moving along on their
                      own — we'll flag anyone who falls behind.
                    </>
                  ) : (
                    <>We'll flag anyone who falls behind.</>
                  )}
                </div>
              </div>
            ) : (
              (() => {
                const filteredRows = reasonFilter
                  ? stalledRows.filter((a) => matchesReasonKey(a, reasonFilter))
                  : stalledRows;
                if (reasonFilter && filteredRows.length === 0) {
                  return (
                    <div
                      style={{
                        padding: "20px 16px",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        color: "var(--text-2)",
                        fontSize: 13,
                      }}
                    >
                      No clients match this reason right now.
                    </div>
                  );
                }
                const visibleRows = queueExpanded ? filteredRows : filteredRows.slice(0, 5);
                return (
                  <>
                    {visibleRows.map((a, i) => {
                      const receipt = receipts[a.account];
                      const mem = renderMemory(a, receipt);
                      const planTargetDays = variantTargetDays(STANDARD_GHL_JOURNEY, a.plan);
                      const pastTarget = isPastTarget(a, planTargetDays);
                      const reason = getStuckReason(a);
                      const externalWindow = isOverExternalBudget(a);
                      const severity: "hard" | "external_window" = externalWindow
                        ? "external_window"
                        : "hard";
                      return (
                        <div
                          key={a.account}
                          className="queue-row-hoverable"
                          style={
                            i === 0
                              ? undefined
                              : { borderTop: "1px solid var(--border-soft)" }
                          }
                        >
                          <QueueRow
                            onClick={() => setOpenAccount(a)}
                            subject={
                              <div style={{ minWidth: 0 }}>
                                <div style={{ fontSize: 12, fontWeight: 500, color: "var(--text-3)", letterSpacing: "0.01em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                  {a.account}
                                </div>
                                <div
                                  title={
                                    [a.current_step, reason?.text]
                                      .filter(Boolean)
                                      .join(" — ")
                                  }
                                  style={{
                                    marginTop: 2,
                                    display: "-webkit-box",
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: "vertical",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    lineHeight: 1.35,
                                  }}
                                >
                                  {a.current_step && (
                                    <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>
                                      {a.current_step}
                                    </span>
                                  )}
                                  {reason && (
                                    <>
                                      {a.current_step && " "}
                                      <span style={{ fontSize: 13, fontWeight: 400, color: "var(--text-2)" }}>
                                        · {reason.text}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            }

                            impact={
                              <span style={{ fontSize: 12, color: "var(--text-3)", fontWeight: 400 }}>
                                {`$${a.mrr}`}
                              </span>
                            }
                            blockedBy={externalWindow ? undefined : (a.blocked_by ?? undefined)}
                            waitingNote={externalWindow ? "Waiting · external review" : undefined}
                            sla={
                              externalWindow ? (
                                <span style={{ fontSize: 12, fontWeight: 500 }}>
                                  Day{" "}
                                  <span className="mono">
                                    {a.external_wait_days ?? a.days_on_current_step}
                                  </span>
                                  {" / ~"}
                                  <span className="mono">
                                    {a.external_budget_days ?? defaultExternalBudgetDays(a.current_step)}
                                  </span>
                                </span>
                              ) : (
                                <span style={{ fontSize: 12, fontWeight: 500 }}>
                                  Stuck <span className="mono">{a.days_on_current_step}</span>d
                                </span>
                              )
                            }
                            slaTone={externalWindow ? "warning" : pastTarget ? "danger" : "neutral"}
                            memory={mem === "—" ? undefined : mem}
                            action={receipt ? null : renderAction(a, triggerWorkflow, severity)}
                          />

                          {receipt && (
                            <div style={{ padding: "0 16px 16px 16px" }}>
                              <ActionReceipt
                                state={receipt.state}
                                title={
                                  <>
                                    Sent: {receipt.workflow} → <span>{a.account}</span>
                                  </>
                                }
                                scope={`Triggers your "${receipt.workflow}" workflow via HighLevel`}
                                blastRadius="Sends to the account owner. Nothing goes to their customers."
                                graceSeconds={receipt.remaining}
                                reportBack="GoCSM will report back when the step completes."
                                onUndo={() => undoWorkflow(a.account)}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {filteredRows.length > 5 && (
                      <button
                        type="button"
                        onClick={() => setQueueExpanded((v) => !v)}
                        style={{
                          width: "100%",
                          textAlign: "left",
                          padding: "10px 16px",
                          borderTop: "1px solid var(--border-soft)",
                          background: "transparent",
                          border: "none",
                          borderTopStyle: "solid",
                          borderTopWidth: 1,
                          borderTopColor: "var(--border-soft)",
                          fontSize: 13,
                          color: "var(--text-2)",
                          cursor: "pointer",
                        }}
                      >
                        {queueExpanded
                          ? "Show fewer ↑"
                          : `Show all ${filteredRows.length} who need help →`}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setNeedsHelpOnly(false)}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: "10px 16px",
                        borderTop: "1px solid var(--border-soft)",
                        background: "transparent",
                        border: "none",
                        borderTopStyle: "solid",
                        borderTopWidth: 1,
                        borderTopColor: "var(--border-soft)",
                        fontSize: 13,
                        color: "var(--text-2)",
                        cursor: "pointer",
                      }}
                    >
                      Show all onboarding (<span className="mono">{onboardingNowCount}</span>) →
                    </button>
                  </>
                );
              })()
            )}
          </div>
              </>
            );
          })()
        ) : (
          <AllClientsSection
            seed={effectiveSeed}
            pill={pill}
            setPill={setPill}
            step={step}
            setStep={setStep}
            triggerWorkflow={triggerWorkflow}
            undoWorkflow={undoWorkflow}
            receipts={receipts}
            populationFilter={population}
            onOpenAccount={setOpenAccount}
          />
        )}
      </section>

      {population === "onboarding" && pendingExternalRows.length > 0 && !isSparse && demo !== "zero-stalls" && (() => {
        const n = pendingExternalRows.length;
        const days = pendingExternalRows.map((a) => ({
          waited: a.external_wait_days ?? a.days_on_current_step,
          budget: a.external_budget_days ?? defaultExternalBudgetDays(a.current_step),
        }));
        const sameDay = days.every((d) => d.waited === days[0].waited && d.budget === days[0].budget);
        const tail = sameDay
          ? ` · day ${days[0].waited} of ~${days[0].budget}`
          : " · in normal window";
        return (
          <section id="waiting-strip" style={{ marginTop: 16, scrollMarginTop: 16 }}>
            <div
              style={{
                background: "var(--n-2)",
                border: "1px solid var(--border-soft)",
                borderRadius: "var(--r-md)",
                overflow: "hidden",
              }}
            >
              <button
                type="button"
                onClick={() => setWaitingExpanded((v) => !v)}
                aria-expanded={waitingExpanded}
                style={{
                  all: "unset",
                  boxSizing: "border-box",
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 14px",
                  fontSize: 13,
                  color: "var(--text-2)",
                  cursor: "pointer",
                }}
              >
                <span aria-hidden style={{ color: "var(--text-3)" }}>✓</span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span className="mono">{n}</span>{" "}
                  {n === 1 ? "client" : "clients"} waiting on carrier/DNS review{tail}
                </span>
                <span style={{ fontSize: 12, color: "var(--text-3)" }}>No action needed</span>
                <span
                  aria-hidden
                  style={{
                    color: "var(--text-3)",
                    transform: waitingExpanded ? "rotate(180deg)" : "none",
                    transition: "transform var(--d-base) var(--e-out)",
                    fontSize: 11,
                  }}
                >
                  ▾
                </span>
              </button>
              {waitingExpanded && (
                <div style={{ borderTop: "1px solid var(--border-soft)", padding: "6px 8px", display: "flex", flexDirection: "column", gap: 6 }}>
                  {pendingExternalRows.map((a) => {
                    const waited = a.external_wait_days ?? a.days_on_current_step;
                    const budget = a.external_budget_days ?? defaultExternalBudgetDays(a.current_step);
                    const reviewer = (() => {
                      const s = (a.current_step ?? "").toLowerCase();
                      if (s.includes("a2p") || s.includes("text")) return "carrier";
                      if (s.includes("domain") || s.includes("dns") || s.includes("email")) return "DNS";
                      return "review";
                    })();
                    return (
                      <div
                        key={a.account}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr auto",
                          alignItems: "center",
                          gap: 16,
                          padding: "8px 12px",
                          background: "var(--surface-2)",
                          borderRadius: "var(--r-sm)",
                        }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 400, fontSize: 12, color: "var(--text-2)" }}>
                            {a.account}
                          </div>
                          {a.current_step && (
                            <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 1 }}>
                              {a.current_step}
                            </div>
                          )}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, whiteSpace: "nowrap" }}>
                          <span style={{ fontSize: 11, color: "var(--text-3)" }}>
                            Waiting on {reviewer} · day{" "}
                            <span className="mono">{waited}</span> of ~<span className="mono">{budget}</span>
                          </span>
                          <button
                            type="button"
                            style={{
                              all: "unset",
                              fontSize: 11,
                              color: "var(--text-3)",
                              cursor: "pointer",
                            }}
                          >
                            Check status
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        );
      })()}

    </div>
  );


  return (
    <div>
      {devStrip}
      <PageHeader
        title="Onboarding"
        tabs={makeOnboardingTabs("overview")}
      />
      {differentiationLine}
      {isHero && (
        <RolloutHero
          variant={demo === "rollout-drafted" ? "drafted" : "new"}
          accountCount={seed.accounts.length}
          stepCount={STANDARD_GHL_JOURNEY.steps.length}
          onOpenJourney={() => navigate({ to: "/onboarding/journey" })}
        />
      )}
      {isScanning && scanPhase !== "dismissed" && (
        <>
          <RolloutHero
            variant="scanning"
            accountCount={seed.accounts.length}
            stepCount={STANDARD_GHL_JOURNEY.steps.length}
            onOpenJourney={() => navigate({ to: "/onboarding/journey" })}
            scanProps={{
              phase: scanPhase,
              scanned,
              total: scanTotal,
              stepsAlreadyComplete: seed.accounts.reduce(
                (s, a) => s + a.steps_done,
                0,
              ),
              needsAttention: selectStalledAccounts(seed).length,
              onSeeAttention: () => {
                setScanPhase("dismissed");
                setTimeout(scrollToSingleTable, 50);
              },
            }}
          />
          <DetectedAccountsTable
            seed={seed}
            scanned={scanned}
            total={scanTotal}
            stepCount={STANDARD_GHL_JOURNEY.steps.length}
          />
        </>
      )}
      {isHero ? (
        <div style={{ position: "relative", marginTop: 24 }}>
          <div
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              zIndex: 2,
              padding: "4px 10px",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--text-2)",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--r-sm)",
              boxShadow: "var(--shadow-1, 0 2px 8px rgba(0,0,0,.06))",
            }}
          >
            Sample data — yours appears after publishing
          </div>
          <div
            aria-hidden="true"
            style={{
              opacity: 0.6,
              pointerEvents: "none",
              userSelect: "none",
            }}
          >
            {bodyContent}
          </div>
        </div>
      ) : isScanning && scanPhase !== "dismissed" ? null : (
        bodyContent
      )}
      <AccountStoryDrawer
        account={openAccount}
        onClose={() => setOpenAccount(null)}
        onTriggerWorkflow={triggerWorkflow}
        onUndoWorkflow={undoWorkflow}
        receipt={openAccount ? receipts[openAccount.account] : undefined}
      />
    </div>
  );
}

type ScanProps = {
  phase: "scanning" | "complete";
  scanned: number;
  total: number;
  stepsAlreadyComplete: number;
  needsAttention: number;
  onSeeAttention: () => void;
};

function RolloutHero({
  variant,
  accountCount,
  stepCount,
  onOpenJourney,
  scanProps,
}: {
  variant: "new" | "drafted" | "scanning";
  accountCount: number;
  stepCount: number;
  onOpenJourney: () => void;
  scanProps?: ScanProps;
}) {
  type RowState = "done" | "in_progress" | "locked" | "scanning";
  type Row = {
    state: RowState;
    title: ReactNode;
    sub: ReactNode;
    cta?: { label: string; onClick: () => void };
  };

  const verifiedAffix = (
    <span style={{ color: "var(--pos-7)", fontSize: 12, fontWeight: 500 }}>
      Verified ✓
    </span>
  );

  const scanRow = (): Row => {
    const sp = scanProps!;
    if (sp.phase === "scanning") {
      return {
        state: "scanning",
        title: "Scanning your accounts for onboarding signals…",
        sub: (
          <span className="mono" style={{ color: "var(--text-2)" }}>
            {sp.scanned} of {sp.total} accounts scanned
          </span>
        ),
      };
    }
    return {
      state: "done",
      title: `Done — ${sp.total} clients mapped`,
      sub: (
        <>
          <span className="mono">{sp.needsAttention}</span> clients need a push today.{" "}
          <span className="mono">{sp.stepsAlreadyComplete}</span> steps were already
          done before GoCSM started watching.
        </>
      ),
      cta: { label: "See who needs a push ↓", onClick: sp.onSeeAttention },
    };
  };

  const rows: Row[] =
    variant === "new"
      ? [
          {
            state: "in_progress",
            title: "Create your journey",
            sub: "start from your existing checklist",
            cta: { label: "Open Journey tab →", onClick: onOpenJourney },
          },
          { state: "locked", title: "Publish it", sub: "Unlocks when your journey is ready" },
          { state: "locked", title: "Watch your clients' progress appear", sub: "" },
        ]
      : variant === "drafted"
      ? [
          {
            state: "done",
            title: <>Create your journey {verifiedAffix}</>,
            sub: "start from your existing checklist",
          },
          {
            state: "in_progress",
            title: `Publish your journey — ${stepCount} steps ready`,
            sub: "go live so client signals start flowing",
            cta: { label: "Open Journey tab →", onClick: onOpenJourney },
          },
          { state: "locked", title: "Watch your clients' progress appear", sub: "" },
        ]
      : [
          {
            state: "done",
            title: <>Create your journey {verifiedAffix}</>,
            sub: "",
          },
          {
            state: "done",
            title: <>Publish your journey {verifiedAffix}</>,
            sub: "",
          },
          scanRow(),
        ];

  const dotFor = (s: RowState) => {
    if (s === "done")
      return <Check size={16} color="var(--pos-7)" strokeWidth={2.2} />;
    if (s === "locked")
      return <Lock size={14} color="var(--text-3)" strokeWidth={2} />;
    if (s === "scanning") {
      // Pulse via existing frozen .onb-step.verifying .onb-dot animation.
      return (
        <span
          className="onb-step verifying"
          style={{ padding: 0, display: "inline-flex" }}
        >
          <span className="onb-dot" />
        </span>
      );
    }
    return (
      <span
        style={{
          width: 10,
          height: 10,
          borderRadius: "50%",
          background: "var(--info-7)",
          display: "inline-block",
        }}
      />
    );
  };

  return (
    <div className="card" style={{ padding: 16, marginTop: 16 }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <span
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            background: "color-mix(in oklab, var(--info-7) 14%, transparent)",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "var(--info-7)",
            }}
          />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text)" }}>
            {variant === "scanning"
              ? "Looking at your clients to see where each one is"
              : "Get your client onboarding running"}
          </div>
          <div style={{ fontSize: 13, color: "var(--text-2)", marginTop: 4 }}>
            {variant === "scanning" ? (
              <>
                Checking each of your{" "}
                <span className="mono">{accountCount}</span> HighLevel accounts to see
                what they've finished.
              </>
            ) : (
              <>
                You're watching <span className="mono">{accountCount}</span> clients.
                Here's where each one is in their setup.
              </>
            )}

          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: 16,
          borderTop: "1px solid var(--border-soft)",
          display: "grid",
        }}
      >
        {rows.map((r, i) => (
          <div
            key={i}
            style={{
              display: "grid",
              gridTemplateColumns: "28px 1fr auto",
              gap: 12,
              alignItems: "center",
              padding: "12px 0",
              borderTop: i === 0 ? "none" : "1px solid var(--border-soft)",
              opacity: r.state === "locked" ? 0.6 : 1,
            }}
          >
            <span
              style={{
                width: 28,
                height: 28,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {dotFor(r.state)}
            </span>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text)" }}>
                {r.title}
              </div>
              {r.sub && (
                <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>
                  {r.sub}
                </div>
              )}
            </div>
            {r.cta && (
              <button
                type="button"
                className="btn-primary"
                onClick={r.cta.onClick}
                style={{
                  height: 32,
                  padding: "0 14px",
                  fontSize: 13,
                  fontWeight: 600,
                  border: "none",
                  borderRadius: "var(--r-sm)",
                  cursor: "pointer",
                }}
              >
                {r.cta.label}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function DetectedAccountsTable({
  seed,
  scanned,
  total,
  stepCount,
}: {
  seed: OnboardingSeed;
  scanned: number;
  total: number;
  stepCount: number;
}) {
  const visible = seed.accounts.slice(0, scanned);
  return (
    <section style={{ marginTop: 24 }}>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 10,
          marginBottom: 10,
        }}
      >
        <h2
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--text-2)",
            margin: 0,
          }}
        >
          Clients we found
        </h2>
        <span className="mono" style={{ fontSize: 12, color: "var(--text-3)" }}>
          {scanned} of {total} mapped
        </span>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
          <ConfTag basis="fact" />
          <span style={{ fontSize: 11, color: "var(--text-3)" }}>
            From what GoCSM saw in HighLevel
          </span>
        </div>
      </div>
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {visible.length === 0 ? (
          <div style={{ padding: "20px 16px", fontSize: 13, color: "var(--text-3)" }}>
            Waiting for first signal…
          </div>
        ) : (
          visible.map((a, i) => {
            const done = a.steps_done >= a.steps_total;
            return (
              <div
                key={a.account}
                className="animate-fade-in"
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(180px, 1.4fr) 2fr auto",
                  gap: 16,
                  alignItems: "center",
                  padding: "12px 16px",
                  borderTop:
                    i === 0 ? "none" : "1px solid var(--border-soft)",
                }}
              >
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 500,
                    color: "var(--text)",
                    minWidth: 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {a.account}
                </div>
                <div style={{ fontSize: 13, color: "var(--text-2)", minWidth: 0 }}>
                  {done ? (
                    <>
                      <span className="mono">
                        {a.steps_done} of {stepCount}
                      </span>{" "}
                      already complete
                    </>
                  ) : (
                    <>
                      <span className="mono">
                        {a.steps_done} of {stepCount}
                      </span>
                      {a.current_step ? (
                        <>
                          {" "}
                          · currently on{" "}
                          <span style={{ color: "var(--text)" }}>{a.current_step}</span>
                        </>
                      ) : null}
                    </>
                  )}
                </div>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 11,
                    color: "var(--text-3)",
                    whiteSpace: "nowrap",
                  }}
                >
                  <span
                    aria-hidden
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: "var(--info-7)",
                      display: "inline-block",
                    }}
                  />
                  detected just now
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}


function renderMemory(
  a: OnboardingAccount,
  receipt?: ReceiptState,
) {
  if (receipt && (receipt.state === "pending" || receipt.state === "sent")) {
    return (
      <span style={{ color: "var(--text-2)", fontStyle: "italic" }}>
        Workflow triggered just now — pending
      </span>
    );
  }
  const li = a.last_intervention;
  if (!li) return "—";
  if (li.outcome === "completed_after_nudge") {
    return (
      <span style={{ color: "var(--pos-9)", fontStyle: "normal" }}>Completed after workflow</span>
    );
  }
  return "—";
}

const MORE_ITEM_ICONS: Record<string, LucideIcon> = {
  "Assign to teammate": UserPlus,
  "Open kickoff calendar": Calendar,
  "Open in HighLevel": ExternalLink,
  "Trigger workflow": Zap,
  "Escalate to carrier": AlertTriangle,
  "Open Trust Center": ShieldCheck,
};

function isKickoffStep(stepName: string | null | undefined): boolean {
  if (!stepName) return false;
  return /kickoff/i.test(stepName);
}

function renderAction(
  a: OnboardingAccount,
  triggerWorkflow: (account: string, workflow: string) => void,
  severity: "hard" | "external_window" = "hard",
) {
  const isAgency = a.blocked_by === "agency";
  const kickoff = isKickoffStep(a.current_step);
  let primary: React.ReactNode;
  let moreItems: string[];
  if (severity === "external_window") {
    // External party (carrier/DNS/Google) is slow. No client-nudge here.
    primary = (
      <button type="button" className="btn btn-secondary btn-sm" title="Check status">
        Check status
      </button>
    );
    moreItems = ["Escalate to carrier", "Open Trust Center", "Open in HighLevel"];
  } else if (isAgency) {
    primary = (
      <button type="button" className="btn btn-secondary btn-sm" title="Assign">
        Assign
      </button>
    );
    moreItems = ["Assign to teammate", "Open in HighLevel"];
    if (kickoff) moreItems.splice(1, 0, "Open kickoff calendar");
  } else {
    primary = (
      <WorkflowTriggerPopover
        account={a.account}
        currentStep={a.current_step}
        onPick={(wf) => triggerWorkflow(a.account, wf)}
      >
        <button type="button" className="btn btn-secondary btn-sm" title="Trigger workflow">
          Trigger workflow
        </button>
      </WorkflowTriggerPopover>
    );
    moreItems = ["Assign to teammate", "Open in HighLevel"];
    if (kickoff) moreItems.splice(1, 0, "Open kickoff calendar");
  }
  return (
    <div
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
      style={{ width: 168, display: "inline-flex", alignItems: "center", justifyContent: "flex-end", gap: 6 }}
    >
      {primary}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="More actions"
            className="btn btn-secondary btn-sm"
            style={{ width: 28, padding: 0 }}
          >
            <MoreHorizontal size={20} strokeWidth={1.75} style={{ width: 20, height: 20 }} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          sideOffset={6}
          collisionPadding={8}
          style={{
            minWidth: 200,
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--r-md)",
            boxShadow: "var(--shadow-2, 0 8px 24px rgba(15,23,42,.12))",
            padding: 4,
          }}
        >
          {moreItems.map((label) => {
            const Icon = MORE_ITEM_ICONS[label] ?? Clock3;
            return (
              <DropdownMenuItem
                key={label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  height: 32,
                  padding: "0 10px",
                  fontSize: 13,
                  color: "var(--text)",
                  borderRadius: "var(--r-sm)",
                  cursor: "pointer",
                }}
              >
                <Icon size={16} strokeWidth={1.75} aria-hidden style={{ color: "var(--text-2)" }} />
                <span>{label}</span>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function DevStrip({
  mode,
  onChange,
}: {
  mode: DemoMode;
  onChange: (m: DemoMode) => void;
}) {
  const [open, setOpen] = useState(false);
  const demoModes: { id: DemoMode; label: string }[] = [
    { id: "default", label: "Default" },
    { id: "zero-journeys", label: "Zero journeys" },
    { id: "zero-stalls", label: "Zero stalls" },
    { id: "agency-bottleneck", label: "Agency bottleneck" },
  ];
  const rolloutModes: { id: DemoMode; label: string }[] = [
    { id: "rollout-new", label: "New customer" },
    { id: "rollout-drafted", label: "Journey drafted" },
    { id: "rollout-scanning", label: "Published · scanning" },
    { id: "rollout-sparse", label: "Sparse week-1" },
  ];
  const groupLabel = {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    color: "var(--text-3)",
    padding: "0 6px",
  };
  const renderBtn = (m: { id: DemoMode; label: string }) => {
    const active = mode === m.id;
    return (
      <button
        key={m.id}
        type="button"
        onClick={() => onChange(m.id)}
        style={{
          height: 24,
          padding: "0 10px",
          fontSize: 11,
          fontWeight: 500,
          borderRadius: "var(--r-sm)",
          cursor: "pointer",
          background: active ? "var(--n-3)" : "transparent",
          color: active ? "var(--text)" : "var(--text-2)",
          border: "none",
        }}
      >
        {m.label}
      </button>
    );
  };
  return (
    <div
      style={{
        position: "fixed",
        top: 12,
        right: 12,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: 4,
        background: "var(--surface)",
        border: "1px dashed var(--border)",
        borderRadius: "var(--r-md)",
        boxShadow: "var(--shadow-1, 0 2px 8px rgba(0,0,0,.06))",
      }}
      aria-label="Demo state toggle"
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? "Hide dev controls" : "Show dev controls"}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.08em",
          color: "var(--text-3)",
          padding: "2px 6px",
          border: "1px solid var(--border)",
          borderRadius: 4,
          background: "transparent",
          cursor: "pointer",
        }}
      >
        DEV
        <span aria-hidden style={{ fontSize: 9, lineHeight: 1 }}>
          {open ? "▾" : "▸"}
        </span>
      </button>
      {open && (
        <>
          <span style={groupLabel}>demo</span>
          {demoModes.map(renderBtn)}
          <span
            aria-hidden
            style={{
              width: 1,
              alignSelf: "stretch",
              background: "var(--border-soft)",
              margin: "0 4px",
            }}
          />
          <span style={groupLabel}>rollout</span>
          {rolloutModes.map(renderBtn)}
        </>
      )}
    </div>
  );
}



const ghostBtn = {
  height: 28,
  padding: "0 10px",
  fontSize: 12,
  fontWeight: 500,
  border: "none",
  background: "transparent",
  color: "var(--text-2)",
  borderRadius: "var(--r-sm)",
  cursor: "pointer",
} as const;

// Sticky thead cells for the scroll-bounded portfolio table.
// top: 48 leaves room for the sticky filter bar above it inside the same card.
const stickyTh = {
  position: "sticky" as const,
  top: 48,
  background: "var(--surface)",
  zIndex: 1,
};

function SummaryCard({
  label,
  value,
  sub,
  valueColor,
  pointer,
  onClick,
}: {
  label: string;
  value: string;
  sub: string;
  valueColor?: string;
  pointer?: { label: string; onClick: () => void };
  onClick?: () => void;
}) {
  const clickable = !!onClick;
  return (
    <div
      className="metric-card"
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        clickable
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      style={clickable ? { cursor: "pointer" } : undefined}
    >
      <div style={{ fontSize: 12, color: "var(--text-2)" }}>{label}</div>
      <div
        className="mono metric-lg"
        style={valueColor ? { color: valueColor } : undefined}
      >
        {value}
      </div>
      <div style={{ fontSize: 12, color: "var(--text-3)" }}>{sub}</div>
      {pointer && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            pointer.onClick();
          }}
          style={{
            marginTop: 4,
            padding: 0,
            background: "transparent",
            border: "none",
            fontSize: 12,
            color: "var(--text-3)",
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          {pointer.label}
        </button>
      )}
    </div>
  );
}

function StatusCard({
  label,
  count,
  accent,
  sub,
  muted,
  active,
  onClick,
}: {
  label: string;
  count: number;
  accent: string;
  sub: ReactNode;
  muted?: boolean;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
      style={{
        cursor: "pointer",
        background: "var(--surface)",
        // Per-side borders (not the `border` shorthand) so the 3px accent
        // borderLeft never conflicts with the toggled border on rerender —
        // mixing shorthand + longhand warns in React and resets the accent rail.
        borderTop: active ? "1px solid var(--border-strong)" : "1px solid var(--border)",
        borderRight: active ? "1px solid var(--border-strong)" : "1px solid var(--border)",
        borderBottom: active ? "1px solid var(--border-strong)" : "1px solid var(--border)",
        borderLeft: `3px solid ${accent}`,
        borderRadius: "var(--r-md)",
        padding: "16px 18px",
        display: "flex",
        flexDirection: "column",
        gap: 6,
        opacity: muted ? 0.4 : 1,
        transition: "background 120ms ease-out, opacity 120ms ease-out",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "var(--surface-2, rgba(0,0,0,.02))";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "var(--surface)";
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
        <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>
          {label}
        </span>
        <span style={{ color: "var(--text-3)" }}>·</span>
        <span className="mono" style={{ fontSize: 22, fontWeight: 600, color: "var(--text)" }}>
          {count}
        </span>
      </div>
      <div style={{ fontSize: 13, color: "var(--text-2)", minHeight: 18 }}>{sub}</div>
    </div>
  );
}




// Bottleneck = the step with the most accounts currently stalled past expectation.
// Reads expected days through the page-level helper so it shares the single source.
interface Bottleneck {
  step: string;
  expectedDays: number;
  accounts: OnboardingAccount[];
}
function selectBottleneck(
  s: OnboardingSeed,
  expectedDaysFor: (step: string | null) => number | null,
): Bottleneck | null {
  const funnelOrder = new Map(s.funnel.map((f, i) => [f.step, i]));
  const groups = new Map<string, OnboardingAccount[]>();
  for (const a of s.accounts) {
    if (!isStuck(a) || !a.current_step) continue;
    const exp = expectedDaysFor(a.current_step);
    if (exp === null) continue;
    if (a.days_on_current_step <= exp) continue;
    const arr = groups.get(a.current_step) ?? [];
    arr.push(a);
    groups.set(a.current_step, arr);
  }
  let best: Bottleneck | null = null;
  for (const [step, accounts] of groups) {
    const mrr = accounts.reduce((sum, a) => sum + a.mrr, 0);
    const order = funnelOrder.get(step) ?? 999;
    if (!best) {
      best = { step, expectedDays: expectedDaysFor(step)!, accounts };
      continue;
    }
    const bestMrr = best.accounts.reduce((sum, a) => sum + a.mrr, 0);
    const bestOrder = funnelOrder.get(best.step) ?? 999;
    if (
      accounts.length > best.accounts.length ||
      (accounts.length === best.accounts.length && mrr > bestMrr) ||
      (accounts.length === best.accounts.length && mrr === bestMrr && order < bestOrder)
    ) {
      best = { step, expectedDays: expectedDaysFor(step)!, accounts };
    }
  }
  return best;
}


function EvidenceSection({
  seed,
  onBarClick,
  activeStep,
  expectationOverrides,
  applyExpectation,
  emptyCopy,
  highlightStep,
}: {
  seed: ReturnType<typeof getOnboardingSeed>;
  onBarClick: (stepName: string, stuckCount: number) => void;
  activeStep: string | null;
  expectationOverrides: Record<string, number>;
  applyExpectation: (step: string, days: number) => void;
  emptyCopy?: string;
  highlightStep?: string;
}) {
  const [stepsExpanded, setStepsExpanded] = useState(false);
  const navigate = useNavigate();
  const funnel = selectFunnel(seed);
  const total = funnel[0]?.clients_reached ?? 0;
  const calMap = new Map(seed.sla_calibration.map((r) => [r.step, r]));
  const stuckByStep = new Map<string, number>();
  for (const a of seed.accounts) {
    if (isStuck(a) && a.current_step) {
      stuckByStep.set(a.current_step, (stuckByStep.get(a.current_step) ?? 0) + 1);
    }
  }

  const isSignal = (stepName: string) => {
    const stuck = stuckByStep.get(stepName) ?? 0;
    if (stuck > 0) return true;
    const override = expectationOverrides[stepName];
    if (override !== undefined) return false; // applied => resolved
    const x = MILESTONE_X_BY_STEP[stepName];
    const y = MILESTONE_Y_BY_STEP[stepName];
    return x !== undefined && y !== undefined && y > x;
  };
  const signalSteps = funnel.filter((f) => isSignal(f.step));
  const sortByStuckDesc = (a: typeof funnel[number], b: typeof funnel[number]) => {
    if (highlightStep) {
      if (a.step === highlightStep) return -1;
      if (b.step === highlightStep) return 1;
    }
    return (stuckByStep.get(b.step) ?? 0) - (stuckByStep.get(a.step) ?? 0);
  };
  const baseSteps = stepsExpanded ? [...funnel] : [...signalSteps];
  const ensured =
    highlightStep && !baseSteps.some((f) => f.step === highlightStep)
      ? [...baseSteps, ...funnel.filter((f) => f.step === highlightStep)]
      : baseSteps;
  const visibleSteps = ensured.sort(sortByStuckDesc);
  const maxStuck = visibleSteps.reduce(
    (m, f) => Math.max(m, stuckByStep.get(f.step) ?? 0),
    0,
  );

  // Sequential blue ramp by step index — depth-in-journey reads at a glance.
  const rampTokens = ["--viz-seq-2", "--viz-seq-3", "--viz-seq-4", "--viz-seq-5", "--viz-seq-6"];
  const rampColorFor = (stepName: string) => {
    const idx = funnel.findIndex((f) => f.step === stepName);
    if (idx < 0 || funnel.length <= 1) return `var(--viz-seq-4)`;
    const bucket = Math.min(
      rampTokens.length - 1,
      Math.floor((idx / (funnel.length - 1)) * rampTokens.length),
    );
    return `var(${rampTokens[bucket]})`;
  };

  const COLS = "minmax(220px, 1.7fr) 140px 96px";
  const headerStyle = {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    color: "var(--text-3)",
  };

  const headerCopy = stepsExpanded
    ? `Where clients get stuck — all ${funnel.length} steps`
    : `Where clients get stuck — ${signalSteps.length} of ${funnel.length} steps`;


  return (
    <section id="per-step-health" style={{ marginTop: 32 }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 10,
          marginBottom: 10,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <h2
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--text-2)",
              margin: 0,
            }}
          >
            {headerCopy}
          </h2>
          <div style={{ fontSize: 12, fontWeight: 400, color: "var(--text-2)" }}>
            Your chronic chokepoints — fix these in your process.
          </div>
        </div>
        <span style={{ fontSize: 13, color: "var(--text-3)", alignSelf: "flex-end" }}>
          <span className="mono">{total}</span> clients moving through{" "}
          <span className="mono">{funnel.length}</span> steps · click any step to see
          who's there
        </span>
        <button
          type="button"
          onClick={() => setStepsExpanded((v) => !v)}
          style={{
            marginLeft: "auto",
            alignSelf: "flex-end",
            background: "transparent",
            border: "none",
            fontSize: 12,
            fontWeight: 500,
            color: "var(--text-2)",
            cursor: "pointer",
            padding: "4px 8px",
            borderRadius: "var(--r-sm)",
          }}
        >
          {stepsExpanded
            ? "Show only steps that need a push"
            : `Show all ${funnel.length} steps`}
        </button>
      </div>


      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {/* header row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: COLS,
            gap: 12,
            padding: "10px 16px",
            borderBottom: "1px solid var(--border-soft)",
            background: "var(--surface-2, transparent)",
          }}
        >
          <div style={headerStyle}>Step</div>
          <div style={headerStyle}>Made it here</div>
          <div style={headerStyle}>Stuck now</div>
        </div>

        {!stepsExpanded && signalSteps.length === 0 && (
          <div
            style={{
              padding: "20px 16px",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <Check size={16} color="var(--pos-7)" />
            <span style={{ color: "var(--text-2)", fontSize: 13 }}>
              {emptyCopy ?? `All ${funnel.length} steps are moving normally.`}
            </span>
          </div>
        )}
        {visibleSteps.map((f, i) => {
          const reached = f.clients_reached;
          const reachedPct = total > 0 ? Math.round((reached / total) * 100) : 0;
          const stuck = stuckByStep.get(f.step) ?? 0;
          const isActive = activeStep === f.step;
          const isHighlighted = highlightStep === f.step;
          const slim = stepsExpanded && !isSignal(f.step);
          const baseBg = isHighlighted
            ? "color-mix(in oklab, var(--info-7) 8%, transparent)"
            : "transparent";

          return (
            <div
              key={f.step}
              role="button"
              tabIndex={0}
              onClick={() => onBarClick(f.step, stuck)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onBarClick(f.step, stuck);
                }
              }}
              className="step-row step-row-hover"
              style={{
                display: "grid",
                gridTemplateColumns: COLS,
                gap: 12,
                alignItems: "center",
                padding: slim ? "6px 16px" : "12px 16px",
                borderTop: i === 0 ? "none" : "1px solid var(--border-soft)",
                borderLeft:
                  isHighlighted || isActive
                    ? "2px solid var(--info-7)"
                    : "2px solid transparent",
                background: baseBg,
                cursor: "pointer",
                transition: "background 120ms ease-out",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = isHighlighted
                  ? "color-mix(in oklab, var(--info-7) 12%, transparent)"
                  : "var(--surface-2, rgba(0,0,0,.02))";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = baseBg;
              }}
            >
              {/* Step */}
              <div>
                <div
                  style={{
                    fontSize: slim ? 13 : 14,
                    fontWeight: isHighlighted ? 600 : 500,
                    color: slim ? "var(--text-2)" : "var(--text)",
                  }}
                >
                  {f.step}
                </div>
                {isHighlighted ? (
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--text-3)",
                      marginTop: 2,
                    }}
                  >
                    Named in the verdict
                  </div>
                ) : (
                  maxStuck > 0 &&
                  stuck === maxStuck && (
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--text-3)",
                        marginTop: 2,
                      }}
                    >
                      Most clients get stuck here
                    </div>
                  )
                )}
              </div>


              {/* Made it here */}
              <div>
                <div
                  className="mono"
                  style={{ fontSize: 12, color: "var(--text-2)" }}
                >
                  {reached} / {total}
                </div>
                <div
                  style={{
                    marginTop: 4,
                    width: 96,
                    height: 4,
                    background: "var(--n-3)",
                    borderRadius: "var(--r-pill)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${reachedPct}%`,
                      height: "100%",
                      background: rampColorFor(f.step),
                    }}
                  />
                </div>
              </div>

              {/* Stuck now — empty when zero, no em-dash */}
              <div
                className="mono"
                style={{
                  fontSize: 13,
                  color: "var(--neg-7)",
                  fontWeight: 600,
                }}
              >
                {stuck > 0 ? stuck : null}
              </div>
            </div>
          );
        })}
      </div>
      <style>{`
        .step-row-hover .row-hover-action { opacity: 0; transition: opacity 120ms ease-out; }
        .step-row-hover:hover .row-hover-action,
        .step-row-hover:focus-within .row-hover-action { opacity: 1; }
      `}</style>
    </section>
  );
}


type PillFilter = "all" | "onboarded" | "onboarding" | "not-started" | "stuck" | "client" | "agency";

function AllClientsSection({
  seed,
  pill,
  setPill,
  step,
  setStep,
  triggerWorkflow,
  undoWorkflow,
  receipts,
  populationFilter,
  onOpenAccount,
}: {
  seed: ReturnType<typeof getOnboardingSeed>;
  pill: PillFilter;
  setPill: (p: PillFilter) => void;
  step: string;
  setStep: (s: string) => void;
  triggerWorkflow: (account: string, workflow: string) => void;
  undoWorkflow: (account: string) => void;
  receipts: Record<string, ReceiptState>;
  populationFilter?: "onboarding" | "onboarded" | "not-started";
  onOpenAccount: (a: OnboardingAccount) => void;
}) {
  const stepNames = selectAllStepNames(seed);

  const matchesPopulation = (a: OnboardingAccount) => {
    if (!populationFilter) return true;
    if (populationFilter === "onboarding") return a.steps_done > 0 && a.steps_done < a.steps_total;
    if (populationFilter === "onboarded") return a.steps_done === a.steps_total;
    if (populationFilter === "not-started") return a.steps_done === 0;
    return true;
  };
  const matchesPill = (a: OnboardingAccount) => {
    if (pill === "all") return true;
    if (pill === "onboarded") return a.steps_done === a.steps_total;
    if (pill === "onboarding") return a.steps_done > 0 && a.steps_done < a.steps_total;
    if (pill === "not-started") return a.steps_done === 0;
    if (pill === "stuck") return isStuck(a);
    if (pill === "client") return a.blocked_by === "client";
    if (pill === "agency") return a.blocked_by === "agency";
    return true;
  };
  const matchesStep = (a: OnboardingAccount) =>
    step === "any" ? true : a.current_step === step;

  const filtered = seed.accounts.filter(
    (a) => matchesPopulation(a) && matchesPill(a) && matchesStep(a),
  );

  const allPills: { id: PillFilter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "onboarded", label: "Onboarded" },
    { id: "onboarding", label: "Onboarding now" },
    { id: "not-started", label: "Not started" },
    { id: "stuck", label: "Stuck" },
    { id: "client", label: "Client-blocked" },
    { id: "agency", label: "Agency-blocked" },
  ];
  const pills = populationFilter
    ? allPills.filter((p) => !["onboarded", "onboarding", "not-started"].includes(p.id))
    : allPills;


  return (
    
    <section
      style={
        populationFilter
          ? undefined
          : {
              marginTop: 56,
              paddingTop: 56,
              borderTop: "1px solid var(--border-soft)",
            }
      }
      aria-labelledby={populationFilter ? undefined : "all-clients-heading"}
    >
      {!populationFilter && (
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
            marginBottom: 10,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <h2
              id="all-clients-heading"
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--text-2)",
                margin: 0,
              }}
            >
              Every client you're onboarding
            </h2>
            <div style={{ fontSize: 12, fontWeight: 400, color: "var(--text-2)" }}>
              Your full account list — filter and act on individuals.
            </div>
          </div>
          <span
            className="mono"
            style={{ fontSize: 12, color: "var(--text-3)", alignSelf: "flex-end" }}
          >
            {seed.accounts.length}
          </span>
        </div>
      )}


      {(step !== "any" || pill !== "all") && (() => {
        const pillLabel = pills.find((p) => p.id === pill)?.label;
        const both = step !== "any" && pill !== "all";
        const chipStyle: CSSProperties = {
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          height: 26,
          padding: "0 4px 0 10px",
          borderRadius: "var(--r-pill)",
          background: "var(--n-3)",
          color: "var(--text)",
          fontSize: 12,
          fontWeight: 500,
        };
        const xBtnStyle: CSSProperties = {
          all: "unset",
          width: 20,
          height: 20,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "var(--r-pill)",
          cursor: "pointer",
          color: "var(--text-2)",
        };
        return (
          <div
            style={{
              marginBottom: 10,
              display: "flex",
              gap: 6,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            {step !== "any" && (
              <span style={chipStyle}>
                <span>
                  Step: <strong style={{ fontWeight: 600 }}>{step}</strong>
                </span>
                <button
                  type="button"
                  aria-label="Clear step filter"
                  onClick={() => setStep("any")}
                  style={xBtnStyle}
                >
                  <X size={12} aria-hidden />
                </button>
              </span>
            )}
            {pill !== "all" && pillLabel && (
              <span style={chipStyle}>
                <span>{pillLabel}</span>
                <button
                  type="button"
                  aria-label={`Clear ${pillLabel} filter`}
                  onClick={() => setPill("all")}
                  style={xBtnStyle}
                >
                  <X size={12} aria-hidden />
                </button>
              </span>
            )}
            {both && (
              <button
                type="button"
                onClick={() => {
                  setStep("any");
                  setPill("all");
                }}
                style={{
                  all: "unset",
                  fontSize: 12,
                  color: "var(--text-2)",
                  cursor: "pointer",
                  padding: "0 6px",
                  height: 26,
                  display: "inline-flex",
                  alignItems: "center",
                }}
              >
                Clear all
              </button>
            )}
          </div>
        );
      })()}

      {/* Scroll-bounded card: sticky filter bar + sticky thead */}
      <div
        className="card"
        style={{
          padding: 0,
          overflow: "hidden",
          maxHeight: "calc(44px * 8 + 80px)",
          overflowY: "auto",
        }}
      >
        {/* Filter bar — sticky inside the scrollable card */}
        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 2,
            background: "var(--surface)",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 8,
            padding: "10px 12px",
            borderBottom: "1px solid var(--border-soft)",
          }}
        >
          {pills.map((p) => {
            const active = pill === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setPill(p.id)}
                style={{
                  height: 28,
                  padding: "0 12px",
                  fontSize: 12,
                  fontWeight: 500,
                  borderRadius: "var(--r-pill)",
                  cursor: "pointer",
                  background: active ? "var(--n-3)" : "var(--surface)",
                  color: active ? "var(--text)" : "var(--text-2)",
                  border: active ? "1px solid transparent" : "1px solid var(--border)",
                }}
              >
                {p.label}
              </button>
            );
          })}
          <select
            value={step}
            onChange={(e) => setStep(e.target.value)}
            style={{
              height: 28,
              padding: "0 8px",
              fontSize: 12,
              color: "var(--text)",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--r-sm)",
              cursor: "pointer",
            }}
            aria-label="Filter by current step"
          >
            <option value="any">Any step</option>
            {stepNames.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <table className="tbl tbl-sticky-head">

          <thead>
            <tr>
              <th style={stickyTh}>Account</th>
              <th style={stickyTh}>Plan</th>
              <th style={stickyTh}>Progress</th>
              <th style={stickyTh}>Current step</th>
              <th style={stickyTh}>Day of journey</th>
              <th style={stickyTh}>Owner</th>
              
              <th style={{ ...stickyTh, textAlign: "right" }}>MRR</th>
            </tr>
          </thead>

          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={7}

                  style={{
                    fontStyle: "italic",
                    fontSize: 13,
                    color: "var(--text-3)",
                    textAlign: "center",
                    padding: 24,
                  }}
                >
                  No accounts match these filters.
                </td>
              </tr>
            )}
            {filtered.map((a) => {
              const state = accountStepState(a);
              const done = state === "done";
              const variant = resolveVariant(STANDARD_GHL_JOURNEY, a.plan);
              const planTargetDays = variantTargetDays(STANDARD_GHL_JOURNEY, a.plan);
              const planStepCount = variantStepCount(STANDARD_GHL_JOURNEY, a.plan);
              // Recompute pct against the client's plan variant; cap done at 100.
              const variantPct =
                planStepCount > 0
                  ? Math.min(
                      100,
                      Math.round((a.steps_done / planStepCount) * 100),
                    )
                  : a.pct_complete;
              const isMasterPlan = variant.isMaster || variant.id === MASTER_PLAN_ID;
              return (
                <tr
                  key={a.account}
                  style={{ cursor: "pointer" }}
                  onClick={() => onOpenAccount(a)}
                >
                  <td style={{ fontWeight: 500 }}>{a.account}</td>
                  <td>
                    {isMasterPlan ? (
                      <span style={{ fontSize: 12, color: "var(--text-3)" }}>—</span>
                    ) : (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          height: 20,
                          padding: "0 8px",
                          fontSize: 11,
                          fontWeight: 500,
                          color: "var(--text-2)",
                          background: "var(--n-3)",
                          borderRadius: "var(--r-pill)",
                        }}
                      >
                        {variant.name}
                      </span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span
                        className="mono"
                        style={{ fontSize: 12, color: "var(--text-2)", minWidth: 32 }}
                      >
                        {variantPct}%
                      </span>
                      <div
                        style={{
                          width: 64,
                          height: 6,
                          background: "var(--n-3)",
                          borderRadius: "var(--r-pill)",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${variantPct}%`,
                            height: "100%",
                            background: "var(--info-7)",
                          }}
                        />
                      </div>
                    </div>
                  </td>

                  <td>
                    {done ? (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          color: "var(--pos-9)",
                          fontSize: 13,
                          fontWeight: 500,
                        }}
                      >
                        <Check size={14} color="var(--pos-7)" />
                        Complete
                      </span>
                    ) : (
                      <span
                        className={`onb-step ${state}`}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          padding: 0,
                          gap: 8,
                        }}
                      >
                        <span className="onb-dot" style={{ marginTop: 0 }} />
                        <span style={{ fontSize: 13, color: "var(--text)" }}>
                          {a.current_step}
                        </span>
                      </span>
                    )}
                  </td>
                  <td style={{ fontSize: 12, color: "var(--text-2)" }}>
                    {done ? (
                      <span className="mono" style={{ color: "var(--text-3)" }}>—</span>
                    ) : (
                      <>
                        Day{" "}
                        <span
                          className="mono"
                          style={{
                            color: isPastTarget(a, planTargetDays) ? "var(--neg-7)" : "var(--text-2)",
                            fontWeight: isPastTarget(a, planTargetDays) ? 600 : 400,
                          }}
                        >
                          {journeyDay(a)}
                        </span>
                        <span className="mono" style={{ color: "var(--text-3)" }}>
                          {" / "}{planTargetDays}
                        </span>
                      </>
                    )}
                  </td>
                  <td>
                    {a.current_step && a.blocked_by ? (
                      <span
                        className={`blocked-badge ${a.blocked_by === "client" ? "client" : "agency"}`}
                      >
                        {a.blocked_by === "client" ? "Client" : "Agency"}
                      </span>
                    ) : null}
                  </td>
                  <td className="num-cell">${a.mrr}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
