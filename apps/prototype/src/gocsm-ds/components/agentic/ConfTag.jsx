import React from "react";
import { Icon } from "../util/Icon.jsx";

/**
 * GoCSM ConfTag — the Confidence primitive. Labels a single AI claim's basis:
 * fact (confirmed, direct read) / projection (inferred, N days) / guess (early
 * signal — confirm before acting). Basis is encoded by icon + label, never
 * color alone. `detail` is REQUIRED for projection/guess, forbidden for fact.
 * Maps to .conf-tag in components.css.
 */
const ICON = { fact: "circle-check", projection: "chart-spline", guess: "help-circle" };
const WORD = { fact: "Confirmed", projection: "Projection", guess: "Early signal" };

export function ConfTag({ basis = "fact", detail, className = "", ...rest }) {
  return (
    <span className={["conf-tag", basis, className].filter(Boolean).join(" ")} {...rest}>
      <Icon name={ICON[basis]} style={{ width: 12, height: 12 }} />
      {WORD[basis]}
      {basis !== "fact" && detail ? ` · ${detail}` : ""}
    </span>
  );
}
