import { Check, X } from "lucide-react";
import { useEffect, useState } from "react";
import { validateJourney, type FixField } from "@onb/lib/validate-journey";
import type { Journey } from "@onb/lib/types";

export type PublishScope = "new_only" | "all";

export function PublishValidationModal({
  open,
  journey,
  clientCount = 0,
  showMigration = false,
  changeCount,
  onClose,
  onPublish,
  onFix,
}: {
  open: boolean;
  journey: Journey;
  clientCount?: number;
  showMigration?: boolean;
  changeCount?: number;
  onClose: () => void;
  onPublish: (scope: PublishScope) => void;
  onFix: (stepId: string, field: FixField) => void;
}) {
  const [scope, setScope] = useState<PublishScope>("new_only");

  useEffect(() => {
    if (open) setScope("new_only");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  const checks = validateJourney(journey);
  const allPass = checks.every((c) => c.pass);
  const effectiveScope: PublishScope = showMigration ? scope : "new_only";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Publish changes"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(6,35,61,0.32)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
      }}
    >
      <div
        className="card"
        onClick={(e) => e.stopPropagation()}
        style={{ width: 480, boxShadow: "var(--sh-sheet)" }}
      >
        <div
          className="modal-head"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>
            Publish changes
          </div>
          <button
            type="button"
            className="btn btn-ghost"
            aria-label="Close"
            onClick={onClose}
            style={{ padding: 6 }}
          >
            <X size={16} aria-hidden />
          </button>
        </div>
        <div className="modal-body">
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            {checks.map((c) => {
              const Icon = c.pass ? Check : X;
              const color = c.pass ? "var(--pos-7)" : "var(--warn-7)";
              const labelEl =
                !c.pass && c.fixStepId && c.fixField ? (
                  <button
                    type="button"
                    onClick={() => onFix(c.fixStepId!, c.fixField!)}
                    style={{
                      all: "unset",
                      cursor: "pointer",
                      color: "var(--warn-9)",
                      textDecoration: "underline",
                      textUnderlineOffset: 2,
                      fontSize: 13,
                    }}
                  >
                    {c.label}
                  </button>
                ) : (
                  <span
                    style={{
                      fontSize: 13,
                      color: c.pass ? "var(--text)" : "var(--warn-9)",
                    }}
                  >
                    {c.label}
                  </span>
                );
              return (
                <li
                  key={c.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    minHeight: 36,
                  }}
                >
                  <Icon size={16} aria-hidden style={{ color, flexShrink: 0 }} />
                  {labelEl}
                </li>
              );
            })}
          </ul>

          {typeof changeCount === "number" && changeCount > 0 && (
            <div
              style={{
                marginTop: 14,
                paddingTop: 12,
                borderTop: "1px solid var(--border-soft)",
                fontSize: 12,
                color: "var(--text-2)",
              }}
            >
              <span className="mono" style={{ color: "var(--text)" }}>
                {changeCount}
              </span>{" "}
              change{changeCount === 1 ? "" : "s"} since you last published
            </div>
          )}

          {showMigration && (
            <div
              style={{
                marginTop: 16,
                paddingTop: 16,
                borderTop: "1px solid var(--border-soft)",
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--text-2)",
                }}
              >
                Apply to
              </div>
              <label
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  fontSize: 13,
                  color: "var(--text)",
                  cursor: "pointer",
                  lineHeight: 1.5,
                }}
              >
                <input
                  type="radio"
                  name="publish-scope"
                  value="new_only"
                  checked={scope === "new_only"}
                  onChange={() => setScope("new_only")}
                  style={{ marginTop: 3 }}
                />
                <span>New clients only (recommended)</span>
              </label>
              <label
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  fontSize: 13,
                  color: "var(--text)",
                  cursor: "pointer",
                  lineHeight: 1.5,
                }}
              >
                <input
                  type="radio"
                  name="publish-scope"
                  value="all"
                  checked={scope === "all"}
                  onChange={() => setScope("all")}
                  style={{ marginTop: 3 }}
                />
                <span>
                  Also update {clientCount} clients mid-journey{" "}
                  <span style={{ color: "var(--warn-9)" }}>
                    — may re-open completed steps
                  </span>
                </span>
              </label>
            </div>
          )}
        </div>
        <div className="modal-foot">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Fix issues
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!allPass}
            aria-disabled={!allPass}
            onClick={() => onPublish(effectiveScope)}
            style={
              !allPass
                ? { opacity: 0.5, cursor: "not-allowed", pointerEvents: "none" }
                : undefined
            }
          >
            Publish
          </button>
        </div>
      </div>
    </div>
  );
}
