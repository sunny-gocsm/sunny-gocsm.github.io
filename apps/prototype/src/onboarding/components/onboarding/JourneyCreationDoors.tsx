import { useState } from "react";
import { TEMPLATES, type Template, cloneTemplate, createEmptyDraft } from "@onb/lib/templates";
import { mapChecklistToJourney } from "@onb/lib/mapping";
import { saveJourney, type Journey } from "@onb/lib/types";

export function JourneyCreationDoors({
  onCreated,
}: {
  onCreated: (journey: Journey) => void;
}) {
  const handlePaste = (raw: string) => onCreated(saveJourney(mapChecklistToJourney(raw)));
  const handleTemplate = (tid: string) => onCreated(saveJourney(cloneTemplate(tid)));
  const handleScratch = () => onCreated(saveJourney(createEmptyDraft()));

  return (
    <>
      <p
        style={{
          fontSize: 14,
          color: "var(--text-2)",
          margin: 0,
          maxWidth: 760,
          lineHeight: 1.5,
        }}
      >
        Define what a fully onboarded client looks like — every new sub-account
        will be guided through it step by step.
      </p>

      <div
        style={{
          maxWidth: 760,
          display: "flex",
          flexDirection: "column",
          gap: 16,
          marginTop: 16,
        }}
      >
        <PasteDoor onSubmit={handlePaste} />
        <TemplatesDoor onPick={handleTemplate} />
        <ScratchDoor onPick={handleScratch} />
      </div>
    </>
  );
}

/* ---------- Door 1: Paste (AI hero) ---------- */

export function PasteDoor({ onSubmit }: { onSubmit: (raw: string) => void }) {
  const [value, setValue] = useState("");
  const disabled = value.trim().length === 0;

  return (
    <div className="ai-surface">
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div className="ai-glyph">
          <i data-lucide="sparkles" style={{ width: 14, height: 14 }} />
        </div>
        <span className="ai-attr">
          <span className="dot" />
          AI-mapped
        </span>
      </div>

      <h2
        style={{
          fontFamily: "var(--font-ui)",
          fontSize: 16,
          fontWeight: 600,
          color: "var(--text)",
          margin: "12px 0 0",
          lineHeight: 1.3,
        }}
      >
        Paste your existing checklist
      </h2>
      <p
        style={{
          fontSize: 14,
          color: "var(--text-2)",
          margin: "4px 0 0",
          lineHeight: 1.5,
        }}
      >
        AI maps each line to a step type and drafts the journey for your review.
      </p>

      <textarea
        className="textarea"
        rows={5}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={
          "Intro call with client\nSet up A2P registration\nConnect custom domain\nAdd staff users"
        }
        style={{
          marginTop: 12,
          fontFamily: "var(--font-ui)",
          fontSize: 13,
          lineHeight: 1.5,
          resize: "vertical",
        }}
      />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          marginTop: 12,
        }}
      >
        <p style={{ fontSize: 12, color: "var(--text-3)", margin: 0, lineHeight: 1.5 }}>
          Every auto-mapped step gets a confidence tag — mapped or guess — so
          you review before publishing.
        </p>
        <button
          className="btn btn-ai"
          disabled={disabled}
          onClick={() => !disabled && onSubmit(value)}
          style={disabled ? { opacity: 0.5, cursor: "not-allowed" } : undefined}
        >
          Map with AI →
        </button>
      </div>
    </div>
  );
}

/* ---------- Door 2: Templates ---------- */

function TemplatesDoor({ onPick }: { onPick: (id: string) => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div
        style={{
          fontFamily: "var(--font-ui)",
          fontSize: 11,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          color: "var(--text-3)",
        }}
      >
        Start from a template
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 12,
        }}
      >
        {TEMPLATES.map((t) => (
          <TemplateCard key={t.id} t={t} onPick={onPick} />
        ))}
      </div>
    </div>
  );
}

function TemplateCard({ t, onPick }: { t: Template; onPick: (id: string) => void }) {
  return (
    <div
      className="card card-hover card-padded"
      role="button"
      tabIndex={0}
      onClick={() => onPick(t.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onPick(t.id);
        }
      }}
      style={{ display: "flex", flexDirection: "column" }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 8,
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-ui)",
            fontSize: 14,
            fontWeight: 600,
            color: "var(--text)",
            lineHeight: 1.3,
          }}
        >
          {t.name}
        </div>
        {t.badge && (
          <span
            className="badge-ai"
            style={{
              fontSize: 10.5,
              fontWeight: 600,
              padding: "2px 8px",
              borderRadius: 999,
              whiteSpace: "nowrap",
              letterSpacing: "0.02em",
            }}
          >
            {t.badge}
          </span>
        )}
      </div>

      <div
        className="mono"
        style={{ fontSize: 12, color: "var(--text-3)", marginTop: 4 }}
      >
        {t.stepCount} steps · {t.estDuration}
      </div>

      <ol
        style={{
          listStyle: "none",
          padding: 0,
          margin: "12px 0 0",
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        {t.peek.map((title, i) => (
          <li
            key={i}
            style={{ display: "flex", gap: 8, fontSize: 13, lineHeight: 1.4 }}
          >
            <span
              style={{
                color: "var(--text-3)",
                fontFamily: "var(--font-ui)",
                width: 18,
                flexShrink: 0,
              }}
            >
              {i + 1}.
            </span>
            <span style={{ color: "var(--text-2)" }}>{title}</span>
          </li>
        ))}
      </ol>

      <div
        style={{
          fontSize: 13,
          color: "var(--text-3)",
          marginTop: 8,
        }}
      >
        +{t.stepCount - 5} more steps
      </div>
    </div>
  );
}

/* ---------- Door 3: Scratch ---------- */

function ScratchDoor({ onPick }: { onPick: () => void }) {
  return (
    <button
      type="button"
      onClick={onPick}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: 44,
        background: "transparent",
        color: "var(--text-2)",
        fontFamily: "var(--font-ui)",
        fontSize: 14,
        fontWeight: 500,
        border: "1px dashed var(--border)",
        borderRadius: "var(--r-sm)",
        cursor: "pointer",
        width: "100%",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text)")}
      onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-2)")}
    >
      + Start from scratch →
    </button>
  );
}
