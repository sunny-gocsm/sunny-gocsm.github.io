# Attention page — calm/adaptive redesign brief (design-loop, 2026-06-25, pass 2)

**Problem (one sentence).** The "Needs attention" page is too busy — rebuild it as a
calm, state-adaptive page where a non-technical HighLevel agency owner sees the ONE
thing to do within 3 seconds.

**JTBD.** "Tell me the single thing to do right now to keep my clients from leaving —
and let me do it in one click, without reading."

## North star (chosen direction)
**Linear's "My Issues" focus-order, applied to GoCSM.** One calm page read top-to-bottom.
Priority is encoded as **section ORDER, not numbers**. Empty/irrelevant sections
**vanish** (never render a "0"). **One** rationed blue accent marks the **single primary
action** for the current state. Whitespace groups; borders/colour do not. "Nothing needs
you" is a **rewarded** state, not a blank.

## Converged research law (all 3 dossiers agreed)
1. **One focal action per state, made to pop pre-attentively.** Everything else recedes.
2. **Encode priority as order/position, not counts/badges.** Overwhelmed, non-numeric
   user reads top-to-bottom. (Linear, Things, Vitally.)
3. **No naked numbers.** Totango's unexplained "Quality Score" → users literally ask
   "what is this?". Every number is **embedded in an action sentence with a verb**, or
   it's cut. ("**15 accounts** never set up payments — turn this on to fix them.")
4. **The unit is an ACTION** (name + one-line why + one button), not a stat tile.
5. **One opinionated, ranked, non-configurable agenda** — calm guaranteed in the product,
   not in config. (Vitally TODAY = right; Planhat blank-canvas = wrong.)
6. **Bound & rank for them; hide the long tail** behind progressive disclosure.
7. **Daily digest that deep-links into the action is a cheap differentiator** (ChurnZero
   owns it). Frame = Slack's outcome promise + Linear's guarantee: *"we'll tell you each
   morning what needs you, and only ping you if something can't wait. Quiet until then."*
8. **AI dosage — the open white space:** no competitor puts always-on AI prioritisation
   on the home. GoCSM's role = **rank + one-line "why now"** (a decision-reducer), framed
   as "Ranked for you." NOT a chat panel, NOT branded agents, NOT prescriptions. Honour
   GoCSM's **diagnosis-only** stance — the suggested action is always an *existing* one
   (turn on the matching playbook / open the account), never an invented prescription.

## The three modules (each ONE calm block, not a card grid)
- **(P) Turn on playbooks** — activation/adoption driver.
- **(N) Daily digest** — "stop checking; we'll tell you each morning." Min = daily email
  with a link to this page; richer = Slack/Asana/SMS routing (progressive disclosure).
- **(L) Accounts that need you** — automation ran but a human is still needed.

## Adaptive hierarchy (Karthik's exact spec) — gated on two signals
`liveCount` = playbooks turned on · `digestOn` = a digest channel is configured.

- **State A — `liveCount < 3` (still activating): (P) is HERO.** Reaching 3 is the goal;
  P dominates the first glance. (L) and (N) recede *quietly* below a clear visual break.
- **State B — `liveCount >= 3` (activated; deepen + triage): the actions that need them
  lead.**
  - **digest NOT on →** order: **(N) set up digest [HERO] → (L) the list → (P) a few more.**
  - **digest on →** order: **(L) the list [HERO] → (P) a few more.** (N) collapses to a
    slim "✓ Daily digest on — 9:00am · Edit" confirm line.
- **(P) "turn on a few more" is always LAST once `liveCount >= 3`.**

## Per-module calm spec (cut, don't add)
**(P) Playbooks.**
- **Hero = ONE playbook** (the #1 ranked): playbook name + a single outcome sentence with
  the **count embedded** ("**15 accounts** never set up payments — turn this on and GoCSM
  fixes them automatically.") + a small customer-logo cluster (identity, low-text) + ONE
  button **"Turn it on."** No MRR, no "why #1" box, no in-card expandable list (that lives
  on the detail page — progressive disclosure).
- **#2/#3 = ultra-light one-line rows** (Linear-style): icon · title · "N accounts" · a
  small "Turn on". No logos, no $, no reason line.
- One quiet link: **"Explore all 57 playbooks →."** Drop "Show more" density.
- **Numbers cut from this surface:** MRR removed from the home (lives on detail). The
  count is the only figure, and it's embedded in the sentence.

**(N) Daily digest.**
- **OFF + hero (State B):** calm benefit card — headline **"Don't keep checking"**, one
  line ("We'll email you each morning with the accounts that need you — and only ping you
  if something can't wait. Quiet until then."), ONE button **"Turn on daily digest"**.
  Channel/cadence/owner = **progressive disclosure** (revealed after enabling or via
  "More options"), NOT shown inline by default.
- **ON:** slim single line "✓ Daily digest on — every morning at 9:00am · Edit."
- **State A:** a single quiet one-liner at the very bottom (placed *after* the user has ≥1
  live play — the LinkedIn "ask after a relevant action" pattern), never competing with P.

**(L) Accounts that need you.**
- Clean rows: **logo · name · one-line why/what · ONE info-scented action** ("Reach out →"
  / "Open →"). Collapse the Call/Email/SMS triad to a single primary action (the rich
  contact options live on the account). Quiet status chip carries the "why" at a glance
  (no alarm-red by default; quiet tint).
- Bounded & ranked; "nothing needs you" → rewarded empty state.

## Aesthetics
- More whitespace; group by space, not borders/heavy cards. Ration blue to the one primary
  action per state. Status = quiet tint, never default alarm-red. Tabular numerals (`Mono`).

## Fidelity contract / guardrails
- Phase-1 safe: zero coined Health vocab until Health configured (`recommendedPlays`
  already filters). Embed parity (`/embed/attention`). DS-first; reuse primitives; fix the
  DS only where it's the real root cause. Typography tokens via `fontSize`, never inline
  `font: var(--t-*)`. Build green: `tsc -p tsconfig.app.json && bun run build` (root).
- Verify in BOTH states on :8080 (`/today`): State A = clear localStorage autopilot; State
  B = ≥3 live (and toggle digest on/off).
