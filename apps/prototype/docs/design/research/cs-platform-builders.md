# CS-platform rule / segment / playbook builders — competitive dossier

> **Lens:** direct competitors — customer-success platforms. How each lets a CSM define
> segments / playbook entry-criteria / health-alert rules in its **rule/segment/playbook
> builder** specifically.
> **For:** redesigning step 1 ("Who it runs on") of the GoCSM Attention activation wizard —
> a dead-simple AND/OR engine with **Simple** (flat list) and **Advanced** (nested groups)
> modes + typed value controls. See the active brief
> [`trigger-criteria-builder-redesign.md`](../trigger-criteria-builder-redesign.md) and the
> [`gocsm-attribute-filter-catalog.md`](../gocsm-attribute-filter-catalog.md).
> **Persona:** overwhelmed, ADHD HighLevel agency owner managing ~1000 sub-accounts — NOT an
> analyst. Bar: looks worth $2k/mo, passes the 3-second test, "don't make me think — cut
> before you add."
>
> **Method.** Web search + fetch over primary sources (vendor docs / help centers, product
> pages, G2/Capterra, demo material). Each load-bearing claim corroborated across ≥2 sources
> where possible; **single-source or unverifiable claims are flagged inline**. Built 2026-06-22.
>
> **Access caveats.** ChurnZero's Zendesk help center 403'd direct fetches (anti-bot) — its UI
> mechanics come from search-indexed help text + developer/API docs + the Twilio Segment
> integration note, corroborated across those. Custify's help center is thin/gated — its
> section is lower-confidence and flagged throughout. Gainsight, Vitally, Planhat, Totango,
> and Catalyst help pages fetched cleanly and are high-confidence.

---

## Per-product findings

> **One structural fact true of nearly every product:** there is essentially **one filter
> primitive reused everywhere** — the same `field → operator → value` row mechanic powers
> segments, health scores, playbook/program entry-criteria, and automation branches. Learn it
> once; but its weaknesses (jargon, grouping, model-literacy) compound because the persona
> meets it in five places.

### Gainsight

The heaviest, most analyst-shaped of the set. Multiple overlapping builders — **Rules Engine
(Bionic Rules / Horizon Experience)**, **Power Lists** (Journey Orchestrator), **Programs
entry-criteria**, **Segments**, **Playbooks/CTAs**, **Data Designer** — all share one filter
grammar.

- **Pattern.**
  - *Composition:* vertical list of `Object → Field → Operator → Value` rows; add with `+`,
    delete with `x`. **Default join is AND** ("By Default, the AND logic is applied").
    Grouping/nesting is **not** visual — it's a free-text **"Advanced Logic" box**: each row is
    auto-assigned a letter token (A, B, C…) and you **type a boolean expression** like
    `(A OR B) AND C` or `(A AND B) OR (C AND D)`. No UI group limit; no visual groups.
  - *Field picking:* two-step **object → field drilldown**; Rules Engine offers an
    "Add Fields" panel with a "Search Fields" box. Assumes you know which object your data
    lives on (Company vs Relationship vs Person).
  - *Value entry:* operator + value box ("enter or select"); operators equals/not-equals/
    >/≥/</≤/contains/does-not-contain; an **"Include null values"** checkbox. Per-type widgets
    (relative-date pickers, multiselect chips) **not enumerated in the fetched docs** — generic
    mechanic confirmed, rich typed controls *partially confirmed*.
  - *Simple vs Advanced:* **no toggle** — one mode where "advanced" is a degree (the always-
    present Advanced Logic box) or a heavier *tool* (Segments → Power Lists → Bionic Rules →
    Data Designer with joins/transforms, admin-only).
  - *Empty state:* opens **blank/structural** — pick object, add first row. Templates exist at
    the *Program* layer, not in the filter canvas. *(Reasoned from the documented add-a-row
    flow; no explicit empty-state screenshot found — flagged.)*
  - *Live preview / match count:* **PREVIEW panel shows up to 2,000 sample rows** with
    Maximize + Refresh. **No live "X accounts match" counter** that updates as you type — sample
    rows, not a running number.
- **What's good.** One consistent grammar everywhere; AND-by-default with complexity opt-in;
  field search inside object scope; sample-record preview to confirm a rule returns *something*.
- **What's bad for our persona.** **The "Advanced Logic" token string is the killer** — reading
  row letters and hand-typing `(A AND B) OR (C AND D)` is writing boolean algebra in a text box
  (max working-memory load). A documented **footgun**: editing filters **silently reverts OR
  logic back to all-AND**, with the community workaround being "paste your expression into a
  text file and paste it back" *(single-source community/best-practice — flagged)*. Object→field
  drilldown demands a data model the user doesn't have. **No live match count.** Tool sprawl;
  G2 corroborates "steep learning curve," "not intuitive," "often requires a specialized admin,"
  5+ month implementations.
- **Underlying principle.** *Steal:* one grammar, AND-by-default, complexity opt-in. *Avoid:*
  **encoding grouping as a hand-typed token expression** — it externalizes the parse tree onto
  the user's memory and must never silently reset. If grouping is needed, it has to be
  **visual/structural** (nested cards you can see), never a string.
- **AI usage.** **Gainsight AI does NOT build rules/segments.** Insight Agent (Staircase AI)
  does scoring/sentiment/churn-risk and *surfaces* at-risk accounts; thresholds are still set
  manually by an admin. Horizon AI / Sally do conversational data Q&A and analytics, **not**
  "type a sentence, get a segment." Verified directly on the Insight Agent doc.
- **Sources.** [Rules Engine (Bionic Rules) hub](https://support.gainsight.com/gainsight_nxt/03Rules_Engine/Rules_Engine_(Bionic_Rules)) ·
  [Rules Engine Horizon overview](https://support.gainsight.com/gainsight_nxt/03Rules_Engine/Rules_Engine_(Horizon_Experience)/About_(Horizon_Experience)/Rules_Engine_Horizon_Experience_Overview) ·
  [Best Practices of Rules Engine](https://support.gainsight.com/gainsight_nxt/03Rules_Engine/Rules_Engine_(Bionic_Rules)/Tutorials/Best_Practices_of_Rules_Engine) ·
  [Create Power Lists (advanced-logic + `(A AND B) OR (C AND D)`)](https://support.gainsight.com/SFDC_Edition/Journey_Orchestrator_and_Email_Templates/Standard_Outreaches/Create_Journey_Orchestrator_Power_Lists) ·
  [Add Participants to a Program (Segments/Events/CSV/Query Builder, PREVIEW)](https://support.gainsight.com/gainsight_nxt/Journey_Orchestrator_and_Email_Templates/Programs/Add_Participants_to_a_Program) ·
  [Insight Agent (AI does not build rules)](https://support.gainsight.com/gainsight_nxt/Insight_Agent_(Staircase_AI)/User_Guide/Explore_Insight_Agent_(Staircase_AI)_in_Gainsight_CS) ·
  [Horizon AI (press)](https://www.gainsight.com/press/gainsight-unveils-horizon-ai/) ·
  [G2 Gainsight CS reviews](https://www.g2.com/products/gainsight-customer-success/reviews)

### ChurnZero

The cleanest contrast with Gainsight. The **Segment** is the audience primitive; **Plays
(playbooks) and Alerts consume segments** rather than re-implement filtering.

- **Pattern.**
  - *Composition:* a **flat vertical stack of filter chips/boxes**. Start from a default filter,
    click a gray **"Add Filter"** to append; edit in-place inside the box; remove with the box's
    "x". **Logic is AND-only within a single Segment** — double-confirmed: developer docs state
    "all filters used in conjunction with Segments must use the 'and' operator," `and`/`or`
    "cannot be combined," 5-operator limit. **No OR, no nested groups, zero nesting** in the
    segment UI. To express OR you build separate segments (or use the API).
  - *Field picking:* **categorized picker** — "Select the filter you need from the categories
    available," organized by entity type (**Account Attribute, Contact Attribute, Event/feature
    usage**). *(Category-picker widget — dropdown vs rail — inferred, not screenshot-confirmed.)*
  - *Value entry:* **in-place, human-readable** ("change True to False"); type-aware (boolean,
    numeric, time-windows like "tenure less than 90 days"). Include/exclude via operator choice +
    removing the default filter, not a dedicated toggle. *(Per-field widget matrix not exhaustively
    documented — flagged.)*
  - *Simple vs Advanced:* **only a simple mode, by design** — because segments are AND-only flat
    lists there is no nested mode to switch into. The escape hatch is *outside* the UI (API
    complex filters, or composing multiple segments).
  - *Empty state:* **not blank** — opens with **`IsActive = True` pre-placed** ("most of the time
    you want…active/current customers"). A new segment starts as "all active customers"; you
    narrow from there. Strong subtractive default. *(Directly stated in the support article.)*
  - *Live preview / match count:* segments are **dynamic**; counts surface once consumed (Live
    Exports, Slack/Teams bot, conversational query). The article says iterate "until your Segment
    is showing the results you want." **A live "X match" counter that updates *as you edit* is NOT
    confirmed from primary docs — plausible but flagged.**
- **What's good.** Flat AND-only = radically lower load (no letters, no parentheses, no boolean
  string). **Smart non-empty default** (`IsActive = True`) — never start from a void. In-place
  edits read like plain English. Entity-typed categories are a gentle taxonomy. Segment is the
  single reusable audience primitive.
- **What's bad for our persona.** **AND-only is a real ceiling** — the moment the owner wants
  "tag X **OR** tag Y," they hit a wall and must spin up duplicate segments or learn the API,
  with **no in-UI signpost** (the failure mode is invisible). Multiple-segments-for-OR pushes
  complexity into segment *management*. Categories still expose CS jargon. Live-count-while-
  editing unconfirmed.
- **Underlying principle.** *Steal:* **start from a sensible populated default, not a blank
  canvas** (subtractive beats additive for non-analysts); and **constrain the primary builder to
  a flat AND list, pushing power to a separate path** (remove OR/nesting rather than hide it
  behind a toggle). *Avoid:* **making the AND-only ceiling a silent dead end** — if you adopt a
  flat model, give an obvious in-UI escape for OR ("match ANY" group) so the user never gets
  quietly stuck.
- **AI usage.** **ChurnZero AI does NOT build segments in-app.** Its CS-operations guidance frames
  AI as a **segmentation-*strategy* advisor** ("use AI to help define your desired segmentation
  outcomes," "ideate on tactics") — explicitly not auto-building segments. Its 2025 "Customer
  Success AI" / agentic roster (Harbinger, Beacon, Consult, Echo, Scribe…) does drafting, signal
  detection, enrichment; **none author segments/plays/rule criteria.** MCP "Connect" exposes data
  to external LLMs. Double-confirmed across two sources.
- **Sources.** [Creating a Segment (Add Filter, IsActive=True default, in-place edit)](https://support.churnzero.com/hc/en-us/articles/360001903632-Creating-a-Segment) ·
  [Creating an Alert – Alert Triggers](https://support.churnzero.com/hc/en-us/articles/360002758391-Creating-an-Alert-Alert-Triggers) ·
  [Twilio Segment → ChurnZero (corroborates "filters must use 'and'")](https://segment.com/docs/connections/destinations/catalog/churnzero/) ·
  [Customer Segmentation (dynamic segments)](https://churnzero.com/features/customer-segmentation/) ·
  [Customer Playbooks (segmentation + behavioral triggers)](https://churnzero.com/features/customer-playbooks/) ·
  [AI for CS operations (AI = strategy advisor, not builder)](https://churnzero.com/blog/ai-for-customer-success-operations/) ·
  [Customer Success AI (agents draft/detect, not author rules)](https://churnzero.com/features/customer-success-ai/) ·
  [Agentic AI for CS (agent roster)](https://churnzero.com/blog/agentic-ai-customer-success/)

### Vitally

One filter primitive across **Table Views, Segments, Health Scores, Indicators, and Playbook
audience triggers**. Best-in-class live preview; worst-in-class jargon.

- **Pattern.**
  - *Composition:* **AND and OR explicitly**, via **"Filter Groups"** ("Filter Groups allow you
    to use AND/OR logic with any groups of multiple filters"). AND/OR can mix *across groups*.
    **Nesting beyond one level: UNVERIFIED** — docs show/screenshot one level; treat "one level of
    groups, freely mixing AND/OR" as the confirmed ceiling. The same engine powers Playbook
    audience triggers (Playbooks add Wait/Branch *after* enrollment).
  - *Field picking:* added one at a time from a **right-side panel**; field universe is the
    **Trait** system + Vitally objects (Traits, Success Metrics, Indicators, Events, Notes/Tasks/
    Projects/Conversations, Custom Objects, Segments, Health Scores, lifecycle, NPS, Clearbit).
    Each Trait has a type (String/Number/Date/Boolean/Multi-select/Formula…) driving the controls.
    *(Picker UI — flat search vs categorized drilldown — UNVERIFIED.)*
  - *Value entry:* **type-driven operators** (e.g. `Tags > Contains > Follow up`, `Status is set
    to Qualified Trial`, boolean checkboxes). **Relative dates confirmed** ("Last QBR Date greater
    than 90 days ago"). Include/exclude via `is not set`/`is not`. Multi-select implied by the
    trait type. Per-trait choice of "Current Value" vs "Last Updated At."
  - *Simple vs Advanced:* **no documented toggle** — one builder; complexity is progressive
    *within* a mode (optionally add Filter Groups). A dedicated no-code **Health Score builder**
    (thresholds + weightings) is the only "easier" variant.
  - *Empty state:* **blank-but-templated** — ships a **Blueprint Library** of editable templates
    (Playbooks, Views, Dashboards) accessible *inline while building*. Raw segment creation is
    blank; **no AI/data-generated suggested segments** — suggestions are human-curated Blueprints.
  - *Live preview / match count:* **confirmed as a live list.** Playbooks show a **"Matching
    Audience"** panel ("shows the audience that currently matches the Playbook criteria") before
    deploy, split churned/non-churned, plus a single-record **Test** dry-run. Health Scores
    "preview how these rules would impact real accounts before going live." Segments are dynamic.
    **Nuance:** the confirmed live preview is the *result list*; a numeric **"X match" counter on
    a bare Segment/Table-View filter panel is NOT explicitly documented.**
- **What's good.** One reusable primitive; **live Matching Audience + single-record Test before
  commit** (recognize the result instead of parsing the logic); type-aware controls; inline
  Blueprints so the empty state is a starting point; real-time dynamic membership.
- **What's bad for our persona.** **"Traits" is analyst jargon** — the owner thinks "accounts
  paying me over $X," not "filter on the org trait MRR"; Traits/Objects/Orgs-vs-Accounts-vs-Users/
  Indicators/Success-Metrics/Filter-Groups is a wall of nouns. **Object-model overload** — you must
  know *which object* before picking a field. AND/OR-across-groups invites **silent logic errors**;
  right-rail stacked-rule density is high. **No simple/advanced toggle, no NL on-ramp.**
- **Underlying principle.** *Steal:* **"show the answer while they build the question"** — the live
  audience list + dry-run Test replaces *understanding the logic* with *recognizing the result*.
  *Avoid:* **exposing the data model as the entry point** — don't make the user speak the ontology
  (Traits/Objects/Groups) before expressing intent; capture intent in their words/values and map to
  fields behind the scenes.
- **AI usage.** **Vitally AI / Copilot does NOT build rules** (verified directly on the Copilot
  doc — segments/filters not mentioned). Its three features: AI Summaries, AI Actions (suggest
  tasks/extract objects/draft emails), Ask AI (NL Q&A over Accounts/Conversations/Notes/Tasks).
  No NL segment builder, no AI segment suggestion. Clear white-space.
- **Sources.** [Segmentation (Segments)](https://docs.vitally.io/en/articles/9914219-segmentation-segments) ·
  [Segmentation overview](https://docs.vitally.io/reporting-and-segmentation/segmentation) ·
  [Traits](https://docs.vitally.io/en/articles/9913997-traits) ·
  [Table Views](https://docs.vitally.io/reporting-and-segmentation/views) ·
  [Automated Playbooks (Matching Audience, Test)](https://docs.vitally.io/en/articles/9918977-automated-playbooks) ·
  [AI Copilot (does not build segments)](https://docs.vitally.io/en/articles/11655139-ai-copilot) ·
  [Blueprints](https://docs.vitally.io/en/articles/12610210-blueprints) ·
  [Segmentation feature page (real-time)](https://www.vitally.io/features/segementation) ·
  [Vitally AI](https://www.vitally.io/product/ai)

### Planhat

The most powerful and, at the top end, the most code-like. One rule grammar across **table
filters, reusable Global Filters, Health Lab, Workflow entry/exit, and Automation branches**.

- **Pattern.**
  - *Composition:* **rules in rows** (add via `+ Rule`). AND/OR is a per-group **"Match Rule"**:
    **"Match all"** (AND — "all of the criteria…will need to be present") / **"Match any"** (OR).
    **You cannot mix AND and OR inside one group.** **Groups** are added via a **purple arrow icon**
    ("headed by a new Match Rule"); to express `(A OR B) AND (C AND D)` you put A/B in a Match-Any
    group and C/D in a Match-All group. **Recursive nesting: UNVERIFIED** (one level documented).
    **Cross-model composition is first-class** via the **"Match By"** operator (e.g. ">5 open
    high-severity tickets AND usage down 30%").
  - *Field picking:* first selector in the row is a **purple dropdown** of that model's fields
    (incl. custom fields + **Calculated Metrics**). Models: Company, End User, Conversation,
    Project/Workflow, plus licenses/tickets/assets/opportunities.
  - *Value entry:* **type-aware** (date → "days ago" relative; numeric → "more than"/"less than";
    control switches dropdown/text/date-picker by type). Unusually large **operator vocabulary**:
    **Match By / Ignore By, Pick By / Exclude By, Any Of / None Of, Find By**. Health-factor
    conditions add linear/bounded + an **empty-value toggle**.
  - *Simple vs Advanced:* no toggle on the filter builder; power-vs-simple is split **across tools**
    with a **steep cliff**. Notably, **Automations have an explicit two-tier model**: **Templated
    Automations use a fill-in-the-blank "sentence" UI** (beginner) vs **Custom Automations use a
    flowchart** (power). **The true advanced tier is literal code** — **Calculated Metrics written
    as JSON arrays**, **Formula Fields as Excel-style formulas**, with a **Dojo certification course**
    to learn them.
  - *Empty state:* filter builder is **essentially blank** (`+ Rule`); reuse substitutes for
    templates — define a segment once as a **Global Filter** and reuse it (admin builds, others
    pick). **Automations DO have templates** (the sentence UI) — the closest guided first-run.
  - *Live preview / match count:* results update **live as a TABLE, not a headline count**
    ("the table automatically updates when you make your selection"). **No dedicated "X companies
    match" live counter** documented — live table confirmed, live count unconfirmed/likely absent.
- **What's good.** One rule grammar reused everywhere; **reusable named Global Filters** ("Declining
  Usage + Low Health") that double as triggers (segment-as-object, DRY); type-aware operators +
  relative dates; live table updates; genuine cross-object power; **the Automations "sentence"
  builder** (the single most ADHD-friendly idea in the set).
- **What's bad for our persona.** **AND/OR hidden behind "Match all/any" + a restructuring chore** —
  adding an OR forces you to **spin up a new group** (set-algebra thinking exactly when you want to
  express a simple thought). **The operator zoo** (Match By/Ignore By/Pick By/Exclude By/Any Of/None
  Of/Find By) — seven near-synonymous operators. **Model literacy is a prerequisite.** **The power
  tier is literal code** (JSON / Excel formulas + a certification course) — a non-technical owner
  falls off this cliff instantly. No headline count, no NL on-ramp.
- **Underlying principle.** *Steal:* **"a condition is a condition, everywhere"** (one rule object
  surfaced identically for audience/health/triggers); **segments as reusable named objects**; and
  above all **the Automations "sentence" builder** — make the **default** mode a fill-in-the-blank
  sentence, not a grid. *Avoid:* **"Match all/any + new group to get OR"** (don't make users
  restructure to change logic) and **the JSON/formula cliff** (keep the entire power range GUI/NL,
  never a DSL with a certification course). **Steal the live results but ADD the count Planhat
  lacks** — a prominent **"runs on N accounts"** number is the literal answer to "who does this run
  on."
- **AI usage.** Substantial AI platform, but it does **not** build filters/segments/rules from NL
  (verified on the AI overview). AI = Writing Assistant, Conversation Summary/sentiment, **"Use AI"
  steps inside Automations** (call an LLM as a step), AI Model Hub, **MCP Server** (lets an external
  LLM *read* Planhat data — you could bolt NL querying on yourself). **No first-party NL segment
  builder, no AI segment suggestions** as of June 2026.
- **Sources.** [Designing and Building Filters](https://help.planhat.com/en/articles/9590697-designing-and-building-filters) ·
  [Advanced Filtering (feature)](https://www.planhat.com/features/advanced-filtering) ·
  [Calculated Metrics (JSON)](https://help.planhat.com/en/articles/9587317-metrics-calculated-metrics) ·
  [Health Score Profiles](https://help.planhat.com/en/articles/9587310-set-up-your-health-score-profiles) ·
  [Formula Fields](https://help.planhat.com/en/articles/9586968-formula-fields-overview) ·
  [Automations overview (Templated "sentence" vs Custom flowchart)](https://help.planhat.com/en/articles/9587240-automations-overview) ·
  [Workflow entry/exit criteria](https://help.planhat.com/en/articles/9587237-workflow-entry-and-exit-criteria) ·
  [AI overview (no NL rule-building)](https://help.planhat.com/en/articles/10002335-ai-overview) ·
  [Data Explorer (live table)](https://help.planhat.com/en/articles/10037966-data-explorer)

### Totango

> **Merger note:** Totango and Catalyst **merged Feb 2024** (Great Hill Partners) and operate as
> **"Totango + Catalyst,"** but as of 2026 keep **two separate codebases, two separate help
> centers, and two different builder paradigms** — they have **not** converged into one UI.
> (`catalyst.io` marketing 301-redirects to `totango.com`, but the *app help docs remain
> separate* and describe different builders.) Treated separately here and below. Totango calls
> the Segment "a highly flexible query engine" in its own docs — segments are the reused target
> for SuccessPlays, campaigns, health profiles.

- **Pattern.**
  - *Composition:* **AND/OR with nested filter groups** ("similar to **parentheses within a math
    equation**"). Example: "accounts renewing this quarter OR next quarter AND that have a key
    contact defined." Two **hard constraints**: *"all filters **outside** a group must be the same"*
    (all AND or all OR) and *"all filters **within** a group must be the same"* — you change operator
    **between** groups. **Nesting cap: up to 3 levels** (incl. top). **Flag:** this advanced AND/OR +
    nesting is labeled **"open beta"** in the doc — before it shipped, OR was faked via an
    **"Is in segment"** chaining workaround (i.e. Totango had *no real OR* for years).
  - *Field picking:* a hybrid **type-ahead + categorized browse** ("start typing the data point…"
    OR "click within the available dimensions to browse"). Fields are **color-coded by source**
    (Account = **green**, User = **purple**, plus custom/system collections, user actions). Strong
    affordance. *(MEDIUM-HIGH.)*
  - *Value entry:* per-type controls explicitly called out for Revenue / Change(delta) / Touchpoint /
    Campaigns / Text / Lifecycles / **Date (relative — "in the last 7 days")** / Number-currency /
    User-actions / Lists. **Multi-select = implicit OR** ("any of the values…true"). Include/exclude
    via **"is not one of"** + "exclude selected" (a known bug flagged on collection filters).
    **"Is in / is not in segment"** references another segment. *(Exhaustive operator inventory sits
    in 403-blocked sub-articles — partially verified.)*
  - *Simple vs Advanced:* **progressive, no explicit toggle** — flat filter list (simple) + "Add
    Group" AND/OR (advanced) in the same surface; **default = flat AND**. **SuccessBLOCs** ship
    pre-configured segments, so many users *consume* ready-made segments.
  - *Empty state:* opens as **"Untitled segment" with Suggested filters already offered**
    (one-click **Health** and **Contract Value**); you can **copy an existing segment**. A Global
    SuccessBLOC bundles prebuilt segments — rarely a true blank canvas.
  - *Live preview / match count:* **live result LIST confirmed** ("the list of matching results
    appears…continue adding filters"). A **live numeric "X match" COUNT is NOT explicitly
    documented** for Totango (contrast Catalyst, which is). *(List confirmed; count unverified.)*
- **What's good.** **Suggested filters** (one-click Health / Contract Value before you touch the
  picker) is an excellent ADHD on-ramp. **Color-coded fields by source** (green/purple) is a genuine
  cognitive aid worth stealing. NL segment surfacing (Zoe — see AI). **SuccessBLOC pre-built
  segments** so the user rarely faces a blank builder. Live result list. Multi-value = OR is
  intuitive.
- **What's bad for our persona.** It's **an analyst's query engine — it literally calls itself one.**
  The **"all filters outside a group must be the same operator" rule is a silent cognitive trap**
  (invisible until you violate it). 3-level nesting + "parentheses" + the legacy "Is in segment"
  workaround + a documented **"is not one of" bug** = landmines a non-technical user hits and can't
  diagnose. Gated behind Global-admin permissions. The advanced logic being **open beta** signals an
  unpolished, not-yet-trustworthy surface. The data-points library is large and CS-jargon-heavy.
- **Underlying principle.** *Steal:* **Suggested filters** (pre-seed the 2–3 filters 80% of users
  want as one-click chips *before* the field picker) and **color-code fields by data source**. Also:
  templates + NL surfacing beat raw builders. *Avoid:* **the constraint-that-bites-you-silently**
  (same-operator-per-group; nesting depth; raw boolean algebra exposed to a non-analyst) — the worst
  pattern here.
- **AI usage.** **Totango's standout.** The AI assistant (**Zoe** / unified AI) lets users **"surface
  Totango segments by using natural language queries"** — "ask Totango in plain language to surface a
  group of customer profiles who share common characteristics such as low health scores, decreased
  product utilization, or increased support tickets." **BUT** the primary blog is **ambiguous on
  whether NL produces a SAVED, EDITABLE segment vs. a one-time surfaced list** — the wording
  ("surface," "create queries to locate information") leans toward **dynamic querying/surfacing, not
  persistent editable filter creation.** Also: Jasper.ai partnership (content) + Parative acquisition
  (AI churn prediction). **HIGH confidence NL surfacing exists; LOW/UNVERIFIED that it yields an
  editable saved segment.**
- **Sources.** [Create and save segments](https://support.totango.com/hc/en-us/articles/360032225491-Create-and-save-segments) ·
  [Understand segments](https://support.totango.com/hc/en-us/articles/208774826-Understand-segments) ·
  [Segmentation data points](https://support.totango.com/hc/en-us/articles/15000241611028-Segmentation-data-points) ·
  [Totango AI innovations (Zoe NL segments)](https://www.totango.com/blog/totango-ai-innovations-set-to-boost-customer-success-productivity/) ·
  [Introducing Zoe](https://www.totango.com/blog/ai-for-customer-success-introducing-zoe)

### Custify

> **Caveat: thin public docs.** Custify's help center is gated/thin; most detail is from blog,
> G2/Capterra, and integration partners. The whole section is **lower-confidence and flagged**.

> **Doc caveat:** `docs.custify.com` is an **API reference**, not a builder guide — no screen-by-
> screen help article exists. Builder-UI mechanics below come from marketing pages + the MCP filter
> schema + G2/Capterra reviews, and are **lower-confidence and flagged.**

- **Pattern.**
  - *Composition:* **dynamic segments** on "any data point — demographics, billing, app usage."
    Structured **filter-row model** confirmed via Custify's MCP filter schema
    (`{fieldName, fieldType, filterType, filterValue}`). **AND/OR + nested groups are NOT documented
    publicly** — likely a **flatter AND-style list** than Totango/Catalyst. *(LOW–MEDIUM; nesting
    UNVERIFIED.)*
  - *Field picking:* structured selection by attribute (demographics / billing / **app-usage** /
    calculated metrics); MCP `list_attributes` implies a discoverable field list. **Picker UX
    unverified.** Custify is **product-usage / event-centric.**
  - *Value entry:* typed values **confirmed via the filter schema** — number filters (health < 30),
    user-lookup filters (CSM field), **relative-date filters (`this_quarter`)**. Multi-select /
    include-exclude unverified.
  - *Simple vs Advanced:* no documented toggle; markets **"super easy UI," "doesn't overwhelm."**
    **No documented dual-mode builder.**
  - *Empty state:* **Playbooks are template-first** ("starting from preset templates"; "12
    ready-to-use health-score templates"). Segment empty-state undocumented.
  - *Live preview / match count:* **NOT verified** — no source confirms a live count while building.
- **What's good.** **AI natural-language filter (see AI) is the closest thing in this whole set to
  the right answer for our persona.** Template-first playbooks. Reviewer praise: "super easy,"
  "doesn't overwhelm." Event/feature-usage-centric segmentation maps to "is the customer *actually
  using* the product?" — concrete, observable. Per-segment playbook attachment is a clean model.
- **What's bad for our persona.** **Mixed reviewer signal worth heeding:** "the UX is a bit clunky,
  not always intuitive," and "what would be a simple task elsewhere takes **multiple clicks, or
  transferring between windows**… slows me down." **Multi-window / multi-click flows are an ADHD
  focus-killer.** Thin docs = low self-serve discoverability. Likely still a filter-row builder at
  core.
- **Underlying principle.** *Steal:* **natural language as the *primary* entry to "who runs on"** —
  let the user type "low health + high MRR," AI compiles it, and the structured filter is shown as
  the editable *result*, not the starting point. The single most stealable idea across these three.
  *Avoid:* flows that bounce the user across windows/clicks for one logical task (reviewer-flagged).
- **AI usage.** **Custify's strongest, most persona-relevant area — and well-corroborated across two
  Custify pages.** **AI Portfolio Selection** uses **natural-language filters**: exact copy — *"Use
  natural language filters like **'customers renewing soon'** or **'low health + high MRR.'**"* This
  is *literally* the "describe who this runs on in plain English" pattern we're building. Also:
  **AI-Generated Playbooks** ("build…with just a few hints," from presets), **AI Decision Steps**
  (plain-language branch conditions like "Is this customer at churn risk?"), AI filters/actions in
  task creation, churn-risk scoring (0–100), sentiment. *(Single-vendor claims — no third-party demo
  verifying the NL-filter UX live; treat exact behavior as vendor-claimed.)*
- **Sources.** [AI customer-success features (NL filters)](https://www.custify.com/ai-customer-success-features) ·
  [Product automation (playbook builder)](https://www.custify.com/product-automation) ·
  [Custify MCP filter schema](https://glama.ai/mcp/servers/CustifyOfficial/custify-mcp) ·
  [Segment → Custify destination](https://segment.com/docs/connections/destinations/catalog/custify/) ·
  [G2 Custify reviews (mixed "easy" vs "clunky/multiple clicks")](https://www.g2.com/products/custify/reviews) ·
  [docs.custify.com (API reference only)](https://docs.custify.com/). *(Thin/gated docs — flagged.)*

### Catalyst (now "Catalyst by Totango")

**Best-documented builder of the set, and the only one with a *verified live numeric match count.***
Keeps two primitives: **Segments** (the "who" — reusable list) and **Workflows / Flow Builder** (the
"what runs," with their own entry conditions).

- **Pattern.**
  - *Composition:* **AND/OR via "filter groupings" (segment-only — not home layouts).** Worked
    example: `AND [CSM is Jim] → OR [Journey Stage is Foundation / Health is At Risk]`. Catalyst's
    own docs show **two equivalent ways to express the same query** (nested OR-of-ANDs) and admit
    "this method requires you to **duplicate criteria**." Workflows allow branches-within-branches,
    up to **10 checks/branch, 30 steps/branch**, cross-object. *(HIGH.)*
  - *Field picking:* **object-first, then field** (pick primary object → Filter → Add Filter → choose
    field). **Cross-object queries** supported. **Dynamic value references** — "Current User"
    (auto-resolves to whoever's logged in), user groups ("CSM is part of Bob's Team"). Strong
    affordances.
  - *Value entry:* explicit **`[field] [relation] [value]`** rows that read as a sentence. **~30
    relational operators** verified (is/is not/is any of/is none of/contains/is before/**is within the
    next/past**/**previous-current-next fiscal quarter & fiscal year**/…). **Relative dates are
    first-class operators**, not typed strings. **"Add timeframe"** requires a value true for "up to 7
    consecutive days" (a persistence control — sophisticated *and* a complexity source). Multi-value
    via "is any of/is none of"; exclude via "is not/none of/does not contain."
  - *Simple vs Advanced:* **progressive disclosure, no toggle** — flat "is/is not" rows (beginner) +
    **"Add filter group"** alongside "Add filter" (advanced); for workflows you "add individual
    filters, add a filter grouping, or duplicate filters from an existing segment." **Default = flat
    filters.**
  - *Empty state:* **strong, persona-friendly** — create from scratch, **copy from the library**, or
    press **`S`** from any screen. **Prebuilt named segments ship: "All Accounts," "At Risk Accounts,"
    "Upcoming Renewals."** Workflows save as **drafts** until enabled (safe to experiment).
  - *Live preview / match count:* **the clear winner — explicit real-time numeric count.** Workflow
    entry conditions: *"As you apply conditions, **the number of matching records is indicated in
    real-time.**"* Segments: *"as soon as you add the filter, the list of records automatically
    updates."* **The only product where a live numeric "X records match" counter while building is
    documented.**
- **What's good.** **Real-time match count** as you build (best feedback loop in the set).
  **Prebuilt named segments** + **copy-from-library + `S` shortcut + draft-by-default** = low-stakes,
  fast starts, never a blank canvas. Plain `[field] [relation] [value]` reads like English.
  **Dynamic values ("Current User")** reduce hard-coding. Clean separation of "who" (Segment) from
  "what runs" (Workflow), with the segment reusable as workflow entry.
- **What's bad for our persona.** Despite the "most intuitive CSP" claim, the **~30-operator list is
  choice overload**; "add timeframe / 7 consecutive days," fiscal-quarter operators, and cross-object
  queries are analyst-grade. The **"two equivalent ways, duplicate the criteria" nested OR-of-ANDs**
  explanation is exactly what makes an ADHD user freeze. Flow Builder adds branches-within-branches,
  delays you "cannot stack," reorder-locked nodes — a lot of rules to hold in your head.
- **Underlying principle.** *Steal:* **the real-time match count is non-negotiable** — show "X
  accounts match" updating live on every keystroke; **prebuilt named segments as the default start**;
  **`[field] [relation] [value]` rows that read as a sentence**; **dynamic values ("Current User")**.
  *Avoid:* dumping ~30 operators in one flat dropdown, and exposing fiscal-quarter / timeframe-
  persistence / cross-object power inline to everyone — reserve those behind an "advanced" reveal.
- **AI usage.** Catalyst-by-Totango's feature list cites **"Natural Language Interaction"** and
  "Dynamic Segmentation," and marketing frames a **natural-language search tool** "eliminating
  complex queries or multistep drop-down menus" — directionally the most persona-aligned positioning
  in the set. **But the concrete, doc-verified NL chatbot that surfaces segments is Totango's Zoe**;
  **Catalyst-side in-app NL segment *building* is marketing-level, not help-doc-verified — flag as
  partial.** The verified Catalyst win for our persona is the **real-time count + prebuilt segments +
  sentence-rows**, not (yet) a proven NL builder.
- **Sources.** [Apply filters with advanced logic (~30 operators + groupings)](https://help.catalyst.io/hc/en-us/articles/28924672195092-Apply-filters-with-advanced-logic) ·
  [Create and manage workflows (Flow Builder + real-time match count)](https://help.catalyst.io/hc/en-us/articles/28924686064148-Create-and-manage-workflows) ·
  [Create and manage segments (empty state, library, `S` shortcut)](https://help.catalyst.io/hc/en-us/articles/28924686126484-Create-and-manage-segments) ·
  [Explore data and view segments (field picking, live update)](https://help.catalyst.io/hc/en-us/articles/28924677175700-Explore-data-and-view-segments) ·
  [Filter segments across objects](https://help.catalyst.io/hc/en-us/articles/28924678314772-Filter-segments-across-objects) ·
  [Totango-Catalyst feature list (NL Interaction / Dynamic Segmentation)](https://www.g2.com/products/totango-catalyst/features) ·
  [Catalyst-by-Totango merger context](https://startupik.com/catalyst-by-totango-customer-success-platform/)

---

## Cross-cutting patterns

1. **One filter primitive, reused everywhere.** Every product surfaces the same `field → operator →
   value` mechanic across segments, health scores, playbook/program entry-criteria, and automation
   branches. **Steal this** (build ONE rule object, surface it identically) — but note the weaknesses
   compound because the persona meets it in five places.

2. **The grouping spectrum is the biggest design fork.** From most to least hostile for our persona:
   - **Gainsight** — grouping is a **hand-typed boolean token string** (`(A AND B) OR C` over row
     letters). Worst possible for a non-analyst; and it **silently resets to AND** when you edit.
   - **Totango** — **nested groups (up to 3 levels) as "parentheses in a math equation,"** with a
     **silent same-operator-per-group constraint** and the advanced logic still in **open beta.**
     Explicitly analyst-brained.
   - **Planhat / Vitally** — grouping is **structural** (Match all/any groups · Filter Groups), but
     **forces a restructuring chore** to add an OR (spin up a new group).
   - **Catalyst** — structural filter groupings + **~30 operators**; admits the "duplicate the
     criteria" nested OR-of-ANDs awkwardness, but softens the start with **prebuilt named segments +
     a live count.**
   - **ChurnZero** — **bans grouping entirely** (flat AND). Safest for the persona — but the
     ceiling is a **silent dead end** (no OR, no in-UI escape).
   The ideal for our persona = **ChurnZero's flat simplicity + a visible, structural "match ANY"
   group** (nested *cards* you can see, never a typed expression or a same-operator trap) + an **NL
   on-ramp** (Catalyst/Custify direction) + **Catalyst's live count.**

3. **Empty-state philosophy splits two ways.** Blank structural canvas (Gainsight, Planhat filters,
   Vitally raw segments) **vs.** a sensible non-blank start (ChurnZero `IsActive = True`) or templates
   (Totango SuccessBLOCs, Vitally Blueprints, Custify, Planhat Automations). **Templates / a populated
   default reliably defeat blank-slate paralysis** — never open on a void.

4. **Live feedback exists but is uneven; only Catalyst proves the *count*.** **Catalyst is the one
   verified case of a real-time numeric "X records match" counter** updating as you build — the gold
   standard. Vitally has the strongest *list* feedback (live **Matching Audience** + single-record
   dry-run Test). Totango/ChurnZero/Planhat show a live result **list/table** but **no documented live
   count**. Gainsight shows **sample rows only**. So a prominent, instantly-updating **"runs on N
   accounts"** number is the literal answer to "who does this run on," the exact gut-check
   ("too broad? empty?") this persona needs, and **proven achievable (Catalyst) yet missing from most
   competitors** — a high-value, low-cost win. Pair it with Vitally's live audience *list*.

5. **Field picking leads with the data model — the chief barrier.** Every builder makes you pick an
   **object/trait/data point** before expressing intent (Gainsight object→field; Vitally Traits;
   Planhat purple model dropdown; Totango "data points"). This demands model literacy the persona
   doesn't have. **Invert it:** lead with intent in the user's vocabulary and values, map to fields
   behind the scenes.

6. **Type-aware value controls + relative dates are universal table stakes.** Operators switch by
   field type (date → "days ago," numeric → "more/less than"), and relative dates are everywhere.
   Match this — it aligns directly with the GoCSM attribute catalog's six control types.

7. **Dynamic / auto-updating membership is table stakes.** Every product recomputes membership as
   data changes. Ours should too.

8. **Power cliffs vary wildly.** Mild (Vitally Filter Groups) → severe (**Planhat's JSON Calculated
   Metrics + Excel-style Formula Fields with a *certification course***). **Keep the entire power
   range GUI/NL — never a DSL.** Our "Advanced" mode must stay visual nested cards, not code or a
   token string.

---

## Dos & Don'ts for our persona

**DO**
- **Lead with natural language** (Catalyst's proven on-ramp) → generate an **editable, human-readable
  rule** the user can verify and tweak. NL input → Simple flat list by default.
- **Default to a flat AND/ANY list** (ChurnZero) with a single **Match ALL / Match ANY** switch —
  ~90% of cases never touch grouping.
- **Open from a sensible, populated default or a template**, never a blank void (ChurnZero
  `IsActive = True`; Totango SuccessBLOCs; Vitally Blueprints).
- **Show the answer while they build the question** — a live **Matching Audience list** (Vitally)
  **and** a big honest **"runs on N accounts"** counter (proven by Catalyst, missing from most).
- **Make grouping visual and structural** — nested *cards* with their own ALL/ANY, one level deep
  (`(A AND B) OR (C AND D)`), each card a comprehensible chunk.
- **Keep a plain-English restatement above the rules at all times** so the *text stays simple even
  when the logic is complex* (already in the GoCSM brief).
- **Use type-aware controls + relative dates** (toggle / stepper+unit / dual-slider / date-range
  with relative / segmented-pills or searchable multi-select) per the attribute catalog.
- **Let users name + save** a segment with a friendly label (Catalyst) and reuse it as a trigger
  (Planhat Global Filters).
- **Speak the agency owner's vocabulary** — "accounts paying me over $X / haven't logged in for 21
  days / not using Workflows," not "filter on the org trait MRR."

**DON'T**
- **Don't encode grouping as a hand-typed boolean token string** (`(A AND B) OR C` over row letters
  — Gainsight). It's boolean algebra in a text box.
- **Don't ever silently reset the user's logic** (Gainsight's "edit filters → OR reverts to AND →
  paste from Notepad"). Trust-destroying.
- **Don't make a flat AND model a silent dead end** (ChurnZero) — always give an obvious in-UI "match
  ANY" / "add an alternative" escape so the user never gets stuck or forced into duplicate segments.
- **Don't make users restructure to change logic** (Planhat/Vitally "spin up a new group to add an
  OR"). Let ALL/ANY flip inline.
- **Don't lead with the data model / ontology** (Traits, Objects, data points, cross-object). Capture
  intent first; map to fields behind the scenes.
- **Don't ship an operator zoo** (Planhat's Match By / Ignore By / Pick By / Exclude By / Any Of /
  None Of / Find By). A few human operators per type, max.
- **Don't drop the user into a DSL** for "advanced" (Planhat JSON / Excel formulas + certification).
  Advanced = visual nested cards, never code.
- **Don't open on a blank canvas** or bury the match count.

---

## AI-readiness

**Where the market actually is (verified across all seven):**
- **Three products touch NL→segment, all differently — and none nails it for our persona:**
  - **Custify** — **AI Portfolio Selection: natural-language filters** ("low health + high MRR,"
    "customers renewing soon"). The most *explicit* NL-filter copy in the set — but **vendor-claimed**
    (no third-party demo verifying the live UX), and it sits on a builder reviewers call "clunky /
    multiple windows."
  - **Catalyst** — markets a **natural-language search tool** "eliminating multistep drop-down menus,"
    and Save Segment persists with name + description → likely editable. **But in-app NL building is
    marketing-level, not help-doc-verified** (the doc-verified NL chatbot is Totango's Zoe). MEDIUM.
  - **Totango (Zoe)** — NL **surfaces** a matching group, but **ambiguous/leans non-persistent**
    (dynamic querying, not a saved editable rule).
- **Gainsight, ChurnZero, Vitally, Planhat — their AI does NOT build rules/segments.** It does
  scoring, sentiment, churn-risk detection, drafting, summaries, and NL Q&A over data. Several
  explicitly frame AI as a *strategy advisor* (ChurnZero) or an LLM-as-a-step (Planhat Automations /
  MCP), **not** a rule author. Verified twice each for Vitally and Planhat; confirmed on the Gainsight
  Insight Agent doc and ChurnZero AI pages.

**The open white-space (our highest-leverage opportunity).** Even the three that *touch* NL leave the
real gap open: **nobody pairs NL input with a simple, flat, editable, human-readable rule + a live
count.** Catalyst keeps an analyst-grade builder underneath (~30 operators, cross-object); Custify's
NL sits on a multi-window builder and is vendor-claimed; Totango surfaces a non-editable list. The
thing nobody owns is **the editable simplicity of the *generated* rule** — NL in, a Simple flat
sentence-rule out, "runs on N accounts" beside it, Advanced as visual cards. That is our wedge.

**Right dosage for our persona (the GoCSM target).** A four-beat flow that matches the active brief:
1. **NL hero input** (multi-line, teaching placeholder) — "describe the accounts to target in plain
   English." *(Deterministic compile in the prototype; LLM in production.)*
2. **AI compiles to an editable rule**, rendered as the **Simple flat list** by default (field →
   operator → typed value) with the **Match ALL / ANY** switch — never a black box.
3. **Plain-English restatement always on top** + a **live "runs on N accounts" count** for instant
   verification ("looks right? too broad? empty?").
4. **Save with a friendly name**; reusable as a trigger.

**Guardrails (dosage discipline — "cut before you add").**
- AI **assists, never auto-commits** — the brief's honest note ("compiles into editable rules below —
  always check them") is exactly right; keep it.
- AI builds the **Simple** rule; **Advanced (visual nested cards) stays a quiet manual escape**, never
  AI-only, never code.
- **Don't** add AI to scoring/sentiment/next-best-action *inside this surface* — that's where every
  competitor's AI already lives and it would overwhelm. Here, AI's one job is **turn a sentence into
  an editable rule + show who it hits.** One job, done visibly.

---

### Confidence flags (carried from research)
- **Live "X accounts match" counter during editing** — **confirmed for Catalyst** ("number of
  matching records indicated in real-time"); **not documented for the others** (Vitally/Totango/
  ChurnZero/Planhat confirm a live *list/table*; ChurnZero-while-editing and a Totango/Planhat numeric
  count are unverified; Gainsight shows sample rows only).
- **Nested-group depth** — **Totango confirmed at up to 3 levels** (advanced AND/OR in **open beta**);
  beyond one level **undocumented for Vitally and Planhat** (one level confirmed each).
- **NL→segment editability/persistence** — **Custify** NL filter is verified copy but **vendor-claimed**
  UX (no third-party demo); **Catalyst** in-app NL building is **marketing-level, not help-doc-verified**
  (verified NL chatbot is Totango's Zoe); **Totango (Zoe)** leans non-persistent surfacing (LOW).
- **Per-type value-control matrices** — only confirmed exemplars per product, not exhaustive specs;
  Totango/Catalyst exhaustive operator lists partly sit behind 403'd sub-articles.
- **Custify builder internals** — `docs.custify.com` is an API reference, not a builder guide;
  AND/OR + nesting + live count + segment empty-state **undocumented** (likely flatter AND list);
  whole section lower-confidence and flagged inline.
- **Gainsight Power List "OR reverts to AND / paste from Notepad" footgun** — single-source
  community/best-practice, not core admin docs.
- **Access:** ChurnZero, Totango, and Catalyst help centers 403 direct fetch (anti-bot); their quotes
  come from search-indexed text + a headless-rendered article body + developer/integration docs,
  corroborated across sources.
