# GoCSM — User-Facing Attribute & Filter Catalog

> **Purpose.** The canonical, *simplified* list of the attributes a GoCSM agency owner
> can build trigger / segment criteria on, mapped to filter types and input controls.
> Derived once from the real GoCSM backend (`csm-super-logger`) + live MongoDB (`prod_v2`)
> + ClickHouse (`prod`) so we never have to re-derive it. **Source of truth for the
> trigger-criteria builder ("Who it runs on", step 1 of the Attention activation wizard).**
>
> Built: 2026-06-22. Re-confirm against the backend before a major rebuild.

---

## 0. The one rule that governs everything

**Only expose what the customer already sees. Never expose internal scoring math.**

The product computes a hidden **PAS** (Product Activation Score) and a composite
**Health Score** from four weighted pillars. The *names* PAS / product_activation are
deliberately scrubbed from every customer-facing contract (renamed "Product Adoption"),
the sub-pillar scores are on an explicit `.strict()` deny-list, and **no pillar score is
filterable or sortable in the public (MCP) contract.**

So we expose:
- ✅ the **overall Health Band** and **Health Score** (the headline number the user sees),
- ✅ the **observable drivers** beneath the pillars (feature usage, logins, NPS responses,
  MRR/spend, payments, renewals),
- ❌ **never** PAS, never the raw pillar scores (Product-Adoption / Revenue / Login / NPS
  as 0–100), never the accounts-table `healthScore` proxy, never velocity / cap / guard
  internals. (Full exclude list in §6.)

---

## 1. Filter types & their input controls

The builder supports six control types. Every field below is tagged with one.

| Type | When | Control (interface) | Operators |
|---|---|---|---|
| **Boolean** | yes/no facts (priority, tracked, feature activated, owner responded) | inline **toggle** (or Yes/No segmented) | is / is not |
| **Text** | free-text identity fields (name, owner email) | text input + **value autocomplete** where real values exist | is · is not · contains · starts with |
| **Number** | a single threshold (days since login, # failed payments, active users) | number stepper + **unit suffix** ($, d, %, min, users) | is above · below · at least · at most · equals |
| **Range** | a band of a numeric (health score 0–100, MRR $, time spent) | **dual-handle slider** + min/max number inputs, unit-aware | is between |
| **Date range** | time-anchored fields (renewal, last login, created) | **date picker** with absolute *and* relative modes | before · after · between · **in the next N days** · **in the last N days** · **more than N days ago** |
| **Enum / Select** | fixed value sets (band, lifecycle, plan, payment frequency, risk tags, feature) | **segmented pills** (small sets) or **searchable multi-select** (large sets), values autocompleted from real data | is · is not · is any of · is none of |

> Relative date is non-negotiable for renewal & last-login — that's how the real triggers
> work (`daysBeforeRenewal`, `notLoggedInSinceDays`).

---

## 2. The filter catalog (grouped by the user's mental model)

Each row: **Filter** · type · control detail · plain meaning · backend source. `★` = used by an existing real trigger.

### A. Health & Risk
| Filter | Type | Meaning | Source |
|---|---|---|---|
| **Health band** ★ | Enum (multi) | thriving · healthy · watch · at-risk | `account_health_daily.health_band` (CH) · MCP `health_band` |
| **Health score** | Range 0–100 | overall composite score (headline number only) | `account_health_daily.health_score` (CH) |
| **Health trend** ★ | Enum/direction | rising · falling · flat | `health_delta` sign · trigger `health_score_changed` |
| **Risk tags** ★ | Enum (multi) | Increasing Spend · Declining Spend · Payment Failed · … | `accounts.cached_risk_tags` (Mongo) |
| **Lifecycle stage** ★ | Enum | onboarding (≤90d) · growth (≤180d) · mature (>180d) | `account_health_daily.lifecycle_stage` (CH) |
| **Priority account** ★ | Boolean | flagged high-priority | `is_priority` (CH) / `ghllocations.priority` |
| **Account status** | Enum | active · churned · cancelled | `accounts.status` + `subscription_status` |

### B. Engagement & Login  *(observables — never the login_score pillar)*
| Filter | Type | Meaning | Source |
|---|---|---|---|
| **Days since last login** ★ | Number (d) | account/owner idle days | `v_daily_user_activity` → `dateDiff(max(last_event_time))`; trigger `inactivity_alert` `notLoggedInSinceDays` |
| **Last login** | Date range | absolute / relative last-seen | `max(last_event_time)` (CH) |
| **Login activity status** | Enum | Active ≤7d · At-Risk 7–30d · Dormant >30d | derived (CH) |
| **Active users** | Range | distinct active users (7/30/90d window) | `login_v2_daily.active_users_period` (CH) |
| **Login frequency** | Enum | heavy · regular · casual · ghosting | `analytics.service` (CH) |
| **Unique login days** | Number | active calendar days in window | `v_daily_user_activity` (CH) |
| **Total time spent** | Range (min) | capped heartbeat minutes (7/30d) | `v_daily_user_activity.total_duration_ms` (CH) |

### C. Feature Adoption  *(the "is the customer using X?" set)*
Feature vocabulary (`feature_time_daily.featureType` + emitter): **Workflows, Contacts,
Conversations, Calendars, Opportunities/Pipelines, Payments, Email, SMS, Phone,
Funnels/Marketing, Forms/Surveys, Reviews/Reputation, Memberships/Courses, Communities,
Custom Menu Links.**

| Filter | Type | Meaning | Source |
|---|---|---|---|
| **Feature activated / in use** ★ | Boolean *(per feature)* or Enum (multi) "features in use" | has the account ever used feature X | `pas_infrastructure_v2_daily.is_activated`; trigger filter `features` |
| **Feature time spent** | Range (min, per feature) | minutes in feature (7/30d) | `feature_time_daily` (CH) |
| **Feature engagement trend** ★ | Enum/direction + % | feature usage rising/falling WoW/MoM | triggers `feature_time_spent_changed`, `feature_engagement_changed` |
| **Feature never used since signup** ★ | Boolean (per feature) | empty/low after N days | triggers `gocsm_feature_assets_empty_since_signup`, `…_time_spent_less_than_x_since_signup` |

### D. Revenue & Billing
| Filter | Type | Meaning | Source |
|---|---|---|---|
| **MRR** ★ | Range ($) | monthly recurring (annual → price/12). **No ARR exists.** | computed; MCP `mrr_min/mrr_max` |
| **Spend trend** ★ | Enum/direction | increasing · declining (±10% threshold) | risk tags / triggers `total_spends_increased/decreased` |
| **Lifetime spend** ★ | Number/Range ($) | cumulative spend | trigger `lifetime_spend_exceeded` |
| **Plan** ★ | Enum (multi) | SaaS plan name(s) | `plans.name`, `accounts.plan_id`; filter `saasPlans` |
| **Plan change** ★ | Enum | upgraded · downgraded · cancelled | `plan_changes.change_type`; triggers `plan_upgrade/downgrade` |
| **Payment / billing frequency** ★ | Enum | monthly · annual | `accounts.billing_interval`; filter `paymentFrequency` |
| **Failed payment** ★ | Boolean / Enum | has a failed/declined charge | `transactions.status`; trigger `saas_payment_failed`; MCP `has_failed_payment` |
| **Consecutive failed payments** | Number | dunning depth | `revenue_payment_reliability_v2_daily.consecutive_failures` (CH) |
| **On-time payment %** | Range (%) | payment reliability | `…reliability_v2_daily.on_time_pct` (CH) |
| **Wallet balance** | Range ($) | current rebilling wallet | `accounts.current_wallet_balance` (Mongo) |
| **Renews within** ★ | Number (d) / Date range | upcoming renewal window | trigger `upcoming_plan_renewal` `daysBeforeRenewal` |
| **Next billing date** | Date range | absolute/relative | `accounts.next_billing_date` (Mongo) |

### E. Account
| Filter | Type | Meaning | Source |
|---|---|---|---|
| **Account name** | Text | contains / is | `accounts.name` |
| **Owner email / name** | Text | owner identity | `accounts.owner_email / owner_first_name / owner_last_name` |
| **Account age** | Range (d) | days since GoCSM install | `account_age_days` / `days_active` (CH) |
| **Tracked** | Boolean | tracking on/off | `accounts.tracked` |
| **Created (GoCSM / GHL)** | Date range | onboarding timing | `accounts.created_at_ghl` |
| **Capabilities** | Boolean | has branded app · WordPress · listings | `accounts.has_branded_app / has_wordpress / has_listings` |
| **Industry** | Text/Enum | *provisional — present in prototype, not confirmed on live `accounts`* | — |

### F. Feedback / NPS  *(observables — never the NPS pillar score)*
| Filter | Type | Meaning | Source |
|---|---|---|---|
| **Customer sentiment** | Enum | very happy · happy · neutral · unhappy | MCP `sentiment` enum |
| **Avg rating** | Range | 0–5 star average (30d) | `feedbacks.selectedRating` (Mongo) / `nps_v2_daily` |
| **NPS responses (30d)** | Number | response volume | `nps_v2_daily.total_responses_30d` (CH) |
| **Owner responded** | Boolean | owner gave feedback | `nps_v2_daily.owner_responded` (CH) |

### G. Users (sub-account users — for user-level triggers)
| Filter | Type | Meaning | Source |
|---|---|---|---|
| **User role** ★ | Enum | admin · user | `users.role`; filter `userRoles` |
| **Key users only** ★ | Boolean | restrict to key/premium users | filter `keyUsersOnly`; `ghlusers.type='premium'` |
| **User last login / idle days** ★ | Number / Date | per-user inactivity | `user-inactivity-emitter`; trigger `UserInactive` `daysSinceLastLogin` |
| **User active** | Boolean | active vs deleted/dormant | `adoption_user_snapshots.isActive` (CH) |
| **Is agency owner** | Boolean | the owner specifically | `adoption_user_snapshots.isAgencyOwner` (CH) |

---

## 3. Real trigger vocabulary (for templates / NL warm-start)

The product ships two trigger systems. Build the criteria UI against **System A — the live
GHL Trigger Engine** (`server/src/ghl-trigger-engine/trigger-definitions.ts`), which has
served filter-option endpoints (`/api/ghl-triggers/filters/*`).

**System A (live, event-driven):** `inactivity_alert`, `health_score_changed`,
`feature_time_spent_changed`, `feature_engagement_changed`,
`gocsm_feature_assets_empty_since_signup`,
`gocsm_feature_time_spent_less_than_x_since_signup`, `saas_payment_failed`,
`upcoming_plan_renewal`, user-inactive. Shared filter params: `accountPriority`,
`saasPlans`, `paymentFrequency`, `oldSaasPlans`, `newSaasPlans`, `userRoles`,
`keyUsersOnly`, `features`.

**System B (`workflow_triggers`, revenue-intelligence, partly stubbed):**
`total_spends_increased/decreased`, `payment_failed`, `upcoming_plan_renewal`,
`plan_upgrade/downgrade`, `customer_churned`, `lifetime_spend_exceeded`,
`cancellation_request`. Config: `percentageThreshold`, `timeframe`,
`lifetimeSpendThreshold`, `revisitInterval`.

---

## 4. Data-source & freshness map

- **MongoDB `prod_v2`** — entity/config truth: `accounts`, `users`, `plans`, `companies`,
  `plan_changes`, `feedbacks`, trigger engine collections. Live (synced from GHL).
- **ClickHouse `prod`** — telemetry & scoring:
  - *Real-time MVs* (update on every event insert): `mv_daily_user_activity`,
    `v_daily_user_activity` (canonical web+mobile read), `mv_hourly_heatmap`,
    `agency_daily_wallet`.
  - *Nightly @ 2:00 AM UTC* (`0 2 * * *`): the `*_v2_daily` scoring family
    (`health_score_v2_daily`, `pas_*_v2_daily`, `revenue_*_v2_daily`, `login_v2_daily`,
    `nps_v2_daily`, `account_health_daily`). AI insight fields top up every 5 min.
- **Important caveats:**
  - **No ARR** anywhere — only **MRR** (`price/12` for annual plans).
  - The accounts-table `healthScore` is a **fake 0/40/50/85 proxy** — ignore it; the real
    band/score is the ClickHouse health rollup.
  - The legacy accounts endpoint has **no arbitrary MRR filter** (only ±10% spend risk
    tags) and strips **untracked non-churned** accounts to ~8 fields — a new builder should
    read the richer health/telemetry surfaces, not that endpoint.

---

## 5. Two builder modes

- **Simple** — a flat list of conditions joined by one **Match ALL / Match ANY** switch.
  Field picker grouped by the §2 categories; each condition renders the typed control from
  §1. Templates + NL input sit on top.
- **Advanced** — a **nested AND/OR rule builder**: groups of conditions, each group with its
  own AND/OR, groups nestable one level → `(A AND B) OR (C AND D)`. A plain-English
  restatement always sits at the top so the *text stays simple even when the logic is
  complex* ("Accounts where health is at-risk **AND** (renews within 30 days **OR** a
  payment failed)").

---

## 6. EXCLUDE — never expose as a filter (internal)

PAS (`pas_final/pas_raw/pas_score` + sub-pillars `pas_infra/growth/usage_score`); the raw
pillar scores `login_score / revenue_score / nps_score / pas_score` (0–100); the
accounts-table `healthScore` proxy; velocity-engine fields (`score`, `velocity_ratio`,
`pct_change`, `risk_level`, `signal_state`, `phase`, `narration_window_label`);
cap/guard audit (`structural_guard_fired`, `pas_monthly_cap_applied`, `pas_cap_*`,
`hard_cap_applied`); data-readiness (`signal_age_days`, `data_completeness_pct`,
`shadow_delta_daily`, `playbook_fire_log`, `ai_insights*`); config metadata (feature
`priority` HIGH/MED/LOW, role multipliers, lifecycle weights); and all infra refs (IDs,
OAuth tokens, Stripe refs, `*_sync_state`, `is_excluded`, `cached_*` internal flags).
The MCP `Account` contract is `.strict()` and throws on leak — treat that as the boundary.
