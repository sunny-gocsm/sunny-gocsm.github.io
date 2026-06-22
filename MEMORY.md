# GoCSM — project memory / context log

Durable, human- and agent-readable log of significant decisions and changes.
**Append a new entry on every check-in** (newest first) — see the discipline in `CLAUDE.md`.

---

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
