# @gocsm/web — production GoCSM app

The production GoCSM web app. Consumes `@gocsm/design-system` directly from
source as a workspace package (same wiring as `apps/prototype`), so design-system
changes hot-reload here with no build or sync step.

```bash
bun run dev --filter @gocsm/web   # from repo root, or `bun run dev` in this dir (Vite, :8081)
bun run build                      # from this dir
```

## Bringing in an existing production codebase

This is currently a minimal starter. If production GoCSM already lives in its own
repo, replace this shell with its history preserved:

```bash
# from the monorepo root, after removing the starter files in apps/web
git subtree add --prefix=apps/web <path-or-url-to-production-repo> <branch>
```

Then add `"@gocsm/design-system": "workspace:*"` to its dependencies, point its
bundler at the DS source (see `vite.config.ts` here for the alias pattern), and
run `bun install` at the root.
