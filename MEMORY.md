# GoCSM — project memory / context log

Durable, human- and agent-readable log of significant decisions and changes.
**Append a new entry on every check-in** (newest first) — see the discipline in `CLAUDE.md`.

---

## 2026-06-25 — PRD v2.0: made functional, catalog externalized to JSON, founder-transcript rationale folded in
Reworked `apps/prototype/docs/prd/attention-and-playbooks-prd.md` (1478→1257 lines) per Karthik.
- **Catalog → JSON.** New `apps/prototype/docs/prd/playbooks-catalog.json` is the single source for all
  catalog DATA: 57 playbooks (each with a plain-English `defaultTrigger` + `defaultSimpleFilters`), 7
  categories, 5 situations, the filter universe (13 Simple quick-adds + 5 Advanced groups / 30 fields),
  6 recipes, enums, the operator map, attention-signal defs, predicate helpers. The PRD references it
  instead of inlining ~600 lines of tables (also fixed pre-existing C.2↔C.3 title drift).
- **Functional only (no eng "how").** Deleted §8's REST sketch → "§8 Capabilities the product must
  expose" (verb-free); scrubbed ~64 endpoint / "Backend/API notes" blocks across E1–E7 (gate grep for
  HTTP verbs/payloads = **0**); removed Mongo/MVs/cron, p95, serializer/idempotency-key/adapter
  mechanics; refunctionalized "As the system/backend / As an engineer" stories + engine internals +
  NFRs to product/behavior voice. Functional completeness preserved (9 sections, 7 epics, all ACs).
- **Transcript rationale folded in:** trial wedge = activating the automation SYSTEM (not selling
  insights); "no new concepts on day 1" (HL-native problems + the two actions; Health gated as later
  monetization); playbooks = concrete automations in a **growing library** (~57 today → hundreds),
  each a ~1-min video + an editable/brandable HL workflow snapshot; the **Action → Trigger → Review →
  *then* fires** sequence (owner acknowledges completion, no polling); deliberately-simple trigger
  (Simple = plan+priority base + playbook-aware quick-add; Customize → Simple|Advanced; describe→AI
  rules at a one-time per-activation cost; default criteria in plain English; live count + $ at risk);
  **one playbook = one HL workflow (1:1)** recording what was *tried* per account → the "tried but
  didn't fix it" Step-in signal. Reframed fixed "57" → "growing library (~57 today)"; version → v2.0.
- **Open item:** the founder transcript said Simple = "plan + priority only"; the shipped prototype uses
  the richer playbook-aware quick-add. Kept the shipped behavior + added an "Evolution note" reconciling
  both (anti-overwhelm). The `attention-and-playbooks-quickread.html` companion was **regenerated to
  match v2.0** (functional framing, "Capabilities" replaces the API table, catalog → JSON, "~57 growing").

## 2026-06-25 — Attention `/today` rebuilt as a calm, state-driven LIFECYCLE (design-loop pass 2–3)
Two more design-loop passes after the activation redesign below. Pass 2 (calm): research (ui-ux-pro-max +
frontend-design + 3 blind scouts) → Linear-style focus-order, cut density. Pass 3 (lifecycle): made the page
**LIVE** — it pushes ONE goal per account stage. Brief: `apps/prototype/docs/attention-calm-redesign-brief.md`.
- **Lifecycle precedence (the spec):** a *manual action the user must take* always wins; if the **daily report**
  isn't set up, that nudge sits **above** the action list (so they never miss one); the "turn on a playbook"
  **activation leads only while reaching 3 live**, then recedes to a standing "turn on a few more" (next 2,
  forever). Before 3, activated plays show **✓ Live** and the solid-blue CTA moves to the next one (path-to-3
  stack stays 3 cards). Logic is generic over `(liveCount, digestOn, failures)` so "live" mode works too.
- **Problem-first cards (signature):** a colour-coded **urgency rail** by `mrrKind` (risk red / grow green /
  renewal amber) + **money & accounts at stake in JetBrains Mono** as the eyebrow → the **problem** headline →
  an always-present elaboration → one CTA. Primary card wins via DS elevation + a thicker rail; secondary cards
  keep full details but a quiet "Turn on →" link so only ONE solid-blue action shows per screen.
- **Dev lifecycle switcher** (footer, persisted to `gocsm.attn.sim.v1`) simulates every state — Brand new →
  1/2 on → "an account needs you (report off)" → 3-on set-up-report → report-on issues → all caught up.
- **DS changes (global):** UI font **Inter → Plus Jakarta Sans** (`--font-ui` + the `styles.css` `@import`;
  JetBrains Mono kept for figures). Discovered the spacing scale **skips `--s-7`/`--s-9`** (a missing step
  silently collapses to 0 — caused the earlier "weak spacing") and that cards must use `--sh-rest`/`--sh-hover`
  elevation, not hand-rolled shadows (caused "card barely visible"). Saved to `gocsm-ds-spacing-elevation-gotchas` memory.
- **Frozen on the final pass** per Karthik: card structure, contents, layout, spacing, fonts are locked — the
  last iteration changed **only orchestration** (what shows, in what order) + the permitted "Live" state.

## 2026-06-25 — Attention `/today` redesigned via the design loop: activation, prioritization, escalation
Ran the full **design-loop** (research → CPDO synthesis → DS-first build → 3-reviewer panel + close-out
verifier → ship) on the Attention page. Brief: `apps/prototype/docs/design/attention-activation-brief.md`.
**The page is now ONE adaptive surface** (decided the activation-vs-ops split decisively — not a separate
getting-started route): it drives playbook **activation** first, then **recedes** into daily triage.
- **"Start here today"** — a deterministically-ranked top **2–3** plays to turn on now (`recommendedPlays()`
  in `playbooks.ts`: non-live, matches accounts today, ranked at-risk MRR → count → popularity; Phase-1
  excludes coined-Health copy). The wedge vs every CS competitor's sortable *wall*. #1 is a **full-width
  focal** card (one solid-blue action); #2/#3 a quieter pair. Stakes on the card: $ + named accounts +
  one-line reason + one-click "Turn it on" + quiet "Not now".
- **Money valence** (`mrrKind`/`MRR_KIND_NOUN`) so a card never mislabels expansion/renewal as "at risk":
  **MRR to grow** (green) / **MRR up for renewal** (amber) / **MRR at risk** (red), keyed off `signal`/copy.
- **Honest framing (the panel's #1 fix):** the rank is **deterministic**, so the module is labeled
  **"Recommended"** — NOT "AI pick" (stamping arithmetic as AI overclaims and erodes trust). No violet AI
  accent anywhere on the page. The summed line reads as a **subset of the hero total** ("cover $X of your
  $Y at risk") — fixes the "broken math" read where the dedup'd union ≈ the #1 card.
- **Adaptive recede:** while `liveCount < 3` → full module; once ≥3 plays live → slim green graduation
  banner ("You're live — N running. Check back here for the accounts that still need you.").
- **"Notify me" escalation config** (`state/notifyConfig.ts`, new) on the Step-in section — operator-grade,
  NOT a rules engine: channel chips (Slack · Email · Asana, Connect-stubbed) × cadence (Daily digest vs
  Each one) + "Also notify the account's owner" (semantic token). So the owner is told where they work
  (Slack/email/Asana) instead of visiting `/today` daily. No AI in routing.
Files: `pages/AttentionPage.tsx` (full rewrite), `state/notifyConfig.ts` (new), `fixtures/playbooks.ts`
(`recommendedPlays`, `mrrKind`/`MRR_KIND_NOUN`, `RecommendedPlay`), `app-overrides.css` (`.sh*`, `.notify*`).
PRD updated: **E2** intro + new stories **E2.7** (Start-here ranking), **E2.8** (adaptive recede/graduation),
**E2.9** (Notify-me escalation), **§5.5.3** (`recommendedPlays`/`mrrKind`), **§5.11** (NotifyConfig).
`bun run build` green (DS→prototype→web); verified on :8080 (activation, graduated, expanded-notify states,
0 console errors). HTML quick-read not refreshed.

## 2026-06-25 — Playbook-aware Simple-view filters + "Who this fires for" hero box
Step-2 trigger builder upgrades. (1) **Playbook-aware default filters**: classified all 57 plays
account-level vs user-level (`Playbook.audienceKind`; 11 are user-level — the login / individual-user
triggers like pb-no-login, pb-admin-removed, pb-power-user). `defaultFiltersFor(playbook)` (playbooks.ts)
returns the Simple-view quick-add fields: table-stakes (Priority account · Plan · Last login) on EVERY
play + a per-category domain pack + a user pack (User role · Key users · A user gone quiet) ONLY for
user-level plays. Threaded AttentionActivation → TriggerStep → CriteriaBuilder via `quickAddFields`;
CriteriaBuilder's static QUICK_ADD became a field-keyed `QUICK_SPEC` + regroup-by-display-group.
(2) **"WHO THIS FIRES FOR" hero box**: the live plain-English restatement (`describeSet`) is now a
distinct, prominent soft-blue box at the very top of step 2 — the unmistakable hero — updating live as
criteria change (brings back the "distinct box on top" pattern Karthik liked; replaces the quiet inline
line). (3) **Blue video link**: "Watch how triggers work" is now hyperlink-blue so it reads as clickable.
Files: `playbooks.ts`, `CriteriaBuilder.tsx`, `TriggerStep.tsx`, `AttentionActivation.tsx`,
`app-overrides.css`. PRD updated: `audienceKind` in §5.5.1, **AC E5.3.1a** (playbook-aware defaults),
**E5.5** (hero box), and a new **§9.C.3** with the classification rule + the full 57-play → default-filters
mapping. `bun run build` green; verified on :8080 (user-level play shows the Users filter row,
account-level shows none; hero box + blue link render). The HTML quick-read was not refreshed.

## 2026-06-24 — Backend PRD for Attention + Playbooks (+ visual HTML quick-read)
Authored a developer-ready PRD for the Attention + Playbooks features so backend devs (and their
Claude Code) can build the backend with the least effort. `apps/prototype/docs/prd/attention-and-playbooks-prd.md`
— ~27k words / 1,357 lines: §1–§4 overview/goals/personas/glossary, **§5 canonical domain model & data
dictionary** (Account 11 sub-objects, Signal, the 30-field criteria catalog + per-operator semantics, the
matching engine, all 57 plays + predicates, autopilot state machine, recipes, drafts, the Phase-1/Phase-2
Health gate), **§6 seven epics → 44 user stories → 265 Given/When/Then acceptance criteria** (E1 platform ·
E2 Attention queue · E3 catalog · E4 setup flow · E5 trigger builder & matching · E6 lifecycle/autopilot ·
E7 HighLevel integration & embeds), §7 NFRs, §8 suggested REST API, §9 research-evidence appendix + the
full catalog. Process: 4 CPO/PM-style agents extracted exact ground truth; epic authoring was delegated to
CPO/PM agents (E1/E4/E7 landed; 3 stalled on a stream watchdog, so E2/E3/E5/E6 were authored directly and
E1/E4/E7 recovered from the agent transcripts via shell — assembled with a python splice). Also built a
**self-contained visual HTML quick-read** (`attention-and-playbooks-quickread.html`, no external deps —
architecture/phase-gate/state-machine/flow diagrams, 7 epic cards, API tables) at 100% fidelity; verified
in-browser. A pointer was added to `apps/prototype/CLAUDE.md` (Design work section).

## 2026-06-24 — Trigger step: explainer video back + expand-to-see-matching-accounts
Two additions to the "When & who it runs on" step (`TriggerStep.tsx`), placement decided via a
frontend-design (CDO) consultation agent. **(1)** Brought back the "How triggers work" explainer
video (removed in the v2 refactor) as a **secondary, on-demand disclosure** on the header control
row — a caption-weight "▸ Watch how triggers work · 1 min" toggle that expands a width-capped
(320px) `VideoCard` inline; never rivals the restatement hero or the Continue focal action, and
step 1 already carries the big play hero. This also moved the restatement to full width below the
control row (eyebrow · video · mode-toggle). **(2)** The live count band is now a **disclosure**:
"N match · See who" expands the actual list of matching accounts (`matchAccounts(set)`, sorted by
$ desc, scrollable). Phase-1-safe: plain **name + monthly $** only (no Health bands/scores); Phase 2
(Health configured) reuses the richer `MatchWall` (which is no longer always-on — decluttered into
the disclosure). New CSS: `.ts-video-toggle/.ts-video`, `.ts-count` as a button + `.ts-matches*`.
`bun run build` green; tsc clean; both disclosures verified on :8080 (0 console errors).

## 2026-06-24 — Design-loop v2: Situation rename + two-mode trigger + top restatement
Ran the full **design-loop** (research → CPDO synthesis → build → 5-lens review → ship) on three
linked changes; brief at `apps/prototype/docs/design/trigger-situation-v2-brief.md`. **(1) Situation
rename** — the Playbooks marketplace `signal` filter reused the gated, coined account-Health bands
(At-Risk/Watch), which also leak onto a Phase-1 trial surface. Relabeled (values unchanged) to plain,
non-colliding words **Critical · Slipping · Steady · Strong · Booming** (Karthik picked Slipping over
his floated "Urgent", and Booming over "Surging", at the gate); diverging warm→neutral-grey→cool dots,
label always paired. **(2) Two modes** — collapsed the old three (TriggerStep narrowing → "Customize
advanced" → CriteriaBuilder Simple/Advanced) into **Simple** (prebuilt quick-add list, NO AI) and
**Advanced** (NL "describe your audience" → editable rules + nested boolean builder). `TriggerStep` is
now the 2-mode shell; `CriteriaBuilder` the mode-driven body. **(3) Restatement** — one live
plain-English audience sentence promoted to the TOP ("Runs on accounts where …"), removed from the
body. Review-driven fixes: **removed the "Runs automatically when…" fact card** (it duplicated a seeded
editable chip — the panel's one major finding); de-duplicated the match count (inline band only);
de-jargoned copy (Monthly revenue, Browse all fields, Renewing soon). Recategorized `health.priority`
→ `account.priority` (an agency flag, not coined Health → Phase-1 available). Files: `playbooks.ts`,
`PlaybooksPage`? (no — labels via SIGNAL_LABEL), `TriggerStep.tsx`, `CriteriaBuilder.tsx`,
`AttentionActivation.tsx`, `criteriaCatalog.ts`, `criteriaMatch.ts`, `AttentionLab.tsx`,
`app-overrides.css`. `bun run build` green; tsc clean; Playwright dual-lens verified on :8080.

## 2026-06-24 — Playbook "Situation" rating (churn↔expansion) on cards + left filter
Materialized the churn↔expansion rating that was only conceptual after the 57-play expansion (plays were
grouped by section comments; no per-play field existed). Added a **`signal: PlaybookSignal`** field
(`apps/prototype/src/fixtures/playbooks.ts`) — a 5-band scale **Critical · At risk · Watch · Positive ·
Very positive** (worst→best), with `SIGNALS`/`SIGNAL_LABEL` exports. All 57 plays rated in `PLAY_META`,
grounded in each play's `problem` (distribution **16 / 15 / 13 / 8 / 5**). Surfaced two ways in
`PlaybooksPage.tsx`: (1) a `SignalPill` (colored dot + label) in each market card's top-right `.mk-card-tags`
cluster, stacked under any Live/New/Trending status; (2) a new **"Situation"** left-rail facet (under
Category) — multi-select with dot swatches + live counts that honour the other facets (`sigCounts` memo).
Diverging red→green colors in `app-overrides.css` (`.mk-sig` / `.mk-sig-dot`). NB: `signal` is the play's
severity band, distinct from the detected `signals` events. Verified on :8080 via Playwright (filter narrows
grid + cross-facet counts re-tally, 0 console errors); `bun run build` green; tsc clean.

## 2026-06-24 — Playbooks → "Library" storefront + Attention MRR-at-risk
Three UX changes after the 57-play expansion. (1) **Renamed** the Playbooks "Marketplace" tab/copy to
**"Library"** (`PlaybooksPage.tsx`, TabId `marketplace`→`library`). (2) **Amazon-style storefront**: replaced
the top pill bar + curated-rows home with a **sticky left filter rail** (`.mk-catalog`/`.mk-filters` in
`app-overrides.css`) — facets for Category (single-select, live counts), Setup effort + Highlights
(multi-select checkboxes), search, and a sort control (Most used / Highest impact / Newest) — beside the
**full grid of all 57 plays**. This also fixed the report that "new plays can't be found": the old home only
rendered ~13 curated cards, hiding the other ~44 behind a category/search filter; the catalog now shows
everything by default. A single AI-pick hero still leads the unfiltered view (promoted out of the grid to
avoid dupes). (3) **Attention page** (`AttentionPage.tsx`, the `/today` Index): brought back a hero metric
ribbon showing **N sub-accounts need attention + $X MRR at risk** (sum over unique matching accounts), and
each queue row now shows its own `$ MRR at risk · Customer A, B +N more` note (the "different customers"
behind the event) on both autopilot and actionable rows. Verified live on :8080 via Playwright (0 console
errors). `bun run build` green; tsc clean.

## 2026-06-24 — Playbook library expanded to 57 (grounded, live counts)
Grew the marketplace catalog from ~16 to **57 playbooks** (`apps/prototype/src/fixtures/playbooks.ts`),
each a real signal→action play rated on a churn↔expansion spectrum (🔴🔴🔴 critical churn … 🟢🟢🟢 hot
expansion). The full rated catalog + rating legend + feasibility tags lives in
`docs/design/playbook-library-v1.md`. Grounded in `gocsm-signal-knowledge-base.md` (live Mongo/ClickHouse
schema + System-A/B trigger types) — observable drivers only, never PAS/pillar scores. Each play has a
pure `match()` over the Account model; **55/57 render live matching-account counts + MRR impact** (the 2
zeros — `pb-admin-removed`, `pb-churned-winback` — are honest structural rarities). To support the new
plays, `index.ts` gained: `Email`/`Calendar` signal subjects; 5 sticky-setup-REVERSE "teardown" signals
(phone port-out, email/Stripe/calendar disconnect, workflow turned off — the heaviest churn tells); 2 new
onboarding accounts (day-7 ghost `a-dayspring-coaching`, day-1 welcome `a-harbor-fitness`); and field
tweaks (Modern Physio detractor NPS, Evergreen recent upgrade, Organize downgrade, Paws underutilized
features). No `criteriaCatalog.ts` change — it already covers every field the triggers read. The 3 prior
`() => false` plays (nps-detractor, milestone, upsell-limit) now have real matches. `bun run build` green
(DS→prototype→web); 11/11 vitest pass; tsc clean.

## 2026-06-23 — Prototype deploys to GitHub Pages at the org user-page (root)
Stood up continuous deploy of **`apps/prototype`** to https://sunny-gocsm.github.io/. To serve at
root (`base: "/"`) we renamed the GitHub repo `gocsm-playbooks` → **`sunny-gocsm.github.io`** (the
user-page repo name); the local workspace/package names are unchanged, `origin` now points at the
renamed repo. Pages source switched from legacy-branch to **GitHub Actions** (`build_type: workflow`).
`.github/workflows/deploy.yml` builds the prototype on push to `main` and runs `actions/deploy-pages`.
Two Vite changes (`apps/prototype/vite.config.ts`): (1) a `spa-404-fallback` plugin copies
`index.html`→`404.html` at build so Pages serves the SPA shell on deep-link refreshes (no server
rewrite on Pages); (2) `manualChunks` splits the old single 1.8 MB bundle into long-cacheable chunks
— `vendor` (381 kB), `charts`/recharts (321 kB), `icons`/lucide (810 kB), app `index` (336 kB) — so
app edits only re-download `index`. **Only big LEAF libs are split** (recharts, lucide); splitting
non-leaves (react/radix) caused `vendor<->chunk` circular-chunk warnings (vaul→radix, react-dom→…).
Known wart: the 810 kB `icons` chunk — lucide-react v1.x's ESM entry re-exports an `icons` namespace
barrel that this Rollup can't tree-shake, so all ~1,500 icons ship. TODO: deep per-icon imports or
pin lucide. Also cleaned the Lovable placeholder `<title>`/author in `index.html`. `bun run build`
green (DS → prototype → web). Git identity for this repo is now `sunny-gocsm` / sunny@gocsm.com.

## 2026-06-23 — Nav-less embed routes for HighLevel custom-menu-links
To start selling the prototype via HighLevel custom menu links, added three bare URLs that
render the SAME page components with NO left nav (no "menu inside a menu"):
`/embed/attention` · `/embed/playbooks` · `/embed/outcomes`. Mechanism: `AppLayout` reads a
load-time `IS_EMBED` flag (`window.location.pathname.startsWith("/embed")`) and, when set, early
-returns `.embed-shell` (brand stripe + `<Outlet/>`) instead of the `AppShell`+`Rail`. The three
routes live inside the existing `AppLayout` group in `App.tsx` pointing at `Index`/`PlaybooksPage`/
`OutcomesPage` — **zero duplication**, so the embeds update whenever the pages do. Because the flag
is read once per page load and each menu link is its own iframe, all in-iframe navigation (e.g.
drilling into a playbook) stays nav-less. New `.embed-shell` CSS (min-height:100vh, bg `--bg`).
Normal app (non-/embed) keeps the Rail — verified. `bun run build` green; tsc clean. Branch
`design/universal-ux-patterns`.

## 2026-06-23 — Design-loop: redesign the trigger step + kill the success page
Ran the full design-loop (Karthik explicitly invoked it) on the wizard's Step 2 "When & who".
**Research** (3 parallel dossiers: workflow builders · CS platforms · filter-chip/PD): strong
convergence — Customer.io literally *deleted* its second filter level (Apr-2025) as a UX defect;
HubSpot "one refine by criteria"; Salesforce/ActiveCampaign hide advanced; nobody ships two
identical pill rows; **zero leaders embed a hero video in a builder**. **CPDO north star:** *the
trigger is a fact you confirm; narrowing is one optional dropdown defaulting to everyone;
everything else one click away.* **Build:** new `TriggerStep.tsx` replaces the busy CriteriaBuilder
view at rest — (A) read-only **trigger fact** ("Runs automatically when …") + a small "How triggers
work" link (video demoted from hero), (B) **labeled narrowing dropdowns** (Account value, Plan)
each defaulting to "All" — the two-identical-pill bug is fixed by *removing* the 2nd pill (the label
is the field; user only touches the value), (C) a **live audience count** (accept-and-publish
confidence). Cut at rest: NL box, suggestion pills, plain-English restatement, two-level pills,
accounts pane, hero video. The full builder survives behind **"Customize (advanced)"**. Phase-1
Health gating preserved (narrowers are HL-native; base trigger health-stripped).
**Success page removed** (`LiveSuccess` deleted): Publish → a single **green toast** (top-right,
"Your playbook is now live", styled with `--pos-*`) + return to where the user came from
(`location.key` guard; `navigate(-1)` else `/playbooks`). **Live review** (both phases, Playwright)
found + fixed a cold-load back-nav→about:blank bug; verified zero coined terms, live count reacts
to narrowing, advanced discloses the builder, green toast fires. `bun run build` green; tsc clean.
Branch `design/universal-ux-patterns`, not merged.

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
