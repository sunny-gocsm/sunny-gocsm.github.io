# Research dossier — Natural-language → editable filters, and the AI input pattern

> **For:** the step-1 hero of the Attention-activation wizard ("Who it runs on") — a multi-line
> natural-language input that compiles into editable filter rules below.
> See the brief [`../trigger-criteria-builder-redesign.md`](../trigger-criteria-builder-redesign.md)
> and the field set [`../gocsm-attribute-filter-catalog.md`](../gocsm-attribute-filter-catalog.md).
>
> **Persona:** overwhelmed, ADHD HighLevel agency owner — not technical, wants "what do I do next?"
> with almost no reading. Bar: worth $2–3k/mo, passes the 3-second test.
>
> **Method:** primary sources only, adversarially verified. Live DOM snapshots taken 2026-06-22
> (Perplexity, ChatGPT, v0); official docs/help-centers for the rest; design-research sources
> (Nielsen Norman Group, Vercel Geist, shadcn AI Elements, Apple HIG, Material 3) for the generic
> patterns. Claims are tagged `[verified: source]` or `[unverified]`. Built: 2026-06-22.

---

## TL;DR for our build

The whole landscape agrees on one shape: **NL is a draft compiler, not an oracle.** Every product
that ships "describe it → filters" lands the user in an **editable structured rule surface** and keeps
that surface as the source of truth. The box itself is signaled as AI by **labeled, functional controls
and example coaching outside the box** — never by a faint ghost outline, and increasingly *not* by a
sparkle. For our non-technical persona the strongest precedent is **ThoughtSpot's editable, color-coded,
hover-to-explain tokens** ("verify in plain language, no SQL needed") + **a mandatory confirm gate**
("Add these filters" / "first draft — review before saving") + **per-rule reasoning** (Salesforce shows
*why* each attribute was chosen). The honesty bar everyone clears: **"review before relying."** The gap
nobody fills: **streaming the interpretation as it builds** — a differentiation opportunity for us.

---

## Input affordance patterns

How the *box itself* is designed — multi-line, auto-grow, placeholder coaching, submit, and how it
signals "AI / describe it here" without being a faint box.

### Multi-line + auto-grow (the expected default)

Every leading AI composer is a **multi-line field that grows with content** — and most are *not* plain
`<textarea>` but rich `contenteditable`/ProseMirror editors:

- **Perplexity** — `contenteditable` composer (role=textbox). **Verified live:** typing a long
  multi-line request grew the box from **52px → 120px** in front of me. `[verified: live DOM 2026-06-22]`
- **ChatGPT** — `contenteditable` ProseMirror editor wrapping a `<paragraph>`; starts ~1 line, expands
  per line break. `[verified: live DOM 2026-06-22]`
- **Vercel v0** — multi-line auto-growing `contenteditable`, compact single row → max-height → scroll.
  `[verified: live DOM 2026-06-22]`
- **Raycast / Claude / Notion inline-AI** — all multi-line, auto-grow. `[verified: official docs;
  exact row caps unverified]`

**Auto-grow is not a free native default — cap it.** No mainstream design system ships guaranteed
auto-grow:
- shadcn/ui base `Textarea` **does not auto-grow** (min-height ~80px; auto-resize is an open, unmerged
  request — issue #2863, PR #1681). `[verified: github.com/shadcn-ui/ui]`
- The canonical AI composer block — **Vercel AI SDK "AI Elements" `PromptInput`** — documents an
  auto-resizing `<PromptInputTextarea>` with **configurable min/max height**, **"Enter to submit,
  Shift+Enter for new line,"** and a `<PromptInputSubmit status>` whose icon swaps across
  **submitted / streaming / error**, plus a footer toolbar (`PromptInputTools`, model select).
  `[verified: elements.ai-sdk.dev/components/prompt-input]` **Adversarial flag:** an open upstream bug
  (`vercel/ai-elements` #65) reports the auto-resize "not implemented" — treat the AI-Elements
  auto-resize as aspirational and implement it yourself. `[verified discrepancy]`
- **Vercel Geist** frames growth as layout discipline: *"Set a generous default `rows` and grow only
  when the surface has vertical room; don't let the field push primary actions below the fold."*
  (examples use `rows={5}`, `minHeight: 100`). `[verified: vercel.com/geist/textarea]`

> **Verified-safe recipe for us:** min ~3 rows (the box must *read as writable*), auto-grow up to a
> max-height, then internal scroll — so it never pushes the "Build rules" button below the fold.
> Implement via `react-textarea-autosize`, the CSS replicated-value trick, or `field-sizing: content`
> where supported. (Our brief already specifies min ~3 lines — this confirms it.)

### Placeholder coaching — short invitation IN the box, real teaching OUTSIDE it

This is the single most consistent finding, and it directly shapes our placeholder.

**The on-trend in-box placeholder is a brief, conversational invitation with an ellipsis** — *not*
instructions:
- "Ask anything" — **ChatGPT** `[verified: design analysis + live DOM]`
- "Ask anything…" — **Perplexity** `[verified: live DOM]` (on focus: inline hint *"Type @ for connectors
  and sources"*)
- "Ask AI anything…" — **Raycast** `[verified: raycast.com/core-features/ai]`
- "Ask v0 to build…" — **v0** `[verified: live DOM]`
- "Search for anything at {Workspace name}" — **Glean** (branded/dynamic) `[verified: docs.glean.com]`

**Heavier coaching is delivered OUTSIDE the field** as suggestion chips / example prompts / mode pills /
template rails. This is a hard rule from every design authority:
- **NN/g:** placeholder-as-instructions is an anti-pattern — *"Fields need labels and (sometimes)
  instructions, but placing this text inside the field lowers usability and accessibility and should be
  avoided."* `[verified: nngroup.com/articles/form-design-placeholders/]`. Instead, *"Providing suggested
  prompts reduces user effort by removing the burden of formulating questions"* — render as clickable
  buttons positioned **near the input field** so they're *"noticed at the exact moment users are most
  likely to engage."* `[verified: nngroup.com/articles/designing-use-case-prompt-suggestions/]`
- **NN/g on specificity:** *"Specific and targeted suggestions help users quickly determine relevance"*;
  full examples *"help users grasp what's possible and how to phrase their requests."* The praised model
  is concrete (Instacart's "Easy family dinners," "Nutritious snacks for kids"). `[verified: same]`
- **NN/g empty-state finding (load-bearing for our persona):** *"When a chatbot opens with a vague 'How
  can I help?' prompt, users have no signal about what the system can answer, but when it opens with three
  named example queries scoped to its domain, users can tell within five seconds whether the tool will
  work for them."* `[verified: nngroup.com search summary]`
- **Material 3 / Geist agree:** label (persistent) + placeholder (transient *example*, not instructions)
  + supporting/helper text (persistent, for "how it's used"). *"placeholders show an example value, not
  instructions."* `[verified: m3.material.io/components/text-fields; vercel.com/geist/textarea]`

**Why specificity in the example matters** — NN/g "vague prompts fail": *"AI struggles with ambiguity";
"clarity and specificity matter more than sheer length."* The example we coach with should name concrete
*values and constraints* (a number, a window), because that's how we teach the user to phrase. `[verified:
nngroup.com/articles/vague-prototyping/]`

#### Concrete placeholder + coaching copy we can adapt

Because of the anti-pattern rule, split it: a **short invitation as the actual placeholder**, and the
**teaching examples as tappable chips / a one-line helper below the box** (not crammed inside).

**Option A — invitation placeholder (short, in the box):**
> `Describe the accounts to target, in plain English…`

**Option B — even shorter (most on-trend):**
> `Describe who this should run on…`

**Teaching examples — as TAPPABLE chips below the box** (each fills the box when tapped; this both coaches
*and* gives a one-tap path — see AI dosage). Make them concrete, with real values:
> • "Big accounts (MRR over $1,500) that are at-risk and renewing in the next 30 days"
> • "Owners who haven't logged in for 21+ days and aren't using Workflows"
> • "Accounts whose health is falling fast this week"

**Helper line under the box** (persistent supporting text — the honest contract):
> `We'll turn this into editable rules below — always check them.`

Our brief's longer multi-line placeholder ("Describe the accounts… For example: '…'") is *acceptable* as a
focus/empty-state coaching block, but per NN/g/Geist it's better as **a heading + chips**, not stuffed into
the field's `placeholder` attribute (which disappears the moment they type and hurts a11y).

### Submit affordance — visible button + a deliberate keyboard model

**A visible send button is near-universal and increasingly state-aware:**
- ChatGPT ("Send prompt" up-arrow), Claude (up-arrow, doc-confirmed), v0, Perplexity (appears after
  typing) — all icon-only up-arrows. `[verified: live DOM / official docs]`
- **AI Elements formalizes a submit button whose icon reflects idle → streaming → error.** `[verified:
  elements.ai-sdk.dev]`
- Keyboard-first launchers (Raycast, Linear) de-emphasize the graphical button.

**Keyboard model — the dominant web convention is Enter = send, Shift+Enter = newline**, verified for
ChatGPT, Claude, v0, Raycast (default), Glean (Enter = primary). `[verified across sources]`

**BUT — our box is a multi-line *composition* box, and our brief correctly inverts this.** The case for
**Enter = newline, Cmd/Ctrl+Enter = "Build rules":**
- **Apple HIG explains why this needs care:** a single-line text *field* treats Return as submit, but a
  multi-line text *view* treats Return as **newline** — *"For multiline or multistyle text entry, use a
  text view instead."* So a multi-line composer needs an **explicit send affordance and/or a modifier
  shortcut.** `[verified: developer.apple.com text-views; Cmd+Return mapping = convention/inference]`
- **The Cmd/Ctrl+Enter-to-submit convention is well established for multi-line composers** — Slack offers
  it explicitly ("press Enter to → Start a new line," then Cmd/Ctrl+Enter sends), and GitHub PR/issue
  comments submit on Cmd/Ctrl+Enter. `[verified: slack help; widely documented]`

> **Recommendation:** prominent **"Build rules"** button (primary, solid-blue focal action) +
> **Cmd/Ctrl+Enter** to submit, **plain Enter = newline** (because we *want* multi-line input). Show a
> quiet keyboard hint near the button. This matches our brief and is defensible against HIG + Slack/GitHub
> convention. Make the button **state-aware** (idle → compiling → done) per AI Elements.

### How the box signals "AI / describe it here" — labeled controls, NOT a faint ghost box

The recurring kit that makes the box obviously actionable (and the sparkle is *fading*):
- **A model/mode chip** — Perplexity (Search/Computer pills + Model selector), Raycast (model picker),
  v0 ("v0 Max"), Glean (Search⇄Chat toggle + Fast/Thinking selector). `[verified]`
- **A `+` / attach + tools menu** — ChatGPT, Claude, Perplexity, v0. `[verified]`
- **`@` / `/` command affordances** — Claude (*"click '+' … or type '/' to view options and commands"*),
  Perplexity ("Type @ for connectors"), Notion (`/AI`), Linear. `[verified]`
- **Suggestion chips / example prompts / template rails** below the box — ChatGPT, v0
  ("Contact Form," "Mini Game," + "Refresh suggestions"), Notion, Linear, Glean. `[verified]`
- **The sparkle is being abandoned:** **Notion dropped the ✨ sparkle for an animated face glyph + a
  persistent purple/violet accent** as its "this is AI" cue; CSS-Tricks documents broader "sparkle
  fatigue." The trend is toward **labeled, functional controls** over a generic AI glyph. `[verified:
  Fast Company, CSS-Tricks, xray.tech]`

> **For us:** keep the inviting **soft-blue "AI" hero treatment** (an accent surface, not a faint
> outline), a clear **"Build rules"** primary button, **tappable example chips**, and (optionally) a
> small AI/sparkle or our own mark *paired with a label* — not a lone glyph. The honest helper line
> ("…always check them") doubles as a capability signal. A faint ghost box is exactly the failure mode
> to avoid — every leading product makes the AI box the most *actionable* thing on screen.

---

## NL→editable-rules compile loop

How the natural-language result becomes **editable structured rules**, how products show "here's what I
understood," and how users correct it. **This is the most consistent pattern in the entire landscape.**

**NL is a draft compiler, not an oracle — universal.** Every product that ships "describe it → filters"
(HubSpot, Salesforce, Amplitude, Mixpanel, ThoughtSpot, Segment, Airtable) lands the user in a **manual,
editable rule/query/formula editor** and keeps that structured surface as the source of truth. **None
auto-applies and walks away.**

**The closest analog to our exact pattern — HubSpot Breeze "Generate segment filters with AI"** (verbatim
flow, our north star):
1. *"In the **Generate segment filters with AI** text box, enter a description of the types of records you
   want to include."* (example: *"Contacts who opened an email in the last 30 days"*)
2. → *"The right panel will open with a **preview of the generated filters**."*
3. → *"If the filters are correct, click **Add these filters**."* (a confirm gate)
4. Editable afterward: *"You can still **manually edit the filters** in the segment editor."*
5. Re-prompt loop: *"To adjust your prompt, click **Edit prompt**, update the description, then click
   **Generate filters**."*
`[verified: knowledge.hubspot.com/segments/use-ai-assistants-in-lists & create-active-or-static-lists]`

**"Here's what I understood" — three ways products show the interpretation:**
1. **The generated structured rules ARE the explanation** (most common). HubSpot/Segment show filter
   chips; Mixpanel shows the editable query-builder view (*"viewable and editable like any other report …
   you can go into its query builder view and see what events are being used … add your own edits"*).
   `[verified]`
2. **Color-coded, editable, hover-to-explain tokens — ThoughtSpot, the purest form and best precedent for
   non-technical users.** The search bar *"shows boxes around each search phrase,"* hover reveals an
   **x to remove**, you can *"insert a new phrase in the middle,"* color-coded *"Measures are green,
   attributes are blue, and filters are gray."* Sage compiles NL into those same tokens: *"you can view
   the … tokens that matched your natural language query to **verify the measures, attributes and
   filters used** … If you notice an error, you can quickly modify the query by adding or removing search
   phrases."* `[verified: docs.thoughtspot.com search-bar / Sage / Spotter]`
3. **Per-rule reasoning — Salesforce Einstein, the richest "why did you pick this."** The draft includes
   a **segment description**, **Suggested Attributes** (*"most relevant based on your prompt"*),
   **Additional Attributes** (optional), AND *"the reasoning behind the attributes suggested."* Controls:
   **Refine Segment** (re-describe) and **Edit Segment Rules** (*"manually adjust any attribute or
   value"*). `[verified-via-snippet: help.salesforce.com c360 create-segment-einstein]`

**Two complementary correction paths everywhere** (give the user both):
- **Re-prompt in NL** → overwrites the rules (Segment: re-prompt *"overwrites the existing conditions"*;
  HubSpot "Edit prompt → Generate"; Salesforce "Refine Segment"). `[verified]`
- **Hand-edit the structured rules** → surgical (every product). `[verified]`

**Grounding to your real schema is the shared safeguard.** Everyone anchors term-mapping to the actual
data: Amplitude semantic-searches existing content to pick the right property version; Salesforce Data
Prism *"correlates the natural language phrases … with your Data Cloud data"*; ThoughtSpot maps to the
semantic model. The common failure is an **invalid/missing entity**, surfaced as an error + reword — not a
hallucinated rule. `[verified]` **→ For us: compile only against the attribute catalog
(`gocsm-attribute-filter-catalog.md`); if the NL references something off-catalog, say so explicitly
rather than inventing a rule.**

**Reveal is batch, not streaming — the open opportunity.** No product documents streaming the
interpretation token-by-token; they show a preview/progress bar then the complete artifact. *Streaming the
compiled rules as they appear* (or animating chips in one by one) is a genuine differentiation lever and
feels more honest/alive for our persona.

> **For our build:** NL box → **compile → preview the editable rule chips below** → a **confirm/"these
> look right" affordance** → rules live in the Simple/Advanced builder where they're fully hand-editable.
> Show **per-rule provenance** ("from: *renewing in the next 30 days*") à la ThoughtSpot tokens +
> Salesforce reasoning. Keep the **plain-English restatement** (our brief already has it) as the
> human-readable "here's what I understood." Re-running the NL box overwrites; editing chips refines.

---

## Ambiguity & failure handling

How products handle "I'm not sure what you meant." There's a real divide — and the better camp for our
persona is **interactive disambiguation + honest refusal.**

**Two camps:**
1. **Best-effort draft → you correct it** (HubSpot segment-gen, Salesforce, Amplitude, Mixpanel,
   Segment-core, Airtable). Recovery = reword / re-prompt / hand-edit. No clarification dialog. `[verified]`
2. **Interactive disambiguation** (better for non-technical users):
   - **ThoughtSpot Spotter** — *"If Spotter finds more than one Model that could apply to the question, it
     **surfaces them so you can manually choose which source you meant**."* Research mode *"surfaces the
     plan and asks permission to proceed."* `[verified: spotter-capabilities]`
   - **HubSpot Breeze Assistant (chat)** — *"When Breeze Assistant needs clarification, a **question card**
     may display … select one or more **predefined options** or enter a custom response."* `[verified:
     knowledge.hubspot.com/ai/use-breeze-assistant]`
   - **AWS Connect's** Segment-AI variant adds guided clarifying questions + missing-attribute flagging.
     `[verified]`

**Honest "I can't do that" beats faking it:**
- **ThoughtSpot** refuses "why"/pronoun questions and *hides* AI-suggested searches it can't generate
  (*"not shown when ThoughtSpot couldn't generate them"*). `[verified: search-ai-suggested]`
- **Salesforce** documents hard limits in writing (*"you can't use the OR and Exclude operators"*).
  `[verified-via-snippet]`
- **Segment** names the exact problem: *"Segment had trouble creating an audience from this description.
  Try rewording it …"* / *"The prompt referenced an invalid or non-existing trait, audience, or event."*
  `[verified: twilio.com/docs generative-audiences]`

**Suggestions/autocomplete as a learning on-ramp** — ThoughtSpot's AI-suggested searches are *"designed
to help you learn … when working with a new data set,"* and autocomplete previews tokens as you type.
`[verified: spotter-best]`

> **For our persona:** when the NL is ambiguous or off-catalog, **don't silently guess.** Patterns to
> adopt, in priority order: (1) **name the specific problem** ("I don't have a field for 'engagement
> score' — did you mean **Health score** or **logins**?") with **tappable options** (Spotter + Breeze
> question card); (2) **partial parse** — compile the rules you're confident about, flag the one you're
> not, let them fix just that chip; (3) **honest empty/failure state** — "I couldn't turn that into rules.
> Try naming a number and a window — e.g. 'MRR over $1,500, renewing in 30 days'" (reword coaching, not a
> dead end). Surface a couple of **suggested example chips** to teach phrasing.

---

## Trust/honesty patterns

How products stay honest about an imperfect compiler — critical at our $2–3k/mo bar and for a non-technical
user who *cannot* read SQL to verify.

**"Review before relying" is the universal disclaimer:**
- **Amplitude:** *"Always review and validate AI-created analyses before using them in important
  decisions."* `[verified: amplitude.com/docs global-agent-overview]`
- **Mixpanel:** *"Treat it as a first draft and review the events before saving."* + legal: *"review the
  quality of the responses … designed to inform human decision-making, not replace it."* `[verified:
  docs.mixpanel.com mixpanel-agent; mixpanel.com/legal/gen-ai-features]`
- **ThoughtSpot:** *"AI-generated Answers are occasionally inaccurate due to their probabilistic nature.
  Please verify results by checking the **search tokens** above the chart before using or sharing."*
  `[verified: sage-search-best-practices]`
- **Airtable:** *"AI responses are designed to be reviewed and edited by users and may contain
  inaccuracies or biases."* `[verified: support.airtable.com using-airtable-ai-in-fields]`
- **NN/g** prefers a *specific, actionable* disclaimer over vague ones: *"Claude can make mistakes. Please
  double-check responses"* beats *"AI-generated, for reference only."* `[verified:
  nngroup.com/articles/explainable-ai/]`
- **Notable gap to beat:** **HubSpot has NO point-of-use disclaimer on the segment-filter generator** —
  the warnings live only on its content-gen pages. We should put the honesty *at the point of use.*

**Verifiability WITHOUT SQL is the explicit design goal** (ThoughtSpot's clearest articulation, and the
single most important precedent for us): tokens *"explained in terms that anyone can understand, correct,
and modify"* let non-technical users verify in plain language — *"does not require reviewing or
understanding the underlying SQL,"* solving the text-to-SQL trap where *"only a person proficient with data
and SQL can verify if AI answered their question correctly."* `[verified: blog/introducing-spotter-ai-analyst]`

**Differentiated honesty mechanisms worth stealing:**
- **Amplitude — per-claim citations / grounding:** *"Validate the data. All generated content includes
  links so you can verify"; "Every claim includes a link to supporting data"; "It never fabricates or
  guesses. It reports what the data shows."* + honest *"It'll probably never be perfect."* `[verified]`
- **Salesforce — per-attribute reasoning** ("the reasoning behind the attributes suggested") is the
  richest "why this rule." `[verified-via-snippet]`
- **Segment — structured "AI Nutrition Facts Label"** openly admitting *"Human in the Loop: Yes,"
  "Guardrails: Yes,"* and candidly *"Input/Output Consistency: No."* `[verified:
  twilio.com/docs generative-audiences-nutrition-facts]`
- **Reproducibility is candidly disclaimed, not hidden** — Salesforce: *"isn't always consistent … you
  might get different results when entering the same prompt."* `[verified-via-snippet]`

**NN/g on citations (caveat):** place sources *"directly next to the specific claim,"* link to the
relevant part, use meaningful labels — but note citations are *"often hallucinated"* and users *"rarely
click,"* creating false confidence. So **provenance must be real and inline** (our compiled rules map to
real catalog fields — that's a genuine, non-hallucinated provenance we can show). `[verified:
nngroup.com/articles/explainable-ai/]`

> **For us:** (1) an **honest point-of-use line** under the box — *"We'll turn this into editable rules
> below — always check them."* (2) **Per-rule provenance** so the user sees the NL mapped to a real
> catalog field (ThoughtSpot tokens + Salesforce reasoning), verifiable **in plain English, never SQL.**
> (3) The **plain-English restatement** of the whole rule set (already in our brief). (4) A **live match
> count / MatchWall** as the ultimate "is this right?" check — the user sees *which accounts* this catches
> (already in our brief; this is our equivalent of Amplitude's "verify against the data"). Avoid
> over-claiming confidence; never silently apply.

---

## AI-readiness — right dosage for our persona

When NL helps vs. when a few taps are faster. The research is unusually clear here, and it cuts *against*
making NL the only path.

**The "typing bottleneck" / "Keyhole Effect" is real and measured:**
- A simple refinement like "filter for enterprise users" takes **5–10 seconds to type**, while **clicking
  a checkbox labeled 'Enterprise' takes ~500ms** — an order of magnitude difference; and *"each typed
  command interrupts analytical flow."* `[verified: research summary, multiple HCI sources]`
- **"The Keyhole Effect: Why Chat Interfaces Fail at Data Analysis"** — chat *"systematically undermines
  the exploratory capabilities essential to effective data analysis"*; **good for** *"well-defined,
  specific questions where users know exactly what they want,"* **poor for** *"exploratory analysis …
  discovering unexpected patterns."* Recommends **hybrid systems that combine NL with direct-manipulation
  GUI controls.** `[verified: arxiv.org/abs/2602.00947]`
- **DirectGPT / synergy research:** *"natural language helps direct manipulation … by description, while
  direct manipulation enables users to learn which objects and actions are available"* — the combination
  *"overcomes limitations of these techniques when used separately."* `[verified: CHI 2024 DirectGPT;
  Monash synergy work]`

**Products explicitly target the non-technical user and treat NL as an on-ramp, not the power path:**
- **Amplitude:** Ask is *"intended primarily for … users with minimal experience using analytics tools,
  or with limited understanding of the data taxonomy."* And *"you get out of it what you put in. Put in
  vague questions, and you won't get meaningful answers."* `[verified]`
- **Airtable — best explicit dosage guidance found:** use the AI assistant for *"Quick data analysis"*
  and *"Building new tables, views, or fields with natural language,"* but use **traditional features**
  for *"Complex multi-step workflows requiring precise control."* `[verified: support.airtable.com
  using-omni-ai-in-airtable]`
- **ThoughtSpot:** *"You can take control and modify the answer … using our keyword-based search
  interface"*; suggestions are *"designed to help you learn"* (on-ramp). `[verified]`
- **Mixpanel** situational use: *"You need a quick answer without opening a report"* / *"a stakeholder
  asked a question you don't have a board for yet."* `[verified]`

**Prompt quality gates output** — Amplitude ("you get out what you put in"), Salesforce ("provide
descriptive names … so generative AI can understand them"), Segment ("more accurate results if you base
prompts on specific events and traits"). `[verified]` → this is *why* the coaching example must model
concrete values.

> **Dosage verdict for the overwhelmed ADHD agency owner:**
> - **NL wins** for the **complex, multi-condition, long-tail request** ("big at-risk accounts renewing
>   soon who stopped logging in") — too many taps to assemble, and the user can describe it faster than
>   they can hunt through a field picker. This is the hero, and it's the right hero.
> - **A few taps win** for the **common, single-condition case** ("at-risk accounts," "renewing in 30
>   days"). For these, NL is *overkill* — typing a sentence is slower than one chip. **So pair the NL box
>   with one-tap "recipe" chips** (which double as phrasing coaches per NN/g). The example chips below the
>   box *are* the low-dosage path.
> - **Direct manipulation is the precision/verification surface** — the editable rule builder is where the
>   user lands and stays. NL drafts; taps refine. This is exactly the hybrid the Keyhole research
>   prescribes, and it's already our Simple/Advanced builder.
> - **Never make NL mandatory or the only entry.** A non-technical user staring at a blank "describe it"
>   box with no examples is the failure mode (NN/g's "vague 'How can I help?'"). Always offer the
>   one-tap recipes alongside.

---

## Dos & Don'ts

**Input box**
- ✅ Multi-line, min ~3 rows, auto-grow up to a max-height then internal scroll (don't push the button
  below the fold — Geist). Implement auto-grow yourself; don't rely on shadcn/AI-Elements native.
- ✅ Inviting soft-blue "AI" hero surface; the box is the **most actionable** thing on screen.
- ✅ **"Build rules"** primary button (solid-blue focal action), **state-aware** (idle → compiling → done).
- ✅ **Cmd/Ctrl+Enter = submit, plain Enter = newline** (it's a composition box — HIG + Slack/GitHub
   convention). Show a quiet keyboard hint.
- ❌ Don't use a faint ghost outline. ❌ Don't make Enter submit (it's multi-line). ❌ Don't rely on a lone
   sparkle as the only AI cue — pair any glyph with a label (the sparkle is fading industry-wide).

**Placeholder & coaching**
- ✅ Short invitation as the actual placeholder ("Describe who this should run on…").
- ✅ **Teaching examples as tappable chips below the box** — concrete, with real values (MRR $1,500, 21+
   days, 30 days). They coach phrasing *and* give the one-tap low-dosage path.
- ✅ A persistent helper line: "We'll turn this into editable rules below — always check them."
- ❌ Don't stuff multi-line instructions into the `placeholder` attribute (a11y + disappears on type).
   ❌ Don't open with a vague "How can I help?" and no examples.

**Compile → edit loop**
- ✅ NL compiles to **editable rule chips**, fully hand-editable in the Simple/Advanced builder.
- ✅ Show **"here's what I understood"** = per-rule provenance (ThoughtSpot tokens) + the plain-English
   restatement; verifiable **in plain English, never SQL.**
- ✅ Two correction paths: re-run NL (overwrites) **and** edit chips (surgical).
- ✅ Compile only against the real attribute catalog; live match count as the final "is this right?" check.
- ✅ Consider **streaming/animating the rules in** as they compile — nobody does it; it's honest and alive.
- ❌ Don't auto-apply and walk away. ❌ Don't compile against fields the user can't see/verify.

**Ambiguity & failure**
- ✅ Name the specific problem + offer tappable options ("did you mean Health score or logins?").
- ✅ Partial parse — compile what's clear, flag the uncertain chip.
- ✅ Honest failure state with reword coaching ("try naming a number and a window").
- ❌ Don't silently guess on ambiguity. ❌ Don't fail into a dead end with no next step.

**Trust**
- ✅ Honest disclaimer **at the point of use** (beat HubSpot's gap). Specific + actionable (NN/g).
- ✅ Real, inline provenance per rule (not hallucinated citations).
- ✅ Match count / preview as the ground-truth verification (Amplitude "verify against the data").
- ❌ Don't over-claim confidence. ❌ Don't bury the "always check" message.

**Dosage**
- ✅ NL for complex multi-condition requests; one-tap recipe chips for common single-condition cases.
- ✅ Keep the editable builder as the precision/verification surface (the hybrid the research prescribes).
- ❌ Don't make NL the only entry. ❌ Don't use NL where one tap is faster (single common filter).

---

## Sources (primary, verified 2026-06-22)

**Closest analogs (NL → editable filters/segments):**
- HubSpot Breeze — knowledge.hubspot.com/segments/use-ai-assistants-in-lists · /create-active-or-static-lists · /ai/use-breeze-assistant
- Salesforce Einstein segment creation — help.salesforce.com (c360 create-segment-einstein; einstein_prompts) *[snippet-verified; SPA wouldn't render]*
- ThoughtSpot Sage / Spotter / Search — docs.thoughtspot.com (search-bar, Sage, spotter-getting-started, sage-search-best-practices) · thoughtspot.com/blog/introducing-spotter-ai-analyst
- Amplitude Ask / Global Agent — amplitude.com/blog/ask-amplitude · amplitude.com/docs (ask-amplitude, global-agent-overview)
- Mixpanel Agent / Spark — docs.mixpanel.com (mixpanel-agent, spark) · mixpanel.com/blog/spark-bringing-generative-ai-to-mixpanel · /legal/gen-ai-features
- Segment/Twilio Generative Audiences — twilio.com/docs (generative-audiences, -nutrition-facts) *[segment.com 403'd; twilio mirror verified]*
- Airtable — support.airtable.com (using-omni-ai-in-airtable, using-airtable-ai-in-fields, formula-field-overview)

**Input affordance (live DOM / docs):**
- Perplexity — live DOM 2026-06-22 (auto-grow 52→120px verified) · ChatGPT — live DOM 2026-06-22 · Vercel v0 — live DOM 2026-06-22
- Claude.ai — support.claude.com/en/articles/8114491 · Raycast — manual.raycast.com/ai, /ai/chat · Notion — notion.com/help/guides/notion-ai-for-docs · Linear — linear.app/docs/linear-agent · Glean — docs.glean.com

**Generic design guidance:**
- NN/g — articles: designing-use-case-prompt-suggestions, prompt-controls-genai, explainable-ai, form-design-placeholders, vague-prototyping
- Vercel Geist — vercel.com/geist/textarea · shadcn AI Elements — elements.ai-sdk.dev/components/prompt-input (+ open auto-resize bug #65) · shadcn-ui/ui #2863, PR #1681
- Apple HIG (text-fields / text-views) · Material 3 (m3.material.io/components/text-fields)
- "The Keyhole Effect: Why Chat Interfaces Fail at Data Analysis" — arxiv.org/abs/2602.00947 · DirectGPT (CHI 2024) — dl.acm.org/doi/10.1145/3613904.3642462
- Slack help (Enter-to-newline preference) · GitHub comment Cmd/Ctrl+Enter convention
