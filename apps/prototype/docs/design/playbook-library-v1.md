# GoCSM Playbook Library v1 — catalog (APPROVED · IMPLEMENTED)

> **Status: APPROVED (all 57, full criteria + live counts) and SHIPPED into the demo.**
> Wired into `apps/prototype/src/fixtures/playbooks.ts` with real `match()` predicates;
> fixtures extended in `index.ts` (Email/Calendar signal subjects, 5 teardown signals,
> 2 onboarding accounts, targeted field tweaks). No `criteriaCatalog.ts` change needed —
> it already covers every field the triggers read.
>
> **Live coverage: 55 / 57 plays show real matching-account counts + MRR impact** in the
> marketplace. The 2 zeros are honest structural rarities: `pb-admin-removed` (needs a
> user-state we don't model) and `pb-churned-winback` (churned accounts are disabled, so
> the live-count selector correctly excludes them).
>
> Grounded in `gocsm-signal-knowledge-base.md` (live Mongo `prod_v2` + ClickHouse `prod`
> schema) and the live System-A trigger engine. Ratings use observable drivers only —
> never the internal PAS / pillar scores.

---

## Rating legend (the churn ↔ expansion spectrum)

Every playbook is rated by **signal polarity + intensity** — exactly the "is this a churn
signal or a happy/upsell signal, and how strong" lens.

| Rating | Meaning | Default response |
|---|---|---|
| 🔴🔴🔴 **Critical churn** | "Leaving now" — value teardown or stated intent | Stop automations, human reaches out today |
| 🔴🔴 **High risk** | Strong leaving signal | Urgent play + internal alert |
| 🔴 **Early warning** | Drift starting | Automated nudge, watch for reply |
| 🟡 **Watch / neutral** | Worth monitoring, low urgency | Light-touch / informational |
| 🟢 **Positive** | Healthy moment | Nurture / celebrate, no ask |
| 🟢🟢 **Strong positive** | Advocacy / loyalty moment | Review, testimonial, deepen |
| 🟢🟢🟢 **Hot expansion** | Upsell-ready, revenue on the table | Upgrade offer / planning call |

**Feasibility tags:** **[Live]** = direct System-A/B trigger today · **[Reverse]** =
sticky-setup-reverse detection (modeled in fixtures; needs backend confirmation) ·
**[Derived]** = composite of live signals · **[Backend]** = needs a new backend signal.

**Status:** **IN DEMO** = already in `playbooks.ts` · **NEW** = proposed addition.

---

## 1. Re-engage quiet — login & inactivity

| # | Playbook | Rating | Trigger (grounded) | What it does | Status |
|---|---|---|---|---|---|
| 1 | Owner gone quiet — 7 days | 🔴 Early warning | `inactivity_alert` (notLoggedInSinceDays=7) **[Live]** | Soft "here's what's new" nudge | NEW |
| 2 | No recent login — 21 days | 🔴 Early warning | `inactivity_alert` (21) **[Live]** | Warm check-in email + team alert + follow-up task | IN DEMO |
| 3 | **Admin gone dark — 30 days** | 🔴🔴 High risk | `UserInactive` (role=admin, 30) **[Live]** | Urgent check-in, books a call | NEW ⟵ *your example* |
| 4 | Whole account inactive — 30+ days | 🔴🔴 High risk | every user idle 30d (`v_daily_user_activity`) **[Derived]** | Account-level intervention, exec outreach | NEW |
| 5 | Login frequency collapsed | 🔴 Early warning | `login_frequency_band` heavy/regular → ghosting **[Live]** | Re-anchor nudge before the habit dies | NEW |
| 6 | Key admin removed / deactivated | 🔴🔴 High risk | `users.isActive=false` for an admin **[Backend]** | Alert team — champion may be gone | NEW |
| 7 | Owner re-engaged after a long gap | 🟢 Positive | login resumes after 14d+ silence **[Derived]** | Warm "welcome back," surface quick win | NEW |

## 2. Win back at-risk — health, renewal & the "save" plays

| # | Playbook | Rating | Trigger (grounded) | What it does | Status |
|---|---|---|---|---|---|
| 8 | Health dropped to at-risk | 🔴🔴 High risk | `health_score_changed` (→ at-risk) **[Live]** | Alerts team, diagnostic + recovery outreach | NEW |
| 9 | Early warning — slipped to watch | 🔴 Early warning | `health_score_changed` (healthy → watch) **[Live]** | Light nudge before it worsens | NEW |
| 10 | Prolonged decline — 3+ weeks falling | 🔴🔴 High risk | `health_delta` < 0 for 21d **[Derived]** | Pattern alert, structured save play | NEW |
| 11 | Save the big ones | 🔴🔴🔴 Critical churn | at-risk **AND** MRR > $X **[Derived]** | Top-priority human save, exec involved | NEW |
| 12 | **Renewing in 30 days & gone dark** | 🔴🔴 High risk | `upcoming_plan_renewal` (30) **AND** `inactivity_alert` (30) **[Derived]** | Value recap + personal pre-renewal check-in | NEW ⟵ *your example* |
| 13 | Renewing soon & showing risk | 🔴🔴 High risk | renewal (30) AND band watch/at-risk **[Derived]** | Renewal check-in + value recap | IN DEMO |
| 14 | Quiet account, renewal close | 🔴 Early warning | inactivity (14) AND renewal (45) **[Derived]** | Warm value-led check-in | IN DEMO |
| 15 | Annual renewal approaching | 🟡 Watch | billing_interval=annual AND renews in 60d **[Live]** | Early warm-up for the big annual decision | NEW |

### 2b. Value-teardown / "leaving now" (sticky-setup reverse) — the strongest churn tells

| # | Playbook | Rating | Trigger (grounded) | What it does | Status |
|---|---|---|---|---|---|
| 16 | **Website / funnel unpublished** | 🔴🔴🔴 Critical churn | Funnel went live → unpublished **[Reverse]** | Stop automations, hands-on save call | NEW ⟵ *your example* |
| 17 | Domain disconnected from site | 🔴🔴🔴 Critical churn | sticky-reverse: Domain **[Reverse]** | Offer hands-on reconnect, pause messages | IN DEMO |
| 18 | **Phone number ported out** | 🔴🔴🔴 Critical churn | sticky-reverse: Phone **[Reverse]** | Immediate human outreach — near-certain exit | NEW ⟵ *your example* |
| 19 | Texting (A2P/10DLC) registration lost | 🔴🔴🔴 Critical churn | sticky-reverse: A2P **[Reverse]** | Help re-register, pause texts until fixed | IN DEMO |
| 20 | Email sending domain disconnected | 🔴🔴 High risk | sticky-reverse: Email DNS/domain **[Reverse]** | Reconnect help — deliverability at risk | NEW |
| 21 | Payment processor (Stripe) disconnected | 🔴🔴 High risk | sticky-reverse: Payments integration **[Reverse]** | They can't collect — urgent reconnect | NEW |
| 22 | Calendar integration disconnected | 🔴🔴 High risk | sticky-reverse: Calendar **[Reverse]** | Booking flow broken — reconnect outreach | NEW |
| 23 | Published workflow turned off / deleted | 🔴🔴 High risk | sticky-reverse: Workflow **[Reverse]** | Find the cause, offer re-setup | IN DEMO* |
| 24 | Key integration removed (page/automation) | 🔴🔴 High risk | sticky-reverse: Funnel / Workflow **[Reverse]** | Diagnose + re-setup playbook | IN DEMO |

\* *covered by `pb-save-integration` today; #23 splits workflow-off into its own sharper play.*

## 3. Rescue revenue — billing & spend

| # | Playbook | Rating | Trigger (grounded) | What it does | Status |
|---|---|---|---|---|---|
| 25 | Payment failed — 1st attempt | 🔴 Early warning | `saas_payment_failed` **[Live]** | Reminder to update card, flag account | IN DEMO |
| 26 | Payment failing repeatedly (dunning) | 🔴🔴 High risk | `consecutive_failures` ≥ 2 **[Live]** | Escalate + personal outreach before cancel | NEW |
| 27 | Rebilling wallet critically low | 🔴🔴 High risk | `current_wallet_balance` low + heavy rebilling **[Live]** | Top-up reminder — their SMS/email about to stop | NEW |
| 28 | Spend dropping | 🔴🔴 High risk | `total_spends_decreased` > 15% **[Live]** | Diagnose pullback, re-engage on value | NEW |
| 29 | Plan downgrade | 🔴🔴 High risk | `plan_downgrade` **[Live]** | Value-check call + 3 unused features | IN DEMO |
| 30 | Cancellation requested | 🔴🔴🔴 Critical churn | `cancellation_request` **[Live]** | Stop everything, founder-level save offer | NEW |
| 31 | Churned — win back | 🔴🔴🔴 Critical churn | `customer_churned` **[Live]** | Timed win-back sequence + what's new | NEW |

## 4. Drive adoption — feature activation & depth

| # | Playbook | Rating | Trigger (grounded) | What it does | Status |
|---|---|---|---|---|---|
| 32 | Usage dropping on a core feature | 🔴 Early warning | `feature_time_spent_changed` down 30% WoW **[Live]** | Short how-to nudge, alert if no reply 7d | IN DEMO |
| 33 | Core feature never switched on | 🔴 Early warning | ≥2 features `is_activated=false` **[Live]** | 2-min setup nudge + offer to do it with them | IN DEMO |
| 34 | **Workflows unpublished 30 days post-signup** | 🔴 Early warning | `gocsm_feature_assets_empty_since_signup` (Workflows, 30) **[Live]** | Guided "publish your first automation" | NEW ⟵ *your example* |
| 35 | Payments never set up | 🔴 Early warning | Payments not activated **[Live]** | Walkthrough — they're leaving money uncollected | NEW |
| 36 | Texting never sent (SMS unused) | 🔴 Early warning | SMS not activated (often A2P-blocked) **[Live]** | Nudge to register + send first campaign | NEW |
| 37 | Reviews / reputation never connected | 🟡 Watch | Reviews not activated **[Live]** | Light nudge to connect GMB / collect reviews | NEW |
| 38 | Breadth without depth | 🟡 Watch | 10+ features activated, all < 30 min/mo **[Derived]** | Pick one and go deep — guided focus | NEW |

## 5. Onboard faster — lifecycle-aware

| # | Playbook | Rating | Trigger (grounded) | What it does | Status |
|---|---|---|---|---|---|
| 39 | Day-7 ghost (zero logins, first week) | 🔴🔴 High risk | onboarding AND 0 logins in 7d **[Derived]** | Hands-on "let's get you started" outreach | NEW |
| 40 | Onboarding stalled on a step | 🔴 Early warning | stuck on same setup step too long **[Live]** | Nudge + 10-min "do it with you" call | IN DEMO |
| 41 | Day-30 onboarding health check | 🔴 Early warning | onboarding AND health < 60 **[Derived]** | Structured check-in before momentum dies | NEW |
| 42 | Long-tail onboarding (90+ days) | 🔴🔴 High risk | account 90d+ but still lifecycle=onboarding **[Live]** | Never reached value — intensive intervention | NEW |
| 43 | Welcome — day 1 | 🟢 Positive | account created (age=1d) **[Live]** | Warm welcome + the 2-minute first win | NEW |
| 44 | Graduated to growth stage | 🟢 Positive | lifecycle onboarding → growth **[Live]** | Celebrate + introduce next-level features | NEW |

## 6. Grow & upsell — expansion (the happy signals)

| # | Playbook | Rating | Trigger (grounded) | What it does | Status |
|---|---|---|---|---|---|
| 45 | Hitting plan limits | 🟢🟢🟢 Hot expansion | feature/usage ceiling reached **[Derived]** | Value-led upgrade offer at the real moment | IN DEMO |
| 46 | Expansion ready (healthy + trending up) | 🟢🟢🟢 Hot expansion | thriving AND lifecycle=established **[Live]** | Upsell + planning call + testimonial ask | IN DEMO |
| 47 | **Spend surging** | 🟢🟢🟢 Hot expansion | `total_spends_increased` > 25% **[Live]** | Strike while hot — expansion conversation | NEW ⟵ *happy signal* |
| 48 | Plan upgraded — deepen & cross-sell | 🟢🟢 Strong positive | `plan_upgrade` **[Live]** | Congrats + activate the new-tier features | NEW |
| 49 | Lifetime spend milestone crossed | 🟢🟢 Strong positive | `lifetime_spend_exceeded` ($ threshold) **[Live]** | Recognition + expansion / advocacy ask | NEW |
| 50 | High engagement on an entry plan | 🟢🟢 Strong positive | heavy usage AND on Starter/low plan **[Derived]** | "You've outgrown this tier" upgrade nudge | NEW |
| 51 | Power user emerged | 🟢🟢 Strong positive | a user logging in daily for 30d **[Derived]** | Champion play — testimonial / referral / upsell | NEW |

## 7. Listen & celebrate — feedback & milestones

| # | Playbook | Rating | Trigger (grounded) | What it does | Status |
|---|---|---|---|---|---|
| 52 | Unhappy feedback — make it right | 🔴🔴 High risk | `feedbacks.selectedRating` ≤ 2 **[Live]** | Personal call + make-it-right note | IN DEMO |
| 53 | Happy customer — ask for a review | 🟢🟢 Strong positive | rating ≥ 4 + positive sentiment **[Live]** | Friendly review / testimonial ask | IN DEMO |
| 54 | Celebrate a milestone | 🟢 Positive | anniversary / usage high / first result **[Derived]** | Warm on-brand congrats, no ask | IN DEMO |
| 55 | No feedback in 60+ days | 🟡 Watch | `total_responses_30d` = 0 for 60d **[Live]** | Proactive "how are we doing" ask | NEW |
| 56 | Health reached thriving | 🟢🟢 Strong positive | `health_score_changed` (→ thriving) **[Live]** | Celebrate + tee up expansion | NEW |
| 57 | 1-year anniversary | 🟢 Positive | account_age_days = 365 **[Live]** | Loyalty moment + year-in-review recap | NEW |

---

## Summary

- **57 playbooks total** across the 7 marketplace categories (well past the 30 target).
- **~16 already in the demo** (`IN DEMO`); **~41 net-new** (`NEW`) to build.
- **All five of your named examples are covered:** #3 admin idle 30d · #12 renewal + idle 30d ·
  #16 funnel unpublished · #18 phone ported out · #34 workflows unpublished 30d post-signup
  (domain disconnect #17 already existed).

### Strongest churn signals (🔴🔴🔴 — wire these to human-first, automations-paused)
Phone ported out · Domain disconnected · Funnel unpublished · A2P lost · Cancellation requested ·
Churned · High-value account at-risk.

### Strongest happy signals (🟢🟢🟢 — wire these to expansion/upsell)
Spend surging · Hitting plan limits · Expansion ready.

### Feasibility note (honest about backend readiness)
- **[Live]** triggers (~most of the list) map 1:1 to System-A/B trigger types — buildable now.
- **[Reverse]** teardown plays (#16–24) rely on sticky-setup-reverse detection: modeled in the
  prototype fixtures, but the live backend signal for some (phone port-out, Stripe disconnect,
  calendar disconnect) needs confirmation. Safe for the **demo** (fixture-driven); flag for prod.
- **[Backend]** (#6 admin removed) needs a new backend signal.

### Proposed next step (on approval)
Wire the `NEW` plays into `playbooks.ts` (seed + meta + actions), add any missing criteria to
`criteriaCatalog.ts`, and seed matching fixtures so live counts render in the marketplace.
