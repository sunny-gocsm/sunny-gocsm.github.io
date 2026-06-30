// State Catalog — the single source of truth driving the DEV "State Gallery"
// on /doer-demo. Every entry maps 1:1 to a card the client-facing DoerPanel
// can render. The catalog is read-only data; DoerPanel is the sole renderer.
//
// Copy comes verbatim from the GoCSM Onboarding — Doer State Specification.
// Client copy → on the card. Agency copy → "Agency sees:" dev caption.
// NEVER invent or paraphrase failure copy.
//
// Seeded for this prompt with: universal states + Step 01 (Purchase phone
// number) only. Steps 02–15 are extension points populated by later prompts.

export type CatalogStateType =
  | "done"
  | "in_progress"
  | "verifying"
  | "locked"
  | "not_started"
  | "waiting_on_agency"
  | "failure"
  | "nudge"
  | "graduation"
  | "dispute";

export interface CatalogClientCopy {
  /** Card title. For per-step entries this is the step's plain name. */
  title: string;
  /** Body sentence — the "one why-it-matters line" or failure reason. */
  body: string;
  /** Tier-B verifying-strip copy. Only set on verifying entries. */
  verifyingStrip?: string;
}

export interface CatalogEntry {
  /** Stable id, e.g. "universal.not_started" | "step01.failure.payment_fails". */
  id: string;
  /** Step number 1..15, or null for universal states. */
  stepNum: number | null;
  /** Plain step name for the navigator + card title. */
  stepTitle: string;
  stateType: CatalogStateType;
  /** Short status pill label, e.g. "Needs attention". */
  statusLabel: string;
  clientCopy: CatalogClientCopy;
  /** Dev-only caption rendered under the card. Verbatim agency copy. */
  agencyCopy: string;
  /** Primary CTA label, or null when the card has no primary action. */
  primaryAction: string | null;
  /** Whether to render the "This doesn't match what I see" dispute link. */
  showDispute: boolean;
  /** Step 03 forbidden-category only: suppress retry CTA, render agency-reach-out copy as the only content. */
  terminal?: boolean;
  /** "No client card here" marker. Step 07 placeholder (we don't detect) + Step 06 deactivated-later (detected but intentionally silent). Renderer should show a dev-only note instead of a client card. */
  devOnlyNotDetected?: boolean;
  /** Step 12 contributor-only: card LOOKS done (done chrome, "Connected" framing) but is actually needs-attention. The design point. */
  silentFailure?: boolean;
  /** Compact chip label for "Needs help today · group by reason" chips.
   *  Only meaningful on `stateType: "failure"` entries. Falls back to stepTitle. */
  shortLabel?: string;
  /** One-clause plain-language row reason for the operator queue row. 4–8 words,
   *  sentence case, no tool names, no record-level detail. Sourced here so the
   *  rich `agencyCopy` can keep its full diagnostic for the drawer. */
  rowClause?: string;
}

// ---------------------------------------------------------------------------
// Universal states (apply to every step; rendered as top-level navigator group)
// ---------------------------------------------------------------------------

const UNIVERSAL: CatalogEntry[] = [
  {
    id: "universal.not_started",
    stepNum: null,
    stepTitle: "Up next (any step)",
    stateType: "not_started",
    // Quiet row, no copy pressure. Status pill is intentionally empty.
    statusLabel: "",
    clientCopy: {
      title: "Up next",
      // Empty body — the not_started card is a quiet row, per spec
      // ("Quiet row / Up Next. No copy pressure.").
      body: "",
    },
    agencyCopy: "Grey dot; counts toward remaining.",
    primaryAction: null,
    showDispute: false,
  },
  {
    id: "universal.locked",
    stepNum: null,
    stepTitle: "Locked (any step)",
    stateType: "locked",
    statusLabel: "Locked",
    clientCopy: {
      title: "Locked",
      // Canonical example: A2P chain — campaign ← brand ← phone.
      body: "Unlocks when Register your business for text messaging is done.",
    },
    agencyCopy:
      "Lock + requirement name (campaign ← brand ← phone); excluded from stall math.",
    primaryAction: null,
    showDispute: false,
  },
  {
    id: "universal.waiting_on_agency",
    stepNum: null,
    stepTitle: "Waiting on your agency",
    stateType: "waiting_on_agency",
    statusLabel: "Waiting on Summit Digital",
    clientCopy: {
      title: "We're on it",
      body: "Summit Digital is on it — nothing needed from you.",
    },
    agencyCopy: "Blocked · your team — Assign + Open calendar.",
    primaryAction: null,
    showDispute: false,
  },
  {
    id: "universal.graduation",
    stepNum: null,
    stepTitle: "Graduation",
    stateType: "graduation",
    statusLabel: "All set",
    clientCopy: {
      title: "You're fully set up",
      body: "Your first leads will land in your pipeline.",
    },
    agencyCopy: "All steps done · journey complete; celebration shown once.",
    primaryAction: null,
    showDispute: false,
  },
  {
    id: "universal.dispute",
    stepNum: null,
    stepTitle: "Dispute (any step)",
    stateType: "dispute",
    statusLabel: "Reporting",
    clientCopy: {
      title: "I've already done this",
      body: "Tell us what you're seeing — we'll loop in Summit Digital and pause this check while we look.",
    },
    agencyCopy:
      "Dispute task opened · check paused; agency confirm writes agency_verified.",
    primaryAction: "Send it to your team",
    showDispute: false,
  },
];


// ---------------------------------------------------------------------------
// Step 01 — Purchase phone number (Tier A — NO verifying state)
// ---------------------------------------------------------------------------

const STEP_01: CatalogEntry[] = [
  {
    id: "step01.done",
    stepNum: 1,
    stepTitle: "Purchase phone number",
    stateType: "done",
    statusLabel: "Verified",
    clientCopy: {
      title: "Purchase phone number",
      body: "Your number is live on the account.",
    },
    agencyCopy: "Auto-verified · phone number provisioned on the location (LC Phone).",
    primaryAction: null,
    showDispute: false,
  },
  {
    id: "step01.in_progress",
    stepNum: 1,
    stepTitle: "Purchase phone number",
    stateType: "in_progress",
    statusLabel: "In progress",
    clientCopy: {
      title: "Purchase phone number",
      body: "Pick a local number so your texts and calls show up with a familiar area code.",
    },
    agencyCopy: "Blue dot + days on this step.",
    primaryAction: "Take me there",
    showDispute: false,
  },
  {
    id: "step01.failure.payment_fails",
    stepNum: 1,
    stepTitle: "Purchase phone number",
    stateType: "failure",
    rowClause: "Card declined buying the phone number",
    statusLabel: "Needs attention",
    clientCopy: {
      title: "Purchase phone number",
      body: "The number couldn't be purchased — the payment method on this account needs attention. Add or update a card, then try again.",
    },
    agencyCopy:
      "Purchase blocked · payment method — in SaaS-rebill mode this is usually the AGENCY wallet: Blocked · your team.",
    primaryAction: "Billing",
    showDispute: true,
  },
  {
    id: "step01.failure.no_inventory",
    stepNum: 1,
    stepTitle: "Purchase phone number",
    stateType: "failure",
    rowClause: "No numbers available in that area code",
    statusLabel: "Needs attention",
    clientCopy: {
      title: "Purchase phone number",
      body: "No numbers available for that area code right now. Try a nearby area code — your customers will still recognize a local number.",
    },
    agencyCopy: "No inventory for requested area code · client searching (soft; in_progress retained).",
    primaryAction: "Take me there",
    showDispute: true,
  },
  {
    id: "step01.failure.regulatory_address",
    stepNum: 1,
    stepTitle: "Purchase phone number",
    stateType: "failure",
    rowClause: "Region requires a verified business address",
    statusLabel: "Needs attention",
    clientCopy: {
      title: "Purchase phone number",
      body: "This region asks for a verified business address before a number can be issued. Add it on the purchase screen and the number will go through.",
    },
    agencyCopy: "Blocked · regulatory address required ({region}).",
    primaryAction: "Take me there",
    showDispute: true,
  },
];

// ---------------------------------------------------------------------------
// Step 02 — Register your business for text messaging (Tier B — verifying)
// ---------------------------------------------------------------------------

const STEP_02: CatalogEntry[] = [
  {
    id: "step02.done",
    stepNum: 2,
    stepTitle: "Register your business for text messaging",
    stateType: "done",
    statusLabel: "Done",
    clientCopy: {
      title: "Register your business for text messaging",
      body: "Your business is registered — texts can now go out under your name.",
    },
    agencyCopy: "Auto-verified · TCR brand status = approved.",
    primaryAction: null,
    showDispute: false,
  },
  {
    id: "step02.in_progress",
    stepNum: 2,
    stepTitle: "Register your business for text messaging",
    stateType: "in_progress",
    statusLabel: "In progress",
    clientCopy: {
      title: "Register your business for text messaging",
      body: "Carriers require every business to be registered before texts will reliably reach your customers.",
    },
    agencyCopy: "Blue dot + days on this step.",
    primaryAction: "Take me there",
    showDispute: false,
  },
  {
    id: "step02.verifying",
    stepNum: 2,
    stepTitle: "Register your business for text messaging",
    stateType: "verifying",
    statusLabel: "Verifying",
    clientCopy: {
      title: "Register your business for text messaging",
      body: "We're checking this — usually 3 days. You can keep going.",
      verifyingStrip: "Meanwhile, let's set up your email sending domain →",
    },
    agencyCopy: "Amber · verifying · day {n}; out of action queue while inside the 3-day review window.",
    primaryAction: null,
    showDispute: true,
  },
  {
    id: "step02.failure.ein_name_mismatch",
    stepNum: 2,
    stepTitle: "Register your business for text messaging",
    stateType: "failure",
    rowClause: "Business name doesn't match the EIN",
    shortLabel: "A2P EIN mismatch",
    statusLabel: "Needs attention",
    clientCopy: {
      title: "Register your business for text messaging",
      body: "There's a problem with the registration: the business name doesn't match your EIN record. Enter your legal name EXACTLY as it appears on your IRS letter (CP-575) — including 'LLC' if it's there — and upload the CP-575 to remove the guesswork.",
    },
    agencyCopy: "Rejected · EIN/name mismatch + same fix; CP-575 upload materially raises first-time approval.",
    primaryAction: "Trust Center",
    showDispute: true,
  },
  {
    id: "step02.failure.new_ein",
    stepNum: 2,
    stepTitle: "Register your business for text messaging",
    stateType: "failure",
    rowClause: "EIN is too new for the registry",
    statusLabel: "Needs attention",
    clientCopy: {
      title: "Register your business for text messaging",
      body: "Your tax ID is too new for the carriers' registry — it usually needs a couple of weeks to appear. We'll remind you to resubmit; nothing else is wrong.",
    },
    agencyCopy: "Rejected · newly issued EIN — retry after registry sync (or $10 manual appeal w/ full CP-575 PDF; 30–90d window applies in some cases).",
    primaryAction: null,
    showDispute: true,
  },
  {
    id: "step02.failure.unverifiable_website",
    stepNum: 2,
    stepTitle: "Register your business for text messaging",
    stateType: "failure",
    rowClause: "Website looks too thin to verify",
    statusLabel: "Needs attention",
    clientCopy: {
      title: "Register your business for text messaging",
      body: "Carriers couldn't verify your website. Make sure it's live, describes what your business does, and links Terms of Service and Privacy Policy in the footer — then resubmit.",
    },
    agencyCopy: "Rejected · unverifiable website — common with bare landing pages; agency often owns the fix.",
    primaryAction: "Trust Center",
    showDispute: true,
  },
  {
    id: "step02.failure.po_box",
    stepNum: 2,
    stepTitle: "Register your business for text messaging",
    stateType: "failure",
    rowClause: "Business address is a PO Box",
    statusLabel: "Needs attention",
    clientCopy: {
      title: "Register your business for text messaging",
      body: "Carriers don't accept PO Boxes. Use your registered street address and resubmit.",
    },
    agencyCopy: "Rejected · PO Box address.",
    primaryAction: "Trust Center",
    showDispute: true,
  },
  {
    id: "step02.failure.ticker_mismatch",
    stepNum: 2,
    stepTitle: "Register your business for text messaging",
    stateType: "failure",
    rowClause: "Stock ticker doesn't match the brand",
    statusLabel: "Needs attention",
    clientCopy: {
      title: "Register your business for text messaging",
      body: "The stock ticker provided doesn't match the brand details — correct one or the other and resubmit.",
    },
    agencyCopy: "Rejected · ticker mismatch.",
    primaryAction: "Trust Center",
    showDispute: true,
  },
  {
    id: "step02.failure.nonprofit_gov_unverifiable",
    stepNum: 2,
    stepTitle: "Register your business for text messaging",
    stateType: "failure",
    rowClause: "Entity type needs manual proof",
    statusLabel: "Needs attention",
    clientCopy: {
      title: "Register your business for text messaging",
      body: "Your organization type couldn't be verified automatically. Update the entity type, or submit documents for manual verification.",
    },
    agencyCopy: "Rejected · entity-type verification — manual docs path available.",
    primaryAction: "Trust Center",
    showDispute: true,
  },
  {
    id: "step02.failure.duns_instead_of_ein",
    stepNum: 2,
    stepTitle: "Register your business for text messaging",
    stateType: "failure",
    rowClause: "Wrong tax-ID format submitted",
    statusLabel: "Needs attention",
    clientCopy: {
      title: "Register your business for text messaging",
      body: "US registration needs your EIN (not DUNS). Outside the US, use your national tax ID — e.g. BN9 in Canada, Company Number in the UK.",
    },
    agencyCopy: "Unverified · wrong ID format — blocks all downstream A2P; high-priority.",
    primaryAction: "Trust Center",
    showDispute: true,
  },
];

// ---------------------------------------------------------------------------
// Step 03 — Text-messaging campaign approval (Tier B — verifying)
// ---------------------------------------------------------------------------

const STEP_03: CatalogEntry[] = [
  {
    id: "step03.done",
    stepNum: 3,
    stepTitle: "Text-messaging campaign approval",
    stateType: "done",
    statusLabel: "Done",
    clientCopy: {
      title: "Text-messaging campaign approval",
      body: "Your campaign is approved — texts will reach inboxes.",
    },
    agencyCopy: "Auto-verified · campaign status = approved; future numbers attach automatically.",
    primaryAction: null,
    showDispute: false,
  },
  {
    id: "step03.in_progress",
    stepNum: 3,
    stepTitle: "Text-messaging campaign approval",
    stateType: "in_progress",
    statusLabel: "In progress",
    clientCopy: {
      title: "Text-messaging campaign approval",
      body: "Carriers need to approve what you'll be texting about before your messages start going out reliably.",
    },
    agencyCopy: "Blue dot + days on this step; locked until brand approved.",
    primaryAction: "Take me there",
    showDispute: false,
  },
  {
    id: "step03.verifying",
    stepNum: 3,
    stepTitle: "Text-messaging campaign approval",
    stateType: "verifying",
    statusLabel: "Verifying",
    clientCopy: {
      title: "Text-messaging campaign approval",
      body: "We're checking this — usually 5 days. You can keep going.",
      verifyingStrip: "Meanwhile, let's set up your email sending domain →",
    },
    agencyCopy: "Amber · verifying · day {n}.",
    primaryAction: null,
    showDispute: true,
  },
  {
    id: "step03.failure.inconsistency",
    stepNum: 3,
    stepTitle: "Text-messaging campaign approval",
    stateType: "failure",
    rowClause: "Campaign details don't match the registration",
    statusLabel: "Needs attention",
    clientCopy: {
      title: "Text-messaging campaign approval",
      body: "The review found an inconsistency between your registration and your website or sample messages. Open the required fixes — each issue lists exactly what to correct — then resubmit.",
    },
    agencyCopy: "Rejected · inconsistency ({code}) — HL's fix modal gives code/category/meaning/correction per reason; multiple reasons possible, all must be fixed before resubmit.",
    primaryAction: "View required fixes",
    showDispute: true,
  },
  {
    id: "step03.failure.missing_opt_in",
    stepNum: 3,
    stepTitle: "Text-messaging campaign approval",
    stateType: "failure",
    rowClause: "Missing proof people opted in",
    statusLabel: "Needs attention",
    clientCopy: {
      title: "Text-messaging campaign approval",
      body: "Carriers need to see HOW people agree to get your texts. Add your opt-in (e.g. the form checkbox with consent wording) to the campaign details and resubmit.",
    },
    agencyCopy: "Rejected · opt-in evidence — a screenshot of the form consent block resolves this class instantly.",
    primaryAction: "Trust Center",
    showDispute: true,
  },
  {
    id: "step03.failure.sample_content",
    stepNum: 3,
    stepTitle: "Text-messaging campaign approval",
    stateType: "failure",
    rowClause: "Sample messages need business name and opt-out",
    statusLabel: "Needs attention",
    clientCopy: {
      title: "Text-messaging campaign approval",
      body: "At least one sample message must name your business and include opt-out wording ('Reply STOP to opt out'). Update the samples and resubmit.",
    },
    agencyCopy: "Rejected · sample content.",
    primaryAction: "Trust Center",
    showDispute: true,
  },
  {
    id: "step03.failure.placeholders",
    stepNum: 3,
    stepTitle: "Text-messaging campaign approval",
    stateType: "failure",
    rowClause: "Sample messages still have placeholder text",
    statusLabel: "Needs attention",
    clientCopy: {
      title: "Text-messaging campaign approval",
      body: "The samples still contain placeholder text. Replace [company name] with your actual business name and resubmit.",
    },
    agencyCopy: "Rejected · placeholder content — almost always a snapshot template the agency forgot to personalize: agency-owned fix.",
    primaryAction: "Trust Center",
    showDispute: true,
  },
  {
    id: "step03.failure.forbidden_category",
    stepNum: 3,
    stepTitle: "Text-messaging campaign approval",
    stateType: "failure",
    rowClause: "Industry isn't allowed for SMS",
    statusLabel: "Not available",
    clientCopy: {
      title: "Text-messaging campaign approval",
      body: "Carriers don't allow text marketing for this business category — this isn't something a resubmission can fix. Summit Digital will reach out about what IS possible (calls, email, and in some cases toll-free messaging).",
    },
    agencyCopy: "Rejected · forbidden category — TERMINAL, do not resubmit. Step should be agency-skipped; queue prompts the conversation.",
    primaryAction: null,
    showDispute: false,
    terminal: true,
  },
];

// ---------------------------------------------------------------------------
// Step 04 — Set up your email sending domain (Tier B — verifying)
// ---------------------------------------------------------------------------

const STEP_04: CatalogEntry[] = [
  {
    id: "step04.done",
    stepNum: 4,
    stepTitle: "Set up your email sending domain",
    stateType: "done",
    statusLabel: "Done",
    clientCopy: {
      title: "Set up your email sending domain",
      body: "Your domain is verified — emails will send from your own address.",
    },
    agencyCopy: "Auto-verified · dedicated-domain verification complete.",
    primaryAction: null,
    showDispute: false,
  },
  {
    id: "step04.in_progress",
    stepNum: 4,
    stepTitle: "Set up your email sending domain",
    stateType: "in_progress",
    statusLabel: "In progress",
    clientCopy: {
      title: "Set up your email sending domain",
      body: "Without this, your emails send from a generic address instead of your own — and they're far more likely to land in spam.",
    },
    agencyCopy: "Blue dot + days on this step.",
    primaryAction: "Take me there",
    showDispute: false,
  },
  {
    id: "step04.verifying",
    stepNum: 4,
    stepTitle: "Set up your email sending domain",
    stateType: "verifying",
    statusLabel: "Verifying",
    clientCopy: {
      title: "Set up your email sending domain",
      body: "We're checking this — usually 2 days. You can keep going.",
      verifyingStrip: "Meanwhile, let's complete your business profile →",
    },
    agencyCopy: "Amber · verifying · day {n}; DNS propagation up to 24–48h.",
    primaryAction: null,
    showDispute: true,
  },
  {
    id: "step04.failure.conflicting_mx_spf",
    stepNum: 4,
    stepTitle: "Set up your email sending domain",
    stateType: "failure",
    rowClause: "Conflicting mail records on their subdomain",
    shortLabel: "Email domain · MX/SPF conflict",
    statusLabel: "Needs attention",
    clientCopy: {
      title: "Set up your email sending domain",
      body: "That subdomain already has mail records attached. Remove the existing MX/SPF entries at your domain host (or pick a fresh subdomain like 'mail.yourdomain.com'), then verify again.",
    },
    agencyCopy: "Verification failed · conflicting MX/SPF on subdomain + mxtoolbox lookup link.",
    primaryAction: "Email Services",
    showDispute: true,
  },
  {
    id: "step04.failure.duplicate_dkim",
    stepNum: 4,
    stepTitle: "Set up your email sending domain",
    stateType: "failure",
    rowClause: "Duplicate email-signing record",
    shortLabel: "Email domain · duplicate DKIM",
    statusLabel: "Needs attention",
    clientCopy: {
      title: "Set up your email sending domain",
      body: "Your domain has more than one DKIM record, which mail systems can't resolve. Remove the extra DKIM entry at your host, then verify.",
    },
    agencyCopy: "Verification failed · duplicate DKIM.",
    primaryAction: "Email Services",
    showDispute: true,
  },
  {
    id: "step04.failure.wildcard_conflict",
    stepNum: 4,
    stepTitle: "Set up your email sending domain",
    stateType: "failure",
    rowClause: "Wildcard DNS is shadowing the record",
    statusLabel: "Needs attention",
    clientCopy: {
      title: "Set up your email sending domain",
      body: "A wildcard (*) record at your host is masking the new entries. Temporarily remove the wildcard, verify here, then add it back.",
    },
    agencyCopy: "Verification failed · wildcard DNS conflict — remove-verify-restore resolves it.",
    primaryAction: "Email Services",
    showDispute: true,
  },
  {
    id: "step04.failure.record_typos",
    stepNum: 4,
    stepTitle: "Set up your email sending domain",
    stateType: "failure",
    rowClause: "One DNS record doesn't match",
    statusLabel: "Needs attention",
    clientCopy: {
      title: "Set up your email sending domain",
      body: "One of the records doesn't match what we provided — usually a stray space or missing character. Compare each value side by side and correct it, then verify.",
    },
    agencyCopy: "Verification failed · record mismatch + per-record pass/fail if available.",
    primaryAction: "Email Services",
    showDispute: true,
  },
  {
    id: "step04.failure.propagation_stuck",
    stepNum: 4,
    stepTitle: "Set up your email sending domain",
    stateType: "failure",
    rowClause: "DNS slow to propagate on their host",
    statusLabel: "Needs attention",
    clientCopy: {
      title: "Set up your email sending domain",
      body: "Everything looks right on your side — some hosts just take longer. We've asked for a manual re-check; if it's still pending tomorrow, your domain host can usually clear it.",
    },
    agencyCopy: "verifying 3d — usually 2d + force-verify action; hosting-provider-side issue.",
    primaryAction: null,
    showDispute: true,
  },
  {
    id: "step04.failure.root_domain_nudge",
    stepNum: 4,
    stepTitle: "Set up your email sending domain",
    stateType: "failure",
    rowClause: "Using main domain instead of a subdomain",
    statusLabel: "Heads up",
    clientCopy: {
      title: "Set up your email sending domain",
      body: "Use a dedicated subdomain (like mail.yourdomain.com) rather than your main domain — it keeps your website's mail untouched and verifies cleanly.",
    },
    agencyCopy: "Setup guidance · root domain chosen (pre-failure nudge).",
    primaryAction: "Take me there",
    showDispute: false,
  },
];

// ---------------------------------------------------------------------------
// Step 05 — Complete your business profile (Tier A)
// ---------------------------------------------------------------------------

const STEP_05: CatalogEntry[] = [
  {
    id: "step05.done",
    stepNum: 5,
    stepTitle: "Complete your business profile",
    stateType: "done",
    statusLabel: "Done",
    clientCopy: {
      title: "Complete your business profile",
      body: "Your business details are complete.",
    },
    agencyCopy: "Auto-verified · all required fields present.",
    primaryAction: null,
    showDispute: false,
  },
  {
    id: "step05.in_progress",
    stepNum: 5,
    stepTitle: "Complete your business profile",
    stateType: "in_progress",
    statusLabel: "In progress",
    clientCopy: {
      title: "Complete your business profile",
      body: "These details power your registrations and automations later — getting them right now prevents headaches downstream. 2 to go: website, timezone.",
    },
    agencyCopy: "Blue dot + days on this step; partial completion holds in_progress.",
    primaryAction: "Take me there",
    showDispute: false,
  },
  {
    id: "step05.failure.timezone_nudge",
    stepNum: 5,
    stepTitle: "Complete your business profile",
    stateType: "failure",
    rowClause: "Timezone may be set incorrectly",
    statusLabel: "Heads up",
    clientCopy: {
      title: "Complete your business profile",
      body: "Double-check the timezone — it controls when your automated messages go out.",
    },
    agencyCopy: "No flag; mis-set timezone surfaces later as odd automation timing.",
    primaryAction: "Take me there",
    showDispute: false,
  },
  {
    id: "step05.failure.website_unreachable",
    stepNum: 5,
    stepTitle: "Complete your business profile",
    stateType: "failure",
    rowClause: "Website URL doesn't resolve",
    statusLabel: "Needs attention",
    clientCopy: {
      title: "Complete your business profile",
      body: "That website address doesn't resolve — check for a typo (it also needs to be live for your text-messaging registration in a later step).",
    },
    agencyCopy: "Profile · website unreachable — cross-step: this same URL feeds A2P brand review (step 02).",
    primaryAction: "Take me there",
    showDispute: true,
  },
];

// ---------------------------------------------------------------------------
// Step 06 — Activate your workflows (Tier B — verifying)
// ---------------------------------------------------------------------------

const STEP_06: CatalogEntry[] = [
  {
    id: "step06.done",
    stepNum: 6,
    stepTitle: "Activate your workflows",
    stateType: "done",
    statusLabel: "Done",
    clientCopy: {
      title: "Activate your workflows",
      body: "All 3 workflows are live.",
    },
    agencyCopy: "Auto-verified · all named assets active.",
    primaryAction: null,
    showDispute: false,
  },
  {
    id: "step06.in_progress",
    stepNum: 6,
    stepTitle: "Activate your workflows",
    stateType: "in_progress",
    statusLabel: "In progress",
    clientCopy: {
      title: "Activate your workflows",
      body: "These automations follow up with leads while you're busy — turning them on is what makes the system work for you. 1 of 3 activated.",
    },
    agencyCopy: "Blue dot + days on this step; sub-checklist tracks per-asset activation.",
    primaryAction: "Take me there",
    showDispute: false,
  },
  {
    id: "step06.verifying",
    stepNum: 6,
    stepTitle: "Activate your workflows",
    stateType: "verifying",
    statusLabel: "Verifying",
    clientCopy: {
      title: "Activate your workflows",
      body: "We're checking this — usually 2 days. You can keep going.",
      verifyingStrip: "Meanwhile, let's publish your website funnel →",
    },
    agencyCopy: "Amber · verifying · day {n}.",
    primaryAction: null,
    showDispute: true,
  },
  {
    id: "step06.failure.asset_not_found",
    stepNum: 6,
    stepTitle: "Activate your workflows",
    stateType: "failure",
    rowClause: "Workflow asset is missing or renamed",
    statusLabel: "Needs attention",
    clientCopy: {
      title: "Activate your workflows",
      body: "One of the workflows from your setup package can't be found — Summit Digital is checking on it.",
    },
    agencyCopy: "Asset not found · 'Missed-call text-back' — deleted or renamed. Re-link or update the journey's asset list.",
    primaryAction: null,
    showDispute: true,
  },
  {
    id: "step06.failure.channel_prereq_missing",
    stepNum: 6,
    stepTitle: "Activate your workflows",
    stateType: "failure",
    rowClause: "Workflow needs the phone-number step done",
    statusLabel: "Heads up",
    clientCopy: {
      title: "Activate your workflows",
      body: "Activated — one heads-up: this workflow sends texts, which start working once your phone number step is done.",
    },
    agencyCopy: "Active w/ unmet channel dependency (SMS · no number) — informational; prevents the 'automation is broken' ticket.",
    primaryAction: null,
    showDispute: false,
  },
  {
    id: "step06.failure.deactivated_later",
    stepNum: 6,
    stepTitle: "Activate your workflows",
    stateType: "failure",
    rowClause: "Workflow deactivated after onboarding",
    statusLabel: "Silent (regression rule)",
    clientCopy: {
      title: "Activate your workflows",
      body: "Nothing — done stands (regression rule); adoption engine picks it up.",
    },
    agencyCopy: "Health/adoption signal, not an onboarding revert.",
    primaryAction: null,
    showDispute: false,
    devOnlyNotDetected: true,
  },
];

// ---------------------------------------------------------------------------
// Step 07 — Publish your website funnel (Tier A)
// ---------------------------------------------------------------------------

const STEP_07: CatalogEntry[] = [
  {
    id: "step07.done",
    stepNum: 7,
    stepTitle: "Publish your website funnel",
    stateType: "done",
    statusLabel: "Done",
    clientCopy: {
      title: "Publish your website funnel",
      body: "Your funnel is live and ready to catch leads.",
    },
    agencyCopy: "Auto-verified · funnel published.",
    primaryAction: null,
    showDispute: false,
  },
  {
    id: "step07.in_progress",
    stepNum: 7,
    stepTitle: "Publish your website funnel",
    stateType: "in_progress",
    statusLabel: "In progress",
    clientCopy: {
      title: "Publish your website funnel",
      body: "Your funnel is where leads land before they become customers — publishing it turns the rest of the system on.",
    },
    agencyCopy: "Blue dot + days on this step.",
    primaryAction: "Take me there",
    showDispute: false,
  },
  {
    id: "step07.failure.asset_not_found",
    stepNum: 7,
    stepTitle: "Publish your website funnel",
    stateType: "failure",
    rowClause: "Funnel asset is missing or renamed",
    statusLabel: "Needs attention",
    clientCopy: {
      title: "Publish your website funnel",
      body: "The funnel from your setup package can't be found — Summit Digital is checking on it.",
    },
    agencyCopy: "Asset not found · 'Main lead-gen funnel' — re-link or update the asset list.",
    primaryAction: null,
    showDispute: true,
  },
  {
    id: "step07.failure.default_domain_nudge",
    stepNum: 7,
    stepTitle: "Publish your website funnel",
    stateType: "failure",
    rowClause: "Funnel live on the default domain",
    statusLabel: "Heads up",
    clientCopy: {
      title: "Publish your website funnel",
      body: "Live! One more polish: attach your own domain so visitors see yourbusiness.com.",
    },
    agencyCopy: "Informational only.",
    primaryAction: "Take me there",
    showDispute: false,
  },
  {
    id: "step07.failure.placeholder_not_detected",
    stepNum: 7,
    stepTitle: "Publish your website funnel",
    stateType: "failure",
    rowClause: "Funnel content not verified by detector",
    statusLabel: "Not detected",
    clientCopy: {
      title: "Publish your website funnel",
      body: "NOT DETECTED — honesty rule: GoCSM verifies publication, not content quality. (Dev-only entry: mark as 'we don't detect this'; not a client card.)",
    },
    agencyCopy: "—",
    primaryAction: null,
    showDispute: false,
    devOnlyNotDetected: true,
  },
];

// ---------------------------------------------------------------------------
// Step 08 — Connect your custom domain (Tier B — verifying)
// ---------------------------------------------------------------------------

const STEP_08: CatalogEntry[] = [
  {
    id: "step08.done",
    stepNum: 8,
    stepTitle: "Connect your custom domain",
    stateType: "done",
    statusLabel: "Done",
    clientCopy: {
      title: "Connect your custom domain",
      body: "Your domain is connected and secure — visitors see your own address.",
    },
    agencyCopy: "Auto-verified · domain resolves and SSL active.",
    primaryAction: null,
    showDispute: false,
  },
  {
    id: "step08.in_progress",
    stepNum: 8,
    stepTitle: "Connect your custom domain",
    stateType: "in_progress",
    statusLabel: "In progress",
    clientCopy: {
      title: "Connect your custom domain",
      body: "Your own domain makes the funnel feel like part of your business instead of a generic system link — and customers trust it more.",
    },
    agencyCopy: "Blue dot + days on this step.",
    primaryAction: "Take me there",
    showDispute: false,
  },
  {
    id: "step08.verifying",
    stepNum: 8,
    stepTitle: "Connect your custom domain",
    stateType: "verifying",
    statusLabel: "Verifying",
    clientCopy: {
      title: "Connect your custom domain",
      body: "We're checking this — usually 2 days. You can keep going.",
      verifyingStrip: "Meanwhile, let's create your calendar →",
    },
    agencyCopy: "Amber · verifying · day {n}; DNS up to 48h.",
    primaryAction: null,
    showDispute: true,
  },
  {
    id: "step08.failure.dns_record_wrong",
    stepNum: 8,
    stepTitle: "Connect your custom domain",
    stateType: "failure",
    rowClause: "Domain isn't pointing to HighLevel yet",
    shortLabel: "Custom domain · DNS wrong",
    statusLabel: "Needs attention",
    clientCopy: {
      title: "Connect your custom domain",
      body: "The domain isn't pointing here yet. Add the record exactly as shown — and make sure you're editing DNS where it's actually hosted (some domains manage DNS at a different provider than the registrar).",
    },
    agencyCopy: "DNS · record missing/incorrect + observed vs expected values.",
    primaryAction: "Domains",
    showDispute: true,
  },
  {
    id: "step08.failure.cloudflare_proxy",
    stepNum: 8,
    stepTitle: "Connect your custom domain",
    stateType: "failure",
    rowClause: "Cloudflare proxy is hiding the record",
    statusLabel: "Needs attention",
    clientCopy: {
      title: "Connect your custom domain",
      body: "If you use Cloudflare: switch the record to 'DNS only' (grey cloud) until this connects — you can turn the proxy back on afterwards.",
    },
    agencyCopy: "DNS · proxied record suspected (Cloudflare) — the most common GHL domain gotcha.",
    primaryAction: "Take me there",
    showDispute: true,
  },
  {
    id: "step08.failure.caa_blocks_ssl",
    stepNum: 8,
    stepTitle: "Connect your custom domain",
    stateType: "failure",
    rowClause: "Security record is blocking the certificate",
    statusLabel: "Needs attention",
    clientCopy: {
      title: "Connect your custom domain",
      body: "Your domain has a security record (CAA) that's blocking the certificate. Add letsencrypt.org to the allowed issuers at your DNS host.",
    },
    agencyCopy: "SSL · CAA restriction.",
    primaryAction: "Take me there",
    showDispute: true,
  },
  {
    id: "step08.failure.propagation_slow",
    stepNum: 8,
    stepTitle: "Connect your custom domain",
    stateType: "verifying",
    statusLabel: "Verifying",
    clientCopy: {
      title: "Connect your custom domain",
      body: "Records look right — the internet is catching up. This can take up to a day or two; we'll flip it green automatically.",
    },
    agencyCopy: "verifying · day {n}; no action until past expected.",
    primaryAction: null,
    showDispute: true,
  },
  {
    id: "step08.failure.domain_expired_locked",
    stepNum: 8,
    stepTitle: "Connect your custom domain",
    stateType: "failure",
    rowClause: "Domain is expired or locked at registrar",
    statusLabel: "Needs attention",
    clientCopy: {
      title: "Connect your custom domain",
      body: "The domain itself looks expired or locked at the registrar — renew or unlock it there first; everything here is ready and waiting.",
    },
    agencyCopy: "Blocked · domain expired/locked (registrar-side).",
    primaryAction: null,
    showDispute: true,
  },
];

// ---------------------------------------------------------------------------
// Step 09 — Create your calendar and connect Google/Outlook (Tier A)
// ---------------------------------------------------------------------------

const STEP_09: CatalogEntry[] = [
  {
    id: "step09.done",
    stepNum: 9,
    stepTitle: "Create your calendar and connect Google/Outlook",
    stateType: "done",
    statusLabel: "Done",
    clientCopy: {
      title: "Create your calendar and connect Google/Outlook",
      body: "Your calendar is live and synced — bookings will land on it automatically.",
    },
    agencyCopy: "Auto-verified · calendar exists and external sync linked.",
    primaryAction: null,
    showDispute: false,
  },
  {
    id: "step09.in_progress",
    stepNum: 9,
    stepTitle: "Create your calendar and connect Google/Outlook",
    stateType: "in_progress",
    statusLabel: "In progress",
    clientCopy: {
      title: "Create your calendar and connect Google/Outlook",
      body: "Linking your real calendar is what stops double-bookings — leads see only the times you're actually free. Calendar created; sync remaining.",
    },
    agencyCopy: "Blue dot + days on this step; calendar exists but sync missing.",
    primaryAction: "Take me there",
    showDispute: false,
  },
  {
    id: "step09.failure.popup_blocked",
    stepNum: 9,
    stepTitle: "Create your calendar and connect Google/Outlook",
    stateType: "failure",
    rowClause: "Browser blocked the sign-in popup",
    statusLabel: "Needs attention",
    clientCopy: {
      title: "Create your calendar and connect Google/Outlook",
      body: "If nothing opened when you clicked Connect, your browser blocked the sign-in window. Allow popups for this site and try again.",
    },
    agencyCopy: "Connect attempted · no token returned — the silent popup-blocker signature.",
    primaryAction: "Take me there",
    showDispute: true,
  },
  {
    id: "step09.failure.wrong_account",
    stepNum: 9,
    stepTitle: "Create your calendar and connect Google/Outlook",
    stateType: "failure",
    rowClause: "Connected to a personal Google account",
    statusLabel: "Needs attention",
    clientCopy: {
      title: "Create your calendar and connect Google/Outlook",
      body: "Connected — but to {account}. If that's not your business calendar, disconnect and choose the right account when the picker appears.",
    },
    agencyCopy: "Connected · account looks personal ({gmail.com}) — heuristic, informational.",
    primaryAction: "Take me there",
    showDispute: true,
  },
  {
    id: "step09.failure.partial_scopes",
    stepNum: 9,
    stepTitle: "Create your calendar and connect Google/Outlook",
    stateType: "failure",
    rowClause: "Calendar permission missing on the connection",
    statusLabel: "Needs attention",
    clientCopy: {
      title: "Create your calendar and connect Google/Outlook",
      body: "The connection went through but is missing a permission, so bookings may not sync. Reconnect and accept all the requested permissions.",
    },
    agencyCopy: "Connected · missing scopes — reconnect required.",
    primaryAction: "Take me there",
    showDispute: true,
  },
  {
    id: "step09.failure.workspace_admin_block",
    stepNum: 9,
    stepTitle: "Create your calendar and connect Google/Outlook",
    stateType: "failure",
    rowClause: "Google Workspace admin must approve",
    statusLabel: "Needs attention",
    clientCopy: {
      title: "Create your calendar and connect Google/Outlook",
      body: "Your Google Workspace admin has to allow this connection. Forward them the request — it's a one-time approval on their side.",
    },
    agencyCopy: "Blocked · Workspace admin consent required — often multi-day.",
    primaryAction: null,
    showDispute: true,
  },
  {
    id: "step09.failure.conflict_calendar_nudge",
    stepNum: 9,
    stepTitle: "Create your calendar and connect Google/Outlook",
    stateType: "failure",
    rowClause: "Conflict calendar not chosen yet",
    statusLabel: "Heads up",
    clientCopy: {
      title: "Create your calendar and connect Google/Outlook",
      body: "Pick which calendar we should check for conflicts — it's what prevents double-bookings.",
    },
    agencyCopy: "Informational.",
    primaryAction: "Take me there",
    showDispute: false,
  },
];

// ---------------------------------------------------------------------------
// Step 10 — Create your lead form (Tier A)
// ---------------------------------------------------------------------------

const STEP_10: CatalogEntry[] = [
  {
    id: "step10.done",
    stepNum: 10,
    stepTitle: "Create your lead form",
    stateType: "done",
    statusLabel: "Done",
    clientCopy: {
      title: "Create your lead form",
      body: "Your lead form is ready to collect inquiries.",
    },
    agencyCopy: "Auto-verified · form exists on the location.",
    primaryAction: null,
    showDispute: false,
  },
  {
    id: "step10.in_progress",
    stepNum: 10,
    stepTitle: "Create your lead form",
    stateType: "in_progress",
    statusLabel: "In progress",
    clientCopy: {
      title: "Create your lead form",
      body: "This is the form that turns website visitors into contacts in your pipeline — every other automation flows from it.",
    },
    agencyCopy: "Blue dot + days on this step.",
    primaryAction: "Take me there",
    showDispute: false,
  },
  {
    id: "step10.failure.not_embedded_nudge",
    stepNum: 10,
    stepTitle: "Create your lead form",
    stateType: "failure",
    rowClause: "Form not yet added to a funnel page",
    statusLabel: "Heads up",
    clientCopy: {
      title: "Create your lead form",
      body: "Form's ready — add it to a funnel page so it can start catching leads.",
    },
    agencyCopy: "Informational; pairs with funnel step status.",
    primaryAction: "Take me there",
    showDispute: false,
  },
  {
    id: "step10.failure.deleted",
    stepNum: 10,
    stepTitle: "Create your lead form",
    stateType: "failure",
    rowClause: "Lead form was deleted after onboarding",
    statusLabel: "Silent (regression rule)",
    clientCopy: {
      title: "Create your lead form",
      body: "Nothing (regression rule).",
    },
    agencyCopy: "Adoption signal.",
    primaryAction: null,
    showDispute: false,
    devOnlyNotDetected: true,
  },
];

// ---------------------------------------------------------------------------
// Step 11 — Set up your sales pipeline (Tier A)
// ---------------------------------------------------------------------------

const STEP_11: CatalogEntry[] = [
  {
    id: "step11.done",
    stepNum: 11,
    stepTitle: "Set up your sales pipeline",
    stateType: "done",
    statusLabel: "Done",
    clientCopy: {
      title: "Set up your sales pipeline",
      body: "Your pipeline is set up — new leads will move through it automatically.",
    },
    agencyCopy: "Auto-verified · pipeline with ≥1 stage exists.",
    primaryAction: null,
    showDispute: false,
  },
  {
    id: "step11.in_progress",
    stepNum: 11,
    stepTitle: "Set up your sales pipeline",
    stateType: "in_progress",
    statusLabel: "In progress",
    clientCopy: {
      title: "Set up your sales pipeline",
      body: "Your pipeline is the picture of where every lead stands — without it, follow-ups slip through the cracks.",
    },
    agencyCopy: "Blue dot + days on this step.",
    primaryAction: "Take me there",
    showDispute: false,
  },
  {
    id: "step11.failure.snapshot_untouched",
    stepNum: 11,
    stepTitle: "Set up your sales pipeline",
    stateType: "failure",
    rowClause: "Pipeline left as snapshot default",
    statusLabel: "Not applicable",
    clientCopy: {
      title: "Set up your sales pipeline",
      body: "No failure state — if customization matters, the agency should model it as a custom 'You confirm' step instead. (Dev-only note so this never becomes a detector feature request.)",
    },
    agencyCopy: "—",
    primaryAction: null,
    showDispute: false,
    devOnlyNotDetected: true,
  },
];

// ---------------------------------------------------------------------------
// Step 12 — Connect Google Business Profile (Tier A)
// ---------------------------------------------------------------------------

const STEP_12: CatalogEntry[] = [
  {
    id: "step12.done",
    stepNum: 12,
    stepTitle: "Connect Google Business Profile",
    stateType: "done",
    statusLabel: "Done",
    clientCopy: {
      title: "Connect Google Business Profile",
      body: "Your Google listing is connected — reviews and posts will sync.",
    },
    agencyCopy: "Auto-verified · GBP connected with healthy permissions.",
    primaryAction: null,
    showDispute: false,
  },
  {
    id: "step12.in_progress",
    stepNum: 12,
    stepTitle: "Connect Google Business Profile",
    stateType: "in_progress",
    statusLabel: "In progress",
    clientCopy: {
      title: "Connect Google Business Profile",
      body: "Connecting your Google listing lets you reply to reviews and post updates from one place — and it's where most local customers find you first.",
    },
    agencyCopy: "Blue dot + days on this step.",
    primaryAction: "Take me there",
    showDispute: false,
  },
  {
    id: "step12.failure.gbp_unverified_postcard",
    stepNum: 12,
    stepTitle: "Connect Google Business Profile",
    stateType: "failure",
    rowClause: "Google hasn't verified the listing yet",
    statusLabel: "Needs attention",
    clientCopy: {
      title: "Connect Google Business Profile",
      body: "Google has to verify your business listing first — usually a postcard code to your address. Once Google shows 'verified', come back and this connects in a minute.",
    },
    agencyCopy: "Blocked · GBP unverified (Google-side, can take days–weeks) — external clock.",
    primaryAction: null,
    showDispute: true,
  },
  {
    id: "step12.failure.contributor_only_silent",
    stepNum: 12,
    stepTitle: "Connect Google Business Profile",
    stateType: "failure",
    rowClause: "GBP role too limited to sync reviews",
    statusLabel: "Connected",
    clientCopy: {
      title: "Connect Google Business Profile",
      body: "Connected, but with limited access — reviews won't sync. Ask the listing's Owner to upgrade your role to Owner or Manager, then reconnect.",
    },
    agencyCopy: "Connected · degraded (insufficient GBP role) — detector must check sync health, not just connection: the one that silently embarrasses everyone weeks later.",
    primaryAction: "Take me there",
    showDispute: true,
    silentFailure: true,
  },
  {
    id: "step12.failure.missing_permissions",
    stepNum: 12,
    stepTitle: "Connect Google Business Profile",
    stateType: "failure",
    rowClause: "GBP connection missing a permission",
    statusLabel: "Needs attention",
    clientCopy: {
      title: "Connect Google Business Profile",
      body: "One permission is missing. Open the warning in Settings → Integrations → Google, review it, and hit Reconnect.",
    },
    agencyCopy: "Connected · missing permissions — reconnect path in Integrations.",
    primaryAction: "Take me there",
    showDispute: true,
  },
  {
    id: "step12.failure.popup_blocked",
    stepNum: 12,
    stepTitle: "Connect Google Business Profile",
    stateType: "failure",
    rowClause: "Browser blocked the sign-in popup",
    statusLabel: "Needs attention",
    clientCopy: {
      title: "Connect Google Business Profile",
      body: "If nothing opened when you clicked Connect, your browser blocked the sign-in window. Allow popups for this site and try again.",
    },
    agencyCopy: "Connect attempted · no token.",
    primaryAction: "Take me there",
    showDispute: true,
  },
  {
    id: "step12.failure.wrong_account",
    stepNum: 12,
    stepTitle: "Connect Google Business Profile",
    stateType: "failure",
    rowClause: "Wrong Google account picked for the listing",
    statusLabel: "Needs attention",
    clientCopy: {
      title: "Connect Google Business Profile",
      body: "Make sure you pick the Google account that owns the business listing — if several accounts appear, the right one is usually the business email.",
    },
    agencyCopy: "Informational.",
    primaryAction: "Take me there",
    showDispute: true,
  },
];

// ---------------------------------------------------------------------------
// Step 13 — Connect Facebook / Instagram (Tier A)
// ---------------------------------------------------------------------------

const STEP_13: CatalogEntry[] = [
  {
    id: "step13.done",
    stepNum: 13,
    stepTitle: "Connect Facebook / Instagram",
    stateType: "done",
    statusLabel: "Done",
    clientCopy: {
      title: "Connect Facebook / Instagram",
      body: "Your social accounts are connected — messages and posts route here.",
    },
    agencyCopy: "Auto-verified · Facebook Page connected (also authorizes Social Planner).",
    primaryAction: null,
    showDispute: false,
  },
  {
    id: "step13.in_progress",
    stepNum: 13,
    stepTitle: "Connect Facebook / Instagram",
    stateType: "in_progress",
    statusLabel: "In progress",
    clientCopy: {
      title: "Connect Facebook / Instagram",
      body: "Connecting your social pages pulls messages and comments into one inbox — so a lead asking on Instagram doesn't sit unanswered for days.",
    },
    agencyCopy: "Blue dot + days on this step.",
    primaryAction: "Take me there",
    showDispute: false,
  },
  {
    id: "step13.failure.not_page_admin",
    stepNum: 13,
    stepTitle: "Connect Facebook / Instagram",
    stateType: "failure",
    rowClause: "Not a Page admin on Facebook",
    statusLabel: "Needs attention",
    clientCopy: {
      title: "Connect Facebook / Instagram",
      body: "Connecting needs Admin access to your business's Facebook Page — not just a personal account. Ask whoever manages the Page to make you an Admin, then retry.",
    },
    agencyCopy: "Blocked · not Page Admin — the dominant FB failure; often the agency historically owns the Page: ownership-transfer prompt.",
    primaryAction: "Take me there",
    showDispute: true,
  },
  {
    id: "step13.failure.partial_scopes",
    stepNum: 13,
    stepTitle: "Connect Facebook / Instagram",
    stateType: "failure",
    rowClause: "Facebook permissions partially declined",
    statusLabel: "Needs attention",
    clientCopy: {
      title: "Connect Facebook / Instagram",
      body: "The connection is missing permissions Facebook asked about. Reconnect and accept each prompt — declining any of them breaks posting or messaging.",
    },
    agencyCopy: "Connected · missing scopes.",
    primaryAction: "Take me there",
    showDispute: true,
  },
  {
    id: "step13.failure.ig_not_business",
    stepNum: 13,
    stepTitle: "Connect Facebook / Instagram",
    stateType: "failure",
    rowClause: "Instagram isn't a business account yet",
    statusLabel: "Needs attention",
    clientCopy: {
      title: "Connect Facebook / Instagram",
      body: "Instagram connects through your Facebook Page — switch the IG account to a business account and link it to the Page in Meta settings first.",
    },
    agencyCopy: "IG unlinked · business-account prerequisite.",
    primaryAction: "Take me there",
    showDispute: true,
  },
  {
    id: "step13.failure.one_page_limit",
    stepNum: 13,
    stepTitle: "Connect Facebook / Instagram",
    stateType: "failure",
    rowClause: "Already linked to a different Facebook Page",
    statusLabel: "Needs attention",
    clientCopy: {
      title: "Connect Facebook / Instagram",
      body: "Each account links one Facebook Page. To switch Pages, disconnect the current one first.",
    },
    agencyCopy: "Informational.",
    primaryAction: "Take me there",
    showDispute: true,
  },
  {
    id: "step13.failure.fb_checkpoint_2fa",
    stepNum: 13,
    stepTitle: "Connect Facebook / Instagram",
    stateType: "failure",
    rowClause: "Facebook paused sign-in for a security check",
    statusLabel: "Needs attention",
    clientCopy: {
      title: "Connect Facebook / Instagram",
      body: "Facebook paused the sign-in for a security check on their side — finish it in Facebook, then retry here.",
    },
    agencyCopy: "Connect interrupted · FB checkpoint.",
    primaryAction: "Take me there",
    showDispute: true,
  },
];

// ---------------------------------------------------------------------------
// Step 14 — Connect payments (Stripe) (Tier A)
// ---------------------------------------------------------------------------

const STEP_14: CatalogEntry[] = [
  {
    id: "step14.done",
    stepNum: 14,
    stepTitle: "Connect payments (Stripe)",
    stateType: "done",
    statusLabel: "Done",
    clientCopy: {
      title: "Connect payments (Stripe)",
      body: "Payments are connected — you can take cards through your funnel.",
    },
    agencyCopy: "Auto-verified · Stripe connected with charges enabled.",
    primaryAction: null,
    showDispute: false,
  },
  {
    id: "step14.in_progress",
    stepNum: 14,
    stepTitle: "Connect payments (Stripe)",
    stateType: "in_progress",
    statusLabel: "In progress",
    clientCopy: {
      title: "Connect payments (Stripe)",
      body: "Connecting Stripe lets your funnel take payments directly — no extra invoice step between an interested lead and a paying customer.",
    },
    agencyCopy: "Blue dot + days on this step.",
    primaryAction: "Take me there",
    showDispute: false,
  },
  {
    id: "step14.failure.charges_disabled_kyc",
    stepNum: 14,
    stepTitle: "Connect payments (Stripe)",
    stateType: "failure",
    rowClause: "Stripe activation isn't finished",
    statusLabel: "Needs attention",
    clientCopy: {
      title: "Connect payments (Stripe)",
      body: "Stripe is connected but can't take payments yet — Stripe still needs your business and bank details. Finish activation in your Stripe dashboard and this completes itself.",
    },
    agencyCopy: "Connected · charges disabled (Stripe activation incomplete) — why the detector checks capability, not just the token.",
    primaryAction: "Take me there",
    showDispute: true,
  },
  {
    id: "step14.failure.oauth_abandoned_mid_kyc",
    stepNum: 14,
    stepTitle: "Connect payments (Stripe)",
    stateType: "in_progress",
    statusLabel: "In progress",
    clientCopy: {
      title: "Connect payments (Stripe)",
      body: "Picking up where you left off works — Stripe saves your progress.",
    },
    agencyCopy: "In progress · Stripe onboarding abandoned at KYC once stalled.",
    primaryAction: "Take me there",
    showDispute: false,
  },
  {
    id: "step14.failure.country_unsupported",
    stepNum: 14,
    stepTitle: "Connect payments (Stripe)",
    stateType: "failure",
    rowClause: "Stripe not available in their country",
    statusLabel: "Not available",
    clientCopy: {
      title: "Connect payments (Stripe)",
      body: "Stripe isn't available in {country} yet. Summit Digital will set up an alternative payment provider with you.",
    },
    agencyCopy: "Blocked · Stripe unsupported region — terminal for this provider; consider alternative or skip.",
    primaryAction: null,
    showDispute: false,
    terminal: true,
  },
  {
    id: "step14.failure.test_mode_flag",
    stepNum: 14,
    stepTitle: "Connect payments (Stripe)",
    stateType: "failure",
    rowClause: "Stripe connected in test mode",
    statusLabel: "Heads up",
    clientCopy: {
      title: "Connect payments (Stripe)",
      body: "Connected in test mode — fine for trying things out, but switch to your live Stripe account before taking real payments.",
    },
    agencyCopy: "Connected · test mode.",
    primaryAction: "Take me there",
    showDispute: false,
  },
];

// ---------------------------------------------------------------------------
// Step 15 — Book your kickoff call (with {Agency}) (Tier A)
// ---------------------------------------------------------------------------

const STEP_15: CatalogEntry[] = [
  {
    id: "step15.done",
    stepNum: 15,
    stepTitle: "Book your kickoff call (with Summit Digital)",
    stateType: "done",
    statusLabel: "Done",
    clientCopy: {
      title: "Book your kickoff call (with Summit Digital)",
      body: "Booked — Tuesday 2:00pm with Summit Digital.",
    },
    agencyCopy: "Auto-verified · booking event fired on kickoff calendar.",
    primaryAction: null,
    showDispute: false,
  },
  {
    id: "step15.in_progress",
    stepNum: 15,
    stepTitle: "Book your kickoff call (with Summit Digital)",
    stateType: "in_progress",
    statusLabel: "In progress",
    clientCopy: {
      title: "Book your kickoff call (with Summit Digital)",
      body: "This call is where Summit Digital walks you through what's live and hands you the keys — pick a time that works.",
    },
    agencyCopy: "Blue dot + days on this step; human anchor.",
    primaryAction: "Take me there",
    showDispute: false,
  },
  {
    id: "step15.failure.no_slots",
    stepNum: 15,
    stepTitle: "Book your kickoff call (with Summit Digital)",
    stateType: "failure",
    rowClause: "Kickoff calendar has no open times",
    statusLabel: "Needs attention",
    clientCopy: {
      title: "Book your kickoff call (with Summit Digital)",
      body: "No times are showing right now — we've pinged Summit Digital to open up slots; check back shortly.",
    },
    agencyCopy: "ACTION · kickoff calendar has no open availability — agency-owned blocker.",
    primaryAction: null,
    showDispute: true,
  },
  {
    id: "step15.failure.embed_load_failure",
    stepNum: 15,
    stepTitle: "Book your kickoff call (with Summit Digital)",
    stateType: "failure",
    rowClause: "Booking calendar didn't load in browser",
    statusLabel: "Needs attention",
    clientCopy: {
      title: "Book your kickoff call (with Summit Digital)",
      body: "The calendar didn't load — your browser may be blocking it. Use this direct booking link instead.",
    },
    agencyCopy: "Embed load failure observed · fallback link served.",
    primaryAction: "Use the direct booking link",
    showDispute: true,
  },
  {
    id: "step15.failure.cancelled_before_call",
    stepNum: 15,
    stepTitle: "Book your kickoff call (with Summit Digital)",
    stateType: "failure",
    rowClause: "Kickoff was cancelled before the call",
    statusLabel: "Reschedule",
    clientCopy: {
      title: "Book your kickoff call (with Summit Digital)",
      body: "Your kickoff was cancelled — grab a new time that works.",
    },
    agencyCopy: "Kickoff cancelled · reverted to booking + days-clock resumes.",
    primaryAction: "Pick a new time",
    showDispute: false,
  },
  {
    id: "step15.failure.no_show",
    stepNum: 15,
    stepTitle: "Book your kickoff call (with Summit Digital)",
    stateType: "failure",
    rowClause: "Client didn't show for the kickoff call",
    statusLabel: "Reschedule",
    clientCopy: {
      title: "Book your kickoff call (with Summit Digital)",
      body: "Missed it? Happens to everyone — pick a new time and Summit Digital will be there.",
    },
    agencyCopy: "No-show recorded · reschedule prompted — agency setting controls revert-vs-keep; default revert.",
    primaryAction: "Pick a new time",
    showDispute: false,
  },
  {
    id: "step15.failure.booked_outside_embed",
    stepNum: 15,
    stepTitle: "Book your kickoff call (with Summit Digital)",
    stateType: "failure",
    rowClause: "Booking happened outside the detector",
    statusLabel: "Needs attention",
    clientCopy: {
      title: "Book your kickoff call (with Summit Digital)",
      body: "Detector silent → dispute flow resolves it; agency confirm writes agency_verified.",
    },
    agencyCopy: "Standard dispute task.",
    primaryAction: null,
    showDispute: true,
  },
];

// ---------------------------------------------------------------------------
// Catalog assembly — universals first, then steps 01..15 in order.
// ---------------------------------------------------------------------------

export const stateCatalog: CatalogEntry[] = [
  ...UNIVERSAL,
  ...STEP_01,
  ...STEP_02,
  ...STEP_03,
  ...STEP_04,
  ...STEP_05,
  ...STEP_06,
  ...STEP_07,
  ...STEP_08,
  ...STEP_09,
  ...STEP_10,
  ...STEP_11,
  ...STEP_12,
  ...STEP_13,
  ...STEP_14,
  ...STEP_15,
];

/** Step numbers present in the catalog, ordered ascending. */
export function catalogStepNumbers(): number[] {
  const set = new Set<number>();
  for (const e of stateCatalog) if (e.stepNum != null) set.add(e.stepNum);
  return [...set].sort((a, b) => a - b);
}

/** All entries for a given step number, in catalog order. */
export function entriesForStep(stepNum: number): CatalogEntry[] {
  return stateCatalog.filter((e) => e.stepNum === stepNum);
}

/** All universal entries, in catalog order. */
export function universalEntries(): CatalogEntry[] {
  return stateCatalog.filter((e) => e.stepNum === null);
}

export function findEntry(id: string): CatalogEntry | undefined {
  return stateCatalog.find((e) => e.id === id);
}
