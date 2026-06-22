# GoCSM — project memory / context log

Durable, human- and agent-readable log of significant decisions and changes.
**Append a new entry on every check-in** (newest first) — see the discipline in `CLAUDE.md`.

---

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
- Pushed to `https://github.com/sunny-gocsm/go-csm-playbooks` (private).
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
