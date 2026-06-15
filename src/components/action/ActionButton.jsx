import React from "react";
import { Icon } from "../util/Icon.jsx";
import { Button } from "../core/Button.jsx";
/**
 * ActionButton — the action-layer usage of the core Button: exactly one primary verb
 * per card, sentence case. `overflow` renders the icon-only "…" so a card keeps one action.
 * Composes Button. Never "Trigger workflow"/"View" on a primary surface (Evidence-only).
 */
export function ActionButton({ variant = "primary", size = "md", icon = null, children, ...rest }) {
  if (variant === "overflow") {
    return (
      <button type="button" className="icon-btn" aria-label="More actions" {...rest}>
        <Icon name="more-horizontal" />
      </button>
    );
  }
  const iconNode = icon ? <Icon name={icon} /> : null;
  return (
    <Button variant={variant} size={size} icon={iconNode} {...rest}>
      {children}
    </Button>
  );
}
