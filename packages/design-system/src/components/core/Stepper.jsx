import React from "react";
import { Icon } from "../util/Icon.jsx";

/**
 * GoCSM Stepper — a discrete, labeled horizontal progress indicator for fixed
 * multi-step flows (3–4 steps). States (Carbon/Atlassian vocabulary): done = filled
 * check, clickable to revisit; current = solid focal fill, exactly one; upcoming =
 * muted outline, locked. Connector lines fill as steps complete. Maps to .stepper.
 *
 * `steps`: [{ label }]; `current`: index of the current step; `onStepClick(i)` makes
 * already-completed steps clickable (sequential order is enforced — upcoming are inert).
 */
export function Stepper({ steps = [], current = 0, onStepClick, className = "", ...rest }) {
  return (
    <ol className={["stepper", className].filter(Boolean).join(" ")} {...rest}>
      {steps.map((s, i) => {
        const status = i < current ? "done" : i === current ? "current" : "upcoming";
        const clickable = status === "done" && typeof onStepClick === "function";
        return (
          <li key={i} className={["step", status].join(" ")}>
            <button
              type="button"
              className="step-btn"
              disabled={!clickable}
              aria-current={status === "current" ? "step" : undefined}
              onClick={() => clickable && onStepClick(i)}
            >
              <span className="step-marker">{status === "done" ? <Icon name="check" /> : i + 1}</span>
              <span className="step-label">{s.label}</span>
            </button>
            {i < steps.length - 1 ? <span className="step-line" aria-hidden /> : null}
          </li>
        );
      })}
    </ol>
  );
}
