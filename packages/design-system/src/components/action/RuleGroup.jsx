import React from "react";
import { Icon } from "../util/Icon.jsx";
import { SegmentedControl } from "../core/SegmentedControl.jsx";

/**
 * GoCSM RuleGroup — the Advanced-mode nested-group card. A bordered chunk with its
 * own Match all|any SegmentedControl in the header and a footer to add conditions
 * (and, at top level, groups). One level of nesting only — never a typed boolean
 * string. The restatement renders the parentheses in English so the text stays
 * simple even when the logic is complex. Maps to .rule-group.
 *
 * Composition: conditions render as `children`. The header label is optional
 * (e.g. "Group", or the top-level join row).
 */
const MATCH_OPTIONS = [
  { value: "all", label: "all" },
  { value: "any", label: "any" },
];

export function RuleGroup({
  match = "all",
  onMatchChange,
  children,
  onAddCondition,
  onAddGroup,
  removable = false,
  onRemove,
  label = "Group",
  variant = "group", // "group" (bordered card) | "bare" (top-level chrome)
  addConditionLabel = "Add condition",
  addGroupLabel = "Add group",
  className = "",
  ...rest
}) {
  return (
    <div className={["rule-group", `rg-${variant}`, className].filter(Boolean).join(" ")} {...rest}>
      <div className="rg-head">
        <div className="rg-match">
          {label ? <span className="rg-label">{label}</span> : null}
          <span className="rg-match-lead">match</span>
          <SegmentedControl options={MATCH_OPTIONS} value={match} onChange={onMatchChange} />
        </div>
        {removable ? (
          <button type="button" className="rg-remove" onClick={onRemove} aria-label="Remove group">
            <Icon name="trash-2" />
          </button>
        ) : null}
      </div>

      <div className="rg-body">{children}</div>

      <div className="rg-foot">
        {onAddCondition ? (
          <button type="button" className="rg-add" onClick={onAddCondition}>
            <Icon name="plus" /> {addConditionLabel}
          </button>
        ) : null}
        {onAddGroup ? (
          <button type="button" className="rg-add rg-add-group" onClick={onAddGroup}>
            <Icon name="square-stack" /> {addGroupLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}
