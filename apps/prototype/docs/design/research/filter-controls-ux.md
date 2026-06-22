# Filter value controls — best-in-class UX dossier

> **Research lens.** The single rule-builder problem: each condition is **field → operator
> → value**. For each VALUE TYPE we pick the input control a non-technical user can set in
> **one tap/drag with zero confusion**. Persona: the overwhelmed, ADHD HighLevel **agency
> owner** — not technical, not numbers-heavy, wants almost no reading. Bar: worth $2000/mo.
> **"Don't make me think."**
>
> Scope: Boolean · Text · Number (single threshold) · Range (numeric between) ·
> Date-range (incl. relative) · Enum/Select (single + multi) · Operator-picker.
> Built 2026-06-22 from primary design-system + usability sources (Baymard, NN/g, UXmatters,
> Polaris, Carbon, Material 3, W3C ARIA APG, Linear/Notion/Airtable teardowns). Adversarially
> verified on the three hard questions: dual-slider-vs-two-inputs, relative dates, large
> multi-select. **Verdicts are at the top of each section.**

---

## Overall principles

1. **The whole condition reads as one plain-English sentence.** The winning pattern across
   Linear, Notion, and Airtable is a sentence assembled from small clickable chips —
   *"Assignee **is** Andreas"* — where field, operator, and value are each editable in place.
   The operator is a word, not a jargon dropdown. This is the spine of every control below.
   (Linear filters; Notion advanced filters.)
2. **Pick the control by the *shape of the answer*, not the data type label.** Yes/no → two
   visible choices. One threshold → one number + unit. A band → two numbers. A moment in time
   → presets first, calendar second. A list → pills if small, search-box-with-chips if large.
3. **Show, don't hide, the choices when they're few.** For ≤5 mutually-exclusive options,
   show them all at once (segmented / pills) — no dropdown, no extra tap (Material 3 segmented
   buttons; Polaris). Collapse into a dropdown only when the list is long.
4. **Always provide a typed fallback for anything imprecise.** Baymard's hard rule: sliders
   for numeric filtering must *always* be accompanied by text inputs. The number is the source
   of truth; the slider is a nicety.
5. **Sane defaults so the control is never empty/ambiguous.** Every freshly-added condition
   pre-fills a sensible operator + value (e.g. "Health band **is** At-risk", "renews **in the
   next** 30 days") so the user edits rather than constructs from nothing.
6. **Restate in words, live.** A plain-English restatement above the rules + a live match
   count is the trust mechanism — it lets a non-technical user verify intent without reading
   the controls. (Carries the §builder brief.)
7. **Touch + a11y are first-class, not an afterthought.** 44×44px minimum hit targets,
   `inputmode` for numeric/decimal keyboards, ARIA combobox semantics, `aria-live` for count
   changes. These are cheap and they're exactly what "don't make me think" needs on a phone.

---

## Boolean

**Recommended pattern: a two-segment "Yes / No" (or "Is / Isn't") segmented control —
*not* a bare on/off toggle.** The operator collapses into the value: there is no separate
operator picker; the two segments *are* "is true" / "is not true".

**Rationale for our persona.** A bare toggle has one visible label and the user must infer
state from color/position — *"wait, is this on or off?"* Research repeatedly finds users
prefer seeing **both** potential states over a single state label, and >1 in 2 mistake a
toggle's on-state for off when the only cue is the thumb position. A segmented "Yes | No"
shows both outcomes, highlights the chosen one, and reads straight into the sentence
("Priority account **is Yes**"). It is one tap, zero inference.

**Why not the toggle (design-system rule).** Carbon and Material 3 both reserve switches for
**binary settings that take effect *instantly*** ("toggles are only for binary actions that
occur immediately after the user flips the switch"). A filter value is *deferred* form state —
it's applied when the rule is saved, not on flip. By the design systems' own criteria the
toggle is the *wrong* component here; a segmented choice (or checkbox-in-a-flow) is correct.
If a toggle is ever used, it must carry an inline label **and** state text (Carbon requires
both), and never put "ON/OFF" text inside the track (deprecated in Material 3).

**Failure modes to avoid.**
- Bare toggle with no state text → "is it on or off?" ambiguity (the #1 toggle failure).
- Defaulting to a meaningful state silently → user can't tell if they set it or it was
  pre-set. Default explicitly and visibly.
- Using a toggle inside a form that needs a Save → violates the instant-effect contract; user
  expects it already took effect.

**Accessibility / touch.** Each segment ≥44×44px. Use a radiogroup (`role="radiogroup"` with
two `role="radio"` segments) so it announces "Yes, selected / No, not selected" and is
arrow-key navigable. High-contrast selected state — never rely on color alone (add weight/fill).

**Spec.**
- **Control:** 2-segment pill, labels `Yes` / `No` (or field-natural `Is` / `Isn't`).
- **States:** default (one segment pre-selected), selected, hover, focus-ring, disabled.
- **Default:** the affirmative/most-common case for that field (e.g. "Priority **Yes**",
  "Failed payment **Yes**"). Never start un-selected.
- **Operator:** none — folded into the two segments.
- **Per-feature booleans** (e.g. "Workflows in use"): same control; when many features, see
  Enum multi-select instead of N separate toggles.

*Sources:* Carbon Toggle usage; Material 3 Switch guidelines; Material 3 segmented buttons;
Setproduct / UX Planet toggle failure-mode write-ups (see Links).

---

## Text

**Recommended pattern: a single text input with *value autocomplete* (type-ahead suggestions
drawn from real data), and a plain-word operator chip in front of it.** Operators read
`is` · `is not` · `contains` · `starts with`.

**Rationale for our persona.** Free text is the hardest thing to get right blind — the user
doesn't know what values *exist*. Autocomplete from real data (account names, owner emails)
turns recall into recognition: they start typing and pick. `contains` should be the **default
operator** for identity fields, because a non-technical user thinks "the ones with *acme* in
the name", not "exactly equal to". Reserve `is` for exact matches when they pick from a
suggestion.

**How leaders do it.** Notion/Airtable/Linear all surface text operators as plain words
(`is`, `is not`, `contains`, `starts with`) and let the value be a free input; where the
column is really a known set, they switch to a pick-list. The lesson: **if real values exist,
suggest them** — only fall back to raw free-text when the space is truly open.

**Failure modes to avoid.**
- No suggestions → user guesses spelling/casing and gets zero matches with no idea why.
- Defaulting to `is` (exact) on a name field → near-always zero results; default to `contains`.
- Case/whitespace sensitivity exposed to the user → match case-insensitively, trim.
- Validating too aggressively while typing → forgiving entry; parse, don't reject.

**Accessibility / touch.** ARIA combobox over the suggestion list (`role="combobox"`,
`aria-expanded`, `aria-controls`, `aria-activedescendant`); suggestions are `role="option"`.
Arrow to navigate, Enter to accept, Esc to dismiss. On mobile, full-width input, list as a
sheet if long.

**Spec.**
- **Control:** text input + async suggestion dropdown (debounced ~150–250ms).
- **Operator chip (in front):** `contains` (default for names/identity) · `is` · `is not` ·
  `starts with`. Clicking the chip swaps the operator (see Operator-picker).
- **States:** empty (placeholder e.g. "e.g. Acme"), typing/loading, suggestions-open,
  selected, no-results ("No matches — searches as you type").
- **Default:** operator `contains`, value empty with a teaching placeholder.
- **Units:** none.

*Sources:* W3C ARIA APG Combobox pattern; Notion advanced filters (text operators); WAI
forgiving-input pattern.

---

## Number (single threshold)

**Recommended pattern: a plain number input with a **unit affix** (suffix or prefix:
`$`, `d`, `%`, `min`, `users`), preceded by a plain-word operator chip
(`is above` · `below` · `at least` · `at most` · `equals`). Stepper arrows optional, not
required.**

**Rationale for our persona.** A single threshold ("days since login **is above** 21") is one
value — typing it is faster and exact than dragging. The **unit affix removes the #1 source of
confusion**: *21 what?* Putting `d` / `$` / `%` right on the field tells the user what's
expected and (on mobile) lets us pop the numeric keyboard. The operator lives as a word in
front, so the sentence reads naturally and the user never sees `>=`.

**Stepper vs plain input.** Steppers help for tiny integer counts (failed payments 0–5) where
tapping +/- beats typing; they hurt for large/continuous values (MRR, days) where you'd tap
forever. Rule: **show steppers only when the realistic range is small (≤~20) and integer**;
otherwise plain input. Always keep the field directly typeable even when steppers are present.

**Where the operator lives.** *Not* baked into the field — it's the plain-word chip in front
(`is above`, `at least`). This keeps one consistent operator affordance across all numeric
fields and avoids a `>` / `≥` jargon dropdown.

**Failure modes to avoid.**
- No unit → "21" is meaningless; user can't tell days from dollars from percent.
- `inputmode="numeric"` only → some iOS keypads lack a decimal point; use
  `inputmode="decimal"` for money/percent.
- Rejecting pasted "$1,500" → parse and strip formatting; don't error.
- Spinner-only with no typing → painfully slow for big numbers.

**Accessibility / touch.** Affix must not be read as part of the value by screen readers —
put the unit in the visible label/`aria-describedby` ("Days since login, days"). Stepper
buttons ≥44×44px with `aria-label` ("increase"). Numeric keyboard via `inputmode`.

**Spec.**
- **Control:** number input + unit affix; optional +/- steppers for small integer ranges.
- **Operator chip:** `is above` · `is below` · `is at least` · `is at most` · `equals`
  (default per field, usually `is above` for "days since login", `is at least` for counts).
- **Units catalog:** `$` (prefix), `d` (days), `%`, `min`, `users` — suffix except currency.
- **States:** empty (placeholder shows a realistic example, e.g. "30"), valid, invalid
  (inline, non-blocking), focus, disabled.
- **Defaults:** sensible per field (e.g. days-since-login default `21`, failed payments `1`).

*Sources:* UXmatters numeric-filter best practices; UX Patterns currency-input;
WAI input-format / `inputmode` guidance.

---

## Range (numeric between)

> **VERDICT (adversarially verified): two number inputs are primary; the dual-handle slider
> is an optional companion *on top of* the inputs — never the slider alone.** For a
> non-technical user setting precise thresholds (health 0–100, MRR $, minutes), the inputs win.

**The evidence (this question is settled).**
- **NN/g:** sliders work *only* when "the specific value does not matter" and an approximate
  value is fine; "whenever the exact value matters, sliders are not okay." Health-score and
  MRR thresholds are exact-value decisions → not a slider's job.
- **Baymard:** sliders for numeric filtering must **always** be accompanied by text input
  fields as a fallback; and **>50% of test subjects misinterpreted dual-point range sliders**
  as single-point (tried to click a value instead of dragging a handle). 83% of slider sites
  also use a wrong (linear) scale on clustered data.
- **UXmatters:** dual sliders bias users into *over-constraining from both ends* (narrower
  results than intended) and hide how many items exist at each point — only acceptable when
  paired with a histogram/sparkline of availability.
- **Touch/motor a11y:** sliders demand fine motor control (NN/g flags arthritis/tremor);
  dragging a precise pixel on a phone is error-prone. Two inputs are tappable and exact.

**So our recommendation:** **two labeled number inputs — `From` [min] · `To` [max] — with the
shared unit affix, read as "is between X and Y".** Offer a dual-handle slider *above* them
only where approximate exploration genuinely helps (e.g. health 0–100) — and then the inputs
stay the source of truth and update the handles two-way. If we ship the slider, it must: have
visually distinct dual handles, not set values on track-click (show "drag the handles"
guidance), keep min<max enforced, and ideally show a count/availability hint.

**Rationale for our persona.** "Between 0 and 60" typed in two boxes is unambiguous and exact;
a dual slider invites the "is this one knob or two?" confusion that half of users hit. The
inputs also degrade gracefully — leaving `To` empty becomes "at least X", leaving `From` empty
becomes "at most Y", which quietly covers the single-threshold case too.

**Failure modes to avoid.**
- Slider-only (no inputs) → imprecision + the dual-handle misread; **banned by Baymard.**
- Linear scale on clustered values (MRR) → handle is hypersensitive at the bottom.
- Letting min exceed max → clamp/auto-swap and surface inline.
- Click-on-track sets a value on a *dual* slider → users expect single-point behavior; suppress.

**Accessibility / touch.** Each input ≥44px tall, `inputmode="decimal"`, unit in label. If a
slider is present: each handle is a `role="slider"` with `aria-valuemin/max/now`,
`aria-label` ("Minimum", "Maximum"), full keyboard (arrows = step, PageUp/Down = big step,
Home/End = bounds), and a 44px touch target around each handle.

**Spec.**
- **Control:** `From` input · "and" · `To` input, both with unit affix; optional dual-handle
  slider above, two-way bound.
- **Operator:** `is between` (implicit). Empty `To` → "is at least"; empty `From` → "is at
  most" (auto-relabel the sentence).
- **States:** empty, valid, min>max (auto-corrected + hint), focus per field, disabled.
- **Defaults:** sensible band per field (e.g. health "is between 0 and 60" for at-risk).
- **Units:** `$` / `%` / `min` / `users` / `d`, shown on both inputs.

*Sources:* NN/g "Slider Design: Rules of Thumb"; Baymard "5 requirements for slider
interfaces"; UXmatters numeric filters; Smashing "Designing the Perfect Slider."

---

## Date-range (incl. relative)

> **VERDICT: lead with a *relative* control for our time-anchored fields; offer absolute
> calendar as a secondary tab. The clearest relative UI is a plain-language inline sentence:
> a verb segment + a number stepper + a unit dropdown** — `[in the next | in the last | more
> than … ago] [ 30 ] [ days | weeks | months ]` — *plus* a row of quick-pick chips for the
> 3–4 most common windows.

**Why relative-first for us.** The real triggers are inherently relative — `daysBeforeRenewal`,
`notLoggedInSinceDays`. A non-technical owner thinks "renewing **in the next 30 days**" and
"hasn't logged in for **21+ days**", not "between 2026-06-22 and 2026-07-22". A relative rule
also *stays correct over time* (it re-evaluates against "today"); an absolute range silently
goes stale — exactly the HubSpot complaint where saved "Today" froze to a fixed date.

**The clearest "next/last N days" UI (recommended).** An inline natural-language control:
1. **Direction verb** — a small segmented/dropdown chip: `in the next` · `in the last` ·
   `more than … ago` (and, for renewals, `within`). This *is* the operator, in words.
2. **Number** — a small stepper-backed input (`30`), typeable.
3. **Unit** — a tiny dropdown: `days` · `weeks` · `months`.

Read end-to-end it is a sentence: **"Last login is more than 21 days ago."** No calendar, no
jargon, one line. Quick-pick **chips above it** (`7 days` · `30 days` · `90 days`) cover the
~80% case in a single tap and pre-fill the inline control when tapped — chips for speed, the
inline control for the long tail. (This mirrors GA4/Amplitude "Last N days" and Polaris's
"date list" preset pattern; Amplitude explicitly ships a custom "Last N days".)

**Why the inline `[N] [unit]` control beats chips-only.** Fixed chips can't express "21 days"
or "in the next 45 days"; the explicit number+unit handles any value while staying readable.
Why it beats a raw calendar for relative intent: a calendar forces the user to *compute* the
date, which is exactly the thinking we're trying to remove.

**Absolute calendar (secondary).** Keep a tab/toggle to **"Custom range"** for the rare exact
window. Best practice for that mode: a text input *plus* the calendar (Polaris — typing is the
escape hatch, the calendar gives weekday/relationship context); show the **range across one or
two months** so start↔end relationship is visible; default the calendar to the current month;
list common presets (Today, Yesterday, Last 7/30/90 days, This month) down the side a la GA4.

**Failure modes to avoid.**
- "Last N days" silently excluding today, or freezing a relative value to an absolute date on
  save → the two top HubSpot complaints. Be explicit ("last 30 days, including today") and keep
  relative rules relative.
- Calendar-only for relative intent → forces date math.
- Two free-typed date fields with ambiguous format (MM/DD vs DD/MM) → always pair with a
  calendar and show the resolved date.
- Hiding the relative mode behind the calendar → most of our cases are relative; surface it first.

**Accessibility / touch.** The inline control is three labeled fields (verb listbox, number
input `inputmode="numeric"`, unit listbox) — fully keyboard/AT navigable and far more
touch-friendly than a calendar. Quick chips ≥44px. Calendar grid: `role="grid"`, arrow-key day
navigation, announce selected range, focus management on open.

**Spec.**
- **Modes:** `Relative` (default) | `Custom range` (calendar), as a quiet 2-tab switch.
- **Relative control:** `[verb: in the next | in the last | more than … ago | within]`
  · `[number]` · `[unit: days | weeks | months]`. Quick chips: `7d · 30d · 90d` (+ field-apt).
- **Calendar:** text inputs + 1–2 month grid + preset list; default current month.
- **Operators (mapped):** before · after · between · **in the next N days** · **in the last N
  days** · **more than N days ago**.
- **Defaults:** per field — renewal "in the next **30** days"; last login "more than **21**
  days ago".
- **States:** mode-relative, mode-custom, value-set, empty, invalid, focus.

*Sources:* Polaris date-picking patterns (date list vs date range); GA4 / Amplitude
relative ranges; HubSpot relative-date community threads (failure modes); Evolving Web date-filter
pattern guide.

---

## Enum / Select (single + multi)

> **VERDICT: small fixed sets → show them all as pills (segmented for single-select, filter
> chips for multi). Large sets → a search/autocomplete combobox with selected items as
> removable chips inside the field.** The cut-over is roughly **≤5–7 options = pills,
> beyond that = searchable combobox.**

**Single-select, small set (band, lifecycle, plan tier, frequency).**
- **Pattern:** **segmented control / pills, all options visible**, one selected. (Material 3:
  segmented buttons for 2–6 mutually-exclusive options; don't exceed 5; collapse to a dropdown
  only if longer.) One tap, no menu, no "open → scan → pick" overhead — ideal for our persona.
- **Operator:** `is` / `is not`, as a plain-word chip in front (rarely needed for single).

**Multi-select, small set (health band: thriving/healthy/watch/at-risk; risk tags).**
- **Pattern:** **filter chips** — each option a toggleable pill; selected ones fill in. Chips
  (vs a segmented control) *signal multi-select* because they're visually separate (Material 3).
  Reads "Health band **is any of** Watch, At-risk."

**Multi-select, large set (features list, plans, sentiment across many).**
- **Pattern:** **searchable multi-select combobox** — a text field you type into to filter,
  matching options in a dropdown, **selected values shown as removable chips/tokens inside the
  field**. Use search once the list exceeds ~10; with 200+ options, search is essential and
  virtualize.
- **Chips vs count badge:** show the first 2–3 chips inline, then a **"+N more" count badge**
  so the field never explodes. Badge carries an accessible label listing the hidden ones.
- **Select all:** offer "Select all (12)" as the first row with a separator when users commonly
  want everything; a second click clears.
- **Counts:** show option counts where cheap ("Workflows (142)") so the user sees consequence.

**Rationale for our persona.** For a handful of options, *making them choose from a list they
can see* is faster and lower-anxiety than opening a dropdown. For a long list (features), recall
fails — a search box that filters as they type + chips they can see and ×-remove is the lowest-
effort path. Keeping the dropdown **open** across multiple picks (don't close per selection)
matches how a human batches "Workflows, Email, SMS" in one go.

**Failure modes to avoid.**
- Native `<select multiple>` (Ctrl+click) → unusable; never.
- Closing the dropdown after each pick → forces re-open per item; keep open until Esc/outside.
- Segmented control for multi-select → implies exclusivity; users think only one can be on.
- Long pick-list with no search → endless scroll.
- Selected chips with tiny × hit targets → can't remove on touch.

**Accessibility / touch.** ARIA combobox + listbox: `role="combobox"` (input,
`aria-expanded`, `aria-haspopup="listbox"`, `aria-controls`); dropdown `role="listbox"`
`aria-multiselectable="true"`; options `role="option"` `aria-selected`. Track focus with
`aria-activedescendant`; announce count via `aria-live="polite"`. **Backspace on empty input
removes the last chip** (two-step: first focuses it, second removes). Each chip's × has
`aria-label="Remove [item]"` and a ≥44×44px target. On mobile, consider a bottom-sheet picker.

**Spec.**
- **Single small (≤6):** segmented pills, one selected; default = most common value.
- **Multi small:** filter chips, 0–N selected; "is any of / is none of" operator chip.
- **Multi large:** search input + filtered listbox + in-field removable chips + "+N more"
  badge + optional "Select all".
- **States:** closed (placeholder / chips), open/searching, no-results, option focused,
  selected, disabled.
- **Defaults:** field-appropriate (e.g. Health band defaults to "At-risk" selected).
- **Operators:** `is` · `is not` (single) · `is any of` · `is none of` (multi).

*Sources:* W3C ARIA APG Combobox; UX Patterns multi-select-input; Material 3 segmented buttons
& chips; Mantine/Ark/Radix multiselect combobox docs; Smashing "Combobox vs Multiselect vs
Listbox."

---

## Operator-picker

> **VERDICT: the operator is a *plain English word rendered inline in the sentence*, edited by
> tapping it — a tiny inline dropdown of plain words. Never a separate jargon dropdown, never
> symbols (`=`, `>`, `≥`, `!=`). And it auto-adapts to the value(s).** This is the single most
> important "don't make me think" decision in the builder.

**The gold standard (Linear).** A filter is a sentence with three clickable parts: **field
(fixed) · operator (clickable word) · value(s) (clickable)**. *"Assignee **is** Andreas."* Tap
`is` → it becomes `is not`. Crucially, **the operator auto-pluralizes with the value**: add a
second assignee and `is` → `is either of`; for label-like fields you get `includes any / all /
neither / none`; for dates `before / after`. The user mostly never opens the operator at all —
the system picks the right plain word from what they did.

**Why this works for our persona.** It removes a whole vocabulary problem. The user reads a
sentence, not a form. There's no moment of "what does `≥` mean" or "is `contains` the one I
want" — the default is right ~90% of the time, and when they do want to flip it, the choices
are words they already use (`is` / `is not` / `is more than` / `is between`). It also unifies
*all* the controls above: every type's operator is the same tiny inline word-chip.

**Plain-word mapping (use these exact words, never symbols):**
- Boolean → folded into Yes/No (no visible operator).
- Text → `is` · `is not` · `contains` · `starts with`.
- Number → `is more than` · `is less than` · `is at least` · `is at most` · `is exactly`.
- Range → `is between` (auto-degrades to `is at least` / `is at most` when one bound empty).
- Date → `before` · `after` · `is between` · `in the next … days` · `in the last … days` ·
  `more than … days ago`.
- Enum single → `is` · `is not`. Enum multi → `is any of` · `is none of`.

**Should it be inline-dropdown, segmented, or implied?**
- **Implied** wherever possible (Boolean via Yes/No; Range via "between"; multi via "any of").
- **Inline word-dropdown** (tap the word → short menu of plain alternatives) for Text/Number/
  Date where a couple of operators genuinely differ in meaning. Keep the menu to 3–5 items.
- **Never** a standalone labeled "Operator ▾" select sitting beside the field — that's the
  jargon-form pattern we're replacing.

**Failure modes to avoid.**
- Symbols/programmer operators (`>=`, `!=`, `LIKE`) → instant cognitive load; banned.
- Operator detached from the sentence ("Field | Operator | Value" as three equal columns) →
  reads like SQL, not English.
- Not auto-adapting to multi-value → user picks two values but operator still says singular
  "is", producing wrong logic silently.
- Too many operator choices in the menu → analysis paralysis; curate to the few that matter.

**Accessibility / touch.** The operator chip is a button opening a small menu (`aria-haspopup`,
`aria-expanded`); options are a plain list, arrow-navigable, ≥44px. Announce the assembled
sentence; the live plain-English restatement above the rules doubles as the screen-reader
summary.

**Spec.**
- **Control:** inline clickable word inside the condition sentence; tap → small plain-word menu.
- **Behavior:** default operator pre-selected per field/type; **auto-switch singular↔plural**
  when value count changes (1 value → "is", 2+ → "is any of").
- **States:** default word, hover, open menu, focus.
- **Defaults:** the most common operator per field (Text→`contains`, Number→`is more than`,
  Date→`in the last … days`, Enum→`is any of`).

*Sources:* Linear Filters docs (sentence model + auto-pluralizing operators); Notion advanced
filters; Airtable filter operators; UXPin filter UI best practices.

---

## Dos & Don'ts

**Do**
- Render every condition as a **plain-English sentence** of tappable chips (field · operator ·
  value). Make the operator a **word**, defaulted right, auto-adapting to the value.
- **Prefer two number inputs over a dual slider** for ranges; if a slider appears, it's a
  companion *on top of* the inputs, never alone.
- **Lead with relative dates** (`in the last N days`) via an inline verb + number + unit, with
  quick-pick chips on top; keep an absolute calendar as a secondary "Custom range" tab.
- **Show all options for small enums** (segmented pills / filter chips); **switch to a search
  combobox with removable chips** past ~7 options.
- Put a **unit affix** ($, d, %, min, users) on every number; use `inputmode="decimal"` for
  money/percent.
- Use **Yes / No segmented** for booleans (both states visible), not a bare toggle.
- Give **sane defaults** so a new condition is already a valid, sensible sentence.
- Keep multi-select dropdowns **open across picks**; support **Backspace-to-remove-last-chip**.
- Hit targets **≥44×44px**, full ARIA combobox/slider/radiogroup semantics, `aria-live` counts.

**Don't**
- Don't expose **programmer operators or symbols** (`>=`, `!=`, `LIKE`, `=`).
- Don't ship a **dual-handle slider with no number inputs** — >50% misread it; Baymard bans it.
- Don't use a **bare toggle** for a deferred filter value (wrong per Carbon/Material's
  instant-effect rule) or put ON/OFF text inside the track.
- Don't make the user **compute a date** when they mean "the last 30 days"; don't let a saved
  relative filter **freeze to an absolute date**.
- Don't use a **segmented control for multi-select** (implies exclusivity) or
  `<select multiple>` (Ctrl-click is unusable).
- Don't default a **text/name filter to exact `is`** — default to `contains`.
- Don't show a **long enum with no search**, or **close the dropdown after every pick**.
- Don't leave a number **without a unit**, or reject pasted formatted values ("$1,500").

---

## Links (primary sources)

- NN/g — Slider Design: Rules of Thumb: https://www.nngroup.com/articles/gui-slider-controls/
- NN/g — Sliders, Knobs, and Matrices: https://www.nngroup.com/articles/sliders-knobs/
- Baymard — 5 Requirements for Slider Interfaces: https://baymard.com/blog/slider-interfaces
- UXmatters — Numeric Filters: Issues and Best Practices: https://www.uxmatters.com/mt/archives/2010/02/numeric-filters-issues-and-best-practices.php
- Smashing — Designing the Perfect Slider: https://www.smashingmagazine.com/2017/07/designing-perfect-slider/
- Carbon — Toggle usage: https://carbondesignsystem.com/components/toggle/usage/
- Material 3 — Switch guidelines: https://m3.material.io/components/switch/guidelines
- Material 3 — Segmented buttons: https://m3.material.io/components/segmented-buttons/guidelines
- Material 3 — Chips: https://m3.material.io/components/chips/guidelines
- Polaris — Date picking patterns: https://polaris.shopify.com/patterns/date-picking
- Polaris — Date picker component: https://polaris.shopify.com/components/selection-and-input/date-picker
- Evolving Web — Date filter UI patterns: https://evolvingweb.com/blog/most-popular-date-filter-ui-patterns-and-how-decide-each-one
- Amplitude — Event Segmentation / Last N days: https://help.amplitude.com/hc/en-us/articles/360052734691
- HubSpot — Relative date filter community thread (failure modes): https://community.hubspot.com/t5/HubSpot-Ideas/Filter-using-relative-date-values-quot-TODAY-quot-etc/idi-p/5453
- Linear — Filters docs (sentence model + operators): https://linear.app/docs/filters
- Notion — Using advanced database filters: https://www.notion.com/help/guides/using-advanced-database-filters
- W3C ARIA APG — Combobox pattern: https://www.w3.org/WAI/ARIA/apg/patterns/combobox/
- UX Patterns — Multi-select input: https://uxpatterns.dev/patterns/forms/multi-select-input
- UX Patterns — Currency input: https://uxpatterns.dev/patterns/forms/currency-input
- Smashing — Combobox vs Multiselect vs Listbox: https://www.smashingmagazine.com/2026/02/combobox-vs-multiselect-vs-listbox/
- Mantine Combobox: https://mantine.dev/core/combobox/ · Ark UI Combobox: https://ark-ui.com/docs/components/combobox · Radix Select: https://www.radix-ui.com/primitives/docs/components/select
- WAI — Accept different input formats: https://www.w3.org/WAI/WCAG2/supplemental/patterns/o4p08-input-formats/
- UXPin — Filter UI best practices: https://www.uxpin.com/studio/blog/filter-ui-and-ux/
