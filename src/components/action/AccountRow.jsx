import React from "react";
import { Monogram } from "../core/Monogram.jsx";
import { HealthBadge } from "../health/HealthBadge.jsx";
import { Mono } from "../util/Mono.jsx";

/**
 * GoCSM AccountRow — one account in a scannable list: monogram (identity) → health
 * pill (named tier, never a bare dot) → full name (ellipsis only if truly clipped) →
 * right-aligned value in tabular figures. Rows give the name the full width, so names
 * never truncate the way a tile grid forces. `muted` renders the forecast/ghost variant
 * (dashed, faded); `trailing` slots a badge (e.g. a "~3 days" horizon). Maps to .account-row.
 */
export function AccountRow({
  name,
  band,
  bandLabel,
  value,
  meta,
  trailing,
  muted = false,
  onClick,
  className = "",
  ...rest
}) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      className={["account-row", muted ? "muted" : "", className].filter(Boolean).join(" ")}
      onClick={onClick}
      {...rest}
    >
      <Monogram name={name} size={28} />
      {band ? <HealthBadge band={band} label={bandLabel} /> : null}
      <span className="ar-name" title={typeof name === "string" ? name : undefined}>{name}</span>
      {meta != null ? <span className="ar-meta">{meta}</span> : null}
      {trailing != null ? <span className="ar-trailing">{trailing}</span> : null}
      {value != null ? <span className="ar-value"><Mono>{value}</Mono></span> : null}
    </Tag>
  );
}
