# GoCSM — Sub-Account Onboarding & Activation

**Product Requirements Document**

Agency-built guided onboarding, in-context activation, and proactive stall analytics for HighLevel sub-accounts.

| | |
| --- | --- |
| **Document** | PRD v1.12 — Onboarding & Activation |
| **Status** | Final — going into development. Two design-loop redesigns shipped to the prototype on 30 June 2026 — the Journey Builder (Layer A) and the Overview "tracker" (Layer C); see **Changes made on 30 June 2026** below. |
| **Author** | Karthik Anand, CPO |
| **Reviewers** | Tim Sabir (CEO), Abhinav (CTO), Jose (Frontend), Sinan (CS) |
| **Date** | June 30, 2026 |
| **Surface** | HighLevel Marketplace app — Custom JS injection |

---

## Changes made on 30 June 2026 (v1.12 — two design-loop redesigns: Builder + Overview)

> **READ THIS FIRST (for the developer picking up the build).**
> Everything below this section is the complete, current PRD. This section is the *delta* from v1.11 — what to pick up from today's two design-loop runs. The work is in **two layers: the agency Journey Builder (§6)** and **the agency Overview / Dashboard (§8)**. The client **Doer (§7) is unchanged** from v1.11 (it is reused, untouched, as the wizard's live client preview). The full self-contained `/onboarding` module is implemented in the prototype. The decision-log entry for this pass is **§11.1k**.

Two redesigns, one north star — make onboarding effortless for a non-technical, easily-overwhelmed agency owner: **build a journey they actually like in minutes** (Builder), then **see who's stuck and unblock them in one move, at a glance** (Overview).

### Part A — Journey Builder (§6): the old 9-step builder → a guided, template-first wizard

The first-run flow used to drop a non-technical owner into a dense 9-step `JourneyBuilder`, then a per-step editor (webhooks, deep-links, plan variants), gated by a publish check that could **block on operator jargon** — a completion-killer. It was rebuilt as the **`SetupWizard`**: simplicity via smart defaults, with full agency power restored as **progressive depth** (Karthik's explicit correction — simplify by defaulting, never by removing capability). Eight changes:

A1. **Template-first start.** Land on 3 real templates (Standard 15 · Fast-track 7 · Local services 9 — genuine catalog subsets) plus a quiet dashed **"Start from blank."** Never a blank 9-step canvas; Publish is disabled at 0 steps. [§6.2/§6.3]

A2. **Two-pane wizard with a persistent live client preview.** A 6-step spine — **Template · Steps · Order · Experience · Look & feel · Review** — one decision per page, smart default pre-selected, jumpable step nav, a sticky in-flow footer, and a **live client preview pinned right** (its "X of Y done" count suppressed via a `hideProgressCount` prop so it can't contradict the builder). **Reverses the v1.7 "full-width wizard, NO live-preview rail" decision** (preview was previously post-Finish only).

A3. **Auto-verify is locked for catalog steps — the wedge.** Out-of-the-box HighLevel steps are **always GoCSM-auto-verified and locked** — no completion picker; agencies can't downgrade our tracking, which is the whole differentiator. The 4-way completion picker (auto-verify / client-confirms / web-event / for-reference) appears **only for custom steps**. Every row carries a recessive "Auto-verified" badge; exceptions (client/web-event/for-reference) pop. [§6.4c]

A4. **Progressive depth, not stripped capability.** Each Step-2 row's inline **Customize** (single-open accordion) restores: editable title · "what your client sees" copy · completion method · default/custom video · **per-asset sub-steps** ("which workflows should your client activate?" — named, independently-verified client tasks). [§6.3c]

A5. **Asset steps: any-vs-specific, snapshot-driven.** Asset steps (workflows · funnels · forms · pipelines) default to **"any" (any activation counts)**; "specific" = pick a snapshot sub-account (remembered after first pick) + **one named asset** via a searchable single-select. Asset steps are re-addable, so three workflows = three steps. [§6.4b]

A6. **Order via up/down arrows, not drag.** Dependency-guarded. Reverses the v1.7 draggable order list — drag is unsafe for novices and accessibility (NN/g). [§6.3]

A7. **Look & feel: placement + auto brand colour.** Visual placement mockups (Floating · Top banner default · Menu · Embedded "Launchpad") + brand colour **auto-detected** from the agency and pre-selected with a "✦ Pulled from your brand" pill. Plans / Timing / Branding / Videos fold into the wizard tail and per-step Customize as progressive depth rather than separate top-level steps. [§6.6]

A8. **Returning agency → `JourneySummary`; old builder retired.** A calm "Live" overview with per-row "Edit ›" jumps into the wizard at the right step, plus a quiet "advanced editor" escape to `JourneyEditor` (deep-links, plan variants, granular per-step config). `SimpleSetup` deleted; the old 9-step `JourneyBuilder` is no longer routed. **Publish-then-refine** — no blocking jargon gate.

### Part B — Overview / Dashboard (§8): rebuilt around triage

The agency Overview was rebuilt around one job: **"Show me who's stuck in client onboarding and let me unblock them in one move — at a glance."** Enemy = overwhelm. Ten concrete changes, each mapped to its §8 subsection:

1. **Triage-axis strip is the new primary orientation — it replaces the lifecycle census as the lead (§8.1).** Three tiles on the *triage axis* — 🔴 **Needs you** (stuck count) · ⏳ **Waiting on review** (pending carrier/DNS, no action) · ✅ **On pace** (moving fine) — sit at the top, and each filters the surface below. This **reverses the v1.7/v1.8 "three lifecycle population cards (Onboarded / Onboarding now / Not started) as the lead."** The lifecycle census is **demoted** into the full account list's pills; there is **no 4th counter row**. Only "Needs you" is saturated/red (Linear color discipline); the other two are muted.

2. **The AI Verdict is now dollar-led and names the dominant bottleneck (§8.2).** One plain sentence: *"{N} clients are stuck on '{step}' past Day {target} — that's where most of your onboarding pain is. ${X}/mo is behind it."* The `$/mo` at risk is part of the headline. Attribution reads **"GoCSM Analysis"** (not "GoCSM AI"); the trust stamp is compressed to **"Numbers exact · wording is AI."** When the agency's own team is the bottleneck, the verdict is **derived from `blocked_by === "agency"` data** (never a hardcoded line), so headline, CTA, and queue can never disagree.

3. **The money-ranked "Needs help today" queue is the hero (§8.3).** Directly under the strip, sorted by `mrr × days_on_current_step` (`selectStalledByImpact`). Money is the **sort key**, shown as a quiet Mono `$/mo` eyebrow — never a wide ARR column. Cap ~5 visible; "show all N" expands.

4. **Reversible-action receipt with undo on the row action (§8.3).** The primary row action fires an **`ActionReceipt`** — visible scope + blast-radius + grace countdown + **Undo** — the concrete "show draft → confirm → undo" safety net for the Reversible Action primitive. The receipt persists as intervention memory.

5. **All-clear reward state (§8.6).** When Needs-you = 0, the page shows a designed, calm payoff — a single centered check + *"You're all caught up. Every client who needed you, you've handled."* — not a blank table. Copy adapts for brand-new / sparse accounts (*"Nothing needs you yet"*). No competing CTA.

6. **"Waiting on others — nothing for you" relief strip (§8.3).** The external-review (carrier/DNS) set is a collapsed-by-default **relief lane**: count + "No action needed", expandable to a read-only list. Framed as relief, counted not enumerated — nobody else suppresses third-party waits.

7. **One visible AI surface, by design (§8.2).** Only the Verdict is AI-marked. The queue ranking is arithmetic and is **NOT** labeled AI (calling it AI would erode the headline's trust). No Ask box, no recommended-action menu, no generated per-account prose, no trend-narration paragraph. The old `ConfTag` confidence indicator is replaced by a plain **data-sourcing transparency** label ("computed from timestamps").

8. **One velocity number, never a chart (§8.1).** A quiet proof line under the strip: *"{onboarded} finished this week · avg {median} days to onboard ({delta} vs prior window)."* Green/red arrow, one number, real data (`prior_median_days_to_activate`). A regression renders **calm-neutral**, not alarm-amber — a slower week is information, not an emergency.

9. **Calm drill-downs, all below the fold (§8.4, §8.5).** "Where clients get stuck" is a collapsed disclosure off the verdict (each step shows count-stuck and filters the queue on click); the full "Every client you're onboarding" account list is behind "show all." One open disclosure at a time; **no naked numbers** — every number carries a target / trend / `$`.

10. **Phase-4 multi-persona review fixes (carry into the build):** (a) agency-bottleneck verdict derived from real data, not a hardcoded "5 clients / kickoff call" line; (b) `StatusCard` uses **per-side borders**, killing the `border`/`borderLeft` React warning fired on every triage-tile click; (c) trust stamp compressed to "Numbers exact · wording is AI"; (d) all-clear copy adapts for sparse week-1 accounts; (e) velocity regression rendered calm-neutral instead of alarm-amber. `tsc` clean; `bun run build` (DS → prototype → web) all green.

> **Scope note for the developer.** Today changed **two** layers: the **Builder (§6)** and the **Overview (§8)**. The **Doer (§7) is unchanged** — its v1.11 spec stands, and the doer component is reused untouched as the wizard's live client preview. Both redesigns re-compose existing primitives rather than rewriting: the Overview is an IA/hierarchy rework (`Verdict`, `.metric-card`/`StatusCard`, `QueueRow`, `ActionReceipt`, `.blocked-badge`); the Builder is the `SetupWizard` (template-first, two-pane, progressive-depth Customize) replacing the retired 9-step `JourneyBuilder` + `SimpleSetup`. Build artifacts: Builder → `apps/prototype/src/onboarding/components/onboarding/{SetupWizard,JourneySummary}.tsx`; Overview → `apps/prototype/src/onboarding/pages/OnboardingIndexPage.tsx` (route `/onboarding`, `.onb-root` scope). Design brief of record: `docs/design/onboarding-overview-brief.md` + the 2026-06-30 builder design-loop entries in the repo-root `MEMORY.md`.

---

## 1. Overview & Strategic Context

### 1.1 Problem statement

Onboarding is where HighLevel agencies silently bleed revenue. A sub-account that signs up but never connects a domain, registers A2P 10DLC, activates a workflow, or publishes a funnel never reaches first value — and churns before the agency realizes anything went wrong. Today, agencies run this process on spreadsheets, Slack threads, and memory. There is no shared source of truth for what "fully onboarded" means, no visibility into where a client is stuck, and no automated way to intervene before the stall becomes a cancellation.

> **THE COST OF GETTING THIS WRONG**
> 63% of customers weigh a company's onboarding program when making a purchasing decision, and a poor onboarding experience is the single largest driver of churn in the entire customer journey. For a HighLevel agency, an unactivated sub-account is pure margin loss — they pay HighLevel for the location while collecting nothing in realized value.

### 1.2 Goal

Deliver the best-in-class onboarding and activation experience in the HighLevel ecosystem, built at two levels: (1) a builder for agencies to compose a custom, white-labelled onboarding checklist with deadlines, owners, contextual videos, and a kickoff call; and (2) a doer experience inside the sub-account that guides the end client step-by-step, deep-links them to the exact HighLevel screen for each action, verifies completion automatically where possible, and surfaces a live progress view. Layered on top: a portfolio dashboard with stall analytics for proactive reach-out, and HighLevel custom triggers that fire when a client is stuck beyond the expected time for a step.

### 1.3 Why GoCSM, why now

The market splits onboarding into two categories that no one has fused for the HighLevel reseller: Digital Adoption Platforms (Userpilot, Appcues, Pendo) that excel at in-app contextual guidance but lack cross-stakeholder accountability; and Client Onboarding Platforms (Rocketlane, GUIDEcx, Dock) that excel at deadlines, owners, and proactive reach-out but live outside the product the client actually has to operate. GoCSM is uniquely positioned to do both — because it already runs inside HighLevel via Custom JS injection and multi-endpoint stitching, capturing signals unavailable through HL's public APIs. That same capability is what makes automatic step-completion detection — the feature's magic moment — technically feasible. This is a category GoCSM can own out of the gate.

> **POSITIONING**
> "Run your SaaS on insight, not instinct" extends naturally to onboarding: the first stretch of the customer lifecycle becomes the front of the same Health Score funnel GoCSM already computes — not a bolted-on silo. An account stalled in onboarding pulls down Login and PAS pillars and surfaces in the Watch / At-Risk bands automatically.

### 1.4 Non-goals (v1)

- **Autonomous task execution.** GoCSM diagnoses, prescribes a concrete next action (a pointer to a real place: a HighLevel screen, Trigger Workflow, Request Feedback), and executes only on explicit user trigger — governed by the Reversible Action primitive (visible scope, blast radius, undo grace). It never acts unprompted inside the client's sub-account.
- **A general project-management tool.** This is onboarding-to-activation, not a Rocketlane-style PSA with timesheets, billing, or resource capacity planning.
- **Replacing HighLevel's native UI.** We guide users to HL screens and verify outcomes; we do not rebuild domain connection, A2P registration, or funnel building inside GoCSM.
- **Multi-product / multi-workstream onboarding.** One onboarding journey per sub-account in v1 (the gap that breaks GUIDEcx at scale is explicitly out of scope until validated). Journeys are versioned, however — see §6.1.

---

## 2. Competitive Intelligence & Design Inspiration

A deep scan of the gold-standard onboarding products in 2026. Each takeaway below maps to a specific design decision in this PRD. The pattern is consistent: the best products fuse contextual in-app guidance with cross-stakeholder accountability, and the leaders are now layering AI as a "competent person noticing where you're stuck" rather than another popup.

### 2.1 What the leaders do — and what we take

| Product | What they nailed | What GoCSM takes |
| --- | --- | --- |
| **Userpilot** | "Smart Tasks": a checklist item can redirect the user to another page, launch a flow, or run a JS function on completion. Segment-driven, contextual triggering. | Our checklist items deep-link directly to the exact HighLevel screen for each action; completion is auto-detected, not self-attested. The closest analog to what we build. |
| **Appcues** | A UI-pattern toolkit (modal / tooltip / slideout / banner / hotspot) chosen per moment — not one pattern for everything. | Contextual help is a slideout that follows the user through the HL screen, not a blocking modal. Right pattern for the moment. |
| **Rocketlane / GUIDEcx** | Accountability is the product: who owns what, by when. Branded client portal reduces early churn; stall detection drives proactive CSM reach-out. | Owner-per-step (client vs. agency), SLAs, white-label portal, and stall analytics for proactive outreach. |
| **GUIDEcx (gap)** | Their #1 customer complaint is the absence of starter templates and weak customization. | Ship with pre-built GHL onboarding templates so agencies get value in minutes — reinforcing our 7-minute, no-credit-card setup. |
| **Dock** | Clean, customer-friendly shared workspace; content engagement analytics (who viewed what). | Video-watch and step-view telemetry feed the stall model and the dashboard. |
| **Pendo / Heap** | Auto-capture of user actions; retroactive funnel analysis without pre-defining events. | Per-step drop-off funnel across the whole client base — fix the process, not just chase individuals. |
| **Linear / Superhuman** | Opinionated defaults over configuration; queue-first operating surfaces with a closed action loop. | Tier-aware SLA defaults and pre-wired dependencies in the builder; the dashboard stall list is a triage queue with intervention memory, not a report. |

### 2.2 How the gold standard uses AI in 2026

Three distinct AI layers, in the order we should build them. The governing principle from the 2026 literature: if a new AI feature only helps you create more guidance, it's solving the wrong problem; if it helps choose the right moment, segment, and message, it's doing useful work.

| Layer | Pattern | GoCSM implementation |
| --- | --- | --- |
| **1. Stuck-detection + re-engagement** | Agent tracks completed steps and proactively re-engages stalls ("completed setup but never configured a workflow" → targeted nudge). | Highest ROI. Powers the custom HL trigger: stuck > SLA fires a workflow. Ships with the dashboard. |
| **2. "Competent person" assist** | Not another popup — contextual, product-specific answers to "why isn't this working?" in real time. | Sherlock (already named/branded) answers GHL-specific stuck questions in-context. Diagnoses; never auto-executes. |
| **3. AI-assisted builder** | Describe the desired outcome → agent drafts the flow, sequencing, and success metric. | v2: "Describe your onboarding" → AI drafts checklist with sequenced steps, owners, deadlines, suggested videos. |

> **DESIGN PRINCIPLE WE WILL NOT VIOLATE**
> Default to silence; add guidance only at the exact moment it helps the user move forward. The useful AI version of onboarding is "you did X, here are the 3 things to fix before this works" — not a tour. Restraint is the feature.

---

## 3. Personas & Jobs-to-be-Done

| Persona | Who | Primary job |
| --- | --- | --- |
| **The Agency Owner / Operator** | GoCSM customer. Runs a HighLevel agency; resells sub-accounts to local businesses. | "Make every client reach activation fast and consistently, without me chasing them one by one." |
| **The Agency CSM / Onboarder** | Sinan-type role inside the agency. Owns the day-to-day onboarding of new clients. | "Show me exactly who is stuck, where, and for how long, so I can reach out before they churn." |
| **The End Client (sub-account user)** | Local business owner. Non-technical. Bought the agency's service; now must operate HighLevel. | "Tell me what to do next, take me to the right screen, and show me how — without reading docs or filing tickets." |

> **NORTH-STAR JTBD**
> For the end client: "Get me to my first real outcome (first lead captured, first message sent, first appointment booked) as fast as possible."
> For the agency: "Get every client activated and keep none of them silently stuck."

---

## 4. Solution Architecture — Three Layers

The feature is delivered as three tightly-coupled layers. Each is a distinct surface with a distinct user, but they share one data spine: the per-step completion record with timestamps, owner, and detector signal. That single object powers the doer UI, the dashboard funnel, and the SLA trigger alike.

| Layer | Surface | User | Core job |
| --- | --- | --- | --- |
| **A — Builder** | GoCSM agency app | Agency owner / CSM | Compose & template the onboarding journey: steps, owners, deadlines, detectors, videos, kickoff call. |
| **B — Doer** | Inside the HL sub-account (injected) | End client | Progress view + deep-link to each HL screen + contextual video + Sherlock assist + auto-verified completion. |
| **C — Dashboard** | GoCSM agency app | Agency owner / CSM | Portfolio view, per-step drop-off funnel, stall list, one-click outreach + SLA-driven custom triggers. |

### 4.1 Data spine — Journey, Assignment, and OnboardingStep

Every layer reads and writes one canonical model. Getting this schema right in Phase 1 is the long pole of the project (see §10). Two structural decisions are baked in: journeys are versioned with clients pinned to the version they started on, and step status is a nine-state contract shared verbatim by all three surfaces (the same states the design system renders — see §7.2).

> **JOURNEY (TEMPLATE) + ASSIGNMENT (INSTANCE)**
> `journey: { journey_id, name, status: draft | published | archived, version, target_days ← the ONE agency-set time number (§6.4) }`
> `assignment: { account_id (ghl_location_id), journey_id, journey_version ← pinned }`
> Editing a published journey creates a new draft version. Publishing affects NEW assignments only; migrating in-flight clients is an explicit, optional action with stated blast radius ("14 clients are mid-journey; migrating may re-open steps"). This is the Rocketlane/GUIDEcx template-vs-instance lesson — without it, every journey edit silently corrupts in-flight client state.

> **ONBOARDINGSTEP (INSTANCE, PER ASSIGNMENT)**
> `step_id, assignment_id, title, instructions, owner: client | agency`
> `detector: { type, config }` ← pluggable per step type. `type ∈ { auto_signal, manual_confirm, inbound_webhook }` — v1.7: webhook = unique inbound URL; an external POST (e.g. a GHL Webhook workflow action) completes the step.
> `assets?: [{ name, done }]` ← snapshot-based types only (workflows, funnels) — v1.3.
> `state: not_started | locked | in_progress | verifying | waiting_on_agency | needs_attention | done | skipped` (`stalled` = computed lens, never stored).
> `started_at, completed_at, deep_link_target`.
> `sla_hours` ← SYSTEM-defaulted by tier, observation-tuned; never agency homework (§6.4).
> `video: { default_ref | agency_override_ref }`.
> Dependencies are NOT per-step config — hard requirements are intrinsic to step types (campaign→brand→phone, carrier-enforced).
> `completion_source: auto | manual | agency_verified | webhook` ← v1.7.
> `last_intervention: { type, fired_at, outcome: pending | no_movement | completed_after }`.

"Stalled" is a dashboard-computed lens (`now − started_at > sla AND state ≠ done`), never a stored state and never shown to the client. `last_intervention` is what lets the queue close the loop ("Nudged 2d ago — no movement").

> **ENGINEERING GUARDRAIL**
> Keep the completion-detector read path separate from the Health Score / sub-account tracker computation. Those engines are already flagged as the highest-regression-risk zone. Onboarding polling must not entangle with pillar math, or one will break the other.

---

## 5. Step Taxonomy & the Detector Framework

This is the engineering heart of the product and the feature's key differentiator. Completion is modelled as a pluggable detector per step type — never a generic boolean. Each step template declares its detector; the detector's confidence and a mandatory manual override determine the final status. The taxonomy below classifies every step by how detectable it is.

### 5.1 The three detectability tiers

| Tier | Definition | Completion behavior |
| --- | --- | --- |
| **A — Cleanly auto-detectable** | A clear state change GoCSM can read or poll. These are the demo — "I did it and GoCSM just knew." | Auto-detect; manual override available as a safety net. |
| **B — Detectable but ambiguous** | A proxy signal exists but is laggy, flaky, or doesn't capture "done well" (e.g. DNS propagation, "customize before activating"). | Auto-detect the proxy; manual override in BOTH directions, with a confidence indicator. |
| **C — Manual-only** | No reliable signal (schedule a call, watch a video, gather business info). | Manual check; optional soft signal (e.g. video watch %, calendar booking webhook). |

> **NON-NEGOTIABLE**
> Auto-detection that is wrong is worse than manual. A step that flips to "done" when it isn't — or stays "stuck" after the client finished — destroys trust in the entire system and trains agencies to ignore the dashboard. Every detector ships with a confidence model and an obvious manual override. The manual fallback is the safety net that makes auto-detection safe to ship.

> **DETECTION STATE ≠ BLOCKING STATE (V1.8)**
> A step being in `verifying` (Tier B/C, awaiting an external result — carrier A2P review, DNS propagation) does NOT block unrelated steps. The `locked` state propagates ONLY from genuine hard dependencies, never from sequence position. Per GHL physics the hard-dependency graph is small and carrier-enforced: send-SMS ← A2P campaign ← A2P brand ← phone. (Funnel-goes-live ← custom domain is a soft dependency — a funnel publishes on the system domain without one — so it does not lock.) A step is `locked` iff a specific upstream result it physically requires does not yet exist; otherwise it is actionable the moment the client reaches it, even while sibling steps verify in the background. This is what lets the doer advance the client through the ~11 of 15 independent steps in parallel rather than serializing the whole journey behind the laggiest one (see §7.3, the non-blocking model; §7.4c for the client-facing navigation).

### 5.2 Prioritized action catalog (research-backed)

Consolidated from HighLevel's own Sub-Account Launchpad outcome groups (Foundational → Marketing & Lead Gen → Sales & Conversations → Website & Monetization), published agency onboarding checklists/SOPs, and HL's A2P/phone/email rails documentation. Prioritization: frequency across agency checklists × criticality to activation × detectability. Communication rails rank first because nothing downstream works without them. Each action declares a detector; agencies cannot create a step type whose detector doesn't exist — this constrains the builder by design. The v1 cut line is after action 15.

**Wave 1 — Communication rails (universal blockers)**

| # | Action | Tier | Detector signal / note |
| --- | --- | --- | --- |
| 1 | Purchase phone number | A | `phone_number_exists` — in every checklist; SMS, missed-call, A2P all depend on it |
| 2 | A2P 10DLC brand registration | B | `a2p_brand_status` (pending/approved/rejected; carrier-controlled lag) — the #1 stall point in the ecosystem |
| 3 | A2P 10DLC campaign approval | B | `a2p_campaign_status` — second gate; brand-approved-but-campaign-pending is a distinct, common stall |
| 4 | Dedicated email sending domain | B | `email_domain_verified` — DNS propagation lag; deliverability foundation |
| 5 | Complete business profile (name, address, logo, hours) | A | `business_profile_complete` — feeds A2P, GBP, white-label trust |

**Wave 2 — Lead capture & conversion engine**

| # | Action | Tier | Detector signal / note |
| --- | --- | --- | --- |
| 6 | Activate / customize snapshot workflows | B | `workflow_active` (proxy; cannot detect "customized well") — the agency's core deliverable going live |
| 7 | Publish funnel / website | A | `funnel_published` — lead-capture front door |
| 8 | Connect custom domain | B | `domain_verified` — DNS lag; classic limbo-state step |
| 9 | Create calendar + connect Google/Outlook sync | A | `calendar_exists + calendar_integration_connected` — booking is THE activation outcome for most local-service niches |
| 10 | Create / publish form | A | `form_exists` — paired with funnel; first-lead prerequisite |
| 11 | Set up pipeline & stages | A | `pipeline_exists` — where the client sees value (their leads moving) |

**Wave 3 — Integrations & human anchor**

| # | Action | Tier | Detector signal / note |
| --- | --- | --- | --- |
| 12 | Connect Google Business Profile | A | `gbp_integration_connected` — reviews + messaging + local SEO; clean OAuth status |
| 13 | Connect Facebook / Instagram | A | `facebook_integration_connected` — lead-ads sync; token expiry makes this a RE-stall detector too |
| 14 | Connect payments (Stripe) | A | `stripe_connected` — monetization gate for invoicing/products |
| 15 | Book kickoff call with agency | A | v1.4: agency embeds their calendar in the step; the CLIENT books; booking event auto-verifies. The human activation anchor becomes a client action with Tier-A detection — resolves former open question Q1 |

> **V1 CUT LINE**
> Actions 1–15 are the v1 supported set. Action 16 (end-to-end test lead) is the sleeper candidate to promote — no agency checklist omits it, it is pure Tier A (`contact_created` via form + pipeline stage), and it is the closest thing to a true activation event. Pull it above the line if engineering capacity allows.

**Backlog (v1.1+) — in priority order**

| # | Action | Tier | Detector signal / note |
| --- | --- | --- | --- |
| 16 | Send first test lead end-to-end | A | `contact_created` via form + pipeline stage — the best "actually activated" proof |
| 17 | Import contacts | A | `contact_count > threshold` — HL Launchpad foundational step |
| 18 | Send first campaign (email/SMS) | A | `message_sent` events — first outbound value moment |
| 19 | Port existing phone number | B | `port_request_status` — LOA process; multi-week limbo |
| 20 | Toll-free number verification | B | `tfn_verification_status` — the A2P-bypass alternative branch |
| 21 | Install LeadConnector mobile app | B | mobile session in login telemetry (we already track per-user logins; device type is the proxy) |
| 22 | Watch training videos / course | C | video watch-% soft signal |
| 23 | Submit intake / onboarding form to agency | C | form-submit soft signal — agencies automate this via forms mapped to custom values today |
| 24 | Connect WhatsApp | A | `whatsapp_connected` — already one of GoCSM's 9 tracked features; geography-dependent |
| 25 | Enable review requests / reputation | B | reputation config state — high value for local-service niches |
| 26 | Sign contract / pay agency invoice (off-platform) | C | manual — off-GHL; must be supportable as a custom manual step |

> **CATALOG DESIGN NOTES**
> **A2P is two steps, not one.** Carriers generally require an approved Brand AND an approved Campaign before US local-number messaging works. Collapsing them into one step hides the most common stall in the ecosystem (brand approved, campaign stuck in vetting) — splitting them gives two distinct stall signals and two distinct Sherlock answers.
> **Wave 1 is disproportionately Tier B.** The highest-priority actions are the laggy, carrier-dependent ones — validating the limbo-state design in §7.1 ("We're checking…" + manual escape hatch) as a launch requirement, not polish.
> **Custom manual step is always available.** Real agency checklists include off-GHL items (contracts, payments, asset collection). The builder must always offer a free-form Tier-C step so agencies can model their FULL onboarding, not just the GHL parts.

> **SCHEMA-FIRST MANDATE**
> Even if Phase 1 only implements a handful of Tier-A detectors, the schema must assume detectors from day one. Shipping a manual-only v1 with a boolean schema is a trap: retrofitting detection onto a boolean model is painful, and a manual-only product gets benchmarked against Trello — and loses. Get the per-step-type detector contract right first.

---

## 6. Layer A — The Agency Builder

Where the agency composes the onboarding journey. The builder's real job is not data entry — it is giving the agency confidence the journey is right before they put clients on it. Design imperative: value in minutes; the blank canvas is never the first thing they see.

### 6.1 Journey lifecycle — versioned mechanism, version-free vocabulary (v1.3)

The mechanism is unchanged and non-negotiable: journeys are versioned, clients are pinned to their start version, publishing affects new assignments only. But agencies never see version numbers — they have a promise culture, not a release-management culture (the SLA lesson, applied to lifecycle). The header shows exactly one status: "Draft — not published", "Live · {n} clients", or "Editing — changes apply to new clients". The migration question is asked only at the moment it exists: publishing a live journey with in-flight clients offers one radio — "New clients only (recommended)" vs "Also update {n} clients mid-journey — may re-open completed steps". No version chips, no version column in the portfolio, no standing migrate menu item, no kebab menu (Duplicate/Archive removed — v1 has one journey).

### 6.2 First-run / empty state — the wedge moment

Three doors, in this order:

- **"Paste your existing checklist."** A textarea; AI maps pasted lines to catalog step types, flags unmapped lines as Custom manual steps, and drafts the journey for review. AI-authored drafts carry indigo AI attribution, and every auto-mapped step carries a Confidence tag (mapped vs. guess). This connects the customer-checklist GTM campaign directly to first-session magic.
- **Start from a template.** "Standard GHL Agency Onboarding," "Lead-Gen Agency," "Local Services" — each card shows step count, estimated completion time, and a peek of its first five steps before cloning.
- **Start from scratch.**

### 6.3 The guided builder — a four-step wizard, not an editor (v1.7)

The v1.1–1.6 "persistent split-view editor" was the builder's core flaw: it asked a non-technical agency owner to face a dense canvas of step cards, owner badges, timing chips, and dependency locks all at once. The founder review was blunt — setup must be a question-led wizard, not an editor. The rebuild is a guided flow that asks one thing per screen, with all per-step detail hidden behind a tap. It serves both first creation and every later edit (the same flow opens prefilled for "Redo setup"). Crucially, the wizard runs full-width with no live-preview rail — a preview competing with a wizard question is two things on one screen, and it broke the layout in testing; the preview belongs only to the post-Finish editor (§6.3c).

The four-step spine (always shown): **1 Steps · 2 Order · 3 Plans · 4 Timing.** A persistent progress bar at top; Back always present; a quiet "Skip to fine-tune" on every screen jumps to the full editor for power users.

- **Steps — "Which steps should your clients complete?"** The catalog grouped under plain GHL-domain headers (Messaging & compliance, Email, Website, CRM, Reputation, Payments, Kickoff); standard set pre-checked; large tappable cards. A "+ Add a custom step" card. Tapping a card body (not the checkbox) expands its fine-tune panel inline. Sub-line: "GoCSM watches HighLevel and checks these off automatically — your clients don't tick boxes."
- **Order — "What order should they go in?"** A draggable list pre-sorted by GoCSM's smart default. The carrier chain (phone → A2P brand → campaign) is visually grouped and locked — illegal moves snap back ("Carriers require this order"); everything else drags freely. Helper: "We've ordered these the way GoCSM recommends — drag to change."
- **Plans — "Same checklist for every plan?"** Two cards: "Yes — one checklist for all" / "Different by plan." Choosing Different reveals a per-plan section where GoCSM auto-selects steps from each plan's enabled GHL features (a Pilot plan without LC Phone/Sites drops phone, both A2P steps, and custom domain → ~10 steps): "Pilot doesn't include phone or website features, so we've left those out — adjust if needed." Each plan inherits the Step-2 order; steps are checkable per plan but not reorderable (order is shared). This resolves Q2 in part — see §11.2.
- **Timing — "How long should onboarding take?"** One number, default 14, sub-line "the promise you make on your sales calls." Different-plans shows one target per plan (Pilot defaulting 7). Finish lands on the fine-tune editor + preview.

#### 6.3b The conditional experience tail (v1.8)

After Timing, the wizard branches into the client-experience configuration — the settings formerly buried in a popover the agency might never open. The progress bar is dynamic, rendering only the dots for the active path. A persistent sticky footer (Back · "Skip to fine-tune" · Next/Finish) is pinned to the bottom on every step so the user never scrolls to find the CTA — even on long steps (the grouped step list, the video review). The Guided path runs: **Steps · Order · Plans · Timing · Experience · Placement · Branding · Videos? · Review**; Tracking-only finishes at Experience.

- **5 Experience:** "Show them a guided checklist" vs "Just track quietly — no checklist." Tracking-only finishes here (stepper collapses to 5 dots) — detection, stalls, queue, and automations still run; the client simply sees nothing.
- **6 Placement (Guided only, v1.8; expanded v1.9):** "Where should the checklist appear?" — illustrated cards with "where it sits" mini-diagrams: Floating widget (with a floating-position sub-picker), Top banner, Menu link, and Embedded page / Launchpad — a full GoCSM checklist screen embedded as a native menu item (a "my own Launchpad", in the style of GHL's Launchpad), not a floating overlay. Helper: "This is where your clients see it inside HighLevel." Default: Top banner (v1.9 — see rationale below). Placement is a genuine setup decision for a GHL agency — it materially changes whether the client notices the checklist and how it coexists with their existing HL UI — so it earns a step, peer to Branding and Videos. Shown only on the Guided path (meaningless in Tracking-only).

> **WHY NON-OVERLAY PLACEMENT IS FIRST-CLASS, AND WHY THE DEFAULT IS THE BANNER (V1.9, IVORY FEEDBACK)**
> The market reality: most GHL agencies already run a support/onboarding widget (Intercom, Crisp, HelpScout, or GHL's own help widget with its built-in checklist + live chat). A GoCSM floating widget therefore competes for the same corner of the screen and adds to widget fatigue — a direct adoption blocker, not a cosmetic concern. A design-partner agency (~900 sub-accounts) flatly declined to show the checklist to clients as a floating widget for exactly this reason, then reversed to "I'll put it in front of them" the moment non-overlay options (banner, embedded page) were shown. Non-overlay deployment is thus a first-class requirement, not an afterthought.
> The banner default: a top banner with a status badge gives persistent visibility without occupying the widget corner, and — because it is tied to live detection — it can re-surface for an existing, even year-old, client if they later disconnect something, doubling as an ongoing health prompt rather than a one-time onboarding device. The Embedded/Launchpad option serves agencies who want a fully native, in-menu experience with zero overlay. Floating remains available but is no longer the default, precisely because of widget collision.

- **7 Branding:** one accent color, pre-filled from the agency's HighLevel brand color ("We matched your HighLevel brand — change it if you like"); ink auto-resolves for contrast, never shown as a ratio.
- **8 Videos?** Yes/No. "GoCSM provides white-label tutorials with no GoCSM branding — they look like yours." No finishes here.
- **9 Review videos:** one screen listing client-facing steps, each defaulting to the GoCSM tutorial with an inline "watch-then-choose" player (watch the white-label clip, keep it in one tap, or "Use my own" to paste a URL). Defaulting every row to the GoCSM video makes this review-and-override, not data entry.

> **WIDGET CONFIG: ONE SOURCE, MULTIPLE DOORS (V1.8)**
> Experience mode, placement, brand color, and per-step video are configured in the wizard tail. They remain quick-editable post-creation in the Appearance drawer (§6.6) — which reads and writes the SAME journey fields (`experienceMode`, `placement`, `brandColor`, `showVideos`, per-step `videoRef`), never a forked copy. Placement now appears in BOTH the wizard step and the Appearance drawer (same control, same field) — this reverses the v1.7 note that placement was drawer-only, on the judgment that placement is a real first-time setup decision, not merely a fiddle-later cosmetic. Experience mode is the one setting NOT casually re-editable: flipping to Tracking-only un-injects the widget for live clients, so it changes only via the wizard / "Redo setup," never a stray popover toggle.

#### 6.3c The fine-tune editor & live preview (post-Finish)

Finishing the wizard lands on the editor: the sequenced journey on the left (drag to reorder, tap any row to open its fine-tune panel), and on the right the live client preview — the doer surface rendered with the agency's theme, in a snug widget-style frame, always rendering THIS journey's actual steps (never sample data). The preview-pane header holds exactly two things (v1.8): a quiet "Client preview" label (left) and the "New client / Mid-journey / Stuck" state switcher (right) — nothing else. The Customize control was moved OUT of this header into the journey action row (§6.6) so the preview reads as one calm widget mock, not a toolbar. Template-vs-instance rule: editor rows show only template truth — handle, number, a state-neutral type dot, title, and at most one config chip ("Auto-checks ✓" / "You confirm", or "3 workflows"). Client-progress states (verified / marked-done / stuck) appear ONLY in the preview and the per-client timeline — never on the editable template, where they would be meaningless. Rows reveal a "Customize ›" affordance on hover; "+ Add step" sits at the bottom and on hover-insert between rows. Plan context, when per-plan variants exist, is one quiet "Editing: All plans ▾" line (not a tab bar) that re-renders the list and target per plan; single-plan journeys show nothing.

#### 6.3d The v1.12 SetupWizard redesign (30 June 2026)

A design-loop run rebuilt journey creation as the **`SetupWizard`** — the current shipped builder. It keeps the v1.7 principle (a question-led guided flow, not an editor) but changes the structure, and reverses two v1.7 layout decisions. Mechanism and the data spine are unchanged.

- **Template-first spine, six steps:** **1 Template · 2 Steps · 3 Order · 4 Experience · 5 Look & feel · 6 Review.** Step 1 offers three real templates (Standard 15 · Fast-track 7 · Local services 9 — genuine catalog subsets) plus a quiet dashed "Start from blank." The v1.7 "Steps · Order · Plans · Timing + conditional tail (Experience · Placement · Branding · Videos · Review)" spine is **folded into this**: Plans, Timing, Branding and Videos become progressive depth (the Experience/Look-&-feel steps and per-step Customize), not separate top-level steps.
- **Two-pane, with a persistent live client preview pinned right** — the doer surface rendered live as the agency builds, with its "X of Y done" count suppressed (`hideProgressCount`) so it never contradicts the builder. **This reverses the v1.7 "full-width wizard, NO live-preview rail" decision** (§6.3), where the preview lived only in the post-Finish editor. One calm decision per page; smart default pre-selected; a labelled, jumpable step nav; a sticky in-flow footer.
- **Order via up/down arrows, not drag** (dependency-guarded) — reversing the v1.7 draggable list; drag is unsafe for novices and accessibility.
- **Progressive depth via per-step Customize** (single-open accordion on Step 2 rows): editable title, "what your client sees" copy, completion method, default/custom video, and **per-asset sub-steps** (§6.4b). Full agency power, hidden until asked for.
- **Auto-verify is locked for catalog steps — the wedge** (§6.4c): out-of-the-box HighLevel steps are always GoCSM-auto-verified with no picker; the completion picker shows only for custom steps. Every row carries a recessive "Auto-verified" badge; exceptions pop. The Step-2 header positions the USP: "Other tools mark a step done when your client watches a video — GoCSM auto-verifies it by watching their HighLevel, and shows you who's stuck."
- **Returning agency → `JourneySummary`:** a calm "Live" overview; per-row "Edit ›" jumps into the wizard at the right step; a quiet "advanced editor" escape opens `JourneyEditor` (deep-links, plan variants, the blocking publish validation, granular per-step config). A dev toggle flips Brand-new ⇄ Configured user.
- **Retired:** `SimpleSetup` (the 2026-06-29 one-click detour) is deleted and the old 9-step `JourneyBuilder` is no longer routed. **Publish-then-refine** replaces the blocking jargon gate for the happy path; the deep blocking validation still lives in the advanced `JourneyEditor`.

### 6.4 Time expectations — one number for the agency, physics for the system

> **THE SLA REFRAME (V1.2)**
> GHL agencies don't have an SLA culture; they have a promise ("live in two weeks") made on a sales call. Fifteen required SLA-in-hours fields would be blindly accepted or abandoned — either way the numbers wouldn't be theirs and alerts based on them would be ignored. But an overall-only deadline can only detect lateness on the last day — too late to save the client. Resolution: the deadline belongs to the agency; per-step time expectations belong to the system.

- **One agency-set number.** Journey-level "Clients should be fully onboarded within __ days" (`journey.target_days`, default 14). This is the entire time-config surface the agency sees, and it maps to the promise they already made.
- **Per-step thresholds are silent, fully system-owned defaults (v1.7).** GoCSM knows A2P brand review runs 1–3 days and a form takes minutes — ecosystem expertise the product supplies. In v1.7 these are never shown or edited on any agency surface (the editable-on-click step timing and the dashboard calibration strip are both removed — see §8.4). They exist only inside the engine to drive stall detection, and may self-tune from observed medians silently. "SLA" never appears in agency-facing copy.
- **Other prefilled defaults (unchanged).** Deep-link targets prefilled per step type; the GoCSM white-label video is the default with per-step "Replace with your own" override; dependencies auto-suggested pre-wired with undo (A2P campaign requires brand; brand suggests phone first).
- **Drag behavior (v1.3).** Reordering is always clean. Hard requirements (campaign→brand→phone) are intrinsic to step types — carrier-enforced physics, not agency configuration — so locks are computed from requirements regardless of list position. The dependency picker, drag-conflict flags, and circular-dependency check are all removed; the panel's summary shows "Waits for: …" informationally on the two steps where physics applies.

#### 6.4b The three-field step panel (v1.3 — convention over configuration)

The step type already knows the deep link, video, and requirements — re-presenting derived values as editable questions is homework, not configurability. The panel's default view asks only what GoCSM cannot know: **Step type · Title · "What your client sees"** (instructions, prefilled per type in the client voice), plus **Owner** (Client / Agency) and **"How is this step completed?"** — the one genuinely GHL-meaningful choice (§6.4c). Below: deep link and video, each editable. Per-step timing is NOT in this panel (v1.7) — expected duration is a silent engine value, removed from the panel entirely. Snapshot-based types (workflows, funnels) add one first-class field: the named-asset list ("Which workflows should your client activate?" — a multi-select of the assets actually present in the agency's snapshot, pulled from the sub-account via the injection in production; selection by real entity, not typed name, so per-asset detection matches by ID. Empty selection = any activation counts). The doer renders named assets as a sub-checklist ("2 of 3 activated"); the step completes when all assets are done.

#### 6.4c "How is this step completed?" — three methods, incl. custom webhook (v1.7)

Every step declares one completion method, surfaced as three plain choices:

- **GoCSM detects it automatically in HighLevel** ("We watch HighLevel and check this off when it happens — no setup.") — the default for auto-detectable catalog types.
- **Your client confirms it** — adds a "Mark done" button on the client checklist (the manual fallback).
- **I'll send GoCSM an event (`inbound_webhook`)** — reveals a unique webhook URL, a sample JSON payload, and a GHL-native recipe: "In HighLevel, add a Webhook action to any workflow, paste this URL, and the step completes when that workflow runs." This is a new detector type and, strategically, the unlock for unlimited custom steps beyond the fixed catalog — agencies can track anything GoCSM doesn't natively detect, using GHL's own workflow webhooks. Flagged for Abhinav (§13).

Composition verbs: "+ Add step" (bottom row + hover-insert between rows) opens the type picker with plain names; custom steps default to "Your client confirms" or the webhook method. Remove step lives on the panel footer with requirement-aware confirmation. Defaults are silent; only exceptions get ink: editor rows show chips only for "You confirm" steps, agency-owned steps, and configured asset counts — auto-checking client steps (most of them) render as a clean title. Tier letters (A/B/C) never appear; the agency-facing distinction is "Auto-checks ✓" vs "You confirm."

### 6.5 Publish validation

Publishing runs an inline checklist: every step has a deep-link or is manual; at least one instantly-verifiable step in the first three (an early win for the client); the kickoff-call step has a booking link. (The circular-dependency check is removed in v1.3 — impossible by construction once requirements are type-intrinsic.) Failures are specific and clickable, and Publish is disabled until all pass. The migration radio (§6.1) appears in this dialog when applicable.

### 6.6 White-label theming & client-experience settings (v1.9)

These settings — experience mode, placement, brand color, and per-step video — are configured in the builder wizard's experience tail (§6.3b), where the agency meets them as part of guided setup rather than hunting for a popover. They remain quick-editable post-creation via the Appearance drawer — a right-side drawer (brand color + placement sections), opened from a "Customize" control that lives in the journey-level action row (alongside Redo setup · Preview · Publish), NOT in the preview-pane header. This relocation (v1.8) is deliberate: after several rounds trying to style Customize acceptably inside the cramped preview header, the correct fix was structural — Customize is a journey-level action (a peer of Redo setup), not a preview control, so it belongs in the action row where it reads as prominent and uncramped. The drawer reads and writes the same journey fields as the wizard (no fork). Recap of the model: **Experience mode** — Guided (the doer surface shown to clients) or Tracking-only (no checklist shown, but detection, stalls, queue, and automations run unchanged; the Intercom/Pendo presentation-vs-instrumentation split, originally a direct customer request). In tracking-only, manual steps are confirmed agency-side from the client timeline drawer. **Brand color** — one accent (presets + hex) driving CTA, progress, and glyph only, pre-filled from the agency's HighLevel brand color; ink auto-resolved to 4.5:1 from luminance, never shown as a ratio. **Placement** — four options (Floating widget / Top banner / Menu link / Embedded page · Launchpad), configured in BOTH the wizard step (§6.3b) and the Appearance drawer (same control, same field). Default is Top banner (v1.9), not Floating: because most agencies already run a support widget (Intercom et al.), a GoCSM floating widget collides with it, so the non-overlay banner is the safer default and the Embedded/Launchpad option exists for a fully native in-menu experience.

> **WHY THIS IS A MOAT**
> Journey-level theme settings: agency logo + accent color (the latter pre-filled from HighLevel), consumed by the live preview and the doer surface. Most agencies cannot afford to produce their own GHL tutorial library — a maintained, white-label-friendly default video set is real, defensible value, with per-step override for brand-conscious agencies. GoCSM brand elements never appear on the client-facing surface (see §7.1).

---

## 7. Layer B — The Sub-Account Doer Experience

The surface the end client lives in, injected inside their HighLevel sub-account. The job: a competent guide that meets the client exactly where they are, takes them to the right screen, shows them how, and quietly confirms when it's done.

### 7.1 White-label contract and voice

> **THIS SURFACE BELONGS TO THE AGENCY, NOT GOCSM**
> No GoCSM brand stripe, navy presence, logo, or attribution anywhere on the client surface. Theming: agency logo slot + agency accent color (drives the primary CTA and progress fill); all other tokens stay neutral. Health-band colors never appear here — they belong to a system the client never sees.
> Voice: the reader is a non-technical local-business owner. Short sentences, plain words, warm but not cutesy. Never jargon ("DNS propagation" → "your domain is being verified — this can take up to 2 days"). Never blame: "stalled" and "overdue" are agency-side words. Every step answers: what, why it matters to their business, what to click.

### 7.2 The shared step-state contract

One step has exactly one state; all three surfaces render these states with the same visual language (this table is mirrored verbatim in the design-system guidelines):

| State | Meaning | Treatment rule |
| --- | --- | --- |
| `not_started` | Not begun; prerequisites met | Neutral |
| `locked` | Prerequisites unmet | Lock glyph; tooltip names the blocking step |
| `in_progress` | Client/agency began | Interactive blue; full-weight title |
| `verifying` | Tier-B detector awaiting external truth (DNS, carrier) | Liveness primitive: pulse only while actively checking; honest expectation copy; manual override always visible |
| `waiting_on_agency` | Agency-owned step pending | Warning on agency surfaces; CALM neutral on the client surface ("Your agency is on it") |
| `needs_attention` | Detector returned failure/rejection | Warning + specific reason + one concrete fix |
| `done` | Verified or confirmed | Positive check; auto-verified steps carry a small "verified" affix, manual ones "marked done" |
| `skipped` | Agency marked not-applicable | Neutral strike; kept in history |
| `stalled` (lens) | Past SLA, not done — computed | Agency surfaces only; the client NEVER sees stalled language |

### 7.3 Widget topology, progress & the non-blocking model (v1.8)

Governing principle, refined: the client surface shows ONE open action at a time, wrapped in a friendly progress frame — not an operator cockpit, but not a barren card either. The v1.7 pass over-corrected by stripping all progress; v1.8 restores the consumer-grade progress signal that every B2C onboarding flow keeps (the Loom/Revolut pattern — a thin bar, "X of Y done," a checkmarked done-list) while still refusing analyst metrics (percentage, journey-day, time-vs-expected, stall language). The distinction is the whole point: "3 of 8 done" is encouragement; "73% · Day 5 · 6d vs 3d expected" is a grade. Keep the first set, never the second.

**Collapsed (ambient) & placement (v1.11, Y-series):** a compact launcher (pill / banner / menu item) per the configured placement — agency logo glyph + a small progress ring or thin bar + "Setup · 3 of 8." Opening it reveals one checklist card component, and the placement setting changes only its ANCHOR/trigger, never its internals: Floating widget → corner-bubble anchor; Top banner → the same card dropping from the banner, anchored top-right; Menu link → the same card from the sidebar item. All three render the identical compact, content-sized popover overlaying HL — NOT a full-height side pane — sized to its content in the focused state (roughly half-viewport or less, no large empty gap), growing only to a capped max-height (~70–80% viewport) with the list area scrolling internally and the header pinned. The card never blocks HL: the rest of the screen stays visible and interactive. The single structural exception is the Embedded page · Launchpad placement, which mounts the checklist as a full in-page view (it is a page, not an overlay). This matches the Intercom-style corner card most agencies' clients already recognize.

**Expanded (panel) — focused by default (v1.11, X-series):** a friendly checklist header (agency logo + "Your setup checklist" + thin accent progress bar + "X of Y done" — no percentage, no journey-day), then a deliberately short, progressive-disclosure body so a non-technical client sees ONE thing to do, not a flat list of fifteen: a collapsed "Done (N) ✓" group at the TOP (count + check, expandable; completed work honored first, for momentum) → the single current/suggested step as the expanded hero card (§7.4) → a collapsed "More steps (N)" group (count + one-line hint, expandable) → the calm "Waiting on review" group for pending steps. Tapping a collapsed group reveals its steps; tapping a step there expands it in place (accordion, in its own list position) — a step never jumps to the top, because position encodes order and moving cards disorients. Empty groups are hidden (a brand-new client with 0 done shows no Done group).

> **THE NON-BLOCKING MODEL — ASYNC STEPS NEVER FREEZE THE CHECKLIST (V1.8)**
> The problem: steps like A2P brand/campaign and DNS-based domain setup take days of external (carrier / DNS) processing. Holding the entire journey hostage to a carrier is wrong — the client did their part; making them stare at a frozen "waiting" screen is counterintuitive and kills momentum. The async-workflow literature is unanimous: handle long-running work as a background job with a pending state and recoverable partial failure, not a gate (the Uber/Airbnb "defer the blocking requirement until the transaction that needs it" pattern; the "dashboard of pending tasks you chip away at" pattern).
> **Two kinds of waiting, only one of which blocks:** (1) **Pending / verifying** — the client finished their part; an external party is processing. The step shows "We're checking this — usually 1–3 days. You can keep going," and does NOT block unrelated steps. (2) **Locked** — reserved for genuine hard dependencies only. Per GHL physics the hard graph is tiny and carrier-enforced: send-SMS ← A2P campaign ← A2P brand ← phone, and funnel-goes-live ← custom domain. Everything else (business profile, calendar, GBP, Stripe, pipeline, forms, email-domain setup itself) is independent.
> **"Current step" = next ACTIONABLE step.** The panel always points the client at the next thing they can actually do. A client whose A2P is verifying is advanced to email domain / funnel / calendar while A2P verifies in the background — 11 of 15 steps have zero dependency on the laggy ones, so parallelism is the honest model, not permissiveness. The linear sequence was the artificial constraint.

**Graduation:** at completion, one designed celebration (a single card naming the business outcome: "You're fully set up — your first leads will land in your pipeline"), then the widget retires from ambient display. Reachable from the menu; never haunts daily use.

### 7.4 The current-step card

Title, one-sentence why-it-matters, ONE primary CTA: "Take me there →" (deep link to the exact HL screen), and a quiet "▶ Show me how" text link opening the agency's video inline (collapsed by default), never a blocking modal. The dispute link ("I've already done this") sits as small text under the card. Each state stays minimal and never shows more than one primary button: `not_started` / `in_progress` = the card above; `verifying` (v1.8) = title + why + the honest waiting strip ("We're checking this — usually 1–3 days") AND a clear forward path — "Meanwhile, let's set up {next actionable step} →" — so the client is never frozen on a waiting screen (the non-blocking model, §7.3); only the demoted dispute link otherwise; `needs_attention` (failure) = the plain reason + exactly ONE primary action ("Fix it in the Trust Center"; "HighLevel's compliance page" lives in the body, not the button) + the dispute link, no "Show me how." Manual ("You confirm") steps swap the CTA for "Mark as done." Agency-owned steps render calm and actionless. The kickoff-call step is a CLIENT action: the agency embeds their calendar, the client books in a non-blocking embed, the booking event auto-verifies. `waiting_on_agency` remains for genuinely agency-owned custom steps.

> **REJECTION & RECOVERY — THE STATEFUL BACK-AND-FORTH (V1.8)**
> When a pending step fails (A2P brand rejected, DNS fails), only that step flips to `needs_attention` with the specific reason and one fix — regardless of how far the client has progressed elsewhere. All other completed steps stay `done`; overall progress is preserved. The failed step re-surfaces to the top of the client's view as the priority ("One thing needs your attention") without resetting anything. Downstream steps that genuinely depended on it (e.g. SMS campaign ← A2P) stay locked until re-submission succeeds; independent completed steps are untouched. After re-submission, the step returns to `verifying`. This is the "recoverable partial failure" pattern: the journey keeps its state and reopens only the affected part.

#### 7.4b Progress signal & asset sub-checklists (v1.8)

The client header carries a consumer-grade progress signal (§7.3): a thin accent bar + "X of Y done" + a collapsible "Done (N) ✓" list — the encouragement pattern every B2C onboarding keeps. What stays off the client surface is analyst framing: the percentage, the "Day N of your setup" journey-clock, and any time-vs-expected / stall language — all of which are operator metrics that belong on the agency dashboard, not a plumber's screen. The one step-clock moment that remains client-facing is the reassurance copy inside a `verifying` step ("usually 1–3 days") — a comfort, not a grade. Steps with named assets render them as a sub-checklist inside the step card with per-asset checks ("2 of 3 activated"), completing when all assets complete. Completed assets render as a muted row with a check — never struck through.

#### 7.4c Client navigation — a browsable map, not a locked ladder (v1.11)

The doer is a map, not a track (U-series). Because most GHL steps are genuinely independent, the client surface lets the user act on ANY available step in ANY order. The hero is the system's suggestion for the next step, not a gate; every other available step (under "More steps") is tappable and, when opened, behaves exactly like the hero card (why + "Take me there" + "Show me how", or a direct deep link). Completion is position-independent: a step moves to Done the moment its detector signal fires — including a step the client completed out of suggested order directly in HL (e.g. they built their pipeline first) — with a checkmark and a brief micro-celebration; being lower in the list never prevents or undoes completion. The hero then re-suggests from what remains. Done vs not-done differ only by the checkmark; there is no "future/upcoming" locked styling, because order is the client's to choose.

The locked state is narrowed to the one genuine dependency (V-series). The earlier broad "LOCKED" group is removed. The ONLY hard chain that gates availability is carrier-enforced: A2P campaign ← A2P brand ← phone number. Funnel-goes-live ← custom domain is a soft dependency (a funnel publishes on the system domain without a custom domain), so it does not lock. Everything else (business profile, email domain, calendar, GBP, Facebook, Stripe, pipeline, lead form, kickoff) is always available regardless of order. For the one or two steps that genuinely cannot start yet, the punitive "LOCKED" framing is replaced by a calm, plain-language line — "Available once your text-messaging registration is approved — we'll open this automatically" — rendered as the quietest item in the list, never red, and it opens itself the moment its prerequisite completes. This is honest dependency protection (it prevents a real carrier dead-end), not artificial gating.

### 7.5 The signature mechanic — "it just knew"

When the user returns to the widget (window focus / route return) after a deep link, the widget re-verifies that step immediately and reacts in under a second. Tier A: step snaps to `done`, ring increments, next step slides up — no spinner theater for instant checks. Tier B: enters `verifying` (Liveness states, honest expectation copy: "Carrier review usually takes 1–3 days — we'll keep checking and update this automatically") with the manual override visible; a later failure becomes `needs_attention` with the specific reason and one fix. Never make the user refresh or self-report something we can detect.

---

## 8. Layer C — Dashboard / Overview, Stall Analytics & Automation

Not a report — a work queue with evidence behind it. The operating question it answers every morning: **who do I save today, and did yesterday's saves work?** The page follows the Insight Hierarchy: **Verdict → Triage → Queue → Evidence → Detail.** The v1.12 "tracker" redesign re-composed this hierarchy around one job for a non-technical, high-ADHD agency owner: *show me who's stuck and let me unblock them in one move, at a glance.* Enemy = overwhelm.

### 8.1 Triage first — who needs me, then the count (v1.12)

The Overview's top-of-page orientation is the **triage strip**: three tiles on the *triage axis*, the 3-second answer to "what needs me today?"

- **🔴 Needs you ({stuck})** — the `isStuck` count. The ONLY saturated/red tile (Linear color discipline).
- **⏳ Waiting on review ({pendingExternal})** — carrier/DNS, no action. Muted.
- **✅ On pace ({onboarding − stuck − pendingExternal})** — moving fine. Muted.

Each tile filters the single surface below it (progressive disclosure; no filter chips on screen by default). A quiet **velocity proof line** sits under the strip: *"{onboarded} finished this week · avg {median} days to onboard ({delta} vs prior window)."* Real data (`prior_median_days_to_activate`), green/red arrow, ONE number — never a chart, and a regression renders **calm-neutral**, not alarm (a slower week is information, not an emergency).

> **WHAT THIS CHANGES FROM v1.7/v1.8 — TRIAGE AXIS REPLACES THE LIFECYCLE CENSUS AS THE LEAD**
> Earlier versions led with three **lifecycle population cards** (Onboarded / Onboarding now / Not started) — the "answer the count before the triage" founder reframe (Tim). v1.12 keeps that spirit but corrects the axis: the question an overwhelmed owner actually asks first is *"who needs me?"*, not *"how many are in each lifecycle bucket?"*. So the **triage axis** (Needs-you / Waiting / On-pace) is now the primary orientation, and the **lifecycle census is demoted** into the full account list's pills — reachable, never the hero. There is no 4th counter row, and the page never shows a wall of counters. The underlying unit is unchanged (% of checklist completed → activated per account); the owner just sees the population that maps to action.

> **TIME IS MEASURED, NOT PRESCRIBED — AND ONBOARDING ENDS AT COMPLETION, NOT AT A DATE (V1.9, IVORY FEEDBACK)**
> **Retrospective, not prescriptive duration.** The journey-level "target" number is a measured benchmark the agency wants to collapse ("your average is 23 days, down from 28 last quarter — how much shorter can we make it?"), not a prescribed deadline. The operator surface reports observed average-time-to-onboard and its trend (the velocity proof line above), not a countdown against a guessed SLA. The per-account "target Day N" still exists as the stall reference (it's how "past target" is computed for the queue), presented as the current benchmark, never as a promise the client is failing.
> **Onboarding completes on milestones, not on the clock.** A client does NOT graduate out of onboarding because days elapsed; they remain in onboarding until the checklist is actually complete — a client can sit in onboarding for weeks or months if they never finish, and that is correct, not a false "graduated." Time elapsing changes nothing about completion state (it only flags the account as stuck for the queue). This kills the false-positive where a stalled account appears to progress simply because the calendar moved.
> **Onboarding completion ≠ activation (handoff to the health/lifecycle layer).** Finishing the setup checklist means the account is set up, not that it is activated — i.e. that real business activity (emails sent, forms submitted, appointments booked) is flowing through it. Activation, the lifecycle-stage model, and the milestone rules that gate them are tracked by the Account Health / lifecycle layer, NOT by this onboarding system; "high setup, zero activity" is a health signal, out of scope here. This PRD owns reaching "set up"; the health layer owns "activated."

### 8.2 Tier 0 — the Verdict (AI-attributed, dollar-led, trust-calibrated)

One declarative sentence + the number that matters, **dollar-led and naming the dominant bottleneck** (v1.12):

> *"{N} clients are stuck on '{step}' past Day {target} — that's where most of your onboarding pain is. ${X}/mo is behind it."*

Rendered as a band, not a hero (v1.8, J-series): roughly half the height of the earlier full-bleed treatment, so it informs without dominating the fold. The single biggest secondary bottleneck merges INTO the verdict as one quiet line — "Also slowing clients: {step}". The verdict carries a **data-sourcing transparency** stamp — a passive status, not a clickable peer — compressed to **"Numbers exact · wording is AI"** with provenance ("computed from timestamps") behind one quiet click. Attribution reads **"GoCSM Analysis."** Evidence and the full step table are one affordance, not two (v1.10, N-series): a single "Where clients get stuck ▾" expander opens the full where-clients-get-stuck table inline beneath the band, with the verdict's own step highlighted as the top row — so it serves as both the evidence for the verdict and the full pattern at once. The only two interactive controls in the row are this expander and the "See who's stuck ↓" button to the queue.

> **AGENCY-AS-BOTTLENECK VERDICT IS DATA-DERIVED (v1.12 PHASE-4 FIX)**
> When the agency is the bottleneck, the verdict is a factual mirror, never shaming: "Kickoff calls are waiting on your team for 5 clients — oldest 9 days." This line is **derived from the actual `blocked_by === "agency"` set**, not a hardcoded string — so the headline, the CTA, and the queue can never disagree (the earlier prototype had a false hardcoded "5 clients / kickoff call" line that contradicted the live data). Warning accent on the left edge only; no red flood. "SLA" never appears.

> **ONE VISIBLE AI SURFACE, BY DESIGN (v1.12)**
> The Verdict is the ONLY AI-marked element on the page — by design, less AI than every competitor. Its lead clause is the systemic bottleneck, which is a **fact** (timestamp-derived). The money-ranked queue ranking is **arithmetic** and is deliberately NOT labeled AI — calling it AI would erode the headline's trust. There is no Ask/chat box, no recommended-action menu, no generated per-account prose, and no trend-narration paragraph. Provenance ("Why this?") is one quiet click, never inline.

### 8.3 Tier 1 — the Queue (the centerpiece, money-ranked)

The stall list as a triage queue — **the hero of the page** — sorted by **revenue-at-risk × days-stuck** (`selectStalledByImpact`). It sits directly under the triage strip; the top row plus its single button is the one focal action of the whole page. Cap ~5 rows visible; "show all N" expands. Money is the **sort key**, surfaced as a quiet Mono `$/mo` eyebrow — never a wide ARR column.

**Row hierarchy — diagnosis first, timing demoted (v1.10, Q-series).** The row ranks by what an owner acts on, not by what's loudest. Reading order left-to-right: client name → step + reason → MRR + blocked-by (quiet context) → one timing token → actions. The step name is the visual anchor (the strongest text after the client name), with a one-line plain-language reason directly beneath it in a quiet-but-legible color — the agency-voice failure reason such as "Conflicting mail records on their subdomain," "Domain isn't pointing to HighLevel yet," or "Duplicate email-signing record." The reason is ONE short clause; tool names, record-level detail, and observed-vs-expected values live behind the row in the ⋯ "View details" and timeline drawer, never on it. Timing is a single token (Q-series): "Stuck N days" only — the prior multi-clock row ("Day 38 of 14" plus a separate "no movement since Day X" line) is reduced to one duration. The journey-day-vs-target and days-since-movement measures remain in the timeline drawer, not the row. Removing "Day N of 14" from the row also aligns with the v1.9 reframe: per-row urgency is "how long stuck" — a fact — not "how far past the promised date" — a scold. MRR and the blocked-by badge are present but visually quiet — context, not headline.

**The whose-move pill (the differentiator).** Each row carries a first-class "whose-move is it?" pill from `blocked_by: "agency" | "client"`: agency-blocked = info/blue (*you can act now*); client-blocked = warn/amber (*you nudge*); external = neutral. Even Arrows' at-risk trigger conflates "they're late" with "we're late." We don't.

**Group by reason (v1.10, P-series).** Atop the queue, a compact reason-summary shows the top 2–3 stuck reasons with counts as filter chips — "No detector signal · stalled (3) · Custom domain · DNS wrong (1) · Email domain · duplicate DKIM (1)." Clicking a chip filters the queue to those clients, turning N individual investigations into one batched response ("4 clients have the same A2P problem — handle them together"). The reason taxonomy is the failure-state set from the catalog, collapsed to short labels; the existing All / Stuck / Client-blocked / Agency-blocked filters still work alongside it. Reason chips stay secondary, surfaced only when ≥1 group and >5 rows.

**Row action pattern (v1.8, H-series; refined v1.11, W-series):** every queue row ends with `[primary button] [⋯ overflow]` in the same position — the primary action is always visible (never hover-revealed), because the operators are non-technical and many are on touch devices where hover does not exist. The primary label is owner-aware (client-blocked → "Trigger workflow"; agency-blocked → "Assign"; external past-window → "Check status / escalate"). Clicking the row itself opens that client's timeline drawer (the standard list→detail gesture; the row shows a hover affordance, and clicking the primary button or ⋯ does not also open the drawer). The overflow ⋯ is contextual, not a fixed generic list: its items are only what makes sense for that row — "Assign to teammate" and "Open in HighLevel" by default, with a scheduling action ("Open kickoff calendar") shown ONLY on a row whose stuck step is the kickoff-call step. "View timeline" is no longer an overflow item (the row click replaces it), and the generic "Open calendar" is removed (it was meaningless on most steps). Consistent placement means the owner's eye learns one spot.

> **REVERSIBLE-ACTION RECEIPT — UNDO ON EVERY ROW ACTION (v1.12)**
> The primary row action fires the **`ActionReceipt`** primitive: a receipt showing the **scope** + **blast-radius** + **grace countdown** + **Undo** — the concrete "show draft → confirm → undo" safety net (the ChurnZero/Gainsight pattern). This is the Reversible Action primitive (visible scope, blast radius, undo grace) made tangible on the Overview. The receipt persists in the row — "Sent: {workflow} ✓" with a brief undo, then "GoCSM will report back when the step completes." Intervention memory is how the loop closes.

**Trigger Workflow — a chosen workflow, not an auto-fire (v1.7).** Clicking opens a small popover anchored to the row: the client's actual GHL workflows by name, with the most relevant one surfaced first by stuck-step (A2P stall → "A2P registration help"; kickoff stall → "Book your kickoff call") under a quiet "Suggested for this step" label. Selecting one fires it and shows the Reversible Action receipt above. Nothing fires until a workflow is chosen. This keeps the diagnosis-not-prescription stance: GoCSM surfaces the problem and suggests; the agency decides.

**Owner-aware routing.** Client-blocked rows offer client-outreach actions (Trigger Workflow). Agency-blocked rows offer internal actions only (Assign to teammate, Open calendar) — never client-directed actions. The failure mode we design against: nagging an end client about a task that's waiting on the agency. The word "nudge" does not appear on any operator surface (v1.7).

**Pending is not stuck (v1.8 logic; v1.10 presentation; v1.12 relief framing).** A client whose A2P or DNS step is legitimately inside its normal external-review window is not in trouble and does NOT appear in "Needs help today" — the action queue is for clients who need a push, not clients waiting on a carrier. A step escalates to stuck — and enters the queue — only when it exceeds the expected external wait (e.g. A2P pending > 5 days) OR the client is blocked on something they themselves control. Presentation rule: the pending set lives in a **"Waiting on others — nothing for you" relief strip** that is subordinate to the queue, not co-equal — it sits BELOW "Needs help today," collapsed by default to a single muted line ("✓ 1 client waiting on carrier/DNS review · day 2 of ~3 · no action needed") that expands on demand. Expanded, each pending card is lighter than a queue row: name + step + calm "Waiting on carrier · day 2 of ~3" status, no MRR/blocked-by/primary-button apparatus (there is nothing to action; a quiet "Check status" link at most). Framed as relief ("nothing for you here"), counted not enumerated — nobody else suppresses third-party waits. The principle: zones are separated by whether the owner must act, and visual weight tracks that — "needs me" is prominent and first; "in flight, monitor" is calm, collapsed, and below.

### 8.4 Tier 2 — Evidence: where clients get stuck (v1.7; v1.12 collapsed by default)

> **REVERSES THE V1.2 CALIBRATION STRIP**
> The v1.1–1.6 evidence layer carried a per-step "expectation calibration strip" (system expected-time vs the agency's median, with "update the expectation?" proposals). It was elegant in the abstract but, on a non-technical owner's screen, became per-step homework — the very SLA-tuning the v1.2 SLA-reframe set out to delete, smuggled back through a friendlier sentence. v1.7 removes it from the agency surface entirely. The system may still self-tune its silent thresholds from observed medians; it just never asks the owner to.

The evidence section collapses to its one true signal — where do clients pile up? — as a clean table an owner reads in three seconds. In v1.12 it is a **calm drill-down below the fold**: the "Where clients get stuck ▾" disclosure off the verdict (§8.2). When opened, columns: **Step · "Made it here" (n/15 + bar) · "Stuck now" (count in red, blank when 0 — no dashes).** Each step shows its count-stuck and is **clickable to filter the queue** to those clients. No day numbers, no expected-time column, no flag-threshold controls. The step with the most clients stuck carries one auto-computed line — "Most clients get stuck here" (at most one step, nothing to tune). Rows sort by stuck-count descending so the table reads top-down as a focus list; a signal view shows only stuck/bottleneck steps by default, with "Show all 15 steps."

#### 8.4b Time vocabulary — two clocks, one rule (v1.7; clarified v1.10)

> **MILESTONES FOR STEPS IN AGGREGATE; DURATIONS FOR A CLIENT STUCK RIGHT NOW**
> Both clocks are operator-surface vocabulary — neither appears on the client doer, which carries only the consumer progress signal ("X of Y done," no journey-day; §7.3). On the operator surfaces: the **journey clock** (Day N since sign-up, vs `target_days`) answers "how far along is this client?" — it owns the client timeline drawer and, as a benchmark not a scold, the portfolio view; per the v1.9 reframe and the v1.10 Q-series it no longer sits as a "Day N of 14" token on each queue row. The **step clock** (days on the current step) answers "is this client stuck right now?" — it owns the queue ("Stuck 12 days"), the verdict, and the stall trigger. The one ratified exception (v1.7, founder language): the "where clients get stuck" evidence table, when it shows timing at all, speaks in journey-clock milestones ("usually done by Day 5" — Tim's verbatim framing), because aggregate step expectations compose visibly with the 14-day promise; individual stalls still use step duration. A blanket conversion in either direction destroys one of the two questions; both clocks are first-class on the operator side.

### 8.5 Tier 3 — Detail, the client timeline, & navigation

The client timeline drawer (v1.3; dated markers v1.11): clicking a portfolio row opens the client's onboarding story — header with progress ring and "Day 12 of 14 target"; a vertical timeline of steps in journey-clock positions with durations annotated only where they exceeded expectation ("took 6d — usually 3d"); interventions as markers between steps ("Workflow sent — completed 2d later"); locked/future steps dimmed; footer carries the owner-aware action and "Open Account Health Hub →". Each step and intervention shows BOTH the relative Day N and the actual calendar date — "Done · Day 5 · May 1," "Workflow sent · Day 12 · May 8" — so a CSM can anchor to a real date and search back (a direct Ivory request); the date is a quiet secondary, not competing with the step name. This drawer is the content spec for the Hub's Onboarding lens.

Full portfolio table ("Every client you're onboarding"): every client, % complete, current step + state (stalled rows carry a quiet "· 12d on this step" suffix), Day column (journey clock), owner, MRR, and the **lifecycle census pills** (Onboarded / Onboarding now / Not started — demoted here in v1.12, no longer a hero counter row). Filters: stalled / blocked-by / step. Row click opens the timeline drawer; the drawer links onward to the Account Health Hub → Onboarding lens — the Hub's existing tab pattern gains an Onboarding tab rather than this feature inventing a parallel detail page. This resolves the integration question in favor of one account surface (formerly open question Q5). Onboarding status feeds the Hub's narrative; an account stalled in onboarding surfaces in Watch/At-Risk framing automatically. In v1.12 this full list is a **demoted, behind-"show all" power view** — calm, below the fold.

### 8.6 Empty, zero & rollout states — the activation ladder (v1.6) + the all-clear reward (v1.12)

The empty state is not one screen — it is the feature's own activation funnel, designed with the same craft as the feature. Four rungs, each with its own dev toggle for rollout QA. Three borrowed patterns and one structural advantage: onboard the agency with the product itself (the setup checklist renders in the doer's own card anatomy — the Intercom move); sample data beats description (the dimmed demo dashboard under a SAMPLE ribbon — the Stripe/Amplitude move); never show a true zero when real adjacent data exists ("You're tracking 14 accounts" — the Linear move); and the one no competitor can copy: detector backfill closes the published-zero-data gap in minutes.

| Rung | Condition | Overview renders |
| --- | --- | --- |
| **1 · New customer** | No journey exists | Setup hero in doer current-step anatomy: "You're tracking {n} accounts. Here's what their onboarding looks like." Three checklist rows (Create → Publish → Watch progress appear; rows 2–3 locked). Below: the sample dashboard at reduced opacity, non-interactive, ribboned "SAMPLE DATA — yours appears after publishing." |
| **2 · Journey drafted** | Draft exists, unpublished | Same hero; row 1 "Verified ✓", row 2 current ("Publish your journey — 15 steps ready"). The feature's own checklist earns its checkmarks the way a client's would. |
| **3 · Published · scanning** | Journey live; retroactive detection running | The scan moment: pulse + "Scanning your accounts for onboarding signals… 6 of 14 scanned"; portfolio rows materialize one by one with REAL detected states ("Bloom Dental · 13 of 15 already complete · detected just now"). Resolves to a one-time success card: "14 clients mapped. 31 steps were already complete; 3 clients need attention today." Liveness language throughout — the system working, never a spinner. This moment is the detectors' single best demo. |
| **4 · Sparse (week 1)** | Live; few clients, thin data | The real dashboard with honest treatments: metrics that need history render "— · needs your first completed client", never fake values; real zeros render with calm copy ("0 stuck — all moving"); the per-step table appears only when a step needs attention. No wall of dashes, no invented urgency. |

> **THE ALL-CLEAR REWARD STATE (v1.12)**
> When **Needs-you = 0** (today's `zero-stalls` / `sparse` modes), the page renders a designed, calm **payoff**, NOT a blank table: a single centered check + a warm line — *"You're all caught up. Every client who needed you, you've handled."* — plus the quiet on-pace count, and **no competing CTA**. For a brand-new / sparse account the copy adapts to *"Nothing needs you yet."* This is the Superhuman / Todoist-Zero pattern — the daily reason the owner comes back. (Zero stalls in steady state, unchanged: "Nothing stuck past expected time. {n} clients progressing normally." Never invent urgency.)

> **ENGINEERING FLAG (ABHINAV)**
> Rung 3 requires retroactive detection on publish — the detector framework must scan existing location state (numbers, domains, integrations, assets), not only listen for new events. This is the launch's highest-leverage engineering investment: it collapses time-to-first-real-data from weeks to minutes.

### 8.7 HighLevel custom triggers — the automation primitive

The piece that turns analytics into action, and a novel primitive in the GHL ecosystem. Once per-step timestamps and SLAs exist this is cheap — a timer plus an event emit. It ships with the dashboard, not after Sherlock.

> **TRIGGER CONTRACT**
> `EVENT: onboarding.step.stalled`
> `FIRES WHEN: now − step.started_at > step.sla_hours AND state != done` (`sla_hours` = system default by tier, observation-tuned — §6.4)
> `PAYLOAD: account_id, step_id, step_title, owner, days_stuck, journey_id, journey_version`
> Consumed by the agency's own HighLevel workflow (email/SMS, task, CSM notification). Reinforces GoCSM's two existing exposed actions (Trigger Workflow, Request Feedback). Trigger-driven automation and the queue's manual actions write to the same `last_intervention` record.

### 8.8 Sherlock — the conversational assist (Phase 4)

The expensive, last layer — deliberately. By the time it ships we'll have watched real stall patterns, which define exactly what Sherlock must answer. Scope: contextual, GHL-specific diagnosis with a concrete pointer — "Your A2P brand was rejected because the business name doesn't match your EIN record; fix it in Trust Center →." It diagnoses and prescribes; it acts only on explicit user trigger, governed by the Reversible Action contract. On the client surface it speaks the doer voice (§7.1).

---

## 9. Success Metrics

| Metric | Definition | Target |
| --- | --- | --- |
| Activation rate | % of new sub-accounts reaching journey completion | ≥ 60% (industry-leading band) |
| Median time-to-activate | Days from journey start to completion | Establish baseline → reduce 30% in 2 quarters |
| Step auto-detection accuracy | Detector verdict vs. ground truth | ≥ 98% on Tier-A steps |
| Stall-to-outreach latency | Time from SLA breach to intervention (manual or trigger) | < 24h |
| Intervention efficacy | % of interventions followed by step completion within 72h (from `last_intervention` outcomes) | Establish baseline; the queue exists to raise this |
| Builder time-to-first-journey | Empty state → published journey (any door) | < 10 min; < 5 via paste-import |
| Feature attach rate | % of GoCSM agencies activating onboarding | Primary adoption KPI |

---

## 10. Delivery Plan & Phasing

Sequenced so each phase is independently releasable and beats the spreadsheet-and-Slack status quo. Two coupling rules: stall-detection and the custom trigger ship together with the dashboard (identical data), and journey versioning is P1 schema, not a later migration — retrofitting version pinning onto live assignments is a data-integrity nightmare.

| Phase | Scope | Why this order |
| --- | --- | --- |
| **P1 — Builder + detector framework** | Journey lifecycle (draft/publish/version/pin), template library, the **template-first, two-pane `SetupWizard`** with opinionated defaults + progressive-depth Customize + the advanced `JourneyEditor` (deep-links, plan variants, blocking publish validation), theming. Detector contract + 2–3 Tier-A detectors live. Stretch: paste-your-checklist AI import (behind a flag until mapping quality is proven). **The v1.12 SetupWizard redesign in this phase shipped to the prototype on 30 June 2026.** | Can't track journeys that don't exist. Detector schema AND versioning are the long poles — both are P1 schema, even if few detectors are implemented. |
| **P2 — Doer + contextual video** | Injected widget (pill → panel), white-label theming + client voice, deep-links, re-verify-on-focus, nine-state rendering incl. `verifying`/Liveness, video slideout, graduation moment. | First end-client value; releasable v1 that already beats the status quo. |
| **P3 — Overview / Dashboard + queue + custom trigger** | The Verdict (dollar-led, data-sourcing transparency) with the merged where-clients-get-stuck expander; the **triage-strip-first Overview** (triage axis → money-ranked hero queue with `ActionReceipt` undo → all-clear reward → subordinate relief strip → calm drill-downs); reason grouping; the bottleneck table; Hub Onboarding lens; `onboarding.step.stalled` trigger. **The v1.12 Overview redesign in this phase shipped to the prototype on 30 June 2026.** | Analytics and the automation primitive share data — ship together. Receipts require the intervention record, which the trigger also writes. |
| **P4 — Sherlock assist** | Conversational, GHL-specific stuck-diagnosis with concrete pointers; doer voice on the client surface. | Most expensive; build after observing real stall patterns that define its scope. |

> **SEQUENCING RISK**
> If the detector framework slips, the temptation will be to ship P1–P2 manual-only and "add detection later." That is a trap — retrofitting detection onto a boolean schema is painful, and manual-only loses against Trello. The same applies to versioning: the schema must assume detectors and version pinning from the start even if implementation lags.

---

## 11. Decision Log & Open Questions

### 11.1 Decision log (v1.0 → v1.2)

| Decision | Resolution |
| --- | --- |
| Account detail navigation (was Q5) | Onboarding becomes a lens/tab on the Account Health Hub — no parallel detail page. Onboarding status feeds the Hub narrative and Watch/At-Risk framing. |
| Journey editing vs in-flight clients | Versioned journeys; clients pinned to their start version; migration is an explicit action with stated blast radius. |
| Step status model | Nine-state shared contract (incl. `verifying`, `waiting_on_agency`, `needs_attention`); "stalled" is a computed agency-side lens — never stored, never client-visible. |
| AI stance | Diagnosis + concrete prescriptive pointers to real actions; execution only on explicit user trigger, governed by the Reversible Action primitive (scope, blast radius, undo). Supersedes v1.0 diagnose-only phrasing; aligned with DS v2.1. |
| Client-surface branding | Fully white-label: agency logo + accent; no GoCSM brand on the doer. Separate plain-language voice spec for end clients. |
| Time-expectation model (v1.2) | Agency configures ONE number: a journey-level completion target (default 14d) mapping to the promise they already made; per-step thresholds are silent tier-aware system defaults. 'SLA' removed from all agency-facing copy. (The editable-on-click per-step timing and the dashboard calibration strip described here were later cut entirely — see §8.4 and the v1.7 entry; the target itself became a retrospective benchmark in v1.9.) |
| Route IA (build-validated) | Operator routes: `/onboarding` (dashboard), `/onboarding/journeys/new`, `/onboarding/journeys/:id`, nested under the app shell; `/doer-demo` standalone (client surface). Canonical seed journey (15 steps, 7 done, A2P verifying day 2) is the shared reference instance for all surfaces — every surface renders from the one seed object, never a local copy. |

### 11.1b v1.3 — the audit & simplification pass

Driven by a full persona audit of the working prototype. Several entries reverse documented v1.1/v1.2 decisions — the reversal trail is deliberate.

| Decision | Resolution (and what it reverses) |
| --- | --- |
| Lifecycle vocabulary | Version numbers removed from all agency-facing surfaces; one status chip (Draft / Live / Editing); migration folded into the Publish dialog; kebab (Duplicate/Archive/Migrate) removed. Mechanism unchanged. Reverses the v1.1 header spec's version chips. |
| Dependencies → step-type physics | Per-step dependency configuration removed. Hard requirements (campaign→brand→phone) are intrinsic to step types; locks computed regardless of order; drag-conflict UI and circular-dependency check deleted. Reverses v1.1 §6.4 auto-suggested dependencies. |
| Three-field step panel | Default panel = type + title + client-facing copy (prefilled per type) + "GoCSM handles the rest" summary + one Customize disclosure. Defaults are silent; only exceptions get ink (no tier letters, no per-row timing chips). Reverses the v1.1 full-form panel spec. |
| Step verbs completed | Add step (bottom + hover-insert, plain-name type picker) and Remove step (requirement-aware confirm) added — both missing from v1.1–v1.2. |
| Two-clock time vocabulary | Journey clock (Day N vs target) for the client narrative and operator timeline/portfolio; step clock (days vs expectation) for queue, verdict, and trigger. Codified after a near-miss blanket conversion; the full rule and its later clarifications live in §8.4b. |
| Client timeline drawer | New Tier-3 surface: per-client journey story (timeline + interventions + projection) off the portfolio row; doubles as the Hub Onboarding-lens content spec. |
| Named assets for snapshot steps | Workflows/funnel step types gain an optional agency-defined asset list; doer renders a sub-checklist; step completes when all assets do. Empty list = type-level behavior. Requires per-asset detection (flag for Abhinav against the §4 detector contract). |
| Verification language | Agency-facing distinction is "Auto-checks ✓" vs "You confirm"; tier letters A/B/C are internal-only. |

### 11.1c v1.4 — customer-pull & coherence changes

| Decision | Resolution |
| --- | --- |
| Kickoff call → client action (resolves Q1) | Agency embeds their calendar in the step; the client books inside the doer (non-blocking embed); the booking event auto-verifies. The journey's human anchor gains Tier-A detection. `waiting_on_agency` remains in the state contract for custom agency-owned steps. Canonical seed updated: s15 owner=client, detector=booking event. |
| Experience modes (customer pull) | Journey-level Guided / Tracking-only setting. Tracking-only injects no widget; detection, stalls, queue, and automations run unchanged — presentation and instrumentation are independent layers (Intercom/Pendo pattern). Manual steps confirmed agency-side via the timeline drawer. Requested by customers with home-built onboarding; first PRD change driven by customer pull. Pricing implication flagged for Tim: the tracking spine alone clears willingness-to-pay for this segment. |
| Brand color w/ auto-contrast | One accent color (presets + hex) on the client surface, driving CTA/progress/glyph only; ink auto-resolved to 4.5:1 from luminance — never surfaced as a ratio. Deliberately the Intercom one-action-color model, not a full theme editor: the doer is a single designed surface, unlike DAP widgets that must blend into arbitrary UIs. |
| Asset selection → snapshot multi-select | Workflow/funnel asset lists are selected from the assets actually present in the snapshot (via injection in production), not typed — per-asset detection can match by entity ID. Strengthens the §4 detector conversation with Abhinav. |
| Default sequence: domain before funnel | Standard template and canonical seed reorder: Connect custom domain precedes Publish funnel — the funnel goes live on the branded domain on first publish. Soft-order change only; no hard requirement (per v1.3 physics model). |
| IA unification: one tabbed page | `/onboarding` with two tabs — Overview (dashboard) and Journey (editor; the three-door creation experience is the Journey tab's empty state). Old routes redirect; cross-links wired. Supersedes the v1.2 route-IA entry. If multi-journey ships (Q2), the Journey tab gains a switcher, not a list page. |

### 11.1d v1.5 — the step-state playbook

New §12: exhaustive per-step state definitions for all 15 catalog steps — detector signals, entry conditions, the complete failure catalog per step (grounded in HighLevel support documentation and carrier/OAuth research), and shippable copy for both audiences per state. Establishes the universal state grammar, the copy voice rules, and the cross-step edge policies (dispute flow, regression rule, snapshot pre-completion). This is the build contract for Jose (doer rendering) and Abhinav (detector semantics — note especially: GBP sync-health beyond connection, Stripe charges-capability beyond token, per-asset entity matching).

### 11.1e v1.6 — the rollout activation ladder

§8.6 rewritten as a four-rung activation funnel with dev toggles (New customer / Drafted / Published·scanning / Sparse week-1). Design lineage: Intercom (the product onboards you with itself — the setup checklist wears the doer's card anatomy), Stripe/Amplitude (dimmed sample data over prose explanation), Linear (real adjacent numbers over true zeros), plus GoCSM's structural edge: detector backfill makes the post-publish scan a live trust moment rather than an empty wait. Demo-script implication: the scan is the new opening beat — create from the paste door, publish, watch real clients materialize in ninety seconds.

### 11.1f v1.7 — the simplification arc ("don't make me think")

A sustained pass driven by repeated 3-second-comprehension audits and a founder mandate that the product be operable by "a VA in the Philippines" without CSM hand-holding. Several entries reverse earlier decisions — the reversal trail is deliberate.

| Decision | Resolution (and what it reverses) |
| --- | --- |
| Builder → guided wizard, not an editor | §6.3 rebuilt as a four-step question-led wizard (Steps · Order · Plans · Timing) plus a conditional experience tail (Experience → Branding → Videos? → Review videos), one decision per screen, per-step detail behind a tap. The wizard runs full-width with NO live-preview rail; the preview belongs to the post-Finish editor. Reverses the v1.1–1.6 persistent split-view editor. |
| Per-plan from GHL features | "Different by plan" auto-selects each plan's steps from its enabled GHL features (Pilot drops phone/A2P/custom-domain → ~10 steps), inheriting the shared order. Partially resolves Q2. |
| Doer is not a dashboard | §7.3–7.4 stripped to ONE action: current-step card + a single "Step N of 15 · what's left ›" footer. (Note: v1.8 partially restored a consumer-grade progress signal — see below.) Aggregate metrics are operator-surface-only. Each state shows ≤1 primary button. Reverses the v1.3 doer progress-header/up-next spec. |
| Per-step timing removed everywhere agency-facing | Cut from BOTH the step customizer panel and the dashboard. Expected duration is a silent engine value (may self-tune from medians) used only for stall detection — never shown or edited. Reverses the v1.2 "editable on click" step timing. |
| Calibration strip cut → bottleneck table | §8.4 evidence collapses to "where clients get stuck": Step · Made it here · Stuck now, sorted by stuck-count, one auto "most clients get stuck here" callout, no day numbers or threshold controls. Reverses the v1.2 expectation-calibration strip. |
| Population-first dashboard | §8.1 leads with three plain population cards (Onboarded / Onboarding now / Not started) before the queue — the count question before the triage question. Reverses the v1.1 activation-rate metric band as the lead. Founder-driven. **(Superseded by v1.12: the triage axis becomes the lead, the lifecycle census is demoted — see §11.1k.)** |
| Trigger Workflow = chosen, not auto-fire | §8.3 queue action opens a workflow picker (client's real GHL workflows, smart-defaulted by stuck step) with a named receipt + undo; nothing fires until chosen. Preserves diagnosis-not-prescription. "Nudge" removed from all operator surfaces. |
| Custom step completion via webhook | §6.4c adds `inbound_webhook` as a completion method (unique URL + GHL Webhook-action recipe) — the unlock for unlimited custom steps beyond the catalog. New detector type (§13). |
| Widget config: one source, multiple doors | Experience mode, brand color, placement, and per-step video configured in the wizard tail; a quick-edit surface reads/writes the SAME journey fields (no fork). Brand color pre-filled from the agency's HighLevel brand color. (Superseded — see the v1.8 "Customize relocated to the action row" and v1.9 placement entries: an Appearance drawer opened from the journey action row, with placement in both the wizard step and the drawer.) |
| Template vs instance (editor) | §6.3c: editor rows show template truth only; client-progress states (verified/marked-done/stuck) appear only in the preview and per-client timeline. Plan context is one quiet "Editing: All plans ▾" line, not a tab bar. |
| Milestone clause on the two-clock rule | §8.4b: the evidence table speaks in journey-clock milestones ("usually done by Day 5" — founder language); individual stalls keep step-clock duration ("Stuck 12 days"). Red day numbers always carry their denominator. |
| Doer dev tooling stabilized | `/doer-demo`'s multi-control dev strip (with dead buttons) replaced by a single Scenario dropdown driving the DoerPanel state-machine API. Dev-only scaffolding; no product-spec impact, logged for completeness. |

### 11.1g v1.8 — the non-blocking model & the simplification arc, continued

v1.8 is an architectural bump, not a polish pass: its headline introduces a new behavioral model for how the doer sequences work. The remainder absorbs an accumulated run of UI/layout decisions (the C–L prototype series) that brought the live build ahead of the v1.7 spec. Several entries nuance or reverse v1.7 — noted inline.

| Decision | Resolution (and what it reverses / nuances) |
| --- | --- |
| Non-blocking async model (HEADLINE) | §7.3/§7.4/§5.1/§12.1 rewritten: async steps (A2P, DNS) are background jobs with a pending/verifying state, NOT gates. `verifying` never blocks an independent sibling; "locked" propagates only from genuine hard dependencies (campaign←brand←phone, funnel←domain), never from sequence position. "Current step" = next ACTIONABLE step, so a client whose A2P is verifying is advanced through the ~11 of 15 independent steps in parallel. Research-grounded: "dashboard of pending tasks," Uber/Airbnb defer-blocking-until-needed, recoverable partial failure. Reverses the implicit linear-sequence model of all prior versions. |
| Rejection & recovery flow | §7.4/§12.1: a `verifying`→`needs_attention` failure flips ONLY that step and re-prioritizes it ("One thing needs your attention"); all other completed progress is preserved; only genuinely-dependent downstream stays locked; re-submission returns to `verifying`. The stateful back-and-forth the carrier flow demands, without journey resets. |
| Consumer progress restored on the doer | §7.3/§7.4b: the client header regains a thin progress bar + "X of Y done" + a collapsible "Done (N) ✓" list (the Loom/Revolut encouragement pattern). Still NO percentage, journey-day, or time-vs-expected (those stay operator-only). NUANCES the v1.7 "doer shows zero progress" rule — v1.7 over-corrected; the distinction is encouragement ("3 of 8") vs grade ("73% · Day 5"). |
| Sticky wizard footer | §6.3b: a persistent footer (Back · Skip to fine-tune · Next/Finish) is pinned on every wizard step, so the CTA is never below the fold on long steps (grouped step list, video review). |
| Placement promoted to a wizard step | §6.3b adds Placement as Guided-only step 6 (Floating / Banner / Menu, with mini-diagrams), peer to Branding and Videos. Also remains in the Appearance drawer (same field). REVERSES the v1.7 "placement is drawer/popover-only" note — placement is a genuine first-time setup decision for a GHL agency. |
| Customize relocated to the journey action row | §6.6/§6.3c: "Customize" moves OUT of the cramped preview-pane header INTO the journey-level action row (beside Redo setup · Preview · Publish) and opens a right-side Appearance drawer (brand color + placement). The preview header is now just label + state switcher. The structural fix after several failed attempts to style it inside the preview header — the lesson: when restyling repeatedly fails, the element is in the wrong container. |
| Dashboard: cards as navigation | §8.1: the three population cards become clickable filters into a SINGLE client table region (default view "Needs help today" = the stuck slice), not three competing lists. Progressive disclosure — scan three numbers, click one, work the list. **(Superseded by v1.12: triage tiles, not lifecycle cards, are the navigation — see §11.1k.)** |
| Dashboard: verdict as a band, bottleneck merged | §8.2: the verdict shrinks from hero to a half-height band; the single biggest secondary bottleneck merges into it as one "Also slowing clients: {step}" line; the standalone bottleneck strip is folded away, full table on demand. |
| Dashboard: consistent row actions | §8.3: every queue row ends with `[primary button][⋯ overflow]` in a fixed position; primary always visible (not hover-revealed, for non-technical/touch operators); label owner-aware (client-blocked→Trigger workflow, agency-blocked→Assign). |
| Dashboard: pending ≠ stuck | §8.3: clients inside a normal carrier/DNS review window show a calm "Waiting on carrier · day 2 of ~3" status and stay OUT of "Needs help today." A step becomes stuck (and enters the queue) only past the expected external wait, or when the client is blocked on their own action. Keeps the queue an honest intervention list. |
| Dashboard: "See where everyone's stuck" | §8.4: the full step table is relabeled from "Show step table" and relocated beside the bottleneck line; layout rhythm tightened (≈32px between regions; header zone above the cards de-padded; win note folded into the Onboarded card). |

### 11.1h v1.9 — deployment & the time-vs-milestone correction (Ivory feedback)

v1.9 absorbs the onboarding-relevant feedback from the Ivory success session (a ~900 sub-account design partner). The activation rule engine, lifecycle-stage model, intervention tracking, and health-trend work she also raised are deliberately out of scope here — they belong to the Account Health / lifecycle layer, not this setup-completion PRD; only the deployment and anti-prescriptive-time points land below.

| Decision | Resolution |
| --- | --- |
| Embed / Launchpad as first-class placement | §6.3b/§6.6: placement gains a fourth option — an Embedded page / "your own Launchpad" (a native in-menu checklist screen), alongside Floating / Banner / Menu. Rationale: most GHL agencies already run a support widget (Intercom et al.), so a floating GoCSM widget collides with it — a real adoption blocker. The partner declined the floating widget, then agreed to show clients the checklist once banner/embed options were shown. |
| Top banner is the new default | §6.3b/§6.6: default placement flips from Floating to Top banner — persistent visibility without occupying the widget corner, and (being detection-tied) it can re-surface for an existing client who later disconnects something, doubling as a health prompt. Floating remains available, no longer default. |
| Duration is measured, not prescribed | §8.1: the velocity proof line reports observed average-time-to-onboard and its trend ("Avg 23 days · down from 28 last quarter") rather than a prescribed "~30 days." The per-account target Day N persists only as the stall reference for the queue — a benchmark to collapse, never a promise the client is failing. |
| Onboarding completion is milestone-gated, not time-gated | §12.3: a step completes only on its detector signal (or manual/agency confirm), never because time passed; the journey graduates only when the checklist is actually complete. A client may stay in onboarding for months if they never finish — elapsed time only marks them stuck for the queue. Kills the false-positive where a stalled account looks like it's progressing because the calendar moved. |
| Onboarding ≠ activation (handoff note) | §8.1: an explicit boundary line — finishing setup means "set up," not "activated" (real emails/forms/appointments flowing). Activation, lifecycle stages, and their milestone rules live in the health/lifecycle layer; "high setup, zero activity" is a health signal, out of scope here. |

### 11.1i v1.10 — cleanup pass (stale-decision purge + dashboard sync)

A full CPO review against the conversation record: removing decisions we reversed but never deleted, syncing prototype work that outran the spec (the N/P/Q/R dashboard series), and compressing the oldest decision-log rows. No new product decisions — this pass makes the document match what was already built and agreed.

| Cleanup | What changed |
| --- | --- |
| Verdict: evidence + table merged (N-series) | §8.2: the separate "show the evidence" toggle and "See where everyone's stuck" link collapse into ONE "Where clients get stuck ▾" expander whose top row is the verdict's step; "Confirmed" is restyled as a passive tag, not a clickable peer. |
| Queue rows: diagnosis-first, one clock (Q-series) | §8.3: rows re-ranked to name → step+reason (the anchor) → quiet MRR/blocked-by → a SINGLE "Stuck N days" token → actions. The old "Day 38 of 14" row token and the duplicate "no movement since" line are removed (they live in the timeline drawer). Reason lines compressed to one plain clause; technical detail moves behind the row. |
| Queue: group-by-reason (P-series) | §8.3: a reason-summary with counts as filter chips atop the queue, so same-cause clients can be handled together; the plain-language failure reason now renders as a row sub-line. |
| "Waiting on review" made subordinate (R-series) | §8.3: pending lives BELOW the queue as a muted, collapsed-by-default strip (expandable), visibly calmer than action rows — separating "needs me" from "in flight, monitor" by visual weight, not just logic. |
| Phasing deliverables corrected | §10: P1 no longer lists "split-view client preview" (reversed by the full-width wizard); P3 no longer lists "SLA calibration strip" (cut in §8.4). They now name the shipped surfaces. |
| Decision-log contradiction removed | §11.1f: the v1.7 "Customize popover / placement stays a popover" row reworded to note its supersession, so it no longer contradicts the v1.8/v1.9 "Appearance drawer in the action row" entries. |
| Clock rule reconciled | §8.4b: clarified that BOTH clocks are operator-surface only — the client doer carries no journey-day, only the consumer progress signal (§7.3) — and that "Day N of 14" no longer appears as a per-row token. |
| Early decision log compressed | §11.1 / §11.1b: the longest, most-superseded rows tightened and pointed forward, trimming bloat while preserving the reversal trail. |

### 11.1j v1.11 — the client navigation model & dashboard interaction sync

Syncs the client-surface interaction work (the U/V/X/Y prototype series) and the dashboard interaction refinements (W-series) that outran the spec after v1.10. No new product decisions — this records what was built and validated in the prototype.

| Decision | What changed |
| --- | --- |
| Doer is a map, not a track (U-series) | §7.4c: the client can act on any available step in any order; the hero is a suggestion, not a gate; every available step is tappable and behaves like the hero when opened; completion is position-independent (a step done out of order — even directly in HL — moves to Done with a checkmark, never blocked by list position). |
| Locked narrowed to the carrier chain (V-series) | §7.4c, §5.1: the broad LOCKED group is removed. Only A2P campaign ← A2P brand ← phone gates availability; funnel ← custom domain is soft (publishes on the system domain) and does not lock; all other steps are always available. The punitive "LOCKED" framing is replaced by a calm "Available once your text-messaging registration is approved — we'll open this automatically," the quietest item in the list, auto-opening on prerequisite completion. |
| Focused default + progressive disclosure (X-series) | §7.3: the expanded panel shows a collapsed "Done (N) ✓" group on TOP (wins first, for momentum) → the current-step hero → a collapsed "More steps (N)" group → the waiting strip — one action by default, not a flat fifteen. Tapping a step expands it IN PLACE (accordion); it never jumps to the top (position encodes order). Empty groups hidden. |
| One card, different anchor (Y-series) | §7.3: there is one checklist card; placement changes only its anchor/trigger. Floating, Top banner, and Menu link all render the same compact, content-sized popover overlaying HL (sized to content, capped max-height with internal scroll, header pinned) — NOT a full-height side pane. Embedded page · Launchpad is the sole exception (a full in-page mount). Matches the Intercom-style corner card clients already recognize. |
| Queue row → timeline; contextual overflow (W-series) | §8.3: clicking a queue row opens that client's timeline drawer (the list→detail gesture); the ⋯ overflow is contextual, not a fixed list — "Assign to teammate" + "Open in HighLevel" by default, a scheduling action only on a kickoff-call row. "View timeline" leaves the overflow (row click replaces it); the generic "Open calendar" is removed. |
| Dated timeline markers (W-series) | §8.5: timeline steps and intervention markers show BOTH the relative Day N and the actual calendar date ("Done · Day 5 · May 1"), so a CSM can anchor and search back — a direct Ivory request; the date is a quiet secondary. |

### 11.1k v1.12 — two design-loop redesigns: the Builder wizard + the Overview "tracker" (30 June 2026)

Two design-loop runs on the same day, both validated against the non-technical, easily-overwhelmed agency-owner persona and the full multi-persona review panel: **(A) the Journey Builder (§6)** — the old 9-step `JourneyBuilder` rebuilt as the template-first, two-pane `SetupWizard`; and **(B) the Overview / Dashboard (§8)** — rebuilt around triage. The **Doer (§7) is untouched** (reused as the wizard's live client preview). Both re-compose existing primitives — not rewrites. This is the **finalized spec going into development**. Mirrors the top-of-document "Changes made on 30 June 2026" section.

**A — Builder wizard (§6)**

| Decision | Resolution (and what it reverses / nuances) |
| --- | --- |
| SetupWizard replaces the 9-step builder (HEADLINE) | §6.3d: the old 9-step `JourneyBuilder` + gated per-step editor → the **`SetupWizard`** — template-first, **six steps** (Template · Steps · Order · Experience · Look & feel · Review), one decision per page, smart defaults. `SimpleSetup` deleted; old builder un-routed. Philosophy: simplify via defaults, restore full power as progressive depth. |
| Two-pane, persistent live preview | §6.3d: a live client preview is pinned right (count suppressed). **Reverses the v1.7 "full-width wizard, NO live-preview rail / preview only post-Finish" decision.** |
| Auto-verify locked for catalog steps (the wedge) | §6.4c: out-of-the-box steps are always GoCSM-auto-verified, no picker; the 4-way picker (auto / client-confirms / web-event / for-reference) shows only for custom steps. "Auto-verified" badge on every row; exceptions pop; the USP is positioned in the Step-2 header. |
| Progressive-depth Customize | §6.3c/§6.3d: per-step inline Customize (title · client copy · completion method · video · per-asset sub-steps) restores agency power without a dense canvas. |
| Asset steps: any/specific, snapshot-driven | §6.4b: workflows/funnels/forms/pipelines default to "any"; "specific" = remembered snapshot sub-account + one named asset via searchable select; re-addable. |
| Order via arrows, not drag | §6.3d: dependency-guarded up/down arrows. Reverses the v1.7 draggable order list (a11y/novice safety). |
| Look & feel; returning user → summary | §6.6/§6.3d: visual placement mockups + auto-detected brand colour ("Pulled from your brand"); returning agency lands on `JourneySummary` (Edit-jumps + advanced-editor escape). Publish-then-refine replaces the blocking jargon gate on the happy path. |

**B — Overview "tracker" (§8)**

| Decision | Resolution (and what it reverses / nuances) |
| --- | --- |
| Triage axis is the lead (HEADLINE) | §8.1: the **triage strip** — 🔴 Needs you · ⏳ Waiting on review · ✅ On pace — becomes the primary orientation, each tile filtering the surface below. REVERSES the v1.7 "population-first lifecycle cards as the lead" and NUANCES the v1.8 "cards as navigation": the navigation axis is now triage (who needs me), and the lifecycle census (Onboarded / Onboarding now / Not started) is demoted into the full account list's pills. No 4th counter row; only "Needs you" is saturated. |
| Verdict is dollar-led | §8.2: the verdict headline names the dominant bottleneck AND the `$/mo` behind it ("…that's where most of your onboarding pain is. $X/mo is behind it."). Attribution is "GoCSM Analysis"; the trust stamp compresses to "Numbers exact · wording is AI." |
| Agency-bottleneck verdict is data-derived | §8.2: the "waiting on your team" verdict is computed from the actual `blocked_by === "agency"` set, never a hardcoded line — headline, CTA, and queue can never disagree. (Phase-4 fix: removed a false hardcoded "5 clients / kickoff call" line.) |
| Money-ranked queue is the hero | §8.3: the "Needs help today" queue, sorted by `mrr × days_on_current_step`, is the focal surface directly under the strip; money is the sort key shown as a quiet Mono `$/mo` eyebrow, never a wide ARR column. Confirms/relabels the v1.10 diagnosis-first row. |
| Reversible-action receipt with undo | §8.3: the primary row action fires the `ActionReceipt` primitive (scope + blast-radius + grace countdown + Undo) — the Reversible Action contract made tangible; the receipt persists as intervention memory. |
| All-clear reward state | §8.6: when Needs-you = 0, a designed calm payoff ("You're all caught up…") replaces a blank table; copy adapts to "Nothing needs you yet" for sparse week-1 accounts. No competing CTA. |
| Relief strip framing | §8.3: the pending (carrier/DNS) set is the "Waiting on others — nothing for you" relief lane — collapsed, counted not enumerated, framed as relief. (Refines the v1.10 R-series subordinate strip.) |
| One visible AI surface | §8.2: only the Verdict is AI-marked; the queue ranking is arithmetic and not labeled AI; no Ask box / recommended-action menu / generated prose / trend paragraph. The `ConfTag` confidence indicator is replaced by a plain data-sourcing transparency label. |
| One velocity number, never a chart | §8.1: a single proof line ("X finished this week · avg N days · {delta} vs prior"), green/red arrow; a regression renders calm-neutral, not alarm-amber. No naked numbers anywhere — every number carries a target / trend / `$`. |
| Phase-4 craft fixes | `StatusCard` per-side borders (kills the border/borderLeft React warning on triage-tile clicks); sparse-aware all-clear copy; calm-neutral regression styling. `tsc` clean; `bun run build` green. |

### 11.2 Still open

| # | Question | Owner |
| --- | --- | --- |
| 1 | RESOLVED in v1.4 — kickoff is a client-booked, auto-detected step (see §11.1c). Remaining sub-question: which calendar embeds to support at launch (GHL native first; Calendly fast-follow?) | Karthik / Sinan |
| 2 | PARTIALLY RESOLVED in v1.7 — per-plan variants are auto-derived from each plan's enabled GHL features in the wizard (see §11.1f); full multi-journey editing UI is still deferred. If multi-journey ships, the Journey tab gains a switcher, not a list page. | Karthik |
| 3 | Video hosting — the GoCSM white-label tutorial library is now a confirmed first-class asset (per-step default with override, watch-then-choose review). Reuse GoCSM Academy infra, or a dedicated white-label player with view-% telemetry? | Abhinav / Jose |
| 4 | Detector polling cadence vs. webhook-driven — feasibility within HL rate limits, isolated from the health engine path; plus retroactive backfill scan on publish (§8.6) and the new `inbound_webhook` endpoint (§6.4c, §13). v1.8 adds: the engine must track per-step dependency state (so `locked` propagates only from genuine prerequisites) and a per-step external-wait expiry that flips pending→stuck (e.g. A2P > 5 days) for the queue — confirm where these thresholds live and whether they self-tune. | Abhinav |
| 5 | Paste-import quality bar — what mapping accuracy flips the P1 flag? (Confidence-tagged drafts mitigate, but a bad first map poisons the wedge moment.) | Karthik / Abhinav |
| 6 | NEW (v1.9, Ivory): the activation layer this PRD hands off to — a no-code rule engine over real business events (emails sent / forms submitted / appointments booked; partner's threshold ≈ 6 events), milestone-gated lifecycle stages (not time-based), and intervention tracking + save-rate + health-trend overlay. Scoped to a separate Account Health / lifecycle PRD, NOT this one. Owner to confirm whether MCP feature-metrics already expose the three events natively for a fast read-only surface ahead of the rule engine. | Karthik / Tim |

---

## 12. Step-State Playbook (v1.5)

This section defines, for every step in the v1 catalog, exactly what constitutes each state — the entry conditions, the detector signal, the exhaustive failure scenarios, and the copy shown to each audience. Grounded in HighLevel's own support documentation and carrier/OAuth failure research (June 2026). This is the contract Jose builds the doer against and Abhinav builds detectors against; the copy strings are shippable, not placeholders.

### 12.1 The universal state grammar

Generic states behave identically on every step and are defined once here. Per-step specs (§12.4) define only what varies: the start signal, the completion signal, verification semantics, and the failure catalog.

| State | Entry condition | Client sees (doer) | Agency sees (dashboard) |
| --- | --- | --- | --- |
| `not_started` | Step unlocked; no qualifying activity detected. | Quiet row in the list / Up Next. No copy pressure. | Grey dot; counts toward remaining. |
| `locked` | An intrinsic type requirement is unmet (only campaign←brand←phone). | Lock icon + "Unlocks when {requirement} is approved" — protective, not punitive. | Lock + requirement name; excluded from stall math. |
| `in_progress` | First qualifying activity detected (hard signal, per step below). "Take me there" clicks are soft signals: logged, never state-changing. | Current-step card: title, why-it-matters line, Take me there, Show me how. | Blue dot + days on this step. |
| `verifying` (Tier B) | Submission detected; an external review (carrier, DNS, Google) is pending. | "We're checking this — usually {X}. You can keep going." + "Meanwhile, let's set up {next actionable step} →" + "I've completed this" stays available. No client-facing day counter. | Amber "verifying · day {n}"; stays OUT of the action queue while inside the normal review window. |
| `waiting_on_agency` | Step owner = agency (custom agency steps only, post-v1.4). | Calm: "{Agency} is on it — nothing needed from you." | "Blocked · your team" + Assign + Open calendar; feeds the Waiting-on-you card. |
| `needs_attention` | Detector observed an explicit failure or rejection (per-step catalog below). | Plain-language reason + ONE concrete fix + deep link + "This doesn't match what I see" dispute. | Factual reason code + intervention actions (Trigger workflow / Assign). |
| `done` | Completion signal observed (`completionSource: auto` → affix "Verified") or human-marked (manual → "Marked done"; `agency_verified` → "Confirmed by your team"). | Check + moves to the done group. | Progress advances; duration recorded for calibration. |
| `skipped` | Agency marks the step not-applicable for this client (timeline drawer). | Hidden entirely — a client never sees a struck-through obligation. | Struck-through in the timeline; excluded from % and stall math. |
| `stalled` (computed) | `days_on_step > expected AND state ∉ {done, skipped, locked}`. A lens, not a stored state. | NEVER shown. No "overdue", no red, no shame mechanics on the client surface. | Queue row + verdict input + trigger eligibility. |

> **THE NON-BLOCKING PARALLELISM RULE (V1.8)**
> `verifying` never blocks a sibling. A step in `verifying` suspends only steps that physically depend on its result; every independent step stays actionable. "locked" is therefore a dependency state, not a sequence state — it is entered iff a specific required upstream result is absent (the only hard chains: campaign←brand←phone, funnel-live←domain), never merely because an earlier-numbered step is unfinished.
> "Current step" = next actionable step. The doer always surfaces the next step the client can actually act on — skipping over anything in `verifying` or `locked` — so a client is never parked on a waiting screen while independent work remains.
> Rejection reopens only the affected step. A `verifying` → `needs_attention` transition flips that one step and re-prioritizes it; all other completed steps keep their state, and only genuinely-dependent downstream steps stay locked. Re-submission returns the step to `verifying`. Recoverable partial failure, never a journey reset.

### 12.2 Copy voice rules (both audiences)

- **Client voice:** second person, plain words, zero jargon ("text messaging" never "A2P/10DLC" in a headline — the technical term may appear once in parentheses for searchability). Every failure message = what happened + why it matters to their business + exactly one next action + where (deep link). Never blame ("There's a problem with the registration", never "You entered the wrong EIN"). Never show internal codes alone.
- **Agency voice:** factual, numbers-first, names the blocker and the owner. Reason codes welcome. Every `needs_attention` row carries the same fix the client was given, so a CSM picking up the phone already knows the script.
- **Honesty rule:** if GoCSM cannot detect something (e.g. placeholder content inside a published funnel), the spec says so — we never imply verification we don't perform.

### 12.3 Edge scenarios that apply to every step

| Scenario | Behavior & copy |
| --- | --- |
| Client claims done, detector silent | "I've completed this" opens the dispute flow: "Tell us what you're seeing — we'll loop in {Agency} and pause this check while we look." Step → `waiting_on_agency`-like hold; agency gets a confirm/explain task; agency confirm writes `done` (`agency_verified`). |
| Work done in the wrong sub-account | Detector stays silent (signals are per-location). Resolves through the dispute flow above; agency copy in the task: "No {signal} found in this account — check whether the work landed in another location." |
| Regression after done (asset deactivated, integration disconnected) | Onboarding `done` STANDS — the journey records that setup was completed; later regressions are adoption/health signals and route to the Account Health engine, not back into onboarding. One exception: kickoff-call cancellation before the call (§12.4, step 15). |
| Snapshot pre-completes a step | If the snapshot ships the asset (e.g. a pipeline), the step auto-verifies at journey start. Correct behavior, not a bug: the client sees an instant early win; agencies who want client customization should use a named-asset or custom step instead. |
| Tier-B verification exceeds its window | `verifying` past expected → `stalled` lens for the agency (queue: "verifying 5d — usually 3d"); the client card stays calm but updates the day counter honestly. No client-side alarm for slow external reviewers. |
| Time elapses without completion (v1.9) | Nothing about completion changes — a step completes ONLY on its detector signal (or manual/agency confirm), never because days passed, and the journey graduates ONLY when the checklist is actually complete. A client may remain in onboarding for weeks or months if they never finish; elapsed time only marks the account stuck for the operator queue. The "target Day N" is a stall reference and a benchmark to improve, never an auto-advance. (Milestone-gated, not time-gated — Ivory.) |

### 12.4 Per-step specifications

Format per step: detector signal · start signal · completion signal · exhaustive failure catalog with both copy tracks. Expected times are the system defaults (§6.4), shown for context.

#### Step 01 — Purchase phone number

Detector · Phone number object provisioned on the location (LC Phone). Starts · Number search / checkout begun in Settings → Phone Numbers. Expected · ~1 day (Tier A). **Completes (`done`):** A number exists on the sub-account. Auto-verified the moment it appears.

| Failure / edge scenario | Client sees | Agency sees |
| --- | --- | --- |
| Payment fails (card declined / wallet empty / no billing method on the sub-account) | "The number couldn't be purchased — the payment method on this account needs attention. Add or update a card, then try again." → Billing | "Purchase blocked · payment method" — if the agency rebills (SaaS mode), this is usually the AGENCY's wallet: surfaced as Blocked · your team. |
| Desired area code has no inventory | "No numbers available for that area code right now. Try a nearby area code — your customers will still recognize a local number." | "No inventory for requested area code · client searching" (soft, `in_progress` retained). |
| Regulatory requirement (address / bundle for certain regions) | "This region asks for a verified business address before a number can be issued. Add it on the purchase screen and the number will go through." | "Blocked · regulatory address required ({region})". |

Note: If the snapshot or agency pre-purchases the number, this step auto-verifies on day one — an intended early win.

#### Step 02 — Register your business for text messaging (A2P brand)

Detector · TCR brand status from the Trust Center: submitted / verifying / approved / rejected (+ reason code). Starts · Registration form submitted → `verifying` immediately. Expected · ~3 days; carrier review typically 24–72h (Tier B). **Completes (`done`):** Brand status = approved. Auto-verified. (HL auto-registers any later numbers under the approved brand — no client action.)

| Failure / edge scenario | Client sees | Agency sees |
| --- | --- | --- |
| EIN / legal-name mismatch — the largest rejection class: missing "LLC", transposed EIN digit, outdated address vs IRS records | "There's a problem with the registration: the business name doesn't match your EIN record. Enter your legal name EXACTLY as it appears on your IRS letter (CP-575) — including 'LLC' if it's there — and upload the CP-575 to remove the guesswork." → Trust Center | "Rejected · EIN/name mismatch" + the same fix; note: CP-575 upload materially raises first-time approval. |
| EIN issued <15 days ago (TCR rejects new EINs) | "Your tax ID is too new for the carriers' registry — it usually needs a couple of weeks to appear. We'll remind you to resubmit; nothing else is wrong." | "Rejected · newly issued EIN — retry after registry sync (or $10 manual appeal with full CP-575 PDF; 30–90d window applies in some cases)." |
| Website invalid / unverifiable (site down, no real business content, name not connectable, missing Terms & Privacy in footer) | "Carriers couldn't verify your website. Make sure it's live, describes what your business does, and links Terms of Service and Privacy Policy in the footer — then resubmit." | "Rejected · unverifiable website" — common when the site is a bare landing page; agency often owns the fix (their build). |
| PO Box used as the business address | "Carriers don't accept PO Boxes. Use your registered street address and resubmit." | "Rejected · PO Box address." |
| Stock ticker mismatch (public companies) | "The stock ticker provided doesn't match the brand details — correct one or the other and resubmit." | "Rejected · ticker mismatch." |
| Nonprofit / government entity unverifiable | "Your organization type couldn't be verified automatically. Update the entity type, or submit documents for manual verification." | "Rejected · entity-type verification — manual docs path available." |
| DUNS supplied instead of EIN (US) / wrong tax-ID format abroad | "US registration needs your EIN (not DUNS). Outside the US, use your national tax ID — e.g. BN9 in Canada, Company Number in the UK." | "Unverified · wrong ID format" — blocks all downstream A2P; high-priority fix. |

Note: If the business has no EIN at all: the Sole-Proprietor path or Toll-Free numbers are the alternatives — agency-level guidance, surfaced in the agency copy, never as client homework.

#### Step 03 — Text-messaging campaign approval (A2P campaign)

Detector · Campaign status from the Trust Center (+ HL's structured rejection codes via the "View required fixes" data). Starts · Locked until brand approved; submission → `verifying`. Expected · ~5 days (Tier B). **Completes (`done`):** Campaign status = approved. Auto-verified. Numbers added later attach automatically.

| Failure / edge scenario | Client sees | Agency sees |
| --- | --- | --- |
| Rejected · "inconsistency" (brand vs website mismatch; samples imply a different use case; free/unbranded email used in registration) | "The review found an inconsistency between your registration and your website or sample messages. Open the required fixes — each issue lists exactly what to correct — then resubmit." → Trust Center → View required fixes | "Rejected · inconsistency ({code})" — HL's fix modal gives error code / category / meaning / correction per reason; multiple reasons possible, all must be fixed before resubmit. |
| Missing opt-in evidence / unclear consent flow | "Carriers need to see HOW people agree to get your texts. Add your opt-in (e.g. the form checkbox with consent wording) to the campaign details and resubmit." | "Rejected · opt-in evidence" — agencies should keep a screenshot of the form consent block on file; it resolves this class instantly. |
| Sample messages missing opt-out language or sender identity | "At least one sample message must name your business and include opt-out wording ('Reply STOP to opt out'). Update the samples and resubmit." | "Rejected · sample content." |
| Placeholders left in ([company name]) or HL demo numbers in opt-in flows | "The samples still contain placeholder text. Replace [company name] with your actual business name and resubmit." | "Rejected · placeholder content" — almost always a snapshot template the agency forgot to personalize: agency-owned fix. |
| Forbidden category (cannabis, debt relief, third-party lead-gen / bought lists, high-risk financial) — NOT resubmittable | "Carriers don't allow text marketing for this business category — this isn't something a resubmission can fix. {Agency} will reach out about what IS possible (calls, email, and in some cases toll-free messaging)." | "Rejected · forbidden category — TERMINAL, do not resubmit." Step should be agency-skipped; queue prompts the conversation. Honest dead-end handling is a trust moment. |

#### Step 04 — Set up your email sending domain

Detector · Dedicated-domain verification status (CNAME/DKIM/SPF records verified by HL). Starts · Subdomain added in Settings → Email Services. Expected · ~2 days; DNS propagation up to 24–48h (Tier B). **Completes (`done`):** Domain verified. Auto-verified. (Why it matters — used in the client card: without it, emails send via `mg.msgsndr.com` instead of the client's own address.)

| Failure / edge scenario | Client sees | Agency sees |
| --- | --- | --- |
| Existing MX/SPF records on the chosen subdomain (must be removed first — even old HL ones) | "That subdomain already has mail records attached. Remove the existing MX/SPF entries at your domain host (or pick a fresh subdomain like 'mail.yourdomain.com'), then verify again." → Email Services | "Verification failed · conflicting MX/SPF on subdomain" + mxtoolbox lookup link. |
| Multiple DKIM records on the same domain (unsupported) | "Your domain has more than one DKIM record, which mail systems can't resolve. Remove the extra DKIM entry at your host, then verify." | "Verification failed · duplicate DKIM." |
| Wildcard DNS record conflicts with verification | "A wildcard (*) record at your host is masking the new entries. Temporarily remove the wildcard, verify here, then add it back." | "Verification failed · wildcard DNS conflict" — the remove-verify-restore sequence resolves it. |
| Typos in manually added records | "One of the records doesn't match what we provided — usually a stray space or missing character. Compare each value side by side and correct it, then verify." | "Verification failed · record mismatch" + per-record pass/fail if available. |
| Propagation stuck past 48h with correct records | "Everything looks right on your side — some hosts just take longer. We've asked for a manual re-check; if it's still pending tomorrow, your domain host can usually clear it." | "verifying 3d — usually 2d" + force-verify action; escalation note: hosting-provider-side issue. |
| Root domain used instead of a unique subdomain | "Use a dedicated subdomain (like mail.yourdomain.com) rather than your main domain — it keeps your website's mail untouched and verifies cleanly." | "Setup guidance · root domain chosen" (pre-failure nudge, not a rejection). |

#### Step 05 — Complete your business profile

Detector · Required field set present on the location: legal/display name, address, phone, email, website, timezone. Starts · Any profile field edited. Expected · ~1 day (Tier A). **Completes (`done`):** All required fields present. Auto-verified. Partial completion holds `in_progress` (the card lists exactly which fields remain: "2 to go: website, timezone").

| Failure / edge scenario | Client sees | Agency sees |
| --- | --- | --- |
| Timezone left on a wrong default | No failure — quality nudge inside the card: "Double-check the timezone — it controls when your automated messages go out." | No flag; mis-set timezone surfaces later as odd automation timing — cheap to prevent here. |
| Website URL malformed / unreachable | "That website address doesn't resolve — check for a typo (it also needs to be live for your text-messaging registration in a later step)." | "Profile · website unreachable" — cross-step note: this same URL feeds A2P brand review (step 02 failure class). |

Note: This step's data quality silently determines step 02's success — the client copy plants that connection early.

#### Step 06 — Activate your workflows

Detector · Per-asset: workflow status = active, matched by entity ID for each named asset (v1.4 multi-select). Empty asset list = any workflow activation. Starts · First named asset activated → `in_progress` with sub-checklist ("1 of 3 activated"). Expected · ~2 days (Tier B in seed). **Completes (`done`):** ALL named assets active (or any activation when unconfigured). Auto-verified.

| Failure / edge scenario | Client sees | Agency sees |
| --- | --- | --- |
| Named workflow deleted or renamed in the sub-account (entity unmatchable) | Generic, never accusatory: "One of the workflows from your setup package can't be found — {Agency} is checking on it." (auto-notifies agency) | "Asset not found · 'Missed-call text-back' — deleted or renamed in the location. Re-link or update the journey's asset list." |
| Workflow activated but its channel prerequisite is missing (e.g. SMS actions before a number exists) | "Activated — one heads-up: this workflow sends texts, which start working once your phone number step is done." | "Active w/ unmet channel dependency (SMS · no number)" — informational; prevents the 'automation is broken' support ticket. |
| Activated, then deactivated later | Nothing — `done` stands (§12.3 regression rule); adoption engine picks it up. | Health/adoption signal, not an onboarding revert. |

#### Step 07 — Publish your website funnel

Detector · Funnel published state for each named funnel (entity ID). Empty list = any funnel publish. Starts · Funnel editor opened / first save on a named funnel. Expected · ~1 day (Tier A). **Completes (`done`):** All named funnels published. Auto-verified.

| Failure / edge scenario | Client sees | Agency sees |
| --- | --- | --- |
| Named funnel deleted/renamed | "The funnel from your setup package can't be found — {Agency} is checking on it." | "Asset not found · 'Main lead-gen funnel' — re-link or update the asset list." |
| Published on the default system domain while the custom-domain step is already done | Quality nudge: "Live! One more polish: attach your own domain so visitors see yourbusiness.com." → funnel settings | Informational only. |
| Placeholder content still inside the published funnel | NOT DETECTED — honesty rule (§12.2): GoCSM verifies publication, not content quality. The spec says so explicitly rather than implying review. | — |

#### Step 08 — Connect your custom domain

Detector · Domain connected on the location + SSL certificate issued. Starts · Domain added in Settings → Domains → `verifying` while DNS/SSL resolve. Expected · ~2 days; DNS up to 48h (Tier B). v1.4 default order: precedes funnel publish. **Completes (`done`):** Domain resolves to HL and SSL is active. Auto-verified.

| Failure / edge scenario | Client sees | Agency sees |
| --- | --- | --- |
| A/CNAME record wrong or missing (typo, wrong host, record added at the registrar while DNS is hosted elsewhere) | "The domain isn't pointing here yet. Add the record exactly as shown — and make sure you're editing DNS where it's actually hosted (some domains manage DNS at a different provider than the registrar)." → Domains | "DNS · record missing/incorrect" + observed vs expected values. |
| Cloudflare proxy (orange-cloud) interfering with verification/SSL | "If you use Cloudflare: switch the record to 'DNS only' (grey cloud) until this connects — you can turn the proxy back on afterwards." | "DNS · proxied record suspected (Cloudflare)" — the most common GHL domain gotcha. |
| CAA record blocks SSL issuance | "Your domain has a security record (CAA) that's blocking the certificate. Add letsencrypt.org to the allowed issuers at your DNS host." | "SSL · CAA restriction." |
| Propagation slow (≤48h) with correct records | Stays `verifying`, calm: "Records look right — the internet is catching up. This can take up to a day or two; we'll flip it green automatically." | "verifying · day {n}"; no action until past expected. |
| Domain expired / registrar-locked | "The domain itself looks expired or locked at the registrar — renew or unlock it there first; everything here is ready and waiting." | "Blocked · domain expired/locked (registrar-side)." |

#### Step 09 — Create your calendar and connect Google/Outlook

Detector · Calendar object exists AND an external calendar OAuth connection is linked. Starts · Calendar created or OAuth begun. Expected · ~1 day (Tier A). **Completes (`done`):** Both signals present. Auto-verified. (Calendar exists but no sync = `in_progress` with the card naming the remaining half.)

| Failure / edge scenario | Client sees | Agency sees |
| --- | --- | --- |
| OAuth popup blocked — blank screen, no error | "If nothing opened when you clicked Connect, your browser blocked the sign-in window. Allow popups for this site and try again." | "Connect attempted · no token returned" — the silent popup-blocker signature. |
| Wrong Google/Microsoft account picked (multiple sessions) | "Connected — but to {account}. If that's not your business calendar, disconnect and choose the right account when the picker appears." | "Connected · account looks personal ({gmail.com})" — heuristic, informational. |
| Permissions partially declined during consent | "The connection went through but is missing a permission, so bookings may not sync. Reconnect and accept all the requested permissions." | "Connected · missing scopes — reconnect required." |
| Workspace admin policy blocks third-party apps | "Your Google Workspace admin has to allow this connection. Forward them the request — it's a one-time approval on their side." | "Blocked · Workspace admin consent required" — often multi-day: expectation note added. |
| Conflict calendar not selected (double-booking risk) | Quality nudge: "Pick which calendar we should check for conflicts — it's what prevents double-bookings." | Informational. |

#### Step 10 — Create your lead form

Detector · Form exists on the location (builder save). Starts · Form builder opened. Expected · ~1 day (Tier A). **Completes (`done`):** Form exists. Auto-verified.

| Failure / edge scenario | Client sees | Agency sees |
| --- | --- | --- |
| Form created but embedded nowhere | Quality nudge: "Form's ready — add it to a funnel page so it can start catching leads." | Informational; pairs with funnel step status. |
| Form deleted after creation | Nothing (regression rule). | Adoption signal. |

Note: If this form doubles as the SMS consent opt-in (step 03's evidence), the agency copy on step 03 already points back here.

#### Step 11 — Set up your sales pipeline

Detector · Pipeline exists with ≥1 stage. Starts · Pipeline editor opened. Expected · ~1 day (Tier A). **Completes (`done`):** Pipeline present. Auto-verified — and if the snapshot ships one, this completes instantly at journey start (§12.3): an intended early win, not a bug.

| Failure / edge scenario | Client sees | Agency sees |
| --- | --- | --- |
| Snapshot pipeline untouched and the agency expects customization | No failure state — if customization matters, the agency should model it as a custom "You confirm" step instead. The playbook is explicit so this never becomes a detector feature request. | — |

#### Step 12 — Connect Google Business Profile

Detector · GBP integration connected on the location AND sync healthy (no missing-permissions warning). Starts · OAuth begun from Settings → Integrations. Expected · ~1 day (Tier A; external verification can stretch it). **Completes (`done`):** Connected with healthy permissions. Auto-verified. (Service-area businesses with hidden addresses connect fine — explicitly not a failure.)

| Failure / edge scenario | Client sees | Agency sees |
| --- | --- | --- |
| GBP not verified with Google yet (postcard verification pending) | "Google has to verify your business listing first — usually a postcard code to your address. Once Google shows 'verified', come back and this connects in a minute." → business.google.com | "Blocked · GBP unverified (Google-side, can take days–weeks)" — external clock; expected window note. |
| Contributor-only access — the silent failure: appears connected, reviews don't sync | "Connected, but with limited access — reviews won't sync. Ask the listing's Owner to upgrade your role to Owner or Manager, then reconnect." | "Connected · degraded (insufficient GBP role)" — detector must check sync health, not just connection: this is the one that silently embarrasses everyone weeks later. |
| Missing-permissions warning after connect (consent partially denied) | "One permission is missing. Open the warning in Settings → Integrations → Google, review it, and hit Reconnect." | "Connected · missing permissions — reconnect path in Integrations." |
| Popup blocked / blank OAuth screen | Same popup copy as step 09. | "Connect attempted · no token." |
| Wrong Google account session active | "Make sure you pick the Google account that owns the business listing — if several accounts appear, the right one is usually the business email." | Informational. |

#### Step 13 — Connect Facebook / Instagram

Detector · Facebook integration connected (page-linked OAuth; one shared token also authorizes Social Planner). Starts · OAuth begun. Expected · ~1 day (Tier A). **Completes (`done`):** Facebook Page connected. Auto-verified.

| Failure / edge scenario | Client sees | Agency sees |
| --- | --- | --- |
| User isn't an Admin of the Facebook PAGE (personal profile ≠ page role) | "Connecting needs Admin access to your business's Facebook Page — not just a personal account. Ask whoever manages the Page to make you an Admin, then retry." | "Blocked · not Page Admin" — the dominant FB failure; often the agency historically owns the Page: ownership-transfer prompt. |
| Permission prompts partially declined during the FB consent flow | "The connection is missing permissions Facebook asked about. Reconnect and accept each prompt — declining any of them breaks posting or messaging." | "Connected · missing scopes." |
| Instagram won't attach (IG not a business account linked to the Page) | "Instagram connects through your Facebook Page — switch the IG account to a business account and link it to the Page in Meta settings first." | "IG unlinked · business-account prerequisite." |
| One-Page-per-location limit (tried to attach a second Page) | "Each account links one Facebook Page. To switch Pages, disconnect the current one first." | Informational. |
| FB checkpoint / 2FA challenge mid-flow | "Facebook paused the sign-in for a security check on their side — finish it in Facebook, then retry here." | "Connect interrupted · FB checkpoint." |

#### Step 14 — Connect payments (Stripe)

Detector · Stripe connected on the location AND charges capability enabled. Starts · Stripe OAuth begun from Payments → Integrations. Expected · ~1 day (Tier A). **Completes (`done`):** Connected with charges enabled. Auto-verified.

| Failure / edge scenario | Client sees | Agency sees |
| --- | --- | --- |
| Stripe account not activated (KYC/bank details incomplete → connected but charges disabled) | "Stripe is connected but can't take payments yet — Stripe still needs your business and bank details. Finish activation in your Stripe dashboard and this completes itself." | "Connected · charges disabled (Stripe activation incomplete)" — the connected-but-restricted state is why the detector checks capability, not just the token. |
| OAuth abandoned mid-KYC (Stripe's signup is long) | Stays `in_progress`, encouraging: "Picking up where you left off works — Stripe saves your progress." | "In progress · Stripe onboarding abandoned at KYC" once stalled. |
| Country not supported by Stripe | "Stripe isn't available in {country} yet. {Agency} will set up an alternative payment provider with you." | "Blocked · Stripe unsupported region — terminal for this provider; consider alternative integration or skip." |
| Test-mode account connected instead of live | "Connected in test mode — fine for trying things out, but switch to your live Stripe account before taking real payments." | "Connected · test mode" — quality flag, not failure. |

#### Step 15 — Book your kickoff call (with {Agency})

Detector · Booking event on the agency's kickoff calendar (v1.4: client books in the embedded calendar; Tier-A detection on the human anchor). Starts · Embed opened. Expected · ~1 day to book (Tier A); the call itself follows the calendar. **Completes (`done`):** Appointment created. Auto-verified the moment the booking event fires. The done card shows the booked slot: "Booked — {day, time} with {Agency}."

| Failure / edge scenario | Client sees | Agency sees |
| --- | --- | --- |
| Embed shows no available slots (agency calendar full or misconfigured) | "No times are showing right now — we've pinged {Agency} to open up slots; check back shortly." (auto-notifies agency) | "ACTION · kickoff calendar has no open availability" — agency-owned blocker; feeds Waiting-on-you. |
| Embed fails to load (script/popup blocked) | "The calendar didn't load — your browser may be blocking it. Use this direct booking link instead." + raw link fallback | "Embed load failure observed · fallback link served." |
| Booking cancelled BEFORE the call | The one sanctioned regression (§12.3): `done` → `in_progress`, warm reprompt: "Your kickoff was cancelled — grab a new time that works." | "Kickoff cancelled · reverted to booking" + days-clock resumes. |
| No-show (appointment status = no_show) | "Missed it? Happens to everyone — pick a new time and {Agency} will be there." (step stays `done` if the agency prefers; default: revert to `in_progress` with reschedule) | "No-show recorded · reschedule prompted" — agency setting controls revert-vs-keep; default revert. |
| Client books on a personal/wrong calendar outside the embed | Detector silent → dispute flow (§12.3) resolves it; agency confirm writes `agency_verified`. | Standard dispute task. |

Note: Sub-question still open (§11.2 Q1 residue): GHL-native embed ships first; Calendly fast-follow.

---

## 13. Engineering Flag — Custom Steps via Inbound Webhook (v1.7)

The `inbound_webhook` completion method (§6.4c) is a new detector type and a deliberate strategic unlock: it converts the fixed 15-step catalog into an open system where agencies can track anything GoCSM doesn't natively detect — using HighLevel's own Webhook workflow action, which agencies already know how to wire. This note scopes it for Abhinav.

> **INBOUND WEBHOOK — CONTRACT**
> Per step with `detector.type = inbound_webhook`:
> GoCSM mints a unique, unguessable URL: `https://hooks.gocsm.com/e/{token}`.
> `{token}` resolves to (`account_id` / `ghl_location_id`, `step_id`) — no body trust needed.
> INBOUND: `POST {token}` → authenticate by token, mark that step `done` (idempotent). Optional JSON body: `{ completed: true }` (default true if omitted).
> The agency adds a Webhook action to any GHL workflow and pastes the URL; the step completes when that workflow runs. The endpoint maps a ping to exactly one (location, step) — the token carries the identity, so a malformed or replayed body can't complete the wrong step.

- **Isolation.** This inbound endpoint must sit on the same isolated path as the rest of onboarding detection — entirely separate from the Health Score / sub-account tracker computation (the standing highest-regression-risk guardrail, §4.1). It is an event sink, not a poller; it adds no HL API load.
- **Abuse & idempotency.** Tokens are revocable per step; repeated POSTs are idempotent (already-done stays done); a rate cap per token guards against a misconfigured workflow looping. No PII required in the payload — identity is the token.
- **Relationship to polling vs. webhook (Q4).** This is the agency-facing inbound case; it is orthogonal to GoCSM's own outbound detection cadence for catalog steps. Both are part of the same Q4 detector-transport decision (§11.2), alongside the retroactive backfill scan on publish (§8.6).

---

_GoCSM — Sub-Account Onboarding & Activation — PRD v1.12 — Confidential. Two design-loop redesigns shipped to the prototype on 30 June 2026 — the Journey Builder (Layer A) and the Overview "tracker" (Layer C); see "Changes made on 30 June 2026" at the top of this document and the v1.12 decision log (§11.1k)._
