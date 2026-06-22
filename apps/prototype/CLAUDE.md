# GoCSM — prototype (`@gocsm/prototype`)

The UI/UX prototype, an app in the **gocsm bun-workspace monorepo**. It imports the
design system as the workspace package `@gocsm/design-system` (source lives at
`../../packages/design-system/src`, aliased in `vite.config.ts`). There is **no
vendoring and no `sync-ds.sh`** — edit the DS in `packages/design-system` and it
hot-reloads here. (History note: this was formerly a standalone Lovable repo that
vendored the DS into `src/gocsm-ds/`.)

## Design work — start here
Any design/redesign/audit task: invoke the **`gocsm-design-loop`** skill, then read
**`docs/design/phase-2-playbooks.md`** (the active brief + all carried-over context).
Durable facts also auto-load from memory: `gocsm-design-language`,
`gocsm-ds-typography-gotchas`, `gocsm-today-activation`, `gocsm-ds-architecture`.

## Non-negotiables
- **Typography:** never use inline `font: var(--t-*)` (invalid → text silently 14px) — use `fontSize`.
  `--t-h3/h4/h6` don't exist; real scale is `--t-display-xl/lg`, `--t-heading`, `--t-subheading`,
  `--t-body(-lg/-sm)`, `--t-caption`, `--t-label`. (See the typography-gotchas memory.)
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
