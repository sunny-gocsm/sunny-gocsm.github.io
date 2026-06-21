# PLAN — build spec for `/today → Attention`

> Phase 3. Turns `DECISION.md` + the brief's IA into a buildable spec with DS-vs-app
> classification and a build order for the Phase-4 micro-loops. Vocabulary:
> **Thriving / Healthy / Watch / At-Risk** — never "Steady".

---

## A. Information architecture

### A1. The Attention page (`/today`, nav relabelled "Attention")
Identity: "Attention" — these accounts **require action now**. Two jobs, in priority order:

1. **Job (a) — Needs a workflow.** Accounts needing attention with no active workflow. Issue-grouped
   rows (today's cohort list, reused), each → opens the **collapsed activation flow** pre-seeded with the
   matching starter recipe. Consumes Health-layer selectors (spine: never recomputes risk).
2. **Job (b) — We tried, it didn't land.** Accounts where a workflow **ran ≥24h ago and health did not
   improve** (closed-loop signal, §D). Card = account · one-line reason · "ran {N}d ago" · **inline
   Call / Email / SMS** · link → Health. The honest fallback (§D) governs any low-confidence case.

A slim, secondary reassurance line ("GoCSM handled N overnight") may remain below the two jobs — it is
not job (a)/(b) and must never outweigh them.

### A2. The collapsed activation flow (replaces the 6-step drawer)
`criteria → Workflow builder → Publish → auto-run`. Concretely, the drawer becomes:
- **Step 1 — Criteria** (the new builder, §C). Opened from a job-(a) row: **pre-seeded** with that
  cohort's recipe so the wall is already populated; the user adjusts, not authors.
- **Step 2 — Workflow** (`WorkflowHandoff`, reused — the pre-built action preview + HighLevel handoff).
- **Publish** — one primary button. On click → `autopilotStore.enable(playbookId, oversee)` == activation.
  **No "list of actions" screen, no Run step, no "do you want autopilot?" question.** Publishing IS activation.
- Success state: "Live — auto-running on N accounts now, and new matches as they qualify."

DELETE: the `explain` step (list of actions) and the standalone `run` step + autopilot-offer fork.

---

## B. Data & state additions (app: `src/fixtures` + `src/state`)

### B1. Criteria catalog — `src/fixtures/criteriaCatalog.ts`
The field universe the builder (and the NL validator) is grounded in. Each field:
```ts
type AttrSet = "health" | "account" | "user";
type FieldType = "number" | "money" | "score" | "enum" | "band" | "trendDir" | "days" | "boolean";
interface FieldDef {
  id: string;            // "health.login", "account.mrr", "user.lastLogin"
  set: AttrSet;
  label: string;         // plain-English ("Login activity")
  type: FieldType;
  ops: Operator[];       // type-aware operator subset
  options?: () => string[];   // enum values, derived from REAL accounts (autocomplete source)
  get: (a: Account) => number | string | boolean;  // accessor
  unit?: string;
}
type Operator = "lt" | "gt" | "between" | "is" | "isNot" | "isAnyOf" | "falling" | "inactiveFor" | "withinDays";
```
Seed the three sets from the Account model (see `_handoff.md` → attribute catalog). This file IS the
schema the NL warm-start validates against (hallucinated fields silently stripped — Honeycomb rule).

### B2. Matching engine — `src/fixtures/criteriaMatch.ts` (pure, over `allAccounts()`)
- `matchAccounts(set: CriteriaSet): Account[]`
- `candidateDelta(set, candidate: Criterion): number` — preview count for an unapplied criterion (Δ wall size)
- `composition(accounts): {dim: string; parts: {label; pct; tone}[]}[]` — 2–3 distribution bars
- `forecast7d(set): { account: Account; etaDays: number; confidence: "high" | "low" }[]` — accounts
  trending toward `set` via `trend90d`/`delta`; **range output, gated by history** (low confidence → not shown as a promise)
- `floorWarn(set, candidate): boolean` — would the next criterion drop below the inventory floor (~5)?

### B3. Starter recipes — `src/fixtures/recipes.ts`
6–8 named `CriteriaSet`s seeded from real data + the existing `triggers.ts` vocabulary. Each:
`{ id, icon, label, blurb, set, playbookId }`. These are the empty-state on-ramp AND the job-(a)
pre-seed source. Examples: "Falling PAS + no login 14d", "High-MRR trending negative", "Renewing 30d & at-risk".

### B4. Attempts (job b closed-loop) — `src/fixtures/attempts.ts`
Honest, inspectable signal (the production data-dependency is flagged in NEEDS KARTHIK):
```ts
interface Attempt {
  id; accountId; playbookId;
  ranAt: string;                 // ISO → "ran {N}d ago"
  targetPillar: keyof PillarScores | "score";
  preScore: number; postScore: number;        // anchored to ranAt vs now
  status: "improved" | "flat" | "worse" | "unconfirmed";
  confidence: "high" | "low";
}
```
Selectors: `triedButFailed()` → ranAt ≤ now−24h ∧ status ∈ {flat,worse} ∧ confidence "high" ∧ account
still Watch/At-Risk. `triedUnconfirmed()` → confidence "low" (→ honest fallback copy). Seed 3–4 high-conf
failures + 1 low-conf so both states are demoable.

### B5. State — reuse `autopilotStore` (publish == `enable`). Add saved named criteria tokens if time permits (B3 covers the demo need).

---

## C. The criteria builder (the central surface)
Layout: **left = criteria (gate + chips + NL warm-start), right = the live wall.**

- **C1 Category gate** — first click is a 3-way plain-English question = our 3 attribute sets
  (Health signal · Account · User) → scoped field picker. *App composition* over DS Buttons/Card.
- **C2 CriterionChip** — `field → operator → value`, each segment tap-editable; value is a pick-list
  autocompleted from real account values. **NEW DS primitive** (`CriterionChip`). Check `AssignmentRuleEditor`
  first — may already host a field→op→value row to extend rather than build fresh.
- **C3 NL warm-start** — text box "describe the accounts…" → compiles to chips, validated against the
  catalog (B1); one-tap revert to manual. Plus **refuse-and-clarify** when ambiguous (tappable options).
  *App composition* (mock NL→chips in fixtures; no live LLM in this prototype — flag as mock).
- **C4 Starter recipes** — tappable cards (B3) as the empty state. *App composition* (FixItCard-like).
- **C5 MatchWall** — THE mechanic. **NEW DS primitive** (`MatchWall`):
  - grid of account tiles (reuse/compact `HealthTile`); excluded tiles **animate out** (DS motion CSS).
  - secondary header "N accounts match"; composition bars (reuse `PillarBar`).
  - per-candidate preview counts on unapplied criteria; grayed-out ghosts for over-narrowing; floor warning.
  - **"Matches now" vs "Likely in 7 days"** split; forecast = translucent ghost tiles + `ConfTag` for
    confidence; **withheld with an honest line when history is thin.**

---

## D. Job (b) closed-loop signal — the honest contract
- **Claim "we tried, it didn't work"** renders ONLY for `triedButFailed()` (high-confidence). Card states
  the targeted pillar didn't move ("Login still flat 2 days after the nudge").
- **Low-confidence / missing** → NO failure claim. Degrade to: *"Workflow ran {N}d ago · outcome not yet
  confirmed"* with the same Call/Email/SMS actions, behind `ConfTag`. We never assert a failure we can't back.
- Inline actions: **Call** (`tel:`), **Email** (`mailto:` / draft), **SMS** (`sms:`) — *NEW small DS
  primitive* `InlineContactActions` (or app composition over Buttons; decide at build by reuse test).
- Production dependency (run-ledger + reliable per-account deltas) is flagged in NEEDS KARTHIK.

---

## E. Spine — link-out, not duplicate
Every Attention tile/card → `/accounts/:id` (Health tab). Attention shows the action-relevant minimum
(account · one-line reason · the action). Full diagnosis lives in Account Detail → Health / AI Insights.
The at-risk signal is the Health-layer selectors' output, consumed verbatim.

---

## F. DS-vs-app classification (initial; confirmed at build by root-cause test)
| Item | Classification | Notes |
|---|---|---|
| `CriterionChip` | **DS** | reusable field→op→value chip; check `AssignmentRuleEditor` first |
| `MatchWall` (+ tile animation, composition, forecast split) | **DS** | the central mechanic; motion tokens live in DS |
| `InlineContactActions` (call/email/sms) | **DS (small)** or app | reuse test |
| Category gate, NL warm-start, starter-recipe cards | **app** | composition over DS primitives |
| Attention page (two jobs), collapsed drawer | **app** | composition; reuse FixItCard / WorkflowHandoff / PlaybookActivation |
| Composition bars, account tiles, confidence tags | **reuse DS** | `PillarBar`, `HealthTile`, `ConfTag` |

Any DS change → push DS → `./sync-ds.sh` → commit+push app, **strictly sequential, one at a time.**

---

## G. Build order (each step = one micro-loop: build → Playwright every state → score → fix → commit)
1. **Data spine:** `criteriaCatalog.ts`, `criteriaMatch.ts`, `recipes.ts`, `attempts.ts` (+ unit-sanity in a scratch route). No UI yet.
2. **MatchWall (DS):** static wall from a recipe → animated narrowing → composition bars → per-candidate counts → floor/ghosts → now/forecast split. Audit each sub-state.
3. **CriterionChip (DS)** + category gate + chip editing (app). Wire chips ↔ MatchWall live.
4. **Starter recipes + NL warm-start + refuse-and-clarify** (app). Empty state → seeded.
5. **Collapsed flow:** rebuild the drawer to `criteria → WorkflowHandoff → Publish (enable) → success`; delete `explain`/`run`.
6. **Attention page:** relabel nav → "Attention"; job (a) rows → new flow; **job (b)** tried-but-failed cards + inline actions + honest fallback; spine link-outs.
7. **Macro loop:** re-traverse every state at 1440 + 390; score against the Standard; fix; final sync + commit.

Playwright states to verify (per build + in the macro loop): criteria empty/seeded · live narrowing ·
per-candidate counts · floor/ghost/zero · now+7-day forecast (high & low confidence) · workflow builder ·
publish/auto-run success · Attention job (a) · job (b) high-conf · job (b) low-conf fallback · Health link-out.
