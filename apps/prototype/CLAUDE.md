# GoCSM — prototype (`@gocsm/prototype`)

The UI/UX prototype, an app in the **gocsm bun-workspace monorepo**. It imports the
design system as the workspace package `@gocsm/design-system` (source lives at
`../../packages/design-system/src`, aliased in `vite.config.ts`). There is **no
vendoring and no `sync-ds.sh`** — edit the DS in `packages/design-system` and it
hot-reloads here. (History note: this was formerly a standalone Lovable repo that
vendored the DS into `src/gocsm-ds/`.)

## Design work — start here
For any design/redesign/audit task, read **`docs/design/phase-2-playbooks.md`** (the
active brief + all carried-over context) and do the work directly, applying the design
language below. **Do NOT auto-invoke the `design-loop` skill** — it is token-intensive
and runs **only when Karthik explicitly asks for it** by name ("run the design loop").
Durable facts also auto-load from memory: `gocsm-design-language`,
`gocsm-ds-typography-gotchas`, `gocsm-today-activation`, `gocsm-ds-architecture`.

**Attention `/today` leads with an orientation layer, then the queue** (`src/pages/AttentionPage.tsx`).
H1 is **"Today"**. Above the queue: a **Layer 0 AI headline** (`components/today/TodayHeadline.tsx` — reuses
the DS `Verdict`, loads async with a skeleton + deterministic templated fallback) and **Layer 1 portfolio
tiles** (`components/today/PortfolioTiles.tsx` — clickable `StatCard`s that drill into Insights; Phase 2 adds
a health-distribution bar + revenue-at-risk + sentiment). All numbers come from `fixtures/orientation.ts`
(`computeOrientation` does the math/classification; `composeHeadline` only phrases it — the LLM stand-in).
**WoW deltas are intentionally suppressed** (no prior-period data in fixtures — never fabricate). A Phase-1
dismissible "Set up Health" nudge (`components/today/HealthNudge.tsx`) sits between tiles and queue.

**The queue itself is a state-driven lifecycle**: it pushes ONE goal per
account stage in a fixed precedence — a *manual action the user must take* always wins, and the **daily-report
setup nudge sits above the action list** (so they never miss one); the "turn on a playbook" activation only
leads while still reaching 3 live, after which it recedes to a standing "turn on a few more" (next 2). Cards
are **problem-first** (coloured urgency rail by `mrrKind` + money/accounts at stake in Mono → problem headline
→ elaboration). A **dev lifecycle switcher** (footer, persisted to `gocsm.attn.sim.v1`) simulates every state.
The full rationale + per-state behaviour is logged in the repo-root `MEMORY.md` (2026-06-25 entries).

**PRD (v2.0, functional):** `docs/prd/attention-and-playbooks-prd.md` is a **functional** spec
(the *what* & *why* — 9 sections, 7 epics, Given/When/Then ACs); it deliberately carries **no
API/endpoint/payload/infra "how"** (don't reintroduce it). **All catalog DATA is externalized to
`docs/prd/playbooks-catalog.json`** — the 57-play library, categories, situations, recipes, the
field/operator/filter universe, attention-signal defs, and each play's default Simple filters; the
PRD references it rather than inlining it. The companion `attention-and-playbooks-quickread.html`
(visual 15-min quick-read) tracks v2.0 — keep it in sync when the PRD changes.

**Trigger criteria builder** (step "When & who it runs on"): the user-facing attribute/filter
universe is `docs/design/gocsm-attribute-filter-catalog.md` (derived from the real GoCSM
backend + live DBs — **PAS & raw pillar scores are internal, never filterable**); the design
contract is `docs/design/cpdo-brief.md` + the v2 delta `docs/design/trigger-situation-v2-brief.md`;
supporting research in `docs/design/research/`. **Structure (v2):** `TriggerStep` is the 2-mode
shell — a live plain-English restatement of the audience at the top (the differentiator; no
competitor incl. HighLevel shows one) + a `Simple | Advanced` toggle; `CriteriaBuilder` is the
mode-driven body (**Simple** = prebuilt quick-add list, NO AI; **Advanced** = NL "describe your
audience" box → editable rules + the nested boolean builder). No separate "Runs automatically
when…" fact card (it duplicated a seeded chip). Note `account.priority` is an Account field
(Phase-1 safe), not `health.*`. The header control row carries a secondary "Watch how triggers
work" video disclosure (collapsed `VideoCard`, never rivals the hero); the live count band IS a
disclosure — expand to see the matching accounts (Phase 1 = plain name + monthly $, no Health
vocab; Phase 2 = the richer `MatchWall`).

## Outcomes page — three-question ladder (design-loop, 2026-06-30)
`/outcomes` (`src/pages/OutcomesPage.tsx`, data in `src/fixtures/outcomeLog.ts`, styles in the `.oc-*` block of
`src/app-overrides.css`) was rebuilt via the design loop (brief: `docs/design/outcomes-redesign-brief.md`) so a
non-technical agency owner climbs three **outcome-first** rungs, each labeled with the plain question it answers:
1. **"Is GoCSM worth it?"** — the impact hero: the big `$` once, an **un-invertible ROI** that shows BOTH protected
   `$` and `$` paid (never a bare multiple), a "work GoCSM did for you" line, and a **"How is this counted?"**
   disclosure carrying an **EXACT vs ESTIMATED** confidence gradient + the cost denominator.
2. **"Are the playbooks working?"** — `playbookScorecard()`: one row per activated playbook (objective + DS
   `StackedBar` outcome meter + honest numbers + verdict chip), sorted by $. **3-state verdict, color = meaning:**
   Working (green) · Early days (grey, small sample) · Needs a look (amber) — from `verdictFor()`, never hardcoded;
   % suppressed below n=3; a meter **legend** sits above the cards.
3. **"What exactly happened?"** — the audit log: ONE "Slice by" switcher (**Timeline · By playbook · By customer ·
   By channel** — channel is the differentiator vs HighLevel's email-only stats); grouped views collapse to
   countable headers; no-change rows carry no pill; every claim above drills into the log filtered (`drillTo`). The
   filter bar (search · **playbook** · customer · channel · outcome) uses a custom `FilterSelect` (button + anchored
   popover) — NOT native `<select>`, whose popups render huge + mis-positioned on macOS.

**Time window** stays a segmented control (pills keep the active range visible — best for the persona) labeled
**"Last 7 days · Last 30 days · Since install"** with the resolved calendar range shown under it (`windowDateLabel`);
the active **period echoes into every section** (`periodPhrase`) so the timeframe is always obvious. Default =
Since-install (this page leads with cumulative ROI).

**Honesty model (non-negotiable here).** Each account maps to exactly ONE primary situation (`primaryCategoryFor`)
so retention categories are mutually exclusive → **each saved customer's MRR is counted once** (no double-count).
All figures are computed in the data layer (episode-level: `impactSummary` · `playbookScorecard` ·
`channelBreakdown` · `impactVerdict` · `effectivenessLead`); **AI only phrases**, stamped
**"Calculated from your data · wording is AI"** (deliberately NOT "Numbers exact" — totals include estimates).
Never claim causality ("came back **after**", "kept", "recovered" — never "caused"). Attribution: automated sends
(email/SMS/card-retry/alert) = **autopilot**; call/task = **you & your team**. The honesty invariants are guarded
by `outcomeLog.test.ts`. **Phase-1 safe** — no coined Health vocab. No DS source change (meter retone is scoped to
`.oc-score-meter`). Same component also serves `/embed/outcomes`.

## Onboarding feature — imported from a Lovable export (self-contained module)
**PRD (v1.12, the dev contract):** `docs/prd/onboarding-and-activation-prd.md` is the standalone, canonical
Onboarding & Activation spec. Its top **"Changes made on 30 June 2026"** section + the **§11.1k** decision-log
entry are the developer's pickup list for the **two** 30 June design-loop redesigns: **Layer A — the Journey
Builder (§6, the `SetupWizard`)** and **Layer C — the Overview tracker (§8)**. The **Doer (§7) was unchanged** that
day. Two **hand-authored visual** companions sit beside the .md: `docs/prd/onboarding-changes-2026-06-30.html`
(the changes-first dev brief — read this to know what to build) and `docs/prd/onboarding-and-activation-quickread.html`
(the whole-product visual tour). Edit the .md as the source of truth, then update the two HTML quick-reads by hand
to match (there is no generator — a faithful full-text render was tried and retired as the wrong format).

The `/onboarding` surface is **not** built like the rest of the prototype. It was imported wholesale
from a separate Lovable app (TanStack Start + React 19 + Tailwind v4) and grafted in with **zero product
changes** — only integration plumbing. It lives, fully self-contained, under **`src/onboarding/`** and is
reached via the alias **`@onb` → `src/onboarding`** (in `vite.config.ts` + both tsconfigs).
- **Its own design system.** It does **not** use `@gocsm/design-system`. It ships its own shadcn `ui/*` +
  GoCSM `.jsx` primitives + token CSS. All styling is **scoped under `.onb-root`** (`App.tsx` wraps the
  onboarding routes in `<div className="onb-root">`): `src/onboarding/onb.css` (imported once in `main.tsx`)
  pulls in the `*.scoped.css` token/component files plus `_bridge.scoped.css`, which redefines the shadcn
  HSL-triple vars from GoCSM tokens *inside* `.onb-root` so the host's Tailwind `hsl(var(--x))` utilities
  render onboarding colors only there. **Don't add onboarding colors to the shared `tailwind.config.ts`** —
  scope stays in `.onb-root`. To regenerate the scoped CSS, re-run the PostCSS scoper (see the 2026-06-29
  `MEMORY.md` entry) against `src/onboarding/styles/*.css`.
- **Routing.** The Lovable TanStack file-routes were replaced by react-router routes in `App.tsx`
  (`/onboarding`, `/onboarding/journey`, `/onboarding/journeys/:id|new` → redirect, full-bleed `/doer-demo`).
  Feature components import navigation from **`@onb/router-compat`** (a shim over react-router-dom) — keep it
  that way; don't reintroduce `@tanstack/react-router`.
- **Journey creation = a guided WIZARD (design-loop, 2026-06-30).** `/onboarding/journey` is driven by
  `JourneyPage.tsx`, which has a **dev toggle** (`gocsm.onb.devmode.v1`) flipping `Brand-new user ⇄ Configured
  user`:
  - **New user → `SetupWizard.tsx`** (the primary): a **6-step, two-pane wizard** — Template → Steps → Order →
    Experience → Look & feel → Review — with a **PERSISTENT client preview pinned right** (live-updating). ONE
    calm decision per page, smart default pre-selected, plain language, sticky footer, labelled jumpable step nav.
    Full agency power lives as **progressive depth, not removed capability**: Step 2 rows each have a
    **Customize** that expands inline to edit the title, the "what your client sees" copy, the **completion
    method**, the video (default/custom), and **per-asset sub-steps** ("activate THESE 3 workflows" → N named,
    independently-verified tasks). **Asset steps** = the HighLevel features that live as a NAMED COLLECTION in the
    agency's snapshot: **workflows, funnels, forms, pipelines** (`ASSET_TYPES` in `catalog.ts`; each has an
    `assetNoun` with a per-type `verb`/`verbs` so copy reads "activate / publish / build / set up", never a generic
    "activate"). Integrations (GBP/FB/Stripe), domains, A2P, phone, calendar-connect, profile, kickoff are one-shot
    connections, NOT asset steps. Asset steps **are re-addable** — they stay in "Add a step"
    after one is placed (shown as "Another — …"), so an agency wanting three workflows as three separate steps can
    list them individually (the non-asset catalog features are one-shot and drop out of the picker once added). Each
    asset step's Customize has an **any-vs-specific scope** toggle (`Step.assetScope`, **defaults to "any"** — fresh
    templates seed asset steps as "any" with no preset assets, see `templates.ts`): _any_ ("any workflow counts" —
    nothing more to pick) or _specific_ → pick a **snapshot sub-account** (`Step.snapshotAccountId`) and choose **one
    named asset** (specific = exactly ONE asset per step; to activate three workflows, add three steps). Both the
    sub-account and the asset pickers are a **searchable single-select** (`SearchSelect` combobox — type-to-filter,
    since a snapshot can hold dozens). GoCSM "fetches" the chosen account's assets via `lib/snapshot.ts` (stub:
    `SNAPSHOT_ACCOUNTS` + `fetchSnapshotAssets`). The agency only picks the **sub-account once** — it's remembered
    (`rememberedSnapshotId`/`rememberSnapshotId`, localStorage `gocsm.onb.snapshot.v1`) and pre-selected on every
    later asset step. **Completion-method rule (important):** out-of-the-box catalog features
    (`canAutoDetect(type)` — i.e. every standard HighLevel step) are **ALWAYS auto-verified by GoCSM and locked**
    — the customize panel shows a fixed "GoCSM verifies this automatically" statement, NO picker (the agency
    can't downgrade our auto-tracking; that's the wedge). Only **custom** steps the agency adds (not in our
    inventory) get the picker — client-confirms / web-event / for-reference (no "auto", since GoCSM can't watch a
    custom action). `completionBadge()` forces auto for OOTB types regardless of any stored `detector`. Step 1 = a
    **template** (`lib/templates.ts`, 3 real subsets) or **blank**; Order = **up/down arrows**; Look & feel = the
    **visual placement mockups** (reuses `ClientPreview`'s `PlacementTab`) + brand colour **auto-detected**
    (`getHighLevelBrandColor()`) and shown "Pulled from your brand". **The auto-tracking USP is the wedge and must
    stay visible** — every row carries a recessive "Auto-verified" badge (exceptions render as pills that pop),
    the headers position "they teach, we verify + show who's stuck", and the build-time preview suppresses its
    "X of Y done" count (`ClientPreview hideProgressCount`).
  - **Configured user → `JourneySummary.tsx`**: a calm "Live" overview; each outcome-group/config row **"Edit ›"
    jumps into the wizard at the right step**; a quiet escape opens the advanced `JourneyEditor`.
  - Plain-language layer is shared in **`lib/plain-content.ts`** (PLAIN_TITLE, OUTCOME_GROUPS, plainTitle/plainSub,
    groupSteps, `completionBadge`, `previewJourney` — feed `ClientPreview` a pristine, custom-titled journey that
    KEEPS sub-steps so the per-asset tasks show in the preview).
  - **Deepest editing** (deep-links, plan variants, the blocking publish validation, per-step granular detail) =
    the existing `JourneyEditor`/`StepEditorPanel`, reached via the summary's "advanced editor" link or a
    `?step=<id>` deep-link. `SimpleSetup` was removed; the old 9-step `JourneyBuilder` is no longer routed.
  - **Keep the wizard primary and every page one easy decision (smart defaults), but DON'T strip capability —
    restore it as progressive depth behind Customize/More-options. Keep the auto-verify USP visible.** (See the
    2026-06-30 design-loop `MEMORY.md` entries.)
  - **Page gutter:** the DS `AppShell .main` has NO padding (prototype pages self-pad), so the in-shell
    onboarding routes get their gutter from the **`.onb-page`** wrapper (`App.tsx` `OnboardingLayout` → styled in
    `onb.css`: `max-width 1320 · centred · padding --s-6`). Don't add page padding inside `OnboardingIndexPage`/
    `JourneyPage` — it comes from `.onb-page`. (The full-bleed `/doer-demo` uses bare `.onb-root`, not `.onb-page`.)
- **Overview page = the design-loop "tracker" (`OnboardingIndexPage.tsx`).** The `/onboarding` landing surface
  was redesigned via the design loop (brief: `docs/design/onboarding-overview-brief.md`) for the ADHD agency-owner
  "who's stuck — let me unblock in one move" job. Hierarchy: **AI Verdict** (one dollar-led sentence, the only
  AI-marked element; trust stamp = "Numbers exact · wording is AI"; provenance + the "Where clients get stuck"
  funnel behind one collapsed disclosure) → **triage strip** (3 `StatusCard` tiles: Needs-you / Waiting-on-review /
  On-pace, each filters the surface) → **money-ranked hero queue** (`selectStalledByImpact` = mrr × days; one
  reason-appropriate primary verb per row; fires the undoable `ActionReceipt` w/ blast-radius + 5s grace) →
  all-clear reward state → collapsed relief strip → demoted full list. **Every verdict must derive from the seed,
  not hardcode** (the agency-bottleneck verdict reads `blocked_by === "agency"` so headline/CTA/queue stay
  consistent). `StatusCard` uses **per-side borders** (never the `border` shorthand) so the accent `borderLeft`
  doesn't conflict on rerender. All states are exercised via the `DevStrip` (demo + rollout modes).
- **Editing the feature:** treat `src/onboarding/` as vendored EXCEPT the design-loop surfaces above. Page entry
  points are `src/onboarding/pages/{OnboardingIndexPage,JourneyPage,DoerDemoPage}.tsx`; the journey-builder
  surfaces are `components/onboarding/{SetupWizard,JourneySummary}.tsx`. Only added dep is `@dnd-kit/*`.
  `/doer-demo`'s background is `assets/highlevel-bg.png` (a real bundled asset).

## Embeds (HighLevel custom-menu-links)
Three bare, nav-less URLs render the **same** page components for embedding as separate
HighLevel custom menu links (no "menu inside a menu"):
`/embed/attention` · `/embed/playbooks` · `/embed/outcomes`.
Mechanism: `AppLayout` reads a load-time `IS_EMBED` flag (`path starts with /embed`) and drops
the Rail/mobile bar, rendering `.embed-shell` + `<Outlet/>`. Each menu link is its own iframe,
so the flag stays fixed for that iframe — all in-iframe navigation stays nav-less. **No
duplication**: edits to the pages flow to the embeds automatically. To add an embed, add a
`/embed/<x>` route inside the `AppLayout` group in `App.tsx` pointing at the same page.

## Non-negotiables
- **Typography:** UI font is **Plus Jakarta Sans** (Inter fallback; set DS-wide via `--font-ui` +
  the Google Fonts `@import` in `packages/design-system/src/styles.css`); **JetBrains Mono** for every
  number/money/count via the `Mono` component. Never use inline `font: var(--t-*)` (invalid → text
  silently 14px) — use `fontSize`. `--t-h3/h4/h6` don't exist; real scale is `--t-display-xl/lg`,
  `--t-heading`, `--t-subheading`, `--t-body(-lg/-sm)`, `--t-caption`, `--t-label`.
- **Spacing/elevation tokens:** spacing scale skips `--s-7`/`--s-9` (steps are 1–6, 8, 10, 12, 16, 20) —
  using a missing step silently collapses to 0. Cards use the DS elevation tokens (`--sh-rest`/`--sh-hover`),
  never hand-rolled shadows. (See the typography-gotchas + spacing-elevation-gotchas memories.)
- **Design language:** bold title → quiet meta (red `$` via `.at-risk`) → clear CTA; one solid-blue
  focal action + soft-blue `.btn-accent` for the rest; cut low-value chrome; bigger/full-width.
  Reuse DS primitives (`FixItCard` title/meta + `[data-clickable]`, `.btn-accent`, `.rule-statement`).
- **One repo, one commit:** DS + app changes land together in `packages/design-system`
  and `apps/prototype` — no sync step. App-level CSS overrides live in
  `src/app-overrides.css` (imported last; it carries the rem-base 16px fix).
- **Process:** single-threaded, NO forks; gate every push on a Playwright dual-lens audit
  (CDO + first-time HighLevel agency owner). Bar = looks worth $3k/mo, passes the 3-second test.

## Verify
App (from `apps/prototype`): `tsc --noEmit -p tsconfig.app.json && bun run build` (vite is the
real CSS test). Dev server on :8080 (`bun run dev` from repo root).
DS (from `packages/design-system`): `bun run build && bun run lint`.
Whole workspace: `bun run build` from the repo root (DS → prototype → web).
