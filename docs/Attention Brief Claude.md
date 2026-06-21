# /today → "Attention" — Redesign Brief

**Surface:** the `/today` page and the playbook activation flow that opens from it.
**Author:** Karthik (CPO)
**Persona / bar:** HighLevel agency owner, ADHD, overwhelmed by dense UI, "what do I
do next?"; the product must feel worth $2000/month. (See gocsm-design-loop Standard.)

---

## Problem 1 — The activation flow is too long

Today, activating a playbook takes ~6 steps:

1. Show the list of accounts → ask the user to initiate the playbook process (one step/page).
2. Show a **list of actions** — this screen has **no purpose**; the user should go
   straight to the Workflow builder. **Delete this screen.**
3. A temporary page while the user builds the workflow.
4. Run.
5. "Do you want to set it on auto-pilot?"
6. Set up the trigger.

This is too long. A flow this long will cause drop-off and hurt activation rate.

**Target flow:** collapse to **trigger-criteria → action (Workflow builder) →
publish → auto-run on publish.** No separate "Run" step. No "do you want auto-pilot?"
question. Publishing IS activation.

## Problem 2 — Wrong order; should be trigger-first

A HighLevel agency owner reasons **trigger first, then action** ("who's at risk?" →
"what do we do?"). When they click "Let's fix it," the flow should **lead with the
triggering criteria**, not the action.

### The hard design problem — the criteria builder

We need an innovative way to ask the user to set up the criteria. We are flexible
across the **full spectrum — from completely agentic / chat-based to structured /
guided.** The goal is to get them to think and set up the trigger criteria, at the
right balance:

- A blank landing page with a text box → people won't type.
- A full Q&A → too many questions, gets long very fast, because criteria span many
  attributes:
  - signals across all pillars (PAS / Revenue / Login / Sentiment)
  - account attributes
  - user attributes

**Research activity (Chief Design Officer lens):** study how other platforms with the
same problem solve it, synthesize the learnings, then implement.

### Central mechanic — narrowing-as-guidance

While the user is narrowing the criteria, use it as the teaching moment:

- Show a forecast of **who will most probably meet this criteria in the next 7 days.**
- As they filter, show the **actual account list narrowing in real time.**
- Showing an account list and then watching it become a "wall" that shrinks gives the
  user **cues for what filter criteria to apply next.** The live narrowing is itself
  the guidance — design this feedback loop deliberately, don't reduce it to a static
  count.

### Action setup

Once criteria are set, take the user **quickly to the Workflow builder**, have them
set it up, **publish**, and on publish **just run it** — don't ask the user to run.

## Problem 3 — Rename `/today` → "Attention"

The page deserves meaning: it asserts that these accounts **require urgent attention.**

### The Attention page has two jobs

1. **Activate workflows** — for accounts that need attention where workflows haven't
   been activated yet.
2. **Surface tried-but-failed accounts** — workflows that **ran but did not achieve
   the desired result** after 24h (or 48h — TBD). When we tried and nothing happened,
   surface the account and let the user **call (dial right there), email, or SMS the
   account directly from the card.**

---

## Execution requirements

- Invoke the **gocsm-design-loop** skill as the operating discipline (it carries the
  front-end + gstack CDO judgment, micro/macro loops, the persona Standard, the
  DS-root-cause-every-step rule, and the two-repo sync protocol).
- We are open to **improving the design system at every step.** If the DS is the root
  cause of a flaw, fix the DS — don't paper over it in the app.
- **Two-repo sync, strictly sequential:** when the DS changes, commit + push the
  design-system repo, vendor it back into the app via the sync script, then commit +
  push the app. Both repos must stay in sync. Run these steps **one at a time** — I
  have previously hit errors from steps running in parallel; that must not happen.
- Micro and macro level review throughout.

## Architectural spine (decided)

**Health = diagnostic layer** (why an account is at risk). **Attention = action
layer** (what to do now). **Link, do not duplicate.** The at-risk signal is computed
**once** in the Health layer; Attention consumes it and never recomputes it.
Attention cards show the action-relevant minimum (account, one-line reason, the
action) and link into Account Detail → Health / AI Insights for the full diagnosis.
