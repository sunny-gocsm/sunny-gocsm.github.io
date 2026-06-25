# PRD — Attention & Playbooks

**Product:** GoCSM (customer-success / account-management for HighLevel agencies)
**Scope:** The **Attention** surface (the action layer) and the **Playbooks** surface (the systems/automation library) — including the unified playbook **setup & activation flow**, the **trigger / audience criteria builder**, and the **lifecycle / autopilot** model that powers them.
**Status:** Ready for build · **Version:** 2.0 · **Date:** 2026-06-25 · *functional spec; catalog data externalized to `playbooks-catalog.json`*
**Primary audience:** The product/build team (and their AI coding agents). This document defines the **complete functional behavior** of Attention & Playbooks — what the product does and why. Frontend behavior is specified where it constrains the contract.

> **How to read this document.** §1–§4 frame the product, personas, and vocabulary. **§5 is the canonical PRODUCT model** — every entity, enum, operator, derivation, and state machine, expressed as vocabulary and rules. **§6 is the epics** — each with user stories and Given/When/Then acceptance criteria; the ACs are the build checklist. §7 is non-functional requirements, §8 is the capabilities the product must expose, §9 is the appendices (research evidence). All catalog/reference data — the full play library, categories, situations, recipes, the field/operator universe, and attention-signal definitions — lives in `./playbooks-catalog.json`; this document references it rather than reproducing it.

---

## 1. Overview

### 1.1 What GoCSM is
GoCSM is a customer-success platform sold to **HighLevel (HL) agencies** — businesses that resell HighLevel sub-accounts to their own clients (a single agency manages up to ~1,000 sub-accounts). GoCSM watches each sub-account's HL-native activity (logins, payments, workflow usage, feature adoption, renewals, feedback) and helps the agency owner **keep clients from churning and grow the ones doing well**, with almost no manual analysis.

**At its core GoCSM is Playbooks** — pre-built, pre-written automations that an owner turns on in ~1 minute. GoCSM is **diagnosis-first, not prescriptive**: it surfaces *what's happening* and lets the owner run a playbook to act. There are exactly **two outward actions**, both delivered through HighLevel: **Trigger Workflow** and **Request Feedback** (see §4.7).

**A playbook is a concrete, named automation for a specific problem** — not an abstract category. Each one targets one recognizable situation the owner already understands ("workflow execution dropped", "contact creation dropped", "payment failed", "no recent login"). The library starts small (the production launch seeds roughly five plays) and grows over time toward hundreds. Every playbook ships with a ~1-minute explainer video and an **editable HighLevel workflow snapshot** the agency opens, modifies, and brands — swapping in its own custom variables, logo, and colors, and enriching it (sticky notes, links, a "book a call" link) — so the automation is theirs, not a black box.

**The trial wedge is activating the automation system itself**, not just selling insights. What converts a trial is the owner *turning on playbooks during the trial* — the moment a play goes live is the moment GoCSM proves its value, far more than any dashboard or report. This is why activation, not education, is the day-one job (Goal 3, §2.1) and why the headline metrics are **Time-to-first-live-play** and **Activation rate** (§2.4).

### 1.2 The four product surfaces (context)
- **Attention** — *the action layer.* "What needs me right now?" A live queue of sub-accounts that need a play, plus a "step in" list for accounts a play already ran on but didn't fix. **This PRD covers Attention in full.**
- **Playbooks** — *the systems layer.* A marketplace/library — a growing library (~57 seeded today) of pre-built plays; browse → set up → run. **This PRD covers Playbooks in full**, including the setup flow and trigger builder.
- **Onboarding** — client onboarding journeys. *Referenced only* (the Attention queue can surface stalled onboarding; the full Onboarding surface is out of scope here).
- **Outcomes** — results/reporting. *Out of scope here.*
- **Health** is a **diagnostic layer** (a gated, configured scoring system), not a surface of its own — see §4.4. **Insights** is demoted/secondary and out of scope.

### 1.3 The two phases every surface must support (critical)
GoCSM has a gated advanced system called **Health** (scores, bands, lifecycle stages, pillar model). Everything must work in **two phases**:

- **Phase 1 — Health NOT configured (the default / trial state).** Zero Health anywhere. Only **HL-native** signals and fields are available. This is the first-run experience and the **majority state**; it must be fully functional on its own.
- **Phase 2 — Health configured.** Health score, bands, lifecycle stages, and Health-derived signals/fields **unlock additively** — never as a prerequisite, never retro-breaking Phase 1.

**No new concepts on day one.** The Phase-1 / trial experience surfaces **only HL-native problems the owner already knows** — failed payments, no-login, lapsed setups, renewals — paired with the two actions he already understands. The coined Health vocabulary and the extra problem types it unlocks are deliberately **locked as later monetization**, so day one carries **zero learning curve**: nothing on screen asks the owner to learn a word, score, or band before he can act.

This phase gate is a **cross-cutting requirement** that appears in nearly every epic (see §4.4, and the gating ACs throughout §6).

### 1.4 What this PRD delivers
A complete, build-ready specification of: the **Account & Signal data model**; the **criteria/trigger engine** (fields, operators, matching, plain-English restatement, forecasting); the **Playbook catalog** (a growing library — ~57 seeded today, starting small and growing to hundreds — with its taxonomy and marketplace facets; the catalog data lives in `./playbooks-catalog.json`); the **unified 3-step setup & activation flow** with draft persistence; the **lifecycle/autopilot** state machine; the **Attention queue** generation and metrics; and the **Phase-1/Phase-2** gating that governs all of it. Plus the supporting non-functional requirements, the capabilities the product must expose, and the research evidence trail.

---

## 2. Goals, non-goals & success metrics

### 2.1 Business goals
1. **Reduce churn** of an agency's sub-accounts by catching at-risk accounts early and making the corrective play one click away.
2. **Grow revenue** by surfacing expansion moments (upsell-ready, thriving, milestone) and making the celebratory/expansion play one click away.
3. **Activation beats education** — a non-technical owner gets value in their first session with zero configuration (Phase 1), and is never blocked behind setup. The conversion wedge is **activating the automation system itself**: a trial converts when the owner *turns on a playbook*, not when he reads an insight (§1.1). This is what the **Time-to-first-live-play** and **Activation-rate** metrics (§2.4) measure.

### 2.2 Product goals (what "good" means)
- An owner can go from "see a problem" → "a play is running on the right accounts" in **≤ 3 clicks / ≤ 1 minute**.
- The owner **never has to do math or read jargon**: every number carries a plain-language explainer; every audience is restated in a plain-English sentence; coined Health vocabulary never leaks into Phase 1.
- The backend can answer, for any audience definition, **"who matches right now"** and **"how many"** in near-real-time, and **"who is likely to match within 7 days."**

### 2.3 Non-goals (explicitly out of scope for this build)
- **No prescriptive "recommended action" engine** beyond surfacing the matching play (GoCSM diagnoses; the owner decides).
- **Describe-to-rules uses real AI in production** — the natural-language trigger input is powered by real AI in production (a one-time cost incurred per activation, when the owner describes an audience). The **prototype demonstrates the same behavior deterministically** behind the identical describe→editable-rules contract. The contract is fixed either way: NL text always becomes **editable rules the owner confirms**, never an auto-committed black box, and it only ever produces criteria that reference real catalog fields (see Epic E5).
- **No second level of group nesting** in the trigger builder (one level only — see §5.3).
- **No hard deletes** of playbooks that have ever run (soft archive only — see §5.7).
- **No Outcomes/Insights surfaces; no full Onboarding surface** (only the onboarding *signal* feeds Attention).
- **No exposure of internal scoring math** (PAS, raw pillar scores, velocity/cap internals) as filterable fields — ever (see §4.4, §5.2).

### 2.4 Success metrics (instrument these)
| Metric | Definition | Target |
|---|---|---|
| Time-to-first-live-play | Median seconds from first Attention/Playbooks view to first `publish` | ≤ 90s |
| Activation rate | % of agencies with ≥ 1 live play within first session | ≥ 60% |
| Queue actionability | % of Attention queue rows that lead to a setup-flow open | tracked |
| Draft resume rate | % of started drafts that are later resumed & published | tracked |
| Match-count responsiveness | "who matches / how many" for an audience feels instant while editing | instant-feeling |
| Phase-2 adoption | % of agencies that configure Health | tracked |

---

## 3. Personas

### 3.1 Primary — "Mo", the HighLevel agency owner (build for this person relentlessly)
- **Role:** Owner/operator of an agency reselling HighLevel sub-accounts; manages ~1,000 client sub-accounts.
- **Fluency:** Fluent in **HighLevel concepts** (sub-accounts, workflows, payments, logins, A2P, funnels). **Not** fluent in customer-success jargon.
- **Traits:** High ADHD; not analytics- or numbers-oriented; overwhelmed by dense text/options; reads as little as possible; **wants exactly one thing — "what do I do next?"** Many don't know their own basic numbers (how many sub-accounts/users they have), so orienting them with *their own* data earns trust.
- **Bar:** The product must look and feel like it deserves **$2,000/month** and pass a 3-second comprehension test on every screen.
- **JTBD:** *"Tell me which clients are slipping or thriving, and let me act on each in one click — without learning a new vocabulary or doing setup first."*

### 3.2 Secondary — the sub-account end customer
- A HighLevel sub-account user (real-estate agent, home-services operator, coach, clinic). They **never see GoCSM**; they receive the *outputs* of plays (emails, SMS, tasks) inside HighLevel. The agency owner reviews/edits the pre-written messages before a play runs.

### 3.3 Implied system actor — the agency's CSM/team
- `ownership.assignedCSM` is a single name on each account; plays can alert the team. Multi-CSM assignment and team routing are modeled minimally (see §5.1) and not a focus of this build.

---

## 4. Glossary & key concepts

| Term | Definition |
|---|---|
| **Sub-account / Account** | One client workspace the agency manages in HighLevel. The unit everything operates on. Modeled as **Account** (§5.1). |
| **Signal (detected event)** | A logged change in an account's state (e.g., "domain disconnected", "A2P registration lapsed"), used to detect churn/expansion moments. Modeled as **Signal** (§5.1.2). NB: distinct from "Attention signal definition" below. |
| **Attention signal (definition)** | A named rule that turns a criteria query + a playbook into a queue row (e.g., `sig-payment-failed`). Modeled as **AttentionSignal** (§5.6, Epic E2). |
| **Playbook (play)** | A pre-built, pre-written automation template with a problem statement, plain-language actions, a marketplace category, a churn↔expansion **Situation** rating, and a match predicate. Modeled as **Playbook** (§5.5). |
| **Recipe** | A pre-seeded criteria set + linked playbook used as a one-tap starting template in the trigger builder. Modeled as **Recipe** (§5.5.4). |
| **Criteria set / Trigger / Audience** | A boolean query over accounts (the "who it runs on"). Modeled as **CriteriaSet** (§5.3). Three names for one concept: it is the *trigger* of a play, the *audience* it runs on, and a reusable *criteria set*. |
| **Criteria catalog / Field** | The curated universe of ~30 filterable fields (e.g., `revenue.mrr`, `engagement.lastLoginDays`) the trigger builder operates over. Modeled as **FieldDef** (§5.2). |
| **Autopilot / Lifecycle** | A playbook's deployment state for an agency (`off → on → paused → archived`) plus a governance **OverseeMode** (`auto`/`ease`/`review`). Modeled in §5.7. |
| **Health (gated system)** | A configured scoring layer: a 0–100 **health score**, four **bands** (`atrisk`/`watch`/`healthy`/`thriving`), six **lifecycle stages**, and an internal four-**pillar** model. **Coined, gated Tier-2 vocabulary** (§4.4). |
| **Phase 1 / Phase 2** | Phase 1 = Health not configured (default; HL-native only). Phase 2 = Health configured (Health fields/signals unlock additively). The **phase gate** (§4.4). |
| **Tier-1 / Tier-2 signals** | Tier-1 = HL-native, always on (Phase 1). Tier-2 = GoCSM-computed/Health-derived, gated (Phase 2). |
| **MRR at risk** | The summed monthly recurring revenue of the **unique** accounts currently surfaced as needing attention (§Epic E2). |
| **The two actions** | The only outward actions: **Trigger Workflow** (run a play's HL workflow on matching accounts) and **Request Feedback** (ask for NPS/feedback). Both execute in HighLevel (§4.7). |
| **Restatement** | The live plain-English sentence describing a criteria set ("Runs on accounts where MRR over $1,500 and renews in the next 30 days"). Produced by `describeSet` (§5.3.5). A key differentiator (§9.A). |

### 4.4 The Health gate (the most important cross-cutting rule)
**Coined / gated (Tier-2) vocabulary — NEVER shown in Phase 1:** Health, health score, health **bands** (Thriving / Healthy / Watch / At-Risk), **lifecycle stages**, **PAS** (Product Activation Score), and the **pillar model** (Product-Adoption / Revenue / Login / Sentiment pillar scores).

**HL-native (always available, Phase 1) vocabulary:** login activity, payment/billing status, workflow executions & errors, sub-account state, plan, renewal date, feature usage, priority flag, user role, NPS responses (raw), MRR/spend.

**Hard rules:**
1. **Phase 1 (default):** no Health score, band, lifecycle stage, pillar, or PAS anywhere — not in fields, not in queue signals, not in previews, not in copy.
2. **Phase 2 (after Health Config is turned on):** Health fields/signals appear **additively**. Nothing that worked in Phase 1 changes or breaks.
3. **PAS and raw pillar scores are NEVER filterable** in either phase (internal only). The four `pillarScores` are deliberately absent from the criteria catalog (§5.2).
4. The marketplace **"Situation"** rating on plays uses plain words (Critical/Slipping/Steady/Strong/Booming) that **deliberately do not reuse** the Health-band words — because the marketplace is a Phase-1 surface (§5.5.2).

### 4.7 The two actions
GoCSM exposes exactly two outward actions, both executed via HighLevel workflows:
- **Trigger Workflow** — the dominant action. Every playbook *is* an HL workflow + an audience. Setting up and publishing a play arms its workflow to run on matching accounts (continuously, or once on a fixed selection). GoCSM hands off to HighLevel to publish/execute (see Epic E4, E7).
- **Request Feedback** — a specialization that asks a sub-account for NPS/feedback (the "Listen & celebrate" plays). It flows through the same activation model.

**One playbook maps 1:1 to one HighLevel workflow.** Because the mapping is one-to-one, GoCSM can record *which workflow/condition was tried on each account* — and that record is the closed loop that powers Attention: an account a play ran on but that hasn't improved is the **"tried but didn't fix it"** signal that surfaces on the **Step-in** list (E2.4, E7.1), the moment automation hands the account back to a human.

---

## 5. Domain model & data dictionary (canonical)

> This is the source of truth for the schema and business logic. All dates in fixtures are relative to a deterministic anchor **TODAY = 2026-06-17**; production uses the real current date. "Live account" everywhere means **`status.enabled = "Enabled"` AND `lifecycle.stage ≠ "churned"`**.

### 5.1 Account

The central entity. An **Account** is one HL sub-account under management, composed of 11 required sub-objects.

| Sub-object | Purpose |
|---|---|
| `identity` | name, plan, industry, tenure |
| `ownership` | CSM/owner assignment, team size |
| `status` | enabled/disabled, tracked, priority flag, pending cancellation |
| `lifecycle` | stage + reactivated flag (**stage is Tier-2/gated**) |
| `pipeline` | free-form HL pipeline stage string |
| `health` | score, band, delta, trend, pillar scores, risk/opportunity labels (**all Tier-2/gated**) |
| `login` | activity, last-login, per-user records |
| `adoption` | feature engagement, assets |
| `revenue` | MRR, renewal, payments, plan changes, wallet, margin, risk tags |
| `feedback` | NPS, sentiment, responses |
| `onboarding` | journey state, steps, SLA, stalled flag |

#### 5.1.1 Field tables

**identity** — `id` (string PK), `name` (string), `avatar` (string, 2-char initials), `industry` (string; e.g. Healthcare/Agency/Coaching), `plan` (string; e.g. Starter/Pro/Pro+), `isNonSaaS` (boolean; exempts from some dormancy rules), `clientSince` (ISO date), `activeDays` (number; days since signup − 7).

**ownership** — `owner` (string), `ownerStatus` (`active|inactive|transferring`), `assignedCSM` (string), `teamSize` (number).

**status** — `enabled` (`Enabled|Disabled`), `tracked` (boolean), `previouslyTracked` (boolean), `pendingStop` (boolean; cancellation requested), `isPriority` (boolean; **agency-set priority flag — HL-native, Phase-1 filterable as `account.priority`**).

**lifecycle** *(Tier-2/gated)* — `stage` (`onboarding|activated|established|lapsing|dormant|churned`), `reactivated` (boolean).

**pipeline** — `stage` (free string; HL-native, e.g. "Renew", "At risk", "Advocate").

**health** *(Tier-2/gated — never in Phase 1)* — `score` (0–100), `delta` (signed change vs previous period), `band` (`atrisk|watch|healthy|thriving`), `trend90d` (number[12], recent→old), `pillarScores` (object, **internal/never exposed**: `productAdoption|revenue|login|sentiment`, each 0–100), `riskSignals` (string[] labels), `opportunities` (string[] labels). **Band thresholds:** thriving ≥ 85, healthy 65–84, watch 50–64, atrisk 0–49.

**login** — `activeUsers` (number), `totalLoggedInTime` (number, minutes/30d), `lastLoginDaysAgo` (number), `activityStatus` (derived `highly|moderately|low|ghosting`), `users` (LoginUser[]). **activityStatus thresholds:** highly ≤ 7d, moderately 8–30d, low 31–52d, ghosting > 52d.

**LoginUser** — `name` (string), `role` (`owner|admin|user`), `keyUser` (boolean), `lastLogin` (ISO date), `timeSpent` (number, min/30d), `status` (`active|inactive`), `history` ({date, minutes}[]).

**adoption** — `features` (AdoptionFeature[]), `assets` (AdoptionAsset[]), `topFeatures` (string[]), `underutilizedFeatures` (string[]). **AdoptionFeature** — `name`, `assetCount`, `activeAssetCount`, `engagement` (0–100), `timeSpent`. **Feature vocabulary (fixed set):** Workflow, Email, SMS, Phone, Payment, WebsiteFunnel, Forms, Reputation, Memberships, Calendar, Opportunity. **AdoptionAsset** — `type` (AssetType enum), `id`, `name`, `accounts` (string[]), `users` (string[]). **AssetType:** Workflow, Calendar, Opportunity, BusinessProfile, Phone, Email, WebsiteFunnel, Dashboard, Course, Community, Facebook, Reputation, Payment, CustomMenuLink.

**revenue** — `mrr` (number, $), `spendTrend` (signed %), `revenueHealth` (`healthy|watch|atrisk`), `renewalDate` (ISO), `lastPaymentStatus` (`succeeded|failed|pending`), `walletBalance` ($), `walletSpend30d` ($), `walletSpend90d` ($), `totalCost` ($, COGS), `margin` (signed %), `paymentAttempts` (PaymentAttempt[]), `planChanges` (PlanChange[]), `riskTags` (string[]; cached labels e.g. `renewal-urgent`, `failed-payment`, `non-saas-dormant`), `arpa` (number, $; mirrors mrr for now). **PaymentAttempt** — `date` (ISO), `amount` ($), `status` (`succeeded|failed|pending`), `failureReason` (string?). **PlanChange** — `date` (ISO), `from`, `to`, `type` (`upgrade|downgrade|reactivation|churn`), `mrrImpact` (signed $).

**feedback** — `npsScore` (0–10; **0 = no feedback yet**), `sentiment` (`positive|neutral|negative`), `promoters` (number), `passives` (number), `detractors` (number), `responses` (FeedbackResponse[]), `lastFeedbackDate` (ISO|null), `widgetEnabled` (boolean). **FeedbackResponse** — `date` (ISO), `score` (0–10), `comment` (string?).

**onboarding** — `journeyName`, `journeyVersion`, `steps_total`, `steps_done`, `pct_complete` (0–100), `current_step` (string), `current_step_state` (`in_progress|verifying|needs_attention|waiting_on_agency|done`), `days_on_current_step` (number), `sla_days` (number), `stalled` (boolean; **true when `days_on_current_step > sla_days`**), `blocked_by` (`client|agency|null`), `journey_started_days_ago` (number), `last_intervention` ({type, days_ago, outcome}|null), `completionSource` (`auto|manual|agency_verified`).

#### 5.1.2 Signal (detected event log)
A time-stamped account state change. **Distinct from the criteria engine and from AttentionSignal definitions.** Used to detect the highest-confidence churn predictors ("sticky setup reversals").

| Field | Type | Meaning |
|---|---|---|
| `id` | string | PK |
| `accountId` | string | FK → Account |
| `subject` | `Domain\|Phone\|A2P\|Funnel\|Workflow\|Login\|Payment\|Email\|Calendar\|NPS` | what changed |
| `type` | `setup\|usage` | category |
| `direction` | `forward\|reverse` | positive (forward) or negative (reverse) |
| `sticky` | boolean | a permanent setup change (not transient) |
| `weight` | number 1–10 | strength |
| `label` | string | plain-language description |
| `detectedAt` | ISO date | when detected |
| `source` | string | `ghl\|billing\|auth\|survey` |

**Key rule:** `sticky = true AND direction = "reverse" AND type = "setup" AND detectedAt within 30 days` ⇒ the account is **actively losing a critical setup** (domain disconnected, A2P lapsed, payment processor removed, etc.). These trigger the **"save" plays** and are the strongest churn signal.

#### 5.1.3 Account selectors (derived queries the backend must support)
All operate over **live accounts** unless noted. (These power Attention, the marketplace impact numbers, and previews.)

| Selector | Returns | Logic |
|---|---|---|
| `allAccounts()` | Account[] | all live |
| `accountById(id)` | Account? | lookup (incl. churned) |
| `byBand(band)` *(P2)* | Account[] | `health.band == band` |
| `byLifecycle(stage)` *(P2)* | Account[] | `lifecycle.stage == stage` |
| `healthDistribution()` *(P2)* | `{thriving,healthy,watch,atrisk: number}` | counts per band |
| `renewalsWindow(minDays,maxDays)` | Account[] | `minDays ≤ daysUntil(renewalDate) ≤ maxDays` |
| `failedPayments()` | Account[] | `lastPaymentStatus == "failed"` OR any failed `paymentAttempts` |
| `stalledOnboarding()` | Account[] | `onboarding.stalled == true` AND enabled |
| `lostStickySetups()` | Account[] | accounts with a sticky reverse setup signal ≤ 30d old |
| `dormantGrowth()` *(P2)* | Account[] | dormant + `health.delta > 0` + `lastLoginDaysAgo ≤ 14` |
| `upsellReady()` *(P2)* | Account[] | healthy/thriving + rising + spend↑ + recent login |
| `byUrgency()` *(P2)* | Account[] | sorted by `urgencyScore` desc |
| `agencyRollup()` | `{totalAccounts, liveAccounts, mrr, mrrAtRisk}` | KPI rollup |
| `signalsForAccount(id)` | Signal[] | all signals, newest first |

**`byUrgency()`** *(P2)* sorts by urgency, **blending health risk and renewal proximity** — an account weighs more heavily the worse its health and the closer its renewal, and an at-risk or watch account never sorts to the very bottom even when its renewal is far out.

**Time helpers:** `daysUntil(iso)` = signed (positive = future); `daysSince(iso)` = unsigned (≥ 0); `bandLabel(band)` = "At risk"/"Watch"/"Healthy"/"Thriving" (Phase 2 only).

### 5.2 Criteria catalog (the filterable field universe)

A curated, read-only vocabulary of **~30 fields** the trigger builder operates over. Each field is described by an `id`, the group it belongs to (one of 8 AttrGroups), a UI label, a `phrase` (the clause used in the plain-English restatement), a type (which determines its allowed operators), an optional unit (`$|%|d|min|users`), an enum value provider, a "common"-shortlist flag, and a reader that pulls the value off an account. **The four `health.pillarScores` and any PAS/velocity internal are deliberately ABSENT from this vocabulary and must never be added** — they are internal scoring math, never filterable, in either phase (§4.4 rule 3).

The vocabulary is organized into **8 groups**: **Health & Risk** *(Phase-2 only)* · **Account** · **Engagement & Login** · **Feature adoption** · **Revenue & Billing** · **Feedback** · **Users**. The ~7 "common" fields are surfaced first in Phase 1.

> **Multi-value fields** (e.g. features-in-use, risk tags) are stored as a comma-separated string and matched by splitting + set-intersection, so the "is any of" / "is none of" operators work. Enum value lists autocomplete from the agency's live account values. **Operator labels are always plain words, never symbols** (e.g. "is more than", "is any of"). One field (`account.priority`) reads health-ish but is **HL-native and Phase-1-filterable** — it is the account's `status.isPriority` flag, not a `health.*` field.

The field universe (~30 fields: id, group, type, phase, phrase), the **FieldType → operator map**, the **operator semantics** (how each operator is evaluated, including the date-window arithmetic), and the plain-word **operator labels** all live in `./playbooks-catalog.json` (`filters.advancedGroups`, `filters.operatorsByType`, `filters.operatorSemantics`, `filters.operatorLabels`).

### 5.3 Criteria engine (the trigger / audience model)

**The trigger is deliberately simple — because simplicity drives activation.** Every play ships with **default criteria, always shown in plain English**, so the owner can publish without building anything. **Simple mode** keeps a tiny, relevant default set: **plan + priority are the universal base**, and the prototype additionally surfaces the 1–2 filters most relevant to that specific play (the playbook-aware quick-add). A **"Customize"** path opens a `Simple | Advanced` choice; **Advanced** exposes the full attribute rule builder across the field groups (User · Account · Revenue & billing · Feature adoption · Sentiment). In Advanced the owner can also **describe the audience in plain words and get editable rules** (production uses real AI for this — a one-time cost per activation; the prototype demonstrates it deterministically behind the same contract). Throughout, a **live count and dollars at risk** ("$8,400 at risk · 5 accounts") give the owner instant social proof that the rule is real and worth turning on.

> **Evolution note.** The founder transcript originally framed Simple as "plan + priority only." That was later refined to the **playbook-aware quick-add** now shipped (plan + priority + the 1–2 most-relevant filters per play). Both designs serve the same anti-overwhelm goal — keep the day-one trigger tiny and relevant — and the refinement simply makes the default smarter per play.

#### 5.3.1 Types
- **CriteriaSet** — `{ match: "all"|"any", criteria: Criterion[], nodes?: Node[], name?: string }`. `criteria` is the **flat mirror** (Simple mode + back-compat). `nodes` is the **Advanced structure** (groups + bare criteria). When `nodes` exists it is authoritative; `criteria` is kept in sync as the flattened leaves.
- **Criterion** — `{ id: string, fieldId: string, op: Operator, value?: CriterionValue }`.
- **CriterionValue** = `number | [number,number] | string | string[] | boolean | DateRelValue | undefined`.
- **Group** — `{ id, kind: "group", match: "all"|"any", criteria: Criterion[] }`. **One level of nesting only — groups cannot contain groups.**
- **Node** = `Criterion | Group` (a top-level element).
- **DateRelValue** — `{ verb: "inNext"|"inLast"|"moreThanAgo"|"within", n: number, unit: "days"|"weeks"|"months" }`.

#### 5.3.2 Evaluation rules
An audience can **mix conditions with one level of grouping** (a flat list of conditions, optionally with one layer of "any-of / all-of" groups — groups never contain groups). Evaluation is over **live accounts**: an empty audience matches all live accounts; otherwise an account matches when it passes the top-level conditions per the "all" / "any" join. Each condition applies its operator to the account's value for that field (the operator semantics live in `./playbooks-catalog.json`). **A bad or unknown condition is ignored, never an error** — a single unrecognized field (e.g. a Health field referenced in Phase 1) drops silently and never fails the whole audience. "How many match" is simply the count of matching accounts.

#### 5.3.3 Switching modes never loses the rule
The audience has a simple (flat) shape and an advanced (grouped) shape that describe the **same underlying set**. Toggling between Simple and Advanced **never loses, flattens, or resets the rule**: the flat view and the grouped view stay consistent, and a rule that genuinely uses grouping cannot be silently collapsed (the Simple view is disabled rather than destroying the groups — see E5.3).

#### 5.3.4 Composition & forecast *(Phase 2)*
- **Audience makeup** — the Phase-2 preview shows the makeup of the matching audience as two distribution bars: by Health **band** and by **plan** tier.
- **About-to-match forecast** — the Phase-2 preview also surfaces accounts **likely to match within ~7 days** (not matching yet, but trending toward it), each with a **confidence cue** (high/low) so the owner can act before they slip. (Requires Health trend data, so Phase 2 only.)

#### 5.3.5 Plain-English restatement (a differentiator — §9.A)
- `describeCriterion(c) → string` — renders a criterion as prose: booleans use a phrase dictionary (`revenue.failedPayment → "a payment failed"`); "ago" fields (`engagement.lastLoginDays`, `user.idleDays`) render past-tense with "ago" ("last login was more than 21 days ago"); money uses "over/under"; band/enum membership reads plain "is"; default `"{phrase} {operator-word} {value}"`.
- `describeSet(set) → string` — `"All accounts"` if empty; else `"Accounts where " + nodes joined by " and "/" or "` with groups wrapped in parentheses. Example: `"Accounts where health is At-risk and (last login was more than 21 days ago or payment failed)"`. The UI prefixes `"Runs on "` and lowercases the leading "Accounts" for the section restatement.
- `INVENTORY_FLOOR = 5` — when a set matches ≤ 5 accounts, the UI warns that narrowing further risks an empty list.

### 5.4 Recipe
A pre-seeded starting template. A **Recipe** pairs an id, icon, label, blurb, a criteria set, and a linked downstream playbook. Recipes seed the builder's empty state, name a phrasing example, and link to the downstream play. **In Phase 1, any `health.*` criterion in a recipe's set is stripped before use** (its HL-native parts remain). The 6 seeded recipes are in `./playbooks-catalog.json` (`recipes`).

### 5.5 Playbook

A pre-built, pre-written automation template + a match predicate. **Each playbook is a concrete, named automation for one specific problem** the owner already recognizes (e.g. "workflow execution dropped", "contact creation dropped", "payment failed") — never an abstract category. The library **starts small** (≈5 plays at production launch) and grows toward hundreds. Every playbook ships a **~1-minute explainer video** and an **editable HighLevel workflow snapshot** the agency opens, modifies, and brands (custom variables, logo, colors) and can enrich (sticky notes, links, a "book a call" link) — so the automation is theirs to own, not a black box (§1.1).

#### 5.5.1 Fields
`id`, `title`, `subtitle`, `icon` (lucide name), `state` (PlaybookState), `kind` (PlaybookKind), `problem` (one-sentence situation), `does` (plain-language actions), `outcome` (goal), `actions` (PlaybookAction[]), `category` (PlaybookCategory), `usedByAgencies` (number, social proof), `totalRuns` (number), `launchedDaysAgo` (number), `trending` (boolean), `effort` (PlaybookEffort), `signal` (PlaybookSignal), `audienceKind` (`"account" | "user"` — does the trigger concern the whole account or an individual user's activity; drives the Simple-view default filters — see Appendix C), `videoUrl` (string; "" ⇒ coming-soon placeholder), `videoPoster?` (string), and a **match predicate** that decides whether a given account matches the play today (the per-play default trigger lives in `./playbooks-catalog.json`, `playbooks`).

**PlaybookAction** — `type` (`customer-email|internal-email|slack|task`), `subject?` (email), `preview` (one-line peek), `body?` (fuller draft). Messages interpolate `{{name}}` and `{{account}}` per account at send time.

#### 5.5.2 Enums
A playbook carries a **state** (its seed/default deployment state — the live per-agency deployment state is the AutopilotStatus in §5.7), a **kind**, a marketplace **category** (the 7-bucket taxonomy), a setup **effort** rating, and a **Situation** rating.

The **Situation** rating is the churn↔expansion signal shown on every play, ordered worst→best (Critical · Slipping · Steady · Strong · Booming), each paired with a colorblind-safe diverging color (warm → neutral → cool) and always shown alongside its label. **HARD RULE:** the Situation labels deliberately **avoid the gated Health-band words** (Thriving / Healthy / Watch / At-Risk) — because the marketplace is a Phase-1 surface, the Situation must read in plain language and must never leak coined Health vocabulary. The **churn↔expansion valence matters**: a play's Situation tells the owner at a glance whether it is about *saving* a slipping account or *growing* a thriving one, so a card never mislabels an expansion or renewal opportunity as a risk.

Enum value sets (state · kind · effort), the 7-bucket category taxonomy, and the 5-band Situation rating (labels + descriptions + colorblind-safe colors) are in `./playbooks-catalog.json` (`enums`, `categories`, `situations`).

#### 5.5.3 Playbook selectors
`matchesToday(p) → Account[]` (live accounts where `p.match` is true); `matchCount(p) → number`; `playbookById(id)`; `playbookImpact(p) → {count, mrr}` (matching accounts + their summed MRR); `isNewPlaybook(p)` = `launchedDaysAgo ≤ 14`.

- **`recommendedPlays({healthConfigured, isLive}) → RecommendedPlay[]`** — the **Attention "Start here" ranking** (E2.7). `RecommendedPlay = { p: Playbook, impact: {count, mrr} }`. Non-live plays (`isLive(id) === false`) that match ≥1 account today, **Phase-1-filtered** (excludes plays whose `title|subtitle|problem` match the coined-Health regex when `healthConfigured === false`), sorted `impact.mrr` desc → `impact.count` desc → `usedByAgencies` desc. Deterministic — the rank **is** the at-risk $ across N accounts; production may add AI narrative but never reorder.
- **`mrrKind(p) → "risk" | "grow" | "renewal"`** + **`MRR_KIND_NOUN`** — the **money valence** so a card never mislabels expansion/renewal as "at risk": `signal ∈ {positive, verypositive}` → `grow` ("MRR to grow", positive color); else copy matches `/renew(al|s|ing|ed)?/i` → `renewal` ("MRR up for renewal", warn color); else → `risk` ("MRR at risk", neg color). "at risk" lowercase is plain finance, not the gated Health "At-Risk" band (NFR-4 holds).

**The catalog is a growing library** — ≈57 plays seeded today, starting small and growing toward hundreds over time. Every play (id, title, kind, category, situation, effort, default trigger, and per-play Simple-view filters) lives in `./playbooks-catalog.json` (`playbooks`).

### 5.6 AttentionSignal (queue definition)
A named definition that turns a criteria query + playbook into an Attention queue row. An **AttentionSignal** pairs a tier (`native` or `health`), an icon, a count-aware title, a plain-English `meaning` (e.g. "A charge was declined — these accounts can lose access until billing is fixed."), a criteria set, a linked playbook, and a priority (sort order in the queue). **Tier-1 (native) signals are always active; Tier-2 (health) signals appear only in Phase 2.** Production will add more definitions; the model is fixed. Seeded definitions are in `./playbooks-catalog.json` (`attentionSignals`).

### 5.7 Lifecycle & autopilot (state machine)

A playbook's per-agency deployment state.

- **AutopilotStatus** — `off` (not deployed) · `on` (live, auto-runs) · `paused` (deployed, suspended) · `archived` (soft-removed, history kept). *(`ranonce` is a historical variant of paused for run-once deployments.)*
- **OverseeMode** (governance for a live play) — `auto` (fire automatically; default) · `ease` (delay before first run, then auto) · `review` (manual approval before each run).
- **Transitions:**
  ```
  off ──enable(oversee="auto")──▶ on
  on ──pause()──▶ paused          paused ──resume()──▶ on
  on|paused ──archive()──▶ archived   archived ──restore()──▶ paused (never directly to on)
  on|paused ──disable()──▶ off (hard remove from active; only valid from on/paused)
  ```
- **HARD RULE — no hard deletes** of a playbook that has ever run; use pause/archive. `restore` always lands in **paused** (never auto-live).
- **Capabilities:** the product can enable a play (with an oversee mode), pause, resume, archive, restore, and disable it; change a live play's oversee mode; read a play's current state and oversee mode; and list the plays that are on, paused, or archived. Deployment state is **per-agency**.

### 5.8 WorkflowDraft (setup persistence)
An auto-saved in-progress setup, keyed by recipe. A **WorkflowDraft** captures the audience-in-progress (its match join, conditions, and any groups), which step the owner is on (criteria / workflow / review), whether the HighLevel workflow has been confirmed ready, and when it was last saved. The product can **save, load, clear, and check for** a draft. It autosaves on every step / criteria / readiness change, and is cleared on publish or explicit discard. Drafts are **per-agency**.

### 5.9 Health configuration (the phase flag)
A per-agency flag the product can **read, set, and toggle**: whether Health is configured. It drives every Phase-1 / Phase-2 branch in §6. It is set when the agency completes Health setup.

### 5.10 Multi-tenancy note
Everything above is **scoped to one agency**. An agency owns many Accounts (its sub-accounts) and one set of deployment/draft/health-config state. Playbook *definitions* and the criteria *catalog* are global (seeded), but **autopilot status, drafts, health-config, and any saved criteria sets are per-agency.** Agency isolation is enforced in the product's data layer on every read and write — never merely hidden in the UI.

### 5.11 NotifyConfig (Step-in escalation routing)
The agency owner's standing choice for **how/where they are told when an account needs a human** (E2.9) — so they aren't forced to open the Attention page daily. Operator-grade (channel × cadence + loop-in-owner), **not** a rules engine.

- **NotifyConfig** — `{ channels: ("slack"|"email"|"asana")[], cadence: "digest"|"each", digestTime: string, notifyOwner: boolean, connected: { slack: boolean, asana: boolean } }`.
- **Defaults (low-noise):** `{ channels: ["email"], cadence: "digest", digestTime: "9:00am", notifyOwner: false, connected: { slack:false, asana:false } }`.
- **Semantics:** `cadence: "each"` *is* realtime (no separate setting); `notifyOwner` resolves per-account to the sub-account's personnel (a **semantic token**, never a typed field); Slack/Asana are external handoffs gated behind a **Connect** step (Email needs none); selecting an unconnected channel connects it but does not auto-subscribe.
- **Capabilities:** the product can read the agency's escalation preference, update it (including toggling a channel and connecting an external one), all per-agency. Production wires real Slack/Asana/email delivery and the owner-resolution lookup; the prototype connects via a stub and persists intent only.
- **No AI** participates in routing (E2.9.8).

---
## 6. Epics, user stories & acceptance criteria

> Each epic states its goal, scope, dependencies, and the §5 entities it touches and the §8 capabilities it relies on, then a set of user stories (As a … I want … so that …) with **exhaustive Given/When/Then acceptance criteria** — the build checklist. Every data-rendering story carries explicit **Phase-1 vs Phase-2** ACs; negative/empty/error paths are covered. Epic order: **E1** Platform foundation → **E2** Attention queue & metrics → **E3** Playbooks catalog & marketplace → **E4** Setup & activation flow → **E5** Trigger/criteria builder & matching → **E6** Lifecycle & autopilot → **E7** HighLevel integration & embeds. Dependencies run roughly E1 → {E2…E7}; E5 underlies E2/E4; E6 underlies E2/E4/E7.

## E1 — Platform foundation: accounts, signals & the Health phase gate

**Goal:** Stand up the canonical, agency-scoped **Account** store (§5.1), the **Signal** event log (§5.1.2), the derived-field engine that powers the criteria catalog (§5.2), the full set of **account selectors** (§5.1.3), the **Health configuration flag** (§5.9), and the **phase gate** (§4.4) that governs whether coined Health vocabulary is ever served. This epic is the substrate every other epic (E2 Attention, E3 Marketplace, E4 Setup/Publish, E5 NL compiler, E6 Lifecycle, E7 Execution) reads from. Nothing renders, matches, or runs without it.

**User value:** Mo (the HighLevel agency owner — §3.1) opens GoCSM on day one and immediately sees *his own* sub-accounts, his real MRR, who is failing payment, who has gone quiet, who is renewing — with zero setup and **zero customer-success jargon** (Phase 1). When he later configures Health, the richer Health/lifecycle vocabulary unlocks **additively** without breaking anything he already used (Phase 2). At no point does internal scoring math (PAS, raw pillar scores, velocity internals) leak into anything he can see or filter on.

**In scope:**
- Keeping an agency's HL sub-accounts current in the **Account** model (§5.1), with HL-native data kept fresh (NFR-2) and fully agency-scoped (§5.10).
- Detecting and retaining **Signals** (§5.1.2) from account state changes, including the **sticky-reverse rule** and the "actively losing a critical setup" query (§5.1.3).
- All **account selectors** (§5.1.3), including the Phase-2-only ones and the urgency blend.
- The **phase-filtered criteria catalog** (§5.2).
- The **Health config flag** (§5.9) and the cross-cutting **phase gate** (§4.4 / NFR-4) enforced in the product's data layer.
- **Multi-tenancy & isolation** (§5.10 / NFR-3) on every read/write.
- **Derived-field correctness** for every derivation in the §5.2 catalog, kept in sync with source data, enforced in the data layer (not merely hidden in the UI).

**Out of scope (covered by other epics or §2.3 non-goals):**
- The criteria **evaluation/matching** and plain-English restatement (§5.3 — Epics E2/E5 consume the catalog from this epic but own the matching logic).
- The **describe-to-rules** capability (§5.3 / Epic E5).
- The **Attention queue** generation, the per-signal MRR-at-risk rollup, and the step-in layer (§5.6 / Epic E2).
- The **Playbook catalog**, marketplace facets, recipes, drafts, publish, and lifecycle/autopilot state machine (§5.4–§5.8 / Epics E3, E4, E6, E7).
- The actual **Health setup wizard UX** that computes scores/bands/pillars (this epic owns only the *flag* and the *additive gating behavior*; the scoring pipeline is upstream/assumed).
- Exposing **PAS, raw `pillarScores`, velocity/cap internals** as filterable fields — explicitly forbidden forever (§4.4 rule 3, §2.3).

**Dependencies:**
- Upstream HL data sources kept near-real-time (NFR-2), plus the scoring pipeline that produces `health.*` and `lifecycle.stage` for Phase-2 agencies.
- Auth/tenant context: the agency is derived from auth on every request.
- Persistence for the per-agency Health-config flag (§5.9).

**Data & entities touched:** **Account** (§5.1, all 11 sub-objects), **Signal** (§5.1.2), **account selectors** (§5.1.3), **criteria catalog** (§5.2), **HealthConfig** (§5.9), **multi-tenancy scope** (§5.10). Capabilities relied on (§8): list accounts and one account's detail; read an account's signals; answer the account-selector queries (failed payments, stalled onboarding, lost sticky setups, renewals in a window); read the agency rollup; read the phase-filtered criteria catalog; read and set the Health-config flag.

> **Phase definitions used throughout this epic** (§1.3, §4.4). **Phase 1** = Health not configured (default / trial). **Phase 2** = Health configured. **Live account** (§5.1 preamble) = `status.enabled === "Enabled"` AND `lifecycle.stage !== "churned"`. **TODAY** anchors fixtures to 2026-06-17; production uses the real current date.

---

### Story E1.1 — GoCSM continuously reflects the agency's HL sub-accounts as fresh, agency-scoped account data, so that every other surface works on current data without manual setup.

**Acceptance criteria:**

- **AC E1.1.1 —** Given an authenticated agency, When GoCSM reflects its HL sub-accounts, Then each sub-account is represented as one **Account** (§5.1) with all 11 required sub-objects present (`identity, ownership, status, lifecycle, pipeline, health, login, adoption, revenue, feedback, onboarding`); a sub-account missing a sub-object is hydrated with that sub-object's documented defaults (e.g. `feedback.npsScore = 0` meaning "no feedback yet"; empty arrays for `users/responses/paymentAttempts/planChanges/features/assets`) rather than omitting the key.
- **AC E1.1.2 —** Given an authenticated agency, When it views its accounts, Then it sees **only** that agency's accounts (§5.10 / NFR-3) — no account belonging to any other agency may appear under any circumstance.
- **AC E1.1.3 —** Given two distinct agencies that each manage a sub-account with the same logical id, When each views that account, Then each sees **its own** account; account ids are unique **within an agency** only (§5.10), and id collisions across agencies never cross tenant boundaries.
- **AC E1.1.4 —** Given HL-native data changes upstream (a login, a payment attempt, a plan change, a renewal-date edit, workflow usage, feature usage), When the data is refreshed (kept near-real-time, NFR-2), Then the affected Account sub-objects reflect the latest state, and any "matches right now" / selector / rollup read afterward reflects that latest state (NFR-2).
- **AC E1.1.5 —** Given an agency with **zero** sub-accounts (brand-new/trial), When it views its accounts, Then it sees an empty account list (not an error), and downstream rollups/selectors return their documented empty values (see E1.3 ACs) rather than throwing.
- **AC E1.1.6 —** Given an account id that does not exist within the agency, When it is requested, Then it resolves to "not found" — never another agency's account, never a false success.
- **AC E1.1.7 —** Given a **churned** account (`lifecycle.stage === "churned"`), When it is requested by id, Then it **is** returned (lookup by id includes churned — §5.1.3), even though it is excluded from live-account selectors and the rollup's `liveAccounts`.
- **AC E1.1.8 — (Phase 1)** Given Phase 1 (Health not configured), When any account is presented anywhere, Then the `health` sub-object and `lifecycle.stage` value are **stripped in the product's data layer, not merely hidden in the UI** (NFR-4): no `health.score`, `health.band`, `health.delta`, `health.trend90d`, `health.pillarScores`, `health.riskSignals`, `health.opportunities`, and no `lifecycle.stage` / `lifecycle.reactivated` Health-coined values appear in any field, preview, or copy.
- **AC E1.1.9 — (Phase 2)** Given Phase 2 (Health configured), When any account is presented, Then the `health` sub-object and `lifecycle` are included **additively** (score, band, delta, trend90d, riskSignals, opportunities, lifecycle.stage), and **except** `health.pillarScores`, which remains **internal/never exposed** in either phase (§4.4 rule 3, §5.1.1).
- **AC E1.1.10 —** Given any phase, When any account is presented anywhere, Then **`health.pillarScores` (productAdoption/revenue/login/sentiment), PAS, and velocity/cap internals are never present** — this is unconditional and independent of phase (§4.4 rule 3, §2.3).

**Edge cases & rules:**
- "Live account" is the universal filter for selectors/rollup but **not** for lookup by id (§5.1.3).
- `identity.activeDays` is "days since signup − 7" (§5.1.1) and must be recomputed against the current date as data refreshes, never frozen.
- `onboarding.stalled` is **derived** (`days_on_current_step > sla_days`, §5.1.1) and must be recomputed as data refreshes, not trusted from source.
- Stripping Health in Phase 1 is a **trust/security** requirement (NFR-4), enforced in the product's data layer, not the UI.

**Notes:**
- The agency is derived from auth; no agency id is accepted from the client.
- The Phase-1 Health strip and the `pillarScores` exclusion are enforced once, in the product's data layer (the same gate the catalog reuses in E1.4), so no internal path can leak a gated value; the `pillarScores` exclusion is unconditional, not phase-conditional.

---

### Story E1.2 — GoCSM detects account state changes as Signals and applies the sticky-reverse rule, so that the strongest churn predictor (a critical setup actively being lost) is captured and queryable.

**Acceptance criteria:**

- **AC E1.2.1 —** Given an account state change in any tracked subject, When detected, Then a **Signal** (§5.1.2) is persisted with all fields: `id`, `accountId` (FK), `subject` ∈ `{Domain, Phone, A2P, Funnel, Workflow, Login, Payment, Email, Calendar, NPS}`, `type` ∈ `{setup, usage}`, `direction` ∈ `{forward, reverse}`, `sticky` (boolean), `weight` (1–10), `label` (plain-language), `detectedAt` (ISO), `source` ∈ `{ghl, billing, auth, survey}`.
- **AC E1.2.2 —** Given an account's signals are requested, When served, Then they come back **newest-first** (the `signalsForAccount(id)` selector — §5.1.3), agency-scoped, including non-sticky and forward signals (the full log, not only churn signals).
- **AC E1.2.3 — (sticky-reverse rule)** Given a signal where `sticky === true` AND `direction === "reverse"` AND `type === "setup"` AND `detectedAt` is within **30 days** of the current date (`daysSince(detectedAt) ≤ 30`), When evaluated, Then the account is flagged as **"actively losing a critical setup"** (the strongest churn signal — §5.1.2), the precise four-way conjunction with **all** clauses required.
- **AC E1.2.4 —** Given a signal that satisfies only three of the four sticky-reverse clauses (e.g. `sticky` + `reverse` + `setup` but `detectedAt` is 31+ days old; or `reverse` + `setup` + recent but `sticky === false`; or `sticky` + `reverse` + recent but `type === "usage"`; or `sticky` + `setup` + recent but `direction === "forward"`), When evaluated, Then it does **not** flag the account as losing a critical setup (no clause is optional).
- **AC E1.2.5 — (`lostStickySetups()` selector)** Given the agency's accounts, When the "actively losing a critical setup" query runs, Then it returns the **live** accounts that have at least one sticky-reverse-setup signal ≤ 30 days old (§5.1.3), and excludes accounts whose only such signals are older than 30 days or non-sticky/forward/usage.
- **AC E1.2.6 —** Given an account with **multiple** qualifying sticky-reverse signals, When `lostStickySetups()` is evaluated, Then the account appears **once** (selector returns unique accounts, not signal rows).
- **AC E1.2.7 —** Given an account with zero signals, When its signals are requested, Then the result is an empty list (not an error), and the account does not appear in `lostStickySetups()`.
- **AC E1.2.8 —** Given the 30-day window is measured relative to the current date (TODAY = 2026-06-17 in fixtures; real now in production), When the same signal is queried on consecutive days, Then a signal at exactly `detectedAt = now − 30d` qualifies (`≤ 30`) and at `now − 31d` does not — the boundary is inclusive at 30.
- **AC E1.2.9 — (phase-independence)** Given either phase, When signals are detected/stored/queried, Then behavior is identical: **Signal is HL-native event data and is not gated** (it carries no coined Health vocabulary). The `subject`/`type`/`direction`/`sticky` enums and the sticky-reverse rule are available in Phase 1 and Phase 2 alike.
- **AC E1.2.10 —** Given a malformed inbound state change (unknown subject, weight outside 1–10, missing `detectedAt`), When the detector runs, Then the malformed signal is dropped/quarantined and does **not** corrupt the account's signal log or crash the selector (NFR-9 resilience posture applied to ingest).

**Edge cases & rules:**
- `daysSince(iso)` is unsigned (≥ 0) per §5.1.3 time helpers; the 30-day test uses it.
- Signals are **distinct** from AttentionSignal definitions (§5.6, Epic E2) and from criteria — do not conflate (§4 glossary note).
- `lostStickySetups()` operates over **live** accounts (§5.1.3 preamble: "All operate over live accounts unless noted").

**Notes:**
- The sticky-reverse rule (exact): a signal counts when it is `sticky` AND `reverse` AND a `setup` change AND detected within the last 30 days; the "actively losing a critical setup" list returns the live, unique accounts that have at least one such signal.

---

### Story E1.3 — As the agency owner, I want the account selectors and an agency rollup exposed as services, so that the queue, marketplace impact numbers, previews, and my top-line KPIs all answer "who matches right now / how many / how much MRR" instantly.

**Acceptance criteria:**

- **AC E1.3.1 — (`allAccounts`)** Given the agency, When `allAccounts()` is invoked, Then it returns all **live** accounts (`status.enabled === "Enabled"` AND `lifecycle.stage !== "churned"`); disabled or churned accounts are excluded.
- **AC E1.3.2 — (`failedPayments`)** Given the failed-payments selector, When run, Then it returns live accounts where `revenue.lastPaymentStatus === "failed"` **OR** any entry in `revenue.paymentAttempts` has `status === "failed"` (§5.1.3) — the OR is required; a succeeded-latest account with a prior failed attempt still matches.
- **AC E1.3.3 — (`stalledOnboarding`)** Given the stalled-onboarding selector, When run, Then it returns accounts where `onboarding.stalled === true` AND `status.enabled === "Enabled"` (§5.1.3) — note this selector requires `enabled` explicitly.
- **AC E1.3.4 — (`renewalsWindow`)** Given the renewals-window selector with a min M and max X, When run, Then it returns live accounts where `M ≤ daysUntil(renewalDate) ≤ X`, using **signed** `daysUntil` (positive = future, §5.1.3); a renewal already past (negative days) is excluded unless `min` is negative.
- **AC E1.3.5 — (`lostStickySetups`)** Given the "actively losing a critical setup" selector, When run, Then it matches E1.2.5–E1.2.8 exactly (sticky-reverse, ≤ 30d, live, unique).
- **AC E1.3.6 — (`agencyRollup`)** Given the agency rollup, When read, Then it returns `{ totalAccounts, liveAccounts, mrr, mrrAtRisk }` where: `totalAccounts` = count of **all** the agency's accounts (incl. disabled/churned); `liveAccounts` = count of live accounts; `mrr` = sum of `revenue.mrr` over **live** accounts; `mrrAtRisk` = summed MRR of the **unique** accounts currently surfaced as needing attention (§4 "MRR at risk"; the unique-account union computed by Epic E2's queue, summed here).
- **AC E1.3.7 — (rollup, empty)** Given an agency with zero accounts, When the rollup is read, Then it returns `{ totalAccounts: 0, liveAccounts: 0, mrr: 0, mrrAtRisk: 0 }` (zeros, not null, not an error).
- **AC E1.3.8 — (Phase-2-only selectors gated)** Given **Phase 1**, When any of `byBand`, `byLifecycle`, `healthDistribution`, `dormantGrowth`, `upsellReady`, `byUrgency` is requested, Then GoCSM treats them as **unavailable** (they reference coined Health vocabulary): the selector is not served and no Health-derived row is returned (NFR-4). Given **Phase 2**, the same selectors are available and return Health-derived results.
- **AC E1.3.9 — (`byBand` / `byLifecycle` — P2)** Given Phase 2, When `byBand(band)` is called with `band` ∈ `{atrisk, watch, healthy, thriving}`, Then it returns live accounts where `health.band === band`; When `byLifecycle(stage)` with `stage` ∈ `{onboarding, activated, established, lapsing, dormant, churned}`, Then it returns accounts where `lifecycle.stage === stage` (note: `byLifecycle("churned")` may legitimately return churned accounts).
- **AC E1.3.10 — (`healthDistribution` — P2)** Given Phase 2, When `healthDistribution()` is called, Then it returns `{ thriving, healthy, watch, atrisk: number }` as counts of live accounts per band, using the band thresholds (thriving ≥ 85, healthy 65–84, watch 50–64, atrisk 0–49, §5.1.1); the four counts sum to the live-account count.
- **AC E1.3.11 — (`dormantGrowth` — P2)** Given Phase 2, When `dormantGrowth()` is called, Then it returns live accounts where `lifecycle.stage === "dormant"` AND `health.delta > 0` AND `login.lastLoginDaysAgo ≤ 14` (§5.1.3) — all three required.
- **AC E1.3.12 — (`upsellReady` — P2)** Given Phase 2, When `upsellReady()` is called, Then it returns live accounts that are `health.band` ∈ {healthy, thriving} AND rising (`health.delta > 0`) AND spend-up (`revenue.spendTrend ≥ 10`) AND recently logged in (`login.lastLoginDaysAgo ≤ 14` — "recent login") (§5.1.3 "healthy/thriving + rising + spend↑ + recent login").
- **AC E1.3.13 — (`byUrgency` + urgencyScore — P2)** Given Phase 2, When `byUrgency()` is called, Then it returns live accounts sorted by `urgencyScore` **descending**, where for each account `a`: `riskWeight = (100 − a.health.score) / 100`; `renewalProximity = max(0, 1 − daysUntil(a.revenue.renewalDate)/90)`; `bandFloor = a.health.band === "atrisk" ? 0.4 : a.health.band === "watch" ? 0.2 : 0`; `urgency = max(riskWeight * renewalProximity, bandFloor)` (§5.1.3, verbatim) — ties may be ordered stably by account id.
- **AC E1.3.14 — (selector empties)** Given any selector with no matching accounts, When run, Then it returns an empty list (or for `healthDistribution`, all-zero counts) — never an error.
- **AC E1.3.15 — (agency isolation on every selector)** Given any selector or the rollup, When run, Then results are strictly the calling agency's accounts (§5.10 / NFR-3); no selector may leak another agency's data even on shared/global selector names.
- **AC E1.3.16 — (performance)** Given an agency at scale (~1,000 accounts), When any selector or the rollup runs, Then it stays within the NFR-1 responsiveness budget (the "who matches / how many" answers feel instant; the queue and facet reads stay snappy).

**Edge cases & rules:**
- All selectors except `accountById` operate over **live** accounts (§5.1.3 preamble).
- `mrrAtRisk` is a **unique-account** sum, not a sum over signal rows (§4) — an account surfaced by two signals counts once.
- `spendTrend` is a signed % already on the account (§5.1.1); `≥ 10` is "increasing" per the §5.2 bucketing.
- `bandFloor` guarantees an at-risk/watch account never sorts to zero urgency even if its renewal is far out.

**Notes:**
- The Phase-1-safe selectors (failed payments, stalled onboarding, lost sticky setups, renewals window) are always available; the Phase-2-gated selectors (byBand, byLifecycle, healthDistribution, dormantGrowth, upsellReady, byUrgency) are consumed internally by E2/E3 and available only when Health is configured.
- Phase-2 selectors must be unavailable in Phase 1 in the product's data layer (not merely hidden in the UI), so no internal caller can accidentally surface a band/lifecycle value in a Phase-1 response.

---

### Story E1.4 — As the agency owner, I want the criteria catalog served phase-filtered, so that the trigger builder only ever offers me fields I'm allowed to use — HL-native in Phase 1, Health-inclusive in Phase 2 — and never internal scoring math.

**Acceptance criteria:**

- **AC E1.4.1 —** Given the criteria catalog, When read, Then it provides the curated field list (§5.2) where each field carries `id`, `group` (one of the 8 AttrGroups), `label`, `phrase`, `type` (FieldType), `unit?`, an enum value provider (autocompleted from **live** account values), a `common?` shortlist flag, plus the `FieldType → allowed operators` mapping (see §5.2 / `./playbooks-catalog.json`) and plain-word operator labels (never symbols — see `./playbooks-catalog.json`, `filters.operatorLabels`).
- **AC E1.4.2 — (Phase 1 strips Health)** Given **Phase 1**, When the catalog is read, Then **every `health.*` field is removed** and the entire **"Health & Risk" group** is absent: `health.band`, `health.score`, `health.trend`, `health.riskTags`, `health.lifecycle`, `health.status` do not appear (NFR-4). The catalog then contains only HL-native fields (Account, Engagement & Login, Feature adoption, Revenue & Billing, Feedback, Users groups).
- **AC E1.4.3 — (Phase 1 keeps HL-native lookalikes)** Given Phase 1, When the catalog is served, Then `account.priority` **remains** present — it is `status.isPriority`, an **HL-native, Phase-1-filterable** Account field, *not* a `health.*` field (§5.1.1, §5.2) — and so do all other non-`health.*` fields (`revenue.failedPayment`, `engagement.lastLoginDays`, `revenue.renewsWithin`, `feature.inUse`, `revenue.mrr`, etc.).
- **AC E1.4.4 — (Phase 2 includes Health)** Given **Phase 2**, When the catalog is served, Then the "Health & Risk" group and its fields appear **additively** alongside the Phase-1 fields, with their declared types — `health.band` (type `band`, P2 operators `isAnyOf`/`is`), `health.score` (type `score`), `health.trend` (type `trendDir`), `health.riskTags` (type `enum`), `health.lifecycle` (type `enum`), `health.status` (type `enum`) — and nothing that worked in Phase 1 is removed or changed (§4.4 rule 2).
- **AC E1.4.5 — (always exclude internals)** Given **either** phase, When the catalog is served, Then `health.pillarScores` (productAdoption/revenue/login/sentiment), PAS, and any velocity/cap internal are **never** present as fields (§4.4 rule 3; §5.2: "deliberately ABSENT and must never be added"). This is unconditional, not phase-conditional.
- **AC E1.4.6 — (band field never in P1)** Given Phase 1, When the catalog operator mapping is served, Then the `band` FieldType and the `health.band` field are absent (since the only band field is gated); the `band` operators (`isAnyOf`, `is`) need not be offered in Phase 1.
- **AC E1.4.7 — (multi-value field shape)** Given the catalog, When `feature.inUse` and `health.riskTags` (P2) are served, Then they are typed `enum`, documented as CSV-backed (matched by split + set-intersection so `isAnyOf`/`isNoneOf` work — §5.2 footnote), and their `options()` autocomplete from live account values.
- **AC E1.4.8 — (enum options come from live data)** Given a field with `options()` (e.g. `revenue.plan`, `feature.inUse`, `engagement.activityStatus`), When the catalog is served, Then the option values reflect the calling agency's **live** account values, and in Phase 1 those options never include Health-coined values (e.g. `health.status` is absent entirely, not served with empty options).
- **AC E1.4.9 — (empty agency)** Given an agency with zero accounts, When the catalog is read, Then the field list is still returned in full (the catalog universe is global/seeded — §5.10), but enum value providers return empty option lists (no live values to autocomplete) without error.
- **AC E1.4.10 — (toggle takes effect immediately)** Given an agency that toggles Health on (E1.5), When the catalog is read immediately afterward, Then the Health & Risk group appears in the very next read (the catalog is phase-filtered live off the Health-config flag, not cached across the toggle).

**Edge cases & rules:**
- The catalog is **read-only and curated** (§5.2); the field universe is fixed at ~30 fields and the four `pillarScores` are intentionally not in it.
- `account.priority` is the canonical Phase-1 trap: it *sounds* health-ish but is HL-native (§5.1.1, prototype CLAUDE note) — it must survive Phase-1 stripping.
- Operator labels are plain words, never symbols (§5.2 / `./playbooks-catalog.json`, `filters.operatorLabels`).
- An unknown `fieldId` evaluating to `false` (NFR-9, §5.3.2) is the engine's concern (Epic E2), but the catalog must never *emit* a gated field in Phase 1 that the engine would then have to drop.

**Notes:**
- The Phase filter removes every `health.*` field and the "Health & Risk" group whenever Health is not configured, and always removes `pillarScores`/PAS/velocity internals regardless of phase. This is the same gate as E1.1, enforced once in the product's data layer (not merely hidden in the UI), so the catalog and the account payloads can never disagree on what is gated.

---

### Story E1.5 — As the agency owner, I want to turn Health on for my agency, so that the advanced Health vocabulary (score, bands, lifecycle, Health-derived signals/fields) unlocks additively without breaking anything that already worked.

**Acceptance criteria:**

- **AC E1.5.1 —** Given the Health-config flag, When read, Then it reports the per-agency flag as configured / not configured (§5.9); default for a new/trial agency is not configured (Phase 1).
- **AC E1.5.2 —** Given the Health-config flag is set to configured, When applied, Then the agency transitions to **Phase 2**: subsequent reads of accounts, the criteria catalog, selectors, and the rollup include Health/lifecycle additively per E1.1.9, E1.3.8–E1.3.13, E1.4.4 (§5.9 drives every Phase-1/Phase-2 branch).
- **AC E1.5.3 — (additive, non-breaking)** Given an agency that used Phase-1 audiences/fields (e.g. `revenue.failedPayment`, `engagement.lastLoginDays`, `account.priority`), When it toggles Health on, Then **every Phase-1 field, selector result, and saved criteria set continues to work unchanged** (§4.4 rule 2: "Nothing that worked in Phase 1 changes or breaks"); the change is strictly additive.
- **AC E1.5.4 — (toggle off / Phase-1 restoration)** Given the Health-config flag is set back to not configured (or for an agency that never configured Health), When applied, Then the agency is in **Phase 1** and all Health-coined vocabulary disappears from everywhere again (NFR-4): catalog loses the Health & Risk group, accounts are stripped of `health`/`lifecycle.stage`, and Phase-2 selectors become unavailable — without erroring on any previously-saved Health-referencing criteria (gated fields simply drop, never throw — §5.3.2 unknown-field rule).
- **AC E1.5.5 — (per-agency isolation of the flag)** Given two agencies, When agency A configures Health and agency B does not, Then A is Phase 2 and B is Phase 1 independently (§5.10: "autopilot status, drafts, health-config … are per-agency"); one agency's toggle never affects another's phase.
- **AC E1.5.6 — (idempotency)** Given an agency already in Phase 2, When Health is set to configured again, Then it is a no-op success (no duplicate state, no side effects) — consistent with NFR-6 idempotency.
- **AC E1.5.7 — (immediate effect across surfaces)** Given the flag flips, When the very next catalog, accounts, selector, or rollup read happens, Then it already reflects the new phase (the flag is read live per request, in the product's data layer; no stale phase served — pairs with E1.4.10).
- **AC E1.5.8 — (Health setup completeness, P2 data)** Given an agency in Phase 2 whose scoring pipeline has **not yet populated** `health.*` for some accounts, When those accounts are presented, Then missing Health values are handled gracefully (account still returned; Health-dependent selectors simply exclude accounts lacking the required Health fields) rather than erroring — Phase 2 is additive, never a hard prerequisite (§1.3, §4.4 rule 2).
- **AC E1.5.9 — (auditability)** Given any change to the Health-config flag, When applied, Then the transition is timestamped and attributable (who/when — NFR-7), consistent with the auditability requirement for state changes.

**Edge cases & rules:**
- Phase 2 must **never** be a prerequisite for any Phase-1 capability (§1.3) — turning Health on only *adds*.
- A saved criteria set that references a `health.*` field is valid in Phase 2 and silently drops (evaluates to no-match on those criteria) if the agency reverts to Phase 1 (§5.3.2) — it must not corrupt or error the set.
- The flag is the single source of truth for the phase gate; no other signal (e.g. presence of a band value on an account) may be used to infer phase.

**Notes:**
- The Health-config flag is the single phase gate: it is consulted by the account-presentation layer (E1.1/E1.4) and the selector layer (E1.3) on every read, in the product's data layer (not merely hidden in the UI), so the phase can never be inferred from anything other than the flag.

---

### Story E1.6 — Every read and write is strictly agency-scoped with account ids unique within an agency, so that no agency can ever see or mutate another agency's data.

**Acceptance criteria:**

- **AC E1.6.1 —** Given any read or write in this epic (accounts, account selectors, the rollup, the criteria catalog, the Health-config flag), When served, Then the agency is derived from auth and the result is scoped to exactly that agency (§5.10 / NFR-3); an agency id supplied by the client is ignored or rejected.
- **AC E1.6.2 —** Given an attempt to read another agency's account by id, When served, Then it resolves to "not found" (indistinguishable from a genuinely missing account), never that account's data.
- **AC E1.6.3 —** Given account ids are unique **within** an agency (§5.10 / NFR-3), When two agencies coincidentally use the same id, Then each agency's reads resolve to its own account and never collide.
- **AC E1.6.4 — (writes scoped)** Given any write in this epic (changing the Health-config flag; signal detection; account refresh), When applied, Then it mutates only the calling agency's state; no write can target or affect another agency's accounts, signals, or health-config (§5.10).
- **AC E1.6.5 — (selectors scoped)** Given any selector or rollup, When served, Then it computes only over the calling agency's accounts (re-asserts E1.3.15) — including the global/seeded catalog and playbook definitions, whose **instance data** (`options()`, impact counts) is still computed per-agency.
- **AC E1.6.6 — (global vs per-agency boundary)** Given the catalog and playbook **definitions** are global/seeded (§5.10), When served, Then the *definitions* may be shared but all *derived/instance* values (autopilot status, drafts, health-config, saved criteria sets, enum options, match counts) are per-agency and never shared (§5.10).
- **AC E1.6.7 — (no cross-tenant leakage under error)** Given an internal error while serving one agency, When the error surfaces, Then it must not include another agency's data in messages/logs returned to the client (NFR-3 isolation extends to error payloads).

**Edge cases & rules:**
- Isolation is enforced **in the product's data layer on every read and write** (§5.10 final sentence; NFR-3) — not merely hidden in the UI.
- The only global, shareable artifacts are **definitions** (criteria catalog universe, playbook templates, recipe templates); everything instance-level is tenant-bound.

**Notes:**
- The agency is resolved from auth before any data access; there is no path that reads or writes without an agency scope, and account ids are unique within an agency and never collide across agencies.

---

### Story E1.7 — Every criteria-catalog derived field is computed in the product's data layer and kept in sync with source data, so that audiences match on correct, current values and the restatement/previews never show stale or wrong numbers.

**Acceptance criteria:**

- **AC E1.7.1 — (`engagement.activityStatus` / `login.activityStatus`)** Given an account's `login.lastLoginDaysAgo`, When `activityStatus` is derived, Then it is `highly` for ≤ 7d, `moderately` for 8–30d, `low` for 31–52d, `ghosting` for > 52d (§5.1.1 thresholds). For the catalog enum `engagement.activityStatus`, the surfaced buckets are Active (≤7) / At-risk (8–30) / Dormant (>30) per §5.2.
- **AC E1.7.2 — (`revenue.spendTrend` buckets)** Given `revenue.spendTrend` (signed %), When the `revenue.spendTrend` enum field is derived (§5.2), Then it is `declining` for ≤ −10, `flat` for strictly between −10 and 10, `increasing` for ≥ 10.
- **AC E1.7.3 — (`feedback.sentiment` from NPS)** Given `feedback.npsScore`, When the `feedback.sentiment` enum is derived (§5.2), Then it is `very happy` for NPS ≥ 9, `happy`, `neutral`, `unhappy` per the band mapping, treating `npsScore === 0` as "no feedback yet" (§5.1.1), not as a worst score.
- **AC E1.7.4 — (`revenue.lifetimeSpend`)** Given `revenue.mrr` and `identity.activeDays`, When `revenue.lifetimeSpend` is derived (§5.2), Then it equals `mrr × max(1, activeDays / 30)` — the `max(1, …)` floor guarantees at least one month of spend even for accounts younger than 30 days.
- **AC E1.7.5 — (`revenue.failedPayment`)** Given an account's payment data, When the `revenue.failedPayment` boolean is derived (§5.2), Then it is `true` iff `revenue.lastPaymentStatus === "failed"` **OR** any `revenue.paymentAttempts[].status === "failed"` — identical predicate to the `failedPayments()` selector (E1.3.2), kept in sync.
- **AC E1.7.6 — (`revenue.renewsWithin`)** Given `revenue.renewalDate`, When `revenue.renewsWithin` is derived (§5.2), Then it is `daysUntil(renewalDate)` — **signed**, positive = future (§5.1.3) — so `inNext N` matches `0 ≤ days ≤ N` and a past-due renewal yields a negative value.
- **AC E1.7.7 — (`account.age` / `account.created`)** Given `identity.activeDays` (= days since signup − 7) and the signup date, When `account.age` (days) and `account.created` (dateRelative, signed, negative = past) are derived (§5.2), Then both recompute against the current date on each sync (never frozen).
- **AC E1.7.8 — (`feature.inUse` / `feature.neverUsed`)** Given an account's `adoption.features`, When `feature.inUse` (CSV of features with `engagement > 0`) and `feature.neverUsed` (boolean: all features `engagement ≤ 0`) are derived (§5.2), Then they are consistent: `feature.neverUsed === true` iff `feature.inUse` is empty.
- **AC E1.7.9 — (`feedback.rating`)** Given feedback data, When `feedback.rating` (number) is derived (§5.2), Then it is `NPS / 2` if an NPS is present, else band-based (Phase-2 fallback); in Phase 1 the band-based path is unavailable, so a missing NPS yields no rating rather than a Health-derived one (NFR-4).
- **AC E1.7.10 — (`revenue.paymentFreq`, `revenue.planChange`, `user.role`, `user.keyOnly`, `user.idleDays`)** Given the source fields, When these are derived (§5.2), Then: `paymentFreq` = `annual` for Pro plans else `monthly`; `planChange` ∈ `{upgraded, downgraded, cancelled, reactivated, none}` from `revenue.planChanges`; `user.role` = first user's role; `user.keyOnly` = `true` iff any `LoginUser.keyUser === true`; `user.idleDays` = `login.lastLoginDaysAgo`.
- **AC E1.7.11 — (sync correctness)** Given source data changes on the next NFR-2 sync, When any derived field is read afterward, Then the derived value reflects the new source (derivations are recomputed, not cached stale) — "matches right now" depends on this (NFR-2).
- **AC E1.7.12 — (Phase 1 vs Phase 2 on health-proxy derivations)** Given fields whose derivation references `health.delta` as a proxy (`feature.engagementTrend` = sign of `health.delta`; `health.trend` = sign of `health.delta`), When in **Phase 1**, Then `health.trend` is **not in the catalog** (it is a `health.*` field, stripped — E1.4.2), and `feature.engagementTrend`, which the catalog defines via the `health.delta` proxy, must either be omitted in Phase 1 or computed from an HL-native trend source — it must **never** expose or imply a Health value in Phase 1 (NFR-4). Given **Phase 2**, both are available and use `sign(health.delta)`.
- **AC E1.7.13 — (boundary correctness)** Given threshold boundaries, When derivations are computed, Then boundaries are applied exactly as written: `activityStatus` 7/8 and 30/31 and 52/53 boundaries; `spendTrend` −10 and +10 inclusive into declining/increasing; `sentiment` NPS exactly 9 → "very happy"; `lifetimeSpend` activeDays exactly 30 → factor 1.0 (and < 30 → floored at 1).
- **AC E1.7.14 — (empty/zero data)** Given an account with `npsScore === 0` (no feedback), empty `paymentAttempts`, empty `features`, or `activeDays < 30`, When derivations run, Then they produce the documented empty/floor results (sentiment treats 0 as no-feedback; `failedPayment` false absent any failed attempt; `feature.neverUsed` true; `lifetimeSpend = mrr × 1`) without error.

**Edge cases & rules:**
- Derived fields are computed **in the product's data layer** (not merely in the UI) and are the values the criteria engine (Epic E2) reads per account — they must be authoritative and current (NFR-2).
- The `failedPayment` derivation and the `failedPayments()` selector share one predicate; they must not diverge.
- Any derivation that leans on Health (`health.delta`, band-based fallbacks) is gated/omitted in Phase 1 (NFR-4) — a Phase-1 derived value may never be computed from a Health input.
- Multi-value derived fields (`feature.inUse`, `health.riskTags`) are stored comma-separated and matched by split + set-intersection (§5.2).

**Notes:**
- These derived values back the criteria catalog (E1.4) and are consumed by the audience matching (Epic E2); they are recomputed against fresh source each refresh cycle (NFR-2), never cached stale.
- Exact rules to apply: `activityStatus` (≤7/8–30/31–52/>52); `spendTrend` (≤−10 / −10<x<10 / ≥10); `sentiment` (NPS≥9 → very happy, then happy/neutral/unhappy, 0 = none); `lifetimeSpend = mrr × max(1, activeDays/30)`; `failedPayment = lastPaymentStatus === "failed" OR any paymentAttempts.status === "failed"`; `renewsWithin = daysUntil(renewalDate)`; `rating = npsScore/2` (Phase-1: no band fallback); `keyOnly = any LoginUser.keyUser`; `idleDays = lastLoginDaysAgo`.

---

## E2 — Attention queue & metrics (the action layer)

**Goal:** Generate the live **Attention queue** (the accounts that need a play right now), the two hero metrics (**accounts needing attention** + **MRR at risk**), the **"Start here today"** activation module (the deterministically-ranked top 2–3 plays to turn on now), the **"Step in"** list of accounts a play already ran on but didn't fix, and an inline **escalation config** so the owner is told where they work instead of having to visit daily — so the owner always knows what to act on next, and is nudged to *activate* before there's anything to triage.
**User value:** Mo opens GoCSM and, with zero setup, sees "N sub-accounts need attention · $X MRR at risk"; a **"Start here today"** card set telling him exactly which 2–3 plays to turn on first (with the $ and accounts each protects); a one-click-to-act queue; a short "automation couldn't fix this, reach them directly" list for the ones that need a human; and a "tell me when an account needs me" control so the work comes to his Slack/email/Asana on his cadence. As plays go live the activation module **recedes** into a calm daily-triage banner.
**In scope:** queue derivation from AttentionSignal definitions; the two metrics (with dedup); the **Start-here recommendation module** (deterministic ranking via `recommendedPlays`, per-play valence `mrrKind`, the summed-coverage line, the adaptive recede→graduation); per-row state/copy/routing; the Job-B "Step in" layer (incl. the **Attempt** entity); the **Notify-me escalation config** (**NotifyConfig** §5.11); empty/zero states; the nav-less `/embed/attention` route's data parity.
**Out of scope:** the AttentionSignal *catalog authoring* (definitions are seeded — §5.6; production extends them); the matching engine internals (E5); the setup flow a row opens into (E4); lifecycle transitions (E6); the embed shell mechanics (E7); **real Slack/Asana/email delivery** (the escalation config persists intent + is Connect-stubbed — production wires the actual send/handoff); any LLM in the ranking (the rank is deterministic and transparent — production may add AI *narrative* only, never the verdict).
**Dependencies:** E1 (accounts, signals, phase gate, selectors); E5 (matching, per-play impact, the recommendation ranking); E4 (setup flow a row/card routes into); E6 (a play's deployment status — drives both the row state and the recede→graduation); E1's rollup reuses **MRR at risk**.
**Data & entities touched:** **AttentionSignal** §5.6, **Account** §5.1, **Playbook** §5.5 (Situation, per-play impact, the recommendation ranking, the money-valence rule), **AutopilotStatus** §5.7, **WorkflowDraft** §5.8, the **Attempt** entity defined in E2.4, and **NotifyConfig** §5.11. Capabilities relied on (§8): produce the queue plus its two hero numbers (accounts needing attention + MRR at risk); produce the start-here recommendations; produce the Step-in list; read and update the escalation preference.

> **QueueItem** = an AttentionSignal definition resolved against today's accounts: `{ ...AttentionSignal, count: number, accounts: Account[] }`.

### Story E2.1 — As Mo, I want a live queue of what needs attention, so that I know exactly which sub-accounts to act on without analysis.
**Acceptance criteria:**
- **AC E2.1.1 —** Given the seeded AttentionSignal definitions (§5.6), When the queue is generated, Then for each definition the system computes `accounts = matchAccounts(signal.set)` (over live accounts), builds a **QueueItem** `{...signal, count: accounts.length, accounts}`, and **drops** any definition whose `count === 0`.
- **AC E2.1.2 —** Given the resulting QueueItems, When the queue is returned, Then it is sorted by `priority` **descending** (e.g. `sig-payment-failed`=90, `sig-health-atrisk`=80, `sig-no-login`=70); ties are ordered stably by signal `id`.
- **AC E2.1.3 — (Phase 1)** Given `health-config.isConfigured() === false`, When the queue is generated, Then only `tier === "native"` definitions are evaluated (e.g. `sig-payment-failed`, `sig-no-login`); no `tier === "health"` definition appears and no Health vocabulary leaks (NFR-4).
- **AC E2.1.4 — (Phase 2)** Given `isConfigured() === true`, When the queue is generated, Then `tier === "native"` **and** `tier === "health"` definitions are evaluated and merged into one queue (still sorted by priority desc).
- **AC E2.1.5 —** Given the phase flag changes, When the queue is next requested, Then it is re-derived for the new phase (no stale cross-phase queue served).
- **AC E2.1.6 — (empty)** Given no definition matches any account, When the queue is produced, Then it has no items and the UI shows the empty state (E2.5).
- **AC E2.1.7 —** Given agency isolation (§5.10), When the queue is generated, Then matching runs only over the calling agency's live accounts.
**Edge cases & rules:** an account may match multiple definitions and therefore appear in multiple QueueItems (dedup is handled at the metric/row level, not by removing it from items). `AttentionSignal` definitions are global/seeded; their `set` is phase-evaluated like any CriteriaSet.
**Notes:** each QueueItem is phase-filtered (Phase 1 strips band/lifecycle from every account it carries, E1.1.8).

### Story E2.2 — As Mo, I want two top-line numbers — how many accounts need me and how much MRR is at risk — so that I grasp the stakes in three seconds.
**Acceptance criteria:**
- **AC E2.2.1 — (`needing`)** Given the queue, When `needing` is computed, Then it equals the count of **unique** accounts across all QueueItems: `needing = |⋃ items[i].accounts (by identity.id)|` — an account that matches several signals counts **once**.
- **AC E2.2.2 — (`mrrAtRisk`)** Given the queue, When `mrrAtRisk` is computed, Then it equals the sum of `revenue.mrr` over those **unique** accounts (never double-counted): iterate items, track seen account ids in a set, add `mrr` once per first-seen account.
- **AC E2.2.3 —** Given `needing === 0`, When the hero renders, Then the two metrics are **not shown** (the empty state E2.5 renders instead); Given `needing ≥ 1`, Then both metrics render.
- **AC E2.2.4 — (Pattern 1: no naked numbers)** Given the metrics render, When displayed, Then each carries a plain-language subtext — `needing` → "sub-accounts need attention"; `mrrAtRisk` → "MRR at risk" — and the `$` figure is styled in the at-risk/red treatment.
- **AC E2.2.5 —** Given `mrrAtRisk` is also reported in the agency rollup (E1.3.6), When both are computed for the same agency at the same time, Then they are equal (single source of truth for the unique-account union).
- **AC E2.2.6 — (Phase parity)** Given either phase, When the metrics compute, Then they use only the accounts surfaced by that phase's queue (Phase 1 = native-only union; Phase 2 = native+health union).
**Edge cases & rules:** the union/sum operate on the same QueueItems the rows render from (consistency). An account with `mrr = 0` still counts toward `needing` but adds 0 to `mrrAtRisk`.
**Notes:** the hero numbers and the queue are produced together, so they never disagree.

### Story E2.3 — As Mo, I want each queue row to tell me the event, what it means, the stakes, and a one-click action, so that I can act without thinking.
**Acceptance criteria:**
- **AC E2.3.1 —** Given a QueueItem, When its row renders, Then it shows: **title** = `signal.title(count)` (e.g. "Payment failed on 3 sub-accounts"); **meaning** = `signal.meaning` (the one-line plain-English explainer); a **stake note**; and a right-side **action**.
- **AC E2.3.2 — (stake note)** Given a row, When the stake note renders, Then it is `"${fmtMoney(mrr)} MRR at risk · {names}"` where `mrr` = sum of `revenue.mrr` over `item.accounts`, `names` = the first 3 `item.accounts[].identity.name` joined by ", " with `" +{N} more"` appended when `item.accounts.length > 3`; if `mrr === 0`, show only `{names}` (no "$ at risk" prefix).
- **AC E2.3.3 — (state: live/autopilot)** Given the row's play has `AutopilotStatus === "on"`, When it renders, Then it shows a green "On · autopilot" badge, the stake note is suffixed " · auto-handled, next run tonight", and the action is **Edit** (pencil) → opens the setup flow for that play.
- **AC E2.3.4 — (state: draft)** Given the play is not live but a WorkflowDraft exists for it, When the row renders, Then it shows a "Draft" badge and the action is **Resume setup** → reopens the flow restoring the draft (E4.5).
- **AC E2.3.5 — (state: set-up, native)** Given the play is off, has no draft, and the signal is `tier === "native"`, When the row renders, Then no badge shows and the action is **Set up playbook**.
- **AC E2.3.6 — (state: set-up, health)** Given the play is off, has no draft, and the signal is `tier === "health"` (Phase 2 only), When the row renders, Then it shows a "From Health" badge and the action is **Set up playbook**.
- **AC E2.3.7 — (routing)** Given the owner clicks anywhere on the row or its action, When it activates, Then it opens the setup flow for that signal's play (E4); if a draft exists for that play, the flow opens resuming the draft.
- **AC E2.3.8 — (Phase 1)** Given Phase 1, When a row renders, Then neither the title, meaning, stake note, nor badge contains any Health-coined word; the "From Health" badge never appears (only native signals are present).
**Edge cases & rules:** the stake `mrr` is the **per-item** sum (not the global dedup), so two rows may each include the same account's MRR — that is correct at the row level (the dedup applies only to the hero `mrrAtRisk`). `fmtMoney` = "$" + rounded, thousands-separated.
**Notes:** the row's state derives from the play's deployment status (§5.7) plus whether a draft exists (§5.8).

### Story E2.4 — As Mo, I want a "Step in" list of accounts a play ran on but didn't fix, so that I personally reach the ones automation couldn't save.
**Acceptance criteria:**
- **AC E2.4.1 — (Attempt entity)** Given the system records each play-run outcome per account, When modeled, Then an **Attempt** is `{ id, accountId, accountName, playbookId, playbookTitle, ranDaysAgo, status: "improved"|"flat"|"worse"|"unconfirmed", confidence: "high"|"low", targetPillar? (P2), targetPillarLabel? (P2), preScore? (P2), postScore? (P2) }`. The `*Pillar*`/`*Score` fields are **Phase-2-only** (internal Health diagnostics) and never serialized in Phase 1.
- **AC E2.4.2 — (high-confidence failures)** Given Attempts, When the "Step in" high-confidence group is computed, Then it includes Attempts where `status ∈ {flat, worse} AND confidence === "high" AND ranDaysAgo ≥ 1`.
- **AC E2.4.3 — (low-confidence / unconfirmed)** Given Attempts, When the low-confidence group is computed, Then it includes Attempts where `confidence === "low"`.
- **AC E2.4.4 — (reason copy, Phase 1)** Given Phase 1, When a Step-in row renders, Then the reason is, for high-confidence: `"'{playbookTitle}' ran {ranDaysAgo} days ago — the issue is still open."`; for low-confidence: `"'{playbookTitle}' ran {ranDaysAgo} days ago — outcome not yet confirmed."` — no pillar/score/band wording.
- **AC E2.4.5 — (reason copy, Phase 2)** Given Phase 2, When a high-confidence row renders, Then the reason may use Health diagnostics: `"{targetPillarLabel} still {falling|flat} {ranDaysAgo} days after '{playbookTitle}' ran."`
- **AC E2.4.6 — (contact actions)** Given a Step-in row, When it renders, Then it offers direct contact actions — **Call** (`tel:`), **Email** (`mailto:`), **SMS** (`sms:`) — plus a **"Why"** link to `/accounts/{accountId}`.
- **AC E2.4.7 — (empty)** Given no Attempt qualifies for either group, When the page renders, Then the entire "Step in" section is **omitted** (not an empty card).
- **AC E2.4.8 —** Given the section renders, When grouped, Then high-confidence failures appear above low-confidence/unconfirmed.
**Edge cases & rules:** an Attempt that `improved` never appears in Step-in. `ranDaysAgo ≥ 1` excludes same-day runs from the high-confidence group. The Step-in list is phase-filtered (Phase 1 strips the pillar/score fields). Agency-scoped (§5.10).

### Story E2.5 — As Mo, I want a calm, reassuring state when nothing needs me, so that an empty queue reads as "you're covered", not "broken".
**Acceptance criteria:**
- **AC E2.5.1 —** Given `needing === 0` (no QueueItems), When the page renders, Then it shows "Nothing needs attention right now — GoCSM is watching your sub-accounts." and does not render the two hero metrics.
- **AC E2.5.2 —** Given no qualifying Attempts, When the page renders, Then the "Step in" section is omitted (E2.4.7).
- **AC E2.5.3 —** Given an agency with zero accounts at all, When the page renders, Then it shows the same calm empty state (no error), consistent with E1.1.5.

### Story E2.6 — As Mo, I want the Attention page inside my HighLevel menu, so that I act without leaving HighLevel.
**Acceptance criteria:**
- **AC E2.6.1 —** Given `/embed/attention`, When loaded as a HighLevel custom-menu-link iframe, Then it renders the same queue/metrics/Step-in content **nav-less** (per E7.3) with identical data and phase behavior.
- **AC E2.6.2 —** Given a row is clicked inside the embed, When it routes to the setup flow, Then navigation stays nav-less within the iframe (E7.3.3).
**Notes:** the embed serves the same agency-scoped queue and Step-in content as the full page; only the nav-less shell differs (the E7 embed mechanism).

### Story E2.7 — As Mo, I want the page to tell me exactly which 2–3 playbooks to turn on first, so that I activate the highest-value automation today instead of drowning in dozens of choices.
**Context:** Activation is the page's day-one job. The competitor pattern is a sortable *wall*; GoCSM's wedge is a **hard top 2–3** with the stakes on the card and a one-click turn-on. The ranking is **deterministic and transparent** (it *is* the at-risk $ across N accounts), never a black box — AI may later write the narrative, never decide the order.
**Acceptance criteria:**
- **AC E2.7.1 — (`recommendedPlays` selector)** Given the play catalog, When recommendations are computed, Then `recommendedPlays({healthConfigured, isLive})` returns non-live plays (`isLive(id) === false`) that match ≥1 account today (`playbookImpact(p).count > 0`), each as `{ p, impact: {count, mrr} }`, sorted by `impact.mrr` desc → `impact.count` desc → `usedByAgencies` desc.
- **AC E2.7.2 — (Phase-1 vocab safety)** Given `healthConfigured === false`, When recommendations are computed, Then any play whose `title|subtitle|problem` matches the coined-Health regex (`health|at-risk|thriving|watch`) is **excluded**, so no coined vocabulary can surface in the activation module (NFR-4). Given Phase 2, the exclusion is lifted.
- **AC E2.7.3 — (top 2–3 cap)** Given the sorted recommendations, When the "Start here today" module renders, Then it shows **at most the top 3** as urgent cards; the remainder render in the quieter "More playbooks" list (E2.7.7). Given 0 recommendations, the module is omitted.
- **AC E2.7.4 — (card content)** Given a recommendation card, When it renders, Then it shows: a **rank** (1..3); the **$ figure** (`fmtMoney(impact.mrr)`) as the dominant stat with its **valence noun** (E2.7.5); the play **title**; a one-line **reason** (`p.problem`); the **named accounts** (`count` + first 2 by MRR + " +N more"); a **one-click action** ("Turn it on" / "Resume setup" if a draft exists) routing to `/playbooks/{p.id}`; and a quiet **"Not now"** that dismisses the card for the session (silent, no re-nag).
- **AC E2.7.5 — (valence noun — never mislabel money)** Given a card's $, When the noun renders, Then it is derived from `mrrKind(p)`: `signal ∈ {positive, verypositive}` → **"MRR to grow"** (positive/green); else copy matching `/renew(al|s|ing|ed)?/i` → **"MRR up for renewal"** (warn/amber); else → **"MRR at risk"** (neg/red). An expansion or renewal play is **never** labeled "at risk." ("at risk" lowercase is plain finance language, **not** the coined Health "At-Risk" band — NFR-4 still holds.)
- **AC E2.7.6 — (focal #1 + summed coverage)** Given ≥1 recommendation, When the module renders, Then the **#1** card is visually dominant (full-width, one solid-blue focal action) and the others are a quieter secondary set (soft-blue actions) — exactly one solid focal per screen; and a summed line states coverage as a **subset of the hero total**: "they cover `{fmtMoney(covered)}` of your `{fmtMoney(mrrAtRisk)}` at risk" where `covered` = summed `revenue.mrr` over the **unique** accounts across the top cards (each counted once). When `covered ≥ mrrAtRisk`, the copy collapses to "cover all `{mrrAtRisk}` at risk." The #1 card carries a transparent **"why it's #1"** basis (it is the largest single block of revenue any one play can act on) — stated as fact, **not** as an "AI pick."
- **AC E2.7.7 — (More playbooks, receded)** Given recommendations beyond the top 3, When the "More playbooks for your accounts" list renders (activation phase only), Then it shows the next ~6 as quiet, account-led rows (`{count} accounts · {fmtMoney(mrr)} {valence noun}`) with a plain "Set up" action and a "Browse all {N} playbooks" link — depth without a wall, never out-competing the focal cards.
- **AC E2.7.8 — (one-click routing)** Given any card or its action is activated, When it fires, Then it routes to the play's setup flow (E4), resuming a draft if one exists (E4.5).
**Edge cases & rules:** ranking ties fall through `mrr → count → usedByAgencies` deterministically (stable order across reloads). A play going live mid-session drops out of recommendations on next derivation (E2.8). The summed `covered` uses the **unique-account union** (same discipline as `mrrAtRisk`, E2.2) so it is always ≤ the hero total. The recommendation list is phase-filtered like the queue; production may attach an AI-generated "why now" line per card, but the **order and the $ stay deterministic** (AI narrative only, never the verdict).

### Story E2.8 — As Mo, I want the activation push to fade as I turn plays on, so that the page graduates from "set this up" to "here's today's work" without me ever configuring a mode.
**Acceptance criteria:**
- **AC E2.8.1 — (adaptive phase)** Given `liveCount = |AutopilotStatus.listOn()|`, When the page renders, Then it is in the **activation** phase while `liveCount < 3` **and** ≥1 recommendation exists, otherwise the **ops** phase. The phase is **derived**, never a user setting.
- **AC E2.8.2 — (activation phase)** Given the activation phase, When the page renders, Then the full "Start here today" module (E2.7) leads, and the "More playbooks" list shows.
- **AC E2.8.3 — (ops phase / graduation)** Given the ops phase, When the page renders, Then "Start here" collapses to a slim banner — "You're live — `{liveCount}` playbooks running. Check back here for the accounts that still need you." — with a quiet "`{N}` more playbooks ready when you are" link; "Step in" and the queue lead; the "More playbooks" wall is **not** shown.
- **AC E2.8.4 — (copy heading shifts)** Given the activation module renders with `liveCount === 0` vs `liveCount` 1–2, When the heading renders, Then it reads "Start here today" vs "Turn on a couple more" (eyebrow "Recommended · activate first" vs "Recommended · next best") — never AI-framed.
- **AC E2.8.5 — (no jarring reset)** Given a play is turned on, When the page re-derives, Then the transition is additive (recommendations recompute, the live count rises) with no full-page reset or lost scroll context.
**Edge cases & rules:** the threshold `< 3` matches the top-N cap (E2.7.3) — once the owner has turned on the recommended set, the push is done. If recommendations are exhausted before 3 are live, the page still graduates (no empty activation module). The phase is derived purely from the count of live plays plus the recommendation count — never a stored setting.

### Story E2.9 — As Mo, I want to tell GoCSM where and how often to alert me when an account needs a human, so that the work comes to me (Slack/email/Asana) and I'm not forced to open this page every day.
**Context:** Modeled operator-grade (Linear channel-toggles + GitHub scheduled-reminder), **not** a rules engine. One card, one sentence: channel × cadence + loop-in-owner. Lives inline on the "Step in" section.
**Acceptance criteria:**
- **AC E2.9.1 — (NotifyConfig model)** Given the escalation config, When modeled, Then **NotifyConfig** (§5.11) = `{ channels: ("slack"|"email"|"asana")[], cadence: "digest"|"each", digestTime: string, notifyOwner: boolean, connected: { slack: boolean, asana: boolean } }`, persisted per agency. Defaults are low-noise: `channels: ["email"], cadence: "digest", digestTime: "9:00am", notifyOwner: false, connected: { slack:false, asana:false }`.
- **AC E2.9.2 — (three controls only)** Given the config expands, When it renders, Then it exposes exactly three controls: **channel chips** (multi-select Slack · Email · Asana task), a **cadence** SegmentedControl (**Daily digest** [default] vs **Each one** — "Each one" *is* realtime, no separate setting), and a single **"Also notify the account's owner"** toggle. No escalation chains, timeouts, tag/condition routing, or per-play overrides.
- **AC E2.9.3 — (external-handoff gating)** Given Slack and Asana are external handoffs, When their chip renders unconnected, Then it shows a **"Connect"** affordance and selecting it triggers connect (stub) rather than enabling delivery; Email needs no connect. Both Slack and Asana gate identically.
- **AC E2.9.4 — (owner is a semantic token)** Given "Also notify the account's owner" is on, When it renders, Then "the account's owner" is a **semantic token** (resolves per-account to the sub-account's personnel) shown as a preview chip "→ the account's owner" — never a typed email field. Off by default (at ~1,000 accounts, realtime + owner would flood the owner).
- **AC E2.9.5 — (collapsed summary)** Given the config is collapsed, When it renders, Then a one-line summary states the current state, e.g. "Daily digest at 9:00am → Email" (channels joined), "· owner looped in" appended when on, or "Off — you'll only see these here" when no channel is selected.
- **AC E2.9.6 — (digest preview, scoped)** Given `cadence === "digest"` and ≥1 channel, When the preview renders, Then it shows a sample scoped to the Step-in set: "Your daily Step-in digest — `{stepInCount}` accounts automation couldn't fix." (the count is the Step-in/Attempt set, **distinct** from the hero `needing`).
- **AC E2.9.7 — (persistence)** Given any control changes, When updated, Then NotifyConfig persists immediately (per agency) and the summary reflects it.
- **AC E2.9.8 — (no AI)** Given the config, When it renders, Then **no AI** is involved (no "smart routing"/suggested cadence) — alert routing the owner can't predict is untrustworthy; the violet AI accent never appears here.
**Edge cases & rules:** selecting an unconnected channel connects it but does not auto-enable delivery (connect ≠ subscribe). Digest vs realtime is the only timing control; production batches the digest at `digestTime` in the agency's timezone. Production wires the actual delivery (Slack / Asana / email) and the owner-resolution lookup; the prototype persists intent only. Agency-scoped (§5.10).

---

## E3 — Playbooks catalog & marketplace (the Library)

**Goal:** Serve the play catalog — a growing library (~57 seeded today) — as a browsable storefront — a faceted filter rail (Category · Situation · Setup effort · Highlights), full-text search, sort, an AI-pick hero, and rich cards — plus the read side of "Your playbooks" (Live/Drafts/Paused/Archived grouping).
**User value:** Mo finds the right play in seconds — filtered by what's happening ("Slipping"), by outcome ("Win back at-risk"), or by effort ("Ready to go") — sees real social proof and *his own* at-risk $ on each card, and gets one AI-recommended place to start.
**In scope:** catalog serving + per-play impact; the four facets with **faceted cross-counting**; search; the three sorts; the AI-pick hero selection; the MarketCard payload; the read-side grouping of Your-playbooks; the empty state.
**Out of scope:** the lifecycle *actions* (Pause/Resume/Archive/Restore/Discard) and the state machine (**E6**); the setup flow a card opens (**E4**); the Situation rating *definition* (§5.5.2); the catalog data itself (now in `./playbooks-catalog.json`).
**Dependencies:** E1 (accounts → impact, phase gate); E5 (`matchesToday`/`playbookImpact`); E6 (AutopilotStatus drives Live/Paused/Archived + the card status pill); E4 (Resume/Set up routing).
**Data & services touched:** **Playbook** §5.5 (+ enums, `playbookImpact`, `isNewPlaybook`), **AutopilotStatus** §5.7, **WorkflowDraft** §5.8.

### Story E3.1 — As Mo, I want the full play library with real popularity and my own at-risk $, so that I can judge each play at a glance.
**Acceptance criteria:**
- **AC E3.1.1 —** Given the library, When served, Then each play carries its marketplace metadata (`usedByAgencies`, `totalRuns`, `launchedDaysAgo`, `trending`, `effort`, `signal`/Situation, `category`, `title`, `subtitle`, `icon`, `problem`) plus `impact = playbookImpact(p) = { count, mrr }` computed from `matchesToday(p)` over the agency's live accounts.
- **AC E3.1.2 — (Phase 1)** Given Phase 1, When `impact` is computed for a play whose predicate references Health, Then it is computed from HL-native data only (Health-dependent predicates contribute no matches until Phase 2); the card still appears (its Situation label is plain-word, not Health vocab — §5.5.2 note).
- **AC E3.1.3 — (Phase 2)** Given Phase 2, When `impact` is computed, Then Health-dependent predicates participate and `impact.count`/`mrr` may increase additively.
- **AC E3.1.4 —** Given agency isolation, When impact is computed, Then it uses only the calling agency's accounts (§5.10).

### Story E3.2 — As Mo, I want to narrow the library by category, situation, effort, and highlights with live counts, so that I can find the right play fast and always see how many fit.
**Acceptance criteria:**
- **AC E3.2.1 — (Category, single-select)** Given the Category facet (the 7 buckets + "All"), When a category is selected, Then results are filtered to that `category`; selecting it again (or "All") clears it. Counts: each category's count = number of plays that pass **all other active facets + search** (effort, situation, highlights, q) — i.e. category counts **exclude the category selection itself** so every bucket stays switchable. "All" count = plays passing the other facets.
- **AC E3.2.2 — (Situation, multi-select)** Given the Situation facet (5 bands Critical/Slipping/Steady/Strong/Booming, each with a colored dot + count), When one or more bands are checked, Then results keep plays whose `signal` ∈ the checked set (OR within the facet). Counts: each band's count = plays passing **category + effort + highlights + search** but **not** the Situation selection (so all bands stay switchable).
- **AC E3.2.3 — (Setup effort, multi-select)** Given the Effort facet (Ready to go / Quick setup / Add your wording), When checked, Then results keep plays whose `effort` ∈ the checked set (OR). Counts exclude the Effort selection, include all other facets + search.
- **AC E3.2.4 — (Highlights, multi-select)** Given the Highlights facet ("New this week" = `isNewPlaybook(p)` (`launchedDaysAgo ≤ 14`); "Trending" = `p.trending === true`), When checked, Then results keep plays matching ANY checked highlight. Counts exclude the Highlights selection, include all other facets + search.
- **AC E3.2.5 — (combination)** Given multiple facets active, When results compute, Then a play must pass **every active facet** (AND across facets; OR within a multi-select facet) **and** the search text.
- **AC E3.2.6 — (Phase 1)** Given Phase 1, When facets render, Then the Situation facet uses the plain-word labels (no Health-band words); no facet exposes Health vocabulary.
- **AC E3.2.7 — (clear)** Given any facet/search active, When the owner clicks "Clear all filters", Then all facets + search reset and the full catalog shows.
**Edge cases & rules:** the cross-counting rule is the standard faceted-search one: a facet's own selection is excluded from its own counts so options never drop to 0 just because they're selected. A facet with nothing checked imposes no filter.

### Story E3.3 — As Mo, I want to search the library in plain words, so that I can jump straight to a play I have in mind.
**Acceptance criteria:**
- **AC E3.3.1 —** Given a search query `q`, When applied, Then results keep plays where the lowercased concatenation of `title + " " + subtitle + " " + problem + " " + categoryLabel(category)` **includes** `q.trim().toLowerCase()` (case-insensitive substring).
- **AC E3.3.2 —** Given `q` is empty/whitespace, When applied, Then search imposes no filter.
- **AC E3.3.3 —** Given `q` is active, When facet counts compute, Then they honor `q` (search is part of "all other facets" for cross-counting, E3.2).

### Story E3.4 — As Mo, I want to sort the library by what matters, so that the most relevant plays are first.
**Acceptance criteria:**
- **AC E3.4.1 — (Most used, default)** Given sort = "used", When applied, Then results sort by `usedByAgencies` **descending**.
- **AC E3.4.2 — (Highest impact)** Given sort = "impact", When applied, Then results sort by `playbookImpact(p).mrr` desc, then `playbookImpact(p).count` desc, then `usedByAgencies` desc (exact tie-break chain).
- **AC E3.4.3 — (Newest)** Given sort = "new", When applied, Then results sort by `launchedDaysAgo` **ascending** (freshest first).
- **AC E3.4.4 —** Given any sort, When results render, Then the active sort persists across facet/search changes until the owner changes it; default is "used".

### Story E3.5 — As Mo, I want one AI-recommended play to start with, so that I'm never paralyzed by choice.
**Acceptance criteria:**
- **AC E3.5.1 —** Given the **unfiltered landing view** (no facets active, no search), When the page renders, Then an **AI-pick hero** is shown above the grid; given any facet/search active, Then the hero is **not** shown.
- **AC E3.5.2 — (selection)** Given AI-pick selection, When computed, Then among plays whose `AutopilotStatus !== "on"` (not already live), rank by `playbookImpact(p).mrr` **desc** and pick the top; if none have `mrr > 0`, fall back to the highest `usedByAgencies`. The pick is **never null** (there is always a fallback).
- **AC E3.5.3 — (copy)** Given the pick has `impact.mrr > 0`, When the hero renders, Then it reads "Turn this on first — it works on ${impact.mrr} at risk across {impact.count} of your accounts today." + "Picked because it covers the most at-risk revenue across your accounts right now."; given `mrr === 0`, Then "A popular place to start — used by {usedByAgencies} agencies." + "Picked because nothing's at risk today — this is the most-trusted way to get ahead."
- **AC E3.5.4 — (de-dup)** Given the AI pick is shown, When the grid renders, Then the picked play is **removed** from the grid below (no duplicate card).
- **AC E3.5.5 —** Given the hero CTA "Set up", When clicked, Then it opens the setup flow for the picked play (E4).
**Notes:** the AI-pick selection is agency-scoped (the impact it ranks on depends on the agency's own accounts).

### Story E3.6 — As Mo, I want each play card to show its status, situation, social proof, and my at-risk $, so that I can decide in three seconds.
**Acceptance criteria:**
- **AC E3.6.1 —** Given a play card (MarketCard), When it renders, Then it shows: the play `icon`; a **status pill** (priority: "Live" if `AutopilotStatus==="on"` → "Paused" if `"paused"` → "New" if `isNewPlaybook` → "Trending" if `trending` → else none); the **Situation pill** (band label + colored dot, §5.5.2); `title`; `subtitle`.
- **AC E3.6.2 — (social proof / impact)** Given the card meta, When it renders: if Live → "Running on {impact.count} client(s)"; else → "{usedByAgencies} agencies · {totalRuns} runs" and, only when `impact.mrr > 0`, an at-risk line "${impact.mrr} at risk · {impact.count} account(s) now".
- **AC E3.6.3 — (footer)** Given the card footer, When it renders, Then it shows the effort label (Ready to go / Quick setup / Add your wording) and a quiet CTA: "Manage" if Live, "Resume" if a draft exists, else "Set up".
- **AC E3.6.4 — (whole-card click)** Given the card, When clicked anywhere, Then it opens the setup/detail flow for that play (E4) — the CTA is a visual affordance, not the only target.
- **AC E3.6.5 — (Phase 1)** Given Phase 1, When a card renders, Then the Situation pill + all copy avoid Health-band words; `impact` reflects HL-native matches only.

### Story E3.7 — As Mo, I want a "Your playbooks" tab grouping what I've deployed, so that I can see and manage my live, draft, paused, and archived plays.
**Acceptance criteria:**
- **AC E3.7.1 —** Given the "Your playbooks" tab, When it renders, Then it groups into four ordered sections: **Live** (`status==="on"`; "Running on N clients · next run tonight"), **Drafts** (a saved WorkflowDraft whose play isn't already live; "Draft · {recipe blurb}"), **Paused** (`status==="paused"`; "Paused · would run on N accounts"), **Archived** (`status==="archived"`; "Archived · history kept").
- **AC E3.7.2 —** Given each row, When it renders, Then it exposes the management actions owned by **E6** (Live: Edit/Pause; Drafts: Resume setup/Discard; Paused: Resume/Archive; Archived: Restore).
- **AC E3.7.3 — (empty)** Given no live, paused, draft, or archived plays, When the tab renders, Then it shows "No live playbooks yet" + a "Browse the library" button.

### Story E3.8 — As Mo, I want a clear empty result when my filters match nothing, so that I'm never stuck on a blank grid.
**Acceptance criteria:**
- **AC E3.8.1 —** Given active facets/search that match zero plays, When the grid renders, Then it shows "Nothing matches these filters" + a "Clear all" action that resets facets + search.

---

## E4 — Playbook setup & activation flow

**Goal:** Provide one reusable, full-page **3-step setup & activation flow** that takes an owner from a chosen play (from the marketplace, the Attention queue, or the Accounts table) to a **live or once-run deployment** in ≤ 1 minute, with draft autosave/resume and idempotent publishing. The flow renders identically regardless of entry point; only its seed (recipe vs. fixed-selection) differs.

**User value:** Mo ("see a problem → a play running on the right accounts in ≤ 3 clicks / ≤ 1 minute") gets a guided, no-jargon path: watch what the play does, confirm he's edited it in HighLevel, see who it'll run on in plain English with a live count, and publish — never losing work if he steps away, never double-deploying if he taps Publish twice.

**Why the sequence is ordered and gated.** Activation is deliberately staged in a fixed order — **Action (set up & publish the workflow) → Trigger (who it runs on) → Review → only then does it fire**. Nothing runs on a single account until Review & publish; the workflow must be set up and the audience chosen first, and the owner himself **acknowledges completion** ("I've completed this", which we verify against the workflow being published) rather than GoCSM polling HighLevel to detect it. This is the *same* sequence the three steps already present to the owner ("What it does → When & who → Review"), simply stated here as the gating rule: each step's gate must pass before the next, and publish is the single moment of arming.

**In scope:**
- The persistent flow **header** (back · problem title · "Draft saved" indicator), the 3-step **Stepper**, and the sticky **footer** with context-aware CTAs.
- **Step ① "What it does"**: hero video (or coming-soon placeholder when `videoUrl===""`), the play's `does` text, social proof, and the 2-part HL gate ("Open & modify it" + "I've completed this" → `workflowReady`).
- **Step ② "When & who it runs on"**: this STEP's responsibilities only — seeding criteria from the chosen Recipe (or empty), **Phase-1 stripping of `health.*` seed criteria**, live match count, and the **fixed-selection variant** (static list, run-once). The builder mechanics themselves are Epic E5.
- **Step ③ "Review & publish"**: two plain-English summary cards with Edit links, the phase-gated account preview, the Autopilot toggle (ongoing mode only), and the Publish button.
- **WorkflowDraft** autosave/resume keyed by `recipeId` (§5.8).
- **Publish behavior**: ongoing-autopilot enablement (off→on with chosen OverseeMode), draft clear, calm success state, and idempotency.

**Out of scope:**
- The trigger/criteria **builder** internals — fields, operators, Simple/Advanced modes, NL compile, nested groups, forecast (**Epic E5**).
- The full **lifecycle/autopilot state machine** beyond the initial off→on transition at publish (pause/resume/archive/restore/oversee changes = **Epic E6**).
- HighLevel workflow **execution and message sending** (**Epic E7**; GoCSM only hands off).
- Health configuration itself and the Health-on UI (**Phase 2 surfaces**); this epic only respects the phase flag.
- Marketplace browsing/AI-pick and Attention queue generation (**Epics E2/E3**) — they are entry points into this flow, not part of it.

**Dependencies:**
- **Epic E5** (criteria builder) renders inside Step ②.
- **Epic E6** (lifecycle/autopilot) owns the `AutopilotStatus`/`OverseeMode` store this epic calls at publish.
- **Epic E7** (HL integration) owns the handoff that arms the workflow.
- §5.4 **Recipe** (seed sets + Phase-1 strip rule), §5.5 **Playbook** (`does`, `actions`, `videoUrl`, `usedByAgencies`, `totalRuns`), §5.8 **WorkflowDraft**, §5.9 **Health config** (`isConfigured()`), §5.3.5 `describeSet`.

**§5 entities & capabilities touched** (HL integration is **external** — see E7):
- **WorkflowDraft** §5.8 — autosave/load/clear keyed by recipe, plus a "resume your setups" listing.
- Audience capabilities (§8) — the live match count in ②, the phase-gated account preview in ③, and the plain-English audience restatement on the ③ "When & who" card.
- The **publish** capability — arms a play on the chosen audience with the selected oversight, and (ongoing / autopilot-ON) drives the lifecycle off→on transition (§5.7), idempotently.
- **Playbook** §5.5 — header title, `does`, video, and social proof — and the phase-filtered **criteria catalog** §5.2 (consumed by E5 inside ②).
- The **Health-config flag** §5.9 — drives the Phase-1 strip and the ③ preview branch.

---

### Story E4.1 — As Mo, I want one consistent setup flow no matter where I started it, so that I never have to relearn the screen.

**Acceptance criteria:**
- **AC E4.1.1 —** Given the owner triggers setup from the marketplace (a `playbookId`, optionally via a `recipeId`), the Attention queue (a signal's `playbookId` + its `set`), or the Accounts table (a `playbookId` + a `fixedAccountIds[]` selection), When the flow opens, Then the **same** full-page component renders: persistent header + 3-step Stepper + sticky footer.
- **AC E4.1.2 —** Given the flow is open, When it renders, Then the header shows a **back** affordance (returns to the entry surface, preserving any autosaved draft), the **problem title** (the play's `title`/`problem`), and a **"Draft saved"** indicator (see E4.7).
- **AC E4.1.3 —** Given the flow is open, When it renders, Then the **Stepper** shows the three steps in display order — **① "What it does" → ② "When & who it runs on" → ③ "Review & publish"** — with the current step marked active and completed steps marked done.
- **AC E4.1.4 —** Given any step is active, When it renders, Then the **sticky footer** shows context-aware CTAs: a secondary **Back** (hidden/disabled on ①), and a primary **Continue** (on ① and ②) or **Publish / Publish on N accounts** (on ③), with the primary CTA's enabled/disabled state set by that step's gate (E4.2 / E4.3 / E4.5).
- **AC E4.1.5 —** Given the owner is on step ② or ③, When they click an earlier step in the Stepper (or an Edit link from ③), Then the flow navigates back to that step with all entered state intact (no data loss).
- **AC E4.1.6 —** Given the flow was opened with `fixedAccountIds` (Accounts-table entry), When it renders, Then it enters **fixed-selection mode** for its entire lifetime (Step ② shows the static list, the Autopilot toggle is hidden, the play runs ONCE) — and this mode cannot be switched to ongoing within the flow.

**Edge cases & rules:**
- Entry without a `recipeId` (a bare play with no seeded recipe) ⇒ Step ② seeds an **empty** `CriteriaSet` (`{match:"all", criteria:[]}`).
- A `playbookId` that does not resolve ⇒ flow does not open; the entry surface shows a "play unavailable" error (no blank shell).
- Fixed-selection and recipe-seed are mutually exclusive at open: if both `fixedAccountIds` and a `recipeId` are supplied, **`fixedAccountIds` wins** (fixed mode).
- Drafts are keyed per recipe (§5.8). Fixed-selection runs typically have no recipe, so they may either be persisted under a stable per-play key or skip draft persistence entirely (fixed runs are short and single-session) — whichever convention is chosen, a resume must always map deterministically back to the same in-progress setup.

---

### Story E4.2 — As Mo, I want Step ① to show me what the play does and make me confirm I've set it up in HighLevel, so that I never publish a play I haven't actually edited.

**Acceptance criteria:**
- **AC E4.2.1 —** Given Step ① is active, When it renders, Then it shows: a **hero video** if `playbook.videoUrl !== ""`, otherwise a **coming-soon placeholder** (no broken player); the play's plain `does` text; and **social proof** in the form "Used by {usedByAgencies} agencies · {totalRuns} runs".
- **AC E4.2.2 —** Given Step ① is active, When it renders, Then it shows a **2-part gate**: (a) an **"Open & modify it"** action that opens HighLevel in a **new tab** (the owner edits the pre-written `actions`), and (b) an **"I've completed this"** confirm control.
- **AC E4.2.3 —** Given the owner clicks **"I've completed this"**, When the confirm registers, Then `workflowReady` is set to **true** and the draft autosaves (E4.7).
- **AC E4.2.4 —** Given `workflowReady === false`, When Step ① is active, Then the footer **Continue** is **disabled**; Given `workflowReady === true`, Then **Continue** is **enabled**.
- **AC E4.2.5 —** Given the owner opened HighLevel via "Open & modify it" but has **not** clicked "I've completed this", When they return to the tab, Then `workflowReady` remains **false** and Continue stays disabled (opening HL alone does not satisfy the gate — only the explicit confirm does).
- **AC E4.2.6 —** Given a resumed draft with `workflowReady === true`, When Step ① renders, Then the "I've completed this" control shows its confirmed/checked state and Continue is enabled (the gate is not re-armed on resume).

**Edge cases & rules:**
- `workflowReady` is **per-draft** (lives in the WorkflowDraft, §5.8), not global — switching plays resets it.
- The "Open & modify it" deep link targets the play's HL workflow editor (URL contract owned by E7); if the link is unavailable, the action still renders but surfaces an "open HighLevel" fallback — it must never silently no-op while leaving Continue gated with no path forward.
- Social-proof numbers come straight from the playbook record; if `usedByAgencies`/`totalRuns` are 0, show the literal "Used by 0 agencies · 0 runs" (do not hide — honesty over polish) OR a neutral "New play" treatment, per copy spec; default is the literal counts.
- The owner's "I've completed this" confirm is the **source of truth** for the HighLevel edit — GoCSM never reads HL state back to verify it (the E7 handoff is **trust-the-owner**); the confirm setting `workflowReady` is itself an autosave.

---

### Story E4.3 — As Mo, I want Step ② to let me define who the play runs on (or show me the accounts I pre-picked), so that the play targets exactly the right sub-accounts.

**Acceptance criteria:**
- **AC E4.3.1 —** Given Step ② is active in **ongoing mode** (not fixed-selection), When it renders, Then it shows the trigger/criteria builder (Epic E5) seeded with the chosen **Recipe's `set`** (§5.4) — or an **empty** set if no recipe was supplied.
- **AC E4.3.2 —** Given the seed set in **Phase 1** (`health-config.isConfigured() === false`), When the builder is seeded, Then **every `health.*` criterion is stripped** from the seed before display (§5.4 rule), so no gated Health field, band, lifecycle, or pillar ever appears.
- **AC E4.3.3 —** Given the seed set in **Phase 2** (`isConfigured() === true`), When the builder is seeded, Then `health.*` criteria are **retained** and rendered normally.
- **AC E4.3.4 —** Given Step ② (ongoing mode) renders or the criteria change, When the audience is evaluated, Then a **live match count** is shown ("N accounts match right now"), updating as criteria change (debounced).
- **AC E4.3.5 —** Given ongoing mode and the live match count is **0**, When Step ② is active, Then the footer **Continue** is **disabled** (you cannot publish an audience that matches nobody); Given count ≥ 1, Then Continue is enabled.
- **AC E4.3.6 —** Given **fixed-selection mode** (opened with `fixedAccountIds`), When Step ② renders, Then it shows a **static list** of exactly those pre-selected accounts (name + band-or-plain + $MRR per the phase) **instead of the builder**, and the footer **Continue is enabled** even though no criteria query exists (count = the fixed list length; the count=0 gate does **not** apply, but the list must be non-empty to have reached this flow).
- **AC E4.3.7 —** Given fixed-selection mode, When the owner proceeds, Then the play is scoped to run **ONCE on exactly those accounts** — no ongoing autopilot is established and no criteria set governs future matches.

**Edge cases & rules:**
- Stripping `health.*` in Phase 1 may empty a recipe's set entirely ⇒ Step ② opens on an **empty/near-empty** builder; that's valid (owner adds Phase-1 criteria), and Continue stays gated on count=0 until they do.
- If, after stripping, the set still yields count 0 (e.g., the only Phase-1-safe criterion matches nobody today), Continue stays disabled with the standard count-0 messaging — not an error.
- Fixed list of accounts that have since become non-live (disabled/churned) between selection and setup: filter to live accounts for the run; if all selected went non-live, treat as empty and block publish with a clear "no eligible accounts" message.
- This story's contract is the **step**, not the builder; all field/operator/NL/group behavior is deferred to Epic E5.
- The phase strip is authoritative in the data layer, not merely in the UI (NFR-4): the seeded catalog/set arrives already phase-filtered. The fixed selection is carried straight through to publish (the run needs no criteria query; a descriptive set may be stored only for display).

---

### Story E4.4 — As Mo, I want Step ③ to summarize what the play does and who it runs on in plain English, so that I can confidently publish without re-reading everything.

**Acceptance criteria:**
- **AC E4.4.1 —** Given Step ③ is active, When it renders, Then it shows **two plain-English summary cards**: **"What it does"** (the play's `does` text) with an **Edit** link back to Step ①, and **"When & who it runs on"** (= `describeSet(set)`, §5.3.5) with an **Edit** link back to Step ②.
- **AC E4.4.2 —** Given **fixed-selection mode**, When the "When & who it runs on" card renders, Then it states the fixed run plainly (e.g. "Runs once on the N accounts you selected") instead of a `describeSet` restatement, with the Edit link returning to the Step ② static list.
- **AC E4.4.3 —** Given Step ③ in **Phase 2** (`isConfigured() === true`), When the **account preview** renders, Then it shows **up to 5 real account rows** (name + band + $MRR) plus a **"+N more"** indicator when more than 5 match.
- **AC E4.4.4 —** Given Step ③ in **Phase 1** (`isConfigured() === false`), When the account preview renders, Then it shows **only the count** ("N accounts match right now") — **no band, no per-account rows** (NFR-4).
- **AC E4.4.5 —** Given Step ③ (ongoing mode), When it renders, Then it shows an **Autopilot toggle** labeled "Keep handling new matches", **default ON**, with the consequence line "New accounts that match from here on are handled automatically — pause anytime."
- **AC E4.4.6 —** Given **fixed-selection mode**, When Step ③ renders, Then the **Autopilot toggle is hidden** (a once-run has no ongoing matching), and the consequence line is not shown.
- **AC E4.4.7 —** Given Step ③, When the **Publish** button renders, Then its label is **"Publish"** in ongoing mode and **"Publish on N accounts"** in fixed-selection mode (N = fixed list length).
- **AC E4.4.8 —** Given the owner clicks an **Edit** link, When it activates, Then the flow returns to the linked step with all state intact (E4.1.5), and returning to ③ reflects any changes (e.g., an updated `describeSet` sentence and count).

**Edge cases & rules:**
- In Phase 2, if the match count is ≤ 5, show all rows and no "+N more"; if exactly 5, show 5 rows and "+0 more" is suppressed.
- `INVENTORY_FLOOR = 5` (§5.3.5): in ongoing mode, when the set matches ≤ 5 accounts, surface the narrow-audience caution (carried from E5's builder) but **do not block** publish at ③.
- The Autopilot toggle's value is what determines whether publish enables autopilot (E4.5); toggling it OFF in ongoing mode publishes a one-time run over the **current** matches without arming future matching.
- The preview's band/composition fields exist **only in Phase 2**; in Phase 1 only the count is available, and that gating happens in the data layer (NFR-4), not merely in the UI. The Autopilot toggle drives the oversight chosen at publish (E4.5).

---

### Story E4.5 — As Mo, I want my in-progress setup to save automatically and pick up where I left off, so that I never lose work if I get interrupted.

**Acceptance criteria:**
- **AC E4.5.1 —** Given the owner makes **any** change in the flow — changing step, editing criteria, or flipping `workflowReady` — When the change registers, Then the system **saves a WorkflowDraft** (§5.8) keyed by `recipeId`, with `{ match, criteria, nodes?, step, workflowReady, savedAt }`.
- **AC E4.5.2 —** Given a draft was just saved, When the header indicator updates, Then it shows **"Draft saved"** (reflecting the latest `savedAt`).
- **AC E4.5.3 —** Given the owner reopens the flow for a `recipeId` that **has a saved draft**, When the flow opens, Then it **restores** the saved `step`, `criteria`/`nodes`, and `workflowReady`, and notifies the owner **"Picked up where you left off"**.
- **AC E4.5.4 —** Given the owner reopens the flow for a `recipeId` with **no** saved draft, When the flow opens, Then it starts fresh at Step ① with the recipe/empty seed and **no** resume notice.
- **AC E4.5.5 —** Given a draft is restored in **Phase 1**, When Step ② re-seeds from the restored set, Then any `health.*` criteria in the restored draft are **stripped** on display (the Phase-1 rule applies to restored drafts too, not just fresh recipe seeds).
- **AC E4.5.6 —** Given the owner explicitly **discards** the setup (e.g., a "discard draft" affordance) or **publishes**, When that completes, Then the draft is **cleared**.

**Edge cases & rules:**
- Autosave is **per change**, so rapid edits should be coalesced/debounced; the latest write wins and `savedAt` advances monotonically.
- A resumed draft whose `workflowReady === false` restores to its saved step but keeps the Step-① gate unsatisfied (resume does not fabricate readiness).
- Drafts are **per-agency** (§5.10) — agency isolation enforced on every draft read/write.
- Fixed-selection runs may opt out of draft persistence (E4.1 note); if they do persist, the same restore/clear rules apply.

---

### Story E4.6 — As Mo, I want to publish and have the play go live (or run once) immediately, so that the right accounts get handled without further setup.

**Acceptance criteria:**
- **AC E4.6.1 —** Given Step ③ in **ongoing mode with Autopilot ON**, When the owner clicks **Publish**, Then the play goes live on the chosen audience with the selected oversight — its **AutopilotStatus transitions off→on** with the chosen **OverseeMode** (default `auto`) — the draft is **cleared**, and a calm success state/toast shows **"Your playbook is now live"** with the sub-line **"{title} — first check runs tonight"**.
- **AC E4.6.2 —** Given Step ③ in **fixed-selection mode**, When the owner clicks **Publish on N accounts**, Then the play runs **once on exactly those N accounts** (no autopilot armed), the draft (if any) is cleared, and the success state shows **"{title} — running on N accounts now"**.
- **AC E4.6.3 —** Given Step ③ in **ongoing mode with Autopilot OFF**, When the owner publishes, Then the play runs once over the **current** matching accounts **without** transitioning AutopilotStatus to `on` (no future matches are handled), the draft is cleared, and a success state confirms the one-time run.
- **AC E4.6.4 —** Given the owner clicks Publish **twice** on the same draft (double-tap, retry, or re-open-and-republish of an already-published draft), When the second publish is received, Then it is **idempotent** — **no duplicate live deployment** is created and AutopilotStatus is not toggled again (enabling an already-on play is a no-op, NFR-6, §5.7).
- **AC E4.6.5 —** Given a publish succeeds, When the success state is shown, Then the flow is in a terminal published state (no stale "Continue"/"Publish" CTA that could re-fire), and the entry surface reflects the new live/once-run deployment.
- **AC E4.6.6 —** Given a publish **fails** (network/HL handoff/validation error), When the error returns, Then the draft is **NOT** cleared, AutopilotStatus is **unchanged**, and the owner sees a recoverable error with a **retry** path (re-publishing the same draft remains idempotent).
- **AC E4.6.7 —** Given the audience match count is **0** at the moment of publish in ongoing mode (e.g., accounts changed since Step ②), When Publish is attempted, Then publish is **blocked** with the count-0 messaging (consistent with the E4.3.5 gate) — no empty deployment is armed.

**Edge cases & rules:**
- **Idempotency:** a repeat publish of the same setup resolves to the **existing** deployment rather than creating a new one — the same play + agency + audience never produces two live deployments.
- A play that is **already `on`** for this agency being re-published: the publish updates the audience/oversight on the existing deployment rather than creating a second (no duplicate active deployment per play+agency).
- Success copy is exact: ongoing → "Your playbook is now live" / "{title} — first check runs tonight"; fixed → "{title} — running on N accounts now". The resume notice is exactly "Picked up where you left off" (E4.5.3).
- Publishing does **not** wait on HL execution — it arms the workflow and returns; actual sends happen in HighLevel (E7).

---

---

## E5 — Trigger / audience criteria builder & matching engine

**Goal:** The engine and UX that let an owner define "who a play runs on" — the phase-filtered field catalog (30 fields), the matching engine (count / preview / plain-English restatement / forecast), and the two-mode builder (Simple prebuilt quick-add with no AI; Advanced natural-language describe-to-rules + a one-level boolean rule builder), with a live count that expands to the actual matching accounts.
**User value:** Mo narrows a play to exactly the right accounts in plain English — tapping prebuilt filters or describing his audience in a sentence — always seeing the rule restated plainly and exactly who matches right now, never touching a boolean string or a coined term.

**Why the trigger is built this way (the activation rationale).** The trigger is deliberately **simple for activation** (§5.3). **Simple mode** keeps a tiny, relevant default — **plan + priority are the universal base**, and the shipped prototype additionally surfaces the **1–2 most relevant filters per play** (the playbook-aware quick-add). A **"Customize"** path opens a **Simple | Advanced** choice; **Advanced** exposes the full attribute rule builder across the field groups (User · Account · Revenue & billing · Feature adoption · Sentiment). In Advanced the owner can also **describe the audience in plain words and get editable rules** — production uses **real AI** for this (a one-time cost incurred per activation), and the prototype demonstrates it **deterministically** behind the *same* describe→editable-rules contract. Every play ships **default criteria, always shown in plain English**, and a **live count + $ at risk** ("$8,400 at risk · 5 accounts") gives the owner immediate social proof that the rule is real. (The founder's original "Simple = plan + priority only" was later refined to this playbook-aware quick-add — both serve the same anti-overwhelm goal of keeping the day-one trigger tiny and relevant.)

**In scope:** the catalog service; `evalCriterion`/`matchAccounts`/`matchCount`/`describeSet`/`forecast7d`/`composition`; the two modes + the non-destructive toggle; describe-to-rules (real AI in production, deterministic in the prototype, same contract); the live restatement; the live count + expand-accounts disclosure; per-type value contracts + `makeCriterion` defaults; recipes as seeds.
**Out of scope:** describe-to-rules **uses real AI in production** (the prototype demonstrates it deterministically behind the same contract — not a separate behavior); a second nesting level; exposing PAS/pillar scores; the setup-flow chrome around the builder (E4); persisting the resulting set as a deployment (E4/E7).
**Dependencies:** E1 (phase-filtered catalog, accounts, derived fields).
**§5 entities touched:** **CriteriaSet/Criterion/Group/Node** §5.3, **criteria catalog** §5.2, **Recipe** §5.4. Capabilities relied on (§8): serve the phase-filtered field catalog; answer the live match count and the account preview; restate an audience in plain English; turn a plain-words description into editable rules.

### Story E5.1 — As Mo, I want only the filters I'm allowed to use, organized the way I think, so that I'm never shown jargon or internal scores.
**Acceptance criteria:**
- **AC E5.1.1 —** Given the criteria catalog, When served, Then it returns the **30** FieldDefs (§5.2) grouped into the 8 AttrGroups, each with `id, group, label, phrase, type, unit?, options?, common?`, plus the `FieldType→operators` map and the plain-word operator labels (§9.B). The ~7 `common` fields are flagged for the "Common" shortlist surfaced first.
- **AC E5.1.2 — (Phase 1)** Given Phase 1, When served, Then the "Health & Risk" group and every `health.*` field are absent (E1.4.2); `account.priority` (HL-native) **remains**.
- **AC E5.1.3 — (Phase 2)** Given Phase 2, When served, Then Health & Risk fields appear additively with their types/operators (E1.4.4).
- **AC E5.1.4 — (always excluded)** Given either phase, When served, Then `pillarScores`/PAS/velocity internals are never present (E1.4.5).
- **AC E5.1.5 — (enum options)** Given a field with `options?()`, When served, Then options autocomplete from the agency's live account values; empty agency → empty options, no error.
**Notes:** the catalog this story consumes is the same phase-filtered catalog produced in E1.4.

### Story E5.2 — As Mo, I want "who matches / how many" to always be exactly right for any audience I build, so that I can trust the rule before I publish it.
**Acceptance criteria:**
- **AC E5.2.1 — (set semantics)** Given a CriteriaSet, When `matchAccounts(set)` runs, Then it starts from **live** accounts; if `nodesOf(set)` is empty it returns all live; else with `set.match==="all"` an account must pass **all** top-level nodes, with `"any"` **any** node. `matchCount(set) = matchAccounts(set).length`.
- **AC E5.2.2 — (group semantics, one level)** Given a Group node, When evaluated, Then 0 criteria → true; else AND if `group.match==="all"`, OR if `"any"`. Groups never contain groups (one level only) — a set with deeper nesting is invalid input.
- **AC E5.2.3 — (operators)** Given `evalCriterion`, When applied, Then each operator behaves exactly: `lt/gt/gte/lte/eq` numeric; `between` ⇒ value ∈ [lo,hi]; `is` ⇒ boolean/string equality; `isNot` ⇒ string inequality; `isAnyOf` ⇒ set-intersection ≠ ∅ over the CSV field; `isNoneOf` ⇒ set-intersection = ∅; `contains/startsWith` ⇒ case-insensitive substring/prefix; `inNext` ⇒ `0 ≤ days ≤ N`; `inLast` ⇒ `−N ≤ days ≤ 0`; `moreThanAgo` ⇒ `days < −N`; `within` ⇒ `|days| ≤ N`; `falling` ⇒ value `< 0`; `rising` ⇒ value `> 0`. `N` from DateRelValue: `weeks→×7, months→×30, else n`.
- **AC E5.2.4 — (unknown field)** Given a criterion whose `fieldId` is not in the (phase-filtered) catalog, When evaluated, Then it returns **false** (drop, never error) — a single bad criterion never fails the whole evaluation (NFR-9). A health.* criterion in Phase 1 therefore drops silently.
- **AC E5.2.5 — (live count contract)** Given the builder, When criteria change, Then the new match count is returned and the update **feels instant** over an agency's full account set (~1,000) (NFR-1).
- **AC E5.2.6 — (preview, phase-gated)** Given the account preview, When served, Then it returns the count, the matching accounts (name + monthly $, plus band in Phase 2), and — **only in Phase 2** — the audience composition and the about-to-match forecast (NFR-4).
- **AC E5.2.7 —** Given agency isolation, When any match runs, Then only the calling agency's live accounts are considered.
**Edge cases & rules:** the flat `criteria` mirror is always the flattened leaves of `nodes` (§5.3.3), so count and preview agree no matter which view the rule was built in.

### Story E5.3 — As Mo, I want two ways to build the audience — a simple prebuilt list or an advanced builder — and to switch without losing work, so that easy cases stay easy and hard cases are possible.
**Acceptance criteria:**
- **AC E5.3.1 — (Simple, no AI)** Given Simple mode, When it renders, Then it shows a **prebuilt quick-add list** (the play's default filters — see E5.3.1a / `./playbooks-catalog.json`), lightly grouped by display group (Account · Billing · Feature · Feedback · Users); tapping an item adds a fully-formed editable Criterion seeded by `makeCriterion` defaults (E5.7); a field already in use is hidden from the quick-add; a "Browse all fields" launcher opens the full categorized + searchable picker. **No NL/AI control appears in Simple.**
- **AC E5.3.1a — (playbook-aware defaults)** Given a play with an `audienceKind` (§5.5.1), When the Simple quick-add renders, Then the offered fields = `defaultFiltersFor(playbook)` (materialized per play in `./playbooks-catalog.json`, `playbooks[].defaultSimpleFilters`): the **table-stakes** account filters **Priority account · Plan · Last login** on *every* play; the play's **domain pack** by category (winback → Renewing soon · MRR; revenue → Payment failed · MRR · Renewing soon; adoption → Feature in use · Signed up; onboard → Signed up; grow → MRR · Spend trend; reengage → Signed up; listen → Sentiment · MRR); and — **only for `audienceKind: "user"` plays** (login / individual-user-activity triggers) — the **user pack** **User role · Key users · A user gone quiet**. Account-level plays show **no** user filters. With no play context (lab / create-from-scratch), a generic default list is used.
- **AC E5.3.2 — (Advanced)** Given Advanced mode, When it renders, Then it shows the NL "describe your audience" box (E5.4) **above** a nested boolean rule builder (top-level Match all/any; "Add condition"; "Add group" [one level only]; remove). 
- **AC E5.3.3 — (non-destructive toggle)** Given the owner toggles Simple↔Advanced, When switched, Then existing criteria are preserved (same underlying set). 
- **AC E5.3.4 — (Simple lock)** Given the set has genuine nesting (`isAdvanced(set) === true`), When the owner is in Advanced, Then the **Simple** option is disabled with a quiet note "This rule has groups — editing in Advanced"; the system **never** silently flattens or resets a nested rule to enable Simple (the Gainsight anti-pattern — §9.A).
- **AC E5.3.5 —** Given a flat set (no groups), When toggling to Simple, Then it renders as flat chips with the Match all/any switch (shown only when ≥2 conditions).
**Edge cases & rules:** quick-add items are HL-native in Phase 1 (no health.* fields). "Browse all fields" uses the phase-filtered catalog (E5.1). The two modes are two views of one audience; whether a rule "has groups" (and so locks Simple) is the only thing the toggle needs to know.

### Story E5.4 — As Mo, I want to describe my audience in a sentence and get editable rules, so that I can express a complex audience without building it by hand.
**Acceptance criteria:**
- **AC E5.4.1 — (describe → editable rules)** Given Advanced NL text and the owner submits ("Draft rules"), When the description is turned into rules, Then it produces Criteria that reference **only real catalog fields** (plus any phrases it couldn't match). **Production uses real AI** for this (a one-time cost per activation); the **prototype demonstrates it deterministically** behind the *same* describe→editable-rules contract. Either way the output is editable rules the owner confirms — never an invented field, never auto-committed.
- **AC E5.4.2 — (Phase 1 strip)** Given Phase 1, When compile produces any `health.*` criterion, Then those are stripped from the result before returning (NFR-4).
- **AC E5.4.3 — (0 matches → clarify)** Given the compile yields **no** criteria, When returned, Then the builder shows a "couldn't turn that into rules" clarify state offering recipe shortcuts (E5.8) — never a dead end, never an invented field.
- **AC E5.4.4 — (success → editable + note)** Given the compile yields ≥1 criterion, When returned, Then those drop into the builder as **editable** chips and a soft, dismissible note appears ("I turned your description into the rules above — check I didn't miss anything"). The NL box clears.
- **AC E5.4.5 — (never auto-commit; honesty gate)** Given any compile, When it completes, Then it **never** auto-applies/publishes; the persistent point-of-use helper "We'll turn this into editable rules below — always check them" is shown under the box.
- **AC E5.4.6 — (two correction paths)** Given compiled rules, When the owner re-runs the NL box, Then it overwrites the set; When the owner hand-edits a chip, Then only that chip changes (surgical) and the AI does not re-run.
**Edge cases & rules:** unmatched phrases may be surfaced ("I don't have a field for X") rather than invented. Recipes (E5.8) are offered as the clarify fallback. The result is phase-filtered (Phase-1 `health.*` criteria are stripped before it reaches the builder).

### Story E5.5 — As Mo, I want who the play fires for shown as a distinct, live plain-English hero box at the top, so that I understand my own rule at a glance.
**Acceptance criteria:**
- **AC E5.5.1 — (distinct hero box)** Given the step renders, When the restatement is shown, Then it sits in a **distinct, visually prominent box at the very top** labeled **"WHO THIS FIRES FOR"** — the unmistakable hero element of the step — containing the live plain-English audience sentence `describeSet(set)` (e.g. "Accounts where MRR over $1,500 and renews in the next 30 days.").
- **AC E5.5.2 — (empty)** Given no criteria, When the box renders, Then it reads "Every account — add a filter below to narrow who it runs on (optional)."
- **AC E5.5.3 — (live)** Given any criteria change, When it registers, Then the restatement recomputes immediately.
- **AC E5.5.4 — (groups in English)** Given a nested set, When restated, Then groups render with parentheses in English (§5.3.5) so the sentence stays readable even when the logic is complex.

### Story E5.6 — As Mo, I want to expand the live count and see exactly which accounts match, so that I can trust the rule.
**Acceptance criteria:**
- **AC E5.6.1 —** Given the live count band ("N of your accounts match right now · See who"), When N ≥ 1, Then it is an expandable disclosure; when N = 0 it is disabled.
- **AC E5.6.2 — (Phase 1)** Given Phase 1, When expanded, Then it shows a plain list of matching accounts — **name + monthly $** only — sorted by `revenue.mrr` desc, scrollable; **no band/score/forecast** (NFR-4).
- **AC E5.6.3 — (Phase 2)** Given Phase 2, When expanded, Then it shows the richer preview: rows with `health.band`, a breadth meter (Too narrow/Focused/Too broad/Empty vs total live), the `forecast7d` "likely to qualify this week" ghost rows, and the health composition bar.
- **AC E5.6.4 — (narrow warning)** Given the set matches `≤ INVENTORY_FLOOR (5)` accounts, When shown, Then a caution indicates narrowing further risks an empty list.
- **AC E5.6.5 — (zero)** Given N = 0 with conditions present, When shown, Then a calm "No accounts match yet — loosen a condition" message (not an error).

### Story E5.7 — As Mo, I want each condition to be a complete, sensible sentence I can tweak, so that I never face an empty or confusing control.
**Acceptance criteria:**
- **AC E5.7.1 — (value contracts)** Given a Criterion, When its value is set/validated, Then the shape matches the FieldType: Boolean → `true|false`; Number/days/score → number (+unit); Range(`between`) → `[from|null,to|null]` (empty bound degrades to at-least/at-most); DateRelative → `{verb,n,unit}`; Enum single(`is|isNot`) → string; Enum multi(`isAnyOf|isNoneOf`) → string[] (CSV-matched); Band(P2) → one of atrisk/watch/healthy/thriving; Text(`account.name`) → string with contains/startsWith/is/isNot.
- **AC E5.7.2 — (makeCriterion defaults)** Given a fresh criterion via quick-add/picker, When created, Then it gets sensible defaults so it's a valid sentence immediately: `engagement.lastLoginDays`/`user.idleDays`=21; `revenue.mrr`=1500; `health.score`=60 (P2); range days `[0,30]`, scores `[0,60]`, money `[500,2000]`; dateRelative `inNext`=30d / `inLast`=90d / `moreThanAgo`=21d / `within`=30d; enum=first option; boolean=true; generic numeric default=0, `number`-type default=1; the first operator for the field's type is chosen.
- **AC E5.7.3 — (operator words)** Given any operator shown, When rendered, Then it is a plain word (§9.B), never a symbol; money restates `gt/lt` as over/under; "ago" fields restate past-tense.
- **AC E5.7.4 — (invalid value)** Given an out-of-shape value submitted, When validated, Then the product rejects it with a clear field-level error (or coerces partial numeric input forgivingly) and never crashes the evaluation (NFR-9).

### Story E5.8 — As Mo, I want one-tap starting templates, so that I never face a blank builder.
**Acceptance criteria:**
- **AC E5.8.1 —** Given the 6 recipes (§5.4 / `./playbooks-catalog.json`, `recipes`), When the builder is empty or NL fails, Then they appear as one-tap templates that seed a fully-formed editable set and link a downstream play.
- **AC E5.8.2 — (Phase 1 strip)** Given Phase 1, When a recipe with `health.*` criteria is applied, Then its `health.*` criteria are stripped, leaving its HL-native parts.
- **AC E5.8.3 —** Given a recipe is applied, When seeded, Then the set is fully editable (it's a starting point, not a lock).

### Story E5.9 — As Mo (Phase 2), I want to see who's about to match and the makeup of the audience, so that I can act before accounts slip and gauge breadth.
**Acceptance criteria:**
- **AC E5.9.1 — (forecast)** Given Phase 2, When the about-to-match forecast runs, Then it surfaces accounts **likely to match within ~7 days** — not matching yet, but trending toward it — each carrying a **confidence cue** (high/low) so the owner can act before they slip, ordered soonest-likely first.
- **AC E5.9.2 — (composition)** Given Phase 2, When the audience makeup is shown, Then it gives the breakdown of the matching audience by Health **band** and by **plan** tier.
- **AC E5.9.3 — (Phase 1)** Given Phase 1, When preview is requested, Then the forecast and the makeup are **absent** (they require Health) — only the count + name/$ list are returned (NFR-4).

---

## E6 — Lifecycle & autopilot management

**Goal:** Implement the per-agency playbook deployment state machine (`off → on → paused → archived`) with its governance modes, and the "Your playbooks" management actions (Edit/Pause/Resume/Archive/Restore/Discard) with their confirmations — so a play can be turned on, paused, soft-archived, and restored without ever losing history.
**User value:** Mo controls every play he's deployed — pause one that's noisy, resume it later, archive what he's done with (history kept), restore anytime — with clear one-line confirmations and zero risk of a destructive delete.
**In scope:** the AutopilotStatus state machine + OverseeMode; idempotent transitions; the four "Your playbooks" sections' actions + exact toasts; draft discard; the listing services. 
**Out of scope:** the *read-side grouping* of Your-playbooks (E3.7); enabling-at-publish (E4.6 turns a play on); propagating a lifecycle change to the armed HL workflow (E7.1.7); the catalog/marketplace (E3).
**Dependencies:** E4 (publish enables a play); E3 (the management tab surfaces these actions); E7 (lifecycle changes propagate to HighLevel); §5.8 drafts.
**§5 entities & capabilities touched:** **AutopilotStatus / OverseeMode** §5.7, **WorkflowDraft** §5.8. Capabilities relied on (§8): enable / pause / resume / archive / restore / disable a play; change a live play's oversight; list plays by state; clear a draft.

### Story E6.1 — As Mo, I want my plays to move through a small set of safe, predictable states, so that turning one on, pausing it, or putting it away never loses history or breaks anything.
**Acceptance criteria:**
- **AC E6.1.1 — (transitions)** Given a play, When transitions fire, Then exactly these are valid: `off ──enable(oversee)──▶ on`; `on ──pause──▶ paused`; `paused ──resume──▶ on`; `on|paused ──archive──▶ archived`; `archived ──restore──▶ paused`; `on|paused ──disable──▶ off`. Any other transition is rejected (no-op + safe error).
- **AC E6.1.2 — (restore lands in paused)** Given an archived play, When `restore` is applied, Then it becomes **paused** (never directly `on`) — the owner must explicitly resume to go live.
- **AC E6.1.3 — (no hard delete of run history)** Given a play that has ever run (was `on`/`ranonce`), When the owner removes it from view, Then only **archive** (soft) is available — there is no hard delete; history is retained (§5.7 HARD RULE).
- **AC E6.1.4 — (idempotency)** Given a play already in a target state, When the same transition is requested again (e.g. `enable` on an already-`on` play; `pause` on a paused play), Then it is a no-op success — no duplicate deployment, no side effects (NFR-6).
- **AC E6.1.5 — (OverseeMode)** Given a play is enabled with an oversight mode, When applied, Then the play's governance is set: `auto` (fire automatically; default), `ease` (delay before first run, then auto), or `review` (manual approval before each run); the owner can change the oversight on a live play after deployment.
- **AC E6.1.6 — (per-agency)** Given two agencies, When each manages the same play, Then their deployment states are independent (§5.10) — one agency's transition never affects another's.
- **AC E6.1.7 — (auditability)** Given any transition, When applied, Then it is timestamped and attributable (who/when — NFR-7).
**Edge cases & rules:** `disable` is only valid from `on`/`paused` (hard-remove from active) and is distinct from archive; it is not exposed for plays with run history (archive instead). `ranonce` is a historical paused variant for once-run deployments. Deployment state is **per-agency** (§5.10) and every transition is idempotent (§5.7, NFR-6).

### Story E6.2 — As Mo, I want to manage each deployed play from one place with clear confirmations, so that I always know what happened.
**Acceptance criteria:**
- **AC E6.2.1 — (Live)** Given a Live play (`status==="on"`), When its row renders, Then it offers **Edit** (opens the setup flow for that play, E4) and **Pause**; clicking Pause transitions `on→paused` and shows the toast "Playbook paused — {title} stopped running. Resume anytime."
- **AC E6.2.2 — (Paused)** Given a Paused play, When its row renders, Then it offers **Resume** (transitions `paused→on`, toast "Playbook live again — {title} is running.") and **Archive** (transitions `paused→archived`, toast "Archived — {title} moved to Archived. History kept.").
- **AC E6.2.3 — (Archived)** Given an Archived play, When its row renders, Then it offers **Restore** (transitions `archived→paused`, toast "Restored — {title} is back in Paused — turn it on when ready.").
- **AC E6.2.4 — (meta lines)** Given each section's rows, When rendered, Then Live shows "Running on N clients · next run tonight"; Paused shows "Paused · would run on N accounts"; Archived shows "Archived · history kept" (the read-side from E3.7).
- **AC E6.2.5 — (after action, re-group)** Given any action transitions a play, When it completes, Then the play moves to the correct section on next render and the toast confirms.
- **AC E6.2.6 — (Phase parity)** Given either phase, When managing plays, Then the lifecycle actions behave identically (lifecycle is HL-native; no Health dependency).
**Notes:** "Edit" routes to the setup flow (E4); a live edit **republishes onto the existing deployment** (no duplicate — E4.6.4); the toasts are the exact strings above.

### Story E6.3 — As Mo, I want to discard a draft I no longer want, so that my Drafts list stays clean — without affecting the play itself.
**Acceptance criteria:**
- **AC E6.3.1 —** Given a Draft row, When the owner clicks **Discard**, Then the WorkflowDraft is cleared and the toast "Draft discarded — {title} setup removed." shows.
- **AC E6.3.2 — (draft-only)** Given Discard, When applied, Then it removes **only** the draft — it does **not** archive/disable the underlying play or touch any live deployment.
- **AC E6.3.3 — (Resume)** Given a Draft row, When the owner clicks **Resume setup**, Then the setup flow reopens restoring the draft (E4.5.3).
**Notes:** discard removes the draft only; drafts are per-agency (§5.10).

### Story E6.4 — As Mo, I want my plays listed by state, so that the management tab and the surfaces that show my live plays are always accurate.
**Acceptance criteria:**
- **AC E6.4.1 —** Given a requested state (on / paused / archived), When the plays in that state are listed, Then it returns the agency's play ids in that state (`listOn`/`listPaused`/`listArchived` — §5.7), agency-scoped.
- **AC E6.4.2 —** Given no state is specified, When listed, Then it returns all deployment states for the agency.
- **AC E6.4.3 — (empty)** Given no deployments in a state, When listed, Then an empty list, not an error.
**Notes:** these listings feed E3.7's four sections and the Attention row's "On · autopilot"/"Draft" state derivation (E2.3).

---

## E7 — HighLevel integration, the two actions & embeds

**Goal:** Define the **GoCSM ↔ HighLevel handoff** so that the **two outward actions — Trigger Workflow and Request Feedback — both execute as HighLevel workflows**, and define the three **nav-less embed routes** (`/embed/attention`, `/embed/playbooks`, `/embed/outcomes`) that render the existing pages as HighLevel custom-menu-link iframes. **GoCSM diagnoses and owns the audience + lifecycle; HighLevel executes the workflow and sends the messages.**

**User value:** Mo lives inside HighLevel. He keeps GoCSM's diagnosis (who's slipping, who's thriving) and acting (turn on a play) **inside his HL menu** with no context-switch and no second menu-in-a-menu — and every message a play sends goes out through the HighLevel he already trusts, on the pre-written wording he edited himself.

**In scope:**
- **Trigger Workflow** (the dominant action): the behavioral handoff contract — GoCSM owns the **audience (CriteriaSet) + deployment lifecycle**; HighLevel owns **workflow execution + message delivery**; the owner edits the pre-written `PlaybookActions` inside HighLevel before publish.
- The mapping from the pre-written `actions` (`customer-email | internal-email | slack | task`, with `{{name}}`/`{{account}}` interpolation) onto an HL workflow.
- **Request Feedback** (the second action): the "Listen & celebrate" NPS/feedback request, flowing through the **same** activation model and updating the account's `feedback` over time.
- **Embeds**: an `IS_EMBED` flag (path starts with `/embed`) that drops the nav and renders the same page components nav-less; the guarantee that in-iframe navigation stays nav-less and the embedded pages are otherwise identical (no duplication).
- **Phase boundary**: the handoff + actions work **fully on HL-native data in Phase 1**; Health-derived targeting only **augments** in Phase 2.

**Out of scope:**
- The **internals of HighLevel** (their workflow engine, sending infrastructure, deliverability) — GoCSM does not reimplement them.
- The **setup flow UI** (Epic E4) and the **criteria builder** (Epic E5) — E7 is the integration/handoff layer they call.
- A general HL data-sync/ingestion spec beyond what powers the audience (HL-native account data freshness is NFR-2).
- New embed surfaces beyond the three named routes; **Outcomes/Insights page content** is out of scope (only its embed route shell is in scope).
- Any OAuth/marketplace-app provisioning detail beyond the behavioral contract (house auth conventions apply).

**Dependencies:**
- **Epic E4** publishes the deployment that this handoff arms; what publish hands over — the chosen audience, the oversight mode, and any fixed-account selection — is the input to the Trigger Workflow handoff.
- **Epic E6** owns the lifecycle states (`on`/`paused`/`archived`) whose changes propagate to the armed HL workflow.
- §5.5.1 **PlaybookAction** (the four action types + interpolation), §4.7 (the two actions), §5.1 `feedback` (Request Feedback target), §5.9 Health config (phase boundary).
- The prototype embed mechanism (`AppLayout` `IS_EMBED`, the `/embed/*` routes) — `apps/prototype/CLAUDE.md` "Embeds".

**§5 entities & capabilities touched** (**HL integration is external** — GoCSM calls out to HighLevel, it does not own HL's workflow engine):
- The **publish** capability is the moment GoCSM arms the HL workflow; the **lifecycle** changes (pause/resume/archive/restore/disable, oversight) propagate to the armed workflow (§5.7; detail in E6).
- The **audience** GoCSM resolves (its match count + preview) is what it hands HighLevel.
- **Account** data §5.1 (HL-native, synced from HighLevel and kept fresh, NFR-2) and the per-account **Signal** log §5.1.2.
- The **Health-config flag** §5.9 — the phase boundary that decides whether Health-derived targeting augments the audience.
- The three embed routes are a **frontend** concern (same page components, nav-less); data is the same agency-scoped reads (NFR-3).

---

### Story E7.1 — As Mo, I want publishing a play to arm its HighLevel workflow on the matching accounts, so that HighLevel does the actual sending while GoCSM decides who and when.

**Acceptance criteria:**
- **AC E7.1.1 —** Given a play is **published** (Epic E4), When the handoff runs, Then GoCSM **resolves the audience** from the deployment — the matching accounts of the `CriteriaSet` (ongoing) or exactly the `fixedAccountIds` (once) — and **arms the play's HL workflow** to run on those accounts.
- **AC E7.1.2 —** Given an **ongoing/autopilot** deployment (AutopilotStatus `on`), When new accounts begin matching the audience over time, Then GoCSM **continuously** feeds the newly-matching accounts to the armed HL workflow (the audience is GoCSM-owned and re-evaluated; HighLevel executes per account).
- **AC E7.1.3 —** Given a **fixed-selection** deployment, When the handoff runs, Then the HL workflow runs **once** over exactly the `fixedAccountIds` and is **not** re-armed for future matches.
- **AC E7.1.4 —** Given the handoff, When responsibilities are assigned, Then the contract holds: **GoCSM owns** the audience definition + matching + deployment lifecycle (on/pause/resume/archive); **HighLevel owns** workflow execution + message sending; **the owner owns** editing the pre-written `PlaybookActions` inside HighLevel before publish (the Step-① gate, E4.2).
- **AC E7.1.5 —** Given the play's pre-written `actions` (`customer-email | internal-email | slack | task`), When mapped to the HL workflow, Then each action becomes the corresponding HL workflow step — `customer-email`/`internal-email` → HL email send (with `subject`/`body`), `slack` → HL Slack/notification step, `task` → HL task creation — preserving order.
- **AC E7.1.6 —** Given a message body/subject contains `{{name}}` and/or `{{account}}`, When HighLevel executes per account, Then those tokens are **interpolated** with that account's contact name and sub-account name at send time.
- **AC E7.1.7 —** Given a lifecycle change after publish (pause/resume/archive — Epic E6), When it occurs, Then the change **propagates** to the armed HL workflow (a paused deployment stops feeding accounts to HighLevel; resume restarts it; archive removes it from active feeding without deleting history).

**Edge cases & rules:**
- The owner's "I've completed this" confirm (E4.2.3) is the **trust boundary**: GoCSM does not read HL workflow contents back to verify the edit — the confirm is authoritative.
- An account that **leaves** the audience (no longer matches) on an ongoing deployment should stop being newly-fed; already-in-flight HL executions are HighLevel's to complete (GoCSM does not retroactively cancel a send mid-flight).
- If the HL handoff/arming **fails** at publish, the publish surfaces a recoverable error and does **not** clear the draft or toggle autopilot (consistent with AC E4.6.6); re-publish is idempotent (no duplicate armed workflow per play+agency, NFR-6).
- Empty audience at arm time ⇒ no workflow is armed (consistent with the count-0 publish block, AC E4.6.7).
- Re-arming an already-armed deployment is a **no-op** (idempotent — NFR-6); no play+agency ever ends up with two armed workflows.
- **One playbook maps 1:1 to one HighLevel workflow.** GoCSM hands over the audience + the owner-edited message templates (not pre-baked messages — interpolation happens in HighLevel at send time, AC E7.1.6), and **records which workflow/condition was tried on each account**. That record is the closed-loop **"tried but didn't fix it"** signal — an account a play ran on but that hasn't improved — which is exactly what feeds the Attention **Step-in** list (the Attempt entity, E2.4). The handoff is *write-only* into HighLevel: GoCSM never reads HL workflow contents back (the owner's confirm is the trust boundary, above).

---

### Story E7.2 — As Mo, I want a "Listen & celebrate" play to request feedback/NPS from a sub-account through the same flow, so that I learn how clients feel without a separate tool.

**Acceptance criteria:**
- **AC E7.2.1 —** Given a **Request Feedback** play (the "Listen & celebrate" / `listen` category, §5.5.2), When it is set up, Then it flows through the **same** 3-step activation model (Epic E4) and the **same** Trigger-Workflow handoff (E7.1) — Request Feedback is a **specialization**, not a separate pipeline.
- **AC E7.2.2 —** Given a published Request Feedback play, When the armed HL workflow runs on a matching (or fixed) sub-account, Then HighLevel **requests NPS/feedback** from that sub-account (via the play's pre-written actions, e.g., a feedback-request email/SMS).
- **AC E7.2.3 —** Given a sub-account **responds** with feedback, When the response is received, Then the account's `feedback` is **updated over time** — `feedback.responses[]` appended (date, score 0–10, optional comment), and the derived `npsScore`/`sentiment`/promoter-passive-detractor counts recomputed (§5.1.1 feedback).
- **AC E7.2.4 —** Given Phase 1, When a Request Feedback play targets its audience, Then targeting uses **HL-native** feedback fields only (`feedback.sentiment`, `feedback.rating` from raw NPS — §5.2) — no Health vocabulary; Given Phase 2, Then Health-derived targeting may **augment** (additive).
- **AC E7.2.5 —** Given an account with `feedback.npsScore === 0`, When interpreted, Then it means **no feedback yet** (not a literal score of 0) — Request Feedback plays commonly target exactly these accounts, and the update in AC E7.2.3 transitions them out of the "no feedback yet" state.

**Edge cases & rules:**
- Request Feedback is still a **Trigger Workflow** under the hood — it does not bypass the owner-edits-in-HL gate (E4.2) or the audience/lifecycle ownership (E7.1.4).
- Feedback updates are **per sub-account and cumulative** (`responses[]` grows; `lastFeedbackDate` advances); a re-request to an account that already responded appends a new response rather than overwriting.
- `widgetEnabled`/raw NPS remain HL-native, Phase-1-safe; no coined Health sentiment leaks (NFR-4).
- Request Feedback uses the **same** handoff as E7.1. The actual collection runs in **HighLevel** (external); GoCSM owns the audience and the resulting feedback update — incoming responses write back to the account's `feedback` (appended + derived fields recomputed) and are reflected on the next account read. Targeting uses the §5.2 `feedback.sentiment` / `feedback.rating` definitions, phase-filtered in the data layer.

---

### Story E7.3 — As Mo, I want the GoCSM pages to appear inside my HighLevel menu without a second nav, so that GoCSM feels native to HighLevel.

**Acceptance criteria:**
- **AC E7.3.1 —** Given the routes `/embed/attention`, `/embed/playbooks`, and `/embed/outcomes`, When each is loaded as a HighLevel **custom-menu-link iframe**, Then it renders the **same page component** as its non-embed counterpart, **nav-less** (no Rail / mobile bar).
- **AC E7.3.2 —** Given any `/embed/*` route loads, When the app initializes, Then a load-time **`IS_EMBED`** flag (true iff `path` starts with `/embed`) drops the navigation chrome and renders the embed shell + the page outlet.
- **AC E7.3.3 —** Given an embedded page, When the owner navigates **within** the iframe (e.g., opens the setup flow from the embedded Attention queue), Then navigation **stays nav-less** — the `IS_EMBED` flag is fixed for that iframe's lifetime, so no nav ever reappears inside the embed.
- **AC E7.3.4 —** Given the embedded pages, When compared to the non-embed pages, Then they are **otherwise identical** — the embed reuses the exact same page components and data, with **no duplication** (an edit to a page flows to its embed automatically).
- **AC E7.3.5 —** Given each embed is its **own** iframe (one per custom menu link), When the owner switches HL menu links, Then each loads its own `/embed/<x>` iframe independently (no "menu inside a menu").
- **AC E7.3.6 —** Given an embedded page renders, When phase-gating applies, Then it honors the **same** Phase-1/Phase-2 rules as the non-embed page (no Health vocab in Phase 1) — embedding does not change phase behavior.

**Edge cases & rules:**
- To add an embed, add a `/embed/<x>` route inside the `AppLayout` group pointing at the **same** page component — no new page is created (no-duplication rule).
- The two outward actions and the setup flow work **identically** inside an embed (Trigger Workflow / Request Feedback / publish all function in-iframe); "Open & modify it" (E4.2) opens HighLevel in a new tab as usual.
- The embed shell is purely a layout concern (drop nav); it changes **no** data, no phase logic, no agency scoping — the same agency-scoped reads serve embed and non-embed alike (NFR-3). `IS_EMBED` is fixed once at load for the iframe's lifetime (AC E7.3.3). Outcomes content is out of scope; only its `/embed/outcomes` route shell is in scope here.

---

### Story E7.4 — GoCSM's actions work fully on day-one HighLevel data and only gain power once Health is configured — so the integration never depends on Health being set up.

**Acceptance criteria:**
- **AC E7.4.1 —** Given **Phase 1** (`health-config.isConfigured() === false`), When a play is published and handed off, Then the entire Trigger-Workflow path — audience resolution, arming, the four action types, interpolation, Request Feedback — works **fully on HL-native data** with **zero** Health dependency.
- **AC E7.4.2 —** Given **Phase 1**, When the audience for a play is resolved, Then it references only HL-native fields (logins, payments, workflow usage, plan, renewal, raw NPS, priority flag, MRR — §4.4), and any `health.*` criteria are stripped upstream (E4.3.2) before the handoff sees them.
- **AC E7.4.3 —** Given **Phase 2** (`isConfigured() === true`), When Health is configured, Then Health-derived targeting (bands, lifecycle, health trend) **augments** audiences **additively** — a play that worked in Phase 1 continues to work unchanged; Health only adds new targeting power (§4.4 hard rule 2).
- **AC E7.4.4 —** Given the phase boundary, When responses/previews cross the handoff, Then no `health.*` field, band, lifecycle stage, pillar, or PAS appears in any **Phase-1** path (audience, action templates, feedback updates) — enforced in the product's data layer (NFR-4), not only in the UI.

**Edge cases & rules:**
- Turning Health **on** (Phase 1 → Phase 2) must **not** retro-break any already-live Phase-1 deployment — armed HL workflows keep running on their HL-native audiences; Health targeting is opt-in on new/edited audiences.
- The handoff itself is phase-agnostic in mechanism (it arms a workflow on an audience); only the **audience's available fields** differ by phase.
- PAS and raw pillar scores are never filterable in either phase (§4.4 hard rule 3) — they can never enter an audience handed to HighLevel.
- The phase is applied in the data layer (NFR-4) to every audience before the handoff; the handoff consumes an already-phase-filtered audience and does not itself branch on phase beyond the fields present. No HL-native action or interpolation depends on any Health value.

---

## 7. Non-functional requirements

- **NFR-1 Performance.** Answering "who matches / how many" for an audience must **feel instant** over an agency's full account set (~1,000), and the Attention queue and marketplace facet counts must render fast enough to never make the owner wait. Live count updates while editing feel immediate.
- **NFR-2 Data freshness.** HL-native account data (logins, payments, workflow usage, plan, renewal) stays **near-real-time fresh**. The "matches right now" answer must reflect the latest state.
- **NFR-3 Multi-tenancy & isolation.** Every query is agency-scoped; no cross-agency data access — enforced in the product's data layer, not merely hidden in the UI. Account IDs are unique within an agency.
- **NFR-4 Phase-gating correctness.** No `health.*` field, band, lifecycle stage, pillar, or PAS value may appear in any Phase-1 response (fields list, queue signals, previews, restatement, copy). This is a security/trust requirement, not cosmetic — enforced in the product's data layer, not merely hidden in the UI.
- **NFR-5 Determinism & honesty.** Describe-to-rules only ever produces criteria that reference **real catalog fields**; if the input can't be turned into rules, it says so explicitly (never invents a field). **Production uses real AI** for this (a one-time cost per activation); the **prototype demonstrates it deterministically** behind the same contract. Either way, all AI output is a **draft the owner confirms** — there is no auto-commit path.
- **NFR-6 Idempotency & safety.** Publishing the same draft twice must not create duplicate live deployments. Lifecycle transitions are idempotent (enabling an already-on play is a no-op). No hard deletes of run history.
- **NFR-7 Auditability.** Every lifecycle transition and publish is timestamped and attributable (who/when/from-where). Draft autosaves record when they were last saved.
- **NFR-8 Accessibility & i18n.** Counts announce changes to assistive tech; controls meet the 44×44px touch-target minimum and expose proper combobox/radiogroup/slider semantics; money/number formatting is localizable.
- **NFR-9 Resilience.** A single malformed criterion (unknown field, bad value) drops to no-match rather than failing the whole evaluation.

---

## 8. Capabilities the product must expose

Everything below is **agency-scoped** (the agency is derived from auth) and **phase-filtered** before it reaches the owner — no `health.*` value ever surfaces in Phase 1 (NFR-3, NFR-4). This is a list of *what the product can do*, not how it is wired.

**Accounts & signals**
- List the agency's accounts, and show the full detail of any one account (including a churned account by id).
- Show an account's signal history (the detected state changes), newest first.
- Answer the standing account-selector questions: who has a failed payment, whose onboarding is stalled, who is actively losing a critical setup, and who renews within a given window.
- Give the agency its top-line rollup: total accounts, live accounts, total MRR, and MRR at risk.

**Audiences (who matches)**
- For any audience definition, answer **"who matches right now"** and **"how many"**.
- Restate any audience as a **plain-English sentence**.
- Turn a plain-words audience **description into editable rules** (only ever referencing real catalog fields; production uses real AI, the prototype is deterministic — both behind the same describe→editable-rules contract).
- Offer the curated, phase-filtered **field/operator vocabulary** the builder works over.
- *(Phase 2)* Also answer **"who is likely to match within ~7 days"** (with a confidence cue) and the audience makeup by band and plan.

**Playbook library**
- Browse the play library with faceted filtering (category · situation · effort · highlights), full-text search, and sorting, with live facet counts.
- Show one play's detail and **its own impact** for the agency (how many accounts it acts on and the MRR involved).
- Surface a single recommended "start here" play.

**Setup, drafts & publish**
- **Save and resume** an in-progress setup, and discard it.
- **Publish** a play either **ongoing** (handles new matches over time) or **run-once** (a fixed set of accounts) — idempotently (publishing twice never double-deploys).

**Lifecycle**
- **Pause / resume / archive / restore** a deployment, and change its oversee mode — all idempotent, never destructive (history is always kept).
- List the agency's deployments by state (on / paused / archived).

**Attention**
- Produce the live Attention **queue** (what needs attention now) and its two hero numbers — accounts needing attention and MRR at risk — which never disagree with the rollup.
- Produce the **"Step in"** list of accounts a play ran on but didn't fix.
- **Record and read** the agency's escalation preference (where/how often to be told when an account needs a human).

**Config**
- Read and set the agency's **Health-configured** flag (the phase switch).

---

## 9. Appendices

### Appendix A — Research evidence (what backs the product decisions)

> The Attention & Playbooks design is grounded in (i) internal design/spec briefs derived from the real GoCSM backend + live DBs, and (ii) three external competitor/UX dossiers (built 2026-06-22 from primary sources — vendor docs, help centers, live DOM snapshots, and design authorities NN/g, Baymard, Apple HIG, Material 3, Carbon, W3C ARIA APG). Claims were corroborated across ≥2 sources where possible; single-source claims are flagged in A.4.
>
> **Caveat on superseded context:** one early carry-over brief (`phase-2-playbooks.md`) references a two-repo `sync-ds.sh` workflow and a "$3k/mo" bar. Both are **superseded** — the codebase is now a single monorepo with no vendoring, and the persona bar is **$2,000/mo**. Use the current facts (this PRD, §3.1).

#### A.1 Internal design & spec documents
| Doc | Covers | Grounds |
|---|---|---|
| `gocsm-attribute-filter-catalog.md` | The user-facing attribute/filter universe, derived from the real GoCSM backend (`csm-super-logger`) + live MongoDB (`prod_v2`) + ClickHouse (`prod`). | The ~30-field criteria catalog (§5.2); the **"only expose what the customer already sees; never expose PAS / raw pillar scores / healthScore proxy / velocity-cap internals"** rule; six control types; relative-date as non-negotiable for renewal/last-login; the near-real-time data-freshness expectation (NFR-2). |
| `cpdo-brief.md` | The shipped fidelity contract for the trigger criteria builder ("who it runs on"). | The two-mode model (Simple flat AND/ANY + Advanced one-level visual groups, **never a typed boolean string**); NL→editable-chips; live "runs on N" count + preview always visible; per-type controls; the ~24-field "common-first" set; recipes re-seeded from real fields. |
| `trigger-situation-v2-brief.md` | The v2 delta: Situation rename + two-mode collapse + top restatement. | The Situation labels (Critical/Slipping/Steady/Strong/Booming) that **avoid the gated Health-band words**; the diverging colorblind-safe scale; Simple = prebuilt picks (no AI), Advanced = NL + builder; the **non-destructive** toggle; the live plain-English restatement promoted to the top (the differentiator). |
| `cpdo-brief-activation-steps-2-3.md` | The fidelity contract for setup steps "What it does" + "Review & publish". | Step ① demote the video to optional, make the action list the hero, reframe publish as "switch it on in HighLevel"; Step ③ hero audience **count**, glanceable real-account preview, explicit **now-vs-future** split (run = these N now; autopilot = new matches), autopilot **default ON** with one-line consequence, calm in-flow success state (not a corner toast). |
| `trigger-criteria-builder-redesign.md` | The originating design brief (user complaints → what to build). | Multi-line NL input with teaching placeholder; real AND/OR rule engine simplified into Simple + Advanced; restatement always above the rules; live match count. |

#### A.2 External research dossiers
- **`cs-platform-builders.md`** — *method:* web search + fetch over Gainsight, ChurnZero, Vitally, Planhat, Totango, Custify, Catalyst (vendor docs, G2/Capterra, demo material; some 403'd → search-indexed text + dev docs). *Key findings:* one filter primitive (field→operator→value) reused everywhere; **Gainsight's hand-typed boolean string silently resets OR→AND** (the footgun we ban); **ChurnZero's flat AND-only** is safest for the persona; **Catalyst's real-time match count** is the only verified live counter; **Totango's suggested filters + prebuilt SuccessBLOCs** are the best ADHD on-ramp; the **open white space = NL paired with a simple, flat, editable, human-readable rule + live count** (nobody owns it).
- **`nl-to-filter-ai.md`** — *method:* live DOM snapshots (Perplexity, ChatGPT, v0) + HubSpot/Salesforce/Amplitude/Mixpanel/ThoughtSpot/Segment/Airtable docs + NN/g, Geist, HIG, Material 3. *Key findings:* NL is a **draft compiler, not an oracle** — every product lands the user in an **editable structured rule** and never auto-applies; **HubSpot Breeze's verbatim loop** (NL → preview → "Add these filters" → editable) is the model; multi-line auto-grow is the expected default; placeholder = short invitation, teaching examples go **below as chips**; Cmd/Ctrl+Enter submits a composition box; **ground to real schema — if NL references an off-catalog field, say so, don't invent**; honesty disclaimer must be **at the point of use** (HubSpot buries it — a gap to beat); the "Keyhole/typing-bottleneck" effect (one tap ~500ms vs 5–10s to type) ⇒ pair NL with one-tap recipes.
- **`filter-controls-ux.md`** — *method:* Baymard, NN/g, UXmatters, Polaris, Carbon, Material 3, ARIA APG, Linear/Notion/Airtable teardowns; adversarially verified on three hard questions. *Key findings:* **Boolean = Yes/No segmented, NOT a toggle** (>50% misread a lone toggle; toggle is for instant-effect settings); **Range = two number inputs primary, slider optional companion, never alone** (Baymard bans slider-only); **Date = relative-first inline sentence** (`in the next/last N days`) + quick-picks, absolute calendar secondary; **Enum ≤7 = pills, else searchable combobox + chips**; **operators are plain words rendered inline, auto-pluralizing** (Linear), never `>=`/`!=`; every field gets a sane default + a unit affix.

#### A.3 Consolidated competitor/pattern → GoCSM decision table
| Source | Pattern observed | How it informed GoCSM |
|---|---|---|
| **ChurnZero** | Flat AND-only; sensible non-empty default | Simple mode = flat list + one Match ALL/ANY; never open on a blank canvas (recipes + quick-add seed it) |
| **Gainsight** | Hand-typed boolean string `(A AND B) OR C`; silently resets to AND | **BANNED**: no typed boolean; visual one-level groups; Advanced→Simple disabled (never silently flatten) — §5.3, E5 |
| **Catalyst** | Real-time "X records match" counter | The live "N accounts match" count + the expand-to-see-who disclosure — E5 |
| **Totango / SuccessBLOCs** | Suggested filters + prebuilt segments + color-coded fields | The 6 recipes + the Simple quick-add list + "Common" shortlist — §5.4, E5 |
| **HubSpot Breeze** | NL → preview → "Add these filters" confirm → editable | NL compiles to editable chips; never auto-commits; re-run overwrites, hand-edit is surgical; "always check them" gate — E5 |
| **Linear** | Sentence-of-chips with auto-pluralizing plain-word operators | CriterionChip grammar (field·operator·value), plain words, `is`→`is any of` — E5 |
| **ThoughtSpot / Salesforce Einstein** | Verify-in-plain-English tokens; per-attribute reasoning; ground to real schema | The plain-English restatement; compile only against real catalog fields; unknown field ⇒ explicit, never invented — §5.3.5, E5 |
| **Baymard (sliders)** | Dual-slider misread >50%; pair with inputs | Range = two inputs primary, slider optional companion — E5 |
| **Carbon / Material 3 (toggles)** | Toggle = instant-effect only | Boolean filter value = Yes/No segmented, not a toggle — E5 |
| **Polaris / GA4 / Amplitude** | Relative-first date control | `inNext/inLast/moreThanAgo/within` + quick-picks; absolute secondary — §5.2/§5.3, E5 |
| **Totango + ActiveCampaign + HubSpot** | Make now-vs-future enrollment split explicit | Step ③: run = "these N now" vs autopilot = "new matches" — E4 |
| **Mailchimp/Totango** | Prebuilt named segment templates | Recipes as one-tap starting templates — §5.4 |
| **NN/g** | Placeholder = invitation; teaching examples as chips; point-of-use disclaimer | NL placeholder + example chips below; honesty line at point of use — E5 |
| **Colorblind diverging-scale guidance** | Red→green not safe; pair color with label | Situation scale warm→neutral→cool, label always present — §5.5.2 |

#### A.4 Research confidence flags
| Finding | Confidence | Note |
|---|---|---|
| Live "X accounts match" counter while editing | **High** (Catalyst) | Catalyst docs explicit; other vendors confirm live *list*, numeric counter unverified |
| Group nesting depth = 1 level | **High** | Vitally/Planhat documented one level; Totango 3-level still open beta — we ship **one level** |
| NL→segment editability/persistence | **Medium-high** | Custify verified copy but vendor-claimed UX; Totango leans non-persistent surfacing |
| Per-type value-control matrices | **Medium** | Confirmed exemplars per product, not exhaustive specs; some operator lists 403'd |
| Gainsight "OR reverts to AND" footgun | **Medium** | Single-source community/best-practice, not core admin docs |

#### A.5 Differentiators (unoccupied white space we are claiming)
1. **A live plain-English restatement of the rule** — *no surveyed tool, not even HighLevel*, shows a non-technical user a generated sentence of their own audience. (§5.3.5, E5)
2. **NL paired with a simple, flat, editable rule + a live count** — nobody owns this exact combination (Catalyst keeps an analyst-grade builder; Custify's NL sits on a multi-window builder; Totango surfaces a non-editable list). (E5)
3. **A live "who matches right now" count + a glanceable real-account preview**, updating on every edit, on a non-technical surface. (E5, E2, E4)
4. **Point-of-use AI honesty** (HubSpot buries its disclaimer). (E5)

### Appendix B — Operator labels & value-control reference

> The machine-readable operator map, operator semantics, and plain-word operator labels also live in `./playbooks-catalog.json` (`filters.operatorsByType`, `filters.operatorSemantics`, `filters.operatorLabels`). This appendix is the human-readable companion.

**Plain-word operator labels** (never symbols): `lt`→"is less than", `gt`→"is more than", `gte`→"is at least", `lte`→"is at most", `eq`→"is exactly", `between`→"is between", `is`→"is", `isNot`→"is not", `isAnyOf`→"is any of", `isNoneOf`→"is none of", `contains`→"contains", `startsWith`→"starts with", `inNext`→"in the next", `inLast`→"in the last", `moreThanAgo`→"more than … ago", `within`→"within", `falling`→"is falling", `rising`→"is rising". Money fields restate `gt/lt` as "over/under". "Ago" fields (`engagement.lastLoginDays`, `user.idleDays`) restate in past tense ("was more than … ago").

**Value-control contract per FieldType** (the value shapes the product accepts/validates; the data contract is fixed regardless of how it is rendered): Boolean → `true|false` (rendered Yes/No segmented). Number/days/score → a number + unit (`$|%|d|min|users`); operators are plain words. Range (`between`) → `[from|null, to|null]` — an empty bound degrades to "at least"/"at most". DateRelative → `{verb, n, unit}`. Enum single (`is|isNot`) → one string. Enum multi (`isAnyOf|isNoneOf`) → a list of strings; stored/matched over multi-value fields by set intersection. Band (P2) → one of `atrisk|watch|healthy|thriving`. Text (`account.name`) → string with `contains|startsWith|is|isNot`. **Fresh-criterion defaults** (so every fresh criterion is a complete sentence): `engagement.lastLoginDays`/`user.idleDays`=21; `revenue.mrr`=1500; `health.score`=60 (P2); range days `[0,30]`, scores `[0,60]`, money `[500,2000]`; `inNext`=30d, `inLast`=90d, `moreThanAgo`=21d, `within`=30d; enum=first option; boolean=true.

### Appendix C — Catalog reference

> The full catalog — plays, categories, situations, recipes, the field/operator universe, attention-signal definitions, and each play's default Simple-view filters — lives in `./playbooks-catalog.json`. This appendix keeps only the **rules** that govern how that data is used.

#### C.1 Phase-1 behavior of Health-predicated plays
Plays whose match predicate references Health (band/score/delta/lifecycle stage) only **fire/compute fully in Phase 2**. Their marketplace cards **still appear in Phase 1** (the Situation rating is plain-word, not Health vocab — §5.5.2), but their live impact count is computed **HL-native only** until Health is configured. Recipes that carry `health.*` criteria are **health-stripped in Phase 1** before seeding the builder (their HL-native parts remain).

#### C.2 The playbook-aware Simple-view defaults — `defaultFiltersFor(playbook)`
The Simple-mode quick-add list (Epic **E5.3**) is **playbook-aware**, reasoned from the GoHighLevel agency-owner's chair: *"when I narrow this play, what would I slice by?"* Each play carries `Playbook.audienceKind` (§5.5.1) — **account-level** (the trigger concerns the whole account) or **user-level** (the trigger concerns an individual user's activity, e.g. "no recent login", "admin gone dark", "power user emerged"). The default filters offered for a play are computed as:

- **Table stakes — on EVERY play:** `account.priority` (Priority account) · `revenue.plan` (Plan) · `engagement.lastLoginDays` (Last login). *(The owner's three universal slicing axes.)*
- **Domain pack — by `category`** (the filters owners reach for most in that play's world): **winback** → Renewing soon · MRR · **reengage** → Signed up · **adoption** → Feature in use · Signed up · **revenue** → Payment failed · MRR · Renewing soon · **onboard** → Signed up · **grow** → MRR · Spend trend · **listen** → Sentiment · MRR.
- **User pack — only when `audienceKind: "user"`:** `user.role` (User role) · `user.keyOnly` (Key users) · `user.idleDays` (A user gone quiet). **Account-level plays show no user filters.**

With no play context (lab / create-from-scratch), a generic default list is used. All offered fields are HL-native (Phase-1 safe — no `health.*`). The builder hides any field already in the set and regroups the rest for display (**Account · Billing · Feature · Feedback · Users**); a "Browse all fields" launcher always reaches the full catalog. (Of the seeded plays today, 11 are user-level and the rest account-level.) Each play's resolved default filters live in `./playbooks-catalog.json` (`playbooks[].defaultSimpleFilters`), with the quick-add picks and full field universe in `filters.simpleQuickAdd` / `filters.advancedGroups`.

---

*End of PRD. Epics in §6 are authored against this model; every acceptance criterion is a build checklist item.*
