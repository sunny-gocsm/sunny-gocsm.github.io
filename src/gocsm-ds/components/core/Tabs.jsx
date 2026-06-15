import React from "react";

/**
 * GoCSM Tabs — the live page tab row (Overview / Sub-Accounts / Configure,
 * or the Account Health Hub lens switcher). Underline-active, blue. Maps to
 * .tabs / .tab in components.css.
 */
export function Tabs({ tabs = [], active, onChange, className = "" }) {
  return (
    <div className={["tabs", className].filter(Boolean).join(" ")} role="tablist">
      {tabs.map((t) => {
        const id = typeof t === "string" ? t : t.id;
        const label = typeof t === "string" ? t : t.label;
        return (
          <button
            key={id}
            role="tab"
            aria-selected={active === id}
            onClick={() => onChange && onChange(id)}
            className={["tab", active === id ? "active" : ""].filter(Boolean).join(" ")}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
