import React from "react";

/**
 * GoCSM Input / Field — 36px text control with label + hint. Renders an
 * <input>, <textarea>, or <select> per `as`. Maps to .input/.textarea/.select
 * + .label/.hint/.field in components.css.
 */
export function Field({ label, hint, htmlFor, className = "", children }) {
  return (
    <div className={["field", className].filter(Boolean).join(" ")}>
      {label && <label className="label" htmlFor={htmlFor}>{label}</label>}
      {children}
      {hint && <div className="hint">{hint}</div>}
    </div>
  );
}

export function Input({ as = "input", className = "", children, ...rest }) {
  if (as === "textarea") {
    return <textarea className={["textarea", className].filter(Boolean).join(" ")} {...rest} />;
  }
  if (as === "select") {
    return (
      <select className={["select", className].filter(Boolean).join(" ")} {...rest}>
        {children}
      </select>
    );
  }
  return <input className={["input", className].filter(Boolean).join(" ")} {...rest} />;
}
