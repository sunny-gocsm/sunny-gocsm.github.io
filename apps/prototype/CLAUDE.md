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

**Attention `/today` is a state-driven lifecycle** (`src/pages/AttentionPage.tsx`): it pushes ONE goal per
account stage in a fixed precedence — a *manual action the user must take* always wins, and the **daily-report
setup nudge sits above the action list** (so they never miss one); the "turn on a playbook" activation only
leads while still reaching 3 live, after which it recedes to a standing "turn on a few more" (next 2). Cards
are **problem-first** (coloured urgency rail by `mrrKind` + money/accounts at stake in Mono → problem headline
→ elaboration). A **dev lifecycle switcher** (footer, persisted to `gocsm.attn.sim.v1`) simulates every state.
The full rationale + per-state behaviour is logged in the repo-root `MEMORY.md` (2026-06-25 entries).

**Backend PRD:** the full build spec for the Attention + Playbooks features lives at
`docs/prd/attention-and-playbooks-prd.md` (canonical data model, 7 epics, 44 stories,
265 acceptance criteria, research appendix) with a visual dev quick-read alongside it
(`docs/prd/attention-and-playbooks-quickread.html`). It's a self-contained handoff for
backend devs — grounded in this prototype's fixtures/state but written to stand alone.

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
