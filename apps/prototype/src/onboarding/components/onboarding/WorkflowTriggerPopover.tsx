import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Popover, PopoverTrigger, PopoverContent } from "@onb/components/ui/popover";
import { Search } from "lucide-react";

const WORKFLOWS = [
  "Onboarding reminder",
  "Book your kickoff call",
  "A2P registration help",
  "Re-engagement",
  "Welcome sequence",
];

function suggestWorkflow(step?: string | null): string {
  const s = (step ?? "").toLowerCase();
  if (/a2p/.test(s)) return "A2P registration help";
  if (/kickoff/.test(s)) return "Book your kickoff call";
  if (/domain|email/.test(s)) return "Onboarding reminder";
  return "Onboarding reminder";
}

interface Props {
  account: string;
  currentStep?: string | null;
  onPick: (workflow: string) => void;
  children: ReactNode;
}

export function WorkflowTriggerPopover({ account, currentStep, onPick, children }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const suggested = useMemo(() => suggestWorkflow(currentStep), [currentStep]);
  const others = useMemo(() => WORKFLOWS.filter((w) => w !== suggested), [suggested]);

  const q = query.trim().toLowerCase();
  const suggestedMatches = q === "" || suggested.toLowerCase().includes(q);
  const filteredOthers = q === "" ? others : others.filter((w) => w.toLowerCase().includes(q));

  // Flat ordered list for keyboard nav: suggested first (if matches), then others.
  const flat = useMemo(
    () =>
      [...(suggestedMatches ? [suggested] : []), ...filteredOthers],
    [suggestedMatches, suggested, filteredOthers],
  );

  useEffect(() => {
    setActiveIdx(0);
  }, [query, open]);

  useEffect(() => {
    if (open) {
      // Defer to next tick so Radix has portaled the content.
      const t = setTimeout(() => inputRef.current?.focus(), 0);
      return () => clearTimeout(t);
    }
  }, [open]);

  const pick = (wf: string) => {
    onPick(wf);
    setOpen(false);
    setQuery("");
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(flat.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const wf = flat[activeIdx];
      if (wf) pick(wf);
    }
  };

  const captionStyle: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: "var(--text-3)",
    padding: "10px 12px 4px",
  };

  const rowBase: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    height: 36,
    fontSize: 13,
    color: "var(--text)",
    cursor: "pointer",
    userSelect: "none",
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={6}
        collisionPadding={8}
        className="p-0"
        style={{
          width: 320,
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--r-md)",
          boxShadow: "var(--shadow-2, 0 8px 24px rgba(15,23,42,.12))",
          overflow: "hidden",
        }}
        onKeyDown={onKeyDown}
      >
        {/* Header */}
        <div
          style={{
            padding: "12px 12px 10px",
            fontSize: 12,
            color: "var(--text-2)",
            borderBottom: "1px solid var(--border-soft)",
            lineHeight: 1.4,
          }}
        >
          Send which workflow to{" "}
          <span style={{ color: "var(--text)", fontWeight: 600 }}>{account}</span>?
        </div>

        {/* Search */}
        <div style={{ padding: "8px 8px 4px", position: "relative" }}>
          <Search
            size={14}
            strokeWidth={1.75}
            aria-hidden
            style={{
              position: "absolute",
              left: 18,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-3)",
              pointerEvents: "none",
            }}
          />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search workflows"
            className="placeholder:text-[color:var(--text-3)]"
            style={{
              width: "100%",
              height: 32,
              padding: "0 10px 0 32px",
              background: "var(--n-2)",
              border: "1px solid transparent",
              borderRadius: "var(--r-sm)",
              fontSize: 13,
              color: "var(--text)",
              outline: "none",
            }}
            onFocus={(e) => {
              e.currentTarget.style.background = "var(--surface)";
              e.currentTarget.style.borderColor = "var(--border)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.background = "var(--n-2)";
              e.currentTarget.style.borderColor = "transparent";
            }}
          />
        </div>

        {/* List */}
        <div style={{ maxHeight: 260, overflowY: "auto" }}>
          {flat.length === 0 && (
            <div
              style={{
                padding: "16px 12px",
                fontSize: 13,
                color: "var(--text-3)",
                textAlign: "center",
              }}
            >
              No workflows match “{query}”.
            </div>
          )}

          {suggestedMatches && (
            <>
              <div style={captionStyle}>Suggested for this step</div>
              <div style={{ padding: "0 4px" }}>
                <div
                  role="option"
                  aria-selected={activeIdx === 0}
                  onMouseEnter={() => setActiveIdx(0)}
                  onClick={() => pick(suggested)}
                  style={{
                    ...rowBase,
                    padding: "0 10px 0 8px",
                    borderLeft: "2px solid var(--info-7)",
                    borderRadius: "var(--r-sm)",
                    background:
                      activeIdx === 0
                        ? "color-mix(in oklab, var(--info-7) 10%, transparent)"
                        : "color-mix(in oklab, var(--info-7) 6%, transparent)",
                  }}
                >
                  <span style={{ fontWeight: 500 }}>{suggested}</span>
                  <span
                    style={{
                      height: 20,
                      padding: "0 8px",
                      display: "inline-flex",
                      alignItems: "center",
                      fontSize: 11,
                      fontWeight: 600,
                      color: "var(--info-9)",
                      background: "color-mix(in oklab, var(--info-7) 12%, transparent)",
                      borderRadius: 999,
                    }}
                  >
                    Suggested
                  </span>
                </div>
              </div>
            </>
          )}

          {filteredOthers.length > 0 && (
            <>
              <div style={captionStyle}>All workflows</div>
              <div style={{ padding: "0 4px 6px" }}>
                {filteredOthers.map((wf, i) => {
                  const idx = (suggestedMatches ? 1 : 0) + i;
                  const active = activeIdx === idx;
                  return (
                    <div
                      key={wf}
                      role="option"
                      aria-selected={active}
                      onMouseEnter={() => setActiveIdx(idx)}
                      onClick={() => pick(wf)}
                      style={{
                        ...rowBase,
                        padding: "0 12px",
                        borderRadius: "var(--r-sm)",
                        background: active ? "var(--n-2)" : "transparent",
                      }}
                    >
                      <span>{wf}</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Footer hint */}
        <div
          style={{
            borderTop: "1px solid var(--border-soft)",
            padding: "8px 12px",
            fontSize: 11,
            color: "var(--text-3)",
            background: "var(--n-1, var(--surface))",
          }}
        >
          ↑↓ to navigate · Enter to send
        </div>
      </PopoverContent>
    </Popover>
  );
}
