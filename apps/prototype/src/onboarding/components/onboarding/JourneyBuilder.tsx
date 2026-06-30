import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "@onb/router-compat";
import {
  Check,
  ChevronRight,
  GripVertical,
  Info,
  Lock,
  Plus,
} from "lucide-react";
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
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  STANDARD_GHL_JOURNEY,
  saveJourney,
  newDraftId,
  MASTER_PLAN_ID,
  DEFAULT_PLACEMENT,
  type Journey,
  type PlanVariant,
  type Placement,
  type Step,
} from "@onb/lib/types";
import {
  canAutoDetect,
  defaultDetector,
  getCatalogEntry,
} from "@onb/lib/catalog";

import {
  BRAND_PRESETS,
  getHighLevelBrandColor,
  normalizeHex,
} from "@onb/lib/clientAccent";
import { detectProvider, parseVideoRef, PROVIDER_LABEL, toEmbedUrl, GOCSM_TUTORIAL_EMBED } from "@onb/lib/video";
import { PlacementTab } from "@onb/components/onboarding/ClientPreview";

export type BuilderStep = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

const STEP_LABELS: Record<BuilderStep, string> = {
  1: "Steps",
  2: "Order",
  3: "Plans",
  4: "Timing",
  5: "Experience",
  6: "Placement",
  7: "Branding",
  8: "Videos",
  9: "Review videos",
};

const STEP_QUESTIONS: Record<BuilderStep, { title: string; sub?: ReactNode }> = {
  1: {
    title: "Which steps should your clients complete?",
    sub: "GoCSM watches HighLevel and checks these off automatically — your clients don't tick boxes.",
  },
  2: {
    title: "What order should they go in?",
    sub: "We've ordered these the way GoCSM recommends — drag to change.",
  },
  3: {
    title: "Same checklist for every plan?",
    sub: "One simple list for everyone, or tailor it per plan.",
  },
  4: {
    title: "How long should onboarding take?",
    sub: "The promise you make on your sales calls.",
  },
  5: {
    title: "What do your clients see?",
    sub: "Show them a guided checklist, or track silently in the background.",
  },
  6: {
    title: "Where should your clients see this?",
    sub: "Pick the spot inside HighLevel where the checklist lives.",
  },
  7: {
    title: "Brand the checklist your clients see.",
    sub: "Your accent color and logo replace GoCSM's on the client surface.",
  },
  8: {
    title: "Add videos to any steps?",
    sub: "A short video on each step makes onboarding feel personal.",
  },
  9: {
    title: "Review your step videos.",
    sub: "Attach a video to any step that benefits from a walkthrough.",
  },
};

function activePath(draft: Journey): BuilderStep[] {
  const base: BuilderStep[] = [1, 2, 3, 4, 5];
  if (draft.experienceMode === "tracking_only") return base;
  const withBrand: BuilderStep[] = [...base, 6, 7, 8];
  if (draft.showVideos === true) return [...withBrand, 9];
  return withBrand;
}

function isFinalStep(s: BuilderStep, draft: Journey): boolean {
  const path = activePath(draft);
  return path[path.length - 1] === s;
}


/* ============ Groups for Step 1 ============ */

const GROUPS: { label: string; types: string[] }[] = [
  { label: "Messaging & compliance", types: ["phone_purchase", "a2p_brand", "a2p_campaign"] },
  { label: "Email", types: ["email_domain"] },
  { label: "Website", types: ["custom_domain", "funnel_publish"] },
  {
    label: "CRM",
    types: [
      "business_profile",
      "snapshot_workflows",
      "calendar_sync",
      "form_create",
      "pipeline_setup",
    ],
  },
  { label: "Reputation", types: ["gbp_connect", "facebook_connect"] },
  { label: "Payments", types: ["stripe_connect"] },
  { label: "Kickoff", types: ["kickoff_call"] },
];

/** Catalog-order sort key — used to keep draft.steps stable when toggling. */
const CATALOG_ORDER: string[] = GROUPS.flatMap((g) => g.types);

/* ============ Smart-default order for Step 2 ============ */

const SMART_DEFAULT_ORDER: string[] = [
  "business_profile",
  "phone_purchase",
  "a2p_brand",
  "a2p_campaign",
  "email_domain",
  "custom_domain",
  "funnel_publish",
  "calendar_sync",
  "form_create",
  "pipeline_setup",
  "gbp_connect",
  "facebook_connect",
  "stripe_connect",
  "snapshot_workflows",
  "kickoff_call",
];

const CARRIER_CHAIN: string[] = ["phone_purchase", "a2p_brand", "a2p_campaign"];

/* ============ Seed plans for Step 3 ============ */

type PlanFeatures = { phone: boolean; website: boolean; payments: boolean };

const SEED_PLANS: { id: string; name: string; features: PlanFeatures }[] = [
  { id: "pilot", name: "Pilot", features: { phone: false, website: false, payments: true } },
  { id: "growth", name: "Growth", features: { phone: true, website: true, payments: true } },
  { id: "scale", name: "Scale", features: { phone: true, website: true, payments: true } },
];

const FEATURE_GATED_TYPES: Record<string, keyof PlanFeatures | undefined> = {
  phone_purchase: "phone",
  a2p_brand: "phone",
  a2p_campaign: "phone",
  custom_domain: "website",
  funnel_publish: "website",
  stripe_connect: "payments",
};

const PLAN_DEFAULT_TARGET_DAYS: Record<string, number> = {
  pilot: 7,
  growth: 14,
  scale: 14,
};

/* ============ Helpers ============ */

function freshDraft(): Journey {
  const seed = STANDARD_GHL_JOURNEY;
  return {
    id: newDraftId(),
    name: "Untitled journey",
    status: "draft",
    version: 1,
    targetDays: seed.targetDays,
    clientCount: 0,
    steps: seed.steps.map((s) => ({
      ...s,
      state: "not_started",
      mapping: { confidence: "fact", source: "template" },
      detector: defaultDetector(s.type),
    })),
    experienceMode: "guided",
    planScoping: "single",
    planVariants: [{ id: MASTER_PLAN_ID, name: "All plans", isMaster: true }],
  };
}

function newStepFromCatalog(type: string, title?: string): Step {
  const entry = getCatalogEntry(type);
  return {
    id: "s" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
    order: 0,
    title: title ?? entry.defaultTitle,
    type,
    tier: entry.tier,
    owner: entry.owner,
    slaHours: entry.slaHours,
    deepLink: entry.deepLink,
    dependencies: [],
    state: "not_started",
    mapping: {
      confidence: "fact",
      source: type === "custom_manual" ? "scratch" : "template",
    },
    detector: defaultDetector(type),
  };
}

function renumber(steps: Step[]): Step[] {
  return steps.map((s, i) => ({ ...s, order: i + 1 }));
}

function catalogIndex(type: string): number {
  const i = CATALOG_ORDER.indexOf(type);
  return i === -1 ? CATALOG_ORDER.length : i;
}

/* ============ JourneyBuilder ============ */

export function JourneyBuilder({
  mode,
  initialJourney,
  initialStep = 1,
  onFinish,
  onSkipToFineTune,
}: {
  mode: "create" | "edit";
  initialJourney?: Journey;
  initialStep?: BuilderStep;
  onFinish: (journey: Journey) => void;
  onSkipToFineTune: (draft: Journey) => void;
}) {
  const navigate = useNavigate();
  const [step, setStep] = useState<BuilderStep>(initialStep);
  const [draft, setDraft] = useState<Journey>(
    () => initialJourney ?? freshDraft(),
  );
  const [validationError, setValidationError] = useState<string | null>(null);

  
  const path = useMemo(() => activePath(draft), [draft.experienceMode, draft.showVideos]);
  const lastInPath = path[path.length - 1];
  const maxReachable: BuilderStep = mode === "edit" ? lastInPath : step;

  // If the active path shrinks (e.g. user flips to tracking-only while on Step 6),
  // clamp current step back into the path.
  useEffect(() => {
    if (!path.includes(step)) setStep(lastInPath);
  }, [path, step, lastInPath]);

  const canJumpTo = (target: BuilderStep) =>
    path.includes(target) && target <= maxReachable;
  const goTo = (target: BuilderStep) => {
    if (!canJumpTo(target)) return;
    setValidationError(null);
    setStep(target);
  };
  const goBack = () => {
    const i = path.indexOf(step);
    if (i <= 0) return;
    setValidationError(null);
    setStep(path[i - 1]);
  };
  const goNext = () => {
    if (step === 4) {
      const err = validateTiming(draft);
      if (err) {
        setValidationError(err);
        return;
      }
    }
    if (step === 8 && draft.showVideos === undefined) {
      setValidationError("Pick one to continue.");
      return;
    }
    setValidationError(null);
    if (isFinalStep(step, draft)) {
      const saved = saveJourney(draft);
      onFinish(saved);
      return;
    }
    const i = path.indexOf(step);
    setStep(path[i + 1]);
  };

  const onCancel = () => navigate({ to: "/onboarding" });
  const onSkip = () => onSkipToFineTune(draft);

  const canBack = path.indexOf(step) > 0;
  const nextLabel = isFinalStep(step, draft) ? "Finish & fine-tune" : "Continue";

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr)",
        gap: 24,
        alignItems: "start",
        ["--wizard-footer-h" as never]: "64px",
      } as React.CSSProperties}
    >
      <div
        style={{
          maxWidth: 760,
          margin: "0 auto",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: 24,
          padding: "24px 16px 16px",
        }}
      >
        <BuilderHeader
          step={step}
          mode={mode}
          path={path}
          onCancel={onCancel}
          onJump={goTo}
          canJumpTo={canJumpTo}
        />

        <StepBody step={step} draft={draft} setDraft={setDraft} />

        {validationError && (
          <div
            role="alert"
            style={{
              fontSize: 13,
              color: "var(--warn-9, var(--text-2))",
              padding: "8px 12px",
              background: "var(--warn-1, var(--bg-subtle))",
              border: "1px solid var(--warn-7, var(--border))",
              borderRadius: "var(--r-sm)",
            }}
          >
            {validationError}
          </div>
        )}

        <div aria-hidden style={{ height: "var(--wizard-footer-h, 64px)" }} />
      </div>

      <WizardFooter
        canBack={canBack}
        onBack={goBack}
        onSkip={onSkip}
        onNext={goNext}
        nextLabel={nextLabel}
      />
    </div>
  );
}

/* ============ Header ============ */

function BuilderHeader({
  step,
  mode,
  path,
  onCancel,
  onJump,
  canJumpTo,
}: {
  step: BuilderStep;
  mode: "create" | "edit";
  path: BuilderStep[];
  onCancel: () => void | Promise<void>;
  onJump: (target: BuilderStep) => void;
  canJumpTo: (target: BuilderStep) => boolean;
}) {
  const dots = path;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        flexWrap: "nowrap",
        padding: "12px 16px",
        borderBottom: "1px solid var(--border-soft, var(--border))",
        minHeight: 48,
      }}
    >


      <div
        role="tablist"
        aria-label="Builder steps"
        style={{
          flex: "1 1 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 0,
          minWidth: 0,
        }}
      >
        {dots.map((idx, i) => {
          const active = idx === step;
          const past = idx < step;
          const reachable = canJumpTo(idx);
          const pillBg = active
            ? "var(--brand-7, var(--info-7))"
            : past
              ? "var(--text-2)"
              : "transparent";
          const pillBorder = active || past ? "1px solid transparent" : "1px solid var(--border)";
          const pillColor = active || past ? "#fff" : "var(--text-3)";
          return (
            <span
              key={idx}
              style={{ display: "inline-flex", alignItems: "center", flex: "0 0 auto" }}
            >
              {i > 0 && (
                <span
                  aria-hidden
                  style={{
                    flex: "1 1 auto",
                    minWidth: 12,
                    maxWidth: 40,
                    height: 1,
                    background: past || active ? "var(--text-3)" : "var(--border)",
                    margin: "0 6px",
                    alignSelf: "center",
                  }}
                />
              )}
              <button
                type="button"
                role="tab"
                aria-selected={active}
                aria-disabled={!reachable}
                disabled={!reachable}
                onClick={() => reachable && onJump(idx)}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  cursor: reachable ? "pointer" : "not-allowed",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  fontFamily: "var(--font-ui)",
                }}
              >
                <span
                  aria-hidden
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    background: pillBg,
                    border: pillBorder,
                    color: pillColor,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    fontWeight: 600,
                    fontFamily: "var(--font-mono)",
                    fontVariantNumeric: "tabular-nums",
                    transition: "all var(--d-base, 200ms) ease-out",
                  }}
                >
                  {past ? <Check size={12} strokeWidth={2.5} /> : idx}
                </span>
                {active && (
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "var(--text)",
                      whiteSpace: "nowrap",
                      marginLeft: 2,
                    }}
                  >
                    {STEP_LABELS[idx]}
                  </span>
                )}
              </button>
            </span>
          );
        })}
      </div>

      <div
        style={{
          flex: "0 0 auto",
          minWidth: 64,
          textAlign: "right",
          whiteSpace: "nowrap",
        }}
      >
        <button
          type="button"
          onClick={onCancel}
          style={{
            background: "none",
            border: "none",
            padding: 0,
            color: "var(--text-3)",
            fontSize: 13,
            cursor: "pointer",
            fontFamily: "var(--font-ui)",
          }}
        >
          {mode === "edit" ? "Cancel edit" : "Cancel"}
        </button>
      </div>
    </div>
  );
}

/* ============ Step body router ============ */

function StepBody({
  step,
  draft,
  setDraft,
}: {
  step: BuilderStep;
  draft: Journey;
  setDraft: (j: Journey) => void;
}) {
  const { title, sub } = STEP_QUESTIONS[step];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <ScreenHead question={title} sub={sub} />
      {step === 1 && <Step1Picker draft={draft} setDraft={setDraft} />}
      {step === 2 && <Step2Order draft={draft} setDraft={setDraft} />}
      {step === 3 && <Step3Plans draft={draft} setDraft={setDraft} />}
      {step === 4 && <Step4Timing draft={draft} setDraft={setDraft} />}
      {step === 5 && <Step5Experience draft={draft} setDraft={setDraft} />}
      {step === 6 && <Step6Placement draft={draft} setDraft={setDraft} />}
      {step === 7 && <Step6Branding draft={draft} setDraft={setDraft} />}
      {step === 8 && <Step7Videos draft={draft} setDraft={setDraft} />}
      {step === 9 && <Step8ReviewVideos draft={draft} setDraft={setDraft} />}
    </div>
  );
}

function ScreenHead({ question, sub }: { question: string; sub?: ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <h1
        style={{
          fontSize: 24,
          fontWeight: 600,
          color: "var(--text)",
          margin: 0,
          lineHeight: 1.3,
          fontFamily: "var(--font-ui)",
        }}
      >
        {question}
      </h1>
      {sub && (
        <p
          style={{
            margin: 0,
            fontSize: 14,
            color: "var(--text-2)",
            lineHeight: 1.5,
            maxWidth: 640,
          }}
        >
          {sub}
        </p>
      )}
    </div>
  );
}

function WizardFooter({
  canBack,
  onBack,
  onSkip,
  onNext,
  nextLabel,
}: {
  canBack: boolean;
  onBack: () => void;
  onSkip: () => void;
  onNext: () => void;
  nextLabel: string;
}) {
  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: "var(--sidebar-w, 0px)",
        right: 0,
        zIndex: 30,
        background: "var(--surface)",
        borderTop: "1px solid var(--border)",
        padding: "12px 16px",
        display: "flex",
        alignItems: "center",
      }}
    >
      <div
        style={{
          maxWidth: 760,
          margin: "0 auto",
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div style={{ flex: "0 0 auto", minWidth: 80 }}>
          {canBack && (
            <button
              type="button"
              onClick={onBack}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                color: "var(--text-2)",
                fontSize: 13,
                cursor: "pointer",
                fontFamily: "var(--font-ui)",
                whiteSpace: "nowrap",
              }}
            >
              ← Back
            </button>
          )}
        </div>
        <div style={{ flex: "1 1 auto", textAlign: "center" }}>
          <button
            type="button"
            onClick={onSkip}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-2)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-3)")}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              color: "var(--text-3)",
              fontSize: 12,
              cursor: "pointer",
              fontFamily: "var(--font-ui)",
            }}
          >
            Skip to fine-tune
          </button>
        </div>
        <div style={{ flex: "0 0 auto" }}>
          <button type="button" className="btn btn-primary" onClick={onNext}>
            {nextLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ====================================================================== */
/* Step 1 — Picker                                                         */
/* ====================================================================== */

function Step1Picker({
  draft,
  setDraft,
}: {
  draft: Journey;
  setDraft: (j: Journey) => void;
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");

  const stepsByType = useMemo(() => {
    const m = new Map<string, Step>();
    for (const s of draft.steps) m.set(s.type, s);
    return m;
  }, [draft.steps]);

  const stepById = useMemo(() => {
    const m = new Map<string, Step>();
    for (const s of draft.steps) m.set(s.id, s);
    return m;
  }, [draft.steps]);

  const customSteps = useMemo(
    () => draft.steps.filter((s) => s.type === "custom_manual"),
    [draft.steps],
  );

  function isTypeSelected(type: string): boolean {
    return stepsByType.has(type);
  }

  function toggleCatalogType(type: string) {
    const existing = stepsByType.get(type);
    if (existing) {
      const next = renumber(draft.steps.filter((s) => s.id !== existing.id));
      setDraft({ ...draft, steps: next });
    } else {
      const newStep = newStepFromCatalog(type);
      const insertAt = (() => {
        for (let i = 0; i < draft.steps.length; i++) {
          if (catalogIndex(draft.steps[i].type) > catalogIndex(type)) return i;
        }
        return draft.steps.length;
      })();
      const next = renumber([
        ...draft.steps.slice(0, insertAt),
        newStep,
        ...draft.steps.slice(insertAt),
      ]);
      setDraft({ ...draft, steps: next });
    }
  }

  function removeCustom(id: string) {
    setDraft({ ...draft, steps: renumber(draft.steps.filter((s) => s.id !== id)) });
    setExpanded((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  function addCustom() {
    const name = newName.trim();
    if (!name) return;
    const newStep = newStepFromCatalog("custom_manual", name);
    setDraft({ ...draft, steps: renumber([...draft.steps, newStep]) });
    setNewName("");
    setAdding(false);
    setExpanded((prev) => new Set([...prev, newStep.id]));
  }

  function patchStep(id: string, patch: Partial<Step>) {
    setDraft({
      ...draft,
      steps: draft.steps.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    });
  }

  function toggleExpand(key: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {GROUPS.map((group) => (
        <div key={group.label} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "var(--text-3)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              padding: "0 4px",
            }}
          >
            {group.label}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {group.types.map((type) => {
              const entry = getCatalogEntry(type);
              const sel = isTypeSelected(type);
              const existing = stepsByType.get(type);
              const key = existing?.id ?? `type:${type}`;
              const isExpanded = expanded.has(key);
              return (
                <CatalogCard
                  key={type}
                  title={entry.label}
                  subline={entry.clientInstructions || entry.defaultTitle}
                  selected={sel}
                  autoDetect={canAutoDetect(type)}
                  expanded={isExpanded}
                  onToggleSelect={() => toggleCatalogType(type)}
                  onToggleExpand={() => toggleExpand(key)}
                >
                  {isExpanded &&
                    (existing ? (
                      <InlineFineTune
                        step={existing}
                        onChange={(patch) => patchStep(existing.id, patch)}
                      />
                    ) : (
                      <div
                        style={{
                          padding: "12px 4px 0",
                          fontSize: 12,
                          color: "var(--text-3)",
                        }}
                      >
                        Check this step to fine-tune what your clients see.
                      </div>
                    ))}
                </CatalogCard>
              );
            })}
          </div>
        </div>
      ))}

      {customSteps.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "var(--text-3)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              padding: "0 4px",
            }}
          >
            Custom steps
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {customSteps.map((s) => {
              const isExpanded = expanded.has(s.id);
              return (
                <CatalogCard
                  key={s.id}
                  title={s.title}
                  subline="Custom step — your clients confirm when it's done."
                  selected
                  autoDetect={false}
                  expanded={isExpanded}
                  onToggleSelect={() => removeCustom(s.id)}
                  onToggleExpand={() => toggleExpand(s.id)}
                >
                  {isExpanded && stepById.get(s.id) && (
                    <InlineFineTune
                      step={stepById.get(s.id)!}
                      onChange={(patch) => patchStep(s.id, patch)}
                      allowTitleEdit
                    />
                  )}
                </CatalogCard>
              );
            })}
          </div>
        </div>
      )}

      <AddCustomCard
        adding={adding}
        name={newName}
        onName={setNewName}
        onStart={() => setAdding(true)}
        onCancel={() => {
          setAdding(false);
          setNewName("");
        }}
        onAdd={addCustom}
      />
    </div>
  );
}

function CatalogCard({
  title,
  subline,
  selected,
  autoDetect,
  expanded,
  onToggleSelect,
  onToggleExpand,
  children,
}: {
  title: string;
  subline: string;
  selected: boolean;
  autoDetect: boolean;
  expanded: boolean;
  onToggleSelect: () => void;
  onToggleExpand: () => void;
  children?: ReactNode;
}) {
  return (
    <div
      style={{
        border: "1px solid var(--border)",
        borderRadius: "var(--r-md)",
        background: "var(--surface)",
        overflow: "hidden",
      }}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={onToggleExpand}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggleExpand();
          }
        }}
        aria-expanded={expanded}
        style={{
          display: "grid",
          gridTemplateColumns: "44px 1fr auto 24px",
          alignItems: "center",
          gap: 12,
          padding: "14px 16px",
          minHeight: 64,
          cursor: "pointer",
        }}
      >
        <label
          onClick={(e) => e.stopPropagation()}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 32,
            height: 32,
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggleSelect}
            aria-label={`Include ${title}`}
            style={{ width: 18, height: 18, cursor: "pointer" }}
          />
        </label>
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "var(--text)",
              fontFamily: "var(--font-ui)",
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: 12,
              color: "var(--text-3)",
              marginTop: 2,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {subline}
          </div>
        </div>
        <span
          style={{
            fontSize: 11,
            color: "var(--text-3)",
            padding: "3px 8px",
            background: "var(--bg-subtle)",
            borderRadius: "var(--r-sm)",
            whiteSpace: "nowrap",
          }}
        >
          {autoDetect ? "Auto-checks ✓" : "You confirm"}
        </span>
        <span
          aria-hidden
          style={{
            color: "var(--text-3)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "transform 120ms ease-out",
            transform: expanded ? "rotate(90deg)" : "rotate(0)",
          }}
        >
          <ChevronRight size={16} />
        </span>
      </div>
      {expanded && (
        <div
          style={{
            borderTop: "1px solid var(--border-soft)",
            padding: 16,
            background: "var(--bg-subtle)",
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

function AddCustomCard({
  adding,
  name,
  onName,
  onStart,
  onCancel,
  onAdd,
}: {
  adding: boolean;
  name: string;
  onName: (v: string) => void;
  onStart: () => void;
  onCancel: () => void;
  onAdd: () => void;
}) {
  if (!adding) {
    return (
      <button
        type="button"
        onClick={onStart}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          padding: 16,
          minHeight: 56,
          border: "1px dashed var(--border)",
          borderRadius: "var(--r-md)",
          background: "transparent",
          color: "var(--text-2)",
          fontSize: 13,
          fontWeight: 500,
          cursor: "pointer",
          fontFamily: "var(--font-ui)",
        }}
      >
        <Plus size={16} aria-hidden />
        Add a custom step
      </button>
    );
  }
  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        padding: 12,
        border: "1px solid var(--border)",
        borderRadius: "var(--r-md)",
        background: "var(--surface)",
      }}
    >
      <input
        autoFocus
        type="text"
        value={name}
        onChange={(e) => onName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onAdd();
          if (e.key === "Escape") onCancel();
        }}
        placeholder="Name this step — e.g. Welcome video walk-through"
        style={{
          flex: 1,
          height: 36,
          padding: "0 10px",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--r-sm)",
          fontSize: 13,
          color: "var(--text)",
          fontFamily: "var(--font-ui)",
        }}
      />
      <button
        type="button"
        className="btn btn-primary"
        onClick={onAdd}
        disabled={!name.trim()}
        style={!name.trim() ? { opacity: 0.5, cursor: "not-allowed" } : undefined}
      >
        Add
      </button>
      <button type="button" className="btn btn-ghost" onClick={onCancel}>
        Cancel
      </button>
    </div>
  );
}

/* ============ Inline fine-tune (slim editor) ============ */

function InlineFineTune({
  step,
  onChange,
  allowTitleEdit = false,
}: {
  step: Step;
  onChange: (patch: Partial<Step>) => void;
  allowTitleEdit?: boolean;
}) {
  // Defer to the existing StepEditorPanel for a richer fine-tune — but it
  // is an absolute aside, so here we render a compact inline version using
  // shared field shapes. Keep this slim: title, client copy, completion
  // method. The full panel is still reachable from the fine-tune editor.
  const entry = getCatalogEntry(step.type);
  const instructions = (step as Step & { instructions?: string }).instructions ?? "";
  const initialInstructions = instructions || entry.clientInstructions || "";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {allowTitleEdit && (
        <Field label="Step name">
          <input
            type="text"
            value={step.title}
            onChange={(e) => onChange({ title: e.target.value })}
            style={inlineInputStyle}
          />
        </Field>
      )}
      <Field label="What your client sees">
        <textarea
          rows={3}
          value={initialInstructions}
          onChange={(e) =>
            onChange({ ...({ instructions: e.target.value } as Partial<Step>) })
          }
          placeholder="Plain language — what to do and why it matters."
          style={{
            ...inlineInputStyle,
            height: "auto",
            padding: 10,
            lineHeight: 1.5,
            resize: "vertical",
          }}
        />
      </Field>
      <DetectorPickerInline step={step} onChange={onChange} />
      <div style={{ fontSize: 11, color: "var(--text-3)" }}>
        Need more — video, assets, deep link? Open the fine-tune editor after Step 4.
      </div>
    </div>
  );
}

const inlineInputStyle: React.CSSProperties = {
  width: "100%",
  height: 36,
  padding: "0 10px",
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: "var(--r-sm)",
  fontSize: 13,
  color: "var(--text)",
  fontFamily: "var(--font-ui)",
};

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: "var(--text-2)",
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}

/** A minimal detector picker for the inline panel — full version lives in
 *  StepEditorPanel.tsx and is reachable from the fine-tune editor. */
function DetectorPickerInline({
  step,
  onChange,
}: {
  step: Step;
  onChange: (patch: Partial<Step>) => void;
}) {
  const autoOk = canAutoDetect(step.type);
  const effective = step.detector ?? defaultDetector(step.type);
  return (
    <Field label="How is this step completed?">
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <DetectorChoice
          checked={effective === "auto"}
          disabled={!autoOk}
          label="GoCSM detects it automatically in HighLevel"
          sub={
            autoOk
              ? "We watch HighLevel and check this off when it happens — no setup."
              : "This type can't be auto-detected — use one of the options below."
          }
          onSelect={() => onChange({ detector: "auto" })}
        />
        <DetectorChoice
          checked={effective === "manual"}
          label="Your client confirms it"
          sub="Adds a 'Mark done' button on the client checklist."
          onSelect={() => onChange({ detector: "manual" })}
        />
        <DetectorChoice
          checked={effective === "inbound_webhook"}
          label="I'll send GoCSM an event"
          sub="A unique webhook URL completes the step when called."
          onSelect={() => {
            const patch: Partial<Step> = { detector: "inbound_webhook" };
            // Token is generated in StepEditorPanel's full UI — open the
            // fine-tune editor after Step 4 for the URL + recipe.
            onChange(patch);
          }}
        />
      </div>
    </Field>
  );
}

function DetectorChoice({
  checked,
  disabled,
  label,
  sub,
  onSelect,
}: {
  checked: boolean;
  disabled?: boolean;
  label: string;
  sub: string;
  onSelect: () => void;
}) {
  return (
    <label
      style={{
        display: "grid",
        gridTemplateColumns: "20px 1fr",
        alignItems: "start",
        gap: 10,
        padding: 10,
        border: "1px solid",
        borderColor: checked ? "var(--info-7, var(--border))" : "var(--border)",
        background: checked ? "var(--surface)" : "var(--surface)",
        borderRadius: "var(--r-sm)",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.55 : 1,
      }}
    >
      <input
        type="radio"
        checked={checked}
        disabled={disabled}
        onChange={onSelect}
        style={{ marginTop: 3 }}
      />
      <div>
        <div style={{ fontSize: 13, color: "var(--text)", fontWeight: 500 }}>{label}</div>
        <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2, lineHeight: 1.45 }}>
          {sub}
        </div>
      </div>
    </label>
  );
}

/* ====================================================================== */
/* Step 2 — Order                                                          */
/* ====================================================================== */

function Step2Order({
  draft,
  setDraft,
}: {
  draft: Journey;
  setDraft: (j: Journey) => void;
}) {
  const sortedSignatureRef = useRef<string>("");
  const [note, setNote] = useState<string | null>(null);
  const noteTimerRef = useRef<number | null>(null);

  // Sort once per distinct step set so we don't clobber the user's drags.
  useEffect(() => {
    const sig = draft.steps.map((s) => s.type + ":" + s.id).sort().join("|");
    if (sortedSignatureRef.current === sig) return;
    sortedSignatureRef.current = sig;
    const sorted = [...draft.steps].sort((a, b) => {
      const ai = SMART_DEFAULT_ORDER.indexOf(a.type);
      const bi = SMART_DEFAULT_ORDER.indexOf(b.type);
      const aRank = ai === -1 ? 1000 : ai;
      const bRank = bi === -1 ? 1000 : bi;
      if (aRank !== bRank) return aRank - bRank;
      return a.order - b.order;
    });
    const renumbered = renumber(sorted);
    // Only commit if order actually changed.
    if (renumbered.some((s, i) => s.id !== draft.steps[i]?.id)) {
      setDraft({ ...draft, steps: renumbered });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.steps]);

  useEffect(
    () => () => {
      if (noteTimerRef.current) window.clearTimeout(noteTimerRef.current);
    },
    [],
  );

  function showNote(text: string) {
    setNote(text);
    if (noteTimerRef.current) window.clearTimeout(noteTimerRef.current);
    noteTimerRef.current = window.setTimeout(() => setNote(null), 2500);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function isValidCarrierOrder(steps: Step[]): boolean {
    const present = CARRIER_CHAIN.filter((t) => steps.some((s) => s.type === t));
    if (present.length <= 1) return true;
    const indices = present.map((t) => steps.findIndex((s) => s.type === t));
    // Contiguous?
    for (let i = 1; i < indices.length; i++) {
      if (indices[i] !== indices[i - 1] + 1) return false;
    }
    return true;
  }

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = draft.steps.findIndex((s) => s.id === active.id);
    const newIdx = draft.steps.findIndex((s) => s.id === over.id);
    if (oldIdx < 0 || newIdx < 0) return;
    const candidate = arrayMove(draft.steps, oldIdx, newIdx);
    if (!isValidCarrierOrder(candidate)) {
      showNote("Carriers require this order.");
      return;
    }
    setDraft({ ...draft, steps: renumber(candidate) });
  }

  // Compute groups of contiguous carrier rows for visual wrapping.
  const carrierRuns = useMemo(() => {
    const runs: { startId: string; endId: string }[] = [];
    let runStart: number | null = null;
    for (let i = 0; i < draft.steps.length; i++) {
      const isCarrier = CARRIER_CHAIN.includes(draft.steps[i].type);
      if (isCarrier) {
        if (runStart === null) runStart = i;
      } else if (runStart !== null) {
        runs.push({
          startId: draft.steps[runStart].id,
          endId: draft.steps[i - 1].id,
        });
        runStart = null;
      }
    }
    if (runStart !== null) {
      runs.push({
        startId: draft.steps[runStart].id,
        endId: draft.steps[draft.steps.length - 1].id,
      });
    }
    return runs;
  }, [draft.steps]);

  function runForStep(id: string) {
    return carrierRuns.find((r) => {
      const i = draft.steps.findIndex((s) => s.id === id);
      const a = draft.steps.findIndex((s) => s.id === r.startId);
      const b = draft.steps.findIndex((s) => s.id === r.endId);
      return i >= a && i <= b;
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={draft.steps.map((s) => s.id)}
          strategy={verticalListSortingStrategy}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {draft.steps.map((s) => {
              const isCarrier = CARRIER_CHAIN.includes(s.type);
              const run = isCarrier ? runForStep(s.id) : undefined;
              const isFirstInRun = run?.startId === s.id;
              const isLastInRun = run?.endId === s.id;
              return (
                <div key={s.id}>
                  {isCarrier && isFirstInRun && (
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        color: "var(--text-3)",
                        padding: "8px 4px 4px",
                      }}
                    >
                      Carrier-required order
                    </div>
                  )}
                  <div
                    style={{
                      borderLeft: isCarrier ? "2px solid var(--border)" : "2px solid transparent",
                      paddingLeft: isCarrier ? 10 : 0,
                      marginBottom: isLastInRun ? 4 : 0,
                    }}
                  >
                    <OrderRow step={s} locked={isCarrier} />
                  </div>
                </div>
              );
            })}
          </div>
        </SortableContext>
      </DndContext>
      <div
        style={{
          minHeight: 18,
          fontSize: 12,
          color: "var(--text-2)",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
        aria-live="polite"
      >
        {note && (
          <>
            <Info size={14} aria-hidden style={{ color: "var(--text-3)" }} />
            <span>{note}</span>
          </>
        )}
      </div>
    </div>
  );
}

function OrderRow({ step, locked }: { step: Step; locked: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: step.id });
  const entry = getCatalogEntry(step.type);
  const title = step.type === "custom_manual" ? step.title : entry.label;
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.6 : 1,
        display: "grid",
        gridTemplateColumns: "36px 1fr auto",
        alignItems: "center",
        gap: 12,
        padding: "12px 14px",
        minHeight: 52,
        border: "1px solid var(--border)",
        borderRadius: "var(--r-md)",
        background: "var(--surface)",
      }}
    >
      <button
        type="button"
        aria-label={`Drag ${title}`}
        {...attributes}
        {...listeners}
        style={{
          background: "transparent",
          border: "none",
          padding: 6,
          color: "var(--text-3)",
          cursor: "grab",
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        {locked && <Lock size={12} aria-hidden />}
        <GripVertical size={16} aria-hidden />
      </button>
      <div
        style={{
          fontSize: 14,
          fontWeight: 500,
          color: "var(--text)",
          fontFamily: "var(--font-ui)",
        }}
      >
        {title}
      </div>
      <span
        style={{
          fontSize: 11,
          color: "var(--text-3)",
          padding: "3px 8px",
          background: "var(--bg-subtle)",
          borderRadius: "var(--r-sm)",
          whiteSpace: "nowrap",
        }}
      >
        {canAutoDetect(step.type) ? "Auto-checks ✓" : "You confirm"}
      </span>
    </div>
  );
}

/* ====================================================================== */
/* Step 3 — Plans                                                          */
/* ====================================================================== */

function Step3Plans({
  draft,
  setDraft,
}: {
  draft: Journey;
  setDraft: (j: Journey) => void;
}) {
  const scoping = draft.planScoping ?? "single";

  function setScoping(next: "single" | "per-plan") {
    if (next === "single") {
      setDraft({ ...draft, planScoping: "single" });
      return;
    }
    // Seed plan list if only master is present.
    const existing = draft.planVariants ?? [];
    const hasNonMaster = existing.some((v) => !v.isMaster);
    if (hasNonMaster) {
      // Just flip scoping; preserve any prior selections, auto-fill for plans
      // missing stepIds.
      const filled = existing.map((v) => fillAutoSelectionIfMissing(v, draft.steps));
      setDraft({ ...draft, planScoping: "per-plan", planVariants: filled });
      return;
    }
    const master =
      existing.find((v) => v.isMaster) ?? {
        id: MASTER_PLAN_ID,
        name: "All plans",
        isMaster: true,
      };
    const seeded: PlanVariant[] = [
      master,
      ...SEED_PLANS.map((p) => fillAutoSelectionIfMissing(
        { id: p.id, name: p.name },
        draft.steps,
      )),
    ];
    setDraft({ ...draft, planScoping: "per-plan", planVariants: seeded });
  }

  function patchVariant(planId: string, patch: Partial<PlanVariant>) {
    const variants = draft.planVariants ?? [];
    setDraft({
      ...draft,
      planVariants: variants.map((v) => (v.id === planId ? { ...v, ...patch } : v)),
    });
  }

  // Prune missing ids when Step 1 has removed steps.
  useEffect(() => {
    if ((draft.planScoping ?? "single") !== "per-plan") return;
    const ids = new Set(draft.steps.map((s) => s.id));
    const variants = draft.planVariants ?? [];
    let changed = false;
    const next = variants.map((v) => {
      if (v.isMaster || !v.stepIds) return v;
      const filtered = v.stepIds.filter((id) => ids.has(id));
      if (filtered.length !== v.stepIds.length) {
        changed = true;
        return { ...v, stepIds: filtered };
      }
      return v;
    });
    if (changed) setDraft({ ...draft, planVariants: next });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.steps]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
        }}
      >
        <ScopingCard
          title="Yes — one checklist for all plans"
          sub="Simplest. Every client gets the same journey."
          selected={scoping === "single"}
          onSelect={() => setScoping("single")}
        />
        <ScopingCard
          title="Different by plan"
          sub="Tailor which steps apply on Pilot, Growth, Scale."
          selected={scoping === "per-plan"}
          onSelect={() => setScoping("per-plan")}
        />
      </div>

      {scoping === "per-plan" && (
        <PerPlanSection draft={draft} onPatchVariant={patchVariant} />
      )}
    </div>
  );
}

function ScopingCard({
  title,
  sub,
  selected,
  onSelect,
}: {
  title: string;
  sub: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      style={{
        textAlign: "left",
        padding: 20,
        minHeight: 104,
        background: "var(--surface)",
        border: "1px solid",
        borderColor: selected ? "var(--info-7, var(--border))" : "var(--border)",
        outline: selected ? "1px solid var(--info-7, var(--border))" : "none",
        borderRadius: "var(--r-md)",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        gap: 6,
        fontFamily: "var(--font-ui)",
      }}
    >
      <div
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: "var(--text)",
        }}
      >
        {title}
      </div>
      <div style={{ fontSize: 12, color: "var(--text-3)", lineHeight: 1.45 }}>{sub}</div>
    </button>
  );
}

function fillAutoSelectionIfMissing(variant: PlanVariant, steps: Step[]): PlanVariant {
  if (variant.isMaster) return variant;
  if (variant.stepIds && variant.stepIds.length > 0) return variant;
  const plan = SEED_PLANS.find((p) => p.id === variant.id);
  if (!plan) {
    // Unknown plan → include all by default.
    return { ...variant, stepIds: steps.map((s) => s.id) };
  }
  const allowed = steps.filter((s) => {
    const flag = FEATURE_GATED_TYPES[s.type];
    if (!flag) return true;
    return plan.features[flag] === true;
  });
  return { ...variant, stepIds: allowed.map((s) => s.id) };
}

function PerPlanSection({
  draft,
  onPatchVariant,
}: {
  draft: Journey;
  onPatchVariant: (planId: string, patch: Partial<PlanVariant>) => void;
}) {
  const variants = (draft.planVariants ?? []).filter((v) => !v.isMaster);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ fontSize: 12, color: "var(--text-3)" }}>
        Order is shared across plans — set in Step 2. Check or uncheck steps to tailor each plan.
      </div>
      {variants.map((v) => (
        <PlanRow
          key={v.id}
          variant={v}
          steps={draft.steps}
          onPatch={(patch) => onPatchVariant(v.id, patch)}
        />
      ))}
    </div>
  );
}

function PlanRow({
  variant,
  steps,
  onPatch,
}: {
  variant: PlanVariant;
  steps: Step[];
  onPatch: (patch: Partial<PlanVariant>) => void;
}) {
  const selectedSet = useMemo(
    () => new Set(variant.stepIds ?? steps.map((s) => s.id)),
    [variant.stepIds, steps],
  );
  const plan = SEED_PLANS.find((p) => p.id === variant.id);
  const missingFeatures = plan
    ? (Object.keys(plan.features) as (keyof PlanFeatures)[]).filter((k) => !plan.features[k])
    : [];
  const explainer = missingFeatures.length
    ? `${variant.name} doesn't include ${missingFeatures.join(" or ")} features, so we've left ${missingFeatures.length > 1 ? "those" : "that"} out — adjust if needed.`
    : null;

  function toggle(id: string) {
    const next = new Set(selectedSet);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    // Preserve canonical step order in the stored stepIds.
    const ids = steps.map((s) => s.id).filter((id) => next.has(id));
    onPatch({ stepIds: ids });
  }

  return (
    <div
      style={{
        padding: 16,
        border: "1px solid var(--border)",
        borderRadius: "var(--r-md)",
        background: "var(--surface)",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{variant.name}</div>
        <div
          className="mono"
          style={{
            fontSize: 12,
            color: "var(--text-2)",
            fontFamily: "var(--font-mono)",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {selectedSet.size} / {steps.length} steps
        </div>
      </div>
      {explainer && (
        <div style={{ fontSize: 12, color: "var(--text-3)", lineHeight: 1.45 }}>{explainer}</div>
      )}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {steps.map((s) => {
          const sel = selectedSet.has(s.id);
          const entry = getCatalogEntry(s.type);
          const label = s.type === "custom_manual" ? s.title : entry.label;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => toggle(s.id)}
              aria-pressed={sel}
              style={{
                padding: "6px 10px",
                minHeight: 32,
                fontSize: 12,
                fontFamily: "var(--font-ui)",
                color: sel ? "var(--text)" : "var(--text-3)",
                background: sel ? "var(--surface)" : "transparent",
                border: "1px solid",
                borderColor: sel ? "var(--info-7, var(--border))" : "var(--border)",
                borderRadius: "var(--r-sm)",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              {sel ? "✓ " : ""}
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ====================================================================== */
/* Step 4 — Timing                                                         */
/* ====================================================================== */

function validateTiming(draft: Journey): string | null {
  const okNum = (n: number | undefined) =>
    typeof n === "number" && Number.isInteger(n) && n >= 1 && n <= 180;
  if (!okNum(draft.targetDays)) return "Use a number between 1 and 180 for the journey target.";
  if ((draft.planScoping ?? "single") === "per-plan") {
    const variants = (draft.planVariants ?? []).filter((v) => !v.isMaster);
    for (const v of variants) {
      if (v.targetDays !== undefined && !okNum(v.targetDays)) {
        return `Use a number between 1 and 180 for ${v.name}.`;
      }
    }
  }
  return null;
}

function Step4Timing({
  draft,
  setDraft,
}: {
  draft: Journey;
  setDraft: (j: Journey) => void;
}) {
  const perPlan = (draft.planScoping ?? "single") === "per-plan";
  const variants = (draft.planVariants ?? []).filter((v) => !v.isMaster);

  // Seed defaults for any per-plan variant missing targetDays.
  const seededRef = useRef(false);
  useEffect(() => {
    if (!perPlan || seededRef.current) return;
    let touched = false;
    const next = (draft.planVariants ?? []).map((v) => {
      if (v.isMaster) return v;
      if (v.targetDays !== undefined) return v;
      const fallback = PLAN_DEFAULT_TARGET_DAYS[v.id] ?? draft.targetDays;
      touched = true;
      return { ...v, targetDays: fallback };
    });
    seededRef.current = true;
    if (touched) setDraft({ ...draft, planVariants: next });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [perPlan]);

  if (!perPlan) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <BigDayInput
          value={draft.targetDays}
          onChange={(n) => setDraft({ ...draft, targetDays: n })}
        />
      </div>
    );
  }

  const allMatch =
    variants.length > 0 &&
    variants.every((v) => v.targetDays === draft.targetDays);

  function applyAllSame(n: number) {
    const next = (draft.planVariants ?? []).map((v) =>
      v.isMaster ? v : { ...v, targetDays: n },
    );
    setDraft({ ...draft, targetDays: n, planVariants: next });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <SameForAllRow
        sameForAll={allMatch}
        value={draft.targetDays}
        onValue={applyAllSame}
        onToggle={(on) => {
          if (on) applyAllSame(draft.targetDays);
          // turning off keeps current per-plan values
        }}
      />
      <div style={{ fontSize: 12, color: "var(--text-3)" }}>
        Pilot wraps faster than full plans — adjust if your sales pitch says otherwise.
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {variants.map((v) => (
          <PlanTargetRow
            key={v.id}
            name={v.name}
            value={v.targetDays ?? draft.targetDays}
            disabled={allMatch}
            onChange={(n) => {
              const nextVariants = (draft.planVariants ?? []).map((pv) =>
                pv.id === v.id ? { ...pv, targetDays: n } : pv,
              );
              setDraft({ ...draft, planVariants: nextVariants });
            }}
          />
        ))}
      </div>
    </div>
  );
}

function BigDayInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
        <input
          type="number"
          min={1}
          max={180}
          step={1}
          value={Number.isFinite(value) ? value : ""}
          onChange={(e) => {
            const raw = e.target.value;
            if (raw === "") {
              onChange(NaN as unknown as number);
              return;
            }
            const n = Math.round(Number(raw));
            if (Number.isFinite(n)) onChange(n);
          }}
          style={{
            width: 140,
            height: 56,
            padding: "0 14px",
            fontSize: 32,
            fontFamily: "var(--font-mono)",
            fontVariantNumeric: "tabular-nums",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--r-md)",
            color: "var(--text)",
          }}
        />
        <span style={{ fontSize: 16, color: "var(--text-2)" }}>days</span>
      </div>
      <div style={{ fontSize: 13, color: "var(--text-3)" }}>
        The promise you make on your sales calls.
      </div>
    </div>
  );
}

function SameForAllRow({
  sameForAll,
  value,
  onValue,
  onToggle,
}: {
  sameForAll: boolean;
  value: number;
  onValue: (n: number) => void;
  onToggle: (on: boolean) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <input
          type="number"
          min={1}
          max={180}
          step={1}
          disabled={!sameForAll}
          value={Number.isFinite(value) ? value : ""}
          onChange={(e) => {
            const raw = e.target.value;
            if (raw === "") return;
            const n = Math.round(Number(raw));
            if (Number.isFinite(n)) onValue(n);
          }}
          style={{
            width: 140,
            height: 56,
            padding: "0 14px",
            fontSize: 32,
            fontFamily: "var(--font-mono)",
            fontVariantNumeric: "tabular-nums",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--r-md)",
            color: sameForAll ? "var(--text)" : "var(--text-3)",
            opacity: sameForAll ? 1 : 0.6,
          }}
        />
        <span style={{ fontSize: 16, color: "var(--text-2)" }}>days</span>
        <label
          style={{
            marginLeft: "auto",
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            fontSize: 13,
            color: "var(--text-2)",
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={sameForAll}
            onChange={(e) => onToggle(e.target.checked)}
          />
          Same for all plans
        </label>
      </div>
      <div style={{ fontSize: 13, color: "var(--text-3)" }}>
        The promise you make on your sales calls.
      </div>
    </div>
  );
}

function PlanTargetRow({
  name,
  value,
  disabled,
  onChange,
}: {
  name: string;
  value: number;
  disabled: boolean;
  onChange: (n: number) => void;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "120px auto 1fr",
        alignItems: "center",
        gap: 12,
        padding: "10px 14px",
        border: "1px solid var(--border)",
        borderRadius: "var(--r-md)",
        background: "var(--surface)",
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text)" }}>{name}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <input
          type="number"
          min={1}
          max={180}
          step={1}
          disabled={disabled}
          value={Number.isFinite(value) ? value : ""}
          onChange={(e) => {
            const raw = e.target.value;
            if (raw === "") return;
            const n = Math.round(Number(raw));
            if (Number.isFinite(n)) onChange(n);
          }}
          style={{
            width: 96,
            height: 44,
            padding: "0 12px",
            fontSize: 22,
            fontFamily: "var(--font-mono)",
            fontVariantNumeric: "tabular-nums",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--r-sm)",
            color: disabled ? "var(--text-3)" : "var(--text)",
            opacity: disabled ? 0.6 : 1,
          }}
        />
        <span style={{ fontSize: 13, color: "var(--text-2)" }}>days</span>
      </div>
      <div />
    </div>
  );
}

/* ====================================================================== */
/* Step 5 — Experience (guided vs tracking-only)                          */
/* ====================================================================== */

function Step5Experience({
  draft,
  setDraft,
}: {
  draft: Journey;
  setDraft: (j: Journey) => void;
}) {
  const mode = draft.experienceMode ?? "guided";
  const pick = (next: "guided" | "tracking_only") =>
    setDraft({ ...draft, experienceMode: next });
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <ChoiceCard
        selected={mode === "guided"}
        title="Show them a guided checklist"
        tag="Recommended"
        subline="A simple checklist appears inside their HighLevel, guiding each step."
        onSelect={() => pick("guided")}
      />
      <ChoiceCard
        selected={mode === "tracking_only"}
        title="Just track quietly — no checklist"
        subline="Your clients see nothing. You still get progress tracking, stuck alerts, and workflow triggers — GoCSM watches HighLevel either way."
        onSelect={() => pick("tracking_only")}
      />
    </div>
  );
}

/* ====================================================================== */
/* Step 6 — Brand color                                                   */
/* ====================================================================== */

function Step6Placement({
  draft,
  setDraft,
}: {
  draft: Journey;
  setDraft: (j: Journey) => void;
}) {
  const placement = draft.placement ?? DEFAULT_PLACEMENT;
  return (
    <PlacementTab
      placement={placement}
      onChange={(next: Placement) => setDraft({ ...draft, placement: next })}
    />
  );
}

function Step6Branding({
  draft,
  setDraft,
}: {
  draft: Journey;
  setDraft: (j: Journey) => void;
}) {
  const hlColor = getHighLevelBrandColor();

  // Prefill once with the agency's HighLevel brand color when the journey
  // doesn't yet have a color set. Triggers a re-render so the right-rail
  // preview repaints immediately.
  useEffect(() => {
    if (draft.brandColor === undefined) {
      setDraft({ ...draft, brandColor: hlColor });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const current = (draft.brandColor ?? hlColor).toLowerCase();
  const [hexInput, setHexInput] = useState(current);

  // Keep the hex input in sync if the draft color changes via swatch / reset.
  useEffect(() => {
    setHexInput(current);
  }, [current]);

  const matchedHL =
    draft.brandColor !== undefined &&
    draft.brandColor.toLowerCase() === hlColor.toLowerCase();

  const setColor = (next: string) => setDraft({ ...draft, brandColor: next });
  const reset = () => setDraft({ ...draft, brandColor: undefined });

  const commitHex = (raw: string) => {
    const n = normalizeHex(raw);
    if (n) setColor(n);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
        padding: 20,
        borderRadius: "var(--r-md)",
        border: "1px solid var(--border)",
        background: "var(--surface)",
        fontFamily: "var(--font-ui)",
      }}
    >
      {matchedHL && (
        <div style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.5 }}>
          We matched your HighLevel brand — change it if you like.
        </div>
      )}

      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        {BRAND_PRESETS.map((c) => {
          const selected = c.toLowerCase() === current;
          return (
            <button
              key={c}
              type="button"
              aria-label={`Use ${c}`}
              aria-pressed={selected}
              onClick={() => setColor(c)}
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: c,
                border: "none",
                outline: selected ? "2px solid var(--text)" : "2px solid transparent",
                outlineOffset: 2,
                cursor: "pointer",
                padding: 0,
              }}
            />
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <input
          type="text"
          value={hexInput}
          spellCheck={false}
          onChange={(e) => {
            const v = e.target.value;
            setHexInput(v);
            commitHex(v);
          }}
          onBlur={() => {
            const n = normalizeHex(hexInput);
            setHexInput(n ?? current);
          }}
          placeholder="#0f766e"
          aria-label="Custom hex color"
          style={{
            width: 140,
            height: 36,
            padding: "0 10px",
            fontFamily: "var(--font-mono, ui-monospace, monospace)",
            fontSize: 13,
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--r-sm)",
            color: "var(--text)",
          }}
        />
        <span
          aria-hidden
          style={{
            width: 28,
            height: 28,
            borderRadius: "var(--r-sm)",
            background: normalizeHex(hexInput) ?? "transparent",
            border: "1px solid var(--border)",
          }}
        />
      </div>

      <div style={{ fontSize: 12.5, color: "var(--text-3)", lineHeight: 1.5 }}>
        Used for the call-to-action, progress bar, and check glyph in your client's checklist.
      </div>

      <div>
        <button
          type="button"
          onClick={reset}
          onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
          onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
          style={{
            background: "none",
            border: "none",
            padding: 0,
            fontSize: 12,
            color: "var(--text-3)",
            cursor: "pointer",
            fontFamily: "var(--font-ui)",
          }}
        >
          Use GoCSM default
        </button>
      </div>
    </div>
  );
}

/* ====================================================================== */
/* Step 7 — Videos (Yes / No)                                             */
/* ====================================================================== */

function Step7Videos({
  draft,
  setDraft,
}: {
  draft: Journey;
  setDraft: (j: Journey) => void;
}) {
  const pick = (next: boolean) => setDraft({ ...draft, showVideos: next });
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <ChoiceCard
        selected={draft.showVideos === true}
        title="Yes — include a 'Show me how' video on each step"
        subline="GoCSM provides white-label tutorials with no GoCSM branding — they look like yours."
        onSelect={() => pick(true)}
      />
      <ChoiceCard
        selected={draft.showVideos === false}
        title="No videos"
        subline="Your clients see your written instructions only."
        onSelect={() => pick(false)}
      />
    </div>
  );
}

/* ====================================================================== */
/* Step 8 — Review your videos                                            */
/* ====================================================================== */

function Step8ReviewVideos({
  draft,
  setDraft,
}: {
  draft: Journey;
  setDraft: (j: Journey) => void;
}) {
  const [openPlayer, setOpenPlayer] = useState<
    { stepId: string; source: "gocsm" | "custom" } | null
  >(null);

  const setVideoRef = (stepId: string, ref: string) =>
    setDraft({
      ...draft,
      steps: draft.steps.map((s) => (s.id === stepId ? { ...s, videoRef: ref } : s)),
    });

  const togglePlayer = (stepId: string, source: "gocsm" | "custom") => {
    setOpenPlayer((cur) =>
      cur && cur.stepId === stepId && cur.source === source ? null : { stepId, source },
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.5 }}>
        Watch each tutorial — they're white-label, so your clients won't see GoCSM. Swap in your own only where you'd rather.
      </div>
      <div
        style={{
          maxHeight: 560,
          overflowY: "auto",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--r-md)",
        }}
      >
        {draft.steps.map((s, i) => (
          <VideoReviewRow
            key={s.id}
            step={s}
            isLast={i === draft.steps.length - 1}
            onChange={(ref) => setVideoRef(s.id, ref)}
            openPlayer={openPlayer}
            onTogglePlayer={togglePlayer}
            onClosePlayerIfMine={() => {
              setOpenPlayer((cur) => (cur && cur.stepId === s.id ? null : cur));
            }}
          />
        ))}
        {draft.steps.length === 0 && (
          <div
            style={{
              padding: "16px 20px",
              fontSize: 13,
              color: "var(--text-3)",
            }}
          >
            No client-facing steps yet — add some in Step 1.
          </div>
        )}
      </div>
    </div>
  );
}

function InlinePlayer({ src, title }: { src: string; title: string }) {
  return (
    <div style={{ maxWidth: 480, width: "100%" }}>
      <div
        style={{
          position: "relative",
          width: "100%",
          paddingTop: "56.25%",
          border: "1px solid var(--border)",
          borderRadius: "var(--r-sm)",
          overflow: "hidden",
          background: "var(--n-2, var(--bg-subtle))",
        }}
      >
        <iframe
          src={src}
          title={title}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            border: 0,
          }}
        />
      </div>
    </div>
  );
}

function VideoReviewRow({
  step,
  isLast,
  onChange,
  openPlayer,
  onTogglePlayer,
  onClosePlayerIfMine,
}: {
  step: Step;
  isLast: boolean;
  onChange: (ref: string) => void;
  openPlayer: { stepId: string; source: "gocsm" | "custom" } | null;
  onTogglePlayer: (stepId: string, source: "gocsm" | "custom") => void;
  onClosePlayerIfMine: () => void;
}) {
  const parsed = parseVideoRef(step.videoRef);
  const isCustom = parsed.kind === "link";
  const [urlInput, setUrlInput] = useState(isCustom ? parsed.url : "");
  const [touched, setTouched] = useState(false);
  const [expanded, setExpanded] = useState(isCustom);

  const trimmed = urlInput.trim();
  const provider = trimmed ? detectProvider(trimmed) : null;
  const customEmbed = trimmed && provider ? toEmbedUrl(trimmed) : null;

  const gocsmOpen = openPlayer?.stepId === step.id && openPlayer.source === "gocsm";
  const customOpen = openPlayer?.stepId === step.id && openPlayer.source === "custom";

  const commitUrl = (raw: string) => {
    setUrlInput(raw);
    setTouched(true);
    const t = raw.trim();
    if (t && detectProvider(t)) {
      onChange("link:" + t);
    }
  };

  const useGoCSM = () => {
    onChange("default");
    setUrlInput("");
    setTouched(false);
    setExpanded(false);
    onClosePlayerIfMine();
  };

  const useMyOwn = () => {
    setExpanded(true);
  };

  const usingLabel = isCustom
    ? provider || parsed.provider
      ? `Using: Custom · ${PROVIDER_LABEL[(provider || parsed.provider) as keyof typeof PROVIDER_LABEL]}`
      : "Using: Custom link"
    : "Using: GoCSM tutorial";

  const watchBtnStyle = (active: boolean): React.CSSProperties => ({
    background: active ? "var(--n-2, var(--bg-subtle))" : "transparent",
    border: "1px solid var(--border)",
    padding: "0 10px",
    height: 26,
    borderRadius: "var(--r-pill, 9999px)",
    color: "var(--text-2)",
    fontSize: 12,
    fontWeight: 500,
    cursor: "pointer",
    fontFamily: "var(--font-ui)",
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    whiteSpace: "nowrap",
  });

  return (
    <div
      style={{
        padding: "14px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        borderBottom: isLast ? "none" : "1px solid var(--border-soft, var(--border))",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          justifyContent: "space-between",
          flexWrap: "wrap",
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text)" }}>
          {step.title}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => onTogglePlayer(step.id, "gocsm")}
            aria-expanded={gocsmOpen}
            style={watchBtnStyle(gocsmOpen)}
          >
            {gocsmOpen ? "▾ Hide" : "▶ Watch"}
          </button>
          <span style={{ fontSize: 12, color: "var(--text-2)" }}>{usingLabel}</span>
          <button
            type="button"
            onClick={isCustom || expanded ? useGoCSM : useMyOwn}
            onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
            onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              fontSize: 12,
              color: "var(--text-3)",
              cursor: "pointer",
              fontFamily: "var(--font-ui)",
            }}
          >
            {isCustom || expanded ? "Use GoCSM tutorial" : "Use my own instead"}
          </button>
        </div>
      </div>

      {gocsmOpen && (
        <InlinePlayer
          src={GOCSM_TUTORIAL_EMBED}
          title={`GoCSM tutorial preview — ${step.title}`}
        />
      )}

      {expanded && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <input
              type="text"
              value={urlInput}
              spellCheck={false}
              placeholder="Paste a YouTube, Vimeo, or Loom link"
              aria-label={`Custom video URL for ${step.title}`}
              onChange={(e) => commitUrl(e.target.value)}
              onBlur={() => setTouched(true)}
              style={{
                flex: "1 1 220px",
                minWidth: 0,
                height: 36,
                padding: "0 10px",
                fontSize: 13,
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "var(--r-sm)",
                color: "var(--text)",
                fontFamily: "var(--font-ui)",
              }}
            />
            {customEmbed && (
              <button
                type="button"
                onClick={() => onTogglePlayer(step.id, "custom")}
                aria-expanded={customOpen}
                style={watchBtnStyle(customOpen)}
              >
                {customOpen ? "▾ Hide" : "▶ Watch"}
              </button>
            )}
          </div>
          <div
            style={{
              fontSize: 11.5,
              color:
                touched && trimmed && !provider
                  ? "var(--warn-9, var(--text-2))"
                  : "var(--text-3)",
            }}
          >
            {!trimmed
              ? "YouTube, Vimeo, or Loom."
              : provider
                ? `${PROVIDER_LABEL[provider]} — saved.`
                : touched
                  ? "Use a YouTube, Vimeo, or Loom link."
                  : "YouTube, Vimeo, or Loom."}
          </div>
          {customOpen && customEmbed && (
            <InlinePlayer
              src={customEmbed}
              title={`Custom video preview — ${step.title}`}
            />
          )}
        </div>
      )}
    </div>
  );
}

/* ============ Shared step-5/7 ChoiceCard ============ */

function ChoiceCard({
  selected,
  title,
  subline,
  tag,
  onSelect,
}: {
  selected: boolean;
  title: string;
  subline: string;
  tag?: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      style={{
        textAlign: "left",
        padding: 20,
        borderRadius: "var(--r-md)",
        border: `1px solid ${selected ? "var(--blue-7)" : "var(--border)"}`,
        background: selected ? "var(--blue-1, var(--surface))" : "var(--surface)",
        boxShadow: selected ? "0 0 0 2px var(--blue-2, transparent) inset" : "none",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        gap: 6,
        fontFamily: "var(--font-ui)",
      }}
    >
      <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>
          {title}
        </span>
        {tag && (
          <span
            style={{
              fontSize: 10.5,
              fontWeight: 600,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              padding: "2px 6px",
              borderRadius: "var(--r-pill, 9999px)",
              background: "var(--n-2, var(--bg-subtle))",
              color: "var(--text-3)",
            }}
          >
            {tag}
          </span>
        )}
      </span>
      <span style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.5 }}>
        {subline}
      </span>
    </button>
  );
}

function PlaceholderPanel({ text }: { text: string }) {
  return (
    <div
      style={{
        padding: 20,
        borderRadius: "var(--r-md)",
        border: "1px dashed var(--border)",
        background: "var(--surface)",
        fontSize: 13,
        color: "var(--text-3)",
        fontFamily: "var(--font-ui)",
      }}
    >
      {text}
    </div>
  );
}

