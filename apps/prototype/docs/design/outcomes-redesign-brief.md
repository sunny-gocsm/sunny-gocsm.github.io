# Outcomes page — CPDO design brief (design-loop, 2026-06-30)

**Status:** fidelity contract for the Outcomes redesign. Implementation must be 100%
faithful to this; Phase-4 reviewers check against it.

## The job (one sentence)
A non-technical, ADHD HighLevel agency owner who has turned on several playbooks lands
on Outcomes and, with almost no reading, climbs a **three-question ladder**:

1. **Is GoCSM worth it?** (overall value / ROI) — *the bottom line, on top.*
2. **Which playbooks are working?** (per-playbook effectiveness) — *who earned it.*
3. **What exactly happened?** (retraceable audit log) — *the receipts, sliceable.*

The page is ordered **outcome-first** (Q3 → Q2 → Q1), the reverse of how the owner
*asked* the questions, because the owner wants the verdict before the mechanics
("sell the outcome, not the mechanics"). Every claim at a higher rung **drills down**
into the rung below it (click the value → see which playbooks → see the receipts).
Each section is **labeled with the plain-English question it answers**, so the page is
self-describing.

## What the research mandated (the patterns we are 100% faithful to)
Drawn from four blind dossiers (CS competitors · marketing-automation+HighLevel ·
audit-log/ROI/causality analogues · AI dosage). The load-bearing calls:

- **Lead every rung with ONE plain-English verdict + evidence one click beneath.**
  (Gainsight Cheat-Sheet/Takeaways; Power BI footnotes; Tableau Pulse.)
- **Q3 = a unified value roll-up + an ROI multiple, framed as "work GoCSM did for
  you," with the math inspectable.** HighLevel itself has *no* unified value roll-up
  (it splits value across 4 report types) — owning it is our opening. The single
  biggest credibility lever is **letting the owner see the math** ("How is this
  counted?") and drill to the exact payments/dates (Zapier; Stripe Revenue Recovery).
- **Q2 = group by GOAL, report OUTCOMES not "emails sent."** Each playbook = one
  row: its plain objective, fired-N, **worked-X (success rate)**, accounts helped,
  $ delivered, and a one-glance verdict label (Sentry grouping + Intercom
  Finished/Disengaged/Hit-goal buckets + "label + one-line why"). Sort by $ so the
  best earner leads.
- **Q1 = ONE "Slice by ▾" switcher over ≤4 plain dimensions: Timeline · Playbook ·
  Customer · Channel.** Channel is the lens HighLevel can't do (its stats are
  email-only) → our clearest native-feeling differentiator. Rows are plain-English
  Actor→Action→Target→Time sentences + status label + $. Grouped views collapse the
  firehose into countable header rows that expand to receipts. **Every number on the
  page drills into this log with the right filter applied.**
- **Causality honesty (non-negotiable).** Never claim GoCSM *caused* an outcome —
  "came back **after**," "recovered," "in progress," never "caused." Count each
  customer's saved revenue **once**, even if more than one playbook touched them
  (no double-count). Show an **"in progress / outcome not yet known"** state. Never
  show an industry benchmark as the owner's own result.
- **AI dosage = one verdict + one short line per section; AI never touches a number.**
  "Numbers exact · wording is AI" stamp adjacent to every AI sentence; figures render
  as visually-distinct chips that click to source; validate-before-render (drop the
  sentence if a number slot is empty); no per-row narration, no causal verbs, no
  chatbot hero, no flag-everything feed.

### Anti-patterns we explicitly reject (all four dossiers)
Configurable dashboard wall · attribution-model pickers / date-gates before any answer ·
engagement-funnel vanity (opens/clicks) as the "did it work" answer · jargon heroes
(GRR/NRR) · >100%/funnel raw math · per-contact-only views with no roll-up · the Wall of
Narrative · the Confident Liar (AI inventing/restating numbers or asserting causality) ·
insight/alert fatigue.

---

## The design — three rungs

### Rung 1 — IMPACT  ·  header: "Is GoCSM worth it?"
One tight hero, the number appears **once, big** (kills the current page's triple
restatement of `$35,584`):

- **AI Verdict (DS `Verdict`, tone=pos, reused from Attention/Onboarding for
  consistency)** — one sentence that phrases the two computed figures:
  *"Your playbooks kept **15 customers** and protected **$35,584** this period —
  about **3.7× what GoCSM costs you**."* Trust stamp: *"Numbers exact · wording is AI."*
- **The hero figure** lives inside / directly under the verdict: the big `$` + a
  Pattern-1 caption ("Revenue saved, recovered, or kept on board") + an **ROI pill**
  ("≈ 3.7× your GoCSM cost"). The total appears as a focal number exactly once.
- **A 3-chip proof strip that ADDS, never restates:** (a) *Customers kept* · (b)
  *Actions GoCSM ran for you* with the autopilot share ("52 on autopilot — you didn't
  lift a finger") — the "work done on your behalf" framing · (c) *Still in play* (money
  in playbooks not yet resolved — the honest in-progress state).
- **"How is this counted?" disclosure** (collapsed): plain-English method +
  by-mechanism breakdown (brought back / payment recovered / renewal saved / adoption /
  expansion) + the honesty line *"Each customer is counted once, even if more than one
  playbook helped. We don't count customers who'd have stayed anyway."*
- Clicking the hero (or a mechanism in the breakdown) scrolls to Rung 3 filtered.

### Rung 2 — EFFECTIVENESS  ·  header: "Which playbooks are working?"
The currently-missing middle. One **AI one-liner** leads ("Your strongest playbook is
Payment recovery — it's clearing 7 of every 10 failed cards"). Then the **playbook
scorecard**: one row per activated playbook, sorted by $ delivered:

- icon + **playbook name** + **plain objective** ("brings back customers who stopped
  logging in").
- an **outcome meter** (worked / no-change / didn't-land / in-progress as a small
  proportion bar — reuse DS `StackedBar`) — Intercom-bucket legibility.
- the numbers, plain: *"Fired on 12 customers · **8 came back (67%)** · kept $12,360."*
- a **one-glance verdict chip:** *Working well* · *Doing its job* · *Quiet* (few fires)
  · *Needs a look* (low success / failures). Derived from the data, never hardcoded.
- the whole row **clicks → Rung 3 filtered to that playbook.**
- Honest math: success rate = worked ÷ **resolved** (pending excluded), with the
  in-progress count shown separately so an unresolved playbook isn't punished.

### Rung 3 — AUDIT LOG  ·  header: "What exactly happened?"
The retraceable receipts (keeps the strongest bones of today's Activity log, adds the
channel lens + grouped headers + honesty states):

- **Global time scope** (7d / 30d / Lifetime) stays at the page top (drives all rungs).
- **ONE "Slice by ▾" segmented switcher: Timeline · By playbook · By customer ·
  By channel.** (Channel is new — the differentiator.)
- **Filter bar:** search · customer · **channel** · outcome. Active-filter chips,
  individually removable + "clear all".
- **Rows:** plain-English summary ("Logged back in after a call"), action icon, status
  label (Worked / No change / Didn't land / In progress), right-aligned `+$`. Both
  relative time on the row + absolute in the detail drawer.
- **Grouped views collapse the firehose into countable header rows** (Sentry pattern):
  e.g. *By channel →* "✉️ Email · 41 sent · 12 worked · $8,200" header → expands to its
  receipts. By playbook / by customer likewise.
- **Designed empty/stale state:** "No playbook activity in this window yet — GoCSM is
  watching; nothing needed you."
- **Event detail drawer** (keep): the full record — action, playbook, **channel**, when
  (absolute), outcome, value, ran-by (autopilot vs you-approved) → "View account".

---

## Data / honesty fixes required in `fixtures/outcomeLog.ts`
1. **Kill the double-count** (today Win-backs `$12,360` == Renewals `$12,360` because an
   at-risk account gets *both* a winback and a renewal episode at full MRR). Make the
   retention categories (winback / payment / renewal) **mutually exclusive per account**
   so each saved customer's MRR is attributed to exactly one playbook and counted once.
   Adoption (retained-usage sliver) and expansion (genuinely NEW mrr) remain additive.
2. **Top-line total = distinct-customer retained MRR (counted once) + expansion new MRR**
   — never the naive sum of category values. Add the "counted once" footnote.
3. **ROI:** add `GOCSM_MONTHLY_COST` (prod reads the real plan) + derive install-age from
   the data; ROI multiple = window value ÷ GoCSM cost over the same window; lifetime is
   the headline horizon. Phrase honestly even if modest (>1× = "more than paid for
   itself"). Never inflate.
4. Expose per-playbook **episode** aggregates (fired / worked / no-change / failed /
   pending / accountsHelped / value / successRate / verdict) for Rung 2 — episode =
   one playbook firing on one account (not per-step), outcome = the resolving step.
5. Expose **by-channel** aggregates for Rung 3's channel lens.

## Phase-1 safety (gating)
Zero coined Health vocab anywhere (no score/bands/lifecycle/PAS). Everything runs on
HL-native signals (logins, payments, workflows, sub-accounts) + plain outcome words.
The page must read identically whether or not Health is configured.

## Success / stop criteria
Three labeled rungs each answering one question · the total `$` appears big exactly once ·
an ROI multiple present and honest · a per-playbook success-rate verdict · a channel lens ·
no naked numbers (Pattern 1 everywhere) · every figure drills to its source rows · AI = one
verdict + section lines, never touching a number or asserting causality · no double-count ·
works with zero Health · looks worth $2–3k/mo · passes the 3-second test. Stop when the full
review panel (agency owner · CDO · CPO/CEO · PMM copy · AI-readiness) approves with no
material new findings.
