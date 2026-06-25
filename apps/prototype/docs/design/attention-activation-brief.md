# CPDO brief — Attention page (/today): activation, prioritization, escalation

> Design-loop run, 2026-06-25. Synthesises 4 dossiers (CS competitors · activation-urgency/AI ·
> getting-started-vs-ops split · alert-routing) for the GoCSM Attention page. Persona: non-technical,
> ADHD HighLevel agency owner, ~1,000 sub-accounts, $2,000/mo bar, "what do I do next?". Phase-1
> (no Health) is the default — zero coined Health vocab. Diagnosis-only: the only actions route to
> playbooks (Trigger Workflow / Request Feedback). **Cut before you add.**

## The load-bearing research findings
- **Nobody in CS does true system-driven top-N.** Gainsight/ChurnZero/Vitally/Totango/Planhat/Custify/
  Catalyst all hand the CSM a *sortable wall* (manual Priority flags, saved views); Gainsight's own
  admins call the overload the "Reese's-cups" failure. **A hard top 2–3 "Start here" is GoCSM's wedge.**
- **Put the stakes ON the card** (named account + $ at risk + the one signal) — competitors omit this and
  force a click. Couple every card to a **one-click "Activate"** (the row launches the play).
- **Rank deterministically, AI does the words.** Every high-trust $/security analog (AWS Trusted Advisor,
  Datadog cost, Wiz, Dependabot "Most important") ranks by a *transparent, explainable score*, not a black
  box. Cap the count (onboarding ≤5; Superhuman 3–7; for ADHD → **2–3**). Honest loss-framing from real
  signals; quiet dismissal, no nagging.
- **One adaptive page, recede don't split** (Shopify/Duolingo): the activation "Start here" is the day-one
  hero and *recedes* as plays activate (full → slim banner) into ongoing triage; a one-time "You're live"
  graduation cue. Don't build a separate Getting-started route — that's the hop this persona drops.
- **Alert routing must be operator-grade** (Linear channel-toggles + GitHub scheduled-reminder), NOT a
  rules engine (Datadog/PagerDuty). One card, one sentence: channel × cadence + loop-in-owner.

## The direction (one adaptive Attention page, top → bottom)
1. **Hero** — keep the two numbers (N sub-accounts need attention · $X MRR at risk), each with its
   one-line subtext (Pattern 1). Stakes first, tightened.
2. **Start here today** — the focal activation module (the page's hero job). Driven by a **deterministic
   prioritized list of plays** = non-live plays with matching accounts today, ranked by `playbookImpact`
   (at-risk MRR desc → count → popularity). Phase-1: exclude plays whose copy uses coined Health words.
   - Headline "Start here today" + an AI/recommended mark + a summed line: **"Turn these on to protect
     ~$Y across N accounts."**
   - **Exactly the top 2–3 as urgent cards.** Each card: a rank, the **$ at risk** as the dominant figure
     (`.at-risk`), the play title, a one-line reason (the play's plain problem), the **named accounts**
     ("Acme, Bright +1"), a transparent **"why this is #1"** basis ("covers the most at-risk revenue —
     $X across N accounts"), a **one-click "Turn it on →"** (routes to the setup flow), and a quiet "Not
     now" (dismiss; silent, no re-nag this session).
   - A secondary **"Browse all 57 plays →"** link (never the default).
3. **Step in — automation couldn't fix this** (Job-B) — keep the human-needed list (a play ran but didn't
   fix; contact actions). Add an inline **"Notify me"** config so the owner isn't forced to visit daily.
4. **More plays for your accounts** — the rest of the prioritized list (beyond the top 3), quieter, so the
   owner sees there's depth without a wall; → Browse all.
5. Prototype Health toggle (unchanged).

**Adaptive recede:** drive emphasis off the **count of live plays** + remaining recommendations.
- *Activation phase* (no/few live plays): "Start here today" is the prominent hero.
- *Ops phase* (≥ a few live plays, or top picks exhausted): "Start here" collapses to a slim
  **"N more plays available for your accounts →"** banner; "Step in" + the queue lead; a one-time
  **"You're live — this is now your daily triage."** graduation cue.

## The "Notify me" escalation config (operator-simple)
One card, inline on the "Step in" section (a "Notify me" toggle/button → expands), modeled as one sentence:
> **Send Step-in alerts to `[☐ Slack · ☐ Email · ☐ Asana task]`  `[Daily digest at 9am ▾ | Each one]`  ·  ☐ Also notify the account's owner.**
- **Three controls only:** channel chips (multi-select), a cadence SegmentedControl (**Daily digest = default**, vs Each one — "Each one" *is* realtime, no separate config), and a single **"Also notify the account's owner"** checkbox (off by default — at 1,000 accounts realtime+owner would flood him).
- **"Owner" is a semantic token** (resolves to the sub-account's personnel) — preview chip "→ the account's owner", never a typed field.
- **Slack / Asana are external handoffs** (like the HighLevel handoff): a "Connect" stub/placeholder; the chip is disabled with a "Connect" affordance until linked. Email needs no connect.
- A small **digest preview**: "Your daily Step-in digest — N accounts need you."
- Persist the config (prototype localStorage `gocsm.notify.v1`).
- **Do NOT build:** escalation chains, timeouts, tag/condition routing, per-play overrides.

## AI dosage (decision — revised after the Phase-4 panel)
- **Ranking + the $ are deterministic and transparent** (the score IS "at-risk MRR across N accounts") —
  this is the trust moat over a black box.
- **Label the module "Recommended", NOT "AI pick".** *(Revised.)* The panel flagged that stamping a
  transparent arithmetic rank as "AI PICK ✨" *overclaims* and quietly erodes the very trust the
  determinism is there to build — the moment a non-technical owner learns "#1" is just `at-risk MRR ×
  accounts`, an "AI" label reads as a con. So the eyebrow is **"Recommended · activate first"** (blue,
  no sparkle) and the #1 basis is stated as **fact** ("it's the largest block of revenue any single play
  can act on today"), not as AI magic. The violet AI accent appears **nowhere** on this page.
- **AI's job (future) = the words only:** a drafted "why now" / outreach copy — never the order or the $.
- No AI inside the Notify-me config.

## Phase-4 review revisions (what the panel changed before ship)
The 3-reviewer panel + close-out verifier approved after these fixes (all shipped):
1. **Dropped the "AI pick" framing** → "Recommended" + transparent basis (above).
2. **Number story made honest** — the summed line reads as a **subset of the hero total** ("they cover
   `$X` of your `$Y` at risk"), killing the "broken math" read where the dedup'd union ≈ the #1 card.
3. **Money valence** — `mrrKind` per play so a milestone/renewal/expansion is **never** "at risk":
   "MRR to grow" (green) / "MRR up for renewal" (amber) / "MRR at risk" (red).
4. **#1 is dominant** — full-width focal card (one solid-blue action); #2/#3 a quieter pair beneath.
5. **Depth recedes** — "More playbooks" rows account-led with plain "Set up" links, not accent buttons.
6. **Escalation parity & copy** — Slack gated like Asana; "daily triage" → "check back here for the
   accounts that still need you"; digest preview scoped to the Step-in set; owner sub-label simplified.
7. **Noun standardized** to "playbooks" everywhere.

## Fidelity contract
1. Top 2–3 "Start here" cards, deterministically ranked by `playbookImpact`, $-led, named accounts,
   one-line reason, one-click "Turn it on", quiet dismiss, a "why #1" basis, a summed "~$Y" line.
2. One adaptive page; the Start-here module recedes by live-play count; graduation cue; never a separate route.
3. "Notify me" = 3 controls (channel chips · cadence · loop-in-owner), digest default, owner off,
   Connect-stubs, digest preview; no rules engine.
4. Phase-1 safe: no coined Health vocab anywhere (filter health-copy plays in Phase 1).
5. Reuse DS primitives (Card, Button, Icon, Mono, Badge, FixItCard, SegmentedControl); `.at-risk` for $;
   one solid-blue focal action (the #1 card's activate); typography via `fontSize`. `bun run build` green;
   Playwright dual-lens pass before deploy.

**Out of scope:** real Slack/Asana/LLM integration (stubs); a second route; per-play notification overrides;
changing the AttentionSignal/Attempt data model (the redesign composes over the existing selectors +
`playbookImpact`).
