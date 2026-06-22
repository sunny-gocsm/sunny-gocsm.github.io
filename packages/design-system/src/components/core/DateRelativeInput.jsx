import React from "react";
import { SegmentedControl } from "./SegmentedControl.jsx";

/**
 * GoCSM DateRelativeInput — the relative-first date control. Reads as a sentence:
 * [verb] [number] [unit], e.g. "in the next 30 days" / "more than 21 days ago".
 * Verb is a SegmentedControl; quick-pick chips one-tap the common windows. No
 * calendar, no date math (relative is how our triggers actually work). Maps to
 * .date-rel.
 *
 * Controlled: `value = { verb, n, unit }`; `onChange(next)` fires on edit.
 */
const VERB_OPTIONS = [
  { value: "inNext", label: "in the next" },
  { value: "inLast", label: "in the last" },
  { value: "moreThanAgo", label: "more than" },
  { value: "within", label: "within" },
];
const UNIT_OPTIONS = ["days", "weeks", "months"];

export function DateRelativeInput({
  value = { verb: "inNext", n: 30, unit: "days" },
  onChange,
  quickPicks = [7, 30, 90],
  className = "",
  ...rest
}) {
  const v = value || { verb: "inNext", n: 30, unit: "days" };
  const set = (patch) => onChange && onChange({ ...v, ...patch });
  const agoTail = v.verb === "moreThanAgo";

  return (
    <span className={["date-rel", className].filter(Boolean).join(" ")} {...rest}>
      <SegmentedControl
        className="dr-verb"
        options={VERB_OPTIONS}
        value={v.verb}
        onChange={(verb) => set({ verb })}
      />
      <input
        type="number"
        inputMode="numeric"
        className="dr-n"
        min={1}
        value={v.n}
        aria-label="amount"
        onChange={(e) => set({ n: Number(e.target.value) })}
      />
      <select
        className="dr-unit"
        value={v.unit}
        aria-label="unit"
        onChange={(e) => set({ unit: e.target.value })}
      >
        {UNIT_OPTIONS.map((u) => (
          <option key={u} value={u}>
            {u}
          </option>
        ))}
      </select>
      {agoTail ? <span className="dr-ago">ago</span> : null}

      {quickPicks && quickPicks.length > 0 ? (
        <span className="dr-quick">
          {quickPicks.map((q) => (
            <button
              key={q}
              type="button"
              className={["dr-chip", v.n === q && v.unit === "days" ? "on" : ""].filter(Boolean).join(" ")}
              onClick={() => set({ n: q, unit: "days" })}
            >
              {q}d
            </button>
          ))}
        </span>
      ) : null}
    </span>
  );
}
