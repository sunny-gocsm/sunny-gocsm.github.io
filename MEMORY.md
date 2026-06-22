# GoCSM — project memory / context log

Durable, human- and agent-readable log of significant decisions and changes.
**Append a new entry on every check-in** (newest first) — see the discipline in `CLAUDE.md`.

---

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
