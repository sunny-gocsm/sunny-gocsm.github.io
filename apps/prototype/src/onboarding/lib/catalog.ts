// Catalog of the 15 onboarding step types + custom_manual.
// Single source of truth for type → tier, default owner, SLA prefill, deep link.

import type { Journey, Step, StepDetector, StepOwner, StepTier } from "./types";

export interface CatalogEntry {
  type: string;
  label: string;
  defaultTitle: string;
  tier: StepTier;
  owner: StepOwner;
  slaHours: number;
  slaHelper: string;
  deepLink: string;
  clientInstructions: string;
}

export const CATALOG: CatalogEntry[] = [
  // Tier A — quick client wins
  { type: "phone_purchase",    label: "Phone number purchase",       defaultTitle: "Purchase phone number",                                  tier: "A", owner: "client", slaHours: 24,  slaHelper: "Usually completed same-day",                deepLink: "Settings → Phone Numbers",                       clientInstructions: "Pick your business phone number — it's what your customers will see when you call or text them." },
  { type: "business_profile",  label: "Business profile",            defaultTitle: "Complete your business profile",                         tier: "A", owner: "client", slaHours: 24,  slaHelper: "Usually completed same-day",                deepLink: "Settings → Business Profile",                    clientInstructions: "Tell us your business name, address and hours. This shows up on receipts, confirmations and your booking pages." },
  { type: "funnel_publish",    label: "Funnel / website publish",    defaultTitle: "Publish your website funnel",                            tier: "A", owner: "client", slaHours: 24,  slaHelper: "Usually completed same-day",                deepLink: "Sites → Funnels",                                clientInstructions: "Publish your website so visitors can actually find it and book with you." },
  { type: "calendar_sync",     label: "Calendar setup",              defaultTitle: "Create your calendar and connect Google/Outlook",        tier: "A", owner: "client", slaHours: 24,  slaHelper: "Usually completed same-day",                deepLink: "Calendars → Calendar Settings",                  clientInstructions: "Set up your calendar and connect Google or Outlook so bookings land on your real schedule — no double-bookings." },
  { type: "form_create",       label: "Lead form",                   defaultTitle: "Create your lead form",                                  tier: "A", owner: "client", slaHours: 24,  slaHelper: "Usually completed same-day",                deepLink: "Sites → Forms",                                  clientInstructions: "Build the form your leads fill out so their info flows straight into your pipeline." },
  { type: "pipeline_setup",    label: "Sales pipeline",              defaultTitle: "Set up your sales pipeline",                             tier: "A", owner: "client", slaHours: 24,  slaHelper: "Usually completed same-day",                deepLink: "Opportunities → Pipelines",                      clientInstructions: "Lay out the stages a lead moves through, from first contact to closed deal — this is how you'll track every opportunity." },
  { type: "gbp_connect",       label: "Google Business Profile",     defaultTitle: "Connect Google Business Profile",                        tier: "A", owner: "client", slaHours: 24,  slaHelper: "Usually completed same-day",                deepLink: "Settings → Integrations",                        clientInstructions: "Connect Google Business so reviews and messages from Google come into one place." },
  { type: "facebook_connect",  label: "Facebook / Instagram",        defaultTitle: "Connect Facebook / Instagram",                           tier: "A", owner: "client", slaHours: 24,  slaHelper: "Usually completed same-day",                deepLink: "Settings → Integrations",                        clientInstructions: "Connect Facebook and Instagram so messages and leads from social land in your inbox." },
  { type: "stripe_connect",    label: "Payments (Stripe)",           defaultTitle: "Connect payments (Stripe)",                              tier: "A", owner: "client", slaHours: 24,  slaHelper: "Usually completed same-day",                deepLink: "Payments → Integrations",                        clientInstructions: "Connect Stripe so you can take payments and send invoices right from here." },

  // Tier B — external review / configuration
  { type: "a2p_brand",         label: "A2P brand registration",      defaultTitle: "Register your business for text messaging (A2P brand)",  tier: "B", owner: "client", slaHours: 72,  slaHelper: "Carrier review typically takes 1–3 days",   deepLink: "Settings → Phone Numbers → Trust Center",        clientInstructions: "Register your business for text messaging. Phone companies require this — it protects your delivery rates and keeps your messages out of spam." },
  { type: "a2p_campaign",      label: "A2P campaign approval",       defaultTitle: "Text-messaging campaign approval (A2P campaign)",        tier: "B", owner: "client", slaHours: 120, slaHelper: "Carrier vetting can take 3–7 days",         deepLink: "Settings → Phone Numbers → Trust Center",        clientInstructions: "Tell the phone companies what kinds of texts you'll send, so they go through reliably." },
  { type: "email_domain",      label: "Email sending domain",        defaultTitle: "Set up your email sending domain",                       tier: "B", owner: "client", slaHours: 48,  slaHelper: "DNS records usually propagate within a day", deepLink: "Settings → Email Services → Dedicated Domain",  clientInstructions: "Connect your sending domain so emails come from you — not a generic address — and land in the inbox." },
  { type: "custom_domain",     label: "Custom domain",               defaultTitle: "Connect your custom domain",                             tier: "B", owner: "client", slaHours: 48,  slaHelper: "DNS can take up to 48h",                    deepLink: "Settings → Domains",                             clientInstructions: "Point your own domain at your site so customers see your brand, not ours." },
  { type: "snapshot_workflows",label: "Snapshot / workflows",        defaultTitle: "Activate your workflows",                                tier: "B", owner: "client", slaHours: 48,  slaHelper: "Usually completed within a day",            deepLink: "Automation → Workflows",                         clientInstructions: "Turn on the automations that follow up with leads, confirm bookings and keep your pipeline moving." },

  // Tier C — kickoff (client books from agency-set scheduler)
  { type: "kickoff_call",      label: "Kickoff call",                defaultTitle: "Book your kickoff call",                                 tier: "C", owner: "client", slaHours: 120, slaHelper: "Most clients book within 3–5 days",         deepLink: "",                                              clientInstructions: "Pick a time that works — your agency will see it on their calendar." },

  // Custom
  { type: "custom_manual",     label: "Custom (manual)",             defaultTitle: "Custom step",                                            tier: "C", owner: "client", slaHours: 24,  slaHelper: "Set the cadence you expect",                deepLink: "",                                               clientInstructions: "" },
];



export const CATALOG_TYPES = CATALOG.map((c) => c.type);

export function getCatalogEntry(type: string): CatalogEntry {
  return CATALOG.find((c) => c.type === type) ?? CATALOG[CATALOG.length - 1];
}

/* ============ Detector defaults & webhook helpers ============ */

/** Step types whose completion GoCSM can observe directly inside HighLevel. */
const AUTO_DETECTABLE = new Set<string>([
  "phone_purchase",
  "a2p_brand",
  "a2p_campaign",
  "email_domain",
  "business_profile",
  "snapshot_workflows",
  "custom_domain",
  "calendar_sync",
  "form_create",
  "pipeline_setup",
  "gbp_connect",
  "facebook_connect",
  "stripe_connect",
  "funnel_publish",
  "kickoff_call",
]);

export function canAutoDetect(type: string): boolean {
  return AUTO_DETECTABLE.has(type);
}

/** Default detector for a fresh step. */
export function defaultDetector(type: string): StepDetector {
  if (type === "custom_manual") return "inbound_webhook";
  if (AUTO_DETECTABLE.has(type)) return "auto";
  return "manual";
}

export function effectiveDetector(step: Pick<Step, "type" | "detector">): StepDetector {
  return step.detector ?? defaultDetector(step.type);
}

const TOKEN_ALPHA = "abcdefghijklmnopqrstuvwxyz0123456789";
export function newWebhookToken(): string {
  // 18 chars, URL-safe. Mock token — display only.
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const bytes = new Uint8Array(18);
    crypto.getRandomValues(bytes);
    let out = "";
    for (let i = 0; i < bytes.length; i++) out += TOKEN_ALPHA[bytes[i] % TOKEN_ALPHA.length];
    return out;
  }
  let out = "";
  for (let i = 0; i < 18; i++) {
    out += TOKEN_ALPHA[Math.floor(Math.random() * TOKEN_ALPHA.length)];
  }
  return out;
}

export function webhookUrl(token: string): string {
  return `https://hooks.gocsm.com/e/${token}`;
}

export const WEBHOOK_SAMPLE_PAYLOAD = `{
  "locationId": "loc_XXXXXXXX",
  "completed": true
}`;

// Intrinsic, type-level requirements. These are the ONLY requirements in the system.
// A step is locked iff its required-type sibling exists in the journey and is not yet `done`.
// Position in the list is irrelevant.
export const REQUIRED_TYPE: Record<string, string | undefined> = {
  a2p_campaign: "a2p_brand",
};

export function requiredStep(journey: Journey, step: Step): Step | undefined {
  const t = REQUIRED_TYPE[step.type];
  return t ? journey.steps.find((s) => s.type === t) : undefined;
}

export function isLockedByRequirement(journey: Journey, step: Step): boolean {
  const r = requiredStep(journey, step);
  return !!r && r.state !== "done";
}

// "Asset" steps are the HighLevel features that exist as a NAMED COLLECTION in
// the agency's snapshot — workflows, funnels/sites, forms, pipelines. For these
// the agency can require "any one counts" or name a specific asset from their
// snapshot. (Integrations, domains, A2P, phone, calendar-connect, profile and
// kickoff are one-shot connections, not a pick-from-a-list, so they're NOT here.)
export const ASSET_TYPES = new Set([
  "snapshot_workflows",
  "funnel_publish",
  "form_create",
  "pipeline_setup",
]);

export interface AssetNoun {
  singular: string;
  plural: string;
  /** Infinitive action, e.g. "activate" — used in "should your client {verb}?". */
  verb: string;
  /** Third-person action, e.g. "activates" — used in "your client {verbs} any …". */
  verbs: string;
  question: string;
  placeholder: string;
}

export function assetNoun(type: string): AssetNoun | null {
  switch (type) {
    case "snapshot_workflows":
      return {
        singular: "workflow",
        plural: "workflows",
        verb: "activate",
        verbs: "activates",
        question: "Which workflows should your client activate?",
        placeholder: "Lead nurture — new inquiry",
      };
    case "funnel_publish":
      return {
        singular: "funnel",
        plural: "funnels",
        verb: "publish",
        verbs: "publishes",
        question: "Which funnels should your client publish?",
        placeholder: "Main lead-gen funnel",
      };
    case "form_create":
      return {
        singular: "form",
        plural: "forms",
        verb: "build",
        verbs: "builds",
        question: "Which forms should your client build?",
        placeholder: "Contact form",
      };
    case "pipeline_setup":
      return {
        singular: "pipeline",
        plural: "pipelines",
        verb: "set up",
        verbs: "sets up",
        question: "Which pipelines should your client set up?",
        placeholder: "Sales pipeline",
      };
    default:
      return null;
  }
}

export function assetPresets(type: string): string[] {
  switch (type) {
    case "snapshot_workflows":
      return [
        "Lead nurture — new inquiry",
        "Missed-call text-back",
        "Appointment reminders",
        "Review request",
        "Long-term nurture (90-day)",
        "Reactivation — cold leads",
        "Post-purchase thank-you",
        "Birthday / anniversary",
      ];
    case "funnel_publish":
      return [
        "Main lead-gen funnel",
        "Booking / scheduling funnel",
        "Webinar registration",
        "Lead magnet opt-in",
        "Survey / quiz funnel",
        "Upsell / order-bump funnel",
      ];
    case "form_create":
      return [
        "Contact form",
        "Quote request",
        "Book a consult",
        "Get a callback",
        "Newsletter signup",
      ];
    case "pipeline_setup":
      return [
        "Sales pipeline",
        "Onboarding pipeline",
        "Renewal pipeline",
      ];
    default:
      return [];
  }
}


