import React from "react";
import { Monogram } from "../core/Monogram.jsx";
import { Icon } from "../util/Icon.jsx";
import { Mono } from "../util/Mono.jsx";

/**
 * GoCSM EventRow — one line in an audit log / activity feed: a timestamp, the account
 * (monogram + name), the action that fired (icon), a plain-language summary, a colored
 * status chip (worked / no change / didn't land / in progress), and a right-aligned $ value.
 * Single-line and scannable for long logs. Maps to .event-row.
 */
export function EventRow({
  time,
  name,
  actionIcon,
  actionLabel,
  summary,
  status,
  statusTone = "neutral",
  value,
  hideName = false,
  onClick,
  className = "",
  ...rest
}) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      className={["event-row", onClick ? "clickable" : "", className].filter(Boolean).join(" ")}
      onClick={onClick}
      {...rest}
    >
      <span className="er-time">{time}</span>
      {hideName ? null : <Monogram name={name} size={26} />}
      <span className="er-body">
        {hideName ? null : <span className="er-name">{name}</span>}
        {actionIcon ? (
          <span className="er-action" title={typeof actionLabel === "string" ? actionLabel : undefined} aria-hidden>
            <Icon name={actionIcon} />
          </span>
        ) : null}
        <span className="er-summary">{summary}</span>
      </span>
      {status != null ? <span className={["er-status", `tone-${statusTone}`].join(" ")}>{status}</span> : null}
      {value != null ? <span className="er-value"><Mono>{value}</Mono></span> : null}
    </Tag>
  );
}
