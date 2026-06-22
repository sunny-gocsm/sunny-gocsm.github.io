import React from "react";

/**
 * GoCSM SegmentedControl — a compact pill of mutually-exclusive options (e.g. a 7d/30d/
 * Lifetime time-window toggle). One control, one decision; the selected segment lifts on a
 * white pad. Maps to .segmented.
 */
export function SegmentedControl({ options = [], value, onChange, className = "", ...rest }) {
  return (
    <div className={["segmented", className].filter(Boolean).join(" ")} role="tablist" {...rest}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={o.value === value}
          className={["seg-opt", o.value === value ? "on" : ""].join(" ")}
          onClick={() => onChange && onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
