# Onboarding Overview (the "tracker") — CPDO design brief & fidelity contract

_Design-loop run, 2026-06-30. Target: `apps/prototype/src/onboarding/pages/OnboardingIndexPage.tsx`
(route `/onboarding`, `.onb-root` scope). This brief is what the implementation must be 100%
faithful to. Every decision below traces to the four Phase-1 research dossiers (client-onboarding
platforms · CS-suite action queues · analogous triage/inbox UX · AI-readiness)._

## 1. The persona & the one job
A **non-technical HighLevel agency owner** — high-ADHD, not numbers-driven, overwhelmed by dense
dashboards, opens this once a day, $2000/mo quality bar. **One job:** _"Show me who's stuck in
client onboarding and let me unblock them in one move — at a glance."_ Enemy = overwhelm.

## 2. JTBD the page must serve (priority order)
1. Don't let anyone churn in setup → **who's stuck now, ranked by money at risk**.
2. Tell me what needs ME today, only that → **triage: needs-you vs waiting vs on-pace**.
3. Unblock in one move → **one action per row, inline, safe + undoable**.
4. Where do clients chronically get stuck → **systemic bottleneck, stated once**.
5. Is my own team the bottleneck → **"blocked by your team" called out distinctly**.
6. Am I getting faster → **one velocity number vs prior period**.
7. Don't make me think → **3-second answer on top, progressive depth below; auto-verify USP visible.**

## 3. Our three defensible edges (white-space NO competitor ships — protect these)
- **Money-ranked triage queue.** `selectStalledByImpact` already sorts by `mrr × days_on_current_step`.
  Keep money as the **sort key**, shown as a quiet Mono `$/mo` eyebrow — never a wide ARR column.
- **"Whose move is it?" — your team vs the client.** `blocked_by: "agency" | "client"`. Make it
  first-class. Agency-blocked = _you can act now_; client-blocked = _you nudge_. (Differentiator: even
  Arrows' at-risk trigger conflates "they're late" with "we're late." We don't.)
- **External-review relief lane.** The carrier/DNS "no action needed" strip. Nobody else suppresses
  third-party waits. Frame as relief ("nothing for you here"), counted not enumerated.

## 4. Chosen direction — the new hierarchy (top → bottom)
Take **GuideCX Home's three-tier triage** + **Process Street "My Work"** (overdue-on-top,
urgency-grouped, inline-act) + **Stripe's calm orientation strip** + **Superhuman's needs-me/waiting
split** + **OnRamp/GuideCX "AI proposes the next action"** + **Linear's row restraint** —
re-composed onto our existing, mostly-built pieces. This is an **IA/hierarchy rework, not a rewrite.**

1. **AI Verdict (the anchor).** ONE plain sentence, **dollar-led, naming the dominant bottleneck**:
   > `{N} clients are stuck on "{step}" past Day {target} — that's where most of your onboarding pain
   > is. ${X}/mo is behind it.`
   - Keep the `Verdict` primitive + `attribution="GoCSM AI"`. Tone = `watch`.
   - Provenance behind ONE quiet **"Where clients get stuck"** disclosure (the funnel + the
     `ConfTag basis="fact"` "computed from timestamps"). Collapsed by default.
   - Secondary clause only if a real second bottleneck exists ("Also slowing clients: {step}").
2. **Triage strip (the 3-second answer).** THREE tiles on the **triage axis** (replaces the lifecycle
   status cards as primary orientation):
   - **🔴 Needs you ({stuck})** — `isStuck` count. The only saturated/red tile (Linear color discipline).
   - **⏳ Waiting on review ({pendingExternal})** — carrier/DNS, no action. Muted.
   - **✅ On pace ({onboarding − stuck − pendingExternal})** — moving fine. Muted.
   - Each tile filters the surface below (progressive disclosure; no filter chips on screen by default).
   - A quiet proof line under the strip carries JTBD-6: _"{onboarded} finished this week · avg {median}
     days to onboard ({delta} vs {priorWindow})."_ Real data (`prior_median_days_to_activate: 28`),
     green/red arrow, ONE number — never a chart.
3. **THE HERO — "Needs help today" queue, money-ranked.** Directly under the strip. This is the focal
   surface; the top row + its single button is the one focal action of the whole page.
   - Sort = `selectStalledByImpact` (money × days). Cap ~5 visible, "show all N" expands.
   - Per row (Linear restraint — one glance, muted field, one saturated priority rail):
     `client name` · **plain-English stuck reason** (≤8-word driver clause from `stuck-reason.ts`,
     never generated prose) · **whose-move pill** (your team = blue/info, client = amber/warn,
     external = neutral) · **timing** (`Stuck {n}d`, red past target) · **ONE primary button**.
   - The single verb is reason-appropriate: client-blocked → **Trigger workflow** (nudge); agency-blocked
     → **Assign / do it**; external past-window → **Check status / escalate**. Secondary actions in one
     `⋯` menu (Linear's hover/one-menu pattern).
   - Action fires the **`ActionReceipt`** (already built): scope + blast-radius + grace countdown + Undo.
     This is our "show draft → confirm → undo" safety net (ChurnZero/Gainsight pattern).
   - **Reason chips** (group-by-reason) stay, but only when ≥1 group and >5 rows — secondary, not loud.
4. **All-clear reward state** (when Needs-you = 0 — currently the `zero-stalls`/`sparse` modes). A
   designed, calm payoff, NOT a blank table: a single centered check + warm line
   _"You're all caught up. Every client who needed you, you've handled."_ + the quiet on-pace count.
   No competing CTA. (Superhuman/Todoist-Zero — the daily reason they come back.)
5. **"Waiting on others — nothing for you" relief strip.** Collapsed by default, count + "No action
   needed", expandable to a read-only list (carrier/DNS, day n of ~budget). Keep as-is; it's differentiated.
6. **Drill-downs, all collapsed / below the fold:**
   - **"Where clients get stuck" funnel** — the disclosure off the verdict. Upgrade: each step shows
     **count-stuck** and is clickable to filter the queue. (Owner-cut + days-lost double-signal = stretch.)
   - **"Every client you're onboarding"** full account list (`AllClientsSection`) — the power view, behind
     "show all". Keep, demote.
   - The **lifecycle census** (Onboarded / Onboarding now / Not started) is no longer the hero; it remains
     reachable via the full list's pills. Don't show a 4th counter row.

## 5. AI dosage (one visible AI surface — less than every competitor, by design)
- **KEEP** the `Verdict` as the only AI-marked element. Lead clause = the systemic bottleneck (a **fact**,
  timestamp-derived). Compress the trust stamp to **"Numbers exact · wording is AI."**
- **Do NOT** label the queue ranking "AI" — it's arithmetic; calling it AI erodes the headline's trust.
- Per-row reason = templated driver clause (already is). **No** `ConfTag` on facts, **no** chat/Ask box,
  **no** recommended-action menu, **no** generated per-account prose, **no** trend narration paragraph.
- Provenance ("Why this?") = one quiet click, never inline.

## 6. Hard cuts (what we deliberately remove or keep suppressed)
- The **3 lifecycle status cards above the queue** (Onboarded/Onboarding/Not-started) → replaced by the
  triage strip; census demoted into the full list.
- The **funnel table shown as default orientation** → collapsed disclosure only.
- **No** configurable columns, wide sortable grids, donut/pie walls, scatter plots, composite health
  scores, opaque proprietary numbers, or a 4th counter row. (Every competitor's overwhelm complaint
  traces to configurability.) One open disclosure at a time.
- **Every number gets a target / trend / $** — no naked integers.

## 7. Non-negotiables (DS + brand)
- Stay in `.onb-root` scoped DS (`src/onboarding/styles/*`). Compose existing primitives: `.verdict`,
  `.metric-card(.accent-*)`, `.queue-row`/`QueueRow`, `.blocked-badge`, `.conf-tag`, `.action-receipt`,
  `.empty`, `.why-grid/.why-card` (candidate for the team-vs-clients split). Fix root cause in the scoped
  DS if a primitive is missing — don't paper over in the page.
- Plus Jakarta / Inter UI; **JetBrains Mono (`.mono`) for every number/money/count.**
- Spacing scale skips `--s-7/--s-9`; cards use `--sh-rest`/`--sh-hover`, never hand-rolled shadows.
- **Auto-verify USP must stay visible** — the differentiation line "GoCSM watches HighLevel and checks
  steps off automatically — no one marks checkboxes."

## 8. Objections considered (folded-in plan-review lenses)
- **CEO/CPO:** Does it command $2000/mo & solve the right problem? Yes — it leads with the one decision
  (top stuck client + one move) and surfaces the two things owners fear (churn-in-setup, own-team holdup).
  Risk: don't let the redesign become "prettier dashboard"; the queue must be unmistakably the hero.
- **Eng:** Re-composition of existing selectors/components; low risk. The triage strip needs the three
  counts (have selectors) + tile→filter wiring (reuse `selectPopulation`/`setStep`). All-clear state
  reuses existing zero-mode branches. No new deps. Keep `tsc` + `bun run build` green per change.
- **Design:** One focal action, calm field + one saturated priority cue, ≤3-second scan. Watch row
  density and that the strip doesn't reintroduce a "wall of counters."
- **DevEx:** Keep the DevStrip demo/rollout modes working (they're how every state is verified).

## 9. Done = (stopping condition)
Live `/onboarding` on :8080 where: the queue is the hero and money-ranked; the top row is actionable in
one move with an undoable receipt; the triage strip answers needs-you/waiting/on-pace in 3 seconds; the
all-clear state is a designed reward; the systemic bottleneck and full list are calm drill-downs; one AI
surface, one velocity number, no naked numbers; auto-verify USP visible; passes the full review panel
(agency-owner persona, CDO craft, CPO/CEO, PMM copy, AI-readiness) with no material new findings; `tsc`
+ `bun run build` green.
