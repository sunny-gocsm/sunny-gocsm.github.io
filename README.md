# @gocsm/design-system

The GoCSM design system as an installable React component library — the verdict-first, agentic
component set behind GoCSM's insight-to-action surfaces. **58 components**, design tokens, one
stylesheet, and adherence enforcement.

## Install
```bash
npm install @gocsm/design-system        # builds dist/ automatically via the prepare hook
```

## Use
Import components and link the single stylesheet **once** at your app root:
```jsx
import "@gocsm/design-system/styles.css";          // fonts + tokens + all component CSS
import { Verdict, SignalCard, Queue, PlaybookCard, AppShell, Rail } from "@gocsm/design-system";

<Verdict tone="risk" attribution="GoCSM AI">A payment failed 9 days ago and logins dropped 60%.</Verdict>
```
That one CSS import wires up Inter + JetBrains Mono, all design tokens, and every component's styles —
nothing else to link.

## Icons
Icons are real `lucide-react` SVGs, rendered through the internal `Icon` wrapper (`<Icon name="alert-triangle" />`),
so they render and re-render correctly in React / Lovable. `lucide-react` is a **peer dependency** — install it alongside this package:
```bash
npm install lucide-react
```

## Component inventory
- **Core primitives:** Button, Badge, Card, Checkbox, Input/Field, MetricCard, Tabs/TabItem, Toggle
- **Health:** HealthBadge, HealthTile, ScoreRing, Delta, PillarBar
- **Insight:** Verdict, WhyCard
- **Agentic:** ConfTag, LiveStatus, ActionReceipt
- **Shell:** AppShell, Rail/RailItem
- **Onboarding:** OnboardingStep, QueueRow
- **Action layer:** ActionButton · SaveWindow/SLAChip/StageChip/ExecChip · AutonomyDial/AutonomyBadge/
  AutopilotMeter · StageTile · ReceiptStrip/ReceiptStat · SignalCard/Queue · FixItCard · HealthStory ·
  NarrativeTakeaway · PlaybookCard/PlaybookDetail · GraduationPromptCard · SkillScheduleCard ·
  DraftReviewSheet/DraftBatch · BriefingHeader/DigestTristat · BriefingBody · QuickWinsChecklist ·
  WeeklyDigest · MyQueue · TeamPulseStrip · AssignmentRuleEditor · ProvenanceExpander/EvidenceBoundary ·
  HealthScoreEvidence · MethodologyExplainer · ActivityLog

## Design rules (enforced)
- **Locked health bands:** thriving (green) · healthy (blue) · watch (amber) · atrisk (red).
- **3-layer grammar:** Verdict → Action (queues, one verb per row) → Evidence (charts below the fold).
- **Autonomy:** internal alerts default Auto; anything customer-facing defaults Approve; committed sends
  carry a blast-radius line + ≥5s undo.
- **Numbers** render in JetBrains Mono. **AI surfaces** use the reserved indigo, never a band color.

## Scripts
```bash
npm run build    # compile → dist/ (ESM + CJS)
npm run lint     # adherence enforcement (ESLint): blocks raw hex/px, invalid props, internal imports
```

See `STATUS.md` for the full build provenance and the four findings resolved during the conversion.
