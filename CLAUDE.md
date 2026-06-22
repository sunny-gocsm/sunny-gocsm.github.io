# gocsm-playbooks — GoCSM monorepo

Bun-workspace monorepo. The **design system is the canonical source of truth**; the
prototype and the production web app both consume it directly from source.

Remote: `https://github.com/sunny-gocsm/gocsm-playbooks` (private).

## Layout
- `packages/design-system` — `@gocsm/design-system`: tsup-built component library, tokens, lint rules. The single UI source of truth.
- `apps/prototype` — `@gocsm/prototype`: the UI/UX prototype (Vite, **:8080**). See `apps/prototype/CLAUDE.md` for the design language + non-negotiables.
- `apps/web` — `@gocsm/web`: the production GoCSM app (Vite, **:8081**).

Both apps import `@gocsm/design-system` from source via a Vite alias + a
`workspace:*` dependency — edit the DS and both apps hot-reload. **No vendoring,
no sync step** (this replaced the old Lovable `sync-ds.sh` workflow).

## Commands (run from repo root)
- `bun install` — install the whole workspace (one lockfile: root `bun.lock`)
- `bun run dev` — prototype dev server (:8080) — **kept always running**, see below
- `bun run dev:web` — production app dev server (:8081)
- `bun run build` — build DS → prototype → web (the full verify gate)
- `bun run build:ds` / `build:app` / `build:web` — build one package

## Always-on dev server
`bun run dev` (prototype, :8080) is kept running **at all times** by a launchd agent
(`RunAtLoad` + `KeepAlive`). You never have to start it — open http://localhost:8080
anytime. Builds do **not** interfere (separate process). Logs: `.dev-server.log` (gitignored).

The agent definition is version-controlled at `ops/com.gocsm.dev.plist`.
- Install once (run yourself — sandboxed agents can't write to `~/Library`):
  `cp ops/com.gocsm.dev.plist ~/Library/LaunchAgents/ && launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.gocsm.dev.plist`
- Stop:    `launchctl bootout gui/$(id -u)/com.gocsm.dev`
- Restart: `launchctl kickstart -k gui/$(id -u)/com.gocsm.dev`

## Working discipline — KEEP CONTEXT CURRENT (non-negotiable)
On **every commit / check-in**, as part of the same change:
1. Update this `CLAUDE.md` if structure, commands, conventions, or workflow changed.
2. Append an entry to `MEMORY.md` (repo root): date, what changed, and why. Newest first.

`CLAUDE.md` + `MEMORY.md` are the durable project context that travels with the repo —
maintain them every check-in, not as an afterthought.

## Verify before pushing
`bun run build` from root must be green (DS → prototype → web).
