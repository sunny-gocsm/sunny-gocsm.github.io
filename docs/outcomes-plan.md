# Design plan — Outcomes (value report card + audit log)

> Phase 2. A standalone top-level page: "here's the value GoCSM delivered, and the receipts."
> Grounded in research (CS value dashboards · AI insight summaries · value-report-card framing)
> + standard audit-log patterns. Persona: overwhelmed ADHD HighLevel agency owner, ~1000 accounts.

## North star
Two halves, one story: a **report card** (glanceable proof of value) on top, an **audit log**
(the filterable receipts) below — bridged by a **deterministic AI summary** that tells them what
happened in one read, with every claim clicking down to its source rows.

## IA (top → bottom)
1. **Hero + window toggle.** Title "Outcomes" + a `SegmentedControl` **7d · 30d · Lifetime**. The
   window is the ONLY time control — it auto-derives the prior-period comparison (Braze pattern), so
   every number gets a green/red delta for free; the user never picks two ranges.
2. **AI summary block** (pinned at top — the thing they read on a busy day). Deterministic: every
   figure computed from the log, the wording templated around those exact numbers (Tableau-Pulse rule).
   - A ≤12-word **verdict** with the number buried inside ("23 accounts kept on board and $24,310
     protected in the last 30 days").
   - **≤3 bullets** = win → win → "one thing to look at", each **clicking through to its source rows**
     (Gainsight "Elaborate"): a bullet applies the matching filter to the log below.
   - A muted **scope + "as of" + caveat** line ("Based on the logins, payments & CS actions GoCSM ran
     this period · numbers exact, wording generated").
3. **Report card.** ONE hero **$ total value** (oversized, the hero graphic) with a delta vs prior
   period, then the **3–4 dual-axis category `StatCard`s** — Win-backs · Payments recovered · Renewals
   saved · Expansions — each pairing **count + $** (Planhat's `$142k (37)`) and a **green/red delta
   arrow**. Tapping a card filters the log to that category (glance → receipts).
4. **Audit log.** The filterable event list.
   - **Filter bar:** customer (searchable), action kind (Email/SMS/Call/Alert/Dunning/Task), outcome
     (Worked / No change / Didn't land / In progress), full-text search — plus a **group toggle**
     (Flat · By customer · By workflow). Filters compose; an active-filter summary + "clear".
   - **`EventRow`:** time (Nd ago) · monogram + account · action (icon + channel) · plain summary ·
     **result chip** (color) · **$ amount** (right, tabular) · **Executed / Suggested** tag (ChurnZero —
     makes an automation log feel safe). Row → links to the account's Health (spine).
   - **Grouping** collapses noise: per-customer groups (account header + count + total $) or per-workflow.
   - **Density:** show ~25, "Load more"; sticky filter bar.

## Data (done — `src/fixtures/outcomeLog.ts`, tested)
`outcomeEvents` (deterministic action-level log across ~300 days) · `reportCard`/`reportCardCompare`
(window + auto prior-period) · `outcomeSummary` (the grounded summary w/ click-to-source filters) ·
`filterEvents` · `loggedAccounts` · `CATEGORY_META`/`ACTION_META`/`RESULT_META`.

## DS-vs-app (Phase 3 batch — one sequential round-trip)
- **DS (new):** `StatCard` (label · big value · secondary · delta arrow · tone · onClick) · `SegmentedControl`
  (the window toggle) · `EventRow` (the audit-log row). Reuse: `Badge` (result chips), `Monogram`,
  `Icon`, `Mono`, `StackedBar` (optional funnel), `Card`.
- **app:** the Outcomes page, the AI-summary block (composition; DS-promotion candidate), the filter bar
  + grouping logic, the route + nav item, removing the Playbooks "Outcomes" tab.

## Build order (Phase 4) — each step a micro-loop
1. DS: `StatCard` + `SegmentedControl` + `EventRow` → build/lint/push → sync.
2. Nav: add "Outcomes" item + route; lift the old tab out of `/playbooks`.
3. Report card (hero $ + window toggle + category cards w/ deltas).
4. AI summary block (verdict + click-to-source bullets + caveat).
5. Audit log (filter bar + grouping + EventRow list + load-more).
6. Wire: card/bullet click → log filter; window toggle drives everything.

## Phase 5 — gocsm-design-loop
Micro/macro loops across every state (each window, each filter combo, each group mode, empty/light
period, mobile) until it clears the Standard. Merge to main.

## NOT to do (from the research)
No dense BI grid · no equal-weight stat soup (one hero) · no raw metrics (translate to $/accounts) ·
no trends-as-lead · no two date pickers · never an un-grounded AI number.
