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

### 1. Job (b) "tried-but-failed" — the closed-loop signal is NOT substantiatable from current data
The brief is right to flag this. What we have vs. need:
- **Have:** `health.trend90d` (90-pt health history) + `health.delta` (recent direction) per account; `outcomes.ts` (but it records only **positive wins**, and is explicitly *"observational (never causal)"*); `autopilotStore` (knows which playbooks are ON, not which accounts a workflow actually executed against, nor when).
- **Missing:** a **run-ledger** — "workflow W ran on account A at time T, targeting pillar P" — and a **post-run health delta anchored to T** (score at T vs T+24–48h on the targeted pillar). Without both, asserting "we tried and it didn't work" is unfounded.
- **The honest closed-loop signal (what job (b) SHOULD require):** an attempt record `{accountId, playbookId, ranAt, targetPillar, preScore, postScore, status}` where `ranAt ≤ now−24h` AND `postScore − preScore ≤ ε` on the targeted pillar AND the account is still At-Risk/Watch.
- **Decision taken (flag for your approval):** I will introduce an explicit `attempts` fixture that models this signal honestly and drives the UI, so the "it didn't work" claim is always backed by an inspectable record. **In production this needs a real run-ledger + reliable per-account health deltas** (you noted known per-account aggregation issues).
- **Honest fallback when the signal is low-confidence/missing:** the card does NOT claim failure. It degrades to *"Workflow ran {N}d ago · outcome not yet confirmed"* with the same call/email/SMS actions, gated behind a confidence flag. We never render "we tried, it failed" we can't back. **→ Confirm you're OK with the explicit-attempts-fixture approach + the honest fallback copy.**

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
| 4 — Execute (design loop) | 🟡 in progress — steps 1–2 done (data spine ✅, MatchWall ✅); next: CriterionChip + builder |

## Architectural spine (invariant)
- **Health = diagnostic** (why at risk). **Attention = action** (what to do now). Link, don't duplicate.
- At-risk signal computed ONCE in Health; Attention CONSUMES it, never recomputes.
- Attention cards = action-relevant minimum (account · one-line reason · the action) → link into Account Detail → Health / AI Insights for full diagnosis.
- Vocabulary: **Thriving / Healthy / Watch / At-Risk** — never "Steady".

## DS-vs-app classifications
_Per item: app (executive-pulse-check) · DS (gocsm-design-system) · both._
- **Data spine** (criteriaCatalog/criteriaMatch/recipes/attempts) → **app** (fixtures). Done.
- **MatchWall** → **DS-bound, prototyped in app**. Workflow: build + audit in app (fast HMR/Playwright),
  then promote the matured primitive to the DS and sync at the macro-loop consolidation. Rationale: avoids
  a DS build+sync round-trip on every micro-iteration. **Invariant preserved:** while it lives in the app
  the DS is unchanged, so the two repos are trivially in sync; promotion will be one deliberate sequential
  sync. (Reuses DS `Mono`/`Icon`/`ConfTag`; CSS in sync-proof `app-overrides.css`.)
- **CriterionChip, InlineContactActions** → DS-bound (same prototype→promote plan). _next_
- **Category gate, NL warm-start, recipe cards, Attention page, collapsed drawer** → **app** composition.

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
| Criteria builder (chips/gate/NL) · workflow builder · publish/auto-run · Attention (a)/(b) · Health link-out | ⬜ pending (steps 3–7) |

_Scratch audit route: `/attention-lab` (not in nav; removed before the macro loop)._

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
