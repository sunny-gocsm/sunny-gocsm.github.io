import { useMemo, useState, type CSSProperties } from "react";
import { Icon, Mono, VideoCard } from "@gocsm/design-system";
import { CriteriaBuilder } from "./CriteriaBuilder";
import { fieldById } from "@/fixtures/criteriaCatalog";
import {
  normalize,
  matchCount,
  describeSet,
  nodesOf,
  isGroup,
  type CriteriaSet,
  type Criterion,
} from "@/fixtures/criteriaMatch";

// TriggerStep — the redesigned "When & who it runs on" step (design-loop, 2026-06-23).
// Research convergence (Customer.io, Intercom, HubSpot, Salesforce, Gainsight, Linear,
// Notion, NN/g): the trigger is a FACT the user CONFIRMS, narrowing is ONE optional set of
// labeled dropdowns that default to "all", and a live audience count builds accept-and-publish
// confidence. The busy default (NL box + suggestion pills + restatement + full pill builder +
// accounts pane) is cut; the full builder survives only behind "Customize (advanced)".
// The "two identical pill levels" bug is fixed by REMOVING the second pill: the field is the
// dropdown's label, so the user only ever touches the value.

let cc = 0;
const crit = (fieldId: string, op: Criterion["op"], value?: Criterion["value"]): Criterion => ({
  id: `trg${++cc}`,
  fieldId,
  op,
  value,
});

const leavesOf = (s: CriteriaSet): Criterion[] =>
  nodesOf(s).flatMap((nd) => (isGroup(nd) ? nd.criteria : [nd]));

const selStyle: CSSProperties = {
  appearance: "auto",
  fontSize: "var(--t-body)",
  fontWeight: 600,
  color: "var(--text)",
  background: "var(--surface, #fff)",
  border: "1px solid var(--border)",
  borderRadius: "var(--r-sm, 8px)",
  padding: "var(--s-2) var(--s-3)",
  cursor: "pointer",
  minWidth: 180,
};

export function TriggerStep({
  baseTrigger,
  triggerText,
  set,
  onChange,
}: {
  baseTrigger: CriteriaSet;
  triggerText: string;
  set: CriteriaSet;
  onChange: (s: CriteriaSet) => void;
}) {
  const [mrr, setMrr] = useState<"all" | "1500" | "3000">("all");
  const [plan, setPlan] = useState<string>("all");
  const [advanced, setAdvanced] = useState(false);
  const [help, setHelp] = useState(false);

  const planOptions = useMemo<string[]>(() => {
    const f = fieldById("revenue.plan");
    return f?.options ? (f.options() as string[]) : [];
  }, []);

  const base = useMemo(() => leavesOf(baseTrigger), [baseTrigger]);

  // Rebuild the full set = baked-in trigger AND the chosen narrowers, and push it up.
  const apply = (nextMrr: typeof mrr, nextPlan: string) => {
    const narrowers: Criterion[] = [];
    if (nextMrr !== "all") narrowers.push(crit("revenue.mrr", "gte", Number(nextMrr)));
    if (nextPlan !== "all") narrowers.push(crit("revenue.plan", "isAnyOf", [nextPlan]));
    onChange(normalize({ match: "all", criteria: [...base, ...narrowers] }));
  };

  // In the simple view, the live count derives from base + current narrowers; in advanced,
  // it reflects whatever the builder currently holds.
  const n = advanced ? matchCount(set) : matchCount(normalize({ match: "all", criteria: [
    ...base,
    ...(mrr !== "all" ? [crit("revenue.mrr", "gte", Number(mrr))] : []),
    ...(plan !== "all" ? [crit("revenue.plan", "isAnyOf", [plan])] : []),
  ] }));

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", display: "flex", flexDirection: "column", gap: "var(--s-4)" }}>
      {/* Block A — the trigger, as a fact you confirm (read-only). */}
      <div style={{ display: "flex", gap: "var(--s-3)", alignItems: "flex-start", padding: "var(--s-4)", borderRadius: "var(--r-lg, 14px)", background: "var(--surface-2, #f7f9fc)", border: "1px solid var(--border)" }}>
        <span aria-hidden style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: "999px", background: "var(--blue-1, #eef3fc)", color: "var(--blue-7, #1558c0)" }}>
          <Icon name="zap" />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: "block", fontSize: "var(--t-caption)", textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--text-3, var(--text))", fontWeight: 600 }}>
            Runs automatically when
          </span>
          <p style={{ margin: "2px 0 0", fontSize: "var(--t-body-lg)", fontWeight: 600, color: "var(--text)", lineHeight: 1.3 }}>{triggerText}</p>
          <button
            type="button"
            onClick={() => setHelp((h) => !h)}
            style={{ marginTop: "var(--s-2)", border: 0, background: "transparent", padding: 0, cursor: "pointer", fontSize: "var(--t-body-sm)", color: "var(--blue-7, #1558c0)", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}
          >
            <Icon name="play-circle" /> {help ? "Hide" : "How triggers work"}
          </button>
          {help ? (
            <div style={{ marginTop: "var(--s-2)", maxWidth: 360 }}>
              {/* Demoted from a hero block to a small on-demand clip. */}
              <VideoCard title="How triggers work" duration="1 min" />
            </div>
          ) : null}
        </div>
      </div>

      {!advanced ? (
        <>
          {/* Block B — ONE optional narrowing, labeled controls defaulting to "all". */}
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-3)" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ fontSize: "var(--t-subheading)", fontWeight: 700 }}>Only run it for…</span>
              <span style={{ fontSize: "var(--t-body-sm)", color: "var(--text-3, var(--text))" }}>Optional — leave on “all” to run on every account that matches.</span>
            </div>
            <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--s-3)", flexWrap: "wrap" }}>
              <span style={{ fontSize: "var(--t-body)", color: "var(--text-2, var(--text))" }}>Account value</span>
              <select style={selStyle} value={mrr} onChange={(e) => { const v = e.target.value as typeof mrr; setMrr(v); apply(v, plan); }}>
                <option value="all">All accounts</option>
                <option value="1500">Paying $1,500+/mo</option>
                <option value="3000">Paying $3,000+/mo</option>
              </select>
            </label>
            {planOptions.length > 0 ? (
              <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--s-3)", flexWrap: "wrap" }}>
                <span style={{ fontSize: "var(--t-body)", color: "var(--text-2, var(--text))" }}>Plan</span>
                <select style={selStyle} value={plan} onChange={(e) => { const v = e.target.value; setPlan(v); apply(mrr, v); }}>
                  <option value="all">All plans</option>
                  {planOptions.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </label>
            ) : null}
          </div>

          {/* Live audience count — the accept-and-publish confidence builder (Pattern 1). */}
          <div style={{ display: "flex", alignItems: "baseline", gap: "var(--s-2)", padding: "var(--s-3) var(--s-4)", borderRadius: "var(--r-md, 10px)", background: "var(--blue-1, #eef3fc)" }}>
            <Mono style={{ fontSize: "var(--t-display-lg)", fontWeight: 750, color: "var(--blue-7, #1558c0)" }}>{n}</Mono>
            <span style={{ fontSize: "var(--t-body)", color: "var(--text-2, var(--text))" }}>of your accounts match right now.</span>
          </div>
        </>
      ) : (
        /* The full rule builder — for the rare power case only. */
        <CriteriaBuilder set={set} onChange={onChange} />
      )}

      <button
        type="button"
        onClick={() => setAdvanced((a) => !a)}
        style={{ alignSelf: "flex-start", border: 0, background: "transparent", padding: 0, cursor: "pointer", fontSize: "var(--t-body-sm)", color: "var(--text-3, var(--text))", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}
      >
        <Icon name={advanced ? "chevron-up" : "sliders"} /> {advanced ? "Back to simple" : "Customize trigger (advanced)"}
      </button>
    </div>
  );
}
