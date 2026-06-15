import React from "react";

/**
 * GoCSM Checkbox — 16px square, blue when checked. A controlled wrapper over
 * the native checkbox styled by .chk. Optional inline label.
 */
export function Checkbox({ label, className = "", id, ...rest }) {
  const input = (
    <input type="checkbox" className={["chk", className].filter(Boolean).join(" ")} id={id} {...rest} />
  );
  if (!label) return input;
  return (
    <label htmlFor={id} style={{ display: "inline-flex", alignItems: "center", gap: "var(--s-2)", cursor: "pointer", fontSize: "var(--t-body-sm)" }}>
      {input}
      <span>{label}</span>
    </label>
  );
}
