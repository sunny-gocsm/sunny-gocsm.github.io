import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { Check, X } from "lucide-react";
import {
  type FloatingPosition,
  type Journey,
  type Placement,
} from "@onb/lib/types";
import {
  FloatingMock,
  BannerMock,
  MenuMock,
  EmbedMock,
} from "@onb/components/onboarding/PlacementMockups";
import {
  BRAND_PRESETS,
  DEFAULT_BRAND_COLOR,
  normalizeHex,
  resolveAccentFill,
  resolveAccentInk,
} from "@onb/lib/clientAccent";
import {
  DoerPanel,
  type DoerScenario,
} from "@onb/components/onboarding/DoerPanel";

const ACCENT = DEFAULT_BRAND_COLOR;

type Mode = DoerScenario extends infer T ? Exclude<T, "live-simulator"> : never;




export function ClientPreview({
  journey,
  onJourneyChange,
  onOpenCustomize,
  hideProgressCount,
}: {
  journey: Journey;
  onJourneyChange?: (next: Journey) => void;
  onOpenCustomize?: () => void;
  hideProgressCount?: boolean;
}) {
  const [mode, setMode] = useState<Mode>("new");

  const total = journey.steps.length;

  const accent = journey.brandColor ?? ACCENT;
  const experienceMode = journey.experienceMode ?? "guided";
  const trackingOnly = experienceMode === "tracking_only";
  const { accentFill, accentInk } = useMemo(
    () => ({
      accentFill: resolveAccentFill(accent),
      accentInk: resolveAccentInk(accent),
    }),
    [accent]
  );

  const scopeStyle = {
    ["--client-accent" as string]: accent,
    ["--client-accent-fill" as string]: accentFill,
    ["--client-accent-ink" as string]: accentInk,
  } as CSSProperties;






  return (
    <div style={{ display: "flex", justifyContent: "center" }}>
      <div
        style={{
          position: "relative",
          width: "fit-content",
          maxWidth: "100%",
          padding: 20,
          background: "var(--bg-subtle)",
          border: "1px solid var(--border-soft)",
          borderRadius: "var(--r-lg)",
          boxShadow: "var(--sh-rest)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              fontSize: 12,
              color: "var(--text-2)",
              fontWeight: 600,
              whiteSpace: "nowrap",
            }}
          >
            Client preview
          </div>
          {total > 0 && !trackingOnly && <ModeSegmented mode={mode} onChange={setMode} />}
        </div>



        <div data-surface="client" style={scopeStyle}>
          {trackingOnly ? (
            <TrackingOnlyBody onChange={() => onOpenCustomize?.()} />
          ) : (journey.placement?.mode ?? "banner") === "embed" ? (
            <EmbedShellPreview accent={accent}>
              <DoerPanel
                journey={journey}
                scenario={mode}
                accent={accent}
                hideProgressCount={hideProgressCount}
                containerClassName="doer-panel doer-panel--inline"
                containerStyle={{
                  position: "relative",
                  bottom: "auto",
                  right: "auto",
                  boxShadow: "none",
                  border: "none",
                  background: "transparent",
                  margin: 0,
                  zIndex: "auto",
                  width: "100%",
                }}
              />
            </EmbedShellPreview>
          ) : (
            <DoerPanel
              journey={journey}
              scenario={mode}
              accent={accent}
                hideProgressCount={hideProgressCount}
              containerClassName="doer-panel doer-panel--inline"
              containerStyle={{
                position: "relative",
                bottom: "auto",
                right: "auto",
                boxShadow: "none",
                border: "1px solid var(--border)",
                background: "var(--surface)",
                margin: 0,
                zIndex: "auto",
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Mock HighLevel shell used by the live client preview when
 * placement.mode === "embed". Renders the checklist as a full in-menu page
 * (sidebar + top bar + content area) rather than a floating overlay.
 * Stays on the client surface — no GoCSM brand marks.
 */
function EmbedShellPreview({
  children,
  accent,
}: {
  children: React.ReactNode;
  accent: string;
}) {
  return (
    <div
      style={{
        width: "min(720px, 100%)",
        border: "1px solid var(--border)",
        borderRadius: "var(--r-md)",
        background: "var(--surface)",
        overflow: "hidden",
        display: "grid",
        gridTemplateColumns: "160px 1fr",
        gridTemplateRows: "28px 1fr",
      }}
    >
      {/* Top bar — spans both columns */}
      <div
        style={{
          gridColumn: "1 / -1",
          height: 28,
          background: "var(--bg-subtle)",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "0 10px",
        }}
        aria-hidden
      >
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--border)" }} />
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--border)" }} />
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--border)" }} />
      </div>

      {/* Sidebar */}
      <div
        style={{
          background: "var(--bg-subtle)",
          borderRight: "1px solid var(--border)",
          padding: "12px 8px",
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
        aria-hidden
      >
        {[0, 1, 2, 3, 4].map((i) => {
          const highlighted = i === 2;
          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                height: 22,
                padding: "0 8px",
                borderRadius: "var(--r-sm)",
                background: highlighted
                  ? `color-mix(in oklab, ${accent} 14%, transparent)`
                  : "transparent",
              }}
            >
              <span
                style={{
                  width: 4,
                  height: 4,
                  borderRadius: "50%",
                  background: highlighted ? accent : "var(--text-3)",
                }}
              />
              <span
                style={{
                  height: 4,
                  borderRadius: 1,
                  background: highlighted ? accent : "var(--border)",
                  width: highlighted ? 72 : 56,
                  opacity: highlighted ? 0.9 : 0.7,
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Content area */}
      <div
        style={{
          padding: 20,
          background: "var(--surface)",
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        <div
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: "var(--text)",
            lineHeight: 1.3,
          }}
        >
          Your onboarding checklist
        </div>
        <div style={{ minWidth: 0 }}>{children}</div>
      </div>
    </div>
  );
}



function TrackingOnlyBody({ onChange }: { onChange: () => void }) {
  return (
    <div
      style={{
        padding: 16,
        border: "1px solid var(--border)",
        borderRadius: "var(--r-md)",
        background: "var(--surface)",
      }}
    >
      <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text)" }}>
        Tracking only — your clients see no GoCSM experience
      </div>
      <div style={{ fontSize: 12, color: "var(--text-2)", marginTop: 6, lineHeight: 1.5 }}>
        You still get:
      </div>
      <ul
        style={{
          listStyle: "none",
          padding: 0,
          margin: "8px 0 0 0",
          display: "flex",
          flexDirection: "column",
          gap: 6,
          fontSize: 12.5,
          color: "var(--text)",
        }}
      >
        {[
          "Auto step detection",
          "Stall alerts & queue",
          "Workflows / automations",
        ].map((line) => (
          <li key={line} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              aria-hidden
              style={{
                width: 4,
                height: 4,
                borderRadius: "50%",
                background: "var(--text-3)",
                flexShrink: 0,
              }}
            />
            {line}
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={onChange}
        style={{
          marginTop: 12,
          padding: 0,
          background: "none",
          border: "none",
          fontSize: 12,
          color: "var(--text-3)",
          textDecoration: "underline",
          cursor: "pointer",
        }}
      >
        Change
      </button>
    </div>
  );
}

function ModeSegmented({
  mode,
  onChange,
}: {
  mode: Mode;
  onChange: (m: Mode) => void;
}) {
  const opts: { id: Mode; label: string; full: string }[] = [
    { id: "new", label: "New", full: "New client" },
    { id: "mid", label: "Mid", full: "Mid-journey" },
    { id: "stuck", label: "Stuck", full: "Stuck" },
  ];
  return (
    <div
      role="tablist"
      aria-label="Preview as"
      style={{
        display: "inline-flex",
        flexShrink: 0,
        border: "1px solid var(--border)",
        borderRadius: "var(--r-sm)",
        padding: 2,
        background: "var(--bg-subtle)",
      }}
    >
      {opts.map((o) => {
        const active = mode === o.id;
        return (
          <button
            key={o.id}
            type="button"
            role="tab"
            aria-selected={active}
            aria-label={o.full}
            title={o.full}
            onClick={() => onChange(o.id)}
            style={{
              height: 24,
              padding: "0 10px",
              background: active ? "var(--surface)" : "transparent",
              color: active ? "var(--text)" : "var(--text-2)",
              border: "none",
              borderRadius: "calc(var(--r-sm) - 1px)",
              fontSize: 11,
              fontWeight: active ? 600 : 500,
              cursor: "pointer",
              boxShadow: active ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
              letterSpacing: "0.01em",
              whiteSpace: "nowrap",
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}


export function CustomizeDrawer({
  open,
  brandColor,
  onBrandColorChange,
  placement,
  onPlacementChange,
  onClose,
}: {
  open: boolean;
  brandColor?: string;
  onBrandColorChange: (next: string | undefined) => void;
  placement: Placement;
  onPlacementChange: (next: Placement) => void;
  onClose: () => void;
}) {
  const current = (brandColor ?? DEFAULT_BRAND_COLOR).toLowerCase();
  const [hexInput, setHexInput] = useState(current);

  useEffect(() => {
    setHexInput(current);
  }, [current]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (typeof document === "undefined") return null;
  if (!open) return null;

  const commitHex = (raw: string) => {
    const n = normalizeHex(raw);
    if (n) onBrandColorChange(n);
  };

  return createPortal(
    <>
      <div
        onClick={onClose}
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(15,27,45,0.32)",
          zIndex: 60,
          animation: "fade-in var(--d-base) var(--ease)",
        }}
      />
      <aside
        role="dialog"
        aria-label="Appearance"
        aria-modal="true"
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          height: "100vh",
          width: "min(420px, 100vw)",
          background: "var(--surface)",
          borderLeft: "1px solid var(--border)",
          boxShadow: "var(--sh-sheet, 0 10px 28px rgba(15,23,42,0.18))",
          zIndex: 61,
          display: "flex",
          flexDirection: "column",
          animation: "slide-in-right var(--d-base) var(--ease)",
        }}
      >
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: "1px solid var(--border-soft, var(--border))",
            flexShrink: 0,
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>
            Appearance
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 32,
              height: 32,
              padding: 0,
              background: "transparent",
              border: "none",
              borderRadius: "var(--r-sm)",
              color: "var(--text-2)",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--bg-hover)";
              e.currentTarget.style.color = "var(--text)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "var(--text-2)";
            }}
          >
            <X size={16} strokeWidth={1.75} aria-hidden />
          </button>
        </header>

        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: 24,
            display: "flex",
            flexDirection: "column",
            gap: 32,
          }}
        >
          <section>
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "var(--text)",
                marginBottom: 12,
                letterSpacing: "0.01em",
              }}
            >
              Brand color
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              {BRAND_PRESETS.map((c) => {
                const selected = c === current;
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
                      width: 24,
                      height: 24,
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

            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
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
                  flex: 1,
                  height: 28,
                  padding: "0 8px",
                  fontFamily: "var(--font-mono, ui-monospace, monospace)",
                  fontSize: 12,
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
          </section>

          <section
            style={{
              borderTop: "1px solid var(--border-soft, var(--border))",
              paddingTop: 24,
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "var(--text)",
                marginBottom: 4,
                letterSpacing: "0.01em",
              }}
            >
              Placement
            </div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 400,
                color: "var(--text-2)",
                marginBottom: 12,
                lineHeight: 1.35,
              }}
            >
              This is where the checklist appears for every step.
            </div>
            <PlacementTab placement={placement} onChange={onPlacementChange} />
          </section>
        </div>
      </aside>
    </>,
    document.body
  );
}

function PlacementCard({
  selected,
  onSelect,
  mock,
  title,
  body,
  recommended,
  note,
  children,
}: {
  selected: boolean;
  onSelect: () => void;
  mock: React.ReactNode;
  title: string;
  body: string;
  recommended?: boolean;
  note?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div
      style={{
        border: "1px solid var(--border)",
        borderRadius: "var(--r-md)",
        padding: 10,
        outline: selected ? "2px solid var(--info-7)" : "2px solid transparent",
        outlineOffset: -2,
        background: "var(--surface)",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <button
        type="button"
        aria-pressed={selected}
        onClick={onSelect}
        style={{
          all: "unset",
          display: "flex",
          flexDirection: "column",
          gap: 10,
          cursor: "pointer",
          width: "100%",
          color: "var(--client-accent, var(--info-7))",
        }}
      >
        <div style={{ width: "100%" }}>{mock}</div>
        <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
              {title}
            </div>
            {recommended && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  padding: "2px 8px",
                  borderRadius: "var(--r-sm)",
                  background: "var(--bg-subtle)",
                  color: "var(--text-2)",
                  border: "1px solid var(--border)",
                }}
              >
                Recommended
              </span>
            )}
          </div>
          <div
            style={{
              fontSize: 12,
              color: "var(--text-2)",
              lineHeight: 1.4,
            }}
          >
            {body}
          </div>
          {note && (
            <div
              style={{
                fontSize: 11.5,
                color: "var(--text-2)",
                lineHeight: 1.45,
                marginTop: 2,
              }}
            >
              {note}
            </div>
          )}
        </div>
      </button>
      {children}
    </div>
  );
}

export function PlacementTab({
  placement,
  onChange,
}: {
  placement: Placement;
  onChange: (next: Placement) => void;
}) {
  const mode = placement.mode;
  const pos: FloatingPosition = placement.position ?? "bottom-right-offset";

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
        gap: 12,
      }}
    >
      <PlacementCard
        selected={mode === "banner"}
        onSelect={() => onChange({ mode: "banner" })}
        mock={<BannerMock />}
        title="Top banner"
        body="A thin status bar across the top of HighLevel."
        recommended
        note="Stays visible without clashing with your existing chat or help widget."
      />

      <PlacementCard
        selected={mode === "floating"}
        onSelect={() =>
          onChange({ mode: "floating", position: placement.position ?? pos })
        }
        mock={<FloatingMock position={pos} />}
        title="Floating widget"
        body="A small bubble in the corner of HighLevel."
        note={
          mode === "floating"
            ? "Heads up — if you already run a chat or help widget, a floating checklist may sit on top of it."
            : undefined
        }
      >
        {mode === "floating" && (
          <PositionPicker
            selected={pos}
            onSelect={(p) => onChange({ mode: "floating", position: p })}
          />
        )}
      </PlacementCard>

      <PlacementCard
        selected={mode === "menu"}
        onSelect={() => onChange({ mode: "menu" })}
        mock={<MenuMock />}
        title="Menu link"
        body="A new item in the HighLevel sidebar that opens the checklist."
      />

      <PlacementCard
        selected={mode === "embed"}
        onSelect={() => onChange({ mode: "embed" })}
        mock={<EmbedMock />}
        title="Embedded page · Launchpad"
        body="A full page mounted inside HighLevel, like Launchpad."
      />
    </div>
  );
}

const POSITION_LABEL: Record<FloatingPosition, string> = {
  "bottom-right": "Bottom-right",
  "bottom-left": "Bottom-left",
  "bottom-right-offset": "Next to your chat widget",
};

function PositionPicker({
  selected,
  onSelect,
}: {
  selected: FloatingPosition;
  onSelect: (p: FloatingPosition) => void;
}) {
  // Mini HL frame is 220 × 120.
  const W = 220;
  const H = 120;
  const anchors: Array<{ id: FloatingPosition; cx: number; cy: number }> = [
    { id: "bottom-left", cx: 18, cy: H - 14 },
    { id: "bottom-right-offset", cx: W - 82, cy: H - 14 },
    { id: "bottom-right", cx: W - 14, cy: H - 14 },
  ];
  return (
    <div style={{ marginTop: 12 }}>
      <div
        style={{
          fontSize: 10,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          color: "var(--text-3)",
          fontWeight: 600,
          marginBottom: 6,
        }}
      >
        Where it sits
      </div>
      <div
        style={{
          position: "relative",
          width: W,
          height: H,
          maxWidth: "100%",
          borderRadius: "var(--r-sm)",
          background: "var(--bg-subtle)",
          border: "1px solid var(--border)",
          overflow: "hidden",
        }}
      >
        {/* Top bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 14,
            background: "color-mix(in oklab, var(--border) 50%, transparent)",
          }}
        />
        {/* Sidebar */}
        <div
          style={{
            position: "absolute",
            top: 14,
            bottom: 0,
            left: 0,
            width: 28,
            background: "color-mix(in oklab, var(--border) 35%, transparent)",
          }}
        />
        {/* Chat-widget hint dot to anchor "next to your chat widget" */}
        <div
          aria-hidden
          title="HighLevel chat widget"
          style={{
            position: "absolute",
            right: 8,
            bottom: 8,
            width: 14,
            height: 14,
            borderRadius: "50%",
            border: "1.5px dashed var(--text-3)",
          }}
        />
        {anchors.map((a) => {
          const active = a.id === selected;
          return (
            <button
              key={a.id}
              type="button"
              aria-label={POSITION_LABEL[a.id]}
              title={POSITION_LABEL[a.id]}
              onClick={() => onSelect(a.id)}
              style={{
                position: "absolute",
                left: a.cx - 12,
                top: a.cy - 12,
                width: 24,
                height: 24,
                padding: 0,
                background: "transparent",
                border: "none",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  background: active
                    ? "var(--client-accent, var(--info-7))"
                    : "var(--surface)",
                  border: active
                    ? "2px solid var(--client-accent, var(--info-7))"
                    : "1.5px solid var(--text-3)",
                  boxShadow: active
                    ? "0 0 0 2px color-mix(in oklab, var(--client-accent, var(--info-7)) 35%, transparent)"
                    : "none",
                }}
              />
            </button>
          );
        })}
      </div>
      <div
        style={{
          marginTop: 6,
          fontSize: 11.5,
          color: "var(--text-2)",
        }}
      >
        Selected: {POSITION_LABEL[selected]}
      </div>
    </div>
  );
}



