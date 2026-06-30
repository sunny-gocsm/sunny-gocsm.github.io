// DoerPanel — single source of truth for the client setup panel.
//
// Mounted by BOTH /doer-demo (live simulator with dev controls) and the
// Builder's ClientPreview (operator preview with scenario tabs). The
// internal state machine is the ONLY writer of step-card content; wrapper
// surfaces never pass card fragments (no title/body/failure props from
// outside). External controls drive the machine through the imperative
// handle: setScenario / simulateReturn / verifySuccess / verifyFailure /
// simulateCompletion / reset.
//
// Edit this file → both surfaces update.

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  ListPlus,
  PlayCircle,
  X,
} from "lucide-react";
import {
  STANDARD_GHL_JOURNEY,
  type Journey,
  type Step,
  type StepAsset,
} from "@onb/lib/types";
import { getStepContent } from "@onb/lib/step-content";
import { findEntry, type CatalogEntry } from "@onb/lib/state-catalog";
import { getSubSteps, isTrackable } from "@onb/lib/sub-steps";

export type DoerScenario = "live-simulator" | "new" | "mid" | "stuck";
type CurrentState = "in_progress" | "verifying" | "needs_attention" | "approved_flash";

export interface DoerPanelHandle {
  verifySuccess: () => void;
  verifyFailure: () => void;
  simulateCompletion: () => void;
  landOnVerifyingStep: () => void;
  landOnAttentionStep: () => void;
  /** Fire a detector signal on a specific step id — completes regardless of list position. */
  completeStep: (id: string) => void;
  /** Pick the last non-done step that isn't the current hero, then completeStep. */
  completeLaterStep: () => void;
  reset: () => void;
}

export interface DoerPanelProps {
  journey: Journey;
  scenario?: DoerScenario;
  /**
   * DEV State Gallery driver. When set, the panel bypasses its queue/state
   * machine and renders the matching catalog entry as the card — DoerPanel
   * remains the sole writer of card content.
   */
  catalogEntryId?: string;
  brandName?: string;
  accent?: string;
  /** When false the panel renders null but keeps internal state. */
  visible?: boolean;
  /** Show the X in the panel head. */
  showCloseButton?: boolean;
  /** Show the "Show me how" video slide-out (fixed-positioned). */
  enableVideoSlideout?: boolean;
  /** Called when the user requests collapse (X in head, X in celebration,
   *  or the auto-close after the celebration timer). */
  onRequestClose?: () => void;
  /** Latest progress / panel info — wrappers use this to render the
   *  collapsed pill ring or to know when the celebration is done. */
  onProgress?: (info: {
    completedCount: number;
    total: number;
    graduated: boolean;
    panelView: "checklist" | "celebration";
  }) => void;
  containerStyle?: CSSProperties;
  containerClassName?: string;
  /** Hide the "X of Y done" headline — used by build-time previews where a
   *  zero-progress count is a naked number with no value. */
  hideProgressCount?: boolean;
}

// ---------------------------------------------------------------------------
// Live-simulator queue (the original /doer-demo ordering)
// ---------------------------------------------------------------------------
const LIVE_DONE_IDS = ["s01", "s04", "s05", "s09", "s10"] as const;
const LIVE_VERIFYING_ID = "s02"; // A2P brand
const LIVE_ORDER = [
  ...LIVE_DONE_IDS,
  "s02", // verifying (A2P brand)
  "s03",
  "s06", // asset step
  "s07", // asset step
  "s15",
  "s08",
  "s11",
  "s12",
  "s13",
  "s14",
];


type QueueItem = Step & { affix?: string };
type StepStatus = "done" | "verifying" | "needs_attention" | "not_started";
type StepStateMap = Record<string, { status: StepStatus; affix?: string }>;

function buildQueue(journey: Journey, scenario: DoerScenario): QueueItem[] {
  if (scenario === "live-simulator") {
    const byId = new Map(STANDARD_GHL_JOURNEY.steps.map((s) => [s.id, s]));
    return LIVE_ORDER.map((id) => {
      const s = byId.get(id);
      if (!s) throw new Error(`Missing live-simulator step ${id}`);
      return { ...s };
    });
  }
  return [...journey.steps].sort((a, b) => a.order - b.order).map((s) => ({
    ...s,
  }));
}

function seedForScenario(
  items: QueueItem[],
  scenario: DoerScenario,
): { states: StepStateMap; currentState: CurrentState } {
  const states: StepStateMap = {};
  items.forEach((s) => {
    states[s.id] = { status: "not_started" };
  });

  switch (scenario) {
    case "live-simulator": {
      for (const id of LIVE_DONE_IDS) {
        if (states[id]) states[id] = { status: "done", affix: "verified" };
      }
      if (states[LIVE_VERIFYING_ID]) {
        states[LIVE_VERIFYING_ID] = { status: "verifying", affix: "verified" };
      }
      return { states, currentState: "in_progress" };
    }
    case "new":
      return { states, currentState: "in_progress" };
    case "mid": {
      const half = Math.min(items.length, Math.max(1, Math.floor(items.length / 2)));
      items.slice(0, half).forEach((s) => {
        states[s.id] = { status: "done", affix: "verified" };
      });
      return { states, currentState: "in_progress" };
    }
    case "stuck": {
      const half = Math.min(items.length, Math.max(1, Math.floor(items.length / 2)));
      items.slice(0, half).forEach((s) => {
        states[s.id] = { status: "done", affix: "verified" };
      });
      // Mark the first actionable step as needs_attention
      const firstActionable = items.find(
        (s) => states[s.id].status === "not_started",
      );
      if (firstActionable) {
        states[firstActionable.id] = { status: "needs_attention" };
      }
      return { states, currentState: "needs_attention" };
    }
  }
}

const displayTitleFn = (brand: string) => (t: string) =>
  t.replace(/your agency/gi, brand);

function safeStepContent(type: string) {
  try {
    return getStepContent(type as Parameters<typeof getStepContent>[0]);
  } catch {
    return null;
  }
}


// ---------------------------------------------------------------------------

export const DoerPanel = forwardRef<DoerPanelHandle, DoerPanelProps>(
  function DoerPanel(
    {
      journey,
      scenario = "live-simulator",
      catalogEntryId,
      brandName = "Summit Digital",
      accent,
      visible = true,
      showCloseButton = false,
      enableVideoSlideout = false,
      onRequestClose,
      onProgress,
      containerStyle,
      containerClassName,
      hideProgressCount = false,
    },
    ref,
  ) {
    const queue = useMemo(() => buildQueue(journey, scenario), [
      journey,
      scenario,
    ]);
    // `total` and `completedCount` are derived farther down once
    // `assetProgress` and `stepStates` exist (asset-aware totals).

    // ---- state machine (the ONLY writer of step-card content) ----
    const initial = useMemo(() => seedForScenario(queue, scenario), [
      queue,
      scenario,
    ]);

    const [stepStates, setStepStates] = useState<StepStateMap>(initial.states);
    const [currentState, setCurrentState] = useState<CurrentState>(
      initial.currentState,
    );
    const [assetProgress, setAssetProgress] = useState<
      Record<string, boolean[]>
    >({});
    const [lastAdvancedId, setLastAdvancedId] = useState<string | null>(
      scenario === "live-simulator" ? LIVE_VERIFYING_ID : null,
    );
    const [flashingId, setFlashingId] = useState<string | null>(null);
    // Brief sub-step micro-celebration. Key shape: `${parentId}#${assetIndex}`.
    const [flashingSubKey, setFlashingSubKey] = useState<string | null>(null);
    // Per-sub-step inline video toggle.
    const [openSubVideoKey, setOpenSubVideoKey] = useState<string | null>(null);

    const [panelView, setPanelView] = useState<"checklist" | "celebration">(
      "checklist",
    );
    const [graduated, setGraduated] = useState(false);
    const [celebrationShown, setCelebrationShown] = useState(false);
    const [doneOpen, setDoneOpen] = useState(false);
    const [moreOpen, setMoreOpen] = useState(false);
    const [previewStepId, setPreviewStepId] = useState<string | null>(null);
    const [previewVideoOpen, setPreviewVideoOpen] = useState(false);
    const [activeStepId, setActiveStepId] = useState<string | null>(null);

    const [videoOpen, setVideoOpen] = useState(false);
    const [recheckOpenId, setRecheckOpenId] = useState<string | null>(null);
    const [recheckingId, setRecheckingId] = useState<string | null>(null);
    const [reportOpen, setReportOpen] = useState(false);
    const [reportText, setReportText] = useState("");
    const [reportSubmitted, setReportSubmitted] = useState(false);

    const celebrationTimerRef = useRef<number | null>(null);

    // Re-seed when the scenario (or journey identity) changes.
    const lastSeedKeyRef = useRef<string>("");
    useEffect(() => {
      const key = `${scenario}::${journey.id}::${journey.steps.length}`;
      if (lastSeedKeyRef.current === key) return;
      lastSeedKeyRef.current = key;
      const seed = seedForScenario(queue, scenario);
      setStepStates(seed.states);
      setCurrentState(seed.currentState);
      setAssetProgress({});
      setLastAdvancedId(scenario === "live-simulator" ? LIVE_VERIFYING_ID : null);
      setFlashingId(null);
      setPanelView("checklist");
      setGraduated(false);
      setCelebrationShown(false);
      setDoneOpen(false);
      setMoreOpen(false);
      setPreviewStepId(null);
      setPreviewVideoOpen(false);
      setRecheckOpenId(null);
      setRecheckingId(null);
      setReportOpen(false);
      setReportText("");
      setReportSubmitted(false);
      if (celebrationTimerRef.current != null) {
        window.clearTimeout(celebrationTimerRef.current);
        celebrationTimerRef.current = null;
      }
    }, [scenario, journey.id, journey.steps.length, queue]);

    // ---- derived: dependency-aware buckets ----
    const doneIds = useMemo(() => {
      const s = new Set<string>();
      for (const id in stepStates) if (stepStates[id].status === "done") s.add(id);
      return s;
    }, [stepStates]);

    // Carrier-chain "comes next" waits only:
    //   • a2p_campaign is unavailable until a2p_brand is done
    //   • a2p_brand is unavailable until phone_purchase is done
    const isLocked = (step: QueueItem) => {
      if (step.type === "a2p_campaign") {
        const brand = queue.find((q) => q.type === "a2p_brand");
        return !!brand && stepStates[brand.id]?.status !== "done";
      }
      if (step.type === "a2p_brand") {
        const phone = queue.find((q) => q.type === "phone_purchase");
        return !!phone && stepStates[phone.id]?.status !== "done";
      }
      return false;
    };

    const actionableQueue = useMemo(
      () =>
        queue.filter((s) => {
          const st = stepStates[s.id]?.status;
          if (st !== "not_started" && st !== "needs_attention") return false;
          return !isLocked(s);
        }),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [queue, stepStates],
    );

    const verifyingList = useMemo(
      () => queue.filter((s) => stepStates[s.id]?.status === "verifying"),
      [queue, stepStates],
    );

    const lockedList = useMemo(
      () =>
        queue.filter((s) => {
          const st = stepStates[s.id]?.status;
          if (st === "done") return false;
          return isLocked(s);
        }),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [queue, stepStates],
    );

    // Resolve the effective per-asset done states for an asset-parent.
    // Priority: in-session `assetProgress`, then seeded asset.done / state,
    // then "all true" if the parent's step status is `done` (legacy seed).
    const assetStatesFor = useCallback(
      (s: QueueItem): boolean[] => {
        if (!s.assets || s.assets.length === 0) return [];
        const inSession = assetProgress[s.id];
        if (inSession && inSession.length === s.assets.length) return inSession;
        if (stepStates[s.id]?.status === "done") return s.assets.map(() => true);
        return s.assets.map((a) => !!a.done || a.state === "done" || a.state === "skipped");
      },
      [assetProgress, stepStates],
    );

    // Per-parent failure surface: a single asset in `needs_attention` lifts
    // the parent to "needs_attention" while leaving other assets' done state
    // intact. Reads from seeded `asset.state`; in-session edits clear it.
    const hasFailedAssetFor = useCallback(
      (s: QueueItem): boolean => {
        if (!s.assets || s.assets.length === 0) return false;
        if (assetProgress[s.id]) return false;
        return s.assets.some((a) => a.state === "needs_attention");
      },
      [assetProgress],
    );
    void hasFailedAssetFor;


    // Aggregate "N of M" for an asset-parent (null when no assets). Counts
    // only TRACKABLE sub-steps (guidance_only sub-steps don't count).
    const aggregateFor = useCallback(
      (s: QueueItem): { done: number; total: number } | null => {
        if (!s.assets || s.assets.length === 0) return null;
        const subs = getSubSteps(s);
        const trackableFlags = subs.map(isTrackable);
        const states = assetStatesFor(s);
        let done = 0;
        let total = 0;
        for (let i = 0; i < states.length; i++) {
          if (!trackableFlags[i]) continue;
          total += 1;
          if (states[i]) done += 1;
        }
        return { done, total };
      },
      [assetStatesFor],
    );

    // Asset-aware header totals — sums trackable sub-steps across the journey.
    // Each asset-parent contributes its TRACKABLE asset count; non-asset
    // steps contribute exactly 1 (matches `countTrackable` in sub-steps.ts).
    const { total, completedCount } = useMemo(() => {
      let t = 0;
      let d = 0;
      for (const s of queue) {
        if (s.assets && s.assets.length > 0) {
          const agg = aggregateFor(s);
          if (agg && agg.total > 0) {
            t += agg.total;
            d += agg.done;
            continue;
          }
        }
        t += 1;
        if (stepStates[s.id]?.status === "done") d += 1;
      }
      return { total: t, completedCount: d };
    }, [queue, stepStates, aggregateFor]);

    // Count of fully-completed parent rows — what the "Done (N) ✓" group
    // header in the focused list shows (rows, not assets).
    const doneStepsCount = doneIds.size;

    // Notify wrappers of progress for the pill ring etc.
    useEffect(() => {
      onProgress?.({ completedCount, total, graduated, panelView });
    }, [completedCount, total, graduated, panelView, onProgress]);

    // Clear an actionable override when its step leaves the actionable set
    // (completed, locked, etc.). Done-state overrides are preserved for review.
    useEffect(() => {
      if (
        activeStepId &&
        !actionableQueue.some((s) => s.id === activeStepId) &&
        !doneIds.has(activeStepId)
      ) {
        setActiveStepId(null);
      }
    }, [actionableQueue, activeStepId, doneIds]);

    // Auto-graduate when everything is done.
    useEffect(() => {
      if (completedCount === total && total > 0 && !celebrationShown) {
        setGraduated(true);
      }
    }, [completedCount, total, celebrationShown]);

    function clearCelebrationTimer() {
      if (celebrationTimerRef.current != null) {
        window.clearTimeout(celebrationTimerRef.current);
        celebrationTimerRef.current = null;
      }
    }

    function resetTransientUI() {
      setRecheckOpenId(null);
      setRecheckingId(null);
      setReportOpen(false);
      setReportText("");
      setReportSubmitted(false);
    }

    function pickVerifyTarget(): string | null {
      if (lastAdvancedId && stepStates[lastAdvancedId]?.status === "verifying") {
        return lastAdvancedId;
      }
      if (verifyingList.length > 0) return verifyingList[0].id;
      // Fall back to the current actionable step (demo: instant-complete it).
      return actionableQueue[0]?.id ?? null;
    }

    function setStatus(id: string, status: StepStatus, affix?: string) {
      setStepStates((prev) => ({
        ...prev,
        [id]: { status, affix: affix ?? prev[id]?.affix },
      }));
    }

    function verifySuccess() {
      const id = pickVerifyTarget();
      if (!id) return;
      setFlashingId(id);
      window.setTimeout(() => {
        setStatus(id, "done", "verified");
        setFlashingId(null);
        setLastAdvancedId(null);
        resetTransientUI();
      }, 700);
    }

    function verifyFailure() {
      const id = pickVerifyTarget();
      if (!id) return;
      setStatus(id, "needs_attention");
      setCurrentState("needs_attention");
    }

    function resubmitCurrentStep(id: string) {
      setStatus(id, "verifying", "verified");
      setLastAdvancedId(id);
      setFlashingId(null);
      resetTransientUI();
    }

    function simulateCompletion() {
      setStepStates((prev) => {
        const next: StepStateMap = { ...prev };
        for (const s of queue) {
          next[s.id] = { status: "done", affix: prev[s.id]?.affix ?? "verified" };
        }
        return next;
      });
      setAssetProgress(() => {
        const out: Record<string, boolean[]> = {};
        queue.forEach((s) => {
          if (s.assets && s.assets.length > 0) {
            out[s.id] = s.assets.map(() => true);
          }
        });
        return out;
      });

      const reduce =
        typeof window !== "undefined" &&
        window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      const wait = reduce ? 0 : 360;

      window.setTimeout(() => {
        if (!celebrationShown) {
          setPanelView("celebration");
          setGraduated(true);
          setCelebrationShown(true);
          clearCelebrationTimer();
          celebrationTimerRef.current = window.setTimeout(() => {
            setPanelView("checklist");
            celebrationTimerRef.current = null;
            onRequestClose?.();
          }, 4000);
        } else {
          setGraduated(true);
        }
      }, wait);
    }

    function reset() {
      clearCelebrationTimer();
      const seed = seedForScenario(queue, scenario);
      setStepStates(seed.states);
      setCurrentState(seed.currentState);
      setAssetProgress({});
      setLastAdvancedId(scenario === "live-simulator" ? LIVE_VERIFYING_ID : null);
      setFlashingId(null);
      setPanelView("checklist");
      setGraduated(false);
      setCelebrationShown(false);
      setVideoOpen(false);
      resetTransientUI();
    }

    function landOnVerifyingStep() {
      clearCelebrationTimer();
      const target = queue.find(
        (s) => !(s.assets && s.assets.length > 0) && !!safeStepContent(s.type)?.verifyingStrip,
      ) ?? queue[0];
      if (!target) return;
      const next: StepStateMap = {};
      let hit = false;
      for (const s of queue) {
        if (s.id === target.id) {
          next[s.id] = { status: "verifying", affix: "verified" };
          hit = true;
        } else if (!hit) {
          next[s.id] = { status: "done", affix: "verified" };
        } else {
          next[s.id] = { status: "not_started" };
        }
      }
      setStepStates(next);
      setCurrentState("in_progress");
      setAssetProgress({});
      setLastAdvancedId(target.id);
      setFlashingId(null);
      setPanelView("checklist");
      setGraduated(false);
      resetTransientUI();
    }

    function landOnAttentionStep() {
      clearCelebrationTimer();
      const target = queue.find(
        (s) => !(s.assets && s.assets.length > 0) && !!safeStepContent(s.type)?.failure,
      ) ?? queue[0];
      if (!target) return;
      const next: StepStateMap = {};
      let hit = false;
      for (const s of queue) {
        if (s.id === target.id) {
          next[s.id] = { status: "needs_attention" };
          hit = true;
        } else if (!hit) {
          next[s.id] = { status: "done", affix: "verified" };
        } else {
          next[s.id] = { status: "not_started" };
        }
      }
      setStepStates(next);
      setCurrentState("needs_attention");
      setAssetProgress({});
      setLastAdvancedId(null);
      setFlashingId(null);
      setPanelView("checklist");
      setGraduated(false);
      resetTransientUI();
    }

    function startRecheck(id: string) {
      setRecheckOpenId(null);
      setRecheckingId(id);
      window.setTimeout(() => {
        setRecheckingId(null);
        setLastAdvancedId(id);
        setFlashingId(id);
        window.setTimeout(() => {
          setStatus(id, "done", "verified");
          setFlashingId(null);
          setLastAdvancedId(null);
        }, 500);
      }, 1200);
    }
    function submitReport() {
      setReportSubmitted(true);
      setReportOpen(false);
    }

    function completeStep(id: string) {
      if (!queue.some((s) => s.id === id)) return;
      if (stepStates[id]?.status === "done") return;
      setFlashingId(id);
      setLastAdvancedId(id);
      const step = queue.find((s) => s.id === id);
      if (step?.assets && step.assets.length > 0) {
        setAssetProgress((prev) => ({
          ...prev,
          [id]: step.assets!.map(() => true),
        }));
      }
      window.setTimeout(() => {
        setStatus(id, "done", "verified");
        setFlashingId(null);
        setLastAdvancedId((prev) => (prev === id ? null : prev));
      }, 700);
    }

    // Complete a single asset sub-step under an asset-parent. Brief flash on
    // the sub-step; when all assets become done the parent auto-completes
    // with its own micro-celebration (matches `completeStep`).
    function completeSubStep(parentId: string, idx: number) {
      const step = queue.find((s) => s.id === parentId);
      if (!step?.assets || idx < 0 || idx >= step.assets.length) return;
      if (stepStates[parentId]?.status === "done") return;
      const subKey = `${parentId}#${idx}`;
      setFlashingSubKey(subKey);
      window.setTimeout(() => {
        let allDoneNow = false;
        setAssetProgress((prev) => {
          const seeded = step.assets!.map((a) => !!a.done);
          const base =
            prev[parentId] && prev[parentId].length === step.assets!.length
              ? prev[parentId]
              : seeded;
          const nextStates = base.slice();
          nextStates[idx] = true;
          allDoneNow = nextStates.every(Boolean);
          return { ...prev, [parentId]: nextStates };
        });
        setFlashingSubKey((cur) => (cur === subKey ? null : cur));
        if (allDoneNow) {
          // Auto-complete the parent — re-uses the parent flash + status set.
          completeStep(parentId);
        }
      }, 500);
    }

    function completeLaterStep() {
      const heroId = actionableQueue[0]?.id;
      // Walk queue in reverse, pick the last non-done step that isn't the current hero.
      for (let i = queue.length - 1; i >= 0; i--) {
        const s = queue[i];
        if (stepStates[s.id]?.status === "done") continue;
        if (s.id === heroId) continue;
        completeStep(s.id);
        return;
      }
    }

    useImperativeHandle(
      ref,
      () => ({
        verifySuccess,
        verifyFailure,
        simulateCompletion,
        landOnVerifyingStep,
        landOnAttentionStep,
        completeStep,
        completeLaterStep,
        reset,
      }),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [queue, stepStates, assetProgress, celebrationShown, scenario, lastAdvancedId, verifyingList, actionableQueue],
    );


    if (!visible) return null;

    const scopeStyleBase: CSSProperties = {
      ...(accent ? ({ ["--client-accent" as string]: accent } as CSSProperties) : {}),
      ...containerStyle,
    };

    // -------- catalog (DEV State Gallery) view --------
    // When catalogEntryId is set, DoerPanel renders the matching catalog
    // entry as the card. The queue/state machine is bypassed; the panel
    // remains the sole renderer (no parallel mock-card components exist).
    if (catalogEntryId) {
      const entry = findEntry(catalogEntryId);
      return (
        <div
          className={containerClassName ?? "doer-panel"}
          role="dialog"
          aria-label="Setup"
          style={scopeStyleBase}
        >
          <CatalogHead
            brandName={brandName}
            showCloseButton={showCloseButton}
            onRequestClose={onRequestClose}
          />
          {entry ? (
            <CatalogCard entry={entry} brandName={brandName} />
          ) : (
            <div
              style={{
                marginTop: 8,
                padding: 24,
                border: "1px dashed var(--border)",
                borderRadius: "var(--r-md)",
                textAlign: "center",
                fontSize: 13,
                color: "var(--text-2)",
              }}
            >
              Catalog entry “{catalogEntryId}” not found.
            </div>
          )}
        </div>
      );
    }

    const displayTitle = displayTitleFn(brandName);

    const isReviewing =
      activeStepId != null &&
      doneIds.has(activeStepId) &&
      !actionableQueue.some((s) => s.id === activeStepId);
    const overrideActionable =
      !isReviewing && activeStepId && actionableQueue.some((s) => s.id === activeStepId)
        ? activeStepId
        : null;
    const currentId = overrideActionable ?? actionableQueue[0]?.id;
    const current: QueueItem | undefined = currentId
      ? queue.find((q) => q.id === currentId)
      : undefined;
    const reviewStep: QueueItem | undefined = isReviewing
      ? queue.find((q) => q.id === activeStepId!)
      : undefined;
    const reviewContent = reviewStep
      ? (() => {
          try {
            return getStepContent(reviewStep.type);
          } catch {
            return null;
          }
        })()
      : null;
    const currentStatus = current ? stepStates[current.id]?.status : undefined;
    // Show approved_flash if the current step is flashing; otherwise mirror its status.
    const currentCardState: CurrentState =
      current && flashingId === current.id
        ? "approved_flash"
        : currentStatus === "needs_attention"
          ? "needs_attention"
          : "in_progress";

    const currentAssets = current?.assets;
    const currentAssetState = currentAssets
      ? assetProgress[current!.id] ?? currentAssets.map(() => false)
      : null;
    const currentAssetDone = currentAssetState
      ? currentAssetState.filter(Boolean).length
      : 0;
    const hasAssetsNow = !!currentAssets && currentAssets.length > 0;


    const scopeStyle: CSSProperties = scopeStyleBase;

    // -------- celebration view --------
    if (panelView === "celebration") {
      return (
        <div
          className={containerClassName ?? "doer-panel"}
          role="dialog"
          aria-label="Setup complete"
          style={scopeStyle}
        >
          <div
            style={{ display: "flex", justifyContent: "flex-end", marginBottom: 4 }}
          >
            <button
              type="button"
              aria-label="Close"
              onClick={() => {
                clearCelebrationTimer();
                setPanelView("checklist");
                onRequestClose?.();
              }}
              style={{
                all: "unset",
                width: 28,
                height: 28,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "var(--r-sm)",
                cursor: "pointer",
                color: "var(--text-2)",
              }}
            >
              <X size={16} aria-hidden />
            </button>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              padding: "8px 8px 16px",
              gap: 12,
            }}
          >
            <div
              aria-hidden
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: "color-mix(in oklab, var(--pos-7) 14%, transparent)",
                color: "var(--pos-7)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Check size={28} />
            </div>
            <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text)" }}>
              You're all set up!
            </div>
            <p
              style={{
                fontSize: 13,
                color: "var(--text-2)",
                lineHeight: 1.5,
                margin: 0,
                maxWidth: 280,
              }}
            >
              Your first leads will land straight in your pipeline — {brandName} will
              take it from here.
            </p>
            <button
              type="button"
              onClick={() => {
                clearCelebrationTimer();
                setPanelView("checklist");
              }}
              style={{
                all: "unset",
                marginTop: 4,
                fontSize: 12,
                color: "var(--text-2)",
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              View checklist
            </button>
          </div>
        </div>
      );
    }

    // -------- checklist view --------
    // Outer card caps its height so it never stretches to fill the viewport;
    // head stays pinned and the list area scrolls when groups expand.
    const isInlinePreview =
      (containerStyle as CSSProperties | undefined)?.position === "relative";
    const panelStyle: CSSProperties = {
      ...scopeStyle,
      ...(isInlinePreview
        ? null
        : {
            display: "flex",
            flexDirection: "column",
            maxHeight: "min(80vh, calc(100vh - 40px))",
          }),
    };
    return (
      <>
        <div
          className={containerClassName ?? "doer-panel"}
          role="dialog"
          aria-label="Setup"
          style={panelStyle}
        >
          {/* HEAD — pinned; never scrolls with the list */}
          <div className="doer-head" style={{ flexShrink: 0 }}>
            <span className="doer-logo" aria-hidden>
              {brandName
                .split(" ")
                .map((w) => w[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </span>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--text)",
                  lineHeight: 1.2,
                }}
              >
                {brandName}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-2)", marginTop: 2 }}>
                Your setup checklist
              </div>
            </div>
            {showCloseButton && (
              <button
                type="button"
                aria-label="Close setup"
                onClick={() => onRequestClose?.()}
                style={{
                  all: "unset",
                  width: 28,
                  height: 28,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "var(--r-sm)",
                  cursor: "pointer",
                  color: "var(--text-2)",
                }}
              >
                <X size={16} aria-hidden />
              </button>
            )}
          </div>

          {/* SCROLL AREA — list scrolls internally when content exceeds max-height */}
          <div
            style={{
              flex: isInlinePreview ? "0 0 auto" : "1 1 auto",
              minHeight: 0,
              overflowY: isInlinePreview ? "visible" : "auto",
              marginRight: isInlinePreview ? 0 : -4,
              paddingRight: isInlinePreview ? 0 : 4,
            }}
          >


          {total === 0 ? (
            <div
              style={{
                marginTop: 8,
                padding: 24,
                border: "1px dashed var(--border)",
                borderRadius: "var(--r-md)",
                textAlign: "center",
                fontSize: 13,
                color: "var(--text-2)",
              }}
            >
              No steps yet — add a step to preview.
            </div>
          ) : (
            <>
              {/* CHECKLIST PROGRESS HEADER — title is in .doer-head above;
                  here we render a thin accent progress bar + plain count. */}
              <div style={{ marginTop: 12, marginBottom: 16 }}>
                <div
                  role="progressbar"
                  aria-label="Setup progress"
                  aria-valuemin={0}
                  aria-valuemax={total}
                  aria-valuenow={completedCount}
                  style={{
                    height: 4,
                    width: "100%",
                    background: "var(--n-3)",
                    borderRadius: 999,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${total > 0 ? (completedCount / total) * 100 : 0}%`,
                      background: "var(--client-accent, var(--accent-7))",
                      borderRadius: 999,
                      transition: "width var(--d-base) ease-out",
                    }}
                  />
                </div>
                {!hideProgressCount && (
                  <div style={{ marginTop: 8, fontSize: 12, color: "var(--text-2)" }}>
                    <span className="mono">{completedCount}</span> of{" "}
                    <span className="mono">{total}</span> done
                  </div>
                )}
              </div>

              {/* DONE (N) ✓ — collapsed by default at the top; expands to show
                  completed step titles. Tap a title to review its done state. */}
              {doneStepsCount > 0 && (
                <div style={{ marginBottom: 12, borderBottom: "1px solid var(--border-soft)" }}>
                  <button
                    type="button"
                    onClick={() => setDoneOpen((v) => !v)}
                    aria-expanded={doneOpen}
                    aria-controls="doer-done-list"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "var(--bg-hover)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                    style={{
                      all: "unset",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      width: "100%",
                      boxSizing: "border-box",
                      padding: "10px 10px",
                      borderRadius: "var(--r-sm)",
                      transition: "background var(--d-base) ease-out",
                    }}
                  >
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        fontSize: 13,
                        color: "var(--text)",
                      }}
                    >
                      <Check size={14} aria-hidden style={{ color: "var(--pos-7)" }} />
                      Done (<span className="mono">{doneStepsCount}</span>)
                    </span>
                    <ChevronDown
                      size={14}
                      aria-hidden
                      style={{
                        color: "var(--text-2)",
                        transform: doneOpen ? "rotate(0deg)" : "rotate(-90deg)",
                        transition: "transform var(--d-base) ease-out",
                      }}
                    />
                  </button>
                  {doneOpen && (
                    <ul
                      id="doer-done-list"
                      style={{
                        listStyle: "none",
                        margin: 0,
                        padding: "4px 2px 8px",
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                      }}
                    >
                      {queue.filter((s) => doneIds.has(s.id)).map((s) => (
                        <li key={s.id} style={{ margin: 0 }}>
                          <button
                            type="button"
                            onClick={() => setActiveStepId(s.id)}
                            aria-label={`Review “${displayTitle(s.title)}”`}
                            aria-pressed={activeStepId === s.id}
                            style={{
                              all: "unset",
                              cursor: "pointer",
                              boxSizing: "border-box",
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              width: "100%",
                              padding: "4px 6px",
                              borderRadius: "var(--r-sm)",
                              fontSize: 13,
                              lineHeight: 1.45,
                              color: "var(--text-2)",
                              background:
                                activeStepId === s.id ? "var(--bg-hover)" : "transparent",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = "var(--bg-hover)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background =
                                activeStepId === s.id ? "var(--bg-hover)" : "transparent";
                            }}
                          >
                            <Check
                              size={14}
                              aria-hidden
                              style={{ color: "var(--pos-7)", flexShrink: 0 }}
                            />
                            <span>{displayTitle(s.title)}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* CURRENT STEP CARD — surfaced step is the next ACTIONABLE one
                  (status != verifying|locked|done). When nothing is actionable
                  but checks are pending, render a calm placeholder. */}
              {reviewStep ? (
                <div
                  style={{
                    border: "1px solid var(--border-soft)",
                    borderRadius: 10,
                    padding: 14,
                    marginBottom: 16,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <Check size={16} aria-hidden style={{ color: "var(--pos-7)", flex: "none" }} />
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", flex: 1, minWidth: 0 }}>
                      {displayTitle(reviewStep.title)}
                    </div>
                    <span style={{ fontSize: 11, color: "var(--text-3)" }}>Done</span>
                  </div>
                  {reviewContent?.body && (
                    <p
                      style={{
                        fontSize: 13,
                        color: "var(--text-2)",
                        lineHeight: 1.5,
                        margin: "0 0 10px",
                      }}
                    >
                      {reviewContent.body.replace(/Summit Digital/g, brandName)}
                    </p>
                  )}
                  <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                    {reviewStep.deepLink && (
                      <button
                        type="button"
                        style={{
                          all: "unset",
                          cursor: "pointer",
                          height: 32,
                          padding: "0 12px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          borderRadius: "var(--r-sm)",
                          fontSize: 13,
                          fontWeight: 500,
                          color: "var(--client-accent-ink)",
                          background: "var(--client-accent)",
                        }}
                      >
                        Take me there <ArrowRight size={14} aria-hidden />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setActiveStepId(null)}
                      style={{
                        all: "unset",
                        cursor: "pointer",
                        fontSize: 12,
                        color: "var(--text-2)",
                        textDecoration: "underline",
                      }}
                    >
                      Back to current step
                    </button>
                  </div>
                </div>
              ) : current ? (
                <>
                  {currentCardState === "needs_attention" ? (
                    <div
                      style={{
                        fontSize: 11,
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                        color: "var(--onb-needs-attention)",
                        marginBottom: 6,
                        padding: "0 2px",
                      }}
                    >
                      One thing needs your attention
                    </div>
                  ) : verifyingList.length > 0 ? (
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--text-3)",
                        marginBottom: 6,
                        padding: "0 2px",
                        lineHeight: 1.45,
                      }}
                    >
                      While we check {verifyingList.length} thing
                      {verifyingList.length === 1 ? "" : "s"} in the background,
                      let's set up:
                    </div>
                  ) : null}
                  {renderCurrentStepCard({
                    step: current,
                    state: currentCardState,
                    hasAssets: hasAssetsNow,
                    assets: currentAssets,
                    assetState: currentAssetState,
                    assetDone: currentAssetDone,
                    dotBg:
                      hasAssetsNow
                        ? "var(--client-accent)"
                        : currentCardState === "needs_attention"
                          ? "var(--onb-needs-attention)"
                          : currentCardState === "approved_flash"
                            ? "var(--pos-7)"
                            : "var(--client-accent)",
                    displayTitle,
                    videoOpen,
                    setVideoOpen,
                    rechecking: false,
                    reportOpen,
                    setReportOpen,
                    reportText,
                    setReportText,
                    reportSubmitted,
                    submitReport,
                    onResubmit: () => resubmitCurrentStep(current.id),
                    brandName,
                  })}
                </>
              ) : verifyingList.length > 0 ? (
                <div
                  style={{
                    border: "1px solid var(--border-soft)",
                    borderRadius: 10,
                    padding: 14,
                    marginBottom: 16,
                  }}
                >
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 6 }}>
                    Nothing for you right now
                  </div>
                  <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.5, margin: 0 }}>
                    We're waiting on {verifyingList.length} check
                    {verifyingList.length === 1 ? "" : "s"} to come back. Sit tight —
                    you'll get a nudge when there's something to do.
                  </p>
                </div>
              ) : null}


              {/* YOUR STEPS — every other actionable step in one flat list (no ordering implied). */}
              {(() => {
                const upNext = actionableQueue.filter((s) => s.id !== currentId);
                if (upNext.length === 0 && lockedList.length === 0 && verifyingList.length === 0 && current) {
                  return (
                    <div style={{ fontSize: 12, color: "var(--text-3)", padding: "6px 2px 4px" }}>
                      You're on the last step.
                    </div>
                  );
                }
                if (upNext.length === 0) return null;
                const flashingInGroup = upNext.some((s) => s.id === flashingId);
                const open = moreOpen || flashingInGroup;
                return (
                  <div style={{ marginTop: 8, borderTop: "1px solid var(--border-soft)" }}>
                    <button
                      type="button"
                      onClick={() =>
                        setMoreOpen((v) => {
                          const next = !v;
                          if (!next) {
                            setPreviewStepId(null);
                            setPreviewVideoOpen(false);
                          }
                          return next;
                        })
                      }
                      aria-expanded={open}
                      aria-controls="doer-more-list"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "var(--bg-hover)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                      }}
                      style={{
                        all: "unset",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        width: "100%",
                        boxSizing: "border-box",
                        padding: "10px 10px",
                        borderRadius: "var(--r-sm)",
                        transition: "background var(--d-base) ease-out",
                      }}
                    >
                      <span style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 8,
                            fontSize: 13,
                            color: "var(--text)",
                          }}
                        >
                          <ListPlus size={14} aria-hidden style={{ color: "var(--text-3)" }} />
                          More steps (<span className="mono">{upNext.length}</span>)
                        </span>
                        {!open && (
                          <span style={{ fontSize: 12, color: "var(--text-3)", lineHeight: 1.4 }}>
                            Things you can do anytime — tap to see
                          </span>
                        )}
                      </span>
                      <ChevronDown
                        size={14}
                        aria-hidden
                        style={{
                          color: "var(--text-2)",
                          flexShrink: 0,
                          transform: open ? "rotate(0deg)" : "rotate(-90deg)",
                          transition: "transform var(--d-base) ease-out",
                        }}
                      />
                    </button>
                    {open && (
                      <ul
                        id="doer-more-list"
                        style={{
                          listStyle: "none",
                          margin: 0,
                          padding: "4px 2px 8px",
                          display: "flex",
                          flexDirection: "column",
                          gap: 4,
                        }}
                      >
                        {upNext.map((s) => {
                          const isFlashing = flashingId === s.id;
                          const isExpanded = previewStepId === s.id;
                          const panelId = `doer-more-panel-${s.id}`;
                          const sContent = (() => {
                            try {
                              return getStepContent(s.type);
                            } catch {
                              return null;
                            }
                          })();
                          const sIsAgency = s.owner === "agency";
                          const sPrimaryCta = sContent?.primaryCta ?? "Take me there";
                          const sBody = sContent?.body ?? "Tap below to get started.";
                          const agg = aggregateFor(s);
                          const hasAssets = agg !== null;
                          const assetStates = hasAssets ? assetStatesFor(s) : [];
                          return (
                            <li key={s.id}>
                              <button
                                type="button"
                                onClick={() => {
                                  setPreviewStepId((prev) => (prev === s.id ? null : s.id));
                                  setPreviewVideoOpen(false);
                                  setOpenSubVideoKey(null);
                                }}
                                aria-expanded={isExpanded}
                                aria-controls={panelId}
                                aria-label={`${isExpanded ? "Collapse" : "Expand"} “${displayTitle(s.title)}”`}
                                style={{
                                  all: "unset",
                                  cursor: "pointer",
                                  boxSizing: "border-box",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  gap: 8,
                                  width: "100%",
                                  padding: "8px 10px",
                                  fontSize: 13,
                                  lineHeight: 1.45,
                                  color: "var(--text)",
                                  borderRadius: "var(--r-sm)",
                                  border: isFlashing
                                    ? "1px solid var(--client-accent)"
                                    : "1px solid var(--border-soft)",
                                  background: isFlashing
                                    ? "color-mix(in oklab, var(--client-accent) 10%, var(--surface))"
                                    : "var(--surface)",
                                  boxShadow: isFlashing
                                    ? "0 0 0 3px color-mix(in oklab, var(--client-accent) 22%, transparent)"
                                    : "none",
                                  transition: "background var(--d-base) var(--ease), box-shadow var(--d-base) var(--ease), border-color var(--d-base) var(--ease)",
                                }}
                                onMouseEnter={(e) => {
                                  if (!isFlashing) e.currentTarget.style.background = "var(--bg-hover)";
                                }}
                                onMouseLeave={(e) => {
                                  if (!isFlashing) e.currentTarget.style.background = "var(--surface)";
                                }}
                              >
                                <span
                                  style={{
                                    minWidth: 0,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                    flex: 1,
                                  }}
                                >
                                  {displayTitle(s.title)}
                                </span>
                                {hasAssets && (
                                  <span
                                    aria-label={`${agg!.done} of ${agg!.total} activated`}
                                    style={{
                                      flex: "none",
                                      fontSize: 12,
                                      color: "var(--text-3)",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: 4,
                                    }}
                                  >
                                    <span className="mono">{agg!.done}</span>
                                    {" of "}
                                    <span className="mono">{agg!.total}</span>
                                    <Check
                                      size={12}
                                      aria-hidden
                                      style={{
                                        color:
                                          agg!.done === agg!.total
                                            ? "var(--pos-7)"
                                            : "var(--text-3)",
                                      }}
                                    />
                                  </span>
                                )}
                                {isExpanded ? (
                                  <ChevronDown
                                    size={14}
                                    aria-hidden
                                    style={{ color: "var(--text-3)", flex: "none" }}
                                  />
                                ) : (
                                  <ChevronRight
                                    size={14}
                                    aria-hidden
                                    style={{ color: "var(--text-3)", flex: "none" }}
                                  />
                                )}
                              </button>
                              {isExpanded && (
                                <div
                                  id={panelId}
                                  style={{
                                    marginTop: 8,
                                    padding: 12,
                                    background: "var(--surface-2)",
                                    border: "1px solid var(--border-soft)",
                                    borderRadius: "var(--r-sm)",
                                  }}
                                >
                                  {hasAssets ? (
                                    // Asset-parent: render each asset as a
                                    // mini current-step card. The parent itself
                                    // shows no body/CTA — its job is the row
                                    // label + aggregate; sub-steps own action.
                                    <>
                                      <p
                                        style={{
                                          margin: "0 0 10px 0",
                                          fontSize: 12,
                                          color: "var(--text-3)",
                                          lineHeight: 1.45,
                                        }}
                                      >
                                        <span className="mono">{agg!.done}</span>{" of "}
                                        <span className="mono">{agg!.total}</span>{" activated. Tap an item to set it up."}
                                      </p>
                                      <ul
                                        style={{
                                          listStyle: "none",
                                          margin: 0,
                                          padding: 0,
                                          display: "flex",
                                          flexDirection: "column",
                                          gap: 8,
                                        }}
                                      >
                                        {s.assets!.map((a, i) => {
                                          const subKey = `${s.id}#${i}`;
                                          const subDone = !!assetStates[i];
                                          const subFlashing = flashingSubKey === subKey;
                                          const subVideoOpen = openSubVideoKey === subKey;
                                          return (
                                            <li
                                              key={subKey}
                                              style={{
                                                padding: 10,
                                                background: "var(--surface)",
                                                border: subFlashing
                                                  ? "1px solid var(--client-accent)"
                                                  : "1px solid var(--border-soft)",
                                                borderRadius: "var(--r-sm)",
                                                boxShadow: subFlashing
                                                  ? "0 0 0 3px color-mix(in oklab, var(--client-accent) 22%, transparent)"
                                                  : "none",
                                                transition:
                                                  "background var(--d-base) var(--ease), box-shadow var(--d-base) var(--ease), border-color var(--d-base) var(--ease)",
                                              }}
                                            >
                                              <div
                                                style={{
                                                  display: "flex",
                                                  alignItems: "center",
                                                  gap: 10,
                                                }}
                                              >
                                                <span
                                                  aria-hidden
                                                  style={{
                                                    width: 16,
                                                    height: 16,
                                                    borderRadius: "50%",
                                                    border: subDone
                                                      ? "none"
                                                      : "1.5px solid var(--border)",
                                                    background: subDone
                                                      ? "var(--client-accent)"
                                                      : "transparent",
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    flexShrink: 0,
                                                  }}
                                                >
                                                  {subDone && (
                                                    <Check
                                                      size={11}
                                                      color="white"
                                                      strokeWidth={3}
                                                    />
                                                  )}
                                                </span>
                                                <span
                                                  style={{
                                                    fontSize: 13,
                                                    fontWeight: 600,
                                                    color: subDone
                                                      ? "var(--text-3)"
                                                      : "var(--text)",
                                                    lineHeight: 1.4,
                                                  }}
                                                >
                                                  {a.name}
                                                </span>
                                              </div>
                                              {a.guidanceText && !subDone && (
                                                <p
                                                  style={{
                                                    margin: "6px 0 0 26px",
                                                    fontSize: 12,
                                                    color: "var(--text-2)",
                                                    lineHeight: 1.45,
                                                  }}
                                                >
                                                  {a.guidanceText}
                                                </p>
                                              )}
                                              {!subDone && subFlashing && (
                                                <div
                                                  style={{
                                                    margin: "8px 0 0 26px",
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    gap: 6,
                                                    fontSize: 12,
                                                    color: "var(--text-2)",
                                                  }}
                                                >
                                                  <span
                                                    aria-hidden
                                                    style={{
                                                      width: 6,
                                                      height: 6,
                                                      borderRadius: "50%",
                                                      background:
                                                        "var(--onb-verifying)",
                                                      animation:
                                                        "live-pulse 2s var(--ease) infinite",
                                                    }}
                                                  />
                                                  We're checking this…
                                                </div>
                                              )}
                                              {!subDone && !subFlashing && !sIsAgency && (
                                                <div
                                                  style={{
                                                    margin: "10px 0 0 26px",
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    gap: 6,
                                                  }}
                                                >
                                                  <button
                                                    type="button"
                                                    className="doer-cta"
                                                    onClick={() =>
                                                      completeSubStep(s.id, i)
                                                    }
                                                  >
                                                    {sPrimaryCta}{" "}
                                                    <ArrowRight size={16} aria-hidden />
                                                  </button>
                                                  <button
                                                    type="button"
                                                    onClick={() =>
                                                      setOpenSubVideoKey((cur) =>
                                                        cur === subKey ? null : subKey,
                                                      )
                                                    }
                                                    aria-expanded={subVideoOpen}
                                                    className="btn-ghost"
                                                    style={{
                                                      display: "inline-flex",
                                                      alignItems: "center",
                                                      justifyContent: "center",
                                                      gap: 6,
                                                      width: "100%",
                                                      height: 30,
                                                      fontSize: 12.5,
                                                      border: "none",
                                                      background: "transparent",
                                                      borderRadius: "var(--r-sm)",
                                                      cursor: "pointer",
                                                    }}
                                                  >
                                                    <PlayCircle size={14} aria-hidden />
                                                    Show me how
                                                  </button>
                                                  {subVideoOpen && (
                                                    <div>
                                                      <div
                                                        aria-hidden
                                                        style={{
                                                          width: "100%",
                                                          aspectRatio: "16 / 9",
                                                          background: "var(--n-3)",
                                                          borderRadius: "var(--r-md)",
                                                          display: "flex",
                                                          alignItems: "center",
                                                          justifyContent: "center",
                                                          color: "var(--text-3)",
                                                        }}
                                                      >
                                                        <PlayCircle size={36} />
                                                      </div>
                                                      <div
                                                        style={{
                                                          marginTop: 4,
                                                          fontSize: 11.5,
                                                          color: "var(--text-3)",
                                                        }}
                                                      >
                                                        2 min walkthrough
                                                      </div>
                                                    </div>
                                                  )}
                                                </div>
                                              )}
                                            </li>
                                          );
                                        })}
                                      </ul>
                                    </>
                                  ) : (
                                    <>
                                      <p
                                        style={{
                                          margin: 0,
                                          fontSize: 13,
                                          lineHeight: 1.5,
                                          color: "var(--text-2)",
                                        }}
                                      >
                                        {sIsAgency
                                          ? `${brandName} is on it — nothing needed from you.`
                                          : sBody}
                                      </p>
                                      {!sIsAgency && (
                                        <>
                                          <button
                                            type="button"
                                            className="doer-cta"
                                            style={{ marginTop: 12 }}
                                          >
                                            {sPrimaryCta} <ArrowRight size={16} aria-hidden />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => setPreviewVideoOpen((v) => !v)}
                                            aria-expanded={previewVideoOpen}
                                            className="btn-ghost"
                                            style={{
                                              display: "inline-flex",
                                              alignItems: "center",
                                              justifyContent: "center",
                                              gap: 6,
                                              width: "100%",
                                              height: 32,
                                              marginTop: 8,
                                              fontSize: 13,
                                              border: "none",
                                              background: "transparent",
                                              borderRadius: "var(--r-sm)",
                                              cursor: "pointer",
                                            }}
                                          >
                                            <PlayCircle size={16} aria-hidden />
                                            Show me how
                                          </button>
                                          {previewVideoOpen && (
                                            <div style={{ marginTop: 8 }}>
                                              <div
                                                aria-hidden
                                                style={{
                                                  width: "100%",
                                                  aspectRatio: "16 / 9",
                                                  background: "var(--n-3)",
                                                  borderRadius: "var(--r-md)",
                                                  display: "flex",
                                                  alignItems: "center",
                                                  justifyContent: "center",
                                                  color: "var(--text-3)",
                                                }}
                                              >
                                                <PlayCircle size={40} />
                                              </div>
                                              <div style={{ marginTop: 6, fontSize: 12, color: "var(--text-3)" }}>
                                                2 min walkthrough
                                              </div>
                                            </div>
                                          )}
                                        </>
                                      )}
                                    </>
                                  )}
                                </div>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                );
              })()}

              {/* WAITING ON CHECKS — pending verifications run in the
                  background and never block other steps. */}
              {verifyingList.length > 0 && (
                <div style={{ padding: "8px 2px 0" }}>
                  <div
                    style={{
                      fontSize: 11,
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                      color: "var(--text-3)",
                      marginBottom: 6,
                    }}
                  >
                    Waiting on review
                  </div>
                  <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                    {verifyingList.map((s) => (
                      <li
                        key={s.id}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 4,
                          padding: "8px 10px",
                          background: "var(--surface-2)",
                          border: "1px solid var(--border-soft)",
                          borderRadius: "var(--r-sm)",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span
                            aria-hidden
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: "50%",
                              background: "var(--onb-verifying)",
                              flex: "none",
                              animation: "live-pulse 2s var(--ease) infinite",
                            }}
                          />
                          <Clock size={14} aria-hidden style={{ color: "var(--text-3)", flex: "none" }} />
                          <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text)", lineHeight: 1.35 }}>
                            {displayTitle(s.title)}
                          </span>
                        </div>
                        <div style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.45, paddingLeft: 16 }}>
                          {recheckingId === s.id
                            ? "Re-checking…"
                            : "We're checking this — usually 1–3 days. You can keep going."}
                        </div>
                        {recheckingId !== s.id && (
                          <div style={{ paddingLeft: 16 }}>
                            {recheckOpenId !== s.id ? (
                              <button
                                type="button"
                                onClick={() => setRecheckOpenId(s.id)}
                                style={{
                                  all: "unset",
                                  fontSize: 11.5,
                                  color: "var(--text-3)",
                                  cursor: "pointer",
                                  textDecoration: "underline",
                                }}
                              >
                                I've already done this
                              </button>
                            ) : (
                              <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                                <button
                                  type="button"
                                  onClick={() => startRecheck(s.id)}
                                  className="btn-primary"
                                  style={{
                                    height: 26,
                                    padding: "0 10px",
                                    fontSize: 12,
                                    fontWeight: 600,
                                    border: "none",
                                    borderRadius: "var(--r-sm)",
                                    cursor: "pointer",
                                  }}
                                >
                                  Re-check now
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setRecheckOpenId(null)}
                                  style={{
                                    all: "unset",
                                    height: 26,
                                    padding: "0 10px",
                                    fontSize: 12,
                                    color: "var(--text-2)",
                                    cursor: "pointer",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    borderRadius: "var(--r-sm)",
                                  }}
                                >
                                  Cancel
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* COMES NEXT — calm carrier-chain wait rows (a2p_brand, a2p_campaign). */}
              {lockedList.length > 0 && (
                <ul
                  style={{
                    listStyle: "none",
                    margin: "8px 0 0",
                    padding: 0,
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                  }}
                >
                  {lockedList.map((s) => {
                    const copy =
                      s.type === "a2p_campaign"
                        ? "Available once your text-messaging registration is approved — we'll open this automatically."
                        : s.type === "a2p_brand"
                        ? "Available once your phone number is set up — we'll open this automatically."
                        : "";
                    const isFlashing = flashingId === s.id;
                    return (
                      <li
                        key={s.id}
                        aria-disabled={!isFlashing}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 8,
                          padding: "8px 10px",
                          fontSize: 13,
                          lineHeight: 1.45,
                          color: "var(--text-3)",
                          background: isFlashing
                            ? "color-mix(in oklab, var(--client-accent) 10%, var(--surface))"
                            : "color-mix(in oklab, var(--border-soft) 30%, var(--surface))",
                          border: isFlashing
                            ? "1px solid var(--client-accent)"
                            : "1px solid var(--border-soft)",
                          borderRadius: "var(--r-sm)",
                          boxShadow: isFlashing
                            ? "0 0 0 3px color-mix(in oklab, var(--client-accent) 22%, transparent)"
                            : "none",
                          transition:
                            "background var(--d-base) var(--ease), border-color var(--d-base) var(--ease), box-shadow var(--d-base) var(--ease)",
                        }}
                      >
                        <Clock
                          size={14}
                          strokeWidth={1.75}
                          style={{ flexShrink: 0, marginTop: 2, color: "var(--text-3)" }}
                          aria-hidden
                        />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ color: "var(--text-2)" }}>{displayTitle(s.title)}</div>
                          <div style={{ marginTop: 2 }}>{copy}</div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          )}
          </div>
        </div>


        {/* `enableVideoSlideout` prop kept for API stability; video now expands inline in the card. */}
      </>
    );
  },
);

// ---------------------------------------------------------------------------


// ---------------------------------------------------------------------------
// renderCurrentStepCard — private to this module. Every per-step string is
// resolved here from step.title / step.assets / getStepContent(step.type).
// ---------------------------------------------------------------------------
type CardArgs = {
  step: QueueItem;
  state: CurrentState;
  hasAssets: boolean;
  assets: StepAsset[] | undefined;
  assetState: boolean[] | null;
  assetDone: number;
  dotBg: string;
  displayTitle: (t: string) => string;
  videoOpen: boolean;
  setVideoOpen: (v: boolean | ((p: boolean) => boolean)) => void;
  rechecking: boolean;
  reportOpen: boolean;
  setReportOpen: (v: boolean) => void;
  reportText: string;
  setReportText: (v: string) => void;
  reportSubmitted: boolean;
  submitReport: () => void;
  onResubmit?: () => void;
  brandName: string;
};

function renderCurrentStepCard(args: CardArgs) {
  const {
    step,
    state,
    hasAssets,
    assets,
    assetState,
    assetDone,
    dotBg,
    displayTitle,
    videoOpen,
    setVideoOpen,
    rechecking,
    reportOpen,
    setReportOpen,
    reportText,
    setReportText,
    reportSubmitted,
    submitReport,
    onResubmit,
    brandName,
  } = args;

  const content = (() => {
    try {
      return getStepContent(step.type);
    } catch {
      return null;
    }
  })();
  const primaryCtaLabel = content?.primaryCta ?? "Take me there";
  const body = content?.body ?? "Tap below to get started.";
  const failure = content?.failure;
  const showVerifying = !hasAssets && state === "verifying" && !!content?.verifyingStrip;
  const showApproved = !hasAssets && state === "approved_flash";
  const showFailure = !hasAssets && state === "needs_attention" && !!failure;
  const isAgency = step.owner === "agency";

  return (
    <div
      style={{
        border: "1px solid var(--border-soft)",
        borderRadius: 10,
        padding: 14,
        marginBottom: 16,
      }}
    >
      {/* Title row */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 10,
          marginBottom: 8,
        }}
      >
        <span
          className="onb-dot"
          aria-hidden
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: dotBg,
            marginTop: 5,
            flex: "none",
            animation:
              state === "verifying" && !hasAssets
                ? "live-pulse 2s var(--ease) infinite"
                : "none",
          }}
        />
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: "var(--text)",
            lineHeight: 1.35,
          }}
        >
          {displayTitle(step.title)}
        </div>
      </div>

      {/* Body */}
      {hasAssets ? (
        <>
          <p
            style={{
              fontSize: 13,
              color: "var(--text-2)",
              lineHeight: 1.5,
              margin: "0 0 10px 0",
            }}
          >
            <span className="mono">{assetDone}</span> of{" "}
            <span className="mono">{assets!.length}</span> activated
          </p>
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: "0 0 4px 0",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            {assets!.map((a, i) => {
              const done = assetState![i];
              return (
                <li
                  key={`${a.name}-${i}`}
                  style={{ display: "flex", alignItems: "center", gap: 10 }}
                >
                  <span
                    aria-hidden
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: "50%",
                      border: done ? "none" : "1.5px solid var(--border)",
                      background: done ? "var(--client-accent)" : "transparent",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {done && <Check size={11} color="white" strokeWidth={3} />}
                  </span>
                  <span
                    style={{
                      fontSize: 13,
                      color: done ? "var(--text-3)" : "var(--text)",
                      lineHeight: 1.4,
                    }}
                  >
                    {a.name}
                  </span>
                </li>
              );
            })}
          </ul>
          {!isAgency && (
            <button type="button" className="doer-cta" style={{ marginTop: 14 }}>
              {primaryCtaLabel} <ArrowRight size={16} aria-hidden />
            </button>
          )}
        </>
      ) : (
        <>
          <p
            style={{
              fontSize: 13,
              color: "var(--text-2)",
              lineHeight: 1.5,
              margin: "0 0 10px 0",
            }}
          >
            {isAgency ? `${brandName} is on it — nothing needed from you.` : body}
          </p>

          {showVerifying && (
            <Strip
              bg="var(--info-soft)"
              color="var(--info-9)"
              icon={<Clock size={16} aria-hidden />}
            >
              {content!.verifyingStrip}
            </Strip>
          )}
          {showApproved && (
            <Strip
              bg="var(--pos-soft)"
              color="var(--pos-9)"
              icon={<CheckCircle2 size={16} aria-hidden />}
            >
              Approved ✓
            </Strip>
          )}
          {showFailure && (
            <>
              <Strip
                bg="var(--warn-soft)"
                color="var(--warn-9)"
                icon={<AlertCircle size={16} aria-hidden />}
              >
                {failure!.body}
              </Strip>
              <button
                type="button"
                onClick={() => onResubmit?.()}
                className="btn-primary"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  height: 32,
                  padding: "0 12px",
                  marginTop: 10,
                  fontSize: 13,
                  fontWeight: 600,
                  border: "none",
                  borderRadius: "var(--r-sm)",
                  cursor: "pointer",
                }}
              >
                {failure!.ctaLabel} <ArrowRight size={14} aria-hidden />
              </button>
            </>
          )}

          {rechecking && (
            <div style={{ marginTop: 10 }}>
              <Strip
                bg="var(--info-soft)"
                color="var(--info-9)"
                icon={<Clock size={16} aria-hidden />}
              >
                Re-checking…
              </Strip>
            </div>
          )}

          {reportSubmitted && (
            <div style={{ marginTop: 10 }}>
              <Strip
                bg="var(--surface-2)"
                color="var(--text-2)"
                icon={<CheckCircle2 size={16} aria-hidden />}
              >
                Reported. {brandName} will follow up — nothing more needed from you.
              </Strip>
            </div>
          )}

          {/* In-card recheck link removed — now rendered under the card by the parent. */}

          {showFailure && !reportSubmitted && (
            <div style={{ marginTop: 10 }}>
              {!reportOpen ? (
                <button
                  type="button"
                  onClick={() => setReportOpen(true)}
                  style={{
                    all: "unset",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: 12,
                    color: "var(--text-2)",
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                >
                  This doesn't match what I see <ArrowRight size={12} aria-hidden />
                </button>
              ) : (
                <div
                  style={{
                    border: "1px solid var(--border-soft)",
                    borderRadius: "var(--r-sm)",
                    padding: 10,
                    background: "var(--surface-2)",
                  }}
                >
                  <p
                    style={{
                      fontSize: 12,
                      color: "var(--text-2)",
                      lineHeight: 1.5,
                      margin: "0 0 8px 0",
                    }}
                  >
                    Tell us what you're seeing. We'll loop in {brandName} and pause this check while we look.
                  </p>
                  <textarea
                    value={reportText}
                    onChange={(e) => setReportText(e.target.value)}
                    rows={3}
                    placeholder="e.g. I see Approved already"
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      resize: "vertical",
                      padding: 8,
                      fontSize: 12,
                      fontFamily: "inherit",
                      color: "var(--text)",
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--r-sm)",
                      marginBottom: 8,
                    }}
                  />
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      type="button"
                      onClick={submitReport}
                      disabled={reportText.trim().length === 0}
                      className="btn-primary"
                      style={{
                        height: 28,
                        padding: "0 10px",
                        fontSize: 12,
                        fontWeight: 600,
                        border: "none",
                        borderRadius: "var(--r-sm)",
                        cursor:
                          reportText.trim().length === 0
                            ? "not-allowed"
                            : "pointer",
                        opacity: reportText.trim().length === 0 ? 0.5 : 1,
                      }}
                    >
                      Submit
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setReportOpen(false);
                        setReportText("");
                      }}
                      style={{
                        all: "unset",
                        height: 28,
                        padding: "0 10px",
                        fontSize: 12,
                        color: "var(--text-2)",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        borderRadius: "var(--r-sm)",
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {!isAgency && !showVerifying && !showFailure && !showApproved && !rechecking && !reportSubmitted && (
            <>
              <button type="button" className="doer-cta" style={{ marginTop: 14 }}>
                {primaryCtaLabel} <ArrowRight size={16} aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => setVideoOpen((v) => !v)}
                aria-expanded={videoOpen}
                className="btn-ghost"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  width: "100%",
                  height: 32,
                  marginTop: 8,
                  fontSize: 13,
                  border: "none",
                  background: "transparent",
                  borderRadius: "var(--r-sm)",
                  cursor: "pointer",
                }}
              >
                <PlayCircle size={16} aria-hidden />
                Show me how
              </button>
              {videoOpen && (
                <div style={{ marginTop: 8 }}>
                  <div
                    aria-hidden
                    style={{
                      width: "100%",
                      aspectRatio: "16 / 9",
                      background: "var(--n-3)",
                      borderRadius: "var(--r-md)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--text-3)",
                    }}
                  >
                    <PlayCircle size={40} />
                  </div>
                  <div style={{ marginTop: 6, fontSize: 12, color: "var(--text-3)" }}>
                    2 min walkthrough
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

function Strip({
  bg,
  color,
  icon,
  children,
}: {
  bg: string;
  color: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 8,
        background: bg,
        padding: 10,
        borderRadius: 6,
        fontSize: 12,
        color,
        lineHeight: 1.45,
      }}
    >
      <span style={{ flex: "none", marginTop: 1, display: "inline-flex" }}>
        {icon}
      </span>
      <span>{children}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Catalog (DEV State Gallery) renderers — reuse the same chrome (.doer-panel,
// .doer-head, Strip, .doer-cta) so the gallery card is the same card the
// state machine would produce. No new visual components.
// ---------------------------------------------------------------------------

function CatalogHead({
  brandName,
  showCloseButton,
  onRequestClose,
}: {
  brandName: string;
  showCloseButton: boolean;
  onRequestClose?: () => void;
}) {
  return (
    <div className="doer-head">
      <span className="doer-logo" aria-hidden>
        {brandName
          .split(" ")
          .map((w) => w[0])
          .join("")
          .slice(0, 2)
          .toUpperCase()}
      </span>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", lineHeight: 1.2 }}>
          {brandName}
        </div>
        <div style={{ fontSize: 12, color: "var(--text-2)", marginTop: 2 }}>
          Your setup checklist
        </div>
      </div>
      {showCloseButton && (
        <button
          type="button"
          aria-label="Close setup"
          onClick={() => onRequestClose?.()}
          style={{
            all: "unset",
            width: 28,
            height: 28,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "var(--r-sm)",
            cursor: "pointer",
            color: "var(--text-2)",
          }}
        >
          <X size={16} aria-hidden />
        </button>
      )}
    </div>
  );
}

function catalogDotColor(state: CatalogEntry["stateType"]): string {
  switch (state) {
    case "done":
    case "graduation":
      return "var(--pos-7)";
    case "verifying":
      return "var(--onb-verifying, var(--info-7))";
    case "failure":
      return "var(--onb-needs-attention, var(--warn-7))";
    case "locked":
    case "not_started":
      return "var(--n-5, var(--text-3))";
    case "waiting_on_agency":
    case "dispute":
    case "nudge":
    case "in_progress":
    default:
      return "var(--client-accent)";
  }
}

function catalogStatusPillStyle(state: CatalogEntry["stateType"]): CSSProperties {
  // Quiet pill — color/ink derived from the state, never a band color reused.
  switch (state) {
    case "done":
    case "graduation":
      return { background: "var(--pos-soft)", color: "var(--pos-9)" };
    case "verifying":
      return { background: "var(--info-soft)", color: "var(--info-9)" };
    case "failure":
      return { background: "var(--warn-soft)", color: "var(--warn-9)" };
    case "locked":
    case "not_started":
      return { background: "var(--surface-2)", color: "var(--text-3)" };
    case "waiting_on_agency":
    case "dispute":
    case "nudge":
    case "in_progress":
    default:
      return { background: "var(--surface-2)", color: "var(--text-2)" };
  }
}

function CatalogCard({ entry, brandName }: { entry: CatalogEntry; brandName: string }) {
  const { stateType, statusLabel, clientCopy, primaryAction, showDispute } = entry;
  const isGraduation = stateType === "graduation";

  // Graduation reuses the existing celebration treatment verbatim — same
  // copy DoerPanel writes after auto-complete.
  if (isGraduation) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          padding: "16px 8px 16px",
          gap: 12,
        }}
      >
        <div
          aria-hidden
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "color-mix(in oklab, var(--pos-7) 14%, transparent)",
            color: "var(--pos-7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Check size={28} />
        </div>
        <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text)" }}>
          {clientCopy.title}
        </div>
        <p
          style={{
            fontSize: 13,
            color: "var(--text-2)",
            lineHeight: 1.5,
            margin: 0,
            maxWidth: 280,
          }}
        >
          {clientCopy.body.replace(/Summit Digital/g, brandName)}
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        marginTop: 12,
        border: "1px solid var(--border-soft)",
        borderRadius: 10,
        padding: 14,
      }}
    >
      {/* Status pill */}
      <div style={{ marginBottom: 8 }}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 11,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            padding: "2px 8px",
            borderRadius: 999,
            ...catalogStatusPillStyle(stateType),
          }}
        >
          {statusLabel}
        </span>
      </div>

      {/* Title row */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 10,
          marginBottom: 8,
        }}
      >
        <span
          aria-hidden
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: catalogDotColor(stateType),
            marginTop: 5,
            flex: "none",
            animation:
              stateType === "verifying" ? "live-pulse 2s var(--ease) infinite" : "none",
          }}
        />
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", lineHeight: 1.35 }}>
          {clientCopy.title.replace(/Summit Digital/g, brandName)}
        </div>
      </div>

      {/* Body — failure body lives inside the warn Strip so the visual
          language matches the state-machine card. Everything else is a
          plain paragraph. */}
      {stateType === "failure" ? (
        <Strip
          bg="var(--warn-soft)"
          color="var(--warn-9)"
          icon={<AlertCircle size={16} aria-hidden />}
        >
          {clientCopy.body.replace(/Summit Digital/g, brandName)}
        </Strip>
      ) : stateType === "verifying" && clientCopy.verifyingStrip ? (
        <>
          <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.5, margin: "0 0 10px 0" }}>
            {clientCopy.body.replace(/Summit Digital/g, brandName)}
          </p>
          <Strip
            bg="var(--info-soft)"
            color="var(--info-9)"
            icon={<Clock size={16} aria-hidden />}
          >
            {clientCopy.verifyingStrip}
          </Strip>
        </>
      ) : stateType === "dispute" ? (
        <div
          style={{
            border: "1px solid var(--border-soft)",
            borderRadius: "var(--r-sm)",
            padding: 10,
            background: "var(--surface-2)",
          }}
        >
          <p style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.5, margin: "0 0 8px 0" }}>
            {clientCopy.body.replace(/Summit Digital/g, brandName)}
          </p>
          <textarea
            rows={3}
            placeholder="e.g. I see Approved already"
            style={{
              width: "100%",
              boxSizing: "border-box",
              resize: "vertical",
              padding: 8,
              fontSize: 12,
              fontFamily: "inherit",
              color: "var(--text)",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--r-sm)",
            }}
          />
        </div>
      ) : (
        <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.5, margin: 0 }}>
          {clientCopy.body.replace(/Summit Digital/g, brandName)}
        </p>
      )}

      {/* Primary CTA */}
      {primaryAction && (
        <button
          type="button"
          className={stateType === "failure" ? "btn-primary" : "doer-cta"}
          style={
            stateType === "failure"
              ? {
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  height: 32,
                  padding: "0 12px",
                  marginTop: 10,
                  fontSize: 13,
                  fontWeight: 600,
                  border: "none",
                  borderRadius: "var(--r-sm)",
                  cursor: "pointer",
                }
              : { marginTop: 14 }
          }
        >
          {primaryAction} <ArrowRight size={14} aria-hidden />
        </button>
      )}

      {/* Dispute affordance */}
      {showDispute && (
        <div style={{ marginTop: 10 }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontSize: 12,
              color: "var(--text-2)",
              textDecoration: "underline",
              cursor: "pointer",
            }}
          >
            This doesn't match what I see <ArrowRight size={12} aria-hidden />
          </span>
        </div>
      )}
    </div>
  );
}
