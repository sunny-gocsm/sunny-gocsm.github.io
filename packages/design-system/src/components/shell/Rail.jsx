import React from "react";
import { Icon } from "../util/Icon.jsx";

/**
 * GoCSM Rail — the standard 244px app sidebar (§8.3). Logo top-left, then the
 * four nav groups (Insights / Configurations / Resources / HighLevel CRM). The
 * brand stripe sits above the page content, not in the rail. Active item uses
 * the interactive blue (never a health color). Maps to .rail / .rail-item.
 *
 * groups: [{ label, items: [{ id, label, icon }] }]
 */
export function Rail({ groups = [], active, onNavigate, logo, className = "", ...rest }) {
  return (
    <nav className={["rail", className].filter(Boolean).join(" ")} {...rest}>
      <div style={{ padding: "var(--s-4) var(--s-3) var(--s-2)" }}>{logo}</div>
      <div style={{ overflowY: "auto", flex: 1 }}>
        {groups.map((g, gi) => (
          <div className="rail-group" key={gi}>
            {g.label && <div className="rail-group-head">{g.label}</div>}
            {g.items.map((it) => (
              <div
                key={it.id}
                className={["rail-item", active === it.id ? "active" : ""].filter(Boolean).join(" ")}
                onClick={() => onNavigate && onNavigate(it.id)}
              >
                {it.icon && <Icon name={it.icon} />}
                <span>{it.label}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </nav>
  );
}
