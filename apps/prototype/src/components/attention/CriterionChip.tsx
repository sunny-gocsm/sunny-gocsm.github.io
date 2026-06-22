import { useMemo, useState } from "react";
import { FilterChip, SegmentedControl, RangeInput, DateRelativeInput, MultiSelectCombobox } from "@gocsm/design-system";
import {
  fieldById,
  opsFor,
  OP_LABEL,
  bandLabelShort,
  type Operator,
  type FieldDef,
  type DateRelValue,
} from "@/fixtures/criteriaCatalog";
import type { Criterion, CriterionValue } from "@/fixtures/criteriaMatch";
import type { HealthBand } from "@/fixtures";

// CriterionChip — one field→operator→value rule as an editable sentence-chip (§5).
// The FIELD is the committed interpretation (locked label); the OPERATOR is a plain word
// (tap to change, auto-pluralizing, never a symbol); the VALUE is a typed control. The
// FilterChip shell is the DS; the typed editors compose inside it.

const BANDS: HealthBand[] = ["atrisk", "watch", "healthy", "thriving"];
const COMBOBOX_THRESHOLD = 7; // enum sets larger than this use the searchable combobox

// ---- defaults so every fresh condition is already a valid, sensible sentence ----
export function defaultValueFor(f: FieldDef, op: Operator): CriterionValue {
  switch (op) {
    case "between":
      return f.type === "score" ? [0, 60] : f.type === "money" ? [500, 2000] : [0, 30];
    case "isAnyOf":
    case "isNoneOf":
      return f.type === "band" ? ["atrisk"] : f.options ? [f.options()[0]] : [];
    case "is":
      if (f.type === "boolean") return true;
      return f.type === "band" ? "atrisk" : f.options ? f.options()[0] : "";
    case "isNot":
      return f.type === "band" ? "atrisk" : f.options ? f.options()[0] : "";
    case "contains":
    case "startsWith":
      return "";
    case "inNext":
      return { verb: "inNext", n: 30, unit: "days" } as DateRelValue;
    case "inLast":
      return { verb: "inLast", n: 90, unit: "days" } as DateRelValue;
    case "moreThanAgo":
      return { verb: "moreThanAgo", n: 21, unit: "days" } as DateRelValue;
    case "within":
      return { verb: "within", n: 30, unit: "days" } as DateRelValue;
    case "falling":
    case "rising":
      return undefined;
    default:
      // numeric thresholds — sensible per field
      return f.id === "engagement.lastLoginDays" || f.id === "user.idleDays"
        ? 21
        : f.type === "money"
          ? 1500
          : f.type === "score"
            ? 60
            : f.type === "number"
              ? 1
              : 0;
  }
}

export function makeCriterion(fieldId: string, id: string): Criterion {
  const f = fieldById(fieldId)!;
  const op = opsFor(f)[0];
  return { id, fieldId, op, value: defaultValueFor(f, op) };
}

// ---- plain-word operator that auto-pluralizes / relabels at the edge ----
function opLabelFor(c: Criterion, f: FieldDef): string {
  // Range with an empty bound degrades to at-least / at-most.
  if (c.op === "between" && Array.isArray(c.value)) {
    const [lo, hi] = c.value as [number | null, number | null];
    if (lo == null && hi != null) return OP_LABEL.lte; // is at most
    if (hi == null && lo != null) return OP_LABEL.gte; // is at least
  }
  return OP_LABEL[c.op];
}

// numeric input that survives partial edits ("" / "-")
function NumberInput({ value, unit, onChange }: { value: number; unit?: string; onChange: (n: number) => void }) {
  const pre = unit === "$" ? "$" : "";
  const suf = unit && unit !== "$" ? unit : "";
  return (
    <span className="crit-num">
      {pre ? <span className="crit-unit">{pre}</span> : null}
      <input
        type="number"
        inputMode="decimal"
        className="crit-input"
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      {suf ? <span className="crit-unit">{suf}</span> : null}
    </span>
  );
}

// text input with native-datalist autocomplete from real values
function TextInput({
  value,
  options,
  onChange,
}: {
  value: string;
  options: string[];
  onChange: (s: string) => void;
}) {
  const listId = useMemo(() => `crit-dl-${Math.random().toString(36).slice(2, 8)}`, []);
  return (
    <>
      <input
        className="crit-input crit-text"
        list={listId}
        value={value}
        placeholder="e.g. Acme"
        onChange={(e) => onChange(e.target.value)}
      />
      <datalist id={listId}>
        {options.slice(0, 50).map((o) => (
          <option key={o} value={o} />
        ))}
      </datalist>
    </>
  );
}

export function CriterionChip({
  criterion,
  onChange,
  onRemove,
}: {
  criterion: Criterion;
  onChange: (c: Criterion) => void;
  onRemove: () => void;
}) {
  const f = fieldById(criterion.fieldId);
  const [opOpen, setOpOpen] = useState(false);
  if (!f) return null;
  const ops = opsFor(f);

  const setOp = (op: Operator) => {
    onChange({ ...criterion, op, value: defaultValueFor(f, op) });
    setOpOpen(false);
  };
  const setValue = (value: CriterionValue) => onChange({ ...criterion, value });

  const toggleInArray = (v: string) => {
    const arr = Array.isArray(criterion.value) ? (criterion.value as string[]).slice() : [];
    const i = arr.indexOf(v);
    if (i >= 0) arr.splice(i, 1);
    else arr.push(v);
    setValue(arr.length ? arr : [v]); // never empty
  };

  // ---- operator surface: a tappable plain word (popover of options) ----
  const operatorEl =
    ops.length > 1 ? (
      <span className="crit-op-wrap">
        <button type="button" className="crit-op-btn" onClick={() => setOpOpen((o) => !o)} aria-haspopup="listbox" aria-expanded={opOpen}>
          {opLabelFor(criterion, f)}
        </button>
        {opOpen ? (
          <span className="crit-op-pop" role="listbox">
            {ops.map((op) => (
              <button
                key={op}
                type="button"
                role="option"
                aria-selected={op === criterion.op}
                className={["crit-op-opt", op === criterion.op ? "on" : ""].join(" ")}
                onClick={() => setOp(op)}
              >
                {OP_LABEL[op]}
              </button>
            ))}
          </span>
        ) : null}
      </span>
    ) : (
      <span className="crit-op">{opLabelFor(criterion, f)}</span>
    );

  // ---- value control by type/op ----
  let valueEl: React.ReactNode = null;

  if (f.type === "trendDir") {
    valueEl = null; // operator carries the meaning ("is falling")
  } else if (f.type === "boolean") {
    const yes = criterion.value === true || criterion.value === "true";
    valueEl = (
      <SegmentedControl
        className="crit-bool"
        options={[
          { value: "yes", label: "Yes" },
          { value: "no", label: "No" },
        ]}
        value={yes ? "yes" : "no"}
        onChange={(v: string) => setValue(v === "yes")}
      />
    );
  } else if (f.type === "dateRelative") {
    valueEl = (
      <DateRelativeInput
        value={(criterion.value as DateRelValue) ?? { verb: "inNext", n: 30, unit: "days" }}
        onChange={(dv) => onChange({ ...criterion, op: dv.verb as Operator, value: dv })}
      />
    );
  } else if (criterion.op === "between") {
    const [lo, hi] = (criterion.value as [number | null, number | null]) ?? [null, null];
    valueEl = (
      <RangeInput
        from={lo}
        to={hi}
        unit={f.unit as "$" | "%" | "d" | "min" | "users" | undefined}
        onChange={({ from, to }) => setValue([from, to] as unknown as CriterionValue)}
      />
    );
  } else if (criterion.op === "contains" || criterion.op === "startsWith" || criterion.op === "is" || criterion.op === "isNot") {
    // enum/band/text single-value paths
    if (f.type === "band") {
      valueEl = (
        <span className="crit-bands">
          {BANDS.map((b) => {
            const on = String(criterion.value) === b;
            return (
              <button key={b} type="button" className={["crit-band", on ? "on" : ""].join(" ")} onClick={() => setValue(b)} aria-pressed={on}>
                {bandLabelShort(b)}
              </button>
            );
          })}
        </span>
      );
    } else if (f.id === "account.name") {
      valueEl = <TextInput value={String(criterion.value ?? "")} options={f.options?.() ?? []} onChange={setValue} />;
    } else if (f.type === "enum") {
      const opts = f.options?.() ?? [];
      valueEl = (
        <SegmentedControl
          className="crit-enum-seg"
          options={opts.map((o) => ({ value: o, label: o }))}
          value={String(criterion.value ?? opts[0] ?? "")}
          onChange={(v: string) => setValue(v)}
        />
      );
    } else {
      valueEl = <TextInput value={String(criterion.value ?? "")} options={[]} onChange={setValue} />;
    }
  } else if (criterion.op === "isAnyOf" || criterion.op === "isNoneOf") {
    if (f.type === "band") {
      valueEl = (
        <span className="crit-bands">
          {BANDS.map((b) => {
            const on = Array.isArray(criterion.value) && (criterion.value as string[]).includes(b);
            return (
              <button key={b} type="button" className={["crit-band", on ? "on" : ""].join(" ")} onClick={() => toggleInArray(b)} aria-pressed={on}>
                {bandLabelShort(b)}
              </button>
            );
          })}
        </span>
      );
    } else {
      const opts = f.options?.() ?? [];
      if (opts.length > COMBOBOX_THRESHOLD) {
        valueEl = (
          <MultiSelectCombobox
            options={opts}
            selected={Array.isArray(criterion.value) ? (criterion.value as string[]) : []}
            onChange={(next) => setValue(next.length ? next : [opts[0]])}
            placeholder="Search…"
          />
        );
      } else {
        valueEl = (
          <span className="crit-bands">
            {opts.map((o) => {
              const on = Array.isArray(criterion.value) && (criterion.value as string[]).includes(o);
              return (
                <button key={o} type="button" className={["crit-band", on ? "on" : ""].join(" ")} onClick={() => toggleInArray(o)} aria-pressed={on}>
                  {o}
                </button>
              );
            })}
          </span>
        );
      }
    }
  } else {
    // single numeric threshold (gt/lt/gte/lte/eq)
    valueEl = <NumberInput value={typeof criterion.value === "number" ? criterion.value : 0} unit={f.unit} onChange={setValue} />;
  }

  return (
    <FilterChip label={f.label} onRemove={onRemove} removeLabel={`Remove ${f.label}`}>
      {operatorEl}
      {valueEl}
    </FilterChip>
  );
}
