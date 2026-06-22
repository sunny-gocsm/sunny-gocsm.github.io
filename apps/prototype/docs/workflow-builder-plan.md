# Design plan — Workflow Builder redesign (3 action items)

> Phase 1 output. Grounded in competitive research (full-page builder IA + account-preview layouts).
> Discipline: gocsm-design-loop. Branch: `workflow-builder-redesign` → merge to main.

## Action 1 — Full-page 3-step workflow builder (replaces the modal)
**Why:** modals can't host multi-step wizards (Smashing); the modal collapses real estate.
**IA (from Totango/Marketo/Braze + Carbon/Atlassian/PatternFly stepper specs):**
- **Persistent problem-context header** (top, fixed): back-breadcrumb ("← Attention") + the **problem name as a big bold title** ("Renewing in 30 days & at-risk") = the *which problem* answer + a one-line goal; "Saved" status on the right.
- **3-marker labeled `Stepper`**: **① Who it runs on → ② What happens → ③ Go live** (Marketo who/what/when). States: done=✓ + clickable-to-revisit; current=solid-blue, exactly one; upcoming=muted, locked (sequential).
- **Step ①** = the two-pane criteria builder (pre-filled from the clicked problem) + the new accounts preview (Action 3).
- **Step ②** = full-width action editor (the workflow steps) + a pinned "Running on N accounts" chip so the *who* never disappears.
- **Step ③** = centered review: **Who / What / Autopilot** summary cards (each with Edit→jump back) + one decisive **"Start the run"** (specific verb) + optional "Run once" dry-run.
- **Sticky footer**: Back (ghost `.btn-accent`) + ONE solid-blue primary labeled with the next step ("Continue to actions →" / "Continue to go-live →" / "Start the run"); gated until the step is valid.
- **ADHD contract:** always on screen — *why* (problem name) · *where* (stepper) · *what's next* (footer). One decision per step. Never blank. No dead-ends.

## Action 2 — PromptField double focus ring
**Root cause:** the app's global `:focus-visible` rings every `input`, while `.prompt-field:focus-within` rings the container → two rings. **Fix (DS):** suppress the inner `.pf-input` focus ring; the container focus-within is the single ring.

## Action 3 — Accounts preview: ROWS, not tiles
**Why:** tiles (~90px) force "Cedar Cli…" truncation; a row at full pane width gives the name 250–300px → no truncation, and right-aligns MRR into a comparable column. Every CS/CDP preview uses rows.
- **Row anatomy** (~44px): **`Monogram`** (deterministic color from name) → **health pill** (`HealthBadge` — named tier, not a bare dot) → **full name** (ellipsis only if truly clipped) → **MRR right-aligned, tabular-nums**.
- **Shrinking-wall feel:** pinned big count that animates (rows fade-and-collapse out); a slim **breadth meter** under it ("Too broad → Focused → Too narrow") that slides toward "narrow" as you filter. Sort by MRR desc; show ~12 + "View all N".
- **Now vs forecast:** two labeled sections — "Matches now (N)" solid rows; divider; "Likely this week (N)" **ghost rows** (~55% opacity, dashed) with an amber "~3 days" horizon badge.

## DS-vs-app classification → Phase 2 DS batch (one sequential round-trip)
- **DS:** `PromptField` double-ring fix · new **`Stepper`** · new **`Monogram`** · new **`AccountRow`** (composes Monogram + HealthBadge + name + right-aligned value). Reuse `HealthBadge`.
- **app:** the full-page builder shell (header + stepper + steps + footer), the accounts-preview composition (count + breadth meter + AccountRow lists + now/forecast sections), Step ② action editor, Step ③ review. Breadth meter = app composition for now (promotable later).
