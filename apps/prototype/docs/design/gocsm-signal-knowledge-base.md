# GoCSM — Complete Signal & Data Knowledge Base

> **Purpose.** The single authoritative reference for everything GoCSM knows about
> its sub-accounts: every MongoDB collection, every ClickHouse table, every health
> signal, every trigger, and every playbook-worthy scenario.
>
> Derived from: live schema research of `csm-super-logger` (NestJS backend) +
> MongoDB `prod_v2` (DigitalOcean) + ClickHouse `prod` (clickhouse.gocsm.io).
> **Built: 2026-06-22. Re-confirm before any major rebuild.**
>
> Companion doc: `gocsm-attribute-filter-catalog.md` (the *user-facing* filter
> universe). This doc is the *internal* complete picture — what the backend stores
> and computes. Never expose the internal fields to end users without checking §8.

---

## 1. MongoDB `prod_v2` — entity & config truth

Live database synced from GHL (GoHighLevel). Updated in near-real-time via webhooks.

### Key collections

#### `accounts`
Core sub-account record. One row per GHL location tracked by GoCSM.

| Field | Type | Meaning |
|---|---|---|
| `_id` | ObjectId | GoCSM internal ID |
| `ghlLocationId` | string | GHL location ID (the canonical join key) |
| `name` | string | Sub-account / business name |
| `owner_email` | string | Agency owner's email |
| `owner_first_name` / `owner_last_name` | string | Owner identity |
| `status` | string | `active` · `churned` · `cancelled` |
| `subscription_status` | string | Stripe subscription state |
| `plan_id` | ObjectId | FK → `plans` |
| `billing_interval` | string | `monthly` · `annual` |
| `next_billing_date` | Date | Upcoming charge date |
| `current_wallet_balance` | number | Rebilling wallet $ balance |
| `tracked` | boolean | Whether GoCSM is actively tracking |
| `priority` | boolean | Flagged as high-priority |
| `cached_risk_tags` | string[] | Denormalized risk signals: `Increasing Spend`, `Declining Spend`, `Payment Failed`, etc. |
| `healthScore` | number | ⚠️ **FAKE PROXY** (0/40/50/85 stubs) — **NEVER use this. Use ClickHouse `account_health_daily`.** |
| `has_branded_app` / `has_wordpress` / `has_listings` | boolean | Capability flags |
| `created_at_ghl` | Date | When the GHL location was created |
| `is_excluded` | boolean | Internal exclusion flag — hidden from CSM views |

#### `users`
Individual users inside a sub-account (employees, admins).

| Field | Type | Meaning |
|---|---|---|
| `ghlUserId` | string | GHL user ID |
| `ghlLocationId` | string | Which account they belong to |
| `role` | string | `admin` · `user` |
| `email` | string | Login email |
| `isActive` | boolean | Active vs deleted/deactivated |

#### `ghlusers`
GHL-synced user snapshot. `type: 'premium'` = key users (the `keyUsersOnly` filter targets this).

#### `plans`
SaaS plan definitions managed by the agency.

| Field | Type | Meaning |
|---|---|---|
| `name` | string | Plan label (e.g. "Starter", "Pro", "Agency") |
| `price` | number | Plan price (monthly $ or annual total) |
| `interval` | string | `monthly` · `annual` |
| `features` | string[] | Which GHL features are included |

> **MRR computation:** `price` if monthly, `price / 12` if annual. **There is no ARR field anywhere in the product — only MRR.**

#### `plan_changes`
History of plan upgrades / downgrades / cancellations.

| Field | Type | Meaning |
|---|---|---|
| `ghlLocationId` | string | Account |
| `change_type` | string | `upgrade` · `downgrade` · `cancelled` |
| `old_plan_id` / `new_plan_id` | ObjectId | Plan before/after |
| `changed_at` | Date | When the change occurred |

#### `transactions`
Billing/payment records.

| Field | Type | Meaning |
|---|---|---|
| `status` | string | `succeeded` · `failed` · `pending` |
| `amount` | number | Charge amount |
| `failed_at` | Date | First failure timestamp |

#### `feedbacks`
Customer NPS / satisfaction feedback.

| Field | Type | Meaning |
|---|---|---|
| `ghlLocationId` | string | Account |
| `selectedRating` | number | 0–5 star rating (or NPS 0–10) |
| `comment` | string | Free-text response |
| `createdAt` | Date | Submission date |
| `owner_responded` | boolean | Was a follow-up sent by the agency? |

#### `companies`
Agency-level record. One agency = one company; each sub-account = one entry in `accounts`.

#### `ghllocations`
Low-level GHL location sync cache. `priority` field mirrors `accounts.priority`.

#### Trigger engine collections (System A)
- `trigger_definitions` — the live trigger rule set
- `trigger_logs` — execution history per trigger per account
- `trigger_snapshots` — state snapshots for cooldown / dedup

---

## 2. ClickHouse `prod` — telemetry & scoring

All analytics, scoring, and rollups live here. Two freshness tiers:

| Tier | Tables | Schedule | Notes |
|---|---|---|---|
| **Real-time** (on every event insert) | `mv_daily_user_activity`, `v_daily_user_activity`, `mv_hourly_heatmap`, `agency_daily_wallet` | Live | Web + mobile events; canonical read is `v_daily_user_activity` |
| **Nightly** | All `*_v2_daily` scoring family | Cron `0 2 * * *` (2:00 AM UTC) | Health/PAS/revenue/login/NPS rollups |
| **AI insights** | AI narrative fields inside scoring tables | Every 5 min | GPT-generated summaries; internal only |

### Scoring tables (`*_v2_daily`)

#### `account_health_daily`
**The canonical health output.** One row per account per day.

| Column | Type | Meaning |
|---|---|---|
| `health_score` | float 0–100 | Composite score (weighted average of pillars) |
| `health_band` | string | `thriving` (≥80) · `healthy` (≥60) · `watch` (≥40) · `at-risk` (<40) |
| `health_delta` | float | Score change vs prior period (sign = trend: + rising, − falling) |
| `lifecycle_stage` | string | `onboarding` (≤90d) · `growth` (≤180d) · `mature` (>180d) |
| `is_priority` | boolean | Priority flag (mirrors Mongo) |
| `account_age_days` | int | Days since first tracked |
| `days_active` | int | Days with any activity |

#### PAS (Product Activation Score) — **INTERNAL ONLY, never expose**
Composite score from 3 sub-pillars. Renamed "Product Adoption" in user-facing copy.

| Table | Sub-pillar | What it measures |
|---|---|---|
| `pas_infrastructure_v2_daily` | Infrastructure | Which features have been activated / ever used (`is_activated` bool per featureType) |
| `pas_growth_v2_daily` | Growth | Recent adoption of new features (week-over-week new activations) |
| `pas_usage_v2_daily` | Usage | Depth and frequency of feature engagement |

> PAS sub-scores (`pas_infra/growth/usage_score`), the combined `pas_score`, and
> the raw `pas_final` / `pas_raw` values are **on a `.strict()` deny-list** in the
> MCP contract. They are permanently off the user-facing filter surface.

#### `login_v2_daily`
| Column | Meaning |
|---|---|
| `active_users_period` | Distinct active users in the window (7/30/90d) |
| `login_score` | **INTERNAL ONLY** — the login pillar score (0–100) |
| `login_frequency_band` | heavy · regular · casual · ghosting |

#### `nps_v2_daily`
| Column | Meaning |
|---|---|
| `total_responses_30d` | NPS responses in last 30 days |
| `owner_responded` | Boolean: did the owner give feedback |
| `nps_score` | **INTERNAL ONLY** — the NPS pillar score (0–100) |

#### `revenue_payment_reliability_v2_daily`
| Column | Meaning |
|---|---|
| `consecutive_failures` | Consecutive failed payment count (dunning depth) |
| `on_time_pct` | Payment reliability % |
| `revenue_score` | **INTERNAL ONLY** — the revenue pillar score (0–100) |

### Activity tables

#### `v_daily_user_activity` (canonical read — real-time)
One row per user per account per day.

| Column | Meaning |
|---|---|
| `last_event_time` | Most recent event timestamp |
| `total_duration_ms` | Capped heartbeat minutes in session |
| `event_count` | Events in the day |
| `ghlLocationId` | Account |
| `ghlUserId` | User |

> "Days since last login" = `dateDiff('day', max(last_event_time), today())` aggregated per account.

#### `feature_time_daily`
One row per account per feature per day.

| Column | Meaning |
|---|---|
| `featureType` | One of the ~15 GHL feature types (see §4) |
| `minutes_spent` | Time in feature that day |
| `event_count` | Feature events |
| `ghlLocationId` | Account |

#### `adoption_user_snapshots`
Per-user activity snapshots.

| Column | Meaning |
|---|---|
| `isActive` | Active vs dormant/deleted |
| `isAgencyOwner` | Is this the main agency owner user? |
| `last_login` | Last activity timestamp |

#### `agency_daily_wallet` (real-time)
Wallet balance time series for the agency's rebilling wallet.

#### `mv_hourly_heatmap`
Activity heatmap by hour-of-day and day-of-week. Powers usage pattern analysis.

---

## 3. Health scoring architecture

```
                    ┌─────────────────────────────────────────┐
                    │        COMPOSITE HEALTH SCORE 0–100     │
                    │   (weighted average of four pillars)    │
                    └───────┬──────┬──────┬──────────────────┘
                            │      │      │
              ┌─────────────┘  ┌───┘  ┌──┘
              ▼                ▼      ▼        ▼
      ┌───────────────┐  ┌─────────┐ ┌──────┐ ┌─────────────┐
      │  PAS (Product │  │ Revenue │ │Login │ │ NPS/Feedback│
      │  Activation)  │  │ Pillar  │ │Pillar│ │   Pillar    │
      │   INTERNAL    │  │INTERNAL │ │INTNL │ │  INTERNAL   │
      └───────┬───────┘  └─────────┘ └──────┘ └─────────────┘
              │
    ┌─────────┼─────────┐
    ▼         ▼         ▼
 Infra    Growth    Usage
 score    score     score
 (INTERNAL — never expose sub-pillars)
```

**Score → Band mapping:**
- ≥ 80 → `thriving`
- ≥ 60 → `healthy`
- ≥ 40 → `watch`
- < 40 → `at-risk`

**What IS user-facing:**
- The composite `health_score` (the single 0–100 number)
- The `health_band` (the four tiers)
- The `health_delta` sign (rising / falling / flat as a trend)
- The `lifecycle_stage` (onboarding / growth / mature)
- The OBSERVABLE DRIVERS underneath each pillar:
  - PAS → which features are in use, feature engagement trends
  - Login → days since login, active users count, time spent
  - Revenue → MRR, plan, payment status, renewal date
  - NPS → star rating, sentiment, response volume

**What is NEVER user-facing:**
- `pas_score`, `pas_final`, `pas_raw`, sub-pillar scores
- `login_score`, `revenue_score`, `nps_score`
- Velocity engine internals: `velocity_ratio`, `pct_change`, `risk_level`, `signal_state`, `phase`, `narration_window_label`
- Cap/guard audit: `structural_guard_fired`, `pas_monthly_cap_applied`, `hard_cap_applied`
- Data readiness: `signal_age_days`, `data_completeness_pct`, `shadow_delta_daily`, `playbook_fire_log`
- AI insight raw fields (`ai_insights*`)
- Config metadata: feature `priority` HIGH/MED/LOW, role multipliers, lifecycle weights
- Infra: internal IDs, OAuth tokens, Stripe refs, `*_sync_state`

---

## 4. Feature vocabulary

The 15 GHL feature types tracked in `feature_time_daily.featureType` and
`pas_infrastructure_v2_daily`:

1. **Workflows** — automation builder
2. **Contacts** — CRM / contact management
3. **Conversations** — unified inbox (SMS, email, chat)
4. **Calendars** — appointment scheduling
5. **Opportunities / Pipelines** — deal tracking
6. **Payments** — invoicing / payment processing
7. **Email** — email marketing / campaigns
8. **SMS** — text marketing
9. **Phone** — calling / VoIP
10. **Funnels / Marketing** — funnel / landing page builder
11. **Forms / Surveys** — form builder
12. **Reviews / Reputation** — review management / GMB
13. **Memberships / Courses** — membership site / LMS
14. **Communities** — group/community platform
15. **Custom Menu Links** — custom navigation / embedded apps

---

## 5. Trigger systems

### System A — GHL Trigger Engine (LIVE; build the UI against this)
Location: `server/src/ghl-trigger-engine/trigger-definitions.ts`
Filter-option endpoints: `/api/ghl-triggers/filters/*`

**Trigger types:**

| Trigger | What fires it | Key config params |
|---|---|---|
| `inactivity_alert` | Account/owner idle > N days | `notLoggedInSinceDays` |
| `health_score_changed` | Health band changes (e.g. healthy → watch) | `oldBand`, `newBand`, `threshold` |
| `feature_time_spent_changed` | Feature usage rose/fell by % | `featureType`, `percentageThreshold`, `timeframe` |
| `feature_engagement_changed` | Feature engagement band changed | `featureType`, `direction` (up/down) |
| `gocsm_feature_assets_empty_since_signup` | Feature never used after N days | `featureType`, `daysSinceSignup` |
| `gocsm_feature_time_spent_less_than_x_since_signup` | Feature barely used since signup | `featureType`, `minuteThreshold`, `daysSinceSignup` |
| `saas_payment_failed` | Payment declined | — |
| `upcoming_plan_renewal` | Renewal N days away | `daysBeforeRenewal` |
| `UserInactive` | Individual user idle > N days | `daysSinceLastLogin`, `userRoles`, `keyUsersOnly` |

**Shared filter params** (all trigger types support these):
- `accountPriority` — filter to priority accounts only
- `saasPlans` — restrict to specific plan names
- `paymentFrequency` — `monthly` | `annual`
- `oldSaasPlans` / `newSaasPlans` — for plan-change triggers
- `userRoles` — `admin` | `user`
- `keyUsersOnly` — only premium GHL users
- `features` — which feature(s) to target (for feature triggers)

### System B — Revenue Intelligence (partly live, partly stubbed)
Location: `server/src/revenue-intelligence/workflow_triggers/`

**Trigger types:**

| Trigger | What fires it | Key config params |
|---|---|---|
| `total_spends_increased` | MRR/spend rose by % | `percentageThreshold`, `timeframe` |
| `total_spends_decreased` | MRR/spend fell by % | `percentageThreshold`, `timeframe` |
| `payment_failed` | Charge declined | — |
| `upcoming_plan_renewal` | Renewal approaching | `daysBeforeRenewal` |
| `plan_upgrade` | Plan upgraded | `oldSaasPlans`, `newSaasPlans` |
| `plan_downgrade` | Plan downgraded | `oldSaasPlans`, `newSaasPlans` |
| `customer_churned` | Account cancelled | — |
| `lifetime_spend_exceeded` | Total spend crossed $ threshold | `lifetimeSpendThreshold` |
| `cancellation_request` | Cancellation intent detected | — |

Config: `percentageThreshold`, `timeframe`, `lifetimeSpendThreshold`, `revisitInterval`.

---

## 6. The full playbook scenario universe

A **Playbook** = trigger criteria (WHEN this happens) + action template (WHAT to send/do).
The trigger IS the playbook definition. The action template is mostly email / message templates
that the agency customizes to their brand. The playbook catalog is the product's core value.

### Category 1 — Health & Churn Risk

| Playbook | Trigger signals | MCP methods that apply |
|---|---|---|
| **At-risk alert** | Health band drops to `at-risk` | `list_accounts_at_risk`, `health_score_changed` |
| **Early warning — watch band** | Health drops to `watch` | `health_score_changed` (band: healthy → watch) |
| **Prolonged decline** | Health falling 3+ consecutive weeks | `health_delta` < 0 for 21d |
| **Save the big ones** | MRR > $X AND health is at-risk | `list_accounts_at_risk` + MRR filter |
| **Onboarding struggle** | lifecycle = onboarding AND health < 50 | `account_health_daily` |
| **Ghost in onboarding** | New account + zero logins in first 7 days | `v_daily_user_activity` |
| **Health recovering** | Health rises from at-risk/watch → healthy | `health_score_changed` (positive direction) — positive play |

### Category 2 — Engagement & Login

| Playbook | Trigger signals |
|---|---|
| **Owner gone quiet — 7d** | Owner idle 7 days (early nudge) |
| **Owner gone quiet — 21d** | Owner idle 21 days (intervention) |
| **Owner gone quiet — 30d** | Owner idle 30 days (urgent) |
| **All users inactive** | Every user in account idle 30+ days |
| **Single-user dependency** | Only 1 active user (key-person risk) |
| **Login frequency dropped** | Was daily/weekly, now monthly (trend drop) |
| **Re-engagement success** | Owner logs back in after 14d gap — positive play |

### Category 3 — Feature Adoption

| Playbook | Trigger signals |
|---|---|
| **Core feature never activated** | `pas_infrastructure_v2_daily.is_activated = false` for Workflows/Conversations/Contacts after 14d |
| **Feature stalled** | Feature activated but time_spent < X for 30 days |
| **Workflows not used** | Feature in use = false for Workflows |
| **Payments not set up** | Feature in use = false for Payments |
| **Reviews/Reputation gap** | Feature in use = false for Reviews |
| **Usage declining** | `feature_time_spent_changed` down >20% WoW |
| **Feature breadth without depth** | 10+ features activated but all < 30 min/mo each |
| **New feature available** | GoCSM launches a new GHL feature they haven't touched |
| **Feature milestone** | First time using a new feature — celebrate + guide deeper |

### Category 4 — Revenue & Billing

| Playbook | Trigger signals |
|---|---|
| **Payment failed — 1st attempt** | `saas_payment_failed` (1 failure) |
| **Payment failed — dunning** | 2–3 consecutive failures |
| **Renewing in 90 days — warm up** | `daysBeforeRenewal` = 90 |
| **Renewing in 30 days — action** | `daysBeforeRenewal` = 30 |
| **At-risk + renewing soon** | health at-risk AND renews in 30d |
| **Spend declining** | `total_spends_decreased` > 10% |
| **Downgrade detected** | `plan_downgrade` event |
| **Cancellation intent** | `cancellation_request` |
| **Churned — win back** | `customer_churned` |
| **Lifetime spend milestone** | `lifetime_spend_exceeded` threshold |
| **Annual renewal approaching** | `billing_interval = annual` AND renewing in 60d |

### Category 5 — NPS / Feedback

| Playbook | Trigger signals |
|---|---|
| **Unhappy feedback received** | Rating ≤ 2 or sentiment = very unhappy |
| **No feedback in 60+ days** | `nps_v2_daily.total_responses_30d = 0` for 60d |
| **Happy feedback — ask for review** | Rating ≥ 4 + positive sentiment — positive play |
| **NPS drop** | Average rating fell > 1 point WoW |

### Category 6 — Upsell & Expansion

| Playbook | Trigger signals |
|---|---|
| **Upgrade candidate** | Health = healthy/thriving AND MRR < plan ceiling AND heavy feature usage |
| **Feature ceiling hit** | All plan features maxed → natural upgrade moment |
| **All features adopted** | Every feature activated → premium tier candidate |
| **High engagement + low plan** | Time spent > Xh/mo AND on Starter/entry plan |
| **Wallet balance upsell** | Wallet low + heavy rebilling activity |

### Category 7 — Onboarding (account lifecycle-aware)

| Playbook | Trigger signals |
|---|---|
| **Welcome — day 1** | Account created (lifecycle = onboarding, age = 1d) |
| **Day 7 check-in** | Lifecycle = onboarding, age = 7d, any login activity |
| **Day 14 — core feature nudge** | Lifecycle = onboarding, core feature not activated |
| **Day 30 — health check** | Lifecycle = onboarding, health < 60 |
| **Day 60 — mid-onboarding** | Still in onboarding, feature engagement trend = flat |
| **Graduation — growth stage** | lifecycle moves onboarding → growth |
| **Long-tail onboarding** | Account 90+ days but still in onboarding lifecycle |

### Category 8 — Positive / Milestone (often missed by CS platforms)

| Playbook | Trigger signals |
|---|---|
| **Health hit thriving** | health_band = thriving (first time or sustained) |
| **1-year anniversary** | Account age = 365d |
| **Spend milestone** | MRR crosses $500, $1,000, $2,000 thresholds |
| **Power user emerged** | Single user logging in daily for 30d |
| **NPS win** | Rating = 5 stars |

---

## 7. Playbook catalog design (marketplace model)

The product vision (from the 2026-06-22 session) is a **marketplace-style catalog** of playbooks:

### Catalog metadata per playbook

```typescript
type Playbook = {
  id: string;
  title: string;                  // "the trigger IS the title": "When owner hasn't logged in for 21 days"
  category: PlaybookCategory;     // one of the 8 categories above
  triggerCriteria: CriteriaSet;   // the rule engine output (what we just built in Phase 1)
  actionTemplate: ActionTemplate; // email / message / task template — agency customizes
  
  // Catalog metadata
  tags: string[];                 // 'churn-risk' | 'engagement' | 'revenue' | 'upsell' | 'onboarding' | 'positive'
  difficulty: 'simple' | 'intermediate' | 'advanced';  // how complex the trigger criteria is
  estimatedImpact: 'retention' | 'expansion' | 'engagement';
  
  // Marketplace tracking
  usedByAgencies: number;         // count of agencies that have this active
  usedByAccounts: number;         // count of sub-accounts this runs on (total, across all agencies)
  isNew: boolean;                 // released in last 30 days
  isTrending: boolean;            // fastest-growing activation rate this week
  isMostPopular: boolean;         // top-N by usedByAgencies
  lastActivated: Date;            // most recent activation across the marketplace
}
```

### Catalog surfacing signals (for the marketplace UI)

- **Most popular** — sorted by `usedByAgencies DESC` — "what's working for others like me"
- **Trending** — activation rate growth WoW (new activations / prior-week baseline) — "what's picking up"
- **New** — released in the last 30 days — "what just landed"
- **Recommended for you** — match playbook category to the agency's current health signals (e.g., if they have 20+ at-risk accounts, surface retention playbooks)
- **Quick wins** — simple criteria (1–2 conditions) + high average impact
- **By category** — the 8 categories above as browse filters

---

## 8. The user-facing / internal boundary (the governing rule)

The MCP `Account` contract uses `.strict()` and throws if a server tries to include
an unlisted field. The deny-list is the authority. For any new field, ask:

| Test | Decision |
|---|---|
| Is it in the MCP `Account` schema? | ✅ User-facing — safe to expose |
| Is it on the `.strict()` deny-list? | ❌ Internal — never expose |
| Is it a raw pillar score (0–100)? | ❌ Internal — never expose |
| Is it the accounts-table `healthScore`? | ❌ Fake proxy — never expose |
| Is it a velocity/cap/guard field? | ❌ Internal — never expose |
| Is it an observable driver (logins, feature usage, MRR, NPS)? | ✅ User-facing — safe |
| Is it computed from internal math but presented as a category? | ✅ Safe if the CATEGORY is exposed, not the score (e.g., `health_band` yes, `login_score` no) |

---

## 9. Data freshness quick reference

| Field category | Freshness | Source |
|---|---|---|
| Account entity data (name, plan, status, billing) | Near real-time (webhook sync) | MongoDB `accounts`, `plans` |
| Payment status, wallet balance | Near real-time | MongoDB `transactions`, `accounts` |
| Login activity, feature events | Real-time (per event) | ClickHouse `v_daily_user_activity` |
| Health band / score | Nightly 2 AM UTC | ClickHouse `account_health_daily` |
| PAS sub-scores (internal) | Nightly 2 AM UTC | ClickHouse `pas_*_v2_daily` |
| NPS / feedback aggregates | Nightly 2 AM UTC | ClickHouse `nps_v2_daily` |
| Revenue / payment reliability | Nightly 2 AM UTC | ClickHouse `revenue_payment_reliability_v2_daily` |
| Feature time spent | Daily rollup | ClickHouse `feature_time_daily` |
| AI narrative summaries | Every 5 min | Internal — never expose raw |

---

## 10. MCP GoCSM AI tool → signal mapping

The `mcp__claude_ai_GoCSM_AI__*` tools expose the user-facing contract. Quick reference:

| MCP tool | Underlying signals |
|---|---|
| `get_account` | account entity + health_band/score from CH |
| `list_accounts_at_risk` | health_band = at-risk filter |
| `get_feature_metrics` | feature_time_daily + activation status |
| `get_login_activity` | v_daily_user_activity aggregate |
| `list_sub_accounts_login_activity` | per-account login rollup |
| `list_inactive_users` | user idle days > threshold |
| `list_upcoming_renewals` | next_billing_date within window |
| `list_failed_payments` | transactions.status = failed |
| `get_revenue_summary` | MRR, plan, billing interval |
| `get_churn_analysis` | health + spend trend signals |
| `list_upsell_candidates` | health + MRR + feature depth signals |
| `list_feature_adoption_gaps` | features not activated / low usage |
| `list_feedback_responses` | feedbacks collection |
| `get_agency_overview` | aggregate counts / health distribution |

---

## 11. Caveats & gotchas

1. **No ARR field exists anywhere** — only MRR. Annual plans: MRR = `price / 12`.
2. **`accounts.healthScore` is fake** (0/40/50/85 hardcoded stubs). The real score is always in ClickHouse `account_health_daily.health_score`.
3. **Two trigger systems** — System A is live; System B (`workflow_triggers`) is partly stubbed. The criteria builder is built against System A's filter API.
4. **Nightly refresh = stale by morning** — scores are up to ~22h old at worst. Real-time activity (logins, events) is always fresh. Design triggers to tolerate this lag.
5. **Industry field on `accounts`** is provisional — present in prototype fixtures but not confirmed on the live production `accounts` collection.
6. **"Accounts where" not "Accounts with"** — the canonical restatement grammar. "Health is at-risk" not "health = at-risk".
7. **Filter prose rules** — operator words in user-facing prose: `is more than 21 days ago` not `> 21d`; `over $1,500` not `>= 1500`; spell out units.
8. **Untracked accounts** — non-churned untracked accounts are stripped to ~8 fields in the legacy endpoint. Use the health/telemetry surfaces for the full picture.
9. **`is_excluded`** — accounts with this flag set are hidden from all CSM views. Never show or count them.
10. **PAS renamed** — internally `pas` / `product_activation`; user-facing label is "Product Adoption". The MCP contract enforces this rename. Never let the internal name leak into copy.
