import React from "react";
import { Icon } from "../util/Icon.jsx";

/**
 * GoCSM FilterChip — a presentational field·operator·value pill shell for criteria /
 * filter builders. The DS owns the chip container, the bold field label, and the
 * remove affordance; consumers compose the operator/value editors as children
 * (Linear's "field locked, params editable" pattern). Maps to .filter-chip in
 * components-v3-additions.css.
 */
export function FilterChip({ label, onRemove, removeLabel, children, className = "", ...rest }) {
  return (
    <div className={["filter-chip", className].filter(Boolean).join(" ")} {...rest}>
      {label != null ? <span className="fc-label">{label}</span> : null}
      {children}
      {onRemove ? (
        <button type="button" className="fc-remove" onClick={onRemove} aria-label={removeLabel || "Remove filter"}>
          <Icon name="x" />
        </button>
      ) : null}
    </div>
  );
}
