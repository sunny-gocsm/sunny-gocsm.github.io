# Design brief — Trigger criteria builder ("Who it runs on", step 1)

> Active brief for the design-loop. The surface is **step 1 of the Attention activation
> wizard** (`apps/prototype/src/components/attention/AttentionActivation.tsx` →
> `CriteriaBuilder.tsx`). Persona: the overwhelmed, ADHD HighLevel agency owner. Bar: looks
> worth $3k/mo, passes the 3-second test, "don't make me think."

## The problem (user's own words, 3 complaints)
1. **The NL input is too small.** It's a single-line `PromptField` (`<input>`). It must read
   as something you can *write in* — a **multi-line** box.
2. **No guidance.** It needs **placeholder text** that teaches how to phrase a request.
3. **The wizard rule-setup is weak.** Wants a real **rule engine** with **AND / OR**
   composition, and the experience **drastically simplified** — with **Simple** and
   **Advanced** modes. Advanced = build sophisticated nested logic, but the *text stays
   simple*.

## What to build

### 1. Hero NL input (multi-line)
- Replace the single-line `PromptField` with a **multi-line auto-growing textarea** (min ~3
  lines), still the inviting soft-blue "AI" hero treatment (not a faint box). Submit via a
  prominent "Build rules" button (Cmd/Ctrl+Enter; plain Enter = newline).
- **Placeholder** that teaches by example, e.g.:
  > Describe the accounts to target, in plain English. For example:
  > "Big accounts (MRR over $1,500) that are at-risk and renewing in the next 30 days"
  > or "Owners who haven't logged in for 21+ days and aren't using Workflows."
- Keep the honest "compiles into editable rules below — always check them" note. Compiles
  into the builder below (prototype: deterministic; real: LLM).

### 2. Rule engine — Simple & Advanced
- **Simple (default):** flat list of conditions + one **Match ALL / Match ANY** switch.
  Add-condition via a field picker grouped by category (Health & Risk · Engagement & Login ·
  Feature adoption · Revenue & Billing · Account · Feedback · Users).
- **Advanced:** **nested AND/OR rule builder** — condition groups, each with its own AND/OR,
  nestable one level → `(A AND B) OR (C AND D)`. "+ Condition" / "+ Group" actions.
- A **plain-English restatement** sits above the rules at all times ("Accounts where health
  is at-risk **AND** (renews within 30 days **OR** a payment failed)"). A **live match
  count / MatchWall** updates as rules change (keep the existing right-rail preview).
- Mode is a quiet toggle; Simple covers ~90% of cases, Advanced never blocks the simple path.

### 3. Typed filter controls (one per filter type)
Each condition is field → operator → value, rendering the **right control for its type**:
- **Boolean** → toggle. **Text** → input + autocomplete. **Number** → stepper + unit suffix.
- **Range** → dual-handle slider + min/max inputs. **Date range** → picker with absolute +
  **relative** ("in the next/last N days", "more than N days ago").
- **Enum/Select** → segmented pills (small sets) or searchable multi-select (large sets),
  values autocompleted from real data.

### 4. Real fields, real values
Use the **user-facing attribute catalog** — see
[`gocsm-attribute-filter-catalog.md`](./gocsm-attribute-filter-catalog.md) for the full set,
filter types, and source mapping. **Hard constraint: never expose PAS or the raw pillar
scores** (Product-Adoption / Revenue / Login / NPS as 0–100) or any §6 internal field. Expose
Health Band / Health Score / trend, lifecycle, priority, and the observable drivers (feature
usage, logins, NPS responses, MRR/spend, payments, renewals). Replace the current
`criteriaCatalog.ts` field set + recipes accordingly (drop `health.productAdoption (PAS)`,
`health.revenue/login/sentiment` pillar-score fields; add the catalog's observable fields).

## Files in scope
- `apps/prototype/src/components/attention/CriteriaBuilder.tsx` — the step-1 surface.
- `apps/prototype/src/components/attention/CriterionChip.tsx` — evolve into typed controls.
- `apps/prototype/src/fixtures/criteriaCatalog.ts` + `recipes.ts` + `criteriaMatch.ts` —
  re-seed from the real catalog; add group/nesting to the model for Advanced mode.
- `packages/design-system` — new/updated primitives: multi-line PromptField (or new
  `PromptArea`), Range slider, Date-range picker, rule-group container. DS-first, then app.

## Non-negotiables (carry over)
Typography uses `fontSize` not `font: var(--t-*)`; one solid-blue focal action + soft-blue
`.btn-accent`; reuse DS primitives; DS + app land in one commit; gate on a Playwright
dual-lens audit (CDO + first-time HighLevel agency owner). See `apps/prototype/CLAUDE.md`.
