import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ChevronDown, Eye, EyeOff, Pencil, Plus, Settings2 } from "lucide-react";
import { CATALOG, getCatalogEntry } from "@onb/lib/catalog";
import { PublishValidationModal } from "@onb/components/onboarding/PublishValidationModal";
import { SaveStatusPill, type SaveStatus } from "@onb/components/onboarding/SaveStatusPill";
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { StepCard } from "@onb/components/onboarding/StepCard";
import { ClientPreview, CustomizeDrawer } from "@onb/components/onboarding/ClientPreview";
import { DEFAULT_PLACEMENT } from "@onb/lib/types";
import { StepEditorPanel } from "@onb/components/onboarding/StepEditorPanel";
import {
  saveJourney,
  MASTER_PLAN_ID,
  resolveVariant,
  variantTargetDays,
  type Journey,
  type Step,
  type PlanVariant,
} from "@onb/lib/types";


function renumber(steps: Step[]): Step[] {
  return steps.map((s, i) => ({ ...s, order: i + 1 }));
}

export function JourneyEditor({
  initialJourney,
  initialStepId,
  initialBanner,
  onRedoSetup,
}: {
  initialJourney: Journey;
  initialStepId?: string;
  initialBanner?: { tone: "info" | "pos"; text: string };
  onRedoSetup?: () => void;
}) {

  const [journey, setJourney] = useState<Journey>(initialJourney);
  const [editingId, setEditingId] = useState<string | null>(initialStepId ?? null);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [activeVariantId, setActiveVariantId] = useState<string>(MASTER_PLAN_ID);
  useEffect(() => {
    if (initialStepId) setEditingId(initialStepId);
  }, [initialStepId]);




  // Auto-save status
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const savingTimer = useRef<number | null>(null);
  const persist = useCallback((next: Journey) => {
    saveJourney(next);
    setSaveStatus("saving");
    if (savingTimer.current) window.clearTimeout(savingTimer.current);
    savingTimer.current = window.setTimeout(() => {
      setSaveStatus("saved");
      setLastSavedAt(Date.now());
    }, 250);
  }, []);
  useEffect(() => () => {
    if (savingTimer.current) window.clearTimeout(savingTimer.current);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function updateStep(stepId: string, patch: Partial<Step>) {
    setJourney((prev) => {
      const next: Journey = {
        ...prev,
        steps: prev.steps.map((s) => (s.id === stepId ? { ...s, ...patch } : s)),
      };
      persist(next);
      return next;
    });
  }

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    setJourney((prev) => {
      const oldIdx = prev.steps.findIndex((s) => s.id === active.id);
      const newIdx = prev.steps.findIndex((s) => s.id === over.id);
      if (oldIdx < 0 || newIdx < 0) return prev;
      const moved = arrayMove(prev.steps, oldIdx, newIdx);
      const next: Journey = { ...prev, steps: renumber(moved) };
      persist(next);
      return next;
    });
  }



  const [publishOpen, setPublishOpen] = useState(false);
  const [previewCollapsed, setPreviewCollapsed] = useState(false);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [editorFocusField, setEditorFocusField] = useState<
    "deepLink" | "tier" | "bookingEmbedUrl" | undefined
  >(undefined);


  const [pickerAt, setPickerAt] = useState<number | null>(null);
  const [removeTarget, setRemoveTarget] = useState<string | null>(null);

  function insertStep(atIndex: number, type: string) {
    const entry = getCatalogEntry(type);
    const newStep: Step = {
      id:
        "s" +
        Date.now().toString(36) +
        Math.random().toString(36).slice(2, 5),
      order: 0,
      title: entry.defaultTitle,
      type,
      tier: entry.tier,
      owner: entry.owner,
      slaHours: entry.slaHours,
      deepLink: entry.deepLink,
      videoRef: "default",
      dependencies: [],
      state: "not_started",
    };
    setJourney((prev) => {
      const next = [...prev.steps];
      next.splice(atIndex, 0, newStep);
      const j: Journey = { ...prev, steps: renumber(next) };
      persist(j);
      return j;
    });
    setPickerAt(null);
    setEditingId(newStep.id);
  }

  function performRemove(stepId: string, clearDeps: boolean) {
    setJourney((prev) => {
      const steps = prev.steps
        .filter((s) => s.id !== stepId)
        .map((s) =>
          clearDeps && s.dependencies.includes(stepId)
            ? { ...s, dependencies: s.dependencies.filter((d) => d !== stepId) }
            : s
        );
      const j: Journey = { ...prev, steps: renumber(steps) };
      persist(j);
      return j;
    });
    if (editingId === stepId) setEditingId(null);
    setRemoveTarget(null);
  }

  const removingStep = removeTarget
    ? journey.steps.find((s) => s.id === removeTarget) ?? null
    : null;
  const removingDependents = removingStep
    ? journey.steps.filter((s) => s.dependencies.includes(removingStep.id))
    : [];



  const isPublished = journey.status === "published";
  const draftVersion = isPublished ? journey.version + 1 : journey.version;

  // UI-local dirty tracking (no model change). Snapshot the published baseline on mount;
  // compare name/targetDays/steps to detect operator edits. Reset after a successful publish.
  const baselineRef = useRef<Journey | null>(
    journey.status === "published"
      ? (JSON.parse(JSON.stringify(journey)) as Journey)
      : null
  );
  const [baselineTick, setBaselineTick] = useState(0);

  const stepDiff = useMemo(() => {
    const b = baselineRef.current;
    const edited = new Set<string>();
    const added = new Set<string>();
    if (!b) return { edited, added, removed: 0, changedSteps: 0 };
    const baseById = new Map(b.steps.map((s) => [s.id, JSON.stringify(s)]));
    for (const s of journey.steps) {
      const prev = baseById.get(s.id);
      if (prev == null) added.add(s.id);
      else if (prev !== JSON.stringify(s)) edited.add(s.id);
    }
    const currentIds = new Set(journey.steps.map((s) => s.id));
    const removed = b.steps.filter((s) => !currentIds.has(s.id)).length;
    return {
      edited,
      added,
      removed,
      changedSteps: edited.size + added.size + removed,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [journey, baselineTick]);

  const dirty = useMemo(() => {
    const b = baselineRef.current;
    if (!b) return false;
    if (b.name !== journey.name) return true;
    if (b.targetDays !== journey.targetDays) return true;
    return stepDiff.changedSteps > 0;
  }, [journey, stepDiff]);

  const changeCount = useMemo(() => {
    const b = baselineRef.current;
    if (!b) return 0;
    let n = stepDiff.changedSteps;
    if (b.name !== journey.name) n += 1;
    if (b.targetDays !== journey.targetDays) n += 1;
    return n;
  }, [journey, stepDiff]);

  type Lifecycle = "draft" | "live" | "editing";
  const lifecycle: Lifecycle = !isPublished ? "draft" : dirty ? "editing" : "live";
  const chipClass =
    lifecycle === "draft"
      ? "badge badge-neutral no-dot"
      : lifecycle === "live"
        ? "badge badge-pos no-dot"
        : "badge badge-warn no-dot";
  const chipText =
    lifecycle === "draft"
      ? "Draft — not published"
      : lifecycle === "live"
        ? `Live · ${journey.clientCount} clients`
        : `Editing — changes apply to new clients`;

  const showMigrate = isPublished && journey.clientCount > 0 && dirty;

  // Leave-guard: warn if user closes/reloads while there are unpublished changes.
  useEffect(() => {
    if (!dirty) return;
    function onBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);



  return (
    <>
      {initialBanner && !bannerDismissed && (
        <div
          role="status"
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 12,
            padding: "12px 14px",
            marginBottom: 16,
            borderRadius: "var(--r-md)",
            background: "var(--pos-1, var(--bg-subtle))",
            border: "1px solid var(--pos-3, var(--border))",
            color: "var(--text)",
            fontSize: 13.5,
            lineHeight: 1.5,
          }}
        >
          <span
            aria-hidden
            style={{
              width: 8,
              height: 8,
              marginTop: 7,
              borderRadius: "50%",
              background: "var(--pos-7)",
              flexShrink: 0,
            }}
          />
          <span style={{ flex: 1 }}>{initialBanner.text}</span>
          <button
            type="button"
            aria-label="Dismiss banner"
            onClick={() => setBannerDismissed(true)}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              fontSize: 16,
              lineHeight: 1,
              color: "var(--text-3)",
              cursor: "pointer",
            }}
          >
            ×
          </button>
        </div>
      )}
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1
            style={{
              fontSize: 20,
              fontWeight: 600,
              color: "var(--text)",
              margin: 0,
              lineHeight: 1.3,
            }}
          >
            {journey.name}
          </h1>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 10,
              flexWrap: "wrap",
            }}
          >
            <span className={chipClass}>{chipText}</span>
            <TargetChip
              value={journey.targetDays}
              onCommit={(n) =>
                setJourney((prev) => {
                  const next = { ...prev, targetDays: n };
                  persist(next);
                  return next;
                })
              }
            />
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <SaveStatusPill status={saveStatus} lastSavedAt={lastSavedAt} />
          {onRedoSetup && (
            <button
              className="btn btn-ghost"
              type="button"
              onClick={onRedoSetup}
              style={{ fontSize: 13 }}
              title="Reopen the setup wizard prefilled from this journey"
            >
              Redo setup
            </button>
          )}
          <button
            className="btn"
            type="button"
            onClick={() => setCustomizeOpen((o) => !o)}
            aria-expanded={customizeOpen}
            aria-haspopup="dialog"
            title="Customize the client experience (brand color, placement)"
          >
            <Settings2 size={14} aria-hidden style={{ marginRight: 6 }} />
            Customize
          </button>
          <button
            className="btn btn-ghost"
            type="button"
            aria-pressed={previewCollapsed}
            onClick={() => setPreviewCollapsed((v) => !v)}
          >
            {previewCollapsed ? (
              <EyeOff size={14} aria-hidden style={{ marginRight: 6 }} />
            ) : (
              <Eye size={14} aria-hidden style={{ marginRight: 6 }} />
            )}
            {previewCollapsed ? "Hide preview" : "Preview"}
          </button>
          <button
            className="btn btn-primary"
            type="button"
            onClick={() => setPublishOpen(true)}
            title={
              dirty
                ? `${changeCount} change${changeCount === 1 ? "" : "s"} since you last published`
                : undefined
            }
            style={
              dirty
                ? { boxShadow: "inset 3px 0 0 0 var(--warn-7)" }
                : undefined
            }
          >
            Publish
          </button>
        </div>
      </div>


      {/* Split */}
      <div style={{ display: "flex", gap: 16, marginTop: 16, alignItems: "flex-start" }}>
        <div
          style={{
            width: previewCollapsed ? "100%" : "58%",
            display: "flex",
            flexDirection: "column",
            gap: 8,
            position: "relative",
          }}
        >
          <VariantSwitcher
            journey={journey}
            activeVariantId={activeVariantId}
            onChange={setActiveVariantId}
          />
          {activeVariantId === MASTER_PLAN_ID ? (
            <>
              <div style={{ fontSize: 13, color: "var(--text-3)", padding: "0 4px 4px" }}>
                {journey.steps.length} steps · target Day {journey.targetDays}
              </div>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={journey.steps.map((s) => s.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {journey.steps.map((s, i) => (
                    <div key={s.id}>
                      <BetweenRows
                        open={pickerAt === i}
                        onOpen={() => setPickerAt(i)}
                        onClose={() => setPickerAt(null)}
                        onPick={(type) => insertStep(i, type)}
                      />
                      <StepCard
                        step={s}
                        journey={journey}
                        onClick={() => setEditingId(s.id)}
                        onRemove={() => setRemoveTarget(s.id)}
                        edited={stepDiff.edited.has(s.id)}
                        isNew={stepDiff.added.has(s.id)}
                      />

                    </div>
                  ))}
                </SortableContext>
              </DndContext>

              <AddStepRow
                open={pickerAt === journey.steps.length}
                onOpen={() => setPickerAt(journey.steps.length)}
                onClose={() => setPickerAt(null)}
                onPick={(type) => insertStep(journey.steps.length, type)}
              />
            </>
          ) : (
            <VariantEditor
              journey={journey}
              variantId={activeVariantId}
              onJourneyChange={(next) => {
                setJourney(next);
                persist(next);
              }}
            />
          )}


          {editingId && (
            <StepEditorPanel
              journey={journey}
              stepId={editingId}
              onChange={(patch) => updateStep(editingId, patch)}
              onClose={() => {
                setEditingId(null);
                setEditorFocusField(undefined);
              }}
              onRemove={() => setRemoveTarget(editingId)}
              focusField={editorFocusField}
            />
          )}
        </div>
        {!previewCollapsed && (
          <div style={{ width: "42%" }}>
            <ClientPreview
              journey={journey}
              onJourneyChange={(next) => {
                setJourney(next);
                persist(next);
              }}
              onOpenCustomize={() => setCustomizeOpen(true)}
            />

          </div>
        )}
      </div>

      <CustomizeDrawer
        open={customizeOpen}
        brandColor={journey.brandColor}
        onBrandColorChange={(next) => {
          const updated = { ...journey, brandColor: next };
          setJourney(updated);
          persist(updated);
        }}
        placement={journey.placement ?? DEFAULT_PLACEMENT}
        onPlacementChange={(next) => {
          const updated = { ...journey, placement: next };
          setJourney(updated);
          persist(updated);
        }}
        onClose={() => setCustomizeOpen(false)}
      />


      <PublishValidationModal
        open={publishOpen}
        journey={journey}
        
        clientCount={journey.clientCount}
        showMigration={showMigrate}
        changeCount={changeCount}
        onClose={() => setPublishOpen(false)}
        onPublish={(scope) => {
          if (scope === "all") {
            console.info("migrate clients", {
              count: journey.clientCount,
              version: draftVersion,
            });
          }
          // Snapshot the just-published state so the chip flips back to "Live".
          baselineRef.current = JSON.parse(JSON.stringify(journey)) as Journey;
          setBaselineTick((t) => t + 1);
          setSaveStatus("published");
          setLastSavedAt(Date.now());
          window.setTimeout(() => setSaveStatus("saved"), 1500);
          setPublishOpen(false);
        }}
        onFix={(stepId, field) => {
          setPublishOpen(false);
          setEditingId(stepId);
          setEditorFocusField(field);
        }}
      />


      {removingStep && (
        <RemoveStepDialog
          stepTitle={removingStep.title}
          dependents={removingDependents}
          onCancel={() => setRemoveTarget(null)}
          onConfirm={() =>
            performRemove(removingStep.id, removingDependents.length > 0)
          }
        />
      )}

    </>
  );
}



function TargetChip({
  value,
  onCommit,
}: {
  value: number;
  onCommit: (n: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  const [hover, setHover] = useState(false);

  function commit() {
    const n = Math.round(Number(draft));
    if (Number.isFinite(n) && n >= 1 && n <= 365) onCommit(n);
    else setDraft(String(value));
    setEditing(false);
  }

  if (editing) {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          fontSize: 12,
          color: "var(--text-2)",
        }}
      >
        Target: fully onboarded in{" "}
        <input
          type="number"
          min={1}
          max={365}
          value={draft}
          autoFocus
          onFocus={(e) => e.currentTarget.select()}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            else if (e.key === "Escape") {
              setDraft(String(value));
              setEditing(false);
            }
          }}
          className="mono"
          style={{
            width: 48,
            height: 22,
            padding: "0 6px",
            border: "1px solid var(--border)",
            borderRadius: "var(--r-sm)",
            background: "var(--surface)",
            color: "var(--text)",
            fontSize: 12,
            textAlign: "right",
          }}
        />{" "}
        days
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        setDraft(String(value));
        setEditing(true);
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: "transparent",
        border: "none",
        padding: 0,
        fontSize: 12,
        color: "var(--text-2)",
        cursor: "pointer",
        fontFamily: "var(--font-ui)",
      }}
      title="Edit target"
    >
      Target: fully onboarded in{" "}
      <span className="mono" style={{ color: "var(--text)" }}>
        {value}
      </span>{" "}
      days
      {hover && <Pencil size={12} aria-hidden style={{ color: "var(--text-3)" }} />}
    </button>
  );
}

function StepTypePicker({
  onPick,
  onClose,
  align = "left",
}: {
  onPick: (type: string) => void;
  onClose: () => void;
  align?: "left" | "center";
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const catalogItems = CATALOG.filter((c) => c.type !== "custom_manual");

  return (
    <div
      ref={ref}
      role="menu"
      className="card"
      style={{
        position: "absolute",
        top: "calc(100% + 6px)",
        left: align === "left" ? 0 : "50%",
        transform: align === "center" ? "translateX(-50%)" : undefined,
        width: 280,
        maxHeight: 360,
        overflowY: "auto",
        padding: 6,
        zIndex: 25,
        boxShadow: "var(--sh-sheet)",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {catalogItems.map((c) => (
        <PickerRow key={c.type} onClick={() => onPick(c.type)}>
          {c.label}
        </PickerRow>
      ))}
      <hr
        style={{
          border: 0,
          borderTop: "1px solid var(--border-soft)",
          margin: "4px 0",
        }}
      />
      <PickerRow onClick={() => onPick("custom_manual")}>
        Custom step (you confirm completion)
      </PickerRow>
    </div>
  );
}

function PickerRow({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      style={{
        all: "unset",
        display: "block",
        width: "100%",
        padding: "8px 10px",
        fontSize: 13,
        color: "var(--text)",
        cursor: "pointer",
        borderRadius: "var(--r-sm)",
        boxSizing: "border-box",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-subtle)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = "transparent";
      }}
    >
      {children}
    </button>
  );
}

function BetweenRows({
  open,
  onOpen,
  onClose,
  onPick,
}: {
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  onPick: (type: string) => void;
}) {
  const [hover, setHover] = useState(false);
  const active = hover || open;
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: "relative",
        height: 12,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {active && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            left: 16,
            right: 16,
            top: "50%",
            height: 1,
            background: "var(--border-soft)",
          }}
        />
      )}
      {active && (
        <button
          type="button"
          aria-label="Insert step here"
          onClick={(e) => {
            e.stopPropagation();
            open ? onClose() : onOpen();
          }}
          style={{
            position: "relative",
            zIndex: 1,
            width: 18,
            height: 18,
            borderRadius: 999,
            border: "1px solid var(--border)",
            background: "var(--surface)",
            color: "var(--text-2)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            padding: 0,
          }}
        >
          <Plus size={12} aria-hidden />
        </button>
      )}
      {open && <StepTypePicker onPick={onPick} onClose={onClose} align="center" />}
    </div>
  );
}

function AddStepRow({
  open,
  onOpen,
  onClose,
  onPick,
}: {
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  onPick: (type: string) => void;
}) {
  return (
    <div style={{ position: "relative", marginTop: 4 }}>
      <button
        type="button"
        onClick={() => (open ? onClose() : onOpen())}
        style={{
          width: "100%",
          height: 44,
          border: "1px dashed var(--border)",
          borderRadius: "var(--r-md)",
          background: "transparent",
          color: "var(--text-2)",
          fontSize: 13,
          fontFamily: "var(--font-ui)",
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-subtle)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = "transparent";
        }}
      >
        <Plus size={14} aria-hidden /> Add step
      </button>
      {open && <StepTypePicker onPick={onPick} onClose={onClose} />}
    </div>
  );
}

function RemoveStepDialog({
  stepTitle,
  dependents,
  onCancel,
  onConfirm,
}: {
  stepTitle: string;
  dependents: Step[];
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const hasDeps = dependents.length > 0;
  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onCancel}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.32)",
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        className="card"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 460,
          maxWidth: "100%",
          padding: 24,
          boxShadow: "var(--sh-sheet)",
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>
          Remove this step?
        </div>
        <div
          style={{
            marginTop: 8,
            fontSize: 13,
            color: "var(--text-2)",
            lineHeight: 1.5,
          }}
        >
          {stepTitle}
        </div>
        {hasDeps && (
          <ul
            style={{
              marginTop: 12,
              padding: "10px 12px",
              listStyle: "none",
              background: "var(--bg-subtle)",
              border: "1px solid var(--border-soft)",
              borderRadius: "var(--r-sm)",
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            {dependents.map((d) => (
              <li
                key={d.id}
                style={{ fontSize: 12, color: "var(--text-2)" }}
              >
                <strong style={{ color: "var(--text)", fontWeight: 600 }}>
                  {d.title}
                </strong>{" "}
                depends on this step
              </li>
            ))}
          </ul>
        )}
        <div className="modal-foot" style={{ marginTop: 20 }}>
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            style={{
              height: 32,
              padding: "0 14px",
              background: "transparent",
              border: "1px solid var(--neg-7)",
              borderRadius: "var(--r-sm)",
              color: "var(--neg-9)",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              fontFamily: "var(--font-ui)",
            }}
          >
            {hasDeps ? "Remove and clear dependency" : "Remove step"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============ Plan-variant switcher + editor ============ */

function VariantSwitcher({
  journey,
  activeVariantId,
  onChange,
}: {
  journey: Journey;
  activeVariantId: string;
  onChange: (id: string) => void;
}) {
  const variants = journey.planVariants ?? [];
  if (variants.length <= 1) return null;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        padding: "4px 0 8px",
        fontSize: 12,
        color: "var(--text-3)",
      }}
    >
      <span>Editing:</span>
      <span style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
        <select
          value={activeVariantId}
          onChange={(e) => onChange(e.target.value)}
          aria-label="Plan variant"
          style={{
            appearance: "none",
            WebkitAppearance: "none",
            MozAppearance: "none",
            background: "transparent",
            border: "none",
            outline: "none",
            color: "var(--text-2)",
            fontWeight: 500,
            fontSize: 12,
            padding: "0 18px 0 4px",
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          {variants.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </select>
        <ChevronDown
          size={12}
          style={{
            position: "absolute",
            right: 2,
            pointerEvents: "none",
            color: "var(--text-3)",
          }}
        />
      </span>
    </div>
  );
}

function VariantEditor({
  journey,
  variantId,
  onJourneyChange,
}: {
  journey: Journey;
  variantId: string;
  onJourneyChange: (next: Journey) => void;
}) {
  const variant = resolveVariant(journey, variantId);
  const target = variantTargetDays(journey, variantId);
  // Selected step ids. If stepIds is omitted, the variant inherits all master steps.
  const selected = new Set<string>(variant.stepIds ?? journey.steps.map((s) => s.id));

  function updateVariant(patch: Partial<PlanVariant>) {
    const next: Journey = {
      ...journey,
      planVariants: (journey.planVariants ?? []).map((v) =>
        v.id === variantId ? { ...v, ...patch } : v,
      ),
    };
    onJourneyChange(next);
  }

  function toggleStep(id: string) {
    const nextIds = journey.steps
      .map((s) => s.id)
      .filter((sid) => (sid === id ? !selected.has(sid) : selected.has(sid)));
    updateVariant({ stepIds: nextIds });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "10px 12px",
          background: "var(--bg-subtle)",
          border: "1px solid var(--border-soft)",
          borderRadius: "var(--r-md)",
        }}
      >
        <span style={{ fontSize: 12, color: "var(--text-2)" }}>Target days</span>
        <input
          type="number"
          min={1}
          max={180}
          value={target}
          onChange={(e) => {
            const n = parseInt(e.target.value, 10);
            if (!Number.isNaN(n)) updateVariant({ targetDays: n });
          }}
          className="mono"
          style={{
            height: 28,
            width: 64,
            padding: "0 8px",
            fontFamily: "var(--font-mono)",
            fontSize: 13,
            textAlign: "center",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--r-sm)",
            color: "var(--text)",
          }}
        />
        <span
          style={{
            marginLeft: "auto",
            fontSize: 11,
            color: "var(--text-3)",
            fontStyle: "italic",
          }}
        >
          Editing step content updates it for every plan.
        </span>
      </div>
      <div style={{ fontSize: 13, color: "var(--text-3)", padding: "0 4px" }}>
        {selected.size} of {journey.steps.length} steps · target Day {target}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {journey.steps.map((s) => {
          const on = selected.has(s.id);
          return (
            <label
              key={s.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                minHeight: 36,
                padding: "0 12px",
                borderRadius: "var(--r-sm)",
                cursor: "pointer",
                background: "var(--surface)",
                border: "1px solid var(--border-soft)",
              }}
            >
              <input
                type="checkbox"
                checked={on}
                onChange={() => toggleStep(s.id)}
                aria-label={s.title}
                style={{ cursor: "pointer", margin: 0 }}
              />
              <span
                className="mono"
                style={{ fontSize: 11, color: "var(--text-3)", minWidth: 24 }}
              >
                {s.order}
              </span>
              <span
                style={{
                  fontSize: 13.5,
                  color: on ? "var(--text)" : "var(--text-3)",
                  fontWeight: on ? 500 : 400,
                }}
              >
                {s.title}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

