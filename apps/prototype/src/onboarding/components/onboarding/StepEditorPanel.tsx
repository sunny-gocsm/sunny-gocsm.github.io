import { useEffect, useMemo, useRef, useState } from "react";
import {
  X,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Check,
  Hand,
  ExternalLink,
  PlayCircle,
  Link2,
  CalendarClock,
  Copy,
  Webhook,
} from "lucide-react";

import type { Journey, Step, StepAsset, StepDetector, StepOwner } from "@onb/lib/types";
import {
  assetNoun,
  assetPresets,
  ASSET_TYPES,
  canAutoDetect,
  CATALOG,
  defaultDetector,
  getCatalogEntry,
  newWebhookToken,
  requiredStep,
  webhookUrl,
  WEBHOOK_SAMPLE_PAYLOAD,
} from "@onb/lib/catalog";

interface Props {
  journey: Journey;
  stepId: string;
  onChange: (patch: Partial<Step>) => void;
  onClose: () => void;
  onRemove?: () => void;
  focusField?: "deepLink" | "tier" | "bookingEmbedUrl";
}

import {
  detectProvider,
  parseVideoRef,
  PROVIDER_LABEL,
  type VideoProvider,
} from "@onb/lib/video";




const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  fontWeight: 600,
  color: "var(--text-2)",
  marginBottom: 6,
};

const helperStyle: React.CSSProperties = {
  fontSize: 11,
  color: "var(--text-3)",
  marginTop: 4,
  lineHeight: 1.4,
};

const inputStyle: React.CSSProperties = {
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

// Verification label maps off the effective StepDetector (auto/manual/inbound_webhook).
function verificationLabel(d: StepDetector): string {
  if (d === "auto") return "Auto-checks when done ✓";
  if (d === "inbound_webhook") return "Completes via webhook event";
  return "Client confirms manually";
}

export function StepEditorPanel({ journey, stepId, onChange, onClose, onRemove, focusField }: Props) {
  const deepLinkRef = useRef<HTMLInputElement | null>(null);
  const tierRef = useRef<HTMLDivElement | null>(null);

  const step = journey.steps.find((s) => s.id === stepId);
  const snapshotRef = useRef<Step | null>(step ? { ...step } : null);

  const userEditedTitleRef = useRef(false);
  const userEditedInstructionsRef = useRef(false);

  const initialParsed = parseVideoRef(step?.videoRef);
  const [videoChoice, setVideoChoice] = useState<"default" | "link">(initialParsed.kind);
  const [videoUrl, setVideoUrl] = useState<string>(
    initialParsed.kind === "link" ? initialParsed.url : ""
  );
  const [videoUrlTouched, setVideoUrlTouched] = useState<boolean>(false);
  const videoProvider = useMemo(() => {
    const t = videoUrl.trim();
    return t ? detectProvider(t) : null;
  }, [videoUrl]);
  const videoUrlError =
    videoChoice === "link" && videoUrlTouched && videoUrl.trim() && !videoProvider
      ? "Use a YouTube, Vimeo, or Loom link."
      : null;

  // Customize disclosure — opens automatically when the caller targets an advanced field.
  const [customizeOpen, setCustomizeOpen] = useState<boolean>(!!focusField);
  useEffect(() => {
    if (focusField) setCustomizeOpen(true);
  }, [focusField]);

  // Scroll to focused field once disclosure is open.
  useEffect(() => {
    if (!customizeOpen) return;
    const t = setTimeout(() => {
      if (focusField === "deepLink" && deepLinkRef.current) {
        deepLinkRef.current.focus();
        deepLinkRef.current.scrollIntoView({ block: "center" });
      } else if (focusField === "tier" && tierRef.current) {
        tierRef.current.scrollIntoView({ block: "center" });
      }
    }, 0);
    return () => clearTimeout(t);
  }, [focusField, customizeOpen]);

  // Prefill instructions from the catalog default on mount.
  useEffect(() => {
    if (!step) return;
    const current = (step as Step & { instructions?: string }).instructions ?? "";
    if (current.trim() !== "") {
      userEditedInstructionsRef.current = true;
      return;
    }
    const entry = getCatalogEntry(step.type);
    if (entry.clientInstructions) {
      onChange({ ...({ instructions: entry.clientInstructions } as Partial<Step>) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!step) return null;
  const s: Step = step;
  const entry = getCatalogEntry(s.type);

  const instructions = (s as Step & { instructions?: string }).instructions ?? "";
  const effectiveDet: StepDetector = s.detector ?? defaultDetector(s.type);
  const linkProviderForSummary =
    initialParsed.kind === "link" ? detectProvider(initialParsed.url) : null;
  const hasCustomVideo = linkProviderForSummary != null;
  const waitsForTitle = requiredStep(journey, s)?.title;


  function cancel() {
    if (snapshotRef.current) onChange(snapshotRef.current);
    onClose();
  }

  function handleTypeChange(nextType: string) {
    const e = getCatalogEntry(nextType);
    const patch: Partial<Step> = {
      type: nextType,
      tier: e.tier,
      owner: e.owner,
      slaHours: e.slaHours,
      deepLink: e.deepLink,
    };
    if (!userEditedTitleRef.current) {
      patch.title = e.defaultTitle;
    }
    if (!userEditedInstructionsRef.current && e.clientInstructions) {
      (patch as Step & { instructions?: string }).instructions = e.clientInstructions;
    }
    // Clear orphan asset list when switching away from an asset-bearing type.
    if (!ASSET_TYPES.has(nextType) && s.assets && s.assets.length > 0) {
      patch.assets = [];
    }
    onChange(patch);
  }

  function handleTitle(value: string) {
    userEditedTitleRef.current = true;
    onChange({ title: value });
  }

  function handleInstructions(value: string) {
    userEditedInstructionsRef.current = true;
    onChange({ ...({ instructions: value } as Partial<Step>) });
  }


  return (
    <aside
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: 420,
        background: "var(--surface)",
        borderRight: "1px solid var(--border)",
        borderRadius: "var(--r-lg)",
        boxShadow: "var(--sh-sheet)",
        zIndex: 30,
        display: "flex",
        flexDirection: "column",
      }}
      aria-label="Edit step"
    >
      <div
        style={{
          padding: "16px 24px",
          borderBottom: "1px solid var(--border-soft)",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, color: "var(--text-3)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Step {String(step.order).padStart(2, "0")}
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", marginTop: 2 }}>
            Edit step
          </div>
        </div>
        <button
          type="button"
          onClick={cancel}
          className="btn btn-ghost"
          style={{ padding: 6 }}
          aria-label="Close"
        >
          <X size={16} aria-hidden />
        </button>
      </div>

      <div
        className="panel-body"
        style={{ overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 18, padding: 24 }}
      >
        {/* Step type */}
        <div ref={tierRef}>
          <label style={labelStyle}>Step type</label>
          <select
            value={step.type}
            onChange={(e) => handleTypeChange(e.target.value)}
            style={inputStyle}
          >
            {CATALOG.map((c) => (
              <option key={c.type} value={c.type}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {/* Title */}
        <div>
          <label style={labelStyle}>Title</label>
          <input
            type="text"
            value={step.title}
            onChange={(e) => handleTitle(e.target.value)}
            style={inputStyle}
          />
        </div>

        {/* Assets — snapshot step asset list (preset multi-select + custom) */}
        {assetNoun(s.type) && (
          <AssetMultiSelectField
            noun={assetNoun(s.type)!}
            presets={assetPresets(s.type)}
            assets={s.assets ?? []}
            onChange={(next) => onChange({ assets: next })}
          />
        )}

        {/* Booking link — kickoff embed (auto-tracked) */}
        {s.type === "kickoff_call" && (
          <BookingLinkRow
            value={s.bookingEmbedUrl ?? ""}
            autoOpen={focusField === "bookingEmbedUrl"}
            onChange={(v) => onChange({ bookingEmbedUrl: v })}
          />
        )}




        {/* What your client sees */}
        <div>
          <label style={labelStyle}>What your client sees</label>
          <textarea
            rows={3}
            value={instructions}
            onChange={(e) => handleInstructions(e.target.value)}
            style={{ ...inputStyle, height: "auto", padding: 10, lineHeight: 1.5, resize: "vertical" }}
            placeholder="What to do, and why it matters to their business."
          />
          <div style={helperStyle}>Plain language — what to do and why it matters.</div>
        </div>

        {/* Summary card */}
        <section
          aria-label="GoCSM handles the rest"
          style={{
            background: "var(--bg-subtle)",
            border: "1px solid var(--border-soft)",
            borderRadius: "var(--r-md)",
            padding: 16,
          }}
        >
          <header
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 12,
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)" }}>
              GoCSM handles the rest
            </div>
            <button
              type="button"
              onClick={() => setCustomizeOpen((v) => !v)}
              aria-expanded={customizeOpen}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                background: "transparent",
                border: "none",
                padding: 0,
                fontSize: 12,
                color: "var(--text-2)",
                cursor: "pointer",
                fontFamily: "var(--font-ui)",
              }}
            >
              {customizeOpen ? <ChevronDown size={14} aria-hidden /> : <ChevronRight size={14} aria-hidden />}
              Customize
            </button>
          </header>

          <ul
            style={{
              listStyle: "none",
              margin: 0,
              padding: 0,
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <SummaryRow
              icon={
                effectiveDet === "auto" ? (
                  <CheckCircle2 size={14} aria-hidden />
                ) : effectiveDet === "inbound_webhook" ? (
                  <Webhook size={14} aria-hidden />
                ) : (
                  <Hand size={14} aria-hidden />
                )
              }
              label="Verification"
              value={verificationLabel(effectiveDet)}
            />
            <SummaryRow
              icon={<ExternalLink size={14} aria-hidden />}
              label="Opens"
              value={s.deepLink || "—"}
              mono={!!s.deepLink}
            />
            <SummaryRow
              icon={<PlayCircle size={14} aria-hidden />}
              label="Tutorial"
              value={
                videoChoice === "link" && videoProvider
                  ? `${PROVIDER_LABEL[videoProvider]} video`
                  : hasCustomVideo && linkProviderForSummary
                    ? `${PROVIDER_LABEL[linkProviderForSummary]} video`
                    : "White-label tutorial included"
              }
            />
            {waitsForTitle && (
              <SummaryRow
                icon={<Link2 size={14} aria-hidden />}
                label="Waits for"
                value={waitsForTitle}
              />
            )}

          </ul>

          {customizeOpen && (
            <div
              style={{
                marginTop: 16,
                paddingTop: 16,
                borderTop: "1px solid var(--border-soft)",
                display: "flex",
                flexDirection: "column",
                gap: 18,
              }}
            >
              {/* Owner segmented */}
              <div>
                <label style={labelStyle}>Owner</label>
                <div
                  style={{
                    display: "inline-flex",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--r-sm)",
                    padding: 2,
                    background: "var(--surface)",
                  }}
                >
                  {(["client", "agency"] as StepOwner[]).map((o) => {
                    const active = step.owner === o;
                    return (
                      <button
                        key={o}
                        type="button"
                        onClick={() => onChange({ owner: o })}
                        style={{
                          height: 28,
                          padding: "0 14px",
                          background: active ? "var(--bg-subtle)" : "transparent",
                          color: active ? "var(--text)" : "var(--text-2)",
                          border: "none",
                          borderRadius: "var(--r-sm)",
                          fontSize: 13,
                          fontWeight: active ? 600 : 500,
                          cursor: "pointer",
                          fontFamily: "var(--font-ui)",
                        }}
                      >
                        {o === "client" ? "Client" : "Agency"}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* How is this step completed? */}
              <CompletionMethodSection
                step={s}
                onChange={onChange}
              />




              {/* Deep link (hidden for kickoff — handled above by BookingLinkRow) */}
              {s.type !== "kickoff_call" && (
                <DeepLinkRow
                  value={step.deepLink ?? ""}
                  inputRef={deepLinkRef}
                  autoOpen={focusField === "deepLink"}
                  onChange={(v) => onChange({ deepLink: v })}
                />
              )}


              {/* Video */}
              <div>
                <label style={labelStyle}>Video</label>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text)", cursor: "pointer" }}>
                    <input
                      type="radio"
                      name={`video-${stepId}`}
                      checked={videoChoice === "default"}
                      onChange={() => {
                        setVideoChoice("default");
                        setVideoUrlTouched(false);
                        onChange({ videoRef: "default" });
                      }}
                    />
                    GoCSM tutorial (white-label)
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text)", cursor: "pointer" }}>
                    <input
                      type="radio"
                      name={`video-${stepId}`}
                      checked={videoChoice === "link"}
                      onChange={() => {
                        setVideoChoice("link");
                        const t = videoUrl.trim();
                        if (t && detectProvider(t)) {
                          onChange({ videoRef: "link:" + t });
                        }
                      }}
                    />
                    Use your own video link
                  </label>
                  {videoChoice === "link" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 2 }}>
                      <input
                        type="url"
                        inputMode="url"
                        autoComplete="off"
                        spellCheck={false}
                        maxLength={500}
                        value={videoUrl}
                        onChange={(e) => {
                          const next = e.target.value;
                          setVideoUrl(next);
                          const t = next.trim();
                          if (t && detectProvider(t)) {
                            onChange({ videoRef: "link:" + t });
                          }
                        }}
                        onBlur={() => setVideoUrlTouched(true)}
                        placeholder="https://youtube.com/…  ·  vimeo.com/…  ·  loom.com/share/…"
                        style={{
                          ...inputStyle,
                          borderColor: videoUrlError ? "var(--warn-7)" : "var(--border)",
                        }}
                        aria-invalid={!!videoUrlError}
                      />
                      {videoUrlError ? (
                        <div style={{ ...helperStyle, color: "var(--warn-9)" }}>
                          {videoUrlError}
                        </div>
                      ) : videoProvider ? (
                        <div
                          style={{
                            display: "inline-flex",
                            alignSelf: "flex-start",
                            alignItems: "center",
                            gap: 6,
                            padding: "2px 8px",
                            background: "var(--bg-subtle)",
                            color: "var(--text-2)",
                            borderRadius: "var(--r-sm)",
                            fontSize: 12,
                          }}
                        >
                          <Link2 size={12} aria-hidden />
                          {PROVIDER_LABEL[videoProvider]}
                        </div>
                      ) : (
                        <div style={helperStyle}>
                          We embed it inline for your client. YouTube, Vimeo, or Loom.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>


            </div>

          )}
        </section>
      </div>

      <div className="modal-foot">
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            style={{
              marginRight: "auto",
              height: 32,
              padding: "0 12px",
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
            Remove step
          </button>
        )}
        <button type="button" className="btn btn-ghost" onClick={cancel}>
          Cancel
        </button>
        <button type="button" className="btn btn-primary" onClick={onClose}>
          Save
        </button>
      </div>
    </aside>
  );
}

function SummaryRow({
  icon,
  label,
  value,
  mono,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <li
      style={{
        display: "grid",
        gridTemplateColumns: "16px 84px 1fr",
        alignItems: "baseline",
        gap: 10,
        fontSize: 12,
        lineHeight: 1.45,
      }}
    >
      <span
        aria-hidden
        style={{
          color: "var(--text-3)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          alignSelf: "center",
        }}
      >
        {icon}
      </span>
      <span style={{ color: "var(--text-2)" }}>{label}</span>
      <span
        className={mono ? "mono" : undefined}
        style={{ color: "var(--text)", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}
      >
        {value}
      </span>
    </li>
  );
}


function DeepLinkRow({
  value,
  inputRef,
  autoOpen,
  onChange,
}: {
  value: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  autoOpen: boolean;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(autoOpen);
  useEffect(() => {
    if (autoOpen) setOpen(true);
  }, [autoOpen]);
  return (
    <div>
      <label style={labelStyle}>Deep link</label>
      {!open ? (
        <>
          <div style={{ fontSize: 13, color: "var(--text-2)" }}>
            Opens: <span style={{ color: "var(--text)" }}>{value || "—"}</span>
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            style={{
              marginTop: 8,
              background: "transparent",
              border: "none",
              padding: 0,
              fontSize: 12,
              color: "var(--text-2)",
              cursor: "pointer",
            }}
          >
            Edit ▾
          </button>
        </>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            style={inputStyle}
            placeholder="e.g. Settings → Phone Numbers"
            autoFocus
          />
          <button
            type="button"
            onClick={() => setOpen(false)}
            style={{
              background: "transparent",
              border: "none",
              padding: 0,
              fontSize: 12,
              color: "var(--text-3)",
              cursor: "pointer",
            }}
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
}

function AssetMultiSelectField({
  noun,
  presets,
  assets,
  onChange,
}: {
  noun: { question: string; placeholder: string; singular: string; plural: string };
  presets: string[];
  assets: StepAsset[];
  onChange: (next: StepAsset[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [customMode, setCustomMode] = useState(false);
  const [customDraft, setCustomDraft] = useState("");
  const MAX = 12;
  const NAME_MAX = 60;

  const lowerNames = new Set(assets.map((a) => a.name.toLowerCase()));
  const isSelected = (name: string) => lowerNames.has(name.toLowerCase());

  function togglePreset(name: string) {
    if (isSelected(name)) {
      onChange(assets.filter((a) => a.name.toLowerCase() !== name.toLowerCase()));
    } else {
      if (assets.length >= MAX) return;
      onChange([...assets, { name, done: false }]);
    }
  }

  function addCustom() {
    const trimmed = customDraft.trim().slice(0, NAME_MAX);
    if (!trimmed) return;
    if (assets.length >= MAX) return;
    if (isSelected(trimmed)) {
      setCustomDraft("");
      return;
    }
    onChange([...assets, { name: trimmed, done: false }]);
    setCustomDraft("");
    setCustomMode(false);
  }

  function remove(i: number) {
    onChange(assets.filter((_, idx) => idx !== i));
  }

  function updateAsset(i: number, patch: Partial<StepAsset>) {
    onChange(assets.map((a, idx) => (idx === i ? { ...a, ...patch } : a)));
  }

  const filteredPresets = query.trim()
    ? presets.filter((p) => p.toLowerCase().includes(query.trim().toLowerCase()))
    : presets;

  return (
    <div style={{ position: "relative" }}>
      <label style={labelStyle}>{noun.question}</label>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
        {assets.map((a, i) => (
          <span
            key={`${a.name}-${i}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 4px 4px 10px",
              background: "var(--bg-subtle)",
              border: "1px solid var(--border-soft)",
              borderRadius: "var(--r-pill)",
              fontSize: 12,
              color: "var(--text)",
              lineHeight: 1.2,
            }}
          >
            <span
              style={{
                maxWidth: 220,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {a.name}
            </span>
            <button
              type="button"
              aria-label={`Remove ${a.name}`}
              onClick={() => remove(i)}
              style={{
                all: "unset",
                width: 18,
                height: 18,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "50%",
                color: "var(--text-3)",
                cursor: "pointer",
              }}
            >
              <X size={12} aria-hidden />
            </button>
          </span>
        ))}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          disabled={assets.length >= MAX}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            padding: "4px 10px",
            background: "transparent",
            border: "1px dashed var(--border)",
            borderRadius: "var(--r-pill)",
            fontSize: 12,
            color: "var(--text-2)",
            cursor: assets.length >= MAX ? "not-allowed" : "pointer",
            fontFamily: "var(--font-ui)",
          }}
        >
          + Add {noun.singular}
          <ChevronDown size={12} aria-hidden />
        </button>
      </div>

      {assets.length > 0 && (
        <div
          style={{
            marginTop: 4,
            marginBottom: 10,
            display: "flex",
            flexDirection: "column",
            gap: 4,
            border: "1px solid var(--border-soft)",
            borderRadius: "var(--r-sm)",
            background: "var(--surface)",
            overflow: "hidden",
          }}
        >
          {assets.map((a, i) => (
            <AssetCustomizeRow
              key={`cust-${a.name}-${i}`}
              asset={a}
              onChange={(patch) => updateAsset(i, patch)}
              isLast={i === assets.length - 1}
            />
          ))}
        </div>
      )}



      {open && (
        <div
          role="dialog"
          aria-label={`Pick ${noun.plural}`}
          style={{
            position: "absolute",
            zIndex: 30,
            left: 0,
            right: 0,
            marginTop: 4,
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--r-md)",
            boxShadow: "var(--sh-sheet, 0 10px 28px rgba(15,23,42,0.12))",
            padding: 12,
          }}
        >
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${noun.plural}…`}
            style={{ ...inputStyle, height: 32, marginBottom: 8 }}
            autoFocus
          />
          <ul
            style={{
              listStyle: "none",
              margin: 0,
              padding: 0,
              maxHeight: 220,
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            {filteredPresets.length === 0 && (
              <li style={{ ...helperStyle, padding: "6px 8px" }}>No matches.</li>
            )}
            {filteredPresets.map((name) => {
              const selected = isSelected(name);
              const disabled = !selected && assets.length >= MAX;
              return (
                <li key={name}>
                  <button
                    type="button"
                    onClick={() => togglePreset(name)}
                    disabled={disabled}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "6px 8px",
                      background: selected ? "var(--bg-subtle)" : "transparent",
                      border: "none",
                      borderRadius: "var(--r-sm)",
                      cursor: disabled ? "not-allowed" : "pointer",
                      fontSize: 13,
                      color: "var(--text)",
                      textAlign: "left",
                      fontFamily: "var(--font-ui)",
                      opacity: disabled ? 0.5 : 1,
                    }}
                  >
                    <span
                      aria-hidden
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: 3,
                        border: selected
                          ? "1.5px solid var(--text)"
                          : "1.5px solid var(--border)",
                        background: selected ? "var(--text)" : "transparent",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {selected && (
                        <Check size={10} color="var(--surface)" strokeWidth={3} />
                      )}
                    </span>
                    <span style={{ flex: 1, minWidth: 0 }}>{name}</span>
                  </button>
                </li>
              );
            })}
          </ul>

          <div
            style={{
              marginTop: 8,
              paddingTop: 8,
              borderTop: "1px solid var(--border-soft)",
            }}
          >
            {!customMode ? (
              <button
                type="button"
                onClick={() => setCustomMode(true)}
                disabled={assets.length >= MAX}
                style={{
                  background: "transparent",
                  border: "none",
                  padding: "4px 0",
                  fontSize: 12,
                  color: "var(--text-2)",
                  cursor: assets.length >= MAX ? "not-allowed" : "pointer",
                }}
              >
                + Add custom…
              </button>
            ) : (
              <div style={{ display: "flex", gap: 6 }}>
                <input
                  type="text"
                  value={customDraft}
                  onChange={(e) => setCustomDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCustom();
                    } else if (e.key === "Escape") {
                      setCustomMode(false);
                      setCustomDraft("");
                    }
                  }}
                  placeholder={noun.placeholder}
                  maxLength={NAME_MAX}
                  style={{ ...inputStyle, height: 30, flex: 1 }}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={addCustom}
                  className="btn btn-primary"
                  style={{ height: 30, padding: "0 10px", fontSize: 12 }}
                >
                  Add
                </button>
              </div>
            )}
          </div>

          <div
            style={{
              marginTop: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span style={{ ...helperStyle, marginTop: 0 }}>
              {assets.length}/{MAX} selected
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              style={{
                background: "transparent",
                border: "none",
                fontSize: 12,
                color: "var(--text-3)",
                cursor: "pointer",
                padding: 0,
              }}
            >
              Done
            </button>
          </div>
        </div>
      )}

      <div style={helperStyle}>
        Pick the ones your client should activate. Add custom if your snapshot has more.
      </div>
    </div>
  );
}

// Quiet per-asset row. Default state shows the asset label, a "default video"
// pill, and a small "Customize" affordance. Tapping expands a tiny inline
// editor with exactly two controls — video (reuse default OR paste a URL) and
// a one-line guidanceText. Save collapses back. Zero edits required for the
// happy path: the seeded defaults already work.
function AssetCustomizeRow({
  asset,
  onChange,
  isLast,
}: {
  asset: StepAsset;
  onChange: (patch: Partial<StepAsset>) => void;
  isLast: boolean;
}) {
  const initialKind: "default" | "link" =
    asset.videoRef && asset.videoRef.startsWith("link:") ? "link" : "default";
  const initialUrl =
    asset.videoRef && asset.videoRef.startsWith("link:")
      ? asset.videoRef.slice("link:".length)
      : "";

  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<"default" | "link">(initialKind);
  const [url, setUrl] = useState(initialUrl);
  const [urlTouched, setUrlTouched] = useState(false);
  const [guidance, setGuidance] = useState(asset.guidanceText ?? "");

  const provider: VideoProvider | null = useMemo(() => {
    const t = url.trim();
    return t ? detectProvider(t) : null;
  }, [url]);
  const urlError =
    kind === "link" && urlTouched && url.trim() && !provider
      ? "We support YouTube, Vimeo, or Loom links."
      : "";

  const hasCustomVideo = kind === "link" && !!provider;
  const hasGuidance = !!(asset.guidanceText && asset.guidanceText.trim());
  const isCustomized = hasCustomVideo || hasGuidance;

  function save() {
    if (kind === "default") {
      onChange({ videoRef: undefined, guidanceText: guidance.trim() || undefined });
    } else {
      const t = url.trim();
      const nextVideo = t && detectProvider(t) ? "link:" + t : undefined;
      onChange({ videoRef: nextVideo, guidanceText: guidance.trim() || undefined });
    }
    setOpen(false);
  }

  return (
    <div
      style={{
        borderBottom: isLast ? "none" : "1px solid var(--border-soft)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "8px 10px",
        }}
      >
        <span
          style={{
            flex: 1,
            minWidth: 0,
            fontSize: 13,
            color: "var(--text)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {asset.name}
        </span>
        <span
          aria-label={hasCustomVideo ? "Custom video" : "Default video"}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            fontSize: 11.5,
            color: "var(--text-3)",
            whiteSpace: "nowrap",
          }}
        >
          <PlayCircle size={12} aria-hidden />
          {hasCustomVideo && provider
            ? `${PROVIDER_LABEL[provider]} video`
            : "default video"}
        </span>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          style={{
            all: "unset",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            padding: "2px 8px",
            fontSize: 12,
            color: isCustomized ? "var(--text)" : "var(--text-2)",
            borderRadius: "var(--r-pill)",
            background: open ? "var(--bg-subtle)" : "transparent",
          }}
        >
          <span aria-hidden style={{ fontSize: 11 }}>✏️</span>
          {open ? "Close" : isCustomized ? "Edit" : "Customize"}
        </button>
      </div>

      {open && (
        <div
          style={{
            padding: "10px 10px 12px",
            background: "var(--bg-subtle)",
            borderTop: "1px solid var(--border-soft)",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {/* Video — reuse watch-then-choose pattern, scoped to this asset. */}
          <div>
            <label style={{ ...labelStyle, marginBottom: 4 }}>Video</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 13,
                  color: "var(--text)",
                  cursor: "pointer",
                }}
              >
                <input
                  type="radio"
                  name={`asset-video-${asset.name}`}
                  checked={kind === "default"}
                  onChange={() => {
                    setKind("default");
                    setUrlTouched(false);
                  }}
                />
                GoCSM tutorial (white-label)
              </label>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 13,
                  color: "var(--text)",
                  cursor: "pointer",
                }}
              >
                <input
                  type="radio"
                  name={`asset-video-${asset.name}`}
                  checked={kind === "link"}
                  onChange={() => setKind("link")}
                />
                Use my own
              </label>
              {kind === "link" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <input
                    type="url"
                    inputMode="url"
                    autoComplete="off"
                    spellCheck={false}
                    maxLength={500}
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onBlur={() => setUrlTouched(true)}
                    placeholder="https://youtube.com/…  ·  vimeo.com/…  ·  loom.com/share/…"
                    style={{
                      ...inputStyle,
                      height: 32,
                      borderColor: urlError ? "var(--warn-7)" : "var(--border)",
                    }}
                    aria-invalid={!!urlError}
                  />
                  {urlError ? (
                    <div style={{ ...helperStyle, color: "var(--warn-9)" }}>
                      {urlError}
                    </div>
                  ) : provider ? (
                    <div
                      style={{
                        display: "inline-flex",
                        alignSelf: "flex-start",
                        alignItems: "center",
                        gap: 6,
                        padding: "2px 8px",
                        background: "var(--surface)",
                        color: "var(--text-2)",
                        borderRadius: "var(--r-sm)",
                        fontSize: 12,
                      }}
                    >
                      <Link2 size={12} aria-hidden />
                      {PROVIDER_LABEL[provider]}
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>

          {/* Single one-line guidanceText. Optional. */}
          <div>
            <label style={{ ...labelStyle, marginBottom: 4 }}>
              What should they do here?
            </label>
            <input
              type="text"
              value={guidance}
              onChange={(e) => setGuidance(e.target.value.slice(0, 120))}
              placeholder="e.g. Add your own review link"
              maxLength={120}
              style={{ ...inputStyle, height: 32 }}
            />
            <div style={helperStyle}>One short line your client sees beneath the asset name.</div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 6 }}>
            <button
              type="button"
              onClick={() => setOpen(false)}
              style={{
                background: "transparent",
                border: "none",
                fontSize: 12,
                color: "var(--text-3)",
                cursor: "pointer",
                padding: "0 8px",
                height: 28,
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={save}
              className="btn btn-primary"
              style={{ height: 28, padding: "0 12px", fontSize: 12 }}
            >
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


function BookingLinkRow({
  value,
  autoOpen,
  onChange,
}: {
  value: string;
  autoOpen: boolean;
  onChange: (v: string) => void;
}) {
  const ref = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    if (autoOpen && ref.current) {
      ref.current.focus();
      ref.current.scrollIntoView({ block: "center" });
    }
  }, [autoOpen]);
  const trimmed = value.trim();
  const valid = /^https?:\/\/.+/i.test(trimmed);
  const touched = trimmed.length > 0;
  return (
    <div>
      <label style={labelStyle}>
        <CalendarClock size={12} aria-hidden style={{ display: "inline", marginRight: 4, verticalAlign: "-2px" }} />
        Booking link
      </label>
      <input
        ref={ref}
        type="url"
        inputMode="url"
        autoComplete="off"
        spellCheck={false}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="https://calendly.com/your-agency/kickoff"
        style={{
          ...inputStyle,
          borderColor: touched && !valid ? "var(--warn-7)" : "var(--border)",
        }}
        aria-invalid={touched && !valid}
      />
      <div style={helperStyle}>
        Paste your scheduler embed URL — Calendly, GHL Calendar, SavvyCal, Cal.com.
      </div>
      <div style={{ ...helperStyle, marginTop: 4 }}>
        Auto-tracked: GoCSM marks the step done when your client books.
      </div>
      {touched && !valid && (
        <div style={{ ...helperStyle, color: "var(--warn-9)", marginTop: 4 }}>
          Must start with http:// or https://
        </div>
      )}
    </div>
  );
}


/* ============ Completion-method section ============ */

function CompletionMethodSection({
  step,
  onChange,
}: {
  step: Step;
  onChange: (patch: Partial<Step>) => void;
}) {
  const autoOk = canAutoDetect(step.type);
  const effective: StepDetector = step.detector ?? defaultDetector(step.type);

  function select(next: StepDetector) {
    if (next === effective) return;
    const patch: Partial<Step> = { detector: next };
    if (next === "inbound_webhook" && !step.webhookToken) {
      patch.webhookToken = newWebhookToken();
    }
    onChange(patch);
  }

  return (
    <div>
      <label style={labelStyle}>How is this step completed?</label>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <CompletionChoice
          checked={effective === "auto"}
          disabled={!autoOk}
          name={`detector-${step.id}`}
          label="GoCSM detects it automatically in HighLevel"
          sub={
            autoOk
              ? "We watch HighLevel and check this off when it happens — no setup."
              : "This type can't be auto-detected — pick one of the options below."
          }
          onSelect={() => select("auto")}
        />
        <CompletionChoice
          checked={effective === "manual"}
          name={`detector-${step.id}`}
          label="Your client confirms it"
          sub="Adds a 'Mark done' button on the client checklist."
          onSelect={() => select("manual")}
        />
        <CompletionChoice
          checked={effective === "inbound_webhook"}
          name={`detector-${step.id}`}
          label="I'll send GoCSM an event"
          sub="A unique webhook URL completes this step when called."
          onSelect={() => select("inbound_webhook")}
        />
        {effective === "inbound_webhook" && (
          <WebhookPanel
            token={step.webhookToken ?? ""}
            onRegenerate={() => onChange({ webhookToken: newWebhookToken() })}
          />
        )}
      </div>
    </div>
  );
}

function CompletionChoice({
  checked,
  disabled,
  name,
  label,
  sub,
  onSelect,
}: {
  checked: boolean;
  disabled?: boolean;
  name: string;
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
        padding: 12,
        border: "1px solid",
        borderColor: checked ? "var(--info-7, var(--border))" : "var(--border)",
        background: "var(--surface)",
        borderRadius: "var(--r-sm)",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.55 : 1,
      }}
    >
      <input
        type="radio"
        name={name}
        checked={checked}
        disabled={disabled}
        onChange={onSelect}
        style={{ marginTop: 3 }}
      />
      <div>
        <div style={{ fontSize: 13, color: "var(--text)", fontWeight: 500 }}>{label}</div>
        <div
          style={{
            fontSize: 12,
            color: "var(--text-3)",
            marginTop: 2,
            lineHeight: 1.45,
          }}
        >
          {sub}
        </div>
      </div>
    </label>
  );
}

function WebhookPanel({
  token,
  onRegenerate,
}: {
  token: string;
  onRegenerate: () => void;
}) {
  const url = token ? webhookUrl(token) : "";
  const [recipeOpen, setRecipeOpen] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedPayload, setCopiedPayload] = useState(false);

  function copy(text: string, which: "url" | "payload") {
    if (!text) return;
    try {
      navigator.clipboard.writeText(text);
      if (which === "url") {
        setCopiedUrl(true);
        window.setTimeout(() => setCopiedUrl(false), 1200);
      } else {
        setCopiedPayload(true);
        window.setTimeout(() => setCopiedPayload(false), 1200);
      }
    } catch {
      /* ignore */
    }
  }

  return (
    <div
      style={{
        marginTop: 4,
        padding: 14,
        border: "1px solid var(--border-soft)",
        background: "var(--bg-subtle)",
        borderRadius: "var(--r-sm)",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div>
        <div style={{ ...labelStyle, marginBottom: 6 }}>Webhook URL</div>
        <div style={{ display: "flex", gap: 6 }}>
          <input
            type="text"
            readOnly
            value={url}
            onFocus={(e) => e.currentTarget.select()}
            style={{
              ...inputStyle,
              fontFamily: "var(--font-mono)",
              fontVariantNumeric: "tabular-nums",
            }}
          />
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => copy(url, "url")}
            style={{
              padding: "0 10px",
              height: 36,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Copy size={14} aria-hidden />
            {copiedUrl ? "Copied" : "Copy"}
          </button>
        </div>
        {token && (
          <button
            type="button"
            onClick={onRegenerate}
            style={{
              marginTop: 6,
              background: "transparent",
              border: "none",
              padding: 0,
              fontSize: 11,
              color: "var(--text-3)",
              cursor: "pointer",
              fontFamily: "var(--font-ui)",
            }}
          >
            Regenerate
          </button>
        )}
      </div>

      <div>
        <div style={{ ...labelStyle, marginBottom: 6 }}>Sample payload</div>
        <div style={{ position: "relative" }}>
          <pre
            style={{
              margin: 0,
              padding: 12,
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--r-sm)",
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              color: "var(--text)",
              overflowX: "auto",
            }}
          >
            {WEBHOOK_SAMPLE_PAYLOAD}
          </pre>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => copy(WEBHOOK_SAMPLE_PAYLOAD, "payload")}
            style={{
              position: "absolute",
              top: 6,
              right: 6,
              padding: "0 8px",
              height: 28,
              fontSize: 12,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Copy size={12} aria-hidden />
            {copiedPayload ? "Copied" : "Copy"}
          </button>
        </div>
      </div>

      <div>
        <button
          type="button"
          onClick={() => setRecipeOpen((v) => !v)}
          aria-expanded={recipeOpen}
          style={{
            background: "transparent",
            border: "none",
            padding: 0,
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            color: "var(--text-2)",
            fontSize: 12,
            fontFamily: "var(--font-ui)",
            cursor: "pointer",
          }}
        >
          {recipeOpen ? (
            <ChevronDown size={14} aria-hidden />
          ) : (
            <ChevronRight size={14} aria-hidden />
          )}
          Use this in a GoCSM-friendly way
        </button>
        {recipeOpen && (
          <div
            style={{
              marginTop: 8,
              padding: 12,
              background: "var(--surface)",
              border: "1px solid var(--border-soft)",
              borderRadius: "var(--r-sm)",
              fontSize: 12,
              lineHeight: 1.55,
              color: "var(--text-2)",
            }}
          >
            In HighLevel, add a <strong>Webhook</strong> action to any workflow, paste this URL,
            and the step completes when that workflow runs.
          </div>
        )}
      </div>
    </div>
  );
}

