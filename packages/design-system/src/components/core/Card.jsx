import React from "react";

/**
 * GoCSM Card — the neutral in-flow surface. Resting elevation only
 * (--sh-rest); never --sh-sheet (that's for floating surfaces). Flat-on-flat
 * is forbidden — a card always has its surface + resting shadow.
 * Maps to .card / .card-hover / .card-padded.
 */
export function Card({ hover = false, padded = true, className = "", children, ...rest }) {
  return (
    <div
      className={[
        "card",
        hover ? "card-hover" : "",
        padded ? "card-padded" : "",
        className,
      ].filter(Boolean).join(" ")}
      {...rest}
    >
      {children}
    </div>
  );
}
