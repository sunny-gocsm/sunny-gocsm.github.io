import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Check, ChevronRight, GripVertical, MoreVertical } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Journey, Step } from "@onb/lib/types";
import { canAutoDetect } from "@onb/lib/catalog";

function isManualConfirm(step: Step): boolean {
  return !canAutoDetect(step.type);
}


export function StepCard({
  step,
  journey,
  onClick,
  onRemove,
  edited = false,
  isNew = false,
}: {
  step: Step;
  journey: Journey;
  onClick?: () => void;
  onRemove?: () => void;
  edited?: boolean;
  isNew?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!menuOpen) return;
    function onDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [menuOpen]);



  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: step.id });

  const wrapperStyle: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 2 : undefined,
    position: "relative",
  };

  const cardStyle: CSSProperties = {
    padding: 16,
    cursor: onClick ? "pointer" : undefined,
    background: onClick && hovered ? "var(--bg-hover)" : undefined,
    transition: "background var(--d-fast) var(--ease)",
  };

  const chipBaseStyle: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    fontSize: 11,
    color: "var(--text-2)",
    border: "1px solid var(--border)",
    padding: "2px 8px",
    borderRadius: "var(--r-pill)",
    letterSpacing: "0.02em",
  };

  return (
    <div
      ref={setNodeRef}
      style={wrapperStyle}
      {...attributes}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className="card"
        style={cardStyle}
        role={onClick ? "button" : undefined}
        tabIndex={onClick ? 0 : undefined}
        onClick={onClick}
        onKeyDown={
          onClick
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onClick();
                }
              }
            : undefined
        }
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            type="button"
            aria-label="Reorder step"
            {...listeners}
            onClick={(e) => e.stopPropagation()}
            style={{
              all: "unset",
              display: "inline-flex",
              cursor: "grab",
              touchAction: "none",
              padding: 2,
              borderRadius: 4,
            }}
          >
            <GripVertical
              size={14}
              style={{ color: "var(--text-3)", opacity: 0.55 }}
              aria-hidden
            />
          </button>
          <span
            className="mono"
            style={{
              fontSize: 12,
              color: "var(--text-3)",
              width: 22,
              flexShrink: 0,
              textAlign: "right",
            }}
          >
            {String(step.order).padStart(2, "0")}
          </span>

          <div
            style={{
              flex: 1,
              minWidth: 0,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <span
              aria-hidden
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "var(--text-3)",
                flexShrink: 0,
              }}
            />
            <div
              style={{
                minWidth: 0,
                fontSize: 13,
                color: "var(--text-1)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {step.title}
            </div>
          </div>


          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginLeft: "auto",
              flexShrink: 0,
            }}
          >
            {(isNew || edited) && (
              <span
                title={isNew ? "New — not yet published" : "Edited — not yet published"}
                style={{
                  fontSize: 11,
                  color: "var(--warn-9)",
                  background: "var(--warn-soft)",
                  padding: "2px 8px",
                  borderRadius: "var(--r-pill)",
                  letterSpacing: "0.02em",
                }}
              >
                {isNew ? "New" : "Edited"}
              </span>
            )}
            {step.assets && step.assets.length > 0 && (() => {
              const n = step.assets.length;
              const noun =
                step.type === "funnel_publish"
                  ? n === 1 ? "funnel" : "funnels"
                  : n === 1 ? "workflow" : "workflows";
              return (
                <span style={chipBaseStyle}>
                  <span className="mono">{n}</span> {noun}
                </span>
              );
            })()}
            {isManualConfirm(step) ? (
              <span
                aria-label="You confirm"
                title="You'll mark this step done manually."
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  fontSize: 11,
                  padding: "2px 8px",
                  borderRadius: "var(--r-pill)",
                  letterSpacing: "0.02em",
                  background: "var(--warn-soft)",
                  color: "var(--warn-9)",
                }}
              >
                You confirm
              </span>
            ) : (
              <span
                aria-label="Auto-checks"
                title="GoCSM verifies this step automatically."
                style={chipBaseStyle}
              >
                <Check size={12} aria-hidden style={{ color: "currentColor" }} />
                Auto-checks
              </span>
            )}


            {onClick && (
              <span
                aria-hidden
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 2,
                  fontSize: 12,
                  color: "var(--text-3)",
                  opacity: hovered ? 1 : 0,
                  transition: "opacity 120ms ease-out",
                  pointerEvents: "none",
                  whiteSpace: "nowrap",
                }}
              >
                Customize
                <ChevronRight size={12} aria-hidden />
              </span>
            )}

            {onRemove && (
              <div
                ref={menuRef}
                style={{
                  position: "relative",
                  opacity: hovered || menuOpen ? 1 : 0,
                  transition: "opacity 120ms ease-out",
                }}
              >
                <button
                  type="button"
                  aria-label="Step actions"
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen((v) => !v);
                  }}
                  style={{
                    all: "unset",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 24,
                    height: 24,
                    borderRadius: "var(--r-sm)",
                    cursor: "pointer",
                    color: "var(--text-3)",
                  }}
                >
                  <MoreVertical size={14} aria-hidden />
                </button>
                {menuOpen && (
                  <div
                    role="menu"
                    className="card"
                    style={{
                      position: "absolute",
                      top: "calc(100% + 4px)",
                      right: 0,
                      width: 160,
                      padding: 6,
                      zIndex: 20,
                      boxShadow: "var(--sh-sheet)",
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setMenuOpen(false);
                        onRemove();
                      }}
                      style={{
                        all: "unset",
                        display: "block",
                        width: "100%",
                        padding: "8px 10px",
                        fontSize: 13,
                        color: "var(--neg-9)",
                        cursor: "pointer",
                        borderRadius: "var(--r-sm)",
                        boxSizing: "border-box",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background =
                          "var(--bg-subtle)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background =
                          "transparent";
                      }}
                    >
                      Remove step
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
