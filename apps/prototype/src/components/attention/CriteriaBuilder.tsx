import { useMemo, useState } from "react";
import { Button, Icon, Card, PromptArea, SegmentedControl, RuleGroup } from "@gocsm/design-system";
import { MatchWall } from "./MatchWall";
import { CriterionChip, makeCriterion } from "./CriterionChip";
import { RECIPES, type Recipe } from "@/fixtures/recipes";
import {
  CATALOG,
  commonFields,
  fieldsForGroup,
  GROUP_META,
  GROUP_ORDER,
  type AttrGroup,
  type DateRelValue,
} from "@/fixtures/criteriaCatalog";
import {
  matchCount,
  describeSet,
  isAdvanced,
  nodesOf,
  withNodes,
  isGroup,
  type Criterion,
  type Group,
  type Node,
  type CriteriaSet,
} from "@/fixtures/criteriaMatch";

// CriteriaBuilder — the "Who should this run on?" surface (CPDO §1–§4).
//   LEFT  = build the question: NL hero (PromptArea) → Simple sentence-chips OR Advanced
//           nested-group cards, with a categorized field picker + never-blank empty state.
//   RIGHT = see the answer: the live "runs on N accounts" count + MatchWall, always visible.
// Controlled: owns no criteria state (the flow/page does); a draft `compiled` map drives the
// transient PromptArea correction copy.

let counter = 0;
const newId = () => `c${++counter}`;

// ---- NL warm-start (PROTOTYPE: deterministic keyword compile, NOT a live LLM). ----
// Re-pointed at the §6 fields. Honest about being a mock; names the problem and offers
// catalog-grounded options when nothing maps (the clarify path).
interface NLRule {
  test: RegExp;
  build: () => Criterion;
}
const dr = (verb: DateRelValue["verb"], n: number): DateRelValue => ({ verb, n, unit: "days" });
const NL_RULES: NLRule[] = [
  { test: /\b(quiet|no login|not logged|dormant|inactive|gone\s+quiet|haven'?t logged)\b/i, build: () => ({ id: newId(), fieldId: "engagement.lastLoginDays", op: "gt", value: 21 }) },
  { test: /\b(workflow|not using|aren'?t using|core feature)\b/i, build: () => ({ id: newId(), fieldId: "feature.inUse", op: "isNoneOf", value: ["Workflow"] }) },
  { test: /\b(big|high.?mrr|over \$?1?,?500|revenue|paying|biggest)\b/i, build: () => ({ id: newId(), fieldId: "revenue.mrr", op: "gt", value: 1500 }) },
  { test: /\b(at.?risk|risky|risk)\b/i, build: () => ({ id: newId(), fieldId: "health.band", op: "isAnyOf", value: ["atrisk"] }) },
  { test: /\b(falling|downhill|declin|dropping|slipping|going down)\b/i, build: () => ({ id: newId(), fieldId: "health.trend", op: "falling" }) },
  { test: /\b(renew(s|ing|al)?|expir(e|es|ing|ation)|up\s+for\s+renewal|due\s+to\s+renew)\b/i, build: () => ({ id: newId(), fieldId: "revenue.renewsWithin", op: "inNext", value: dr("inNext", 30) }) },
  { test: /\b(payment|failed|declined|charge|billing|card)\b/i, build: () => ({ id: newId(), fieldId: "revenue.failedPayment", op: "is", value: true }) },
  { test: /\b(unhappy|sentiment|detractor|complain)\b/i, build: () => ({ id: newId(), fieldId: "feedback.sentiment", op: "isAnyOf", value: ["unhappy", "neutral"] }) },
];

function compileNL(text: string): Criterion[] {
  return NL_RULES.filter((r) => r.test.test(text)).map((r) => r.build());
}

const EXAMPLES = [
  { label: "Big at-risk accounts (MRR over $1,500) renewing in the next 30 days" },
  { label: "Owners who haven't logged in for 21+ days and aren't using Workflows" },
  { label: "Accounts whose health is falling fast", fill: "Accounts whose health is falling fast" },
];

// Restatement: describeSet now leads "Accounts where …" (unified voice with the
// right-rail summary), so the left restatement reuses it verbatim.
function restate(set: CriteriaSet): string {
  return describeSet(set); // "Accounts where X and Y" | "All accounts"
}

export function CriteriaBuilder({
  set,
  onChange,
}: {
  set: CriteriaSet;
  onChange: (s: CriteriaSet) => void;
}) {
  const [mode, setMode] = useState<"simple" | "advanced">(() => (isAdvanced(set) ? "advanced" : "simple"));
  const [nl, setNl] = useState("");
  const [busy, setBusy] = useState(false);
  const [clarify, setClarify] = useState(false);
  const [compiledNote, setCompiledNote] = useState(false); // soft "did I get everything?" note after an NL compile
  const [picker, setPicker] = useState<{ target: "top" | string } | null>(null); // groupId or "top"

  const nodes = nodesOf(set);
  const leaves = useMemo(() => nodes.flatMap((n) => (isGroup(n) ? n.criteria : [n])), [nodes]);
  const empty = leaves.length === 0;
  const advancedLocked = isAdvanced(set); // genuine nesting → Simple is disabled

  const n = matchCount(set);

  // ---- recipe / NL application ----
  const applyRecipe = (r: Recipe) => {
    const fresh = withNodes(r.set, nodesOf(r.set).map((node) =>
      isGroup(node)
        ? ({ ...node, id: newId(), criteria: node.criteria.map((c) => ({ ...c, id: newId() })) } as Group)
        : ({ ...node, id: newId() } as Criterion),
    ));
    onChange(fresh);
    setMode(isAdvanced(fresh) ? "advanced" : "simple");
    setClarify(false);
    setCompiledNote(false);
    setPicker(null);
  };

  const runNL = (text: string) => {
    setBusy(true);
    setClarify(false);
    setCompiledNote(false);
    // tiny async beat so the button reads "Compiling…" (prototype theater, deterministic).
    window.setTimeout(() => {
      const compiled = compileNL(text);
      setBusy(false);
      if (compiled.length === 0) {
        setClarify(true);
        return;
      }
      onChange(withNodes({ match: "all", criteria: [] }, compiled));
      setMode("simple");
      setNl("");
      // Honesty: a deterministic keyword compile can silently miss a clause. Surface a
      // soft, dismissible "check I didn't miss anything" note under the fresh chips.
      setCompiledNote(true);
    }, 280);
  };

  // ---- top-level node ops ----
  const setTopMatch = (match: "all" | "any") => onChange({ ...set, match });

  const addCriterionTo = (target: "top" | string, fieldId: string) => {
    const crit = makeCriterion(fieldId, newId());
    if (target === "top") {
      onChange(withNodes(set, [...nodes, crit]));
    } else {
      onChange(
        withNodes(
          set,
          nodes.map((node) => (isGroup(node) && node.id === target ? { ...node, criteria: [...node.criteria, crit] } : node)),
        ),
      );
    }
    setPicker(null);
  };

  const addGroup = () => {
    const g: Group = { id: newId(), kind: "group", match: "any", criteria: [] };
    onChange(withNodes(set, [...nodes, g]));
  };

  const removeGroup = (groupId: string) => onChange(withNodes(set, nodes.filter((node) => !(isGroup(node) && node.id === groupId))));

  const setGroupMatch = (groupId: string, match: "all" | "any") =>
    onChange(withNodes(set, nodes.map((node) => (isGroup(node) && node.id === groupId ? { ...node, match } : node))));

  // update / remove a leaf criterion anywhere in the tree
  const updateLeaf = (id: string, c: Criterion) =>
    onChange(
      withNodes(
        set,
        nodes.map((node) =>
          isGroup(node)
            ? { ...node, criteria: node.criteria.map((x) => (x.id === id ? c : x)) }
            : node.id === id
              ? c
              : node,
        ),
      ),
    );
  const removeLeaf = (id: string) =>
    onChange(
      withNodes(
        set,
        nodes
          .map((node) => (isGroup(node) ? { ...node, criteria: node.criteria.filter((x) => x.id !== id) } : node))
          .filter((node) => isGroup(node) || (node as Criterion).id !== id),
      ),
    );

  // ---- mode switch (lossless) ----
  const switchMode = (next: "simple" | "advanced") => {
    if (next === mode) return;
    if (next === "simple") {
      if (advancedLocked) return; // disabled — quiet note shown
      // flatten the single-group structure back to flat criteria
      onChange(withNodes(set, leaves));
    }
    setMode(next);
    setPicker(null);
  };

  return (
    <div className="cb-grid">
      {/* LEFT — build the question */}
      <div className="cb-left">
        <div className="cb-headrow">
          <div className="cb-head">
            <h2 className="cb-title">Who should this run on?</h2>
            <p className="cb-sub">Describe it, or start from a template.</p>
          </div>
          <div className="cb-mode">
            <SegmentedControl
              options={[
                { value: "simple", label: "Simple" },
                { value: "advanced", label: "Advanced" },
              ]}
              value={mode}
              onChange={(v: string) => switchMode(v as "simple" | "advanced")}
            />
          </div>
        </div>

        {/* NL hero */}
        <PromptArea
          value={nl}
          onValueChange={setNl}
          onSubmit={runNL}
          busy={busy}
          placeholder="Describe who this should run on…"
          submitLabel="Build rules"
          hint="We'll turn this into editable rules below — always check them."
          examples={EXAMPLES}
        />

        {clarify ? (
          <Card padded className="accent-t info">
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-2)" }}>
              <span style={{ fontSize: "var(--t-body-sm)", color: "var(--text)" }}>
                I couldn't turn that into rules. Try naming a number and a window — e.g. "MRR over $1,500,
                renewing in 30 days" — or start from one of these:
              </span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--s-2)" }}>
                {RECIPES.slice(0, 4).map((r) => (
                  <Button key={r.id} variant="secondary" size="sm" icon={<Icon name={r.icon} />} onClick={() => applyRecipe(r)}>
                    {r.label}
                  </Button>
                ))}
              </div>
            </div>
          </Card>
        ) : null}

        {/* restatement — always on top of the rules */}
        {!empty ? (
          <div className="cb-restate">
            <span className="cb-restate-eyebrow">
              <Icon name="list-filter" /> In plain English
            </span>
            <p className="cb-restate-line">{restate(set)}.</p>
          </div>
        ) : null}

        {/* the rules — empty state OR simple OR advanced */}
        {empty ? (
          <EmptyState onRecipe={applyRecipe} onSuggested={addCriterionTo} />
        ) : mode === "advanced" ? (
          <AdvancedBuilder
            set={set}
            nodes={nodes}
            onTopMatch={setTopMatch}
            onUpdateLeaf={updateLeaf}
            onRemoveLeaf={removeLeaf}
            onGroupMatch={setGroupMatch}
            onRemoveGroup={removeGroup}
            onAddGroup={addGroup}
            picker={picker}
            setPicker={setPicker}
            onAddCriterion={addCriterionTo}
          />
        ) : (
          <SimpleBuilder
            set={set}
            leaves={leaves}
            onTopMatch={setTopMatch}
            onUpdateLeaf={updateLeaf}
            onRemoveLeaf={removeLeaf}
            picker={picker}
            setPicker={setPicker}
            onAddCriterion={addCriterionTo}
          />
        )}

        {/* post-compile honesty note — soft, dismissible (not an error; never blocks) */}
        {compiledNote && !empty ? (
          <div className="cb-compiled-note" role="note">
            <Icon name="sparkles" />
            <span className="cb-compiled-note-text">
              I turned your description into the rules below — check I didn't miss anything.
            </span>
            <button
              type="button"
              className="cb-compiled-note-x"
              aria-label="Dismiss"
              onClick={() => setCompiledNote(false)}
            >
              <Icon name="x" />
            </button>
          </div>
        ) : null}

        {/* lossless-mode note */}
        {advancedLocked && mode === "advanced" ? (
          <span className="cb-mode-note">
            <Icon name="info" /> This rule has groups — editing in Advanced.
          </span>
        ) : null}
      </div>

      {/* RIGHT — the answer */}
      <Card padded className="cb-right">
        <div className="cb-count" aria-live="polite">
          <span className="cb-count-n">{n}</span>
          <span className="cb-count-label">account{n === 1 ? "" : "s"}</span>
          <span className="cb-count-runs">runs on</span>
        </div>
        <MatchWall set={set} hideCount />
      </Card>
    </div>
  );
}

// ─────────────────────────────────── Empty state ───────────────────────────────────
function EmptyState({
  onRecipe,
  onSuggested,
}: {
  onRecipe: (r: Recipe) => void;
  onSuggested: (target: "top", fieldId: string) => void;
}) {
  // suggested filters seed a single fully-formed condition (Totango-style)
  const suggestions: { label: string; fieldId: string }[] = [
    { label: "Health is At-risk", fieldId: "health.band" },
    { label: "Renewing in 30 days", fieldId: "revenue.renewsWithin" },
    { label: "Gone quiet 21+ days", fieldId: "engagement.lastLoginDays" },
    { label: "Payment failed", fieldId: "revenue.failedPayment" },
  ];
  return (
    <div className="cb-empty">
      <div className="cb-block">
        <span className="cb-eyebrow">Start from a template</span>
        <div className="cb-recipes">
          {RECIPES.map((r) => (
            <button key={r.id} type="button" className="cb-recipe" onClick={() => onRecipe(r)}>
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
      <div className="cb-block">
        <span className="cb-eyebrow">Or add a condition</span>
        <div className="cb-suggested">
          {suggestions.map((s) => (
            <button key={s.fieldId} type="button" className="cb-suggested-chip" onClick={() => onSuggested("top", s.fieldId)}>
              <Icon name="plus" /> {s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────── Simple builder ───────────────────────────────────
function SimpleBuilder({
  set,
  leaves,
  onTopMatch,
  onUpdateLeaf,
  onRemoveLeaf,
  picker,
  setPicker,
  onAddCriterion,
}: {
  set: CriteriaSet;
  leaves: Criterion[];
  onTopMatch: (m: "all" | "any") => void;
  onUpdateLeaf: (id: string, c: Criterion) => void;
  onRemoveLeaf: (id: string) => void;
  picker: { target: "top" | string } | null;
  setPicker: (p: { target: "top" | string } | null) => void;
  onAddCriterion: (target: "top" | string, fieldId: string) => void;
}) {
  return (
    <div className="cb-simple">
      {leaves.length > 1 ? (
        <div className="cb-match">
          <span>Match</span>
          <SegmentedControl
            options={[
              { value: "all", label: "all" },
              { value: "any", label: "any" },
            ]}
            value={set.match}
            onChange={(v: string) => onTopMatch(v as "all" | "any")}
          />
          <span>of these conditions:</span>
        </div>
      ) : null}

      <div className="cb-chips">
        {leaves.map((c) => (
          <CriterionChip key={c.id} criterion={c} onChange={(nc) => onUpdateLeaf(c.id, nc)} onRemove={() => onRemoveLeaf(c.id)} />
        ))}
      </div>

      <FieldPickerLauncher target="top" picker={picker} setPicker={setPicker} onAdd={onAddCriterion} label="Add condition" />
    </div>
  );
}

// ─────────────────────────────────── Advanced builder ───────────────────────────────────
function AdvancedBuilder({
  set,
  nodes,
  onTopMatch,
  onUpdateLeaf,
  onRemoveLeaf,
  onGroupMatch,
  onRemoveGroup,
  onAddGroup,
  picker,
  setPicker,
  onAddCriterion,
}: {
  set: CriteriaSet;
  nodes: Node[];
  onTopMatch: (m: "all" | "any") => void;
  onUpdateLeaf: (id: string, c: Criterion) => void;
  onRemoveLeaf: (id: string) => void;
  onGroupMatch: (gid: string, m: "all" | "any") => void;
  onRemoveGroup: (gid: string) => void;
  onAddGroup: () => void;
  picker: { target: "top" | string } | null;
  setPicker: (p: { target: "top" | string } | null) => void;
  onAddCriterion: (target: "top" | string, fieldId: string) => void;
}) {
  return (
    <div className="cb-advanced">
      <div className="cb-match">
        <span>Match</span>
        <SegmentedControl
          options={[
            { value: "all", label: "all" },
            { value: "any", label: "any" },
          ]}
          value={set.match}
          onChange={(v: string) => onTopMatch(v as "all" | "any")}
        />
        <span>of these:</span>
      </div>

      <div className="cb-adv-nodes">
        {nodes.map((node) =>
          isGroup(node) ? (
            <RuleGroup
              key={node.id}
              label="Group"
              match={node.match}
              onMatchChange={(m) => onGroupMatch(node.id, m)}
              removable
              onRemove={() => onRemoveGroup(node.id)}
              onAddCondition={() => setPicker({ target: node.id })}
            >
              {node.criteria.map((c) => (
                <CriterionChip key={c.id} criterion={c} onChange={(nc) => onUpdateLeaf(c.id, nc)} onRemove={() => onRemoveLeaf(c.id)} />
              ))}
              {node.criteria.length === 0 ? <span className="cb-group-empty">Add a condition to this group.</span> : null}
              {picker?.target === node.id ? (
                <FieldPicker onPick={(fid) => onAddCriterion(node.id, fid)} onClose={() => setPicker(null)} />
              ) : null}
            </RuleGroup>
          ) : (
            <div key={node.id} className="cb-bare">
              <CriterionChip criterion={node} onChange={(nc) => onUpdateLeaf(node.id, nc)} onRemove={() => onRemoveLeaf(node.id)} />
            </div>
          ),
        )}
      </div>

      <div className="cb-adv-actions">
        <FieldPickerLauncher target="top" picker={picker} setPicker={setPicker} onAdd={onAddCriterion} label="Add condition" />
        <button type="button" className="rg-add rg-add-group" onClick={onAddGroup}>
          <Icon name="square-stack" /> Add group
        </button>
      </div>
    </div>
  );
}

// ─────────────────────── Field picker (categorized + search) ───────────────────────
function FieldPickerLauncher({
  target,
  picker,
  setPicker,
  onAdd,
  label,
}: {
  target: "top" | string;
  picker: { target: "top" | string } | null;
  setPicker: (p: { target: "top" | string } | null) => void;
  onAdd: (target: "top" | string, fieldId: string) => void;
  label: string;
}) {
  if (picker?.target === target) {
    return <FieldPicker onPick={(fid) => onAdd(target, fid)} onClose={() => setPicker(null)} />;
  }
  return (
    <button type="button" className="rg-add" onClick={() => setPicker({ target })}>
      <Icon name="plus" /> {label}
    </button>
  );
}

function FieldPicker({ onPick, onClose }: { onPick: (fieldId: string) => void; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<AttrGroup>("common");

  const q = query.trim().toLowerCase();
  const results = q
    ? CATALOG.filter((f) => f.label.toLowerCase().includes(q) || f.phrase.toLowerCase().includes(q))
    : group === "common"
      ? commonFields()
      : fieldsForGroup(group);

  return (
    <Card padded className="cb-picker">
      <div className="cb-picker-search">
        <Icon name="search" />
        <input className="cb-picker-input" autoFocus value={query} placeholder="Search fields…" onChange={(e) => setQuery(e.target.value)} />
        <button type="button" className="cb-picker-close" onClick={onClose} aria-label="Close">
          <Icon name="x" />
        </button>
      </div>

      {!q ? (
        <div className="cb-picker-groups">
          {GROUP_ORDER.map((g) => (
            <button
              key={g}
              type="button"
              className={["cb-picker-gtab", g === group ? "on" : ""].join(" ")}
              onClick={() => setGroup(g)}
            >
              <Icon name={GROUP_META[g].icon} /> {GROUP_META[g].label}
            </button>
          ))}
        </div>
      ) : null}

      <div className="cb-fields">
        {results.length === 0 ? (
          <span className="cb-picker-empty">No fields match "{query}".</span>
        ) : (
          results.map((f) => (
            <button key={f.id} type="button" className="cb-field" onClick={() => onPick(f.id)}>
              {f.label}
            </button>
          ))
        )}
      </div>
    </Card>
  );
}
