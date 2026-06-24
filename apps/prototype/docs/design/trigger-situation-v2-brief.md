# CPDO synthesis — Situation rename + two-mode trigger + top restatement (v2)

> Design-loop run, 2026-06-24. Three workstreams from Karthik's feedback. Synthesises three
> fresh dossiers (audience/trigger-builder UX · urgency vocabulary · AI-readiness) against the
> **prior shipped contract** `cpdo-brief.md` (this is a *delta*, not a replacement) and the
> GoCSM profile. Persona: overwhelmed, ADHD, non-technical HighLevel agency owner — "what do I
> do next?", almost no reading, must look worth $2,000/mo. **Cut before you add.**

## Load-bearing research findings
- **Only "At risk" and "Watch" actually collide** with the Health bands (Thriving/Healthy/Watch/At-Risk).
  Worse: those are **coined, gated Tier-2 vocab** that must NEVER show on a Phase-1 surface — and the
  Playbooks marketplace IS Phase-1. So the rename is a correctness fix, not cosmetics. "Critical" is
  collision-free (worst Health band is "At-Risk", not "Critical") → keep it.
- **A live plain-English restatement at the TOP is an unoccupied space** — no surveyed tool (Mailchimp,
  Klaviyo, Totango, HubSpot, Salesforce, Gainsight, Notion, Linear, Zapier) and **not even HighLevel**
  shows non-technical users a generated sentence of their rule. This is our differentiator.
- **Simple = curated prebuilt picks** (Mailchimp pre-built segments, Totango suggested filters), with a
  live match feel. **No AI in Simple.**
- **Advanced = NL-in → editable rules** (Klaviyo/Twilio/HubSpot all put NL *in*, never as a black box) +
  the boolean rule builder, same field→operator→value rows. NL drops results into the editable builder.
- **Mode switch must be non-destructive.** Carry Simple selections into Advanced. Never silently reset
  logic (Gainsight's documented data-loss bug).
- Red→green is **not** colorblind-safe → diverge warm-bad → neutral → cool-good, and **always pair the
  dot with a text label** (we already always render the label).

---

## WS1 — Rename the Playbooks "Situation" bands (no Health-vocab reuse)
Keep the field internally (`signal`) and the facet header **"Situation"** (neutral, spans bad→good,
no collision; "Urgency" rejected — it frames the positive end as merely "low urgency"). Relabel the
five bands to plain, single words (scannable in the rail + card pill), keeping **Critical**:

| value (unchanged) | OLD label | NEW label |
|---|---|---|
| `critical` | Critical | **Critical** |
| `atrisk` | At risk → *collides* | **Slipping** |
| `watch` | Watch → *collides* | **Steady** |
| `positive` | Positive | **Strong** |
| `verypositive` | Very positive | **Booming** |

> Karthik floated "Urgent" for the 2nd band; "Slipping" wins for the build because Critical+Urgent
> both read as top-severity (which is worse?), whereas Critical › Slipping › Steady is a clean ladder.
> **Offer "Urgent" as the alternative at the final gate** — labels are centralised in `SIGNAL_LABEL`,
> a one-line swap. (Internal `PlaybookSignal` values stay `critical|atrisk|watch|positive|verypositive`
> to avoid a data churn; only display strings change.)

**Colors** — diverging warm→neutral→cool, label always present:
`Critical #c73a26 · Slipping #ea580c · Steady #6b7280 (neutral) · Strong #2f9e1b · Booming #137a52`.
(Steady moves from amber to a neutral grey so the middle reads as "neither".)

Scope: `fixtures/playbooks.ts` (SIGNALS/SIGNAL_LABEL), `pages/PlaybooksPage.tsx` (pill + facet),
`app-overrides.css` (`.mk-sig*` colors).

---

## WS2 — Collapse to TWO modes on the "When & who it runs on" step
Today there are effectively three (TriggerStep's narrowing view → "Customize advanced" → CriteriaBuilder
Simple → Advanced). Target: **Simple** and **Advanced**, one toggle, governing the whole narrowing body.
The chain `AttentionActivation → TriggerStep → CriteriaBuilder` is self-contained — refactor freely.

**Shell (both modes), single centered column:**
1. **Block A (keep):** "Runs automatically when «baked-in trigger»." — the play's built-in trigger, a fact.
2. **"Who it runs on"** header + **live restatement subtitle** (WS3).
3. **Simple | Advanced** `SegmentedControl` (Simple default).
4. Mode body (below).
5. **Live "N of your accounts match right now"** count band (keep). MatchWall only when Health configured.

**Simple mode (default, no AI):** a **curated prebuilt criteria list** — one-tap quick-add chips,
lightly grouped, all **HL-native (Phase-1 safe, zero health.* fields)**. Provisional v1 set (exact
"most important" set is a SEPARATE exercise — flag in copy + brief):
- *Account:* Priority account · Plan · Signed up in last 30 days · MRR over $1,500
- *Engagement:* Gone quiet 21+ days
- *Billing:* Payment failed · Renews in 30 days
- *Users:* User role · Key users only

Tapping adds a fully-formed **editable** `CriterionChip` (reuse `makeCriterion` defaults +
`.cb-suggested-chip`). Below: the current chips + **Match all/any** (≥2). This REPLACES TriggerStep's two
hardcoded dropdowns. A quiet "More conditions →" still opens the full categorized field picker.

**Advanced mode:** the **NL `PromptArea`** ("Describe who this runs on — we'll draft the rules") ABOVE +
the **nested-group rule builder** (`RuleGroup` + `CriterionChip` + FieldPicker, one level). NL compiles to
editable chips (keep deterministic `compileNL`), never auto-commits.

**Non-destructive toggle:** same `set` underlies both, so Simple→Advanced carries chips in; Advanced→Simple
stays disabled when genuine nesting exists (keep existing `isAdvanced` guard + quiet note). Never flatten/reset.

Scope: rewrite `components/attention/TriggerStep.tsx` (the 2-mode shell) + refactor
`components/attention/CriteriaBuilder.tsx` (mode-driven body: Simple quick-add list, Advanced NL+groups;
drop its own title/sub/mode-toggle/restatement). CSS in `app-overrides.css`.

---

## WS3 — Plain-English restatement: promote to the top, remove from the body
- The generic, identical-for-every-play subtitle (`cb-sub` "Pick the signal that triggers it…") is replaced
  by the **live restatement** as the section subtitle: `describeSet(set)` rendered as one readable sentence
  with the variable parts in bold. Empty state teaches: **"Runs on everyone who matches — add a filter below
  to narrow it (optional)."** End the line with the live count is handled by the count band just under it.
- **Remove** the standalone `.cb-restate` "In plain English" block from the builder body (it appears once,
  at the top, now).
- Click-to-edit on bolded chips = noted future polish; v1 ships the clean bold sentence (cut before you add).

Scope: `TriggerStep.tsx` (subtitle), `CriteriaBuilder.tsx` (remove `cb-restate`), `app-overrides.css`.

---

## Fidelity contract (what the build must be true to)
1. No Health-band words anywhere on the Playbooks surface; bands = Critical · Slipping · Steady · Strong · Booming.
2. Exactly two modes; Simple = prebuilt list (no AI); Advanced = NL box + rule builder.
3. One live restatement, at the top, as the section subtitle; none duplicated in the body.
4. Non-destructive mode switch; never reset logic (Gainsight anti-pattern).
5. Reuse existing DS primitives (no DS change needed: `PromptArea`, `RuleGroup`, `SegmentedControl`,
   `FilterChip`/`CriterionChip` all exist). Typography via `fontSize`. One solid-blue focal action.
6. Phase-1 safe: the Simple prebuilt set contains zero gated `health.*` fields.
7. `bun run build` green; Playwright dual-lens (end-user + CDO) pass before deploy.

**Out of scope:** real LLM (keep `compileNL`); a second nesting level; click-to-edit restatement chips;
finalising the exact "most important" Simple set (separate exercise).
