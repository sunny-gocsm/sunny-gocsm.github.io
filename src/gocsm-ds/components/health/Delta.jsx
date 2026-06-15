import React from "react";

/**
 * GoCSM Delta — the one trend-chip format. Direction is encoded by BOTH arrow
 * and color, never color alone. For inverted metrics (churn, cost, dormant),
 * use "bad-up" / "good-down" so a worse number reads red even when it rose.
 * Maps to .delta + direction class.
 */
export function Delta({ value, direction = "up", context, className = "", ...rest }) {
  const dirClass = {
    up: "delta-up",
    down: "delta-down",
    flat: "delta-flat",
    "bad-up": "delta-bad-up",
    "good-down": "delta-good-down",
  }[direction] || "delta-up";
  return (
    <span className={["delta", dirClass, className].filter(Boolean).join(" ")} {...rest}>
      {value}
      {context && <span className="ctx">{context}</span>}
    </span>
  );
}
