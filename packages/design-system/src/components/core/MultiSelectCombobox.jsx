import React from "react";
import { Icon } from "../util/Icon.jsx";

/**
 * GoCSM MultiSelectCombobox — searchable multi-select for large enum sets (features,
 * plans). In-field removable chips, type-to-filter checkable dropdown that stays open
 * across picks, "+N more" collapse, Backspace removes the last chip. For Enum > ~7.
 * Maps to .ms-combo.
 *
 * Controlled: `selected: string[]`, `onChange(next: string[])`.
 */
export function MultiSelectCombobox({
  options = [],
  selected = [],
  onChange,
  placeholder = "Search…",
  searchable = true,
  maxVisibleChips = 4,
  className = "",
  ...rest
}) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const rootRef = React.useRef(null);

  React.useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const toggle = (opt) => {
    const has = selected.includes(opt);
    onChange && onChange(has ? selected.filter((s) => s !== opt) : [...selected, opt]);
  };
  const removeLast = () => {
    if (selected.length) onChange && onChange(selected.slice(0, -1));
  };

  const filtered = options.filter((o) => o.toLowerCase().includes(query.toLowerCase()));
  const shownChips = selected.slice(0, maxVisibleChips);
  const overflow = selected.length - shownChips.length;

  return (
    <span className={["ms-combo", className].filter(Boolean).join(" ")} ref={rootRef} {...rest}>
      <span className="ms-control" onClick={() => setOpen(true)}>
        {shownChips.map((s) => (
          <span key={s} className="ms-chip">
            {s}
            <button
              type="button"
              className="ms-chip-x"
              aria-label={`Remove ${s}`}
              onClick={(e) => {
                e.stopPropagation();
                toggle(s);
              }}
            >
              <Icon name="x" />
            </button>
          </span>
        ))}
        {overflow > 0 ? <span className="ms-more">+{overflow} more</span> : null}
        {searchable ? (
          <input
            className="ms-input"
            value={query}
            placeholder={selected.length === 0 ? placeholder : ""}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "Backspace" && query === "") removeLast();
            }}
            aria-label={placeholder}
          />
        ) : (
          <button type="button" className="ms-open" onClick={() => setOpen((o) => !o)}>
            {selected.length === 0 ? placeholder : "Add…"}
          </button>
        )}
      </span>

      {open ? (
        <span className="ms-pop" role="listbox" aria-multiselectable="true">
          {filtered.length === 0 ? (
            <span className="ms-empty">No matches</span>
          ) : (
            filtered.map((o) => {
              const on = selected.includes(o);
              return (
                <button
                  key={o}
                  type="button"
                  role="option"
                  aria-selected={on}
                  className={["ms-opt", on ? "on" : ""].filter(Boolean).join(" ")}
                  onClick={() => toggle(o)}
                >
                  <span className="ms-check" aria-hidden>{on ? <Icon name="check" /> : null}</span>
                  <span>{o}</span>
                </button>
              );
            })
          )}
        </span>
      ) : null}
    </span>
  );
}
