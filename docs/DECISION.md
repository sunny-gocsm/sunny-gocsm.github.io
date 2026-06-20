# DECISION — the Attention criteria builder

> Phase 2 of the `/today → Attention` redesign. Written before building, per the brief.
> Grounded in Phase-1 research across 16 platforms in three clusters (CS tools, faceted/forecast
> UIs, agentic/NL builders). Sources cited inline.

---

## TL;DR

**Build "Pick a trigger, watch the wall": a category-first STRUCTURED criteria builder whose
three category gates ARE our three attribute sets, fronted by tappable starter recipes and an
optional natural-language warm-start that compiles INTO editable chips — with a live "shrinking
wall + 7-day forecast" as the narrowing-as-guidance mechanic, and a refuse-and-clarify guardrail.**

**Spectrum position: CENTER — structured builder as the system of record, NL as the on-ramp and
the single-chip refiner, never the thing that fires the workflow.** This is not a hedge; the
research is one-directional (below).

---

## 1. The chosen pattern, concretely

The user lands not on a blank box but on **6–8 tappable starter recipes** seeded from our own pillar
data ("Falling PAS + no login in 14 days", "High-MRR account trending negative", "Renewing in 30d &
at-risk"). Picking one drops a **fully-formed set of editable criterion chips** into the builder and
immediately renders the matching **wall of accounts**. From there the user *adjusts*, never *authors
from zero*.

Each criterion is a chip: **field → operator → value**, where:
- **field** is chosen via a **category-first gate** — the first click is a plain-English question with
  exactly three answers, which are our three attribute sets:
  - **Health signal** — PAS / Revenue / Login / Sentiment (pillar scores, score, delta, band, trend)
  - **Account** — plan, industry, lifecycle stage, MRR, spend trend, renewal window, margin, risk tags
  - **User** — role, key-user, last login, active users, NPS, sentiment
- **operator** is type-aware (a number field offers `<`/`>`/`between`/`falling`; an enum offers `is`/`is not / is any of`).
- **value** is a **pick-list autocompleted from the real ~1000 accounts** (real plan names, real
  industries, real stages) — never a free-text box.

Logic defaults are cheap: **AND between chips** (the common case), with a quiet "match ANY" toggle per
group as the escape hatch (Gainsight's two-tier model — defaults cover ~90%, no nested-group widget
clutter). A finished criteria set can be **saved as a named token** ("My at-risk") and reused as a
one-click trigger elsewhere (Planhat / ChurnZero / Catalyst).

Two assists sit on top of the structured core, never replacing it:
- **NL warm-start** ("accounts with dropping logins and low PAS") → compiles into the same editable
  chips (Klaviyo "Define with AI", Segment "Build with AI"). Output is **validated against our real
  field catalog and silently stripped of any hallucinated field before display** (Honeycomb's #1 rule).
  A one-tap revert to the manual builder is always present (Customer.io).
- **Scoped refine** — re-invoke NL on a *single* chip to tweak just that one, without re-describing the
  whole set (Klaviyo). Field/type is the AI's committed interpretation shown for verification;
  operator/value stay freely editable (Linear's partial-editability).

A **plain-English summary line** restates the whole set in prose above the chips ("Accounts with
falling PAS and no login in 14 days") so a non-technical user can verify intent without reading
operator rows (HubSpot Breeze).

---

## 2. Where on the agentic↔structured spectrum — and why

**CENTER, structured-as-system-of-record.** The Phase-1 evidence does not support a pure-agentic
primary surface for a *consequential* action:

- **All 16 builders surveyed are fundamentally structured.** The 2025–26 frontier (Segment, RudderStack,
  Hightouch, Klaviyo, Customer.io, Salesforce Agentforce) adds an NL on-ramp that **compiles down into
  the same editable rows** — nobody ships pure chat as the system of record for "who gets targeted".
- **Pure-chat fails in exactly our failure mode.** ThoughtSpot quantifies NL-to-query accuracy at
  60–80% and explicitly says it's gated by *schema hygiene, not the model*. Honeycomb's chaining math
  (0.9⁵ ≈ 0.59) is why they keep to a single validated call and land output in an editable builder.
  ChatGPT-class chat is documented as **confidently wrong with no clarifying question** — the precise
  thing an overwhelmed ADHD owner cannot catch when the output is "these 200 accounts get a message."
- **But the agentic capability earns its place — inside the structure.** NL is the fast path to *seed*
  chips and to *refine one chip*; Cortex Analyst's **refuse-and-clarify classifier** is the guardrail.
  Pure chat survives only for **throwaway exploration** ("how many accounts have falling PAS right
  now?") where a wrong answer costs nothing — we keep a chat affordance there, but it never fires a workflow.

We were explicitly open to the fully-agentic end and weighed it seriously. We are rejecting it as the
*primary* surface on evidence, not reflex — and we are pulling its genuine strengths (warm-start,
single-chip refine, clarify-when-unsure) into the center pattern.

---

## 3. Why it fits our three attribute sets

The hardest part of this problem is **dimensionality** — pillar signals + account attributes + user
attributes is too much for a blank box and too long for a full Q&A. The category-first gate dissolves
this: **our three attribute sets become the three first-click categories** (Klaviyo's 7-category gate,
HubSpot's filter-category picker). The user answers one small question — "is this about a *health
signal*, the *account*, or a *user*?" — and only then sees a scoped field list. Progressive disclosure
is structural, not bolted on: the user never confronts 100 fields, and never faces a blank box.

Reusable named tokens (Planhat/ChurnZero) mean the cross-pillar "at-risk" definition is authored once
and reused as a one-click trigger — so high-dimensional logic lives in one place and the trigger UI
stays a single tap.

---

## 4. Why it fits the ADHD / $2000-a-month persona

| Persona need | Mechanic |
|---|---|
| Won't type into a blank box | Starter recipes + category gate + NL warm-start — they **pick**, not compose |
| Overwhelmed by many fields | Category-first scoping; one decision per screen (Typeform: 15–30% higher completion) |
| Hates typing / typos silently match nothing | Pick-lists autocompleted from **real account values** (Hightouch/Klaviyo/Vitally) |
| Needs "did it work?" closure | The **wall physically shrinks** as they filter — instant, legible feedback + dopamine |
| "What do I filter next?" | Composition bars re-skew + per-candidate preview counts **cue the next chip** |
| Can't catch a wrong target list | Structured chips + plain-English summary + live count = verifiable before publish |
| Must not be led into a dead end | Inventory floor warns one step before the wall empties; never a silent zero |

---

## 5. Alternatives considered and rejected

- **Pure-agentic chat builder.** Rejected as primary surface. Silent-confident-wrong with no
  verification; accuracy gated by schema hygiene (60–80%); the cost of a wrong target set is real
  messages to real accounts. *Kept* as a throwaway-exploration affordance only.
- **Full guided Q&A wizard.** Rejected — the brief names it: it gets long fast across many attributes.
  We keep only its good bone (one-decision-per-screen) for the few moments we *do* ask for input.
- **Blank landing page with a text box.** Rejected — the brief's stated failure: this persona won't type.
- **Pure faceted filter wall, no recipes/NL.** Better than a blank box, but cold-start cost is still
  high (the user must know which of 100 fields to start with). The category gate + starter recipes beat
  it while keeping the same live-count strengths.
- **A static match count instead of the live wall.** Explicitly rejected by the brief, and by the
  research: a number ticking 240→180 teaches nothing; 60 tiles dissolving teaches "that filter cost you these 60."

---

## 6. The central mechanic — narrowing-as-guidance (interaction model)

This is the heart of the design. It is a **live feedback loop**, not a static count.

1. **The wall is literal.** Matching accounts render as a grid of tiles. A starter recipe or first
   chip populates it.
2. **Filtering animates removal.** Adding/tightening a criterion makes the now-excluded tiles **fade and
   collapse out** of the wall. The *motion* is the lesson (Endeca's exclusion logic, made live). A small
   secondary header reads "**84 accounts match**" — but the wall, not the number, is the focal point.
3. **Every candidate criterion shows its consequence before you click it.** Each not-yet-applied
   criterion carries a preview delta — "**–37**" / "**→ 47**" — computed against the current set
   (Algolia's per-facet counts, HubSpot's per-filter "Test matches"). The user scans candidates and sees
   which ones actually bite. This is what makes the wall *guide* the next filter.
4. **Composition bars are the bridge from "watch it shrink" to "know what's next."** Above the wall,
   2–3 distribution bars show what's *in* the set right now (Plan 70/30, Health 50% at-risk). As the wall
   shrinks they re-skew; a lopsided bar is itself the cue ("now 90% at-risk — add a renewal-date filter?")
   (LinkedIn's segment-composition breakdown).
5. **Over-narrowing is visible, not silent.** A criterion that would drop the set below a floor renders
   **grayed-out with a ghost count** (Endeca). One step before the wall empties, we intercept: "**This
   leaves 3 accounts — narrow anyway, or stop here?**" (Airbnb's inventory floor). A true zero names the
   responsible filter and offers one-tap "remove this filter" — never a blank dead end.
6. **Now vs. next 7 days is split, like Meta's size-vs-results.** Two distinct regions:
   **MATCHES NOW: 84** (the wall) and **LIKELY IN NEXT 7 DAYS: +12 to +20** (accounts trending toward the
   criteria). They answer different questions — "who do I act on today" vs "who's about to qualify."
7. **The forecast is honest by construction.** Forecasted accounts appear as **translucent ghost tiles**
   after an "About to qualify →" divider, each with a trend sparkline and ETA ("~3 days"). Framing:
   "Based on the last 30 days of account movement", shown as a **range, never a point**. If a segment
   lacks enough history, we **withhold the forecast and say so** ("not enough trend data yet") rather than
   fake a number (Google Ads' history-gate; the dashed-cone forecast grammar from BI tools). **This is the
   same honesty discipline that governs job (b)** (see `_handoff.md` → NEEDS KARTHIK).

The loop in one line: **pick a recipe → the wall appears → tighten a chip → watch tiles dissolve and the
composition bars re-skew → the skew + per-candidate counts tell you the next chip → repeat until the wall
is the right set → publish.**

---

## 7. How this slots into the collapsed flow & the spine

- **Flow (Problem 1):** the builder IS the new first step. `criteria (this) → Workflow builder
  (WorkflowHandoff) → Publish → auto-run`. No "list of actions" screen, no Run step, no autopilot
  question. Publishing == activation (`autopilotStore.enable`).
- **Spine:** the at-risk signal is **consumed**, not recomputed. Starter recipes and the wall are built
  from the Health-layer selectors in `fixtures/index.ts`. Each tile links into `/accounts/:id` → Health
  for the full diagnosis; the builder shows the action-relevant minimum only.

---

## 8. Research provenance (what each mechanic owes to)
Category-first gate → Klaviyo, HubSpot. Live blast-radius count → Catalyst, HubSpot "Test matches",
Braze funnel, Customer.io. Per-candidate preview counts & live filtering → Algolia. Grayed-out ghosts →
Oracle Endeca. Inventory floor + goal-ranked suggestions → Airbnb. Now-vs-forecast split & direction
gauge → Meta Ads. Segment-composition breakdown & multi-horizon framing → LinkedIn. Value autocomplete
from real data → Hightouch, Vitally. Reusable "fire-on-entry" criterion tokens → Planhat, ChurnZero,
Catalyst, Totango. Two-tier AND/OR logic → Gainsight. NL→editable-chips + validate-against-schema +
single call → Klaviyo, Segment, Honeycomb. Refuse-and-clarify → Snowflake Cortex Analyst. Plain-English
segment summary → HubSpot Breeze. One-decision-per-screen → Typeform. Forecast honesty (range, gate,
dashed cone) → Google Ads, Tableau/Power BI.
