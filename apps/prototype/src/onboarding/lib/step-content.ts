// Per-step content for the client-facing current-step card.
// The card on /doer-demo and in the Builder's ClientPreview reads ALL of its
// step-specific copy (body, verifying strip, failure strip + CTA, primary
// CTA) from this single source so nothing carries across simulated transitions.
//
// Voice: client surface — plain, warm, blame-free. No GoCSM brand language.
// Only A2P steps reference phone companies or the Trust Center.

export interface FailureContent {
  /** Sentence-form failure body. May reference "HighLevel's compliance page". */
  body: string;
  /** Primary action label, e.g. "Fix it in the Trust Center". */
  ctaLabel: string;
}

export interface StepContent {
  /** Explainer paragraph shown in the default current-step state. */
  body: string;
  /** Verifying-state strip copy (Tier B steps only). */
  verifyingStrip?: string;
  /** Needs-attention copy. Absent on steps with no detector failure mode. */
  failure?: FailureContent;
  /** Primary CTA label. Defaults to "Take me there". */
  primaryCta?: string;
}

export const STEP_CONTENT: Record<string, StepContent> = {
  phone_purchase: {
    body: "Pick a local number so your texts and calls show up with a familiar area code.",
  },
  a2p_brand: {
    body: "We register your business with the phone companies so your texts are trusted and don't go to spam.",
    verifyingStrip:
      "Verifying — carrier review usually takes 1–3 days. We'll keep checking and update this automatically.",
    failure: {
      body: "There's a problem with your registration: your business name doesn't match your EIN record. You can correct it in the Trust Center — HighLevel's compliance page for text-messaging registrations.",
      ctaLabel: "Fix it in the Trust Center",
    },
  },
  a2p_campaign: {
    body: "The phone companies review a sample of the messages you'll send so they know your texts are wanted, not spam.",
    verifyingStrip:
      "Verifying — carrier campaign review usually takes 2–5 days. We'll keep checking and update this automatically.",
    failure: {
      body: "Carriers flagged your sample message — it reads like marketing without opt-in language. You can update the sample in the Trust Center — HighLevel's compliance page for text-messaging registrations.",
      ctaLabel: "Fix it in the Trust Center",
    },
  },
  email_domain: {
    body: "Send email from your own domain so it lands in the inbox, not spam.",
  },
  business_profile: {
    body: "Add your business name, address, and logo — these show up on emails, invoices, and your booking page.",
  },
  snapshot_workflows: {
    body: "Turn on the automations that follow up with new leads and missed calls so nothing slips through.",
  },
  custom_domain: {
    body: "Point your domain at your site so visitors see your brand, not a generic URL.",
  },
  funnel_publish: {
    body: "Publish your lead-gen pages so people can find you and sign up.",
  },
  calendar_sync: {
    body: "Connect Google or Outlook so booked calls land on your real calendar and you don't get double-booked.",
  },
  form_create: {
    body: "Set up the form people fill out to become a lead — every submission lands in your pipeline.",
  },
  pipeline_setup: {
    body: "Set up the stages a lead moves through, from new inquiry to closed deal.",
  },
  gbp_connect: {
    body: "Connect your Google Business Profile so reviews and messages flow into one place.",
  },
  facebook_connect: {
    body: "Connect Facebook and Instagram so leads from your ads and DMs come straight into your pipeline.",
  },
  stripe_connect: {
    body: "Connect Stripe so you can take payments and send invoices from the same place.",
  },
  kickoff_call: {
    body: "Pick a time that works — your agency will see it on their calendar.",
  },
};

export function getStepContent(type: string): StepContent {
  const c = STEP_CONTENT[type];
  if (!c) throw new Error(`Missing step content for type "${type}"`);
  return c;
}
