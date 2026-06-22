import { useState } from "react";
import { Button, Icon, Card, PromptField } from "@gocsm/design-system";
import { MatchWall } from "./MatchWall";
import { CriterionChip, makeCriterion } from "./CriterionChip";
import { RECIPES, type Recipe } from "@/fixtures/recipes";
import { fieldsForSet, SET_META, type AttrSet } from "@/fixtures/criteriaCatalog";
import { matchCount, type Criterion, type CriteriaSet } from "@/fixtures/criteriaMatch";

// CriteriaBuilder — left: the trigger-first criteria controls (recipe on-ramp, NL
// warm-start, editable chips behind a category gate). Right: the live MatchWall.
// Controlled: owns no criteria state itself (the flow/page does).

let counter = 0;
const newId = () => `c${++counter}`;

// ---- NL warm-start (PROTOTYPE: deterministic keyword compile, not a live LLM). ----
// Compiles a phrase into editable chips, validated against the catalog. Honest about
// being a mock; refuses-and-clarifies when nothing maps.
const NL_RULES: { test: RegExp; field: string; op: Criterion["op"]; value: Criterion["value"] }[] = [
  { test: /\b(quiet|no login|not logged|dormant|inactive)\b/i, field: "user.lastLoginDaysAgo", op: "gt", value: 14 },
  { test: /\b(adoption|pas|using|usage|feature)\b/i, field: "health.productAdoption", op: "lt", value: 50 },
  { test: /\b(big|high.?mrr|revenue|paying)\b/i, field: "account.mrr", op: "gt", value: 1500 },
  { test: /\b(at.?risk|risky|risk)\b/i, field: "health.band", op: "isAnyOf", value: ["atrisk"] },
  { test: /\b(renew|renewal|expiring)\b/i, field: "account.renewalInDays", op: "between", value: [0, 30] },
  { test: /\b(sentiment|unhappy|nps|detractor)\b/i, field: "health.sentiment", op: "lt", value: 40 },
  { test: /\b(payment|failed|declined|billing)\b/i, field: "account.lastPayment", op: "is", value: "failed" },
];

function compileNL(text: string): Criterion[] {
  return NL_RULES.filter((r) => r.test.test(text)).map((r) => ({ id: newId(), fieldId: r.field, op: r.op, value: r.value }));
}

export function CriteriaBuilder({
  set,
  onChange,
}: {
  set: CriteriaSet;
  onChange: (s: CriteriaSet) => void;
}) {
  const [gateOpen, setGateOpen] = useState(false);
  const [gateSet, setGateSet] = useState<AttrSet | null>(null);
  const [nl, setNl] = useState("");
  const [clarify, setClarify] = useState(false);

  const empty = set.criteria.length === 0;

  const applyRecipe = (r: Recipe) =>
    onChange({ ...r.set, criteria: r.set.criteria.map((c) => ({ ...c, id: newId() })) });

  const addField = (fieldId: string) => {
    onChange({ ...set, criteria: [...set.criteria, makeCriterion(fieldId, newId())] });
    setGateOpen(false);
    setGateSet(null);
  };
  const updateCriterion = (i: number, c: Criterion) =>
    onChange({ ...set, criteria: set.criteria.map((x, idx) => (idx === i ? c : x)) });
  const removeCriterion = (i: number) =>
    onChange({ ...set, criteria: set.criteria.filter((_, idx) => idx !== i) });

  const runNL = () => {
    const compiled = compileNL(nl);
    if (compiled.length === 0) {
      setClarify(true);
      return;
    }
    setClarify(false);
    onChange({ match: "all", criteria: compiled });
    setNl("");
  };

  return (
    <div className="cb-grid">
      {/* LEFT — criteria controls */}
      <div className="cb-left">
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-1)" }}>
          <h2 style={{ fontSize: "var(--t-heading)", fontWeight: 700, margin: 0 }}>Who should this run on?</h2>
          <p style={{ margin: 0, fontSize: "var(--t-body-sm)", color: "var(--text-3, var(--text))" }}>
            Set the trigger. The list on the right narrows as you go.
          </p>
        </div>

        {/* NL warm-start — the DS PromptField (an inviting AI input, not a faint box) */}
        <PromptField
          value={nl}
          onValueChange={setNl}
          onSubmit={runNL}
          placeholder="Describe the accounts… e.g. “big accounts going quiet”"
          submitLabel="Build"
        />
        <span className="cb-nl-note">Prototype — compiles your words into editable rules below. Always check them.</span>

        {clarify ? (
          <Card padded className="accent-t info">
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-2)" }}>
              <span style={{ fontSize: "var(--t-body-sm)", color: "var(--text)" }}>
                I'm not sure what to filter on. Did you mean one of these?
              </span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--s-2)" }}>
                {RECIPES.slice(0, 4).map((r) => (
                  <Button key={r.id} variant="secondary" size="sm" icon={<Icon name={r.icon} />} onClick={() => { applyRecipe(r); setClarify(false); }}>
                    {r.label}
                  </Button>
                ))}
              </div>
            </div>
          </Card>
        ) : null}

        {/* Empty state — starter recipes */}
        {empty ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-2)" }}>
            <span className="cb-eyebrow">Or start from a template</span>
            <div className="cb-recipes">
              {RECIPES.map((r) => (
                <button key={r.id} type="button" className="cb-recipe" onClick={() => applyRecipe(r)}>
                  <span className="cb-recipe-ico"><Icon name={r.icon} /></span>
                  <span className="cb-recipe-body">
                    <span className="cb-recipe-title">{r.label}</span>
                    <span className="cb-recipe-blurb">{r.blurb}</span>
                  </span>
                  <span className="cb-recipe-n">{matchCount(r.set)}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* match all/any */}
            {set.criteria.length > 1 ? (
              <div className="cb-match">
                <span>Match</span>
                <button type="button" className={["cb-match-opt", set.match === "all" ? "on" : ""].join(" ")} onClick={() => onChange({ ...set, match: "all" })}>all</button>
                <button type="button" className={["cb-match-opt", set.match === "any" ? "on" : ""].join(" ")} onClick={() => onChange({ ...set, match: "any" })}>any</button>
                <span>of these:</span>
              </div>
            ) : null}

            {/* chips */}
            <div className="cb-chips">
              {set.criteria.map((c, i) => (
                <CriterionChip key={c.id} criterion={c} onChange={(nc) => updateCriterion(i, nc)} onRemove={() => removeCriterion(i)} />
              ))}
            </div>
          </>
        )}

        {/* add-criterion category gate */}
        {gateOpen ? (
          <Card padded>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-3)" }}>
              {gateSet === null ? (
                <>
                  <span className="cb-eyebrow">What's the trigger about?</span>
                  <div className="cb-gate">
                    {(["health", "account", "user"] as AttrSet[]).map((s) => (
                      <button key={s} type="button" className="cb-gate-opt" onClick={() => setGateSet(s)}>
                        <Icon name={SET_META[s].icon} />
                        <span className="cb-gate-label">{SET_META[s].label}</span>
                        <span className="cb-gate-q">{SET_META[s].question}</span>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <button type="button" className="cb-back" onClick={() => setGateSet(null)}>
                    <Icon name="arrow-left" /> {SET_META[gateSet].label}
                  </button>
                  <div className="cb-fields">
                    {fieldsForSet(gateSet).map((f) => (
                      <button key={f.id} type="button" className="cb-field" onClick={() => addField(f.id)}>
                        {f.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
              <div>
                <Button variant="ghost" size="sm" onClick={() => { setGateOpen(false); setGateSet(null); }}>
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <div>
            <Button variant="secondary" size="sm" icon={<Icon name="plus" />} onClick={() => setGateOpen(true)}>
              Add criterion
            </Button>
          </div>
        )}
      </div>

      {/* RIGHT — the live wall */}
      <Card padded className="cb-right">
        <MatchWall set={set} />
      </Card>
    </div>
  );
}
