import { useMemo, useState } from "react";
import { Button, Icon, Card, PromptArea, SegmentedControl, RuleGroup } from "@gocsm/design-system";
import { CriterionChip, makeCriterion } from "./CriterionChip";
import { useHealthConfigured } from "@/state/healthConfig";
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
  nodesOf,
  withNodes,
  isGroup,
  type Criterion,
  type Group,
  type Node,
  type CriteriaSet,
} from "@/fixtures/criteriaMatch";

// CriteriaBuilder — the BODY of the "Who it runs on" step. The shell (header, the live
// plain-English restatement, the Simple/Advanced toggle, and the live count) lives one level
// up in TriggerStep; this component renders only the mode-specific body:
//   • SIMPLE  = a curated prebuilt quick-add list (no AI) + the editable sentence-chips you've added.
//   • ADVANCED = the NL "describe your audience" box (drafts editable rules) + the nested rule builder.
// `mode` is controlled by the parent so the toggle can sit beside the restatement up top. Controlled:
// owns no criteria state (the flow/page does); a little NL/picker state is transient and local.

let counter = 0;
const newId = () => `c${++counter}`;

// ---- NL warm-start (PROTOTYPE: deterministic keyword compile, NOT a live LLM). ----
// Honest about being a mock; names the problem and offers catalog-grounded options when nothing maps.
interface NLRule {
  test: RegExp;
  build: () => Criterion;
}
const dr = (verb: DateRelValue["verb"], n: number): DateRelValue => ({ verb, n, unit: "days" });
const NL_RULES: NLRule[] = [
  { test: /\b(quiet|no login|not logged|dormant|inactive|gone\s+quiet|haven'?t logged)\b/i, build: () => ({ id: newId(), fieldId: "engagement.lastLoginDays", op: "gt", value: 21 }) },
  { test: /\b(workflow|not using|aren'?t using|core feature)\b/i, build: () => ({ id: newId(), fieldId: "feature.inUse", op: "isNoneOf", value: ["Workflow"] }) },
  { test: /\b(big|high.?mrr|over \$?1?,?500|revenue|paying|biggest)\b/i, build: () => ({ id: newId(), fieldId: "revenue.mrr", op: "gt", value: 1500 }) },
  { test: /\b(priority|vip|important account)\b/i, build: () => ({ id: newId(), fieldId: "account.priority", op: "is", value: true }) },
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
  { label: "Priority accounts on the Pro plan" },
  { label: "Owners who haven't logged in for 21+ days and aren't using Workflows" },
  { label: "Big accounts (MRR over $1,500) renewing in the next 30 days" },
];

// SIMPLE-mode quick-add filters. QUICK_SPEC maps a catalog field-id → its chip label,
// display group, and (optionally) a sensible op/value seed where the field's default
// operator would otherwise be wrong (e.g. account.created defaults to "in the next").
// WHICH fields a given play shows comes from `defaultFiltersFor(playbook)` (passed in as
// `quickAddFields`); this component just renders + groups them. DEFAULT_QUICK is the
// generic fallback for the no-playbook case (e.g. the lab / create-from-scratch). All
// fields are HL-native (Phase-1 safe; no `health.*`).
type QuickSpec = { label: string; group: string; op?: Criterion["op"]; value?: Criterion["value"] };
const QUICK_SPEC: Record<string, QuickSpec> = {
  "account.priority":         { label: "Priority account", group: "Account" },
  "revenue.plan":             { label: "Plan", group: "Account" },
  "engagement.lastLoginDays": { label: "Gone quiet", group: "Account" },
  "account.created":          { label: "Signed up recently", group: "Account", op: "inLast", value: { verb: "inLast", n: 30, unit: "days" } },
  "revenue.mrr":              { label: "Monthly revenue", group: "Billing" },
  "revenue.failedPayment":    { label: "Payment failed", group: "Billing" },
  "revenue.renewsWithin":     { label: "Renewing soon", group: "Billing" },
  "revenue.spendTrend":       { label: "Spend trend", group: "Billing" },
  "feature.inUse":            { label: "Feature in use", group: "Feature" },
  "feedback.sentiment":       { label: "Sentiment", group: "Feedback" },
  "user.role":                { label: "User role", group: "Users" },
  "user.keyOnly":             { label: "Key users only", group: "Users" },
  "user.idleDays":            { label: "A user gone quiet", group: "Users" },
};
const QUICK_GROUP_ORDER = ["Account", "Billing", "Feature", "Feedback", "Users"];
const DEFAULT_QUICK = ["account.priority", "revenue.plan", "engagement.lastLoginDays", "account.created", "revenue.mrr", "revenue.failedPayment", "revenue.renewsWithin", "user.role", "user.keyOnly"];

// Health (the gated/coined system) lives in the `health.*` fields. In Phase 1 (no Health
// configured) we strip every health signal from the builder — picker, NL examples, recipes,
// suggestions — so the trial never sees coined vocab (Patterns 3 & 4). Returns additively in Phase 2.
const isHealthField = (fieldId: string): boolean => fieldId.startsWith("health.");
const recipeHasHealth = (r: Recipe): boolean => JSON.stringify(r.set).includes("health.");

export function CriteriaBuilder({
  set,
  onChange,
  mode,
  quickAddFields,
}: {
  set: CriteriaSet;
  onChange: (s: CriteriaSet) => void;
  mode: "simple" | "advanced";
  /** Ordered field-ids to offer as Simple-view quick-add filters (playbook-aware). */
  quickAddFields?: string[];
}) {
  const [nl, setNl] = useState("");
  const [busy, setBusy] = useState(false);
  const [clarify, setClarify] = useState(false);
  const [compiledNote, setCompiledNote] = useState(false); // soft "did I get everything?" note after an NL compile
  const [picker, setPicker] = useState<{ target: "top" | string } | null>(null); // groupId or "top"

  const healthConfigured = useHealthConfigured();
  const visibleRecipes = healthConfigured ? RECIPES : RECIPES.filter((r) => !recipeHasHealth(r));
  const visibleExamples = healthConfigured ? EXAMPLES : EXAMPLES.filter((e) => !/health|risk/i.test(e.label));

  const nodes = nodesOf(set);
  const leaves = useMemo(() => nodes.flatMap((n) => (isGroup(n) ? n.criteria : [n])), [nodes]);
  const empty = leaves.length === 0;
  const usedFieldIds = useMemo(() => new Set(leaves.map((c) => c.fieldId)), [leaves]);

  // ---- recipe / NL application ----
  const applyRecipe = (r: Recipe) => {
    const fresh = withNodes(r.set, nodesOf(r.set).map((node) =>
      isGroup(node)
        ? ({ ...node, id: newId(), criteria: node.criteria.map((c) => ({ ...c, id: newId() })) } as Group)
        : ({ ...node, id: newId() } as Criterion),
    ));
    onChange(fresh);
    setClarify(false);
    setCompiledNote(false);
    setPicker(null);
  };

  const runNL = (text: string) => {
    setBusy(true);
    setClarify(false);
    setCompiledNote(false);
    // tiny async beat so the button reads "Drafting…" (prototype theater, deterministic).
    window.setTimeout(() => {
      const raw = compileNL(text);
      const compiled = healthConfigured ? raw : raw.filter((c) => !isHealthField(c.fieldId));
      setBusy(false);
      if (compiled.length === 0) {
        setClarify(true);
        return;
      }
      onChange(withNodes({ match: "all", criteria: [] }, compiled));
      setNl("");
      // Honesty: a deterministic keyword compile can silently miss a clause. Surface a soft,
      // dismissible "check I didn't miss anything" note under the fresh chips.
      setCompiledNote(true);
    }, 280);
  };

  // ---- node ops ----
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

  // Quick-add a fully-formed prebuilt condition (with an optional sensible op/value seed).
  const addQuick = (fieldId: string) => {
    const spec = QUICK_SPEC[fieldId];
    const base = makeCriterion(fieldId, newId());
    const crit: Criterion = spec?.op ? { ...base, op: spec.op, value: spec.value } : base;
    onChange(withNodes(set, [...nodes, crit]));
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

  // ─────────────────────────────── ADVANCED ───────────────────────────────
  if (mode === "advanced") {
    return (
      <div className="cb-body">
        {/* NL hero — the "type your own" AI on-ramp; drafts editable rules below, never auto-commits. */}
        <PromptArea
          value={nl}
          onValueChange={setNl}
          onSubmit={runNL}
          busy={busy}
          placeholder="Describe who this should run on…"
          submitLabel="Draft rules"
          hint="We'll turn this into editable rules below — always check them."
          examples={visibleExamples}
        />

        {clarify ? (
          <Card padded className="accent-t info">
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-2)" }}>
              <span style={{ fontSize: "var(--t-body-sm)", color: "var(--text)" }}>
                I couldn't turn that into rules. Try naming a thing and a window — e.g. "priority accounts
                renewing in 30 days" — or start from one of these:
              </span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--s-2)" }}>
                {visibleRecipes.slice(0, 4).map((r) => (
                  <Button key={r.id} variant="secondary" size="sm" icon={<Icon name={r.icon} />} onClick={() => applyRecipe(r)}>
                    {r.label}
                  </Button>
                ))}
              </div>
            </div>
          </Card>
        ) : null}

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

        {compiledNote ? (
          <div className="cb-compiled-note" role="note">
            <Icon name="sparkles" />
            <span className="cb-compiled-note-text">
              I turned your description into the rules above — check I didn't miss anything.
            </span>
            <button type="button" className="cb-compiled-note-x" aria-label="Dismiss" onClick={() => setCompiledNote(false)}>
              <Icon name="x" />
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  // ─────────────────────────────── SIMPLE ───────────────────────────────
  // Prebuilt quick-add list (no AI) + the editable chips already chosen. Never blank.
  return (
    <div className="cb-body">
      {!empty ? (
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
                onChange={(v: string) => setTopMatch(v as "all" | "any")}
              />
              <span>of these:</span>
            </div>
          ) : null}
          <div className="cb-chips">
            {leaves.map((c) => (
              <CriterionChip key={c.id} criterion={c} onChange={(nc) => updateLeaf(c.id, nc)} onRemove={() => removeLeaf(c.id)} />
            ))}
          </div>
        </div>
      ) : null}

      <QuickAdd fields={quickAddFields ?? DEFAULT_QUICK} usedFieldIds={usedFieldIds} healthConfigured={healthConfigured} onAdd={addQuick} empty={empty} />

      <FieldPickerLauncher target="top" picker={picker} setPicker={setPicker} onAdd={addCriterionTo} label="Browse all fields" />
    </div>
  );
}

// ─────────────────────────── Simple-mode quick-add list ───────────────────────────
function QuickAdd({
  fields,
  usedFieldIds,
  healthConfigured,
  onAdd,
  empty,
}: {
  fields: string[];
  usedFieldIds: Set<string>;
  healthConfigured: boolean;
  onAdd: (fieldId: string) => void;
  empty: boolean;
}) {
  // The play's default filters, in priority order, that have a spec, aren't already
  // added, and (Phase 1) aren't health.* — then regrouped by display group for a clean layout.
  const avail = fields.filter(
    (fid) => QUICK_SPEC[fid] && !usedFieldIds.has(fid) && (healthConfigured || !isHealthField(fid)),
  );
  const groups = QUICK_GROUP_ORDER
    .map((g) => ({ group: g, items: avail.filter((fid) => QUICK_SPEC[fid].group === g) }))
    .filter((g) => g.items.length > 0);

  if (groups.length === 0) return null;

  return (
    <div className="cb-quick">
      <span className="cb-quick-eyebrow">{empty ? "Pick who it runs on" : "Add another"}</span>
      {groups.map((g) => (
        <div key={g.group} className="cb-quick-row">
          <span className="cb-quick-label">{g.group}</span>
          <div className="cb-quick-chips">
            {g.items.map((fid) => (
              <button key={fid} type="button" className="cb-suggested-chip" onClick={() => onAdd(fid)}>
                <Icon name="plus" /> {QUICK_SPEC[fid].label}
              </button>
            ))}
          </div>
        </div>
      ))}
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
  const empty = nodes.length === 0;
  return (
    <div className="cb-advanced">
      {!empty ? (
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
      ) : null}

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
  const healthConfigured = useHealthConfigured();

  // Phase 1: the Health group + any health.* field are absent from the picker.
  const groups = healthConfigured ? GROUP_ORDER : GROUP_ORDER.filter((g) => g !== "health");
  const dropHealth = (fs: typeof CATALOG) => (healthConfigured ? fs : fs.filter((f) => f.group !== "health"));

  const q = query.trim().toLowerCase();
  const results = dropHealth(
    q
      ? CATALOG.filter((f) => f.label.toLowerCase().includes(q) || f.phrase.toLowerCase().includes(q))
      : group === "common"
        ? commonFields()
        : fieldsForGroup(group),
  );

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
          {groups.map((g) => (
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
