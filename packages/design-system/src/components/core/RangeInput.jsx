import React from "react";

/**
 * GoCSM RangeInput — two number inputs reading "[from] and [to]" with a unit affix
 * ($ as prefix; d / % / min / users as suffix). The source of truth for a numeric
 * band (health score, MRR). An empty bound quietly degrades to at-least / at-most —
 * the consumer relabels the sentence. Slider is an optional companion (skippable v1).
 * Maps to .range-input.
 *
 * Controlled: `from` / `to` are numbers or null; `onChange({ from, to })` fires on edit.
 */
export function RangeInput({
  from = null,
  to = null,
  onChange,
  unit,
  min,
  max,
  className = "",
  ...rest
}) {
  const prefix = unit === "$" ? "$" : "";
  const suffix = unit && unit !== "$" ? unit : "";

  const parse = (s) => (s === "" || s == null ? null : Number(s));

  const affixPre = prefix ? <span className="ri-affix ri-pre">{prefix}</span> : null;
  const affixSuf = suffix ? <span className="ri-affix ri-suf">{suffix}</span> : null;

  return (
    <span className={["range-input", className].filter(Boolean).join(" ")} {...rest}>
      <span className="ri-cell">
        {affixPre}
        <input
          type="number"
          inputMode="decimal"
          className="ri-input"
          value={from == null ? "" : from}
          min={min}
          max={max}
          aria-label="from"
          onChange={(e) => onChange && onChange({ from: parse(e.target.value), to })}
        />
        {affixSuf}
      </span>
      <span className="ri-and">and</span>
      <span className="ri-cell">
        {affixPre}
        <input
          type="number"
          inputMode="decimal"
          className="ri-input"
          value={to == null ? "" : to}
          min={min}
          max={max}
          aria-label="to"
          onChange={(e) => onChange && onChange({ from, to: parse(e.target.value) })}
        />
        {affixSuf}
      </span>
    </span>
  );
}
