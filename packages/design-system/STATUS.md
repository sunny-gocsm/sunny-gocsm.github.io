# GoCSM Design System — package STATUS  ✅ COMPLETE

The finished Claude Design system, converted into a real, installable React component library.
**Every component is verified by building + linting it, and types are checked with `tsc` — nothing assumed.**

## What's in the box (all verified: build + adherence-lint + class-existence + tsc)
- **21 v3 primitives** (Button, Badge, Card, Input/Field, MetricCard, Tabs, Toggle, HealthBadge,
  HealthTile, ScoreRing, Delta, PillarBar, Verdict, WhyCard, ConfTag, LiveStatus, ActionReceipt,
  OnboardingStep, QueueRow, Rail, Checkbox) — already typed.
- **Action layer (§02–§07)** built on those primitives:
  - §02 ActionButton · SaveWindow/SLAChip/StageChip/ExecChip · AutonomyDial/AutonomyBadge/AutopilotMeter · StageTile · ReceiptStrip/ReceiptStat
  - §03 SignalCard (+Queue) · FixItCard · HealthStory · NarrativeTakeaway
  - §04 PlaybookCard · PlaybookDetail · GraduationPromptCard · SkillScheduleCard · DraftReviewSheet (+DraftBatch)
  - §05 BriefingHeader · DigestTristat · BriefingBody · QuickWinsChecklist · WeeklyDigest
  - §06 MyQueue · TeamPulseStrip · AssignmentRuleEditor
  - §07 ProvenanceExpander/EvidenceBoundary · HealthScoreEvidence · MethodologyExplainer · ActivityLog
- **Types:** `.d.ts` for every component (primitives proper; action/util named props), re-exported via
  `src/index.d.ts`, validated with `tsc --noEmit`.
- **Tokens + consolidated stylesheet** (`src/styles/*`, `styles.css`), runtime in `dist/` (ESM + CJS).
- Assembled page screens (08x) intentionally excluded — those are product, built in Lovable.

## Usage
```
npm install
npm run build    # → dist/ (ESM + CJS)
npm run lint     # adherence enforcement (ESLint)
import { Verdict, SignalCard, PlaybookCard } from "@gocsm/design-system";
import "@gocsm/design-system/styles.css";
```

## Four findings caught by RUNNING the code (not asserting)
1. **`_adherence.oxlintrc.json` enforced nothing under oxlint** — its rules are ESLint rules oxlint ignores.
   Fixed: enforcement runs via generated `eslint.config.js` (`npm run lint`), proven to catch hex/px/bad-props/internal-imports.
2. **6 off-grid `px` in primitives** — snapped to the 4px scale & tokenized (your call). px kept as a hard `error`.
3. **Claude Design's consolidation was incomplete** — complex components (§04 playbooks, §05 digest, §06 team,
   §07 evidence) had most styling trapped in their specimens. Finished the consolidation: lifted ~600 token-faithful
   rules into `components-v3-action.css`. Class-existence check passes for all 324 class tokens used.
4. **Adherence config rejected legitimate `onClick`/`aria-*`/`data-*`** on primitives (they spread `...rest`).
   Fixed: passthrough attrs allowed on all 21 primitives; design-prop *value* checks still fire.

## Recommended rollout (point-and-click + Claude Code where noted)
1. Put this package in its own private GitHub repo → publish as a private npm package.
2. Wire `eslint.config.js` into CI (GitHub Actions) + a pre-commit hook (husky/lint-staged) — your Pro-plan
   substitute for Lovable's Enterprise-only design-system adherence scanner.
3. Install it into the combined feature repo, replacing copied-in components.
4. In Lovable: a "GoCSM Design System" project connected to the repo + Workspace Knowledge (always-on rules)
   + a design-system Skill (SKILL.md) + Plan Mode + named-component prompting.

---
## Import-readiness (added for the GitHub → Lovable handoff)
- **AppShell** added (operator-shell layout: Rail + main + brand stripe) — 59 components total.
- **v3.1 — Lifecycle stages:** `StageBadge` (inline stage chip) + `StageProgress` (journey track) on a dedicated `--stage-*` cool-slate palette — a *structural* axis (deepen forward, fade on decline), deliberately never the health bands, so Health stays the only vivid signal. Verified: build (tsup ESM+CJS) + adherence-lint + oxlint + `tsc` + a render smoke-test from the built `dist`. **61 components total.**
- **README.md**, **.gitignore**, and a **`prepare` build hook** added (a git-based `npm install` now builds `dist/` automatically).
- The single `styles.css` already imports fonts + tokens + all component CSS, including the action layer.
- **RESOLVED — icons:** converted the static `data-lucide` tags to a `lucide-react`-backed `Icon` wrapper across all components (`lucide-react` is a peer dependency). All 43 icon names verified to resolve; build, lint, and types green — icons render as real SVGs in React.
