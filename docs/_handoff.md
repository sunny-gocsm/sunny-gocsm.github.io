# /today → "Attention" Redesign — Handoff

> Branch: `today-attention-redesign` (do NOT merge — for Karthik's review).
> Operating discipline: `gocsm-design-loop` skill. Two-repo sync, strictly sequential.

---

## 🧭 Phase-2 Decision (read this first) — full version in `docs/DECISION.md`
**Build "Pick a trigger, watch the wall": a category-first STRUCTURED criteria builder whose three
category gates ARE our three attribute sets (Health signal · Account · User), fronted by tappable
starter recipes and an optional NL warm-start that compiles INTO editable chips — with a live
"shrinking wall + 7-day forecast" as the narrowing-as-guidance mechanic, and a refuse-and-clarify
guardrail.** Spectrum position: **CENTER** — structured builder is the system of record; NL is the
on-ramp and single-chip refiner, never the thing that fires the workflow. This is evidence-based, not
a hedge: all 16 platforms researched are fundamentally structured; pure-chat NL-to-target runs 60–80%
accurate (schema-gated) and fails silently-confident — unacceptable when the output is "who gets
messaged." The central mechanic is a literal wall of account tiles that **physically dissolves** as you
filter (motion teaches, not a ticking count), with per-candidate preview counts + composition bars
cueing the next chip, a "matches now vs likely in 7 days" split, and an honest, gated forecast.

---

## ⛳ NEEDS KARTHIK

> **✅ All three items below were approved by Karthik and are now DONE this session** —
> (1) job-(b) honest approach kept as built; (2) `FilterChip` + `StackedBar` promoted to the DS
> and adopted in the app; (3) `ScoreRing` `size="sm"` bug fixed (Health link-out now 0 console errors).
> Both repos pushed and in sync (DS `e39b8d2` = app `.ds-version`). Kept here for the record.

### 1. Job (b) "tried-but-failed" — the closed-loop signal is NOT substantiatable from current data
The brief is right to flag this. What we have vs. need:
- **Have:** `health.trend90d` (90-pt health history) + `health.delta` (recent direction) per account; `outcomes.ts` (but it records only **positive wins**, and is explicitly *"observational (never causal)"*); `autopilotStore` (knows which playbooks are ON, not which accounts a workflow actually executed against, nor when).
- **Missing:** a **run-ledger** — "workflow W ran on account A at time T, targeting pillar P" — and a **post-run health delta anchored to T** (score at T vs T+24–48h on the targeted pillar). Without both, asserting "we tried and it didn't work" is unfounded.
- **The honest closed-loop signal (what job (b) SHOULD require):** an attempt record `{accountId, playbookId, ranAt, targetPillar, preScore, postScore, status}` where `ranAt ≤ now−24h` AND `postScore − preScore ≤ ε` on the targeted pillar AND the account is still At-Risk/Watch.
- **Decision taken (flag for your approval):** I will introduce an explicit `attempts` fixture that models this signal honestly and drives the UI, so the "it didn't work" claim is always backed by an inspectable record. **In production this needs a real run-ledger + reliable per-account health deltas** (you noted known per-account aggregation issues).
- **Honest fallback when the signal is low-confidence/missing:** the card does NOT claim failure. It degrades to *"Workflow ran {N}d ago · outcome not yet confirmed"* with the same call/email/SMS actions, gated behind a confidence flag. We never render "we tried, it failed" we can't back. **→ Confirm you're OK with the explicit-attempts-fixture approach + the honest fallback copy.**

### 2. DS maturation — promote `FilterChip` + `StackedBar`? (your call)
The Attention UI is correctly app-level (data-coupled). The two reusable *presentational* patterns it
introduced — a filter chip and a stacked distribution bar — are genuine DS-primitive gaps. I did **not**
rush them into the DS at session end (a deliberate promotion is safer). **Want me to promote them next** as
data-agnostic DS primitives (DS commit → `sync-ds.sh` → app commit, strictly sequential)?

### 3. Pre-existing bug on the Health link-out target (not mine, but it's on the spine path)
Clicking job-(b) "Why" → `/accounts/:id` (Health tab) works, but that page logs `ScoreRing` SVG-geometry
errors (`HealthScoreEvidence` passes `size="sm"` → NaN `cx/cy/r`). **Pre-existing** (none of those files
were touched on this branch); the page still renders visually. Out of the Attention surface scope, but since
the spine routes users there, flagging it. **Want me to fix it** (likely a 1-line `size` prop fix)?

### Process note
Phase-1 web research was gathered by read-only research agents (no repo access, cannot push). All build / git / DS-sync steps are strictly single-threaded and sequential, per your instruction.

---

## 🧭 Phase-2 Decision Summary (the first thing to read)
_To be written in `docs/DECISION.md` and mirrored here in one paragraph._

(pending Phase 1 → 2)

---

## Status by phase
| Phase | State |
|---|---|
| 1 — Research (CDO lens) | ✅ done — 16 platforms, 3 clusters; strong convergence |
| 2 — Decide (`docs/DECISION.md`) | ✅ done — pattern chosen + interaction model |
| 3 — Plan (build spec) | ✅ done — `docs/PLAN.md` (IA, data shapes, DS-vs-app, build order) |
| 4 — Execute (design loop) | ✅ steps 1–6 built + audited; macro loop done. DS: see reclassification below. |

## Architectural spine (invariant)
- **Health = diagnostic** (why at risk). **Attention = action** (what to do now). Link, don't duplicate.
- At-risk signal computed ONCE in Health; Attention CONSUMES it, never recomputes.
- Attention cards = action-relevant minimum (account · one-line reason · the action) → link into Account Detail → Health / AI Insights for full diagnosis.
- Vocabulary: **Thriving / Healthy / Watch / At-Risk** — never "Steady".

## DS-vs-app classifications (revised at build time — honest root-cause call)
_Per item: app (executive-pulse-check) · DS (gocsm-design-system) · both._
- **Everything built for Attention → app.** Reason discovered during the build: MatchWall, CriteriaBuilder
  and CriterionChip are **tightly coupled to the app data layer** (`criteriaMatch`/`criteriaCatalog`/`Account`).
  The DS is a pure presentational library and must not depend on app fixtures, so these smart, data-bound
  containers correctly live in the app. They **reuse** DS primitives throughout (`Mono`, `Icon`, `ConfTag`,
  `Card`, `Button`, `Badge`, `FixItCard`); all CSS is in sync-proof `app-overrides.css`.
- **Two-repo invariant: HELD.** The DS was not changed by the Attention build → the repos remain in sync
  (last DS change was the synced `69416c6` video-placeholder fix). No rushed end-of-session DS extraction.
- **Genuine DS follow-up candidates (recommended, NOT done — deliberate, not rushed):** a generic
  presentational **`FilterChip`** (field·operator·value shell — the DS has no chip primitive today) and a
  **`StackedBar`** (the composition/distribution bar — `PillarBar` is pillar-specific). Promoting these as
  data-agnostic primitives (props in, no fixtures) is the right DS maturation, best done as a focused pass.
  → **Want me to do that promotion next?** (see NEEDS KARTHIK).

## Playwright pass/fail per state
| State | Result |
|---|---|
| MatchWall — seeded from recipe (renewing 30d & at-risk → 6 tiles) | ✅ pass |
| MatchWall — switch recipe (slipping adoption + quiet → 5 tiles, 100% At-Risk) | ✅ pass |
| MatchWall — live narrowing (6 → 5 → 1) + composition re-skew | ✅ pass |
| MatchWall — inventory-floor warning ("Only N left…") | ✅ pass (fires ≤5) |
| MatchWall — 7-day forecast ghost tiles (~1d/2d/3d, dashed/translucent) | ✅ pass |
| MatchWall — honest "not enough trend data" fallback | ✅ pass |
| MatchWall — plain-English summary updates live | ✅ pass |
| Criteria builder — empty state (recipe on-ramp + NL box) | ✅ pass |
| Criteria builder — recipe seeds editable chips | ✅ pass |
| Criteria builder — category gate (3 sets) → scoped fields (progressive disclosure) | ✅ pass |
| Criteria builder — add field → editable chip → wall/summary update live | ✅ pass |
| Criteria builder — NL warm-start compiles phrase → editable chips | ✅ pass |
| Criteria builder — refuse-and-clarify on ambiguous input | ✅ pass |
| Criteria builder — desktop + 390px mobile | ✅ pass |
| Collapsed flow — criteria (pre-seeded) → workflow → publish → Live | ✅ pass |
| Collapsed flow — publish == activation (row flips to On·autopilot live) | ✅ pass (no explain/run/autopilot-question) |
| Attention page — job (a) "Needs a workflow" rows, honest deduped count | ✅ pass |
| Attention page — job (b) high-confidence "tried but didn't move" (names the pillar) | ✅ pass |
| Attention page — job (b) low-confidence honest fallback ("outcome not yet confirmed") | ✅ pass (no failure claim) |
| Attention page — inline Call/Email/SMS + "Why" → Account Health (spine link-out) | ✅ pass |
| Attention page — desktop + 390px mobile | ✅ pass |
| Vocabulary check — no "Steady" on the Attention surface | ✅ pass |

_Scratch dev route `/attention-lab` (criteria builder in isolation) is KEPT for your review (not in nav). Say the word and I'll delete it._

## Codebase grounding (done — informs Plan/Build)
- **Flow to collapse** (`src/components/playbooks/PlaybookActivationDrawer.tsx`, 1786 lines): current steps `pick → explain → handoff(WorkflowHandoff) → run → done → "autopilot?" → set-trigger`. Target: `trigger-criteria → WorkflowHandoff(builder) → publish → auto-run`. DELETE `explain` (the "list of actions" screen). `WorkflowHandoff` is the keep-able Workflow-builder step. `autopilotStore.enable(id, oversee)` on publish == activation (no separate Run, no autopilot question).
- **Spine is data-supported:** at-risk computed ONCE via Health-layer selectors in `fixtures/index.ts` (`atRiskByUrgency`, `byUrgency`, `renewalsWindow`, `failedPayments`, `lostStickySetups`, `stalledOnboarding`, `upsellReady`). Attention consumes these.
- **Attribute catalog for the criteria builder** (from the `Account` model — the brief's 3 sets):
  - *Pillar signals:* `health.pillarScores.{productAdoption,revenue,login,sentiment}` (0–100), `health.score`, `health.delta`, `health.band` (thriving/healthy/watch/atrisk), `health.trend90d`, `health.riskSignals[]`.
  - *Account attributes:* `identity.plan`, `identity.industry`, `lifecycle.stage`, `revenue.mrr`, `revenue.spendTrend`, `revenue.renewalDate`/`renewalInDays`, `revenue.lastPaymentStatus`, `revenue.margin`, `revenue.riskTags[]`, `onboarding.stalled`/`pct_complete`/`days_on_current_step`.
  - *User attributes:* `login.users[].{role,keyUser,status,lastLogin}`, `login.lastLoginDaysAgo`, `login.activeUsers`, `feedback.npsScore`, `feedback.sentiment`.
- **Existing trigger vocabulary** (`fixtures/triggers.ts`): TriggerSpec classes = single-signal · recency-frequency · agentic-scheduler (cross-pillar) · reversal. Plain-language `when` sentences already written — reusable as starter "recipes" in the builder.
- **Link-out target (spine):** Attention card → `/accounts/:id` → Health tab (diagnostic). Account Detail tabs = health · login · adoption · revenue · feedback · onboarding.

## Found-in-passing (minor, out of scope)
- `src/pages/AccountDetailPage.tsx:165` uses "steady" in a verdict sentence ("…healthy — health N, steady."). Brief bans that vocabulary; flagging (not fixing — outside the Attention surface).

## Changelog
- Branch `today-attention-redesign` created off `main@ba6d16f`.
- `docs/_handoff.md` created; job-(b) data-dependency analysis recorded in NEEDS KARTHIK.
- `3ab6fc7` docs: Phase 1 research + Phase 2 `DECISION.md`.
- `20e3e2f` docs: Phase 3 `PLAN.md` (IA, data shapes, DS-vs-app, build order).
- `b9750a2` feat: data spine (criteriaCatalog/criteriaMatch/recipes/attempts) + 6 passing vitest checks.
- `c32882b` feat: MatchWall central mechanic (live wall + composition + floor + 7-day forecast); audited at `/attention-lab`.
- `2174a4d` feat: criteria builder — category gate, editable chips, recipes, NL warm-start + refuse-and-clarify.
- `d20a026` feat: collapsed flow (criteria→workflow→publish==activate) + two-job Attention page; nav relabelled "Attention".

- `e39b8d2` **(DS repo)** feat: `FilterChip` + `StackedBar` primitives; fix `ScoreRing` NaN. Pushed to DS `main`.
- `4f3d7bb` refactor: app adopts DS `FilterChip`/`StackedBar`; vendored DS `@e39b8d2`; ScoreRing fix flows to Health.
- Branch `today-attention-redesign` **pushed** to `origin` (no PR, no merge). DS `main` pushed. Repos in sync.

## Macro loop (final pass) — conclusion
Re-traversed every reachable state (criteria empty/seeded, category gate, chip edit, NL compile,
refuse-and-clarify, live narrowing + floor + forecast, collapsed flow criteria→workflow→publish→live,
job (a), job (b) high/low confidence, Health link-out) at 1440 + 390. All clear the Standard; 0 console
errors on the Attention surface itself. **No new material action items on the Attention surface.** One
pre-existing console bug on the Health link-out target (NEEDS KARTHIK #3). DS follow-up candidates noted
(NEEDS KARTHIK #2). Branch left for review — no PR, no merge.
