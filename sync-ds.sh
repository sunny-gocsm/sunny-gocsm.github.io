#!/usr/bin/env bash
# sync-ds.sh — vendor or refresh the GoCSM design system inside a Lovable project.
#
# WHY THIS EXISTS: Lovable creates and owns each project's GitHub repo (it cannot
# import an existing repo), and its build sandbox only sees files that physically
# live in the repo (so git submodules don't work — the folder would be empty in
# Lovable). This script copies the DS *source* into src/gocsm-ds/ as plain files
# Lovable can compile, and is safe to re-run any time the design system changes.
#
# USAGE (run from the project repo root):
#   ./sync-ds.sh           # pull DS @ main
#   ./sync-ds.sh v1.2.0    # pull a specific tag/branch/commit
set -euo pipefail

DS_REPO="https://github.com/sunny-gocsm/gocsm-design-system.git"   # use the https URL if you don't use SSH
DS_REF="${1:-main}"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

if [[ ! -d "src" ]]; then
  echo "✗ No ./src here. Run this from the Lovable project repo root." >&2
  exit 1
fi

echo "→ Fetching design system ($DS_REF)…"
git clone --depth 1 --branch "$DS_REF" "$DS_REPO" "$TMP/ds" 2>/dev/null \
  || git clone "$DS_REPO" "$TMP/ds" && ( cd "$TMP/ds" && git checkout "$DS_REF" )

echo "→ Vendoring DS src/ → src/gocsm-ds/ …"
rm -rf src/gocsm-ds
mkdir -p src/gocsm-ds
cp -R "$TMP/ds/src/." src/gocsm-ds/

echo "→ Pinning the icon peer dependency the DS expects…"
npm pkg set dependencies.lucide-react="^1.18.0" >/dev/null

echo "→ Writing the rem-base override (protects not-yet-migrated pages)…"
cat > src/gocsm-ds-overrides.css <<'CSS'
/* Restore 16px rem base for Tailwind/shadcn pages not yet migrated to the DS.
   The DS stylesheet sets html font-size:14px, which rescales Tailwind's rem unit.
   DS components are px-based, so forcing 16px here is safe for the DS and correct
   for Tailwind. This file MUST be the last CSS imported in the app entry. */
html { font-size: 16px; }
CSS

echo "→ Recording the pinned DS commit for traceability…"
( cd "$TMP/ds" && git rev-parse HEAD ) > src/gocsm-ds/.ds-version

cat <<'NEXT'

✓ Design system synced into src/gocsm-ds/

One-time per project — ensure src/main.tsx imports these IN THIS ORDER:
    import "./index.css";                  // app base: Tailwind + shadcn
    import "@/gocsm-ds/styles.css";         // DS tokens + components (DS wins)
    import "./gocsm-ds-overrides.css";      // MUST be last

Then commit & push (Lovable will sync it in):
    git add -A && git commit -m "Sync GoCSM design system" && git push
NEXT
