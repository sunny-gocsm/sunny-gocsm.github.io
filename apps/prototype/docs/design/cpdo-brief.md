# CPDO fidelity contract — Step 1 "Who it runs on" (trigger / segment criteria builder)

> **The one brief an engineer builds straight from.** Synthesises three research dossiers
> (`research/cs-platform-builders.md`, `research/nl-to-filter-ai.md`, `research/filter-controls-ux.md`)
> + the field universe (`gocsm-attribute-filter-catalog.md`) + the design brief
> (`trigger-criteria-builder-redesign.md`) into ONE decisive direction.
>
> **Persona (build relentlessly for him):** overwhelmed, ADHD HighLevel **agency owner**, ~1000
> sub-accounts, NOT technical, NOT analytics-y, gets overwhelmed by dense UI/text/numbers. Wants
> "what do I do next?" with almost no reading. Bar: looks worth **$2,000/mo**, passes the 3-second
> test. **Golden rule: don't make me think — cut before you add. Showing too much is the default
> failure mode.**
>
> Files in scope: `components/attention/CriteriaBuilder.tsx`, `CriterionChip.tsx`,
> `fixtures/criteriaCatalog.ts`, `recipes.ts`, `criteriaMatch.ts`, and `packages/design-system`
> (DS-first, then app; one commit).

---

## 0. The synthesis in one paragraph (the "best of" graft)

**ChurnZero's flat AND-only simplicity** is the default surface — a flat list of plain-English
sentence-chips with one **Match ALL / Match ANY** switch (no letters, no parentheses, ~90% of cases
never leave here). **ChurnZero's populated default + Totango/Catalyst's suggested filters + one-tap
recipes** mean we never open on a void. **Custify/Catalyst's NL on-ramp** is the hero: a multi-line
"describe who this runs on" box that **compiles to editable chips** (HubSpot Breeze's verbatim loop) —
never an oracle, always a draft. **ThoughtSpot's editable, color-coded, verify-in-plain-English tokens**
become our sentence-chips; **Linear's sentence-of-chips with auto-pluralizing plain-word operators** is
the chip grammar; **filter-controls' two-number ranges + relative-first dates** are the value controls.
**Catalyst's live numeric "runs on N accounts" count** (the only verified live counter in the market —
our wedge) sits beside the rules at all times, paired with the existing MatchWall list. Grouping, when
needed, is **visual nested cards** (HubSpot/Notion/Airtable/Zapier model), each card its own ALL/ANY,
one level deep — **never a typed boolean string** (Gainsight's killer footgun). A **plain-English
restatement always sits on top** so the *text stays simple even when the logic is complex.*

**Contested calls, resolved:**
- *Boolean control:* **Yes/No segmented, NOT a toggle.** DS `Toggle` is reserved for live binary
  settings (Carbon/M3 instant-effect rule); a deferred filter value violates that contract, and >50%
  misread a lone toggle's state. Use `SegmentedControl`.
- *Range control:* **two number inputs primary; dual-slider is an optional companion, never alone**
  (Baymard bans slider-only; NN/g: sliders only when the exact value doesn't matter — health/MRR
  thresholds are exact-value decisions). The catalog says "dual-handle slider + min/max"; we **invert
  the emphasis** — inputs are the source of truth, slider is the nicety we may skip in v1.
- *Date control:* **relative-first sentence** (`in the next / in the last / more than … ago`) + quick-pick
  chips + a secondary "Custom range" calendar tab. Our real triggers are relative (`daysBeforeRenewal`,
  `notLoggedInSinceDays`); absolute ranges go stale.
- *Operator surface:* **plain words rendered inline, auto-pluralizing** (`is` → `is any of`), edited by
  tapping the word. Never `>=` / `!=` / a standalone "Operator ▾" select.
- *AI dosage:* **NL compile YES + one-tap recipes alongside YES** (one tap beats a sentence for the
  common single-condition case — the Keyhole research). Streaming compiled chips = optional polish.
- *Field set:* **ship ~24 fields, not the whole catalog.** Cut before you add. ~7 are "common /
  suggested" surfaced first. PAS + raw pillar scores + the fake `healthScore` proxy + velocity/cap
  internals are **never exposed** (catalog §6).

---

## 1. The whole step-1 surface (layout)

Two columns: **left = build the question, right = see the answer.** The right column (live count +
MatchWall) is *always* visible — it's the literal answer to "who does this run on" and the persona's
gut-check ("too broad? empty?").

```
┌───────────────────────────────────────────────────────────────┬──────────────────────────┐
│  Who should this run on?                          [Simple ▸ Advanced] │  ┌────────────────────┐  │
│  Describe it, or start from a template.                              │  │   RUNS ON          │  │
│                                                                      │  │   ┌──────────────┐ │  │
│  ┌──────────────────────────────────────────────────────────────┐  │  │   │     128      │ │  │
│  │  ✦  Describe who this should run on…                          │  │  │   │  accounts    │ │  │
│  │     (multi-line, soft-blue AI hero, auto-grows to ~6 rows)    │  │  │   └──────────────┘ │  │
│  │                                                              │  │  │   (live, updates    │  │
│  └──────────────────────────────────────────────────────────────┘  │  │    on every edit)   │  │
│                                          ⌘↵  [ Build rules → ]       │  │                    │  │
│  We'll turn this into editable rules below — always check them.      │  │  ── MatchWall ──   │  │
│                                                                      │  │  Acme Co     at-risk│  │
│  Try:  [Big at-risk accounts renewing in 30 days]  [Owners gone     │  │  Bright LLC  watch  │  │
│         quiet 21+ days, not using Workflows]  [Health falling fast] │  │  …                  │  │
│                                                                      │  │  ▸ Health  ▰▰▱▱     │  │
│  ─────────────────────────────────────────────────────────────────  │  │  ▸ Plan    ▰▰▰▱     │  │
│                                                                      │  └────────────────────┘  │
│  (Simple-mode rules render here — see §3)                            │                          │
└───────────────────────────────────────────────────────────────┴──────────────────────────┘
```

- The **mode switch** (`Simple` / `Advanced`) is a quiet `SegmentedControl` top-right; Simple is default
  and covers ~90%. Advanced never blocks the simple path.
- The **NL hero** sits above the rules at all times (it's the on-ramp, not a one-shot). The example
  **chips live BELOW the box**, not in the placeholder.
- **Live "runs on N accounts" count** is the biggest number on the right rail; the MatchWall list +
  composition bars stay (they already exist — reuse).

---

## 2. NL hero input spec (`PromptArea`)

A multi-line, auto-growing, soft-blue "AI" hero — the **most actionable thing on screen**, never a faint
ghost box. This replaces the single-line `PromptField` on this surface.

- **Sizing:** `min ~3 rows` (must read as *writable*), **auto-grows up to ~6 rows / max-height**, then
  internal scroll — must never push "Build rules" below the fold (Geist discipline). Implement auto-grow
  yourself (`react-textarea-autosize` or the replicated-value trick) — shadcn/AI-Elements native
  auto-resize is unreliable.
- **Placeholder (short invitation IN the box, ellipsis):**
  > `Describe who this should run on…`
- **Example chips BELOW the field** (tappable; each fills the box; concrete values that teach phrasing).
  A "Try:" eyebrow precedes them:
  > • `Big at-risk accounts (MRR over $1,500) renewing in the next 30 days`
  > • `Owners who haven't logged in for 21+ days and aren't using Workflows`
  > • `Accounts whose health is falling fast`
- **Honest helper line under the box (persistent supporting text — the contract):**
  > `We'll turn this into editable rules below — always check them.`
- **Submit affordance:** a prominent primary **`Build rules →`** button (the ONE solid-blue focal action
  on this surface). **Keyboard model: ⌘/Ctrl+Enter = Build rules, plain Enter = newline** (it's a
  composition box — HIG + Slack/GitHub). Show a quiet `⌘↵` hint by the button. Button is **state-aware:**
  `Build rules` → `Compiling…` → done.
- **Signals "AI" WITHOUT a faint box or a lone sparkle:** the soft-blue accent *surface* + a small mark
  **paired with a label** (the existing `✦`/sparkle is acceptable only *with* the "AI"/"Build rules"
  label — the sparkle is fading industry-wide; never rely on the glyph alone). The honest helper line
  doubles as the capability cue.
- **Compile → editable-rules loop (HubSpot Breeze, verbatim):**
  1. User types/taps a chip → presses **Build rules**.
  2. Compile (prototype: deterministic keyword compiler; production: LLM) **only against the field set in
     §6** — anything off-catalog is named, never invented.
  3. Compiled **editable sentence-chips appear in the Simple builder below**, Match defaulting to **ALL**.
  4. The **plain-English restatement** + the **live count** are the "here's what I understood" + the
     ground-truth check.
  5. **Two correction paths, both live:** re-run the NL box (overwrites the rules) **and** hand-edit any
     chip (surgical). Editing a chip never re-runs the AI.
  - *Optional polish:* **stream / animate the chips in one-by-one** as they compile — nobody in the market
    does it; it's honest and alive. Mark optional.
- **Ambiguity / failure handling (don't silently guess — priority order):**
  1. **Partial parse** — compile the conditions you're confident about, flag the one you're not, let him
     fix just that chip.
  2. **Name the specific problem + tappable options:** *"I don't have a field for 'engagement score' — did
     you mean **Health score** or **Days since last login**?"* (render as 2 buttons).
  3. **Honest empty/failure state with reword coaching, never a dead end:** *"I couldn't turn that into
     rules. Try naming a number and a window — e.g. 'MRR over $1,500, renewing in 30 days'."* Surface the
     example chips again.
  - The current `clarify` state (offering recipe buttons) is the right shape — keep it, upgrade the copy
    to name the problem and offer the catalog-grounded options above.
- **Mandatory honesty gate ("review before relying"):** the persistent helper line is the point-of-use
  disclaimer (beats HubSpot's gap — they only warn on content pages). It must be *at the point of use*,
  specific, and never buried. **AI assists, never auto-commits** — there is no "apply and walk away" path.

---

## 3. Simple mode spec (the default, ~90% of cases)

A **flat list of conditions as plain-English sentence-chips**, joined by **one Match ALL / Match ANY
switch**. This is ChurnZero's flat model + Linear's sentence-chips + the catalog's typed controls.

```
  Match  [ all ▾ ]  of these conditions:                     ← SegmentedControl all|any
                                                               (shown only when ≥2 conditions)

  Accounts where…                                            ← plain-English restatement, always on top
  health is At-risk  AND  renews in the next 30 days  AND  MRR is over $1,500

  ┌─────────────────────────────────────────────────┐
  │ Health band   [ is any of ▾ ]   [At-risk] Watch Healthy Thriving        ✕ │   ← sentence-chip
  ├─────────────────────────────────────────────────┤
  │ Renews        [ in the next ▾ ]  [ 30 ] days     ·  7d  30d  90d         ✕ │
  ├─────────────────────────────────────────────────┤
  │ MRR           [ is over ▾ ]      $ [ 1500 ]                              ✕ │
  └─────────────────────────────────────────────────┘

  [ + Add condition ]                                        ← opens categorized field picker
```

- **Each condition = one `FilterChip` sentence:** field label (locked, the committed interpretation) ·
  **plain-word operator** (tap to change, auto-pluralizes) · **typed value control** (§5). Reads as
  English; the operator is a word, never a symbol.
- **Match ALL / ANY** = a `SegmentedControl` (`all` | `any`), rendered only when there are ≥2 conditions.
  Flipping it is inline and instant — never forces a restructure (avoid Planhat/Vitally's "spin up a new
  group to add an OR" chore).
- **Categorized field picker** (replaces the current 3-way `health/account/user` gate) — use the catalog's
  **7 groups**, with a **"Common" shortlist surfaced first**:
  - `Common / suggested` (the ~7 from §6) · `Health & Risk` · `Engagement & Login` · `Feature adoption` ·
    `Revenue & Billing` · `Account` · `Feedback` · `Users`
  - A **search box** at the top of the picker (type to filter fields) so recall → recognition. Open on the
    `Common` group.
- **Never-blank empty state** (the persona must never face a void):
  - When `criteria.length === 0`, show the **starter recipes** (§7) as one-tap cards **+** a small row of
    **suggested filters** (`Health is At-risk`, `Renewing in 30 days`) à la Totango — both seed a
    fully-formed editable set. The NL hero + example chips are always above.
- **Live "runs on N accounts" count + MatchWall** on the right rail, updating on every edit (`aria-live`
  the count). Keep the existing composition bars + MatchWall — they're the answer-while-you-build.

---

## 4. Advanced mode spec (the quiet manual escape)

**Visible nested condition groups as cards** — each card its own **ALL/ANY**, nestable **one level** →
`(A AND B) OR (C AND D)`. This is the HubSpot list-builder / Notion-Airtable filter-group / Zapier model.
**NEVER a typed boolean expression** (Gainsight's `(A AND B) OR C` over row-letters is the single worst
pattern in the market and silently resets — banned).

```
  Accounts where…                                            ← plain-English restatement, ALWAYS on top
  health is At-risk  AND  ( renews in the next 30 days  OR  a payment failed )

  Match  [ all ▾ ]  of these:                                ← top-level join

  ┌─ Group ────────────────────────────────────────────────┐
  │  Health band   [ is any of ▾ ]   [At-risk]            ✕ │   ← a bare condition at top level
  └────────────────────────────────────────────────────────┘

  ┌─ Group · match [ any ▾ ] ──────────────────────────────┐   ← a nested group, its own ALL/ANY
  │   Renews     [ in the next ▾ ]  [ 30 ] days           ✕ │
  │   Payment    [ is ▾ ]  Failed                         ✕ │
  │   [ + Add condition ]                                   │
  └────────────────────────────────────────────────────────┘

  [ + Add condition ]   [ + Add group ]                       ← group nests ONE level only
```

- **Each group is a visible card** with a faint border + its own **`match all|any` `SegmentedControl`** in
  the header. A group reads as a comprehensible chunk; the **restatement renders the parentheses in
  English** so the *text stays simple even when the logic is complex.*
- **One level of nesting only.** `+ Add group` is available at the top level; inside a group only
  `+ Add condition`. No group-inside-a-group (keeps it un-overwhelming; the persona never has to hold a
  deep tree in his head).
- **Keeping it un-overwhelming for the persona:** the restatement on top means he reads a sentence, not a
  tree; cards are chunked and bordered; max one level; the same plain-word operators and typed controls as
  Simple (nothing new to learn); the live count still answers "who does this hit?". Advanced is a *quiet*
  toggle — never AI-only, never code.
- **Simple ↔ Advanced conversion (no data loss):**
  - **Simple → Advanced:** the flat list becomes **one top-level group** with the Simple ALL/ANY as its
    join. Lossless, reversible.
  - **Advanced → Simple:** allowed **only when the logic is still flat** (single level, all-AND or all-ANY,
    no mixed groups). If the user built genuine nesting, **disable the Simple tab with a quiet inline note**
    ("This rule has groups — editing in Advanced") rather than silently flattening and losing logic. Never
    silently reset (Gainsight's trust-killer).

---

## 5. Per-type value controls

Plain-word operators rendered **inline in the sentence**, **auto-pluralizing**, edited by tapping the word.
Sane defaults so every fresh condition is already a valid, sensible sentence. **Never `>=` / `!=` / symbols.**

**Boolean → Yes/No segmented (NOT a toggle).**
```
  Priority account   [ Yes | No ]            ← SegmentedControl; operator folded into the two segments
```
- Default: the affirmative/common case (`Priority = Yes`, `Failed payment = Yes`). Never start unselected.
- States: default (one selected) · selected · hover · focus-ring · disabled. Each segment ≥44px,
  radiogroup semantics.

**Text → input + autocomplete, default operator `contains`.**
```
  Account name   [ contains ▾ ]  [ Acme____ ]   ← suggestions from real account names as you type
```
- Operators: `contains` (default for names/identity) · `is` · `is not` · `starts with`.
- States: empty (placeholder "e.g. Acme") · typing/loading · suggestions-open · selected · no-results.
  Case-insensitive, trims, parses pasted values — never rejects mid-type.

**Number (single threshold) → input + unit affix + plain-word operator.**
```
  Days since login   [ is more than ▾ ]  [ 21 ] d     ← unit affix removes "21 what?"
```
- Operators: `is more than` · `is less than` · `is at least` · `is at most` · `is exactly`.
- Units: `$` (prefix) · `d` · `%` · `min` · `users` (suffix). `inputmode="decimal"` for money/%.
- Defaults per field (days-since-login `21`, failed payments `1`, MRR via Range below).
- Optional `+/-` steppers only for small integer ranges (≤~20, e.g. consecutive failed payments).

**Range (numeric between) → TWO number inputs primary (slider optional companion).**
```
  Health score   is between  [ 0 ] and [ 60 ]        ← two inputs, source of truth
                 ░░░●─────────────●░░░░               ← (optional) dual-handle slider ABOVE, 2-way bound
```
- Operator `is between` (implicit). **Empty `To` → "is at least"; empty `From` → "is at most"** — quietly
  covers the single-threshold case and auto-relabels the sentence.
- Slider, if shipped: distinct dual handles, no value-on-track-click, `min<max` enforced/auto-swapped,
  each handle a `role="slider"`. **Ship inputs-only in v1 if time-boxed** — the slider is the nicety.
- Defaults: sensible band per field (health "is between 0 and 60" = at-risk; MRR "is over $1,500").

**Date-range → relative-first sentence + quick-picks + Custom-range tab.**
```
  Renews   [ in the next ▾ ]  [ 30 ]  [ days ▾ ]      ·  quick: 7d  30d  90d
                                                       ⟂ "Custom range" tab → calendar (secondary)
```
- Relative control = `[verb: in the next | in the last | more than … ago | within]` · `[number]` ·
  `[unit: days | weeks | months]` — reads as a sentence, no calendar, no date math.
- Quick-pick chips above pre-fill the inline control (one tap for the 80% case).
- Secondary **`Custom range`** tab → calendar with text inputs + 1–2 month grid + presets, for the rare
  exact window. Relative is the default; never freeze a relative rule to an absolute date.
- Defaults: renewal "in the next 30 days"; last login "more than 21 days ago".

**Enum/Select → pills (≤7) else searchable combobox+chips.**
```
  Health band   [ is any of ▾ ]   At-risk  Watch  [Healthy]  Thriving   ← multi: filter chips
  Plan          [ is ▾ ]          [ Pro | Agency | Starter ]            ← single small: segmented
  Features in use  [ is any of ▾ ]  [Workflows ✕] [Email ✕] +2 more  🔍  ← large: search combobox + chips
```
- **Single small (≤6):** segmented pills, one selected. **Multi small:** filter chips (toggleable),
  `is any of` / `is none of`. **Multi large (>7, e.g. features):** searchable combobox — type to filter,
  selected as removable chips in the field, "+N more" badge, dropdown **stays open across picks**,
  Backspace removes last chip.
- Defaults: field-appropriate (Health band → `At-risk` selected; multi-value = implicit OR).

---

## 6. The exact field set to ship (~24 fields)

Grouped, each tagged `control · default operator`. **EXCLUDE every internal field** (PAS, raw pillar
scores `login/revenue/nps/pas_score`, the fake `healthScore` proxy, velocity/cap/guard internals — catalog
§6). **`★` = the ~7 "Common / suggested" shortlist surfaced first.** Tight on purpose — cut before you add.

### Common / suggested (shown first, also the recipe ingredients)
| # | Field | Control · default operator |
|---|---|---|
| 1 | **Health band** ★ | Enum multi · `is any of` → At-risk |
| 2 | **Days since last login** ★ | Number (d) · `is more than` → 21 |
| 3 | **MRR** ★ | Range ($) · `is over` → $1,500 |
| 4 | **Renews within** ★ | Date-range relative · `in the next` → 30 days |
| 5 | **Health trend** ★ | Enum/direction · `is falling` |
| 6 | **Failed payment** ★ | Boolean · `Yes` |
| 7 | **Feature in use** ★ | Enum multi (feature list) · `is none of` (i.e. "not using X") |

### Health & Risk
| Field | Control · default operator |
|---|---|
| Health band ★ | Enum multi · `is any of` → At-risk |
| Health score | Range 0–100 · `is between` → 0–60 |
| Health trend ★ | Enum/direction · `is falling` |
| Risk tags | Enum multi · `is any of` |
| Lifecycle stage | Enum · `is` → onboarding |
| Priority account | Boolean · `Yes` |
| Account status | Enum · `is` → active |

### Engagement & Login
| Field | Control · default operator |
|---|---|
| Days since last login ★ | Number (d) · `is more than` → 21 |
| Login activity status | Enum · `is` → Dormant |
| Active users | Range (users) · `is at most` |
| Total time spent | Range (min) · `is at most` |

### Feature adoption
| Field | Control · default operator |
|---|---|
| Feature in use ★ | Enum multi (Workflows · Email · SMS · Phone · Payments · Funnels · Forms · Reviews · Memberships · …) · `is none of` |
| Feature engagement trend | Enum/direction · `is falling` |
| Feature never used since signup | Boolean (per feature) · `Yes` |

### Revenue & Billing
| Field | Control · default operator |
|---|---|
| MRR ★ | Range ($) · `is over` → $1,500 |
| Spend trend | Enum/direction · `is declining` |
| Lifetime spend | Number/Range ($) · `is over` |
| Plan | Enum multi · `is any of` |
| Plan change | Enum · `is` → downgraded |
| Payment frequency | Enum · `is` → monthly |
| Failed payment ★ | Boolean · `Yes` |
| Renews within ★ | Date-range relative · `in the next` → 30 days |

### Account
| Field | Control · default operator |
|---|---|
| Account name | Text · `contains` |
| Account age | Range (d) · `is at most` |
| Created (GoCSM/GHL) | Date-range relative · `in the last` → 90 days |

### Feedback
| Field | Control · default operator |
|---|---|
| Customer sentiment | Enum · `is any of` → unhappy/neutral |
| Avg rating | Range (0–5) · `is at most` |

### Users
| Field | Control · default operator |
|---|---|
| User role | Enum · `is` → admin |
| Key users only | Boolean · `Yes` |
| User last login / idle days | Number (d) · `is more than` → 21 |

> **Cuts (intentional, off the catalog):** Unique login days, Login frequency, Feature time spent (per
> feature), On-time payment %, Consecutive failed payments, Wallet balance, Next billing date,
> Capabilities, Industry (provisional/unconfirmed), NPS responses (30d), Owner responded, User active,
> Is agency owner. These are analyst-grade or low-frequency for this persona — available later, not in the
> first picker.

---

## 7. Starter recipes (re-seeded from REAL fields — replace the PAS-based set)

6 one-tap templates. Each drops a fully-formed, editable `CriteriaSet`. **Drop every PAS / pillar-score
recipe** (`rec-pas-quiet`, `rec-low-sentiment` as written). New set:

| Recipe | Conditions it sets (Match ALL unless noted) |
|---|---|
| **At-risk & renewing soon** | Health band `is any of` At-risk, Watch **AND** Renews `in the next` 30 days |
| **Big accounts going downhill** | MRR `is over` $1,500 **AND** Health trend `is falling` |
| **Gone quiet** | Days since last login `is more than` 21 |
| **Quiet + not using core features** | Days since last login `is more than` 21 **AND** Feature in use `is none of` Workflows |
| **Payment failed** | Failed payment `Yes` |
| **Slipping engagement** | Feature engagement trend `is falling` **AND** Health band `is any of` Watch, At-risk |

> Recipes double as NL phrasing coaches and as the never-blank empty state. Each keeps its downstream
> `playbookId` mapping (the action half of the flow).

---

## 8. AI dosage decision (explicit)

- **NL compile → editable rules: YES.** The hero. Best for the complex, multi-condition, long-tail request
  the persona can describe faster than he can hunt a picker. Compiles only against §6; lands in the
  editable Simple builder; never auto-commits.
- **One-tap recipes alongside the NL box: YES.** For the common single-condition case, **one tap beats
  typing a sentence** (Keyhole/typing-bottleneck research: a click is ~500ms vs ~5–10s to type). The
  example chips below the box *are* the low-dosage path; recipes are the named shortcuts.
- **Streaming / animating compiled chips in: OPTIONAL.** Nobody in the market does it; it's honest and
  alive. Polish, not a blocker.
- **Where AI must NOT appear:** no AI scoring / sentiment / churn-prediction / next-best-action *inside
  this surface* (that's where every competitor's AI already lives and it would overwhelm). AI's ONE job
  here: **turn a sentence into an editable rule + show who it hits.** No black box, no auto-apply, no
  "confidence %" theater. Direct manipulation (the editable builder) is the precision surface AI drafts
  into.

---

## 9. DS gap list (build-new vs extend-existing)

| Primitive | Status | Action · rough API |
|---|---|---|
| **`PromptArea`** (multi-line NL hero) | **BUILD NEW** (sibling to `PromptField`) | `PromptField` is a single-line `<input>`. New `PromptArea({ value, onValueChange, onSubmit, placeholder, submitLabel, minRows=3, maxRows=6, hint, examples?: {label,fill}[], busy?: boolean })` — auto-grow textarea, soft-blue `.prompt-area` surface, ⌘/Ctrl+Enter submit (Enter=newline), state-aware submit button, helper line, example chips below. Reuse `.prompt-field` visual tokens. |
| **`SegmentedControl`** | **EXISTS — reuse** | `({ options, value, onChange })`. Powers Boolean Yes/No, single-enum pills, Match ALL/ANY, Simple↔Advanced mode switch, and the date-relative verb chip. No change. |
| **`FilterChip`** | **EXISTS — reuse** | `({ label, onRemove, children })` — the sentence-chip shell. Operator + value controls compose as children (Linear partial-edit). No change; the app's `CriterionChip` evolves on top. |
| **`Toggle`** | **EXISTS — do NOT use for filter values** | Reserved for live binary settings (instant-effect contract). Booleans use `SegmentedControl`. |
| **`RangeInput`** (two numbers + unit, optional slider) | **BUILD NEW** | `({ from, to, onChange, unit, min, max, slider?: boolean })` — two `inputmode="decimal"` inputs reading "is between"; empty bound degrades to at-least/at-most; optional dual-handle slider companion (skippable v1). |
| **`DateRelativeInput`** (relative-first date control) | **BUILD NEW** | `({ verb, n, unit, onChange, quickPicks?: number[], mode: "relative"|"custom" })` — verb `SegmentedControl` + number input + unit dropdown + quick-pick chips; secondary "Custom range" calendar tab. |
| **`RuleGroup`** (Advanced nested-group card) | **BUILD NEW** | `({ match, onMatchChange, children, onAddCondition, onAddGroup?, removable })` — bordered card with header `SegmentedControl` (all|any) + `+ Add condition` / `+ Add group`; one-level nesting. |
| **`MultiSelectCombobox`** (searchable, chips) | **BUILD NEW** | `({ options, selected, onChange, searchable, placeholder })` — ARIA combobox, in-field removable chips, "+N more", stays open across picks, Backspace-removes-last. For Enum >7 (features, plans). |

> DS-first, then app, **one commit** (CLAUDE.md non-negotiable). Typography via `fontSize`, never
> `font: var(--t-*)`. One solid-blue focal action (`Build rules`) + soft-blue `.btn-accent` for the rest.

---

## 10. Fidelity contract & out-of-scope

**The implementation must be 100% true to:**
1. **NL hero = `PromptArea`:** multi-line, min ~3 / max ~6 rows auto-grow, soft-blue AI surface (never a
   faint box), short invitation placeholder, **example chips BELOW** (not in placeholder), ⌘/Ctrl+Enter
   submit + Enter=newline, state-aware `Build rules` button, persistent "always check them" helper line.
2. **NL compiles to editable sentence-chips** (HubSpot Breeze loop), only against §6; **never auto-commits**;
   re-run overwrites, chip-edit is surgical; ambiguity is named with tappable options, never silently
   guessed; failure coaches a reword, never dead-ends.
3. **Simple mode = flat sentence-chips + one Match ALL/ANY** `SegmentedControl`; categorized picker with a
   **Common shortlist first** + search; **never a blank empty state** (recipes + suggested filters).
4. **Advanced mode = visible nested **cards**, each its own ALL/ANY, one level deep**; **NEVER a typed
   boolean string**; **plain-English restatement always on top**; lossless Simple↔Advanced (disable Simple
   rather than flatten genuine nesting; never silently reset logic).
5. **Per-type controls exactly as §5:** Boolean=Yes/No segmented (not toggle); Text=input+autocomplete
   default `contains`; Number=input+unit+plain-word op; Range=two inputs primary; Date=relative-first +
   quick-picks + Custom tab; Enum=pills ≤7 else searchable combobox. **Plain-word, auto-pluralizing
   operators; never `>=`/`!=`/symbols.**
6. **The exact field set in §6** (~24 fields, ~7 common) — and **zero internal fields** (PAS, pillar
   scores, `healthScore` proxy, velocity/cap internals). Catalog `criteriaCatalog.ts` re-seeded; the four
   `health.productAdoption/revenue/login/sentiment` pillar fields **deleted**.
7. **Recipes re-seeded from real fields (§7)** — all PAS/pillar recipes removed.
8. **Live "runs on N accounts" count + MatchWall always visible**, updating on every edit (`aria-live`).
9. **The model gains group/nesting** (`criteriaMatch.ts` `CriteriaSet` → support nested groups) for
   Advanced, **without breaking** the flat Simple path.
10. **DS-first, one commit; typography via `fontSize`; one solid-blue focal action.**

**Explicitly OUT of scope:**
- **No real LLM** — keep the **deterministic prototype compiler** (`compileNL`), re-pointed at the §6
  fields. Production-LLM is a later swap behind the same interface.
- **No new backend / live data** — continue over the `Account` fixture model; the catalog is the schema.
- **No second level of nesting** in Advanced (one level only).
- **No AI beyond NL-compile** on this surface (no scoring/sentiment/NBA/confidence-% UI).
- **No dual-slider requirement** — Range ships **inputs-only acceptable in v1**; slider is an optional
  companion, never slider-alone.
- **No saved-segment library / naming UX** in this step (the set already carries an optional `name`;
  full save/reuse is a later flow).
- The cut fields in §6's "Cuts" note are **not** in the first picker.
```
