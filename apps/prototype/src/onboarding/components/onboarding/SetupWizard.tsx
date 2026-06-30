// SetupWizard — the primary journey-builder for GoCSM onboarding.
//
// Design-loop output (2026-06). A guided wizard that takes a brand-new,
// non-technical agency owner to a published, genuinely-customized client
// onboarding checklist at ~100% completion — WITHOUT trading away the agency's
// power. Smart defaults make the happy path one-click; full customization is
// progressive depth, and the product's USP (GoCSM auto-verifies real HighLevel
// state — competitors only play videos) is made visible on every step.
//
//   1 Template     pick a starting point (or blank)
//   2 Steps        per-step: rename, edit client copy, attach video, choose how
//                  it's confirmed (auto / client / web event / info), and add
//                  per-asset sub-steps ("activate THESE 3 workflows")
//   3 Order        up/down (dependency-guarded)
//   4 Experience   guided checklist vs tracking-only
//   5 Look & feel  visual placement picker + brand colour (auto-detected)
//   6 Review       summary + one focal Publish
//
// Two-pane: decision column left, a PERSISTENT "what your client sees" preview
// pinned right, live-updating. Built to the micro-craft checklist + the research
// dossiers (badge-as-trust-signal, inline-customize-with-pinned-preview, visual
// placement cards, "pulled from your brand" attribution).

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Check,
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  Plus,
  X,
  ArrowRight,
  Hand,
  Webhook,
  Info,
  Search,
  Sparkles,
  Settings2,
} from "lucide-react";
import {
  saveJourney,
  type Journey,
  type Step,
  type StepDetector,
  type ExperienceMode,
  type Placement,
} from "@onb/lib/types";
import {
  getCatalogEntry,
  canAutoDetect,
  newWebhookToken,
  webhookUrl,
  assetNoun,
  ASSET_TYPES,
} from "@onb/lib/catalog";
import {
  SNAPSHOT_ACCOUNTS,
  fetchSnapshotAssets,
  snapshotAccountName,
  rememberedSnapshotId,
  rememberSnapshotId,
} from "@onb/lib/snapshot";
import { TEMPLATES, cloneTemplate, createEmptyDraft } from "@onb/lib/templates";
import {
  OUTCOME_GROUPS,
  OTHER_GROUP,
  plainTitle,
  plainSub,
  groupSteps,
  previewJourney,
  completionBadge,
  type CompletionTone,
} from "@onb/lib/plain-content";
import { BRAND_PRESETS, getHighLevelBrandColor, normalizeHex } from "@onb/lib/clientAccent";
import { ClientPreview, PlacementTab } from "@onb/components/onboarding/ClientPreview";
import { SaveStatusPill, type SaveStatus } from "@onb/components/onboarding/SaveStatusPill";

const STEPS = [
  { id: 1, label: "Template" },
  { id: 2, label: "Steps" },
  { id: 3, label: "Order" },
  { id: 4, label: "Experience" },
  { id: 5, label: "Look & feel" },
  { id: 6, label: "Review" },
] as const;

let _seq = 0;
function stepFromType(type: string, order: number): Step {
  const c = getCatalogEntry(type);
  _seq += 1;
  return {
    id: `c-${order}-${_seq}`,
    order,
    title: c.defaultTitle,
    type,
    tier: c.tier,
    owner: c.owner,
    state: "not_started",
    slaHours: c.slaHours,
    dependencies: [],
    deepLink: c.deepLink,
    mapping: { confidence: "fact", source: "scratch" },
  };
}

const renumber = (steps: Step[]): Step[] => steps.map((s, i) => ({ ...s, order: i + 1 }));

export function SetupWizard({
  journey,
  onChange,
  initialStep = 1,
  onExit,
  onPublished,
}: {
  journey: Journey;
  onChange: (next: Journey) => void;
  initialStep?: number;
  onExit?: () => void;
  onPublished?: (next: Journey) => void;
}) {
  const [step, setStep] = useState<number>(initialStep);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("standard");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [savedAt, setSavedAt] = useState<number | null>(null);
  // Brand colour auto-detected from the agency's HighLevel brand on first run.
  const [brandAuto, setBrandAuto] = useState(false);

  const update = (next: Journey) => {
    onChange(next);
    setSaveStatus("saving");
    saveJourney(next);
    setSavedAt(Date.now());
    setSaveStatus("saved");
  };

  // Pre-select the agency's brand colour (pulled from their HighLevel brand)
  // so "Look & feel" opens already personalised — they confirm, not configure.
  useEffect(() => {
    if (!journey.brandColor) {
      setBrandAuto(true);
      update({ ...journey, brandColor: getHighLevelBrandColor() });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function publish() {
    const next = { ...journey, status: "published" as const };
    saveJourney(next);
    onChange(next);
    setSavedAt(Date.now());
    setSaveStatus("published");
    onPublished?.(next);
  }

  const isLast = step === STEPS.length;
  const preview = useMemo(() => previewJourney(journey), [journey]);
  const noSteps = journey.steps.length === 0;

  return (
    <div style={{ maxWidth: 1024, margin: "0 auto" }}>
      <StepNav current={step} onJump={setStep} />

      {/* Two-pane: decision column · persistent client preview */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) 380px",
          gap: "var(--s-6)",
          alignItems: "start",
          marginTop: "var(--s-8)",
        }}
      >
        <main style={{ minWidth: 0, maxWidth: 620 }}>
          {step === 1 && (
            <TemplateStep
              selected={selectedTemplate}
              onPick={(id) => {
                setSelectedTemplate(id);
                update(id === "blank" ? createEmptyDraft() : cloneTemplate(id));
              }}
            />
          )}
          {step === 2 && <StepsStep journey={journey} onChange={update} />}
          {step === 3 && <OrderStep journey={journey} onChange={update} />}
          {step === 4 && <ExperienceStep journey={journey} onChange={update} />}
          {step === 5 && (
            <LookFeelStep journey={journey} onChange={update} brandAuto={brandAuto} onBrandTouched={() => setBrandAuto(false)} />
          )}
          {step === 6 && <ReviewStep journey={journey} onEditStep={setStep} />}
        </main>

        <aside style={{ position: "sticky", top: "var(--s-4)" }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "var(--text-3)",
              marginBottom: "var(--s-2)",
            }}
          >
            What your client sees
          </div>
          {noSteps ? (
            <div
              style={{
                border: "1px dashed var(--border-strong)",
                borderRadius: "var(--r-lg)",
                padding: "var(--s-8) var(--s-4)",
                textAlign: "center",
                fontSize: 13,
                color: "var(--text-3)",
                background: "var(--bg-subtle)",
              }}
            >
              Add a step to see your client's checklist here.
            </div>
          ) : (
            <ClientPreview journey={preview} hideProgressCount />
          )}
        </aside>
      </div>

      {/* Sticky footer */}
      <footer
        style={{
          position: "sticky",
          bottom: 0,
          marginTop: "var(--s-6)",
          padding: "var(--s-4) var(--s-2)",
          borderTop: "1px solid var(--border)",
          background: "var(--bg)",
          display: "flex",
          alignItems: "center",
          gap: "var(--s-4)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "var(--s-3)" }}>
          {step > 1 ? (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setStep((s) => s - 1)} style={{ color: "var(--text-2)" }}>
              <ChevronLeft size={15} aria-hidden style={{ marginRight: 2 }} />
              Back
            </button>
          ) : (
            onExit && (
              <button type="button" className="btn btn-ghost btn-sm" onClick={onExit} style={{ color: "var(--text-3)" }}>
                Cancel
              </button>
            )
          )}
          <SaveStatusPill status={saveStatus} lastSavedAt={savedAt} />
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "var(--s-3)" }}>
          {isLast ? (
            <button type="button" className="btn btn-primary" onClick={publish} disabled={noSteps}>
              {journey.status === "published" ? "Publish changes" : "Publish checklist"}
              <ArrowRight size={16} aria-hidden style={{ marginLeft: 6 }} />
            </button>
          ) : (
            <button type="button" className="btn btn-primary" onClick={() => setStep((s) => s + 1)}>
              Continue
              <ChevronRight size={16} aria-hidden style={{ marginLeft: 2 }} />
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}

/* ==========================================================================
   Step navigator
========================================================================== */

function StepNav({ current, onJump }: { current: number; onJump: (n: number) => void }) {
  return (
    <nav
      aria-label="Setup steps"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "var(--s-2)",
        paddingBottom: "var(--s-5)",
        borderBottom: "1px solid var(--border)",
        flexWrap: "wrap",
      }}
    >
      {STEPS.map((s, i) => {
        const state = s.id < current ? "done" : s.id === current ? "current" : "upcoming";
        return (
          <span key={s.id} style={{ display: "inline-flex", alignItems: "center", gap: "var(--s-2)" }}>
            <button
              type="button"
              onClick={() => onJump(s.id)}
              aria-current={state === "current" ? "step" : undefined}
              style={{ display: "inline-flex", alignItems: "center", gap: "var(--s-2)", background: "none", border: "none", cursor: "pointer", padding: "2px 4px", borderRadius: "var(--r-sm)" }}
            >
              <span
                aria-hidden
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 22,
                  height: 22,
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 600,
                  fontFamily: "var(--font-ui)",
                  flexShrink: 0,
                  background: state === "upcoming" ? "var(--surface)" : "var(--blue-7)",
                  color: state === "upcoming" ? "var(--text-3)" : "#fff",
                  border: state === "upcoming" ? "1px solid var(--border-strong)" : "none",
                }}
              >
                {state === "done" ? <Check size={13} /> : s.id}
              </span>
              <span style={{ fontSize: 13, fontWeight: state === "current" ? 600 : 500, color: state === "current" ? "var(--text)" : "var(--text-3)" }}>
                {s.label}
              </span>
            </button>
            {i < STEPS.length - 1 && <span aria-hidden style={{ width: 14, height: 1, background: "var(--border-strong)" }} />}
          </span>
        );
      })}
    </nav>
  );
}

function StepHeader({ stepNo, question, helper }: { stepNo: number; question: string; helper: ReactNode }) {
  return (
    <header style={{ marginBottom: "var(--s-6)" }}>
      <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: "var(--s-2)" }}>
        Step {stepNo} of {STEPS.length}
      </div>
      <h1 style={{ fontFamily: "var(--font-ui)", fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.2, color: "var(--text)", margin: 0 }}>
        {question}
      </h1>
      <p style={{ fontSize: 14, lineHeight: 1.5, color: "var(--text-2)", margin: "var(--s-2) 0 0", maxWidth: "60ch" }}>{helper}</p>
    </header>
  );
}

/* ==========================================================================
   Step 1 — Template
========================================================================== */

function TemplateStep({ selected, onPick }: { selected: string; onPick: (id: string) => void }) {
  return (
    <div>
      <StepHeader stepNo={1} question="Which checklist fits your clients?" helper="We've built each one for you. Pick the closest — you can change anything later." />
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-3)" }}>
        {TEMPLATES.map((t) => {
          const isSel = selected === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onPick(t.id)}
              style={{
                textAlign: "left",
                cursor: "pointer",
                background: isSel ? "var(--blue-1)" : "var(--surface)",
                border: `1.5px solid ${isSel ? "var(--blue-7)" : "var(--border-strong)"}`,
                borderRadius: "var(--r-md)",
                padding: "var(--s-4)",
                minHeight: 84,
                display: "flex",
                alignItems: "flex-start",
                gap: "var(--s-3)",
                boxShadow: isSel ? "none" : "var(--sh-rest)",
              }}
            >
              <SelectDot selected={isSel} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--s-2)", flexWrap: "wrap" }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>{t.name}</span>
                  {t.recommended && <RecommendedBadge />}
                </div>
                <p style={{ fontSize: 13, color: "var(--text-2)", margin: "var(--s-1) 0 0", lineHeight: 1.45 }}>{t.tagline}</p>
                <div className="mono" style={{ fontSize: 12, color: "var(--text-3)", marginTop: "var(--s-2)" }}>
                  {t.stepCount} steps · about {t.weeks} {t.weeks === 1 ? "week" : "weeks"}
                </div>
              </div>
            </button>
          );
        })}
      </div>
      <button
        type="button"
        onClick={() => onPick("blank")}
        style={{
          marginTop: "var(--s-3)",
          textAlign: "left",
          cursor: "pointer",
          background: selected === "blank" ? "var(--blue-1)" : "transparent",
          border: `1.5px dashed ${selected === "blank" ? "var(--blue-7)" : "var(--border-strong)"}`,
          borderRadius: "var(--r-md)",
          padding: "var(--s-3) var(--s-4)",
          display: "flex",
          alignItems: "center",
          gap: "var(--s-3)",
          width: "100%",
        }}
      >
        <SelectDot selected={selected === "blank"} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>Start from a blank checklist</div>
          <div style={{ fontSize: 12.5, color: "var(--text-3)", marginTop: 1 }}>Build your own from scratch — you'll add the steps next.</div>
        </div>
      </button>
    </div>
  );
}

/* ==========================================================================
   Step 2 — Steps (badges + per-step inline customize + add/custom)
========================================================================== */

function StepsStep({ journey, onChange }: { journey: Journey; onChange: (j: Journey) => void }) {
  const [adding, setAdding] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null); // single-open accordion
  const steps = journey.steps;
  const grouped = useMemo(() => groupSteps(steps), [steps]);
  const present = useMemo(() => new Set(steps.map((s) => s.type)), [steps]);
  const addable = useMemo(() => {
    // Asset steps (workflows / funnels) stay addable even when already present —
    // so an agency can make each workflow its OWN step.
    return OUTCOME_GROUPS.map((g) => ({
      group: g,
      types: g.types.filter((t) => !present.has(t) || ASSET_TYPES.has(t)),
    })).filter((g) => g.types.length > 0);
  }, [present]);

  const commit = (next: Step[]) => onChange({ ...journey, steps: renumber(next) });
  const patchStep = (id: string, patch: Partial<Step>) => commit(steps.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  const removeStep = (id: string) => commit(steps.filter((s) => s.id !== id));
  const addStep = (type: string) => {
    const s = stepFromType(type, steps.length + 1);
    commit([...steps, s]);
    setAdding(false);
    setOpenId(s.id);
  };
  const addCustom = () => {
    const s = stepFromType("custom_manual", steps.length + 1);
    s.title = "New step";
    s.detector = "manual";
    commit([...steps, s]);
    setAdding(false);
    setOpenId(s.id);
  };

  return (
    <div>
      <StepHeader
        stepNo={2}
        question="What's on your client's checklist?"
        helper={
          <>
            Other tools mark a step done when your client <em>watches a video</em>.{" "}
            <strong style={{ color: "var(--text)" }}>GoCSM auto-verifies it</strong> — it watches your client's
            HighLevel, ticks each step off when the work is actually done, and shows you who's stuck. Customize any
            step's wording, video, or how it's confirmed.
          </>
        }
      />
      <div className="mono" style={{ fontSize: 12, color: "var(--text-3)", margin: "calc(-1 * var(--s-3)) 0 var(--s-4)" }}>
        {steps.length} steps · change anything, even after publishing.
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-5)" }}>
        {[...OUTCOME_GROUPS, OTHER_GROUP].map((g) => {
          const list = grouped.get(g.id) ?? [];
          if (list.length === 0) return null;
          return (
            <section key={g.id}>
              <GroupLabel label={g.label} sub={g.sub} />
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "var(--s-2)" }}>
                {list.map((s) => (
                  <StepRow
                    key={s.id}
                    step={s}
                    open={openId === s.id}
                    onToggle={() => setOpenId((id) => (id === s.id ? null : s.id))}
                    onPatch={(patch) => patchStep(s.id, patch)}
                    onRemove={() => removeStep(s.id)}
                  />
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      <div style={{ marginTop: "var(--s-4)" }}>
        {!adding ? (
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setAdding(true)} style={{ color: "var(--info-7)" }}>
            <Plus size={15} aria-hidden style={{ marginRight: 4 }} />
            Add a step
          </button>
        ) : (
          <div className="card card-padded" style={{ marginTop: 4 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--s-3)" }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>Add a step</span>
              <button type="button" aria-label="Close" onClick={() => setAdding(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)" }}>
                <X size={15} />
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-3)" }}>
              {addable.map(({ group, types }) => (
                <div key={group.id}>
                  <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--text-3)", marginBottom: "var(--s-2)" }}>{group.label}</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--s-2)" }}>
                    {types.map((t) => (
                      <button key={t} type="button" className="btn btn-secondary btn-sm" onClick={() => addStep(t)}>
                        <Plus size={13} aria-hidden style={{ marginRight: 4 }} />
                        {present.has(t) ? "Another — " : ""}
                        {plainTitle(t, t)}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <div style={{ borderTop: "1px solid var(--border)", paddingTop: "var(--s-3)" }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={addCustom}>
                  <Plus size={13} aria-hidden style={{ marginRight: 4 }} />
                  Your own custom step
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StepRow({
  step,
  open,
  onToggle,
  onPatch,
  onRemove,
}: {
  step: Step;
  open: boolean;
  onToggle: () => void;
  onPatch: (patch: Partial<Step>) => void;
  onRemove: () => void;
}) {
  const badge = completionBadge(step);
  const title = plainTitle(step.type, step.title);
  const assetCount = step.assets?.length ?? 0;
  return (
    <li
      style={{
        background: "var(--surface)",
        border: `1px solid ${open ? "var(--blue-7)" : "var(--border)"}`,
        borderRadius: "var(--r-md)",
        boxShadow: "var(--sh-rest)",
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "var(--s-3)", padding: "var(--s-3) var(--s-3) var(--s-3) var(--s-4)" }}>
        <CheckMark />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--s-2)", flexWrap: "wrap" }}>
            <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text)", lineHeight: 1.35 }}>{title}</span>
            <CompletionPill badge={badge} />
            {assetCount > 0 && (
              <span className="mono" style={{ fontSize: 11, color: "var(--text-3)" }}>
                {assetCount} {assetCount === 1 ? "item" : "items"}
              </span>
            )}
          </div>
          {!open && (
            <div
              style={{
                fontSize: 12.5,
                color: "var(--text-3)",
                lineHeight: 1.45,
                marginTop: 2,
                display: "-webkit-box",
                WebkitLineClamp: 1,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {assetCount > 0 ? step.assets!.map((a) => a.name).join(" · ") : step.instructions || plainSub(step.type)}
            </div>
          )}
        </div>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={onToggle}
          aria-expanded={open}
          style={{ color: open ? "var(--info-7)" : "var(--text-2)", flexShrink: 0 }}
        >
          <Settings2 size={14} aria-hidden style={{ marginRight: 4 }} />
          {open ? "Done" : "Customize"}
        </button>
        <button type="button" aria-label={`Remove "${title}"`} onClick={onRemove} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", padding: 4, flexShrink: 0, alignSelf: "center" }}>
          <X size={15} />
        </button>
      </div>
      {open && <StepCustomize step={step} onPatch={onPatch} />}
    </li>
  );
}

/* --------------------------- per-step inline editor ------------------------ */

function StepCustomize({ step, onPatch }: { step: Step; onPatch: (patch: Partial<Step>) => void }) {
  const isAsset = ASSET_TYPES.has(step.type);
  const noun = assetNoun(step.type);
  const instr = step.instructions ?? getCatalogEntry(step.type).clientInstructions;

  return (
    <div style={{ borderTop: "1px solid var(--border)", padding: "var(--s-4)", paddingLeft: "calc(var(--s-4) + 30px)", background: "var(--bg-subtle)", display: "flex", flexDirection: "column", gap: "var(--s-4)" }}>
      {/* Title */}
      <Field label="Step title — how you'd like it worded">
        <input
          className="input"
          value={step.title}
          onChange={(e) => onPatch({ title: e.target.value })}
          style={{ fontSize: 13.5 }}
        />
      </Field>

      {/* What the client sees */}
      <Field label="What your client sees">
        <textarea
          className="textarea"
          rows={2}
          value={instr}
          onChange={(e) => onPatch({ instructions: e.target.value })}
          placeholder="What to do, and why it matters to their business."
          style={{ fontSize: 13.5, resize: "vertical", lineHeight: 1.5 }}
        />
      </Field>

      {/* Sub-steps for asset-type steps */}
      {isAsset && noun && <SubStepEditor step={step} noun={noun} onPatch={onPatch} />}

      {/* How it's confirmed */}
      <CompletionPicker step={step} onPatch={onPatch} />

      {/* Video */}
      <VideoPicker step={step} onPatch={onPatch} />
    </div>
  );
}

function SubStepEditor({ step, noun, onPatch }: { step: Step; noun: { singular: string; plural: string; verb: string; verbs: string; question: string; placeholder: string }; onPatch: (p: Partial<Step>) => void }) {
  const assets = step.assets ?? [];
  // Default is always "any" — only an explicit "specific" opts into naming one.
  const scope: "any" | "specific" = step.assetScope === "specific" ? "specific" : "any";
  const accountId = step.snapshotAccountId ?? "";
  // "Specific" means ONE named asset per step (add another step for another). So
  // the selection is single-value, not a multi-select.
  const selectedAsset = assets[0]?.name ?? "";

  const chooseAny = () => onPatch({ assetScope: "any", assets: [] });
  const chooseSpecific = () => {
    // Pre-fill the snapshot the agency picked on an earlier asset step, so they
    // don't re-choose it every time.
    const remembered = rememberedSnapshotId();
    onPatch({
      assetScope: "specific",
      ...(accountId || !remembered ? {} : { snapshotAccountId: remembered }),
    });
  };
  const chooseAccount = (id: string) => {
    rememberSnapshotId(id);
    // a new sub-account invalidates any asset picked from the old one
    onPatch({ snapshotAccountId: id, assets: [] });
  };
  const chooseAsset = (name: string) => onPatch({ assets: name ? [{ name, done: false }] : [] });

  const accountOptions = SNAPSHOT_ACCOUNTS.map((a) => ({ value: a.id, label: a.name }));
  const assetOptions = (accountId ? fetchSnapshotAssets(accountId, step.type) : []).map((n) => ({ value: n, label: n }));
  const Singular = noun.singular.charAt(0).toUpperCase() + noun.singular.slice(1);

  return (
    <Field label={`Which ${noun.singular} should your client ${noun.verb}?`}>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-2)" }}>
        <ScopeOption
          name={`scope-${step.id}`}
          checked={scope === "any"}
          label={`Any ${noun.singular} counts`}
          sub={`Your client ${noun.verbs} any ${noun.singular} — GoCSM ticks it off when the first one goes live.`}
          onSelect={chooseAny}
        />
        <ScopeOption
          name={`scope-${step.id}`}
          checked={scope === "specific"}
          label={`A specific ${noun.singular} from my snapshot`}
          sub={`Name the exact ${noun.singular} they must ${noun.verb} — GoCSM verifies that one. Want more? Add another step.`}
          onSelect={chooseSpecific}
        />
      </div>

      {scope === "specific" && (
        <div style={{ marginTop: "var(--s-3)", display: "flex", flexDirection: "column", gap: "var(--s-3)" }}>
          <div>
            <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 4 }}>Snapshot sub-account</div>
            <SearchSelect
              value={accountId}
              options={accountOptions}
              placeholder="Choose a snapshot sub-account…"
              searchPlaceholder="Search sub-accounts…"
              ariaLabel="Snapshot sub-account"
              onChange={chooseAccount}
            />
          </div>

          {accountId ? (
            <div>
              <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 4 }}>
                {Singular} in {snapshotAccountName(accountId)}
              </div>
              <SearchSelect
                value={selectedAsset}
                options={assetOptions}
                placeholder={`Choose a ${noun.singular} to ${noun.verb}…`}
                searchPlaceholder={`Search ${noun.plural}…`}
                ariaLabel={`${Singular} to ${noun.verb}`}
                onChange={chooseAsset}
              />
              {selectedAsset && (
                <p style={{ fontSize: 12, color: "var(--text-3)", margin: "var(--s-2) 0 0", lineHeight: 1.45 }}>
                  GoCSM verifies “{selectedAsset}” on its own. Need another {noun.singular}? Add another
                  “{plainTitle(step.type, step.title)}” step.
                </p>
              )}
            </div>
          ) : (
            <p style={{ fontSize: 12, color: "var(--text-3)", margin: 0 }}>
              Pick a snapshot sub-account to choose the {noun.singular}.
            </p>
          )}
        </div>
      )}
    </Field>
  );
}

/** A searchable single-select. Snapshots can hold dozens of workflows/funnels,
 *  so both the sub-account and the asset pickers let the agency type to narrow
 *  the list rather than scroll a long native <select>. */
function SearchSelect({
  value,
  options,
  placeholder,
  searchPlaceholder,
  ariaLabel,
  onChange,
}: {
  value: string;
  options: { value: string; label: string }[];
  placeholder: string;
  searchPlaceholder?: string;
  ariaLabel?: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [hover, setHover] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      setQuery("");
      searchRef.current?.focus();
    }
  }, [open]);

  const selected = options.find((o) => o.value === value);
  const q = query.trim().toLowerCase();
  const filtered = q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options;

  return (
    <div ref={rootRef} style={{ position: "relative" }}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: "var(--s-2)",
          fontFamily: "var(--font-ui)",
          fontSize: 13.5,
          color: selected ? "var(--text)" : "var(--text-3)",
          background: "var(--surface)",
          border: `1px solid ${open ? "var(--blue-7)" : "var(--border-strong)"}`,
          boxShadow: open ? "0 0 0 3px var(--blue-2)" : "none",
          borderRadius: "var(--r-sm)",
          padding: "9px 12px",
          lineHeight: 1.35,
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown size={15} aria-hidden style={{ color: "var(--text-3)", flexShrink: 0 }} />
      </button>

      {open && (
        <div
          role="listbox"
          style={{
            position: "absolute",
            zIndex: 40,
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--r-sm)",
            boxShadow: "var(--sh-rest)",
            overflow: "hidden",
          }}
        >
          <div style={{ padding: "var(--s-2)", borderBottom: "1px solid var(--border-soft)", position: "relative" }}>
            <Search size={14} aria-hidden style={{ position: "absolute", left: "calc(var(--s-2) + 9px)", top: "50%", transform: "translateY(-50%)", color: "var(--text-3)", pointerEvents: "none" }} />
            <input
              ref={searchRef}
              className="input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder ?? "Search…"}
              style={{ fontSize: 13, paddingLeft: 30 }}
            />
          </div>
          <div style={{ maxHeight: 220, overflowY: "auto", padding: 4 }}>
            {filtered.length === 0 ? (
              <div style={{ padding: "var(--s-2) var(--s-3)", fontSize: 12.5, color: "var(--text-3)" }}>No matches</div>
            ) : (
              filtered.map((o) => {
                const isSel = o.value === value;
                const isHover = hover === o.value;
                return (
                  <button
                    key={o.value}
                    type="button"
                    role="option"
                    aria-selected={isSel}
                    onMouseEnter={() => setHover(o.value)}
                    onMouseLeave={() => setHover((h) => (h === o.value ? null : h))}
                    onClick={() => {
                      onChange(o.value);
                      setOpen(false);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "var(--s-2)",
                      width: "100%",
                      textAlign: "left",
                      padding: "7px 8px",
                      border: "none",
                      borderRadius: "var(--r-sm)",
                      background: isSel ? "var(--blue-1)" : isHover ? "var(--bg-subtle)" : "transparent",
                      color: "var(--text)",
                      fontSize: 13.5,
                      cursor: "pointer",
                    }}
                  >
                    <Check size={14} aria-hidden style={{ color: "var(--blue-7)", flexShrink: 0, opacity: isSel ? 1 : 0 }} />
                    <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.label}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const DETECTORS: { id: StepDetector; label: string; sub: string; auto?: boolean }[] = [
  { id: "auto", label: "GoCSM checks it automatically", sub: "We watch HighLevel and tick it off the moment it happens — no action needed.", auto: true },
  { id: "manual", label: "Your client marks it done", sub: "Adds a 'Mark done' button to their checklist." },
  { id: "inbound_webhook", label: "Another tool reports it done", sub: "An app you already use marks this complete — we'll give you a link to connect it." },
  { id: "read_only", label: "Just for reference", sub: "Nothing to confirm — shown for information only." },
];

function CompletionPicker({ step, onPatch }: { step: Step; onPatch: (p: Partial<Step>) => void }) {
  // Out-of-the-box HighLevel feature → GoCSM auto-verifies it. That's the
  // product's job and our wedge — NOT the agency's to change. Show a locked
  // reassurance, no picker.
  if (canAutoDetect(step.type)) {
    return (
      <Field label="How it's confirmed">
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "var(--s-2)",
            padding: "var(--s-3)",
            background: "var(--pos-soft)",
            border: "1px solid var(--pos-7)",
            borderRadius: "var(--r-sm)",
          }}
        >
          <Check size={16} aria-hidden style={{ color: "var(--pos-7)", flexShrink: 0, marginTop: 1 }} />
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text)" }}>GoCSM verifies this automatically</div>
            <div style={{ fontSize: 12, color: "var(--text-2)", marginTop: 1, lineHeight: 1.45 }}>
              We watch your client's HighLevel and tick it off the moment the work is really done — nothing to set up,
              and nothing for you to manage.
            </div>
          </div>
        </div>
      </Field>
    );
  }

  // Custom step → GoCSM can't see it, so the agency picks how it's confirmed.
  const effective: StepDetector = step.detector ?? "manual";
  const options = DETECTORS.filter((d) => !d.auto);
  const select = (d: StepDetector) => {
    if (d === effective) return;
    const patch: Partial<Step> = { detector: d };
    if (d === "inbound_webhook" && !step.webhookToken) patch.webhookToken = newWebhookToken();
    onPatch(patch);
  };

  return (
    <Field label="How is this custom step confirmed?">
      <p style={{ fontSize: 12, color: "var(--text-3)", margin: "0 0 var(--s-2)", lineHeight: 1.45 }}>
        This isn't a standard HighLevel step, so GoCSM can't watch for it — tell us how it gets marked done.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-2)" }}>
        {options.map((d) => {
          const checked = effective === d.id;
          return (
            <label
              key={d.id}
              style={{
                display: "grid",
                gridTemplateColumns: "18px 1fr",
                alignItems: "start",
                gap: "var(--s-2)",
                padding: "var(--s-2) var(--s-3)",
                border: `1px solid ${checked ? "var(--blue-7)" : "var(--border)"}`,
                background: checked ? "var(--blue-1)" : "var(--surface)",
                borderRadius: "var(--r-sm)",
                cursor: "pointer",
              }}
            >
              <input type="radio" name={`det-${step.id}`} checked={checked} onChange={() => select(d.id)} style={{ marginTop: 2 }} />
              <span>
                <span style={{ fontSize: 13.5, fontWeight: 500, color: "var(--text)" }}>{d.label}</span>
                <span style={{ display: "block", fontSize: 12, color: "var(--text-3)", marginTop: 1, lineHeight: 1.4 }}>{d.sub}</span>
              </span>
            </label>
          );
        })}
        {effective === "inbound_webhook" && step.webhookToken && (
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-sm)", padding: "var(--s-2) var(--s-3)", marginTop: 2 }}>
            <div style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 2 }}>Paste this link into the other tool</div>
            <code style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--text-2)", wordBreak: "break-all" }}>{webhookUrl(step.webhookToken)}</code>
          </div>
        )}
      </div>
    </Field>
  );
}

function VideoPicker({ step, onPatch }: { step: Step; onPatch: (p: Partial<Step>) => void }) {
  const raw = step.videoRef ?? "default";
  const isCustom = raw.startsWith("link:");
  const url = isCustom ? raw.slice(5) : "";
  return (
    <Field label="Tutorial video">
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-2)" }}>
        <RadioLine
          checked={!isCustom}
          name={`vid-${step.id}`}
          label="GoCSM tutorial (white-label)"
          onSelect={() => onPatch({ videoRef: "default" })}
        />
        <RadioLine
          checked={isCustom}
          name={`vid-${step.id}`}
          label="Use my own video"
          onSelect={() => onPatch({ videoRef: "link:" + url })}
        />
        {isCustom && (
          <input
            className="input"
            value={url}
            onChange={(e) => onPatch({ videoRef: "link:" + e.target.value })}
            placeholder="Paste a YouTube, Vimeo or Loom link"
            style={{ fontSize: 13.5, marginLeft: 26 }}
          />
        )}
      </div>
    </Field>
  );
}

/* ==========================================================================
   Step 3 — Order
========================================================================== */

function OrderStep({ journey, onChange }: { journey: Journey; onChange: (j: Journey) => void }) {
  const steps = journey.steps;
  function canMove(from: number, to: number): boolean {
    if (to < 0 || to >= steps.length) return false;
    const moving = steps[from];
    const target = steps[to];
    if (to < from) return !moving.dependencies.includes(target.id);
    return !target.dependencies.includes(moving.id);
  }
  function move(index: number, dir: -1 | 1) {
    const to = index + dir;
    if (!canMove(index, to)) return;
    const next = steps.slice();
    [next[index], next[to]] = [next[to], next[index]];
    onChange({ ...journey, steps: renumber(next) });
  }
  return (
    <div>
      <StepHeader stepNo={3} question="What order should they go in?" helper="We've ordered these the way most clients move fastest. Nudge any step up or down if you'd like." />
      <ul style={{ listStyle: "none", margin: 0, padding: 0, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", boxShadow: "var(--sh-rest)", overflow: "hidden" }}>
        {steps.map((s, i) => (
          <li key={s.id} style={{ display: "flex", alignItems: "center", gap: "var(--s-3)", padding: "var(--s-2) var(--s-3) var(--s-2) var(--s-4)", borderTop: i === 0 ? "none" : "1px solid var(--border-soft)" }}>
            <span className="mono" style={{ fontSize: 13, color: "var(--text-3)", width: 18, flexShrink: 0, textAlign: "right" }}>{i + 1}</span>
            <span style={{ flex: 1, minWidth: 0, fontSize: 14, color: "var(--text)" }}>{plainTitle(s.type, s.title)}</span>
            <div style={{ display: "inline-flex", flexDirection: "column", gap: "var(--s-1)", flexShrink: 0 }}>
              <ArrowBtn dir="up" disabled={!canMove(i, i - 1)} onClick={() => move(i, -1)} />
              <ArrowBtn dir="down" disabled={!canMove(i, i + 1)} onClick={() => move(i, 1)} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ArrowBtn({ dir, disabled, onClick }: { dir: "up" | "down"; disabled: boolean; onClick: () => void }) {
  return (
    <button type="button" aria-label={dir === "up" ? "Move up" : "Move down"} disabled={disabled} onClick={onClick} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 30, height: 22, background: "none", border: "none", borderRadius: "var(--r-sm)", cursor: disabled ? "not-allowed" : "pointer", color: disabled ? "var(--n-6)" : "var(--text-2)", padding: 0 }}>
      {dir === "up" ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
    </button>
  );
}

/* ==========================================================================
   Step 4 — Experience
========================================================================== */

function ExperienceStep({ journey, onChange }: { journey: Journey; onChange: (j: Journey) => void }) {
  const mode: ExperienceMode = journey.experienceMode ?? "guided";
  const setMode = (m: ExperienceMode) => onChange({ ...journey, experienceMode: m });
  return (
    <div>
      <StepHeader stepNo={4} question="What do your clients see?" helper="Show them a guided checklist, or just track their progress quietly in the background." />
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-3)" }}>
        <BigOption selected={mode === "guided"} onClick={() => setMode("guided")} title="Show them a guided checklist" badge desc="A simple checklist appears inside their HighLevel, guiding each step with a how-to video." />
        <BigOption selected={mode === "tracking_only"} onClick={() => setMode("tracking_only")} title="Just track quietly — no checklist" desc="Your clients see nothing. You'll still see each client's progress and get an alert when one gets stuck — without showing them a checklist." />
      </div>
    </div>
  );
}

/* ==========================================================================
   Step 5 — Look & feel (visual placement + brand colour)
========================================================================== */

function LookFeelStep({
  journey,
  onChange,
  brandAuto,
  onBrandTouched,
}: {
  journey: Journey;
  onChange: (j: Journey) => void;
  brandAuto: boolean;
  onBrandTouched: () => void;
}) {
  const mode = journey.experienceMode ?? "guided";
  const placement: Placement = journey.placement ?? { mode: "banner" };
  const brand = journey.brandColor ?? getHighLevelBrandColor();

  const setBrand = (hex: string) => {
    onBrandTouched();
    onChange({ ...journey, brandColor: hex });
  };

  if (mode === "tracking_only") {
    return (
      <div>
        <StepHeader stepNo={5} question="Look & feel" helper="Your clients don't see a checklist on this journey, so there's nothing to style here." />
        <p style={{ fontSize: 13, color: "var(--text-3)" }}>Switch the previous step to a guided checklist to set placement and colour.</p>
      </div>
    );
  }

  return (
    <div>
      <StepHeader stepNo={5} question="Where it shows, and your colour" helper="Pick where your client's checklist appears inside HighLevel, and the colour it wears." />

      <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-6)" }}>
        <div>
          <MiniLabel>Where the checklist appears</MiniLabel>
          <div style={{ marginTop: "var(--s-3)", color: `var(--client-accent, ${brand})` }as React.CSSProperties}>
            <PlacementTab placement={placement} onChange={(next) => onChange({ ...journey, placement: next })} />
          </div>
        </div>

        <div>
          <MiniLabel>Brand colour</MiniLabel>
          <div
            style={{
              marginTop: "var(--s-3)",
              display: "flex",
              alignItems: "center",
              gap: "var(--s-3)",
              padding: "var(--s-3) var(--s-4)",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--r-md)",
            }}
          >
            <span aria-hidden style={{ width: 40, height: 40, borderRadius: "var(--r-md)", background: brand, boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.1)", flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--s-2)", flexWrap: "wrap" }}>
                <span className="mono" style={{ fontSize: 13, color: "var(--text)", fontWeight: 600 }}>{brand.toUpperCase()}</span>
                {brandAuto && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: "var(--ai-9, var(--blue-9))", background: "var(--ai-2, var(--blue-1))", padding: "2px 8px", borderRadius: "var(--r-pill)" }}>
                    <Sparkles size={11} aria-hidden /> Pulled from your brand
                  </span>
                )}
              </div>
              <div style={{ fontSize: 12.5, color: "var(--text-3)", marginTop: 2 }}>
                {brandAuto ? "We detected this from your account. Looks right? Keep it — or pick another below." : "Pick the colour your client's checklist will wear."}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--s-2)", marginTop: "var(--s-3)", flexWrap: "wrap" }}>
            {BRAND_PRESETS.map((hex) => (
              <button
                key={hex}
                type="button"
                aria-label={`Use ${hex}`}
                onClick={() => setBrand(hex)}
                style={{ width: 28, height: 28, borderRadius: 999, background: hex, border: brand.toLowerCase() === hex.toLowerCase() ? "2px solid var(--text)" : "2px solid var(--surface)", boxShadow: "0 0 0 1px var(--border-strong)", cursor: "pointer" }}
              />
            ))}
            <HexInput value={brand} onCommit={setBrand} />
          </div>
        </div>
      </div>
    </div>
  );
}

function HexInput({ value, onCommit }: { value: string; onCommit: (hex: string) => void }) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  return (
    <input
      className="input"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        const n = normalizeHex(draft);
        if (n) onCommit(n);
        else setDraft(value);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
      }}
      aria-label="Brand colour hex"
      style={{ width: 110, fontSize: 13, fontFamily: "var(--font-mono)" }}
      placeholder="#0f6fd6"
    />
  );
}

/* ==========================================================================
   Step 6 — Review
========================================================================== */

function ReviewStep({ journey, onEditStep }: { journey: Journey; onEditStep: (n: number) => void }) {
  const stepCount = journey.steps.length;
  const weeks = Math.max(1, Math.round((journey.targetDays || 14) / 7));
  const mode = journey.experienceMode ?? "guided";
  const autoCount = journey.steps.filter((s) => completionBadge(s).tone === "auto").length;
  const placementLabel = PLACEMENT_LABEL[journey.placement?.mode ?? "banner"];

  return (
    <div>
      <StepHeader stepNo={6} question="Ready to go live" helper="Here's your client's onboarding journey. Publish it as-is, or jump back to change anything." />
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-2)" }}>
        <SummaryRow label="Checklist" value={`${stepCount} steps · about ${weeks} ${weeks === 1 ? "week" : "weeks"}`} onEdit={() => onEditStep(2)} />
        <SummaryRow label="Tracking" value={`${autoCount} of ${stepCount} auto-verified by GoCSM`} onEdit={() => onEditStep(2)} />
        <SummaryRow label="Order" value="Recommended order" onEdit={() => onEditStep(3)} />
        <SummaryRow label="Clients see" value={mode === "guided" ? `Guided checklist · ${placementLabel}` : "Tracked quietly (no checklist)"} onEdit={() => onEditStep(4)} />
      </div>

      <div style={{ display: "flex", alignItems: "flex-start", gap: "var(--s-2)", marginTop: "var(--s-4)", padding: "var(--s-3) var(--s-4)", background: "var(--blue-1)", border: "1px solid var(--blue-2)", borderRadius: "var(--r-md)" }}>
        <Check size={16} aria-hidden style={{ color: "var(--blue-7)", flexShrink: 0, marginTop: 1 }} />
        <p style={{ fontSize: 13, color: "var(--text-2)", margin: 0, lineHeight: 1.5 }}>
          Once live, GoCSM checks each step off automatically by watching your client's HighLevel — no one ticks boxes — and flags anyone who gets stuck, so you can step in.
        </p>
      </div>
    </div>
  );
}

const PLACEMENT_LABEL: Record<string, string> = {
  banner: "Top banner",
  floating: "Floating button",
  menu: "In their menu",
  embed: "Embedded page",
};

function SummaryRow({ label, value, onEdit }: { label: string; value: string; onEdit: () => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "var(--s-3)", padding: "var(--s-3) var(--s-4)", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-md)" }}>
      <div style={{ minWidth: 92, fontSize: 12, color: "var(--text-3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.03em" }}>{label}</div>
      <div style={{ flex: 1, fontSize: 14, color: "var(--text)" }}>{value}</div>
      <button type="button" className="btn btn-ghost btn-sm" onClick={onEdit} style={{ color: "var(--info-7)" }}>
        Edit
        <ChevronRight size={14} aria-hidden style={{ marginLeft: 2 }} />
      </button>
    </div>
  );
}

/* ==========================================================================
   Small shared pieces
========================================================================== */

function CompletionPill({ badge }: { badge: { label: string; tone: CompletionTone; tip: string } }) {
  // "Auto-verified" is the default & the USP — present on every row but rendered
  // recessively (a quiet green tick, no pill) so the EXCEPTIONS (the rows the
  // agency changed to client/web-event/info) are what pop.
  if (badge.tone === "auto") {
    return (
      <span title={badge.tip} style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 11, fontWeight: 600, color: "var(--pos-7)", whiteSpace: "nowrap" }}>
        <Check size={11} aria-hidden style={{ opacity: 0.9 }} />
        Auto-verified
      </span>
    );
  }
  const map: Record<Exclude<CompletionTone, "auto">, { bg: string; fg: string; icon: ReactNode }> = {
    manual: { bg: "var(--bg-element)", fg: "var(--text-2)", icon: <Hand size={11} /> },
    webhook: { bg: "var(--bg-element)", fg: "var(--text)", icon: <Webhook size={11} /> },
    info: { bg: "var(--blue-1)", fg: "var(--blue-9)", icon: <Info size={11} /> },
  };
  const s = map[badge.tone];
  return (
    <span title={badge.tip} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: s.fg, background: s.bg, padding: "1px 7px", borderRadius: "var(--r-pill)", whiteSpace: "nowrap" }}>
      {s.icon}
      {badge.label}
    </span>
  );
}

function BigOption({ selected, onClick, title, desc, badge }: { selected: boolean; onClick: () => void; title: string; desc: string; badge?: boolean }) {
  return (
    <button type="button" onClick={onClick} style={{ textAlign: "left", cursor: "pointer", background: selected ? "var(--blue-1)" : "var(--surface)", border: `1.5px solid ${selected ? "var(--blue-7)" : "var(--border-strong)"}`, borderRadius: "var(--r-md)", padding: "var(--s-4)", minHeight: 84, display: "flex", alignItems: "flex-start", gap: "var(--s-3)", boxShadow: selected ? "none" : "var(--sh-rest)" }}>
      <SelectDot selected={selected} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--s-2)", flexWrap: "wrap" }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>{title}</span>
          {badge && <RecommendedBadge />}
        </div>
        <p style={{ fontSize: 13, color: "var(--text-2)", margin: "var(--s-1) 0 0", lineHeight: 1.5 }}>{desc}</p>
      </div>
    </button>
  );
}

function SelectDot({ selected }: { selected: boolean }) {
  return (
    <span aria-hidden style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 20, height: 20, borderRadius: 999, flexShrink: 0, marginTop: 1, background: selected ? "var(--blue-7)" : "var(--surface)", border: selected ? "none" : "1.5px solid var(--n-6)" }}>
      {selected && <Check size={12} color="#fff" />}
    </span>
  );
}

function RecommendedBadge() {
  return (
    <span style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "0.02em", textTransform: "uppercase", color: "var(--pos-9, var(--pos-7))", background: "var(--pos-soft)", padding: "2px 7px", borderRadius: "var(--r-pill)", whiteSpace: "nowrap" }}>
      Recommended
    </span>
  );
}

function CheckMark() {
  return <span aria-hidden style={{ display: "inline-flex", width: 18, height: 18, borderRadius: 999, border: "1.5px solid var(--n-6)", flexShrink: 0, alignSelf: "center" }} />;
}

function GroupLabel({ label, sub }: { label: string; sub: string }) {
  return (
    <div style={{ marginBottom: "var(--s-2)" }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.005em" }}>{label}</div>
      <div style={{ fontSize: 12.5, color: "var(--text-3)", marginTop: 1 }}>{sub}</div>
    </div>
  );
}

function MiniLabel({ children }: { children: ReactNode }) {
  return <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--text-3)" }}>{children}</div>;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-2)", marginBottom: "var(--s-2)" }}>{label}</label>
      {children}
    </div>
  );
}

function RadioLine({ checked, name, label, onSelect }: { checked: boolean; name: string; label: string; onSelect: () => void }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: "var(--s-2)", cursor: "pointer", fontSize: 13.5, color: "var(--text)" }}>
      <input type="radio" name={name} checked={checked} onChange={onSelect} />
      {label}
    </label>
  );
}

function ScopeOption({ name, checked, label, sub, onSelect }: { name: string; checked: boolean; label: string; sub: string; onSelect: () => void }) {
  return (
    <label
      style={{
        display: "grid",
        gridTemplateColumns: "18px 1fr",
        alignItems: "start",
        gap: "var(--s-2)",
        padding: "var(--s-2) var(--s-3)",
        border: `1px solid ${checked ? "var(--blue-7)" : "var(--border)"}`,
        background: checked ? "var(--blue-1)" : "var(--surface)",
        borderRadius: "var(--r-sm)",
        cursor: "pointer",
      }}
    >
      <input type="radio" name={name} checked={checked} onChange={onSelect} style={{ marginTop: 2 }} />
      <span>
        <span style={{ fontSize: 13.5, fontWeight: 500, color: "var(--text)" }}>{label}</span>
        <span style={{ display: "block", fontSize: 12, color: "var(--text-3)", marginTop: 1, lineHeight: 1.4 }}>{sub}</span>
      </span>
    </label>
  );
}
