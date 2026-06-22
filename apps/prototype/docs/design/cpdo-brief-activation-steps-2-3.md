# CPDO fidelity contract — Activation flow Steps ② "What it does" & ③ "Go live"

> **The brief an engineer builds straight from.** Companion to `cpdo-brief.md` (which
> governs Step ① "Who it runs on" — the criteria builder, already shipped). This brief
> governs the rest of the `AttentionActivation` full-page flow: Step ② (set up + publish
> the starter playbook in HighLevel) and Step ③ (review + autopilot + go live), plus the
> activation shell. Synthesised from three blind research dossiers (activation/publish
> flows · review-commit-confirm + automation trust · AI-readiness for activation),
> adversarially triangulated (the three converged independently — high confidence).
>
> **Persona (build relentlessly for him):** ADHD HighLevel **agency owner**, ~1000
> sub-accounts, NOT technical, NOT analytics-y, overwhelmed by dense text/numbers/options,
> barely reads. Wants "what do I do next?". Bar: looks worth **$2,000/mo**, passes the
> 3-second test. **Golden rule: don't make me think — cut before you add.**
>
> Files in scope: `components/attention/AttentionActivation.tsx`, `app-overrides.css`
> (the `aa-*` rules), and `packages/design-system` if a primitive is missing (DS-first,
> one commit). Step ① / `CriteriaBuilder.tsx` is OUT OF SCOPE (governed by `cpdo-brief.md`).

---

## 0. The synthesis in one paragraph (the "best-of" graft)

The 3-step spine (Who → What → Go live) with its persistent header + stepper + footer is
**sound — keep it** (it's the ADHD orientation contract: why / where am I / what's next).
The work is concentrated in two places. **Step ②** today inverts hierarchy — a giant video
out-competes the actual task, a dense paragraph and a dashed-border "unreal" step list bury
the one real action, and the HighLevel hand-off reads as homework. Fix: **demote the video to
an optional link** (research is blunt — *do, not watch*; the "we built it for you" feeling must
come from the **pre-built automation**, not a video), render the step list as **real, solid,
confident** rows (it's what the playbook *does*), cut the paragraph to **one line**, and reframe
the publish hand-off as **"we built this — last step, switch it on in HighLevel,"** not a chore.
**Step ③** today floats three small cards at the top of an empty page with the commit CTA
stranded bottom-right — the textbook *floating-in-void* anti-pattern. Fix by **anchoring, not
adding**: lead with the **audience COUNT as the hero** + a **glanceable preview of the real
accounts** (the one number/visual this persona *will* read — it answers his only real fear,
"who is this about to hit?"), make the **now-vs-future split legible** (the run acts on *these N
now*; autopilot keeps running on *new matches* — GoCSM already splits this, it just isn't
legible), put **reassurance at the moment of commit** ("starts tonight · pause anytime · you'll
get a summary"), and **upgrade the go-live confirmation** from a thin corner toast to a calm,
right-sized success moment (what happened · what's next · path forward — **no confetti**).

**Contested calls, resolved:**
- *The market's most-verified safeguard (Totango + ActiveCampaign + HubSpot + Gainsight all
  converge):* make the **now-vs-future enrollment split explicit**. **Resolution:** GoCSM ALREADY
  has it — "Start the run" acts on the current matched cohort; the **autopilot toggle** is the
  "keep running on new matches" half. We **don't add a new control** (cut before you add); we make
  the existing split **legible** in copy + layout. The count + preview makes "these N now" tangible.
- *Autopilot default:* **ON** — but *earned*. 80% keep defaults; a default reads as the
  recommendation; default-OFF betrays the "set & forget" product promise the persona paid for.
  Earned = the toggle is **visible on the review screen**, carries a **one-line consequence +
  reversibility** ("Keep handling new matches automatically · pause anytime"), and pause is one tap.
- *Confirmation tier:* the current "close flow → 3-word corner toast" is the **wrong tier** — it
  treats a milestone (turning on automation against real customer accounts) like "Changes saved."
  **Resolution:** a calm in-flow **success state** (not a new route): green check + "You're live ·
  running on N accounts", "First check runs tonight · we'll send you a summary", one primary path
  forward + a quiet pause. No confetti (would undercut the seriousness for a $2k/mo pro).
- *Pre-commit anxiety:* **sell the safety net, not a warning.** The run is pausable, so a "Are you
  sure?" modal would *manufacture* fear (NN/g). Label the CTA with its consequence; one reassurance
  line beside it. No confirm-the-confirm.
- *AI dosage:* **restraint.** AI at activation *multiplies* decisions (every AI artifact = an
  accept/reject/revise micro-decision → "AI brain fry"). The single highest-leverage AI move is a
  **pre-selected recommended default** (autopilot + escalation) so Step ③ collapses to one confirm
  tap — AI as a *decision-remover*, never an essay. Message-personalization + auto-verify-publish
  need an LLM / HighLevel API → **out of prototype scope**, noted as future. **No** AI summary prose,
  **no** confidence stats ("87% likely"), **no** chatbot on these screens.

---

## 1. Step ② "What it does" — the spec

Layout (single centered column, ~680px, unchanged width):

1. **Sticky ScopeBar** (the WIP one-line tap-to-edit "Runs on N · <rule> · Edit"). **Bug to fix:**
   a dark sliver of the content behind peeks *above* the sticky bar (sticky-offset gap) — the bar
   must fully cover the scroll seam (give it the body's top padding as its own, or an opaque
   backing that extends to the scroll-container top). No video edge may show above it.
2. **Status badge + heading + ONE line** (cut the 3-line paragraph):
   - Badge: `Not set up yet` (warn) → `Published` (pos) — keep.
   - H2: **"What this playbook does"** — keep.
   - One line only: **"We built this starter playbook for you. Switch it on in HighLevel and it's
     live."** (Everything else — "powered by a HighLevel workflow", "watch the 2-min walkthrough" —
     moves to the video link / is cut.)
3. **The step list = the hero of this screen** ("What's in the starter playbook"):
   - Keep one **icon + one-line outcome** per step. **Replace the dashed `aa-stepline` borders with
     a solid, real, confident treatment** (subtle surface card + solid hairline) — these are the
     real actions the playbook takes; dashed reads as placeholder/unreal/disabled and *undersells*.
   - Optional steps keep the quiet `optional` tag.
4. **Video = demoted to a small optional link**, NOT a giant gradient card. e.g. a quiet
   `▷ Watch how it works · 2 min` text/secondary affordance under the heading or step list. It must
   no longer dominate the fold or out-compete the publish action.
5. **The publish hand-off — reframed as "last step," not homework** (keep the two-step blue card,
   improve framing):
   - ① **`Open in HighLevel ↗`** (primary on this card) — opens HighLevel (prototype: generic new
     tab; *future:* deep-link to the exact workflow's publish toggle, Plaid-style continuous
     hand-off). Hint: **"Switch it to Publish in the top-right, then come back."** (Names the exact
     HighLevel gesture — counters HL's Save≠Publish footgun.)
   - ② Confirm: **"I've published it in HighLevel"** → `✓ Published in HighLevel · Not yet`. Keep as
     the fallback attestation but framed as **the last tiny tap**, never a form. (*Future:* if a
     HighLevel API can report published state, auto-detect and skip the self-attest — Stripe's
     verify-don't-trust posture. Note only; out of prototype scope.)
6. **Footer:** `← Back` · gated `Continue to go live →` (disabled until published) with the note
   "Publish it in HighLevel to continue" — keep.

**AI on Step ②:** none in the prototype. *Future (noted, not built):* one optional "Tailor the
messages to my agency" button producing ONE editable draft (opt-in, pull-not-push) — never
auto-generate per-account messages he must vet.

---

## 2. Step ③ "Go live" — the spec (the biggest change)

**Anchor, don't add.** Replace the floating-cards-at-top layout with a single centered, contained
column in the optical center of the page. Top-to-bottom the eye travels: hero count → preview →
what-it-does recap → autopilot → commit + reassurance.

1. **Hero audience COUNT** — the page's thesis, big: **"Runs on `N` accounts"** (display scale,
   `Mono` number). This is the ONE analytic this persona reads; it answers "who does this hit?".
2. **Glanceable who's-affected preview** — a short row/list of the **real matched accounts** (reuse
   `AccountRow` / the Step-① MatchWall treatment): avatar + name + band + `$`. Cap at ~4–6 with a
   quiet "+N more". Truth made tangible = the single highest-trust thing to add; it is the *only*
   thing we add. (For the fixed-selection entry, these are the hand-picked accounts.)
3. **"What it does" recap** — the same icon step-lines (or a one-line summary card with Edit) — keep
   concise; links back to Step ② via Edit.
4. **Autopilot — the now-vs-future split made legible.** Card: **"Keep handling new matches
   automatically"** + sublabel **"New accounts that qualify are handled for you — you can pause
   anytime."** `Toggle` **default ON**. Copy must make clear this is the *future* half ("new
   matches"), while the run itself acts on *these N now*. (Hidden for the fixed-selection entry —
   a hand-picked one-time run has no "future matches".)
5. **Commit + reassurance, co-located** (the single most important change):
   - Primary CTA carries its consequence. Footer keeps `← Back`; the **primary action names the
     outcome** — **"Start the run"** with the count adjacent, or **"Start on N accounts"**.
   - **One reassurance line at the point of commit:** **"Starts tonight · pause anytime · we'll send
     you a summary."** (time buffer + reversibility + we'll-tell-you-when-it-acts — the whole anxiety
     stack in one line). No "Are you sure?" modal.
6. **Go-live confirmation — a right-sized success moment** (replaces the bare corner toast).
   On "Start the run", transition the flow body to a **calm centered success state** (same
   `aa-fullpage`, not a new route) before returning:
   - ✓ **"Your playbook is live"** · "Running on `N` accounts." (green check + neutral voice; no
     "successfully", no "!", no confetti.)
   - **What's next / when:** "First check runs tonight. We'll send you a summary."
   - **Path forward, not a dead end:** one primary button (**"Done"** / "See it on Attention") + a
     quiet **Pause** affordance so control is visibly retained.
   - The persistent success toast may remain as a secondary echo, but the in-flow success beat is
     the milestone. (Keep it brief; the persona must not feel a 4th "step" — it's a confirmation,
     not configuration.)

**AI on Step ③:** the highest-leverage AI move is the **pre-selected recommended default** —
autopilot ON + a sensible escalation window already chosen, presented as "here's the recommended
setup" with one-tap change, so the screen is a *confirm*, not a *configure*. (Prototype: the
default is hard-coded as "recommended"; no live model.) **No** AI summary prose, confidence %,
or chatbot here.

---

## 3. DS gap list (build-new vs extend-existing)

| Primitive | Status | Action |
|---|---|---|
| `Stepper`, `Toggle`, `Badge`, `Button`, `Icon`, `Mono`, `AccountRow`, `VideoCard` | **EXIST — reuse** | Step ③ preview reuses `AccountRow`; video demotes `VideoCard` to a small/secondary form or a plain link. |
| **Solid step-line** (Step ② action rows) | **EXTEND in app CSS** | Replace dashed `.aa-stepline` with a solid, confident treatment (surface + hairline). App-level (`app-overrides.css`); promote to DS only if reused elsewhere. |
| **Success state** (Step ③ go-live) | **COMPOSE in app** | Centered success layout from existing primitives (Icon check + headings + Button). New `aa-live-*` classes in `app-overrides.css`. No new DS primitive unless reused. |
| **Hero count + preview** (Step ③) | **COMPOSE in app** | `Mono` display number + `AccountRow` list + "+N more". New `aa-golive-*` classes. |

> DS-first means: confirm the DS already has the primitives (it does — `AccountRow`, `Toggle`,
> etc.), so most work is **app-level composition + CSS**. Only promote to `packages/design-system`
> if a pattern is genuinely reused. DS + app land in **one commit**. Typography via `fontSize`,
> never `font: var(--t-*)`. One solid-blue focal action per step.

---

## 4. Fidelity contract & out-of-scope

**The implementation must be 100% true to:**
1. **Keep the 3-step spine + persistent header/stepper/footer** (orientation contract). Fix the
   **sticky ScopeBar seam** (no content edge above the bar).
2. **Step ②:** one-line intro (not a paragraph); **video demoted** to an optional small link;
   **step list rendered solid/real** (no dashed "unreal" borders); publish hand-off reframed as
   "we built it — last step, switch it on in HighLevel," naming the exact HL Publish gesture.
3. **Step ③:** **audience COUNT is the hero**; **glanceable real-account preview** is the one
   addition; **now-vs-future split legible** (run = these N now; autopilot = new matches);
   **autopilot default ON** with one-line consequence + "pause anytime"; **reassurance co-located
   with the commit CTA**; CTA names its consequence.
4. **Go-live = a calm, right-sized success moment** (what happened · what's next · path forward ·
   pause), neutral voice, **no confetti**, not just a corner toast.
5. **AI dosage = restraint:** the only AI is the **recommended pre-selected default**; **no** AI
   prose/summaries, **no** confidence %, **no** chatbot on Steps ②③.
6. **DS-first, one commit; typography via `fontSize`; one solid-blue focal action per step;
   reuse `AccountRow` for the preview; cut before you add.**

**Explicitly OUT of scope (note as future, do not build):**
- **No real LLM** — no AI message personalization, no AI-generated summaries.
- **No HighLevel API** — keep the self-attest publish confirmation (improve framing only); no
  deep-link-to-exact-workflow, no auto-detect-published.
- **No new backend / live data** — continue over the `Account` fixture model.
- **No new fourth control** for backfill — the now/future split is made legible, not added.
- **No celebration theater** (confetti, illustrations, "87% likely") — calm and neutral.
