# GoCSM monorepo

Bun-workspace monorepo for the GoCSM design system and its consumers.

```
packages/
  design-system/   @gocsm/design-system — versioned component library, tokens, lint rules
apps/
  prototype/       @gocsm/prototype — UI/UX prototype (formerly the Lovable "executive-pulse-check" app)
```

## Why a monorepo

The design system is the canonical, versioned source of truth that feeds the
prototype today and the production GoCSM app next. The prototype consumes the DS
directly from source via a Bun workspace link + Vite alias — **no vendoring, no
`sync-ds.sh`, no two-place edits.** Change a DS component and the prototype
hot-reloads. DS and app changes land in a single commit.

Production GoCSM consumes `@gocsm/design-system` as a published, version-pinned
package (the `dist` build is preserved for that).

## Develop

```bash
bun install            # one install for the whole workspace
bun run dev            # runs the prototype (Vite, :8080)
bun run build          # builds DS then the prototype
bun run build:ds       # build only the design system (tsup -> dist)
```

## Design work

Design/redesign/audit tasks: invoke the **`gocsm-design-loop`** skill. The DS now
lives at `packages/design-system/src/` — edit it there directly; the prototype
picks it up live. See `apps/prototype/CLAUDE.md` for the design language and
non-negotiables.
