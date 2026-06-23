# GoCSM — project memory / context log

Durable, human- and agent-readable log of significant decisions and changes.
**Append a new entry on every check-in** (newest first) — see the discipline in `CLAUDE.md`.

---

## 2026-06-23 — Unify playbook setup: ONE 3-step wizard, reused by both entry points
Per Karthik: clicking a playbook from EITHER the catalog OR an Attention card must open the
SAME setup interface — no two flows. Converged everything on `AttentionActivation` (the one
full-page wizard) and reordered it to: **① What it does** (hero video + the play's real
outcome/does + social proof + "Open & modify it" → "I've completed this") **→ ② When & who it
runs on** (the trigger; CriteriaBuilder) **→ ③ Review & publish** (the two conditions in plain
English + Publish). `PlaybookDetailPage` is now a thin wrapper that renders the wizard (clicking
a playbook lands straight in setup at Step 1); the Attention queue's "Set up playbook" now
navigates to `/playbooks/:id` instead of opening its own modal. Added a "How to set up triggers"
explainer video to Step 2 (NEEDS KARTHIK: real clip; hero video also placeholder).
**Health gating (Phase 1) in the trigger step** — removed ALL health from both sides: the
field-picker drops the "health" group + any `health.*` field; NL compile, examples, recipe
templates, and suggestions strip health; a health-seeded recipe is degraded via `stripHealth`
(e.g. "at-risk & renewing" → "renewing in 30d"); and the right accounts pane (MatchWall) is
replaced with a plain count + "matched live" note. Review step shows no account rows in Phase 1.
All of it returns additively in Phase 2 (verified: accounts pane + health group reappear).
Verified live on :8080 across both entry points and both phases — Phase-1 scan = zero coined
terms on every step. `bun run build` green; prototype `tsc` clean. Branch `design/universal-ux-patterns`.

## 2026-06-23 — Playbook detail page: video-first, outcome-first 3-step activation
Rebuilt `PlaybookDetailPage.tsx` per the 04 brief. Structure top→bottom: (1) hero **video up
front** (first element; honest "coming soon" placeholder since `videoUrl` is empty — NEEDS
KARTHIK: source per-play hero video + the trigger-config clip), (2) plain-English outcome,
(3) social-proof + expected-impact **StatCards** using the new `caption` slot (Pattern 1: value
+ subtext, no naked numbers), then the **3-step activation**: Step 1 *What needs to be done*
(the action), Step 2 *The trigger* (firing rule + config explainer video; HL-native only in
Phase 1), Step 3 *Review scope & activate* with a confirm that restates trigger + action in one
sentence before the single Activate CTA. Lifecycle (Manage/Pause/Resume/Restore) preserved.
**Phase gating (Pattern 4):** a playbook whose firing condition is Health-derived (coined vocab
in its trigger OR its `problem`, e.g. "…healthy…") is GATED in Phase 1 — trigger + impact + scope
suppressed, Activate replaced by "Set up Health Config" (→ /configure). Fixed copy bugs found in
the live audit (used `outcome` not `does` so "GoCSM will …" reads grammatically; killed a double
period). Verified live on :8080: Phase-1 scan = **zero coined band/score/pillar/lifecycle terms**
(incl. "healthy") across both an HL-native play (`pb-no-login`) and a gated play
(`pb-expansion-ready`); Phase 2 unlocks the real trigger + Activate. `bun run build` green;
prototype `tsc` clean. Branch `design/universal-ux-patterns`, not merged.
NEEDS KARTHIK: the Phase-1 **catalog** (prompt 03) should hide health-intrinsic plays so the
gated detail state is an edge case (direct-nav fallback), not a primary path.

## 2026-06-23 — Attention: needs-attention queue, HL-native in Phase 1 (+ Health gating)
Built the needs-attention queue as Attention's lead layer, applying the GoCSM signal tiers.
New `src/fixtures/attentionSignals.ts` defines the queue's signal library in two tiers:
**Tier 1 "native"** (HL-native, always on — payment failed, no-login-14d) and **Tier 2
"health"** (GoCSM-computed, gated — e.g. dropped to At-Risk). Each signal leads with the
plain event (Pattern 3), carries a one-line "what this means" (Pattern 2), and runs its
cohort through the criteria engine so the count and the activation it opens always agree.
New `src/state/healthConfig.ts` is the Phase-1/Phase-2 gate (localStorage, defaults OFF =
no Health configured). `attentionQueue(healthConfigured)` returns native-only in Phase 1
and native+health merged (by priority) in Phase 2 — health JOINS, never replaces. Reworked
`AttentionPage.tsx`: the queue is the lead section (folds in the old Job-A playbook-activation
path — autopilot/draft states preserved, nothing lost); Job-B "Step in" kept, its coined
pillar reason gated so Phase 1 reads HL-native ("the issue is still open"). Added a clearly
labeled **Prototype preview** toggle to flip phases. Verified live on :8080 — Phase 1 render
scanned **zero coined terms** (no band/score/pillar/lifecycle); Phase 2 shows the At-Risk row
joining the queue. `bun run build` green DS→prototype→web; prototype `tsc` clean. Branch
`design/universal-ux-patterns`, not merged.

## 2026-06-23 — Policy: design-loop is now EXPLICIT-REQUEST-ONLY (never auto-invoke)
Per Karthik (it's very token-intensive), the `design-loop` skill must run **only when he
explicitly asks for it by name** — a general design/redesign/audit/UI task is no longer a
trigger; do that work directly, applying the design language. Flipped all four levers:
removed the `UserPromptSubmit` design-loop nudge hook from `~/.claude/settings.json` (the
per-turn "[STANDING POLICY]" injection; the nudge script is left on disk, unwired); rewrote
the policy in `~/.claude/CLAUDE.md` and the skill's `SKILL.md` description to explicit-only;
and updated this repo's `apps/prototype/CLAUDE.md` "Design work — start here" line to match.

## 2026-06-23 — Universal UX patterns codified into the design-loop skill + DS contract
Encoded seven product-agnostic UX defaults (feed-01 brief) so they apply on every future
surface. (1) No naked big numbers — every prominent stat/hero figure gets a one-line
plain-English explainer subtext; (2) self-explanatory labels; (3) speak the customer's
language, not coined terms; (4) progressive disclosure — gate advanced/coined systems
behind setup; (5) simplicity over completeness; (6) sell the outcome; (7) one click from
signal to action. Changes: added a **"Universal UX patterns"** section to the global
`design-loop` SKILL.md (wired into Phase 3 build + Phase 4 review as a baseline gate); added
a **"Universal content rules"** block to the DS **contract** (`packages/design-system/README.md`);
and made Pattern 1 buildable by adding an optional `caption` explainer slot to `StatCard`
(`.sc-caption`, `--t-body-sm`/`--text-3`, types updated). Kept strictly product-agnostic —
persona/native-vs-coined vocabulary/which-system-is-gated stay in the product context file.
**No token conflicts** (caption reuses existing muted-text tokens) → no NEEDS KARTHIK note.
Verified: `bun run build` green DS→prototype→web; DS lint clean; `OutcomesPage` audited —
every prominent figure already carries a label + explainer, no naked stats. Branch
`design/universal-ux-patterns`, not merged.

## 2026-06-23 — Fix: playbook setup footer pushed off-screen under a browser infobar
The setup-flow footer (Continue) vanished again — reproduced only with Chrome's
screen-sharing infobar present. Cause: `.aa-fullpage` used `height: 100dvh`, which can
compute taller than the visible area when an infobar/dynamic toolbar is shown, pushing
the fixed footer below the fold. Fix: `position: fixed; inset: 0` (pins the bottom edge
directly to the viewport bottom) — kept `.aa-body { min-height: 0 }` so it still scrolls.
Verified footer pinned at 1280×620 with the tall step-1 criteria builder. `apps/prototype` build green.

## 2026-06-23 — Fix: marketplace card "$ at risk" line shattered into fragments
The secondary $-impact line on marketplace cards reused `.mk-card-impact`
(`display: inline-flex; gap`), which turned each word/`<Mono>` into a flex item and
stranded fragments (e.g. a floating "in 2"). Gave it its own plain-text class
`.mk-card-risk` (`display: block`) so it wraps as a normal sentence, and tightened
the copy to "$X at risk · N accounts now". `apps/prototype` build green.

## 2026-06-23 — Playbooks page reimagined as a template MARKETPLACE
Full design-loop redesign of `/playbooks` (the main product surface — weekly new
releases). 5 blind research dossiers (template/app marketplaces, CS playbook libraries,
install-lifecycle+delete, AI-readiness, + code map) → CPDO brief
(`docs/design/cpdo-brief-playbooks-marketplace.md`) → build → 5-persona review panel.

- **3 decisions (Karthik):** (1) **Delete → Archive, not delete** — live/ever-run
  playbooks Pause/Unpublish → Archive (soft, recoverable, history kept); drafts Discard.
  No hard delete of anything that touched client accounts (research-backed: Salesforce/
  GitHub/HubSpot/app-stores all gate or omit it). (2) **Two tabs: Marketplace / Your
  playbooks** (app-store Browse vs Installed; status shown on catalog cards). (3) **Home
  = curated rows + 7-category filter** (not a category grid, not one flat list).
- **Marketplace tab:** an **"AI pick for you"** hero ranked by the agency's OWN at-risk $
  ("works on $X at risk across N accounts" + a plain "why this pick" line) — the single
  filled-blue focal action on the screen. Then curated rows **Most used · New this week ·
  Quick wins**, deduped so each playbook headlines one row. A single-row 7-category filter
  + result-first keyword search. **Cards are quiet click targets** (no per-card filled
  button — only the hero is loud; brief + persona panel both demanded this): outcome title
  → social proof ("2.4k agencies · 51k runs", the in-product differentiator no competitor
  ships) → labeled "$X at risk in N accounts now" only where real → quiet "Set up → / Manage
  → / Resume →". **Status lives on the card** (Live ✓ self-receding).
- **Your playbooks tab:** Live · Drafts · Paused · Archived, each with manage actions
  (Edit, Pause, Resume, Archive, Restore, Discard draft, Create from scratch).
- **Lifecycle vocab unified** (copy review): dropped "autopilot" and "Unpublish" → one
  model **Set up → Live → Pause → Resume → Archive → Restore**. De-jargoned the detail
  page ("dunning"→"payment retry reminders", "watches"/"armed" softened); effort labels
  "Ready to go / Quick setup / Add your wording".
- **AI dosage:** one explained, deterministic "AI pick" (it's *your* numbers, with a why-
  line); search is honest keyword ("Search playbooks — churn, onboarding, renewals…"), not
  fake NL. Generation (AI-draft-from-scratch) and a chatbot deliberately deferred/skipped.
- **Triggers tab REMOVED** — a playbook's trigger is just its "who it runs on."
- **Data/state:** enriched `playbooks.ts` with the 7-category taxonomy + marketplace
  signals (usedByAgencies, totalRuns, launchedDaysAgo, trending, effort) + 6 new playbooks
  (16 total; seed numbers, labeled as such). `autopilot.ts` gained `archived` + archive/
  restore + **localStorage persistence**. "Create from scratch" / draft-resume reuse the
  existing setup wizard.
- **Notable bug fixed in review:** horizontal-scroll rails collapsed (overflow:auto forced
  the cross-axis indefinite → cards blew to 100vh). Root cause is the flex/grid-scroll
  interaction; switched curated rows to capped wrapping `.mk-grid` (the proven no-overflow
  pattern). Verified mobile + desktop.
- **Files:** `apps/prototype/src/pages/PlaybooksPage.tsx` (rewritten), `.../PlaybookDetailPage.tsx`,
  `.../fixtures/playbooks.ts`, `.../state/autopilot.ts`, `.../app-overrides.css` (`mk-*`/`pbd-*`),
  + brief `docs/design/cpdo-brief-playbooks-marketplace.md`. `bun run build` green (DS → prototype → web).

## 2026-06-23 — Attention page + playbook setup flow: naming, audit, bug fixes
Two rounds of feedback on `/today` (the attention page) and the playbook setup wizard
(`AttentionActivation`). Research-backed (3 parallel agents: naming/titles, wizard
patterns, attention-page structure) via the design-loop; every change verified live.

- **Naming decision — "Playbook" is the user-facing noun (two-layer model).** Karthik
  chose: GoCSM calls the thing a **Playbook** everywhere; "workflow" appears only where
  it refers to the actual HighLevel object you open ("powered by a HighLevel workflow").
  Rationale (against Tim's "Workflows" suggestion): the setup literally opens a HighLevel
  **Workflow**, so naming our own thing "Workflow" collides for an owner who lives in
  HighLevel. Card CTA = "Set up playbook"; nav stays "Playbooks".
- **Attention page (`AttentionPage.tsx`):** title "Attention" → **"Needs attention"**;
  the "a playbook ran but didn't move" section retitled **"Step in — automation couldn't
  fix this"** and moved to the **top** (research: tabs hide the 2nd category — Baymard
  18–21% miss; Linear/ChurnZero use one page). It only renders when non-empty, so a
  brand-new user (no runs yet) lands straight on "Needs a playbook" — activation intact.
  Autopilot-on cards now show a next-run line ("Next run tonight · …") + an **Edit** action.
- **Wizard step labels (plain language):** "Who it runs on → **What it does** → Go live"
  (was "Set up the workflow" — reused the product noun). Header eyebrow "Set up a playbook".
- **Trigger context in later steps (#4):** a one-line, tap-to-edit **scope band** on step 2
  ("Runs on N accounts · <criteria> · Edit") that truncates instead of wrapping. It lives in
  the **fixed header stack** (NOT `position:sticky` — sticky overlapped the scrolling video
  and read as broken); content scrolls cleanly beneath it.
- **Publish gate redesign (#3):** replaced the fine-print "I've published it" checkbox with
  **two numbered steps** — ① Open in HighLevel, ② a real "I've published it in HighLevel"
  button that flips to a green "✓ Published in HighLevel" state (+ "Not yet" undo).
- **Steps 2 & 3 refactor (parallel session, `cpdo-brief-activation-steps-2-3.md`):** step 2
  keeps the **prominent walkthrough video** as a focal `VideoCard` (NOT a buried "watch" link
  — explicit Karthik call) above the "what's in the starter playbook" rows; step 3 "Go live"
  shows the **real accounts** the run touches (top-5 + "+N more") under a big audience count,
  autopilot defaults ON with a one-line pause.
- **Go-live confirmation (#8):** the bare "It's live" page → first a top-right toast, then the
  steps-2/3 refactor promoted it to a calm in-flow **success beat** ("Your playbook is live" —
  *Done* fires the toast + returns; *Pause for now* keeps the playbook but stops auto-runs).
  `sonner` is top-right. NB: this re-adds a full-screen confirmation, partially reversing the
  original #8 "remove the 4th page" ask — **flagged for Karthik to confirm the direction.**
- **"Draft saved" (#5):** header autosave chip says "Draft saved" (muted), not "Saved" —
  everything in the wizard is a draft until go-live.
- **Bug fixes (all root-caused):**
  - *Footer disappears with tall content (Advanced rule).* Root cause: the scrolling
    `.aa-body` lacked `min-height: 0`, so tall content refused to shrink and pushed the
    sticky footer below the fixed viewport. Fixed: `.aa-body{flex:1 1 auto;min-height:0}`,
    `.aa-fullpage` uses `100dvh`, footer `flex:0 0 auto` + safe-area bottom padding.
    (Stale-CSS HMR made this *look* unfixed in a long-open tab — restart dev server / hard
    refresh to pick up CSS-only changes.)
  - *"Saved" chip cropped to "SAV".* Root cause: header grid `1fr auto 1fr` let a long
    title squeeze the side columns. Fixed to `auto minmax(0,1fr) auto` — title truncates.
  - *"+" and "Add condition" read as two controls.* Root cause: DS `.rg-add` was scoped to
    `.rule-group`, so the standalone launcher fell back to a bare borderless block. Fixed in
    the DS (`components-v3-additions.css`): `.rg-add` styled unscoped → one cohesive pill.
- **Files:** `apps/prototype/src/pages/AttentionPage.tsx`, `.../PlaybookDetailPage.tsx`
  (CTA align), `.../components/attention/AttentionActivation.tsx`, `.../components/ui/sonner.tsx`,
  `.../app-overrides.css`, `packages/design-system/src/styles/components-v3-additions.css`,
  + new brief `apps/prototype/docs/design/cpdo-brief-activation-steps-2-3.md`.
  `bun run build` green (DS → prototype → web).

## 2026-06-23 — Fixed health-badge wrap + widened criteria preview pane
- **Symptom (trigger setup, step 1 "Who it runs on"):** in the right live-preview
  pane, the `At-Risk` health pill wrapped to two lines ("At-/Risk") and squeezed the
  account name so it truncated hard ("Organize Your Onlin…").
- **Root cause was the DS, not the app:** `.health-badge` (the *sole* band renderer,
  `packages/design-system/src/styles/components.css`) had no `white-space`/`flex-shrink`,
  so in the tight `.account-row` flex it wrapped and got squeezed. Fixed at the source —
  added `white-space:nowrap; flex-shrink:0;` so a status pill can never wrap/shrink in
  ANY consumer.
- **Layout (the app side, per Karthik's call):** the full-page builder had spare
  horizontal gutters, so widened the preview pane (`.cb-grid` right col `380px→460px`)
  and the page (`.aa-body-inner` `1180px→1320px`) in `apps/prototype/src/app-overrides.css`.
- **Verified live** (Playwright, 9-match case): 0/9 badges wrapped, 0/9 names truncated;
  `bun run build` green (DS→prototype→web). DS + app landed in one commit.

## 2026-06-22 — Created GoCSM signal knowledge base + playbook marketplace vision
- Built `apps/prototype/docs/design/gocsm-signal-knowledge-base.md` — the complete
  internal reference: MongoDB `prod_v2` collections, ClickHouse `prod` tables (both
  real-time MVs and nightly `*_v2_daily` scoring family), health scoring architecture
  (4 pillars → composite 0–100 + band), PAS sub-pillar internals, all 15 GHL feature
  types, both trigger systems (System A = live; System B = partly stubbed), the
  user-facing/internal boundary, MCP tool → signal map, and ~45 playbook scenarios
  across 8 categories.
- **Playbook marketplace vision:** the Playbooks tab redesign target is a marketplace-
  style catalog of pre-built trigger+action templates, tracked by popularity / trending /
  new / recommended across agencies. A Playbook = trigger criteria (the title) + action
  template (email/message, agency customizes to brand). Auto-memory updated with this
  vision.
- This is the durable knowledge base — do not re-derive these signals from the backend.

## 2026-06-22 — Renamed project to gocsm-playbooks
- Local folder: `~/dev/gocsm-monorepo` → `~/dev/gocsm-playbooks`.
- GitHub: `sunny-gocsm/go-csm-playbooks` → `sunny-gocsm/gocsm-playbooks` (old URL
  auto-redirects; local remote updated).
- In-repo: `package.json` name, this file, `CLAUDE.md` title + remote,
  `ops/com.gocsm.dev.plist` working-dir + log paths.
- Committed as `8d1d287 chore: rename project to gocsm-playbooks`, pushed to `main`.
- **Dev server action required (user must run):** the installed launchd plist still
  points at the old path. Run:
  `cp ~/dev/gocsm-playbooks/ops/com.gocsm.dev.plist ~/Library/LaunchAgents/ && launchctl bootout gui/$(id -u)/com.gocsm.dev 2>/dev/null; launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.gocsm.dev.plist`

## 2026-06-22 — Redesigned the trigger criteria builder (step 1 "Who it runs on")
- Rebuilt the Attention activation wizard's step-1 criteria surface
  (`components/attention/CriteriaBuilder.tsx`) into a real rule engine, via the full
  **design-loop** (research → CPDO synthesis → DS-first build → 5-persona review → ship).
- **Grounded in the REAL product:** researched the actual GoCSM backend (`csm-super-logger`)
  + live Mongo `prod_v2` + ClickHouse `prod`. The user-facing attribute/filter universe is
  saved at `apps/prototype/docs/design/gocsm-attribute-filter-catalog.md` (+ the design
  briefs + research dossiers under `docs/design/`). **Hard rule: PAS and the raw pillar
  scores are INTERNAL — never exposed as filters;** only health band/score/trend, lifecycle,
  priority, and observable drivers (feature usage, logins, NPS, MRR/spend, payments, renewals).
- **New DS primitives** (`packages/design-system`): `PromptArea` (multi-line NL hero),
  `RangeInput`, `DateRelativeInput`, `MultiSelectCombobox`, `RuleGroup`. Reused
  `SegmentedControl`/`FilterChip`/`Input` (Boolean = Yes/No segmented, never `Toggle`).
- **The surface:** multi-line "describe who this runs on" hero that compiles to editable
  sentence-chips; **Simple** (flat Match ALL/ANY) + **Advanced** (visible nested AND/OR group
  cards, one level deep — never a typed boolean string); typed control per value type;
  plain-English restatement always on top; live "runs on N accounts" count + MatchWall.
- Catalog re-seeded to ~24 real fields (Common-first picker); recipes re-seeded (PAS recipes
  dropped); `criteriaMatch` gained nested groups without breaking the flat path.
- Review panel routed a revision pass (NL "renewing" compile fix + partial-parse note,
  restatement grammar, right-rail de-clutter, vocabulary/copy). Verified live on :8080,
  0 console errors. `bun run build` green; tsc clean; 11 tests pass.
- Branch: `design/trigger-criteria-builder` (not yet merged/pushed — pending Karthik's review).

## 2026-06-22 — Migrated out of iCloud to ~/dev
- Moved the project from `~/Documents/Codebase/gocsm-playbooks` (iCloud-synced — risk of
  eviction/corruption of `.git`/`node_modules`; user had lost files this way before) to
  **`~/dev/gocsm-playbooks`** (outside iCloud's scope). Done via a fresh `git clone` from
  GitHub, then `bun install` — pristine plumbing; the old iCloud copy is left as a backup.
- Updated `ops/com.gocsm.dev.plist` WorkingDirectory + log paths to the new location.
- Dev server restarted from the new path (verified HTTP 200 on :8080). Build green.
- Canonical working dir is now `~/dev/gocsm-playbooks`. gh active account must be
  `sunny-gocsm` for push/fetch (it owns the private repo).

## 2026-06-22 — Monorepo created, pushed to GitHub, dev server made always-on
- Merged the former two repos — `executive-pulse-check` (Lovable UI/UX prototype) and
  `gocsm-design-system` (versioned DS) — into this **bun-workspace monorepo**.
  History of both preserved via `git subtree`.
- Prototype now imports `@gocsm/design-system` as a `workspace:*` package via a Vite
  source alias. Dropped the Lovable vendoring (`src/gocsm-ds/`, `sync-ds.sh`,
  `gocsm-ds-overrides.css`); folded the rem-base 16px fix into `app-overrides.css`.
- Added `apps/web` (`@gocsm/web`) — production GoCSM starter consuming the DS (port 8081).
- Single root `bun.lock`; per-package lockfiles removed. Renamed prototype package
  `vite_react_shadcn_ts` → `@gocsm/prototype`.
- Pushed to `https://github.com/sunny-gocsm/gocsm-playbooks` (private).
- Prototype dev server (:8080) kept always-on via launchd agent `com.gocsm.dev`.
  Agent definition version-controlled at `ops/com.gocsm.dev.plist`. NOTE: the coding
  sandbox cannot write to `~/Library/LaunchAgents`, so the one-time install must be run
  by a human (command in `CLAUDE.md` → Always-on dev server). For this session the dev
  server was started as a background process and verified serving HTTP 200 on :8080.
- Verify gate: `bun run build` from root (DS → prototype → web) — green.

### Standing rationale
- The DS is the canonical source of truth, consumed by both the prototype and the
  production web app. Monorepo (one repo, one commit for DS+app changes) was chosen
  over two-repos-plus-sync because Lovable — the only reason vendoring existed — was dropped.
