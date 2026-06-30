import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Globe,
  LayoutList,
  ListChecks,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import bg from "@onb/assets/highlevel-bg.png";
import {
  DEFAULT_PLACEMENT,
  getCurrentJourney,
  STANDARD_GHL_JOURNEY,
  type FloatingPosition,
  type Placement,
} from "@onb/lib/types";
import {
  DEFAULT_BRAND_COLOR,
  resolveAccentFill,
  resolveAccentInk,
} from "@onb/lib/clientAccent";
import {
  DoerPanel,
  type DoerPanelHandle,
} from "@onb/components/onboarding/DoerPanel";
import {
  catalogStepNumbers,
  entriesForStep,
  findEntry,
  stateCatalog,
  universalEntries,
  type CatalogEntry,
} from "@onb/lib/state-catalog";
import { auditEntry, type AuditFlag } from "@onb/lib/copy-audit";

type GalleryFilter = "all" | "failures" | "positives" | "universal";

function matchesGalleryFilter(e: CatalogEntry, f: GalleryFilter): boolean {
  if (f === "all") return true;
  if (f === "universal") return e.stepNum === null;
  if (f === "failures")
    return e.stateType === "failure" || e.stateType === "dispute";
  return (
    e.stateType === "done" ||
    e.stateType === "in_progress" ||
    e.stateType === "verifying" ||
    e.stateType === "graduation"
  );
}




export default DoerDemo;

const RING_R = 8;
const RING_C = 2 * Math.PI * RING_R;
const TOTAL = 15;

type ScenarioKey = "new" | "mid" | "verifying" | "attention" | "complete" | "trackingOnly";

const SCENARIO_OPTIONS: { value: ScenarioKey; label: string }[] = [
  { value: "new", label: "New client" },
  { value: "mid", label: "Mid-journey" },
  { value: "verifying", label: "Verifying" },
  { value: "attention", label: "Needs attention (failed)" },
  { value: "complete", label: "Complete" },
  { value: "trackingOnly", label: "Tracking-only" },
];

function DoerDemo() {
  const [mode, setMode] = useState<"collapsed" | "expanded">("collapsed");
  const [scenarioKey, setScenarioKey] = useState<ScenarioKey>("new");
  const [panelScenario, setPanelScenario] = useState<"new" | "mid" | "stuck">("new");

  const [liveJourney, setLiveJourney] = useState<ReturnType<typeof getCurrentJourney>>(
    () => STANDARD_GHL_JOURNEY,
  );
  useEffect(() => {
    const j = getCurrentJourney();
    if (j) {
      setLiveJourney(j);
      setExperienceMode(j.experienceMode ?? "guided");
      setPlacement(j.placement ?? DEFAULT_PLACEMENT);
    }
  }, []);
  const brandAccent = liveJourney?.brandColor ?? DEFAULT_BRAND_COLOR;
  const accentFill = resolveAccentFill(brandAccent);
  const accentInk = resolveAccentInk(brandAccent);

  const [experienceMode, setExperienceMode] = useState<"guided" | "tracking_only">("guided");
  const trackingOnly = experienceMode === "tracking_only";
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const applyScenario = (key: ScenarioKey) => {
    setScenarioKey(key);
    switch (key) {
      case "trackingOnly":
        console.info("[scenario] trackingOnly → setExperienceMode('tracking_only')");
        setExperienceMode("tracking_only");
        setBannerDismissed(false);
        return;
      case "new":
        console.info("[scenario] new → setPanelScenario('new') [seed: in_progress]");
        setExperienceMode("guided");
        setPanelScenario("new");
        return;
      case "mid":
        console.info("[scenario] mid → setPanelScenario('mid') [seed: in_progress]");
        setExperienceMode("guided");
        setPanelScenario("mid");
        return;
      case "attention":
        console.info("[scenario] attention → setPanelScenario('stuck') [seed: needs_attention]");
        setExperienceMode("guided");
        setPanelScenario("stuck");
        return;
      case "verifying":
        console.info("[scenario] verifying → setPanelScenario('mid') → landOnVerifyingStep()");
        setExperienceMode("guided");
        setPanelScenario("mid");
        requestAnimationFrame(() =>
          requestAnimationFrame(() => panelRef.current?.landOnVerifyingStep()),
        );
        return;
      case "complete":
        console.info("[scenario] complete → simulateCompletion()");
        setExperienceMode("guided");
        setMode("expanded");
        panelRef.current?.simulateCompletion();
        return;
    }
  };

  // ---- DEV State Gallery -------------------------------------------------
  const [galleryOpen, setGalleryOpen] = useState(true);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [expandedSteps, setExpandedSteps] = useState<Record<number, boolean>>({ 1: true });
  const [auditOn, setAuditOn] = useState(false);
  const [galleryFilter, setGalleryFilter] = useState<GalleryFilter>("all");

  const filteredCatalog = useMemo(
    () => stateCatalog.filter((e) => matchesGalleryFilter(e, galleryFilter)),
    [galleryFilter],
  );

  const galleryActive = selectedEntryId !== null;
  const selectedIndex = useMemo(
    () =>
      selectedEntryId
        ? filteredCatalog.findIndex((e) => e.id === selectedEntryId)
        : -1,
    [selectedEntryId, filteredCatalog],
  );
  const selectedEntry: CatalogEntry | undefined = selectedEntryId
    ? findEntry(selectedEntryId)
    : undefined;
  const selectEntry = (id: string) => {
    setSelectedEntryId(id);
    setMode("expanded");
  };
  const walkBy = (delta: number) => {
    if (filteredCatalog.length === 0) return;
    const base = selectedIndex >= 0 ? selectedIndex : 0;
    const next = Math.min(filteredCatalog.length - 1, Math.max(0, base + delta));
    selectEntry(filteredCatalog[next].id);
  };

  // Keyboard ←/→ walk through the filtered catalog while gallery is open.
  const walkRef = useRef(walkBy);
  walkRef.current = walkBy;
  useEffect(() => {
    if (!galleryOpen) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t) {
        const tag = t.tagName;
        if (
          tag === "INPUT" ||
          tag === "TEXTAREA" ||
          tag === "SELECT" ||
          t.isContentEditable
        ) {
          return;
        }
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        walkRef.current(-1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        walkRef.current(1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [galleryOpen]);

  const universals = useMemo(
    () =>
      universalEntries().filter((e) => matchesGalleryFilter(e, galleryFilter)),
    [galleryFilter],
  );
  const stepNums = catalogStepNumbers();
  const filteredEntriesForStep = useMemo(
    () => (n: number): CatalogEntry[] =>
      entriesForStep(n).filter((e) => matchesGalleryFilter(e, galleryFilter)),
    [galleryFilter],
  );
  const filterCounts = useMemo<Record<GalleryFilter, number>>(
    () => ({
      all: stateCatalog.length,
      failures: stateCatalog.filter((e) => matchesGalleryFilter(e, "failures"))
        .length,
      positives: stateCatalog.filter((e) =>
        matchesGalleryFilter(e, "positives"),
      ).length,
      universal: stateCatalog.filter((e) =>
        matchesGalleryFilter(e, "universal"),
      ).length,
    }),
    [],
  );


  const [placement, setPlacement] = useState<Placement>(DEFAULT_PLACEMENT);
  const placementMode = placement.mode;
  const floatingPos: FloatingPosition = placement.position ?? "bottom-right-offset";

  // Panel handle + progress mirror so the collapsed pill renders the right ring.
  const panelRef = useRef<DoerPanelHandle | null>(null);
  const [progress, setProgress] = useState({
    completedCount: 0,
    total: TOTAL,
    graduated: false,
    panelView: "checklist" as "checklist" | "celebration",
  });
  const completedCount = progress.completedCount;
  const total = progress.total || TOTAL;
  const remaining = total - completedCount;
  const pctFrac = total === 0 ? 0 : completedCount / total;

  const floatingAnchorStyle = (pos: FloatingPosition): CSSProperties => {
    switch (pos) {
      case "bottom-left":
        return { left: 20, right: "auto", bottom: 20, top: "auto" };
      case "bottom-right-offset":
        return { right: 84, left: "auto", bottom: 20, top: "auto" };
      default:
        return { right: 20, left: "auto", bottom: 20, top: "auto" };
    }
  };
  // Banner-triggered card anchors top-right, just under the 44px banner.
  // Content-sized; inherits .doer-panel radius/shadow + DoerPanel's max-height cap.
  const bannerCardAnchorStyle: CSSProperties = {
    top: 52,
    right: 20,
    bottom: "auto",
    left: "auto",
  };
  const pillAnchorStyle: CSSProperties = floatingAnchorStyle(floatingPos);
  const panelAnchorStyle: CSSProperties =
    placementMode === "banner" && mode === "expanded"
      ? bannerCardAnchorStyle
      : placementMode === "menu"
        ? floatingAnchorStyle("bottom-right-offset")
        : floatingAnchorStyle(floatingPos);

  const showBannerSurface = placementMode === "banner" && !progress.graduated;
  const showMenuSurface = placementMode === "menu" && !progress.graduated;

  // Click-away dismiss for the banner slideout — no blocking scrim.
  useEffect(() => {
    if (!(placementMode === "banner" && mode === "expanded")) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node | null;
      if (!t) return;
      const panel = document.querySelector(".doer-panel");
      const banner = document.querySelector("[data-banner-trigger]");
      if (panel?.contains(t) || banner?.contains(t)) return;
      setMode("collapsed");
    };
    document.addEventListener("pointerdown", onDown, true);
    return () => document.removeEventListener("pointerdown", onDown, true);
  }, [placementMode, mode]);

  return (
    <>
      <style>{`
        @keyframes doer-banner-drop {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .doer-banner-drop {
          animation: doer-banner-drop var(--d-base) var(--ease) both;
          transform-origin: top right;
        }
        @media (prefers-reduced-motion: reduce) {
          .doer-banner-drop { animation: none; }
        }
      `}</style>

      <img
        src={bg}
        alt=""
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          zIndex: 0,
          userSelect: "none",
          pointerEvents: "none",
        }}
      />

      {/* DEV control — not part of the widget */}
      <div
        data-dev-strip
        style={{
          position: "fixed",
          top: 12,
          right: 12,
          zIndex: 70,
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "4px 6px",
          background: "var(--surface)",
          border: "1px dashed var(--border)",
          borderRadius: "var(--r-md)",
          boxShadow: "var(--sh-sheet)",
          pointerEvents: "auto",
        }}
      >
        <span
          aria-hidden
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.08em",
            color: "var(--text-3)",
            padding: "2px 6px",
            border: "1px solid var(--border)",
            borderRadius: 4,
          }}
        >
          DEV
        </span>
        <label style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 11, color: "var(--text-3)" }}>Scenario</span>
          <select
            value={scenarioKey}
            onChange={(e) => applyScenario(e.target.value as ScenarioKey)}
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
          >
            {SCENARIO_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={() => panelRef.current?.completeLaterStep()}
          title="Simulate a detector firing on a step lower in the list"
          style={{
            height: 28,
            padding: "0 10px",
            fontSize: 12,
            color: "var(--text)",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--r-sm)",
            cursor: "pointer",
          }}
        >
          Detector fires on later step
        </button>
      </div>



      {trackingOnly && !bannerDismissed && (
        <div
          style={{
            position: "fixed",
            top: 12,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 65,
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "10px 14px",
            maxWidth: 560,
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--r-md)",
            boxShadow: "var(--sh-sheet)",
            fontSize: 12.5,
            color: "var(--text)",
            pointerEvents: "auto",
          }}
        >
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: "var(--text-3)", padding: "2px 6px", border: "1px solid var(--border)", borderRadius: 4 }}>
            DEMO
          </span>
          <span style={{ flex: 1, lineHeight: 1.45 }}>
            Tracking-only mode — this client sees no GoCSM. Step tracking still runs in the background.
          </span>
          <button
            type="button"
            onClick={() => setBannerDismissed(true)}
            aria-label="Dismiss"
            style={{
              background: "none",
              border: "none",
              padding: 0,
              fontSize: 12,
              color: "var(--text-3)",
              cursor: "pointer",
            }}
          >
            Dismiss
          </button>
        </div>
      )}

      {!trackingOnly ? (
      <div
        data-surface="client"
        style={
          {
            position: "fixed",
            inset: 0,
            pointerEvents: "none",
            zIndex: 1,
            "--client-accent": brandAccent,
            "--client-accent-fill": accentFill,
            "--client-accent-ink": accentInk,
          } as CSSProperties
        }
      >
        {showBannerSurface && (
          <button
            type="button"
            data-banner-trigger
            onClick={() => setMode("expanded")}
            aria-label={`Open setup checklist — ${completedCount} of ${total} done`}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              height: 44,
              zIndex: 5,
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "0 16px",
              background: "var(--surface)",
              borderBottom: "1px solid var(--border)",
              boxShadow: "var(--sh-rest)",
              color: "var(--text)",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 500,
              pointerEvents: "auto",
              textAlign: "left",
              fontFamily: "inherit",
            }}
          >
            <span
              aria-hidden
              style={{
                width: 24,
                height: 24,
                borderRadius: 6,
                background: "var(--client-accent)",
                color: "var(--client-accent-ink)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.02em",
                flex: "none",
              }}
            >
              SD
            </span>
            <span
              style={{
                flex: 1,
                minWidth: 0,
                fontSize: 13.5,
                color: "var(--text)",
                fontWeight: 500,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              Finish setting up{" "}
              <strong style={{ fontWeight: 600, color: "var(--text)" }}>
                Summit Digital
              </strong>
              {" — "}
              <span className="mono" style={{ fontWeight: 600 }}>
                {completedCount} of {total}
              </span>
              {" done"}
            </span>
            <span
              aria-hidden
              style={{
                width: 120,
                height: 4,
                borderRadius: 999,
                background:
                  "color-mix(in oklab, var(--client-accent) 14%, var(--bg-subtle))",
                overflow: "hidden",
                flex: "none",
              }}
            >
              <span
                style={{
                  display: "block",
                  width: `${Math.round(pctFrac * 100)}%`,
                  height: "100%",
                  borderRadius: 999,
                  background: "var(--client-accent)",
                  transition: "width var(--d-slow) var(--ease)",
                }}
              />
            </span>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                fontSize: 13,
                fontWeight: 600,
                color: "var(--client-accent)",
                flex: "none",
              }}
            >
              View checklist <ChevronRight size={14} aria-hidden />
            </span>
          </button>
        )}

        {showMenuSurface && (
          <button
            type="button"
            onClick={() => setMode("expanded")}
            aria-label="Open setup guide"
            style={{
              position: "fixed",
              left: 0,
              top: 220,
              width: 220,
              height: 40,
              zIndex: 5,
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "0 12px",
              background: "color-mix(in oklab, var(--client-accent) 12%, transparent)",
              borderLeft: "3px solid var(--client-accent)",
              borderTop: "1px solid var(--border)",
              borderRight: "1px solid var(--border)",
              borderBottom: "1px solid var(--border)",
              borderRadius: "0 var(--r-sm) var(--r-sm) 0",
              color: "var(--text)",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 500,
              pointerEvents: "auto",
              textAlign: "left",
            }}
          >
            <ListChecks size={16} aria-hidden style={{ color: "var(--client-accent)" }} />
            <span style={{ flex: 1 }}>Setup guide</span>
            <span
              className="mono"
              style={{
                fontSize: 12,
                color: "var(--text-2)",
                padding: "2px 6px",
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "var(--r-sm)",
              }}
            >
              {remaining} left
            </span>
          </button>
        )}


        {/* Collapsed pill (floating placement only) */}
        {mode === "collapsed" && placementMode === "floating" && (
          <button
            type="button"
            className="doer-pill"
            aria-expanded={false}
            aria-label="Open setup"
            onClick={() => setMode("expanded")}
            style={{
              pointerEvents: "auto",
              border: "none",
              cursor: "pointer",
              position: "fixed",
              zIndex: 6,
              ...pillAnchorStyle,
            }}
          >
            <span className="doer-logo" aria-hidden>
              SD
            </span>
            <svg
              width={20}
              height={20}
              viewBox="0 0 20 20"
              aria-hidden
              style={{ transform: "rotate(-90deg)", flexShrink: 0 }}
            >
              <circle cx={10} cy={10} r={RING_R} fill="none" stroke="var(--n-3)" strokeWidth={2.5} />
              <circle
                cx={10}
                cy={10}
                r={RING_R}
                fill="none"
                stroke="var(--client-accent)"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeDasharray={RING_C}
                strokeDashoffset={RING_C * (1 - pctFrac)}
                style={{ transition: "stroke-dashoffset var(--d-slow) var(--ease)" }}
              />
            </svg>
            <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text)", display: "inline-flex", alignItems: "center", gap: 4 }}>
              {progress.graduated ? (
                <>
                  Setup complete <Check size={14} aria-hidden />
                </>
              ) : (
                <>
                  Setup{" "}
                  <span aria-hidden style={{ color: "var(--text-3)", margin: "0 2px" }}>·</span>
                  <span className="mono">{completedCount}</span> of{" "}
                  <span className="mono">{total}</span>
                </>
              )}
            </span>
          </button>
        )}

        {/* The shared panel — same component the Builder preview uses.
            When the DEV State Gallery has a selection, it forwards that
            entry id and DoerPanel renders the catalog card. */}
        <DoerPanel
          ref={panelRef}
          journey={liveJourney ?? STANDARD_GHL_JOURNEY}
          scenario={panelScenario}
          catalogEntryId={selectedEntryId ?? undefined}
          accent={brandAccent}
          visible={mode === "expanded"}
          showCloseButton
          enableVideoSlideout
          onRequestClose={() => setMode("collapsed")}
          onProgress={setProgress}
          containerClassName={
            placementMode === "banner" && mode === "expanded"
              ? "doer-panel doer-banner-drop"
              : "doer-panel"
          }
          containerStyle={{
            pointerEvents: "auto",
            position: "fixed",
            zIndex: 6,
            top: "auto",
            ...panelAnchorStyle,
          }}
        />


        {/* Dev-only "Agency sees:" caption beneath the rendered card.
            Lives OUTSIDE the client surface so it never carries client-
            surface constraints. */}
        {galleryActive && mode === "expanded" && selectedEntry && (
          <div
            data-dev-caption
            style={{
              pointerEvents: "none",
              position: "fixed",
              zIndex: 71,
              right: 12,
              top: 52,
              maxWidth: 380,
              fontSize: 11,
              lineHeight: 1.45,
              color: "var(--text-3)",
              padding: "4px 8px",
              background: "var(--surface)",
              border: "1px dashed var(--border)",
              borderRadius: "var(--r-sm)",
            }}
          >
            <span
              style={{
                fontWeight: 700,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                marginRight: 6,
              }}
            >
              Agency sees:
            </span>
            {selectedEntry.agencyCopy}
          </div>
        )}

        {/* Dev-only "3-second check" audit overlay — sibling of the card,
            never inside [data-surface="client"]. */}
        {auditOn && galleryActive && mode === "expanded" && selectedEntry && (
          <AuditBadge flags={auditEntry(selectedEntry)} />
        )}
      </div>
      ) : null}

      {/* ===== DEV State Gallery — collapsible left rail ===================
          Drives DoerPanel via catalogEntryId. Universal states group at top;
          then the 15 steps as expandable nodes (only seeded steps render
          children). The "State N of {total}" walker steps the catalog
          linearly across both groups. */}
      <StateGalleryRail
        open={galleryOpen}
        onToggle={() => setGalleryOpen((v) => !v)}
        universals={universals}
        stepNums={stepNums}
        expandedSteps={expandedSteps}
        onToggleStep={(n) =>
          setExpandedSteps((m) => ({ ...m, [n]: !m[n] }))
        }
        selectedId={selectedEntryId}
        onSelect={selectEntry}
        walkerIndex={selectedIndex}
        walkerTotal={filteredCatalog.length}
        onWalkPrev={() => walkBy(-1)}
        onWalkNext={() => walkBy(1)}
        auditOn={auditOn}
        onToggleAudit={() => setAuditOn((v) => !v)}
        filter={galleryFilter}
        onFilter={setGalleryFilter}
        filterCounts={filterCounts}
        entriesForStepFiltered={filteredEntriesForStep}
      />

    </>

  );
}

// ---------------------------------------------------------------------------
// StateGalleryRail — DEV-only collapsible left navigator.
// ---------------------------------------------------------------------------

const STATE_DOT_COLOR: Record<CatalogEntry["stateType"], string> = {
  done: "var(--pos-7)",
  graduation: "var(--pos-7)",
  verifying: "var(--onb-verifying, var(--info-7))",
  in_progress: "var(--info-7)",
  failure: "var(--onb-needs-attention, var(--warn-7))",
  nudge: "var(--info-7)",
  locked: "var(--n-5, var(--text-3))",
  not_started: "var(--n-5, var(--text-3))",
  waiting_on_agency: "var(--text-2)",
  dispute: "var(--text-2)",
};

function stateLabel(state: CatalogEntry["stateType"]): string {
  switch (state) {
    case "done":
      return "Done";
    case "in_progress":
      return "In progress";
    case "verifying":
      return "Verifying";
    case "locked":
      return "Locked";
    case "not_started":
      return "Not started";
    case "waiting_on_agency":
      return "Waiting on agency";
    case "failure":
      return "Failure";
    case "nudge":
      return "Nudge";
    case "graduation":
      return "Graduation";
    case "dispute":
      return "Dispute";
  }
}

function StateGalleryRail({
  open,
  onToggle,
  universals,
  stepNums,
  expandedSteps,
  onToggleStep,
  selectedId,
  onSelect,
  walkerIndex,
  walkerTotal,
  onWalkPrev,
  onWalkNext,
  auditOn,
  onToggleAudit,
  filter,
  onFilter,
  filterCounts,
  entriesForStepFiltered,
}: {
  open: boolean;
  onToggle: () => void;
  universals: CatalogEntry[];
  stepNums: number[];
  expandedSteps: Record<number, boolean>;
  onToggleStep: (n: number) => void;
  selectedId: string | null;
  onSelect: (id: string) => void;
  walkerIndex: number;
  walkerTotal: number;
  onWalkPrev: () => void;
  onWalkNext: () => void;
  auditOn: boolean;
  onToggleAudit: () => void;
  filter: GalleryFilter;
  onFilter: (f: GalleryFilter) => void;
  filterCounts: Record<GalleryFilter, number>;
  entriesForStepFiltered: (n: number) => CatalogEntry[];
}) {

  // Step numbers we KNOW about (15 steps) — render every one but only the
  // seeded ones are expandable. Step titles come from the catalog when present.
  const ALL_STEPS = Array.from({ length: 15 }, (_, i) => i + 1);

  const stepTitle = (n: number): string => {
    const e = entriesForStep(n)[0];
    return e ? e.stepTitle : `Step ${String(n).padStart(2, "0")}`;
  };

  const railWidth = open ? 280 : 36;

  return (
    <aside
      data-dev-gallery
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        bottom: 0,
        width: railWidth,
        zIndex: 75,
        background: "var(--surface)",
        borderRight: "1px dashed var(--border)",
        display: "flex",
        flexDirection: "column",
        transition: "width var(--d-base) var(--ease-out, ease-out)",
        boxShadow: "var(--sh-sheet)",
      }}
    >
      {/* Rail header — DEV chip + collapse toggle */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: open ? "10px 10px" : "10px 6px",
          borderBottom: "1px dashed var(--border)",
          justifyContent: open ? "space-between" : "center",
        }}
      >
        {open && (
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span
              aria-hidden
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.08em",
                color: "var(--text-3)",
                padding: "2px 6px",
                border: "1px solid var(--border)",
                borderRadius: 4,
              }}
            >
              DEV
            </span>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>
              State Gallery
            </span>
          </div>
        )}
        <button
          type="button"
          onClick={onToggle}
          aria-label={open ? "Collapse gallery" : "Open gallery"}
          style={{
            all: "unset",
            cursor: "pointer",
            color: "var(--text-2)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 24,
            height: 24,
            borderRadius: "var(--r-sm)",
          }}
        >
          {open ? <PanelLeftClose size={16} aria-hidden /> : <PanelLeftOpen size={16} aria-hidden />}
        </button>
      </div>

      {!open ? null : (
        <>
          {/* Walker */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 10px",
              borderBottom: "1px dashed var(--border)",
            }}
          >
            <button
              type="button"
              onClick={onWalkPrev}
              aria-label="Previous state"
              disabled={walkerIndex <= 0}
              style={{
                all: "unset",
                cursor: walkerIndex <= 0 ? "not-allowed" : "pointer",
                opacity: walkerIndex <= 0 ? 0.4 : 1,
                color: "var(--text-2)",
                width: 24,
                height: 24,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "var(--r-sm)",
              }}
            >
              <ChevronLeft size={16} aria-hidden />
            </button>
            <div
              style={{
                fontSize: 12,
                color: "var(--text-2)",
                flex: 1,
                textAlign: "center",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <span>
                State{" "}
                <span className="mono">
                  {walkerIndex >= 0 ? walkerIndex + 1 : 0}
                </span>{" "}
                of <span className="mono">{walkerTotal}</span>
              </span>
              <span
                aria-hidden
                title="Use ← → to walk"
                style={{ fontSize: 10, color: "var(--text-3)" }}
              >
                ← →
              </span>
            </div>
            <button
              type="button"
              onClick={onWalkNext}
              aria-label="Next state"
              disabled={walkerIndex >= walkerTotal - 1}
              style={{
                all: "unset",
                cursor: walkerIndex >= walkerTotal - 1 ? "not-allowed" : "pointer",
                opacity: walkerIndex >= walkerTotal - 1 ? 0.4 : 1,
                color: "var(--text-2)",
                width: 24,
                height: 24,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "var(--r-sm)",
              }}
            >
              <ChevronRight size={16} aria-hidden />
            </button>
          </div>

          {/* Filter chips — narrows the walker, the ←/→ keys, and the tree. */}
          <div
            role="radiogroup"
            aria-label="Filter states"
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 4,
              padding: "8px 8px",
              borderBottom: "1px dashed var(--border)",
            }}
          >
            {(
              [
                { key: "all", label: "All", Icon: LayoutList },
                { key: "failures", label: "Failures", Icon: AlertTriangle },
                { key: "positives", label: "Positives", Icon: CheckCircle2 },
                { key: "universal", label: "Universal", Icon: Globe },
              ] as const
            ).map(({ key, label, Icon }) => {
              const active = filter === key;
              return (
                <button
                  key={key}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => onFilter(key)}
                  style={{
                    all: "unset",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "4px 8px",
                    fontSize: 11,
                    color: active ? "var(--text)" : "var(--text-2)",
                    background: active
                      ? "color-mix(in oklab, var(--info-7) 14%, transparent)"
                      : "transparent",
                    border: `1px solid ${active ? "var(--info-7)" : "var(--border)"}`,
                    borderRadius: 999,
                  }}
                >
                  <Icon size={11} aria-hidden />
                  <span>{label}</span>
                  <span
                    className="mono"
                    style={{ color: "var(--text-3)", fontSize: 10 }}
                  >
                    {filterCounts[key]}
                  </span>
                </button>
              );
            })}
          </div>

          {/* 3-second check audit toggle — dev tool, never reaches client */}
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 12px",
              borderBottom: "1px dashed var(--border)",
              fontSize: 12,
              color: "var(--text-2)",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={auditOn}
              onChange={onToggleAudit}
              style={{ margin: 0, cursor: "pointer" }}
            />
            <span>3-second check</span>
          </label>

          {/* Tree */}
          <div style={{ flex: 1, overflowY: "auto", padding: "8px 6px 16px" }}>

            {/* Universal states */}
            <GroupLabel>Universal states</GroupLabel>
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {universals.map((e) => (
                <li key={e.id}>
                  <EntryButton
                    entry={e}
                    selected={selectedId === e.id}
                    label={stateLabel(e.stateType)}
                    onSelect={onSelect}
                  />
                </li>
              ))}
            </ul>

            {/* Steps */}
            <GroupLabel style={{ marginTop: 10 }}>Steps</GroupLabel>
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {ALL_STEPS.map((n) => {
                const seeded = entriesForStep(n).length > 0;
                const entries = entriesForStepFiltered(n);
                const hasMatches = entries.length > 0;
                const expandable = seeded && hasMatches;
                const open = !!expandedSteps[n] && expandable;
                return (
                  <li key={n}>
                    <button
                      type="button"
                      disabled={!expandable}
                      onClick={() => onToggleStep(n)}
                      aria-expanded={open}
                      style={{
                        all: "unset",
                        cursor: expandable ? "pointer" : "not-allowed",
                        opacity: expandable ? 1 : 0.4,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        width: "100%",
                        boxSizing: "border-box",
                        padding: "6px 8px",
                        borderRadius: "var(--r-sm)",
                        color: "var(--text)",
                        fontSize: 12.5,
                      }}
                    >
                      <ChevronDown
                        size={12}
                        aria-hidden
                        style={{
                          transform: open ? "rotate(0deg)" : "rotate(-90deg)",
                          transition: "transform var(--d-base) var(--ease-out, ease-out)",
                          color: "var(--text-3)",
                          flex: "none",
                        }}
                      />
                      <span className="mono" style={{ color: "var(--text-3)", fontSize: 11 }}>
                        {String(n).padStart(2, "0")}
                      </span>
                      <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {stepTitle(n)}
                      </span>
                      {!seeded ? (
                        <span style={{ fontSize: 10, color: "var(--text-3)", fontStyle: "italic", flex: "none" }}>
                          soon
                        </span>
                      ) : !hasMatches ? (
                        <span style={{ fontSize: 10, color: "var(--text-3)", fontStyle: "italic", flex: "none" }}>
                          no matches
                        </span>
                      ) : (
                        <span
                          aria-label={`${entries.length} states`}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 3,
                            fontSize: 10.5,
                            color: "var(--text-3)",
                            flex: "none",
                          }}
                        >
                          <ListChecks size={11} aria-hidden />
                          <span className="mono">·</span>
                          <span className="mono">{entries.length}</span>
                          <span>states</span>
                        </span>
                      )}
                    </button>
                    {open && (
                      <ul style={{ listStyle: "none", margin: 0, padding: "2px 0 6px 18px" }}>
                        {entries.map((e) => (
                          <li key={e.id}>
                            <EntryButton
                              entry={e}
                              selected={selectedId === e.id}
                              label={entryChildLabel(e)}
                              onSelect={onSelect}
                            />
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </>
      )}
    </aside>
  );
}

function GroupLabel({ children, style }: { children: React.ReactNode; style?: CSSProperties }) {
  return (
    <div
      style={{
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: "var(--text-3)",
        padding: "6px 8px",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function entryChildLabel(e: CatalogEntry): string {
  // For step-children, show the state type label plus, for failure/nudge,
  // a short specifier pulled from the entry id suffix.
  const base = stateLabel(e.stateType);
  if (e.stateType === "failure" || e.stateType === "nudge") {
    const suffix = e.id.split(".").slice(-1)[0]?.replace(/_/g, " ");
    return suffix ? `${base} · ${suffix}` : base;
  }
  return base;
}

function EntryButton({
  entry,
  selected,
  label,
  onSelect,
}: {
  entry: CatalogEntry;
  selected: boolean;
  label: string;
  onSelect: (id: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(entry.id)}
      aria-current={selected ? "true" : undefined}
      style={{
        all: "unset",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 8,
        width: "100%",
        boxSizing: "border-box",
        padding: "5px 8px",
        borderRadius: "var(--r-sm)",
        background: selected ? "var(--surface-2)" : "transparent",
        color: selected ? "var(--text)" : "var(--text-2)",
        fontSize: 12,
        lineHeight: 1.35,
      }}
    >
      <span
        aria-hidden
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: STATE_DOT_COLOR[entry.stateType],
          flex: "none",
        }}
      />
      <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {label}
      </span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// AuditBadge — dev-only overlay showing 3-second-check results for the card.
// Sibling of DoerPanel; never inside [data-surface="client"].
// ---------------------------------------------------------------------------

function AuditBadge({ flags }: { flags: AuditFlag[] }) {
  const clean = flags.length === 0;
  return (
    <div
      data-dev-audit
      style={{
        pointerEvents: "none",
        position: "fixed",
        zIndex: 8,
        right: 84,
        top: 56,
        maxWidth: 380,
        fontSize: 11,
        lineHeight: 1.45,
        color: "var(--text-2)",
        padding: "6px 10px",
        background: "var(--surface)",
        border: `1px dashed ${clean ? "var(--border)" : "var(--warn-7)"}`,
        borderRadius: "var(--r-sm)",
        boxShadow: "var(--sh-sheet)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 600 }}>
        <span aria-hidden style={{ color: clean ? "var(--pos-7)" : "var(--warn-7)" }}>
          {clean ? "✓" : "⚠"}
        </span>
        <span>
          3-second check:{" "}
          {clean ? "clean" : `${flags.length} issue${flags.length === 1 ? "" : "s"}`}
        </span>
      </div>
      {!clean && (
        <ul style={{ margin: "4px 0 0", padding: "0 0 0 16px" }}>
          {flags.map((f, i) => (
            <li key={i} style={{ marginTop: 2 }}>
              {f.detail}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}


