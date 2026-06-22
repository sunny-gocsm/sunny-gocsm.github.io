import React from "react";
import { Icon } from "../util/Icon.jsx";

/**
 * GoCSM PromptField — the AI / natural-language prompt input. A deliberately
 * INVITING field (soft-blue tint, visible border + focus ring, a prominent accent
 * sparkle, a darker placeholder, and a clear submit action) so the "describe it"
 * affordance reads as a first-class hero input — never a faint white box that
 * disappears into the canvas. Maps to .prompt-field in components-v3-additions.css.
 *
 * Controlled: pass `value` + `onValueChange(text)`; `onSubmit` fires on the button
 * and on Enter.
 */
export function PromptField({
  value = "",
  onValueChange,
  onSubmit,
  placeholder = "Describe it…",
  submitLabel = "Build",
  icon = "sparkles",
  className = "",
  ...rest
}) {
  return (
    <div className={["prompt-field", className].filter(Boolean).join(" ")} {...rest}>
      <span className="pf-ico" aria-hidden><Icon name={icon} /></span>
      <input
        className="pf-input"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onValueChange && onValueChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && onSubmit) onSubmit(); }}
      />
      {onSubmit ? (
        <button type="button" className="pf-submit" onClick={onSubmit}>{submitLabel}</button>
      ) : null}
    </div>
  );
}
