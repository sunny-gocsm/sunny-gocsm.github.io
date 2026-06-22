# CPDO Brief — Playbooks Marketplace (browse/discover surface)

**Date:** 2026-06-23 · **Business:** GoCSM · **Surface:** `PlaybooksPage` Marketplace tab
**Persona:** ADHD HighLevel agency owner, ~1000 sub-accounts, not analytics-minded,
overwhelmed by density, wants *"what do I turn on next?"* with almost no reading.

## Design problem
Make discovering and turning on the right playbook feel like **one obvious, calm
choice** — not a wall of equally-weighted cards each shouting "Set up."

## What the research said (3 blind dossiers, strongly convergent)
1. **A loud install button on every card has ZERO verified precedent.** Stripe
   ("one filled button per band"), Shopify ("one dominant action per band"),
   Raycast (transparent hairline pill on an inert card), App Store (quiet "Get"
   pill). *Scarcity of the saturated CTA **is** the hierarchy.* Our ~12 solid-blue
   "Set up" buttons are the textbook overwhelm failure.
2. **Card → preview → one loud confirm.** The card's job is "show me." The loud
   commit lives one layer deeper (HubSpot Preview, HighLevel canvas, Totango View
   Details). We already have this — the detail page with a single "Set up playbook."
3. **Pick ONE click model per card.** Clickable card *and* a competing loud button
   is explicitly forbidden by Raycast/Figma/Shopify systems.
4. **Install-state replaces, never accumulates** (VS Code Install→gear, Vitally
   toggle). Once live, the loud CTA disappears and the card recedes.
5. **Curation = a small set of meaningful groups + a popularity-led default.**
   ≤5–7 categories; never a multi-row pill wall. Lead with "Most deployed" (social
   proof). Our 7 categories are meaningful lifecycle stages — keep them, but as ONE
   calm row, not a two-row wall.
6. **Drop KPI density from a *browse* surface** (Stripe restricts numerics to
   "where users compare and act"). "Live for you 0" reads as a deficit.
7. **AI dosage (verdict):** keep the single **explained** "AI pick for you" hero as
   the primary AI move — it already carries its "why" ($ at-risk + account count).
   Silent rerank-by-impact is fine (already present). NL search stays result-first.
   **Do NOT build:** auto-fire, per-playbook AI dashboards, more AI rails, or a
   confident pick with no "why." One explained pick + a human "Turn on" at the end.

## Chosen direction (the fidelity contract — implementation must be 100% true to this)
- **Exactly ONE filled-blue button on the marketplace screen: the AI-pick hero's
  "Set up."** Everything else is quiet.
- **Every MarketCard becomes a single click target.** Remove the nested per-card
  `<Button variant="primary">`. The whole card already navigates to the
  preview/detail; show a quiet **"Set up →"** (blue text, no fill) as the visible
  affordance, not a filled box. Live → quiet "Manage →", Paused → "Resume →".
- **Category bar: one horizontally-scrollable row, no wrap.** Keep all 7
  lifecycle-stage categories; kill the two-row wall.
- **Calm the top: drop the KPI metric triplet on the Marketplace browse surface.**
  Keep title + one-line description + "Create from scratch." (The "New this week"
  rail already conveys freshness; "Your playbooks" tab carries its own count.)
- **Keep the AI pick hero, the 2–3 short curated rails (Most deployed first), and
  the result-first NL search exactly as they are** — research endorses all three.

## Root-cause classification
App-composition flaw, **not** a DS gap. The DS already has `btn-primary` (the scarce
hero CTA), `btn-ghost`/`btn-accent` (quiet), and clickable-card hover-lift;
`components.css` even documents "the single solid-blue `.btn-primary` focal action."
Fix the app's composition; do not add DS primitives. (DS guideline reinforced, not
changed.)

## Success criteria (exit bar)
One focal action per screen; the owner can answer "which one first?" without reading;
minimal chrome before the first recommendation; install/live state legible and
self-receding; AI dosed as a decision-reducer, never another dashboard.
