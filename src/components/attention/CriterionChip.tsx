import { Icon } from "@/gocsm-ds";
import {
  fieldById,
  opsFor,
  OP_LABEL,
  bandLabelShort,
  type Operator,
  type FieldDef,
} from "@/fixtures/criteriaCatalog";
import type { Criterion, CriterionValue } from "@/fixtures/criteriaMatch";
import type { HealthBand } from "@/fixtures";

// CriterionChip — one field→operator→value rule as an editable pill. The FIELD is the
// committed interpretation (locked, shown as text); the OPERATOR and VALUE are freely
// editable (Linear's partial-editability pattern). Native controls keep it simple,
// accessible, and obvious for the persona. DS-bound; prototyped in the app.

const BANDS: HealthBand[] = ["atrisk", "watch", "healthy", "thriving"];

export function defaultValueFor(f: FieldDef, op: Operator): CriterionValue {
  switch (op) {
    case "between":
      return f.type === "days" ? [0, 30] : f.type === "money" ? [500, 2000] : [40, 60];
    case "isAnyOf":
      return f.type === "band" ? ["atrisk"] : f.options ? [f.options()[0]] : [];
    case "falling":
    case "rising":
      return undefined;
    case "is":
    case "isNot":
      return f.type === "band" ? "atrisk" : f.options ? f.options()[0] : "";
    default:
      return f.type === "days" ? 14 : f.type === "money" ? 1000 : f.type === "score" ? 50 : 0;
  }
}

export function makeCriterion(fieldId: string, id: string): Criterion {
  const f = fieldById(fieldId)!;
  const op = opsFor(f)[0];
  return { id, fieldId, op, value: defaultValueFor(f, op) };
}

function NumberInput({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <input
      type="number"
      className="crit-input"
      value={Number.isFinite(value) ? value : 0}
      onChange={(e) => onChange(Number(e.target.value))}
    />
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
  if (!f) return null;
  const ops = opsFor(f);

  const setOp = (op: Operator) => onChange({ ...criterion, op, value: defaultValueFor(f, op) });
  const setValue = (value: CriterionValue) => onChange({ ...criterion, value });

  const toggleInArray = (v: string) => {
    const arr = Array.isArray(criterion.value) ? (criterion.value as string[]).slice() : [];
    const i = arr.indexOf(v);
    if (i >= 0) arr.splice(i, 1);
    else arr.push(v);
    setValue(arr.length ? arr : [v]); // never empty
  };

  return (
    <div className="crit-chip">
      <span className="crit-field">{f.label}</span>

      {/* operator */}
      {ops.length > 1 ? (
        <select className="crit-select" value={criterion.op} onChange={(e) => setOp(e.target.value as Operator)} aria-label="operator">
          {ops.map((op) => (
            <option key={op} value={op}>
              {OP_LABEL[op]}
            </option>
          ))}
        </select>
      ) : (
        <span className="crit-op">{OP_LABEL[criterion.op]}</span>
      )}

      {/* value editor by type/op */}
      {criterion.op === "between" ? (
        <span className="crit-vals">
          <NumberInput value={(criterion.value as number[])?.[0] ?? 0} onChange={(n) => setValue([n, (criterion.value as number[])?.[1] ?? n])} />
          <span className="crit-dash">–</span>
          <NumberInput value={(criterion.value as number[])?.[1] ?? 0} onChange={(n) => setValue([(criterion.value as number[])?.[0] ?? 0, n])} />
          {f.unit === "days" ? <span className="crit-unit">d</span> : null}
        </span>
      ) : criterion.op === "falling" || criterion.op === "rising" ? null : f.type === "band" ? (
        <span className="crit-bands">
          {BANDS.map((b) => {
            const on = Array.isArray(criterion.value) && (criterion.value as string[]).includes(b);
            return (
              <button key={b} type="button" className={["crit-band", on ? "on" : ""].join(" ")} onClick={() => (criterion.op === "isAnyOf" ? toggleInArray(b) : setValue(b))} aria-pressed={on}>
                {bandLabelShort(b)}
              </button>
            );
          })}
        </span>
      ) : f.type === "enum" ? (
        criterion.op === "isAnyOf" ? (
          <span className="crit-bands">
            {(f.options?.() ?? []).map((o) => {
              const on = Array.isArray(criterion.value) && (criterion.value as string[]).includes(o);
              return (
                <button key={o} type="button" className={["crit-band", on ? "on" : ""].join(" ")} onClick={() => toggleInArray(o)} aria-pressed={on}>
                  {o}
                </button>
              );
            })}
          </span>
        ) : (
          <select className="crit-select" value={String(criterion.value ?? "")} onChange={(e) => setValue(e.target.value)} aria-label="value">
            {(f.options?.() ?? []).map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        )
      ) : (
        <span className="crit-vals">
          <NumberInput value={typeof criterion.value === "number" ? criterion.value : 0} onChange={setValue} />
          {f.unit === "$" ? <span className="crit-unit">$</span> : f.unit === "days" ? <span className="crit-unit">d</span> : f.unit === "%" ? <span className="crit-unit">%</span> : null}
        </span>
      )}

      <button type="button" className="crit-remove" onClick={onRemove} aria-label={`Remove ${f.label}`}>
        <Icon name="x" />
      </button>
    </div>
  );
}
