// JourneySummary — the landing for a user who has ALREADY built & published
// their journey (the "configured" state). A calm, at-a-glance overview; every
// section deep-links into that exact wizard step to edit (Baymard review-page
// pattern: 1:1 with the build flow, edit-in-place, no surprises). (Design-loop 2026-06.)

import { useMemo, useState } from "react";
import { ChevronRight, Eye, Pencil, X } from "lucide-react";
import type { Journey } from "@onb/lib/types";
import {
  OUTCOME_GROUPS,
  OTHER_GROUP,
  plainTitle,
  groupSteps,
  previewJourney,
} from "@onb/lib/plain-content";
import { ClientPreview } from "@onb/components/onboarding/ClientPreview";

const PLACEMENT_LABEL: Record<string, string> = {
  banner: "Top banner",
  floating: "Floating button",
  menu: "In their menu",
  embed: "Embedded page",
};

export function JourneySummary({
  journey,
  onEdit,
  onAdvanced,
}: {
  journey: Journey;
  /** Jump into the wizard at a given step (2 = steps, 3 = order, 4 = experience). */
  onEdit: (step: number) => void;
  onAdvanced?: () => void;
}) {
  const [showPreview, setShowPreview] = useState(false);
  const grouped = useMemo(() => groupSteps(journey.steps), [journey.steps]);
  const preview = useMemo(() => previewJourney(journey), [journey]);

  const stepCount = journey.steps.length;
  const weeks = Math.max(1, Math.round((journey.targetDays || 14) / 7));
  const live = journey.status === "published";
  const mode = journey.experienceMode ?? "guided";
  const placement = PLACEMENT_LABEL[journey.placement?.mode ?? "banner"];

  return (
    <div style={{ maxWidth: 760, margin: "0 auto" }}>
      {/* Header */}
      <header
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "var(--s-4)",
          flexWrap: "wrap",
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--s-3)", flexWrap: "wrap" }}>
            <h1
              style={{
                fontFamily: "var(--font-ui)",
                fontSize: 24,
                fontWeight: 700,
                letterSpacing: "-0.02em",
                color: "var(--text)",
                margin: 0,
                lineHeight: 1.2,
              }}
            >
              Your onboarding journey
            </h1>
            {live && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--pos-9, var(--pos-7))",
                  background: "var(--pos-soft)",
                  padding: "2px 9px",
                  borderRadius: "var(--r-pill)",
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--pos-7)" }} />
                Live
              </span>
            )}
          </div>
          <p className="mono" style={{ fontSize: 13, color: "var(--text-3)", margin: "var(--s-2) 0 0" }}>
            {stepCount} steps · about {weeks} {weeks === 1 ? "week" : "weeks"}
            {live && journey.clientCount > 0 ? ` · ${journey.clientCount} clients on it` : ""}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--s-2)", flexShrink: 0 }}>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowPreview(true)}>
            <Eye size={15} aria-hidden style={{ marginRight: 4 }} />
            Preview
          </button>
          <button type="button" className="btn btn-primary btn-sm" onClick={() => onEdit(1)}>
            <Pencil size={14} aria-hidden style={{ marginRight: 5 }} />
            Edit journey
          </button>
        </div>
      </header>

      {/* Outcome-group sections */}
      <div style={{ marginTop: "var(--s-8)", display: "flex", flexDirection: "column", gap: "var(--s-3)" }}>
        {[...OUTCOME_GROUPS, OTHER_GROUP].map((g) => {
          const list = grouped.get(g.id) ?? [];
          if (list.length === 0) return null;
          return (
            <section
              key={g.id}
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "var(--r-md)",
                boxShadow: "var(--sh-rest)",
                padding: "var(--s-4)",
                display: "flex",
                alignItems: "flex-start",
                gap: "var(--s-4)",
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: "var(--s-2)" }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{g.label}</span>
                  <span className="mono" style={{ fontSize: 12, color: "var(--text-3)" }}>
                    {list.length} {list.length === 1 ? "step" : "steps"}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: "var(--text-3)", marginTop: "var(--s-1)", lineHeight: 1.45 }}>
                  {list.map((s) => plainTitle(s.type, s.title)).join(" · ")}
                </div>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => onEdit(2)}
                style={{ color: "var(--info-7)", flexShrink: 0 }}
              >
                Edit
                <ChevronRight size={14} aria-hidden style={{ marginLeft: 2 }} />
              </button>
            </section>
          );
        })}
      </div>

      {/* Config rows */}
      <div style={{ marginTop: "var(--s-5)", display: "flex", flexDirection: "column", gap: "var(--s-2)" }}>
        <ConfigRow label="Order" value="Recommended order" onEdit={() => onEdit(3)} />
        <ConfigRow
          label="Clients see"
          value={mode === "guided" ? `Guided checklist · ${placement}` : "Tracked quietly (no checklist)"}
          onEdit={() => onEdit(4)}
        />
      </div>

      {onAdvanced && (
        <div style={{ marginTop: "var(--s-6)", textAlign: "center" }}>
          <button
            type="button"
            onClick={onAdvanced}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-3)",
              fontSize: 13,
              fontFamily: "var(--font-ui)",
            }}
          >
            Open the advanced editor — webhooks, deep links, per-plan variants ›
          </button>
        </div>
      )}

      {showPreview && (
        <div
          role="dialog"
          aria-label="Client preview"
          onClick={() => setShowPreview(false)}
          style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(6,35,61,0.35)", display: "flex", justifyContent: "flex-end" }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(480px, 92vw)",
              height: "100%",
              background: "var(--bg)",
              borderLeft: "1px solid var(--border)",
              padding: "var(--s-6)",
              overflowY: "auto",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--s-4)" }}>
              <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-3)" }}>
                What your client sees
              </span>
              <button type="button" aria-label="Close preview" onClick={() => setShowPreview(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-2)" }}>
                <X size={18} />
              </button>
            </div>
            <ClientPreview journey={preview} />
          </div>
        </div>
      )}
    </div>
  );
}

function ConfigRow({ label, value, onEdit }: { label: string; value: string; onEdit: () => void }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--s-3)",
        padding: "var(--s-3) var(--s-4)",
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--r-md)",
      }}
    >
      <div style={{ minWidth: 92, fontSize: 12, color: "var(--text-3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.03em" }}>
        {label}
      </div>
      <div style={{ flex: 1, fontSize: 14, color: "var(--text)" }}>{value}</div>
      <button type="button" className="btn btn-ghost btn-sm" onClick={onEdit} style={{ color: "var(--info-7)" }}>
        Edit
        <ChevronRight size={14} aria-hidden style={{ marginLeft: 2 }} />
      </button>
    </div>
  );
}
