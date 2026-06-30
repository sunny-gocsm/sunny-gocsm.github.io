import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { useNavigate } from "@onb/router-compat";
import { Check } from "lucide-react";
import {
  STANDARD_GHL_JOURNEY,
  saveJourney,
  newDraftId,
  MASTER_PLAN_ID,
  DEFAULT_PLACEMENT,
  type Journey,
  type PlanScoping,
  type PlanVariant,
  type ExperienceMode,
  type Placement,
} from "@onb/lib/types";

import { mapChecklistToJourney } from "@onb/lib/mapping";
import { PasteDoor } from "./JourneyCreationDoors";
import { PlacementTab } from "./ClientPreview";
import {
  BRAND_PRESETS,
  DEFAULT_BRAND_COLOR,
  normalizeHex,
} from "@onb/lib/clientAccent";

type ScreenId = 1 | 2 | 3 | 4 | 5 | 6;

function defaultVariants(): PlanVariant[] {
  return [
    { id: MASTER_PLAN_ID, name: "All plans", isMaster: true },
    { id: "pilot", name: "Pilot" },
  ];
}


export function JourneyWizard({
  onCreated,
  initialJourney,
  mode = "create",
  onSkip,
}: {
  onCreated: (journey: Journey) => void;
  initialJourney?: Journey;
  mode?: "create" | "edit";
  onSkip?: () => void;
}) {
  const navigate = useNavigate();

  const allTypes = useMemo(
    () => STANDARD_GHL_JOURNEY.steps.map((s) => ({ type: s.type, title: s.title })),
    [],
  );

  const [screen, setScreen] = useState<ScreenId>(1);
  const [pasteMode, setPasteMode] = useState(false);
  const [checkedTypes, setCheckedTypes] = useState<Set<string>>(
    () =>
      initialJourney
        ? new Set(initialJourney.steps.map((s) => s.type))
        : new Set(allTypes.map((s) => s.type)),
  );
  const [targetDays, setTargetDays] = useState<number>(initialJourney?.targetDays ?? 14);
  const [planScoping, setPlanScoping] = useState<PlanScoping>(initialJourney?.planScoping ?? "single");
  const [variants, setVariants] = useState<PlanVariant[]>(
    () =>
      initialJourney?.planVariants && initialJourney.planVariants.length > 0
        ? initialJourney.planVariants
        : defaultVariants(),
  );
  const [experienceMode, setExperienceMode] = useState<ExperienceMode>(
    initialJourney?.experienceMode ?? "guided",
  );
  const [brandColor, setBrandColor] = useState<string | undefined>(initialJourney?.brandColor);
  const [placement, setPlacement] = useState<Placement>(initialJourney?.placement ?? DEFAULT_PLACEMENT);



  const totalScreens = experienceMode === "tracking_only" ? 4 : 6;
  const isLast = screen === totalScreens;

  const canContinue =
    screen === 1 ? checkedTypes.size > 0 :
    screen === 2 ? targetDays >= 1 && targetDays <= 180 :
    true;

  const goBack = () => {
    if (pasteMode) { setPasteMode(false); return; }
    if (screen === 1) return;
    setScreen((s) => (s - 1) as ScreenId);
  };

  const goNext = () => {
    if (!canContinue) return;
    if (isLast) {
      finish();
      return;
    }
    setScreen((s) => (s + 1) as ScreenId);
  };

  const finish = () => {
    const baseSteps = STANDARD_GHL_JOURNEY.steps.filter((s) => checkedTypes.has(s.type));
    const selectedIds = new Set(baseSteps.map((s) => s.id));
    // For per-plan, prune variant.stepIds to only include steps still in the master.
    const finalVariants: PlanVariant[] =
      planScoping === "per-plan"
        ? variants.map((v) =>
            v.isMaster
              ? v
              : {
                  ...v,
                  stepIds: v.stepIds
                    ? v.stepIds.filter((id) => selectedIds.has(id))
                    : baseSteps.map((s) => s.id),
                },
          )
        : [{ id: MASTER_PLAN_ID, name: "All plans", isMaster: true }];

    // Build steps: in edit mode, preserve per-step metadata for steps whose type
    // is still selected; new step types pick up template defaults.
    const existingByType = new Map(
      (initialJourney?.steps ?? []).map((s) => [s.type, s] as const),
    );
    const stepsOut = baseSteps.map((tpl, i) => {
      const existing = existingByType.get(tpl.type);
      if (mode === "edit" && existing) {
        return { ...existing, order: i + 1 };
      }
      return {
        ...tpl,
        order: i + 1,
        state: "not_started" as const,
        mapping: { confidence: "fact" as const, source: "template" as const },
      };
    });

    const j: Journey =
      mode === "edit" && initialJourney
        ? {
            ...initialJourney,
            targetDays,
            steps: stepsOut,
            experienceMode,
            brandColor,
            placement,
            planScoping,
            planVariants: finalVariants,
          }
        : {
            id: newDraftId(),
            name: "Untitled journey",
            status: "draft",
            version: 1,
            targetDays,
            clientCount: 0,
            steps: stepsOut,
            experienceMode,
            brandColor,
            placement,
            planScoping,
            planVariants: finalVariants,
          };
    saveJourney(j);
    onCreated(j);
  };


  const handlePaste = (raw: string) => {
    const j = saveJourney({ ...mapChecklistToJourney(raw), targetDays, experienceMode, brandColor, placement });
    onCreated(j);
  };

  const onCancel = () => navigate({ to: "/onboarding" });


  const canBack = screen > 1 || pasteMode;
  const primaryLabel = pasteMode
    ? null
    : screen === 6 || (screen === 4 && experienceMode === "tracking_only")
      ? "Create journey →"
      : "Continue →";
  const showSkipLink = !pasteMode;
  const handleSkip = () => {
    if (onSkip) onSkip();
    else navigate({ to: "/onboarding/journey" });
  };

  return (
    <div
      style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: "24px 16px 96px",
        display: "flex",
        flexDirection: "column",
        gap: 24,
      }}
    >
      <WizardHeader
        screen={screen}
        totalScreens={totalScreens}
        onCancel={onCancel}
        mode={mode}
      />


      <form
        id="journey-wizard-form"
        onSubmit={(e) => {
          e.preventDefault();
          goNext();
        }}
        style={{ display: "flex", flexDirection: "column", gap: 28 }}
      >
        {pasteMode ? (
          <>
            <ScreenHead
              question="Paste your existing checklist"
              sub="Each line becomes a step. GoCSM maps each one to a step type for you to review."
            />
            <PasteDoor onSubmit={handlePaste} />
          </>
        ) : screen === 1 ? (
          <Screen1
            allTypes={allTypes}
            checkedTypes={checkedTypes}
            onToggle={(t) => {
              setCheckedTypes((prev) => {
                const next = new Set(prev);
                if (next.has(t)) next.delete(t);
                else next.add(t);
                return next;
              });
            }}
            onPaste={() => setPasteMode(true)}
            footer={null}
          />
        ) : screen === 2 ? (
          <Screen2
            value={targetDays}
            onChange={setTargetDays}
            footer={null}
          />
        ) : screen === 3 ? (
          <Screen3
            value={planScoping}
            onChange={setPlanScoping}
            variants={variants}
            onVariantsChange={setVariants}
            masterStepIds={STANDARD_GHL_JOURNEY.steps
              .filter((s) => checkedTypes.has(s.type))
              .map((s) => s.id)}
            allSteps={STANDARD_GHL_JOURNEY.steps.filter((s) =>
              checkedTypes.has(s.type),
            )}
            masterTargetDays={targetDays}
            footer={null}
          />

        ) : screen === 4 ? (
          <Screen4
            value={experienceMode}
            onChange={setExperienceMode}
            isLast={experienceMode === "tracking_only"}
            footer={null}
          />
        ) : screen === 5 ? (
          <>
            <ScreenHead
              question="Where should your clients see this?"
              sub="Pick the spot inside HighLevel where the checklist lives."
            />
            <PlacementTab placement={placement} onChange={setPlacement} />
          </>
        ) : (
          <Screen5
            brandColor={brandColor}
            onBrandColorChange={setBrandColor}
            footer={null}
          />
        )}
      </form>

      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "var(--surface)",
          borderTop: "1px solid var(--border)",
          zIndex: 20,
          padding: "12px 16px",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div style={{ maxWidth: 720, width: "100%", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ flex: "0 0 auto", minWidth: 80 }}>
            {canBack && (
              <button
                type="button"
                className="btn btn-ghost"
                onClick={goBack}
                style={{ fontSize: 13 }}
              >
                {pasteMode ? "← back to questions" : "← Back"}
              </button>
            )}
          </div>
          <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
            {showSkipLink && (
              <button
                type="button"
                onClick={handleSkip}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-2)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-3)")}
                style={{
                  background: "none",
                  border: "none",
                  padding: "2px 6px",
                  color: "var(--text-3)",
                  fontSize: 12,
                  cursor: "pointer",
                  fontFamily: "var(--font-ui)",
                }}
              >
                Skip to fine-tune
              </button>
            )}
          </div>
          <div style={{ flex: "0 0 auto", minWidth: 80, display: "flex", justifyContent: "flex-end" }}>
            {primaryLabel && (
              <button
                form="journey-wizard-form"
                type="submit"
                className="btn btn-primary"
                disabled={!canContinue}
                style={!canContinue ? { opacity: 0.5, cursor: "not-allowed" } : undefined}
              >
                {primaryLabel}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============ Shell ============ */

function WizardHeader({
  screen,
  totalScreens,
  onCancel,
  mode = "create",
}: {
  screen: ScreenId;
  totalScreens: number;
  onCancel: () => void;
  mode?: "create" | "edit";
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          minHeight: 32,
        }}
      >
        <div style={{ flex: "0 0 auto", width: 80 }} />
        <div style={{ flex: 1, display: "flex", justifyContent: "center", gap: 8 }} aria-hidden>
          {Array.from({ length: totalScreens }).map((_, i) => {
            const idx = i + 1;
            const active = idx === screen;
            const past = idx < screen;
            return (
              <span
                key={i}
                style={{
                  width: active ? 8 : 6,
                  height: active ? 8 : 6,
                  borderRadius: "50%",
                  background: active
                    ? "var(--text)"
                    : past
                      ? "var(--text-2)"
                      : "var(--n-3, var(--border))",
                  transition: "all var(--d-base, 200ms) ease-out",
                }}
              />
            );
          })}
        </div>
        <div style={{ flex: "0 0 auto", width: 80, textAlign: "right" }}>
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
            }}
          >
            {mode === "edit" ? "Cancel edit" : "Cancel"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ScreenHead({ question, sub }: { question: string; sub?: string }) {
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
            maxWidth: 600,
          }}
        >
          {sub}
        </p>
      )}
    </div>
  );
}

function FooterRow({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "center",
        gap: 12,
        marginTop: 8,
      }}
    >
      {children}
    </div>
  );
}

function PrimaryFooter({ label, disabled }: { label: string; disabled: boolean }) {
  return (
    <FooterRow>
      <button
        type="submit"
        className="btn btn-primary"
        disabled={disabled}
        style={disabled ? { opacity: 0.5, cursor: "not-allowed" } : undefined}
      >
        {label}
      </button>
    </FooterRow>
  );
}

/* ============ Screen 1 ============ */

function Screen1({
  allTypes,
  checkedTypes,
  onToggle,
  onPaste,
  footer,
}: {
  allTypes: { type: string; title: string }[];
  checkedTypes: Set<string>;
  onToggle: (type: string) => void;
  onPaste: () => void;
  footer: ReactNode;
}) {
  return (
    <>
      <ScreenHead
        question="When would you consider a client fully onboarded?"
        sub="GoCSM watches HighLevel and checks steps off automatically — no one marks checkboxes."
      />
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {allTypes.map((s) => {
          const checked = checkedTypes.has(s.type);
          return (
            <label
              key={s.type}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                minHeight: 44,
                padding: "0 12px",
                borderRadius: "var(--r-sm)",
                cursor: "pointer",
                transition: "background var(--d-base, 200ms) ease-out",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-1, var(--bg-subtle))")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <CheckBox checked={checked} onChange={() => onToggle(s.type)} label={s.title} />
              <span style={{ fontSize: 15, fontWeight: 500, color: "var(--text)" }}>
                {s.title}
              </span>
            </label>
          );
        })}
      </div>
      <div>
        <button
          type="button"
          onClick={onPaste}
          style={{
            background: "none",
            border: "none",
            padding: 0,
            fontSize: 13,
            color: "var(--text-3)",
            textDecoration: "underline",
            textUnderlineOffset: 2,
            cursor: "pointer",
          }}
        >
          paste your existing checklist instead →
        </button>
      </div>
      {footer}
    </>
  );
}

function CheckBox({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <span
      style={{
        position: "relative",
        width: 20,
        height: 20,
        flexShrink: 0,
        display: "inline-block",
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        aria-label={label}
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0,
          cursor: "pointer",
          margin: 0,
        }}
      />
      <span
        aria-hidden
        style={{
          width: 20,
          height: 20,
          borderRadius: "var(--r-sm)",
          border: `1.5px solid ${checked ? "var(--info-7)" : "var(--border)"}`,
          background: checked ? "var(--info-7)" : "var(--surface)",
          display: "grid",
          placeItems: "center",
          transition: "all var(--d-base, 200ms) ease-out",
        }}
      >
        {checked && <Check size={14} color="#fff" strokeWidth={3} />}
      </span>
    </span>
  );
}

/* ============ Screen 2 ============ */

function Screen2({
  value,
  onChange,
  footer,
}: {
  value: number;
  onChange: (n: number) => void;
  footer: ReactNode;
}) {
  return (
    <>
      <ScreenHead
        question="How long should onboarding usually take?"
        sub="the promise you make on your sales calls"
      />
      <div style={{ display: "flex", alignItems: "center", gap: 12, paddingTop: 8 }}>
        <input
          type="number"
          min={1}
          max={180}
          value={value}
          onChange={(e) => {
            const n = parseInt(e.target.value, 10);
            if (!Number.isNaN(n)) onChange(n);
          }}
          autoFocus
          className="mono"
          style={{
            height: 56,
            width: 96,
            fontSize: 24,
            textAlign: "center",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--r-md)",
            color: "var(--text)",
            fontFamily: "var(--font-mono)",
          }}
        />
        <span style={{ fontSize: 16, color: "var(--text-2)" }}>days</span>
      </div>
      {footer}
    </>
  );
}

/* ============ Screen 3 ============ */

function Screen3({
  value,
  onChange,
  variants,
  onVariantsChange,
  masterStepIds,
  allSteps,
  masterTargetDays,
  footer,
}: {
  value: PlanScoping;
  onChange: (v: PlanScoping) => void;
  variants: PlanVariant[];
  onVariantsChange: (next: PlanVariant[]) => void;
  masterStepIds: string[];
  allSteps: { id: string; title: string }[];
  masterTargetDays: number;
  footer: ReactNode;
}) {
  function updateVariant(id: string, patch: Partial<PlanVariant>) {
    onVariantsChange(variants.map((v) => (v.id === id ? { ...v, ...patch } : v)));
  }
  function addVariant() {
    const n = variants.filter((v) => !v.isMaster).length + 1;
    onVariantsChange([
      ...variants,
      { id: `plan-${Date.now().toString(36)}`, name: `Plan ${n}` },
    ]);
  }
  function removeVariant(id: string) {
    onVariantsChange(variants.filter((v) => v.id !== id));
  }
  return (
    <>
      <ScreenHead question="Same checklist for every plan?" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 12 }}>
        <RadioCard
          selected={value === "single"}
          onSelect={() => onChange("single")}
          title="Yes, all plans"
          body="one checklist applies to everyone"
        />
        <RadioCard
          selected={value === "per-plan"}
          onSelect={() => onChange("per-plan")}
          title="Customize per plan"
          body="different checklists for different plans"
        />
      </div>
      {value === "per-plan" && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            padding: 12,
            border: "1px solid var(--border)",
            borderRadius: "var(--r-md)",
            background: "var(--bg-subtle)",
          }}
        >
          {variants.map((v) => (
            <VariantRow
              key={v.id}
              variant={v}
              allSteps={allSteps}
              masterStepIds={masterStepIds}
              masterTargetDays={masterTargetDays}
              onChange={(patch) => updateVariant(v.id, patch)}
              onRemove={v.isMaster ? undefined : () => removeVariant(v.id)}
            />
          ))}
          <button
            type="button"
            onClick={addVariant}
            className="btn btn-ghost"
            style={{ alignSelf: "flex-start", fontSize: 12 }}
          >
            + Add plan
          </button>
        </div>
      )}
      {footer}
    </>
  );
}

function VariantRow({
  variant,
  allSteps,
  masterStepIds,
  masterTargetDays,
  onChange,
  onRemove,
}: {
  variant: PlanVariant;
  allSteps: { id: string; title: string }[];
  masterStepIds: string[];
  masterTargetDays: number;
  onChange: (patch: Partial<PlanVariant>) => void;
  onRemove?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const includedIds = variant.stepIds ?? masterStepIds;
  const includedSet = new Set(includedIds);
  const count = variant.isMaster ? masterStepIds.length : includedIds.length;
  const target = variant.targetDays ?? masterTargetDays;
  function toggle(id: string) {
    const next = masterStepIds.filter((sid) =>
      sid === id ? !includedSet.has(sid) : includedSet.has(sid),
    );
    onChange({ stepIds: next });
  }
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        padding: "8px 10px",
        background: "var(--surface)",
        border: "1px solid var(--border-soft)",
        borderRadius: "var(--r-sm)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {variant.isMaster ? (
          <span style={{ fontWeight: 500, color: "var(--text)", minWidth: 120 }}>
            {variant.name}
          </span>
        ) : (
          <input
            type="text"
            value={variant.name}
            onChange={(e) => onChange({ name: e.target.value })}
            aria-label="Plan name"
            style={{
              height: 28,
              padding: "0 8px",
              fontSize: 13,
              fontWeight: 500,
              minWidth: 120,
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--r-sm)",
              color: "var(--text)",
            }}
          />
        )}
        <span style={{ fontSize: 12, color: "var(--text-2)" }}>
          <span className="mono">{count}</span> steps
        </span>
        <span style={{ fontSize: 12, color: "var(--text-2)" }}>·</span>
        <span style={{ fontSize: 12, color: "var(--text-2)" }}>target</span>
        {variant.isMaster ? (
          <span className="mono" style={{ fontSize: 12, color: "var(--text-2)" }}>
            {target}d
          </span>
        ) : (
          <input
            type="number"
            min={1}
            max={180}
            value={target}
            onChange={(e) => {
              const n = parseInt(e.target.value, 10);
              if (!Number.isNaN(n)) onChange({ targetDays: n });
            }}
            className="mono"
            style={{
              height: 28,
              width: 56,
              padding: "0 6px",
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              textAlign: "center",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--r-sm)",
              color: "var(--text)",
            }}
          />
        )}
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          {!variant.isMaster && (
            <button
              type="button"
              onClick={() => setOpen((x) => !x)}
              className="btn btn-ghost"
              style={{ fontSize: 12, height: 28 }}
            >
              {open ? "Done" : "Pick steps"}
            </button>
          )}
          {onRemove && (
            <button
              type="button"
              onClick={onRemove}
              aria-label="Remove plan"
              style={{
                background: "none",
                border: "none",
                padding: 0,
                fontSize: 14,
                lineHeight: 1,
                color: "var(--text-3)",
                cursor: "pointer",
              }}
            >
              ×
            </button>
          )}
        </div>
      </div>
      {open && !variant.isMaster && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            maxHeight: 220,
            overflowY: "auto",
            paddingTop: 4,
            borderTop: "1px solid var(--border-soft)",
          }}
        >
          {allSteps.map((s) => {
            const on = includedSet.has(s.id);
            return (
              <label
                key={s.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  minHeight: 28,
                  fontSize: 13,
                  color: on ? "var(--text)" : "var(--text-3)",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={on}
                  onChange={() => toggle(s.id)}
                  style={{ margin: 0, cursor: "pointer" }}
                />
                {s.title}
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}


/* ============ Screen 4 ============ */

function Screen4({
  value,
  onChange,
  footer,
}: {
  value: ExperienceMode;
  onChange: (v: ExperienceMode) => void;
  isLast: boolean;
  footer: ReactNode;
}) {
  return (
    <>
      <ScreenHead question="Want your clients to see a guided checklist inside HighLevel?" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 12 }}>
        <RadioCard
          selected={value === "guided"}
          onSelect={() => onChange("guided")}
          title="Guided"
          body="your client sees a step-by-step checklist with help text and next-action links"
        />
        <RadioCard
          selected={value === "tracking_only"}
          onSelect={() => onChange("tracking_only")}
          title="Tracking-only"
          body="GoCSM tracks progress in the background; your client sees nothing extra in HighLevel"
        />
      </div>
      {footer}
    </>
  );
}

/* ============ Screen 5 ============ */

function Screen5({
  brandColor,
  onBrandColorChange,
  footer,
}: {
  brandColor: string | undefined;
  onBrandColorChange: (next: string | undefined) => void;
  footer: ReactNode;
}) {
  const current = (brandColor ?? DEFAULT_BRAND_COLOR).toLowerCase();
  const [hexInput, setHexInput] = useState(current);

  const commitHex = (raw: string) => {
    const n = normalizeHex(raw);
    if (n) onBrandColorChange(n);
  };

  return (
    <>
      <ScreenHead question="Make it yours" sub="your client sees this color on their checklist" />
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          {BRAND_PRESETS.map((c) => {
            const selected = c.toLowerCase() === current;
            return (
              <button
                key={c}
                type="button"
                aria-label={`Use ${c}`}
                aria-pressed={selected}
                onClick={() => {
                  onBrandColorChange(c);
                  setHexInput(c);
                }}
                style={{
                  width: 32,
                  height: 32,
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
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            type="text"
            value={hexInput}
            spellCheck={false}
            onChange={(e) => {
              setHexInput(e.target.value);
              commitHex(e.target.value);
            }}
            onBlur={() => {
              const n = normalizeHex(hexInput);
              setHexInput(n ?? current);
            }}
            placeholder="#0f766e"
            aria-label="Custom hex color"
            className="mono"
            style={{
              width: 140,
              height: 36,
              padding: "0 10px",
              fontFamily: "var(--font-mono)",
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
              width: 32,
              height: 32,
              borderRadius: "var(--r-sm)",
              background: normalizeHex(hexInput) ?? "transparent",
              border: "1px solid var(--border)",
            }}
          />
          {brandColor && (
            <button
              type="button"
              onClick={() => {
                onBrandColorChange(undefined);
                setHexInput(DEFAULT_BRAND_COLOR);
              }}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                fontSize: 12,
                color: "var(--text-3)",
                textDecoration: "underline",
                cursor: "pointer",
              }}
            >
              Use default
            </button>
          )}
        </div>
      </div>
      {footer}
    </>
  );
}

/* ============ Bits ============ */

function RadioCard({
  selected,
  onSelect,
  title,
  body,
}: {
  selected: boolean;
  onSelect: () => void;
  title: string;
  body: string;
}) {
  const style: CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    padding: 20,
    minHeight: 120,
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "var(--r-md)",
    cursor: "pointer",
    textAlign: "left",
    outline: selected ? "2px solid var(--info-7)" : "2px solid transparent",
    outlineOffset: -2,
    transition: "outline var(--d-base, 200ms) ease-out",
  };
  return (
    <button type="button" onClick={onSelect} aria-pressed={selected} style={style}>
      <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>{title}</span>
      <span style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.5 }}>{body}</span>
    </button>
  );
}
