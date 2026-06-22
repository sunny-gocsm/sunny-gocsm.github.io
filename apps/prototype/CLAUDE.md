# GoCSM — executive-pulse-check (Lovable app)

This is the GoCSM Lovable app. It vendors the standalone design system
`sunny-gocsm/gocsm-design-system` as **source** at `src/gocsm-ds/` (not an npm dep).

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
- **Two repos stay in sync:** DS change → push DS → `./sync-ds.sh` → commit+push app. App overrides
  live in `src/app-overrides.css` (sync-proof), never `gocsm-ds-overrides.css`.
- **Process:** single-threaded, NO forks; gate every push on a Playwright dual-lens audit
  (CDO + first-time HighLevel agency owner). Bar = looks worth $3k/mo, passes the 3-second test.

## Verify
App: `npx tsc --noEmit -p tsconfig.app.json && npm run build` (vite is the real CSS test). Dev server on :8080.
DS (in the sibling repo): `npm run build && npm run lint`.
