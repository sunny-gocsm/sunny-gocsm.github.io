import type {
  Journey,
  Step,
  StepConfidence,
  StepOwner,
  StepTier,
} from "./types";
import { newDraftId } from "./types";

interface Rule {
  test: RegExp;
  type: string;
  tier: StepTier;
  owner: StepOwner;
  title: string;
  confidence: StepConfidence;
}

// Order matters — first match wins.
const RULES: Rule[] = [
  // A2P (campaign before bare brand)
  { test: /a2p.*campaign|campaign.*a2p/i, type: "a2p_campaign", tier: "B", owner: "client", title: "Text-messaging campaign approval (A2P campaign)", confidence: "fact" },
  { test: /\ba2p\b|brand registration|text(?:ing)? registration/i, type: "a2p_brand", tier: "B", owner: "client", title: "Register your business for text messaging (A2P brand)", confidence: "fact" },

  // Domains (specific before generic)
  { test: /custom domain|connect.*domain/i, type: "custom_domain", tier: "B", owner: "client", title: "Connect your custom domain", confidence: "fact" },
  { test: /email.*domain|sending domain/i, type: "email_domain", tier: "B", owner: "client", title: "Set up your email sending domain", confidence: "fact" },

  // Phone
  { test: /phone\s*(number|purchase)?|\bnumber\b/i, type: "phone_purchase", tier: "A", owner: "client", title: "Purchase phone number", confidence: "fact" },

  // Kickoff
  { test: /kickoff|intro call/i, type: "kickoff_call", tier: "C", owner: "client", title: "Book your kickoff call", confidence: "fact" },

  // Profile / workflows / funnel
  { test: /business profile/i, type: "business_profile", tier: "A", owner: "client", title: "Complete your business profile", confidence: "fact" },
  { test: /workflow|automation/i, type: "snapshot_workflows", tier: "B", owner: "client", title: "Activate your workflows", confidence: "fact" },
  { test: /funnel|website/i, type: "funnel_publish", tier: "A", owner: "client", title: "Publish your website funnel", confidence: "fact" },

  // Calendar / form / pipeline
  { test: /calendar|google calendar|outlook/i, type: "calendar_sync", tier: "A", owner: "client", title: "Create your calendar and connect Google/Outlook", confidence: "fact" },
  { test: /lead form|\bform\b/i, type: "form_create", tier: "A", owner: "client", title: "Create your lead form", confidence: "fact" },
  { test: /pipeline|opportunit/i, type: "pipeline_setup", tier: "A", owner: "client", title: "Set up your sales pipeline", confidence: "fact" },

  // Integrations
  { test: /google business|\bgbp\b/i, type: "gbp_connect", tier: "A", owner: "client", title: "Connect Google Business Profile", confidence: "fact" },
  { test: /facebook|instagram|\bmeta\b/i, type: "facebook_connect", tier: "A", owner: "client", title: "Connect Facebook / Instagram", confidence: "fact" },
  { test: /stripe|payment/i, type: "stripe_connect", tier: "A", owner: "client", title: "Connect payments (Stripe)", confidence: "fact" },

  // Fuzzy fallbacks
  { test: /\bdomain\b/i, type: "custom_domain", tier: "B", owner: "client", title: "Connect your custom domain", confidence: "guess" },
  { test: /\bemail\b/i, type: "email_domain", tier: "B", owner: "client", title: "Set up your email sending domain", confidence: "guess" },
  { test: /\btext\b|\bsms\b/i, type: "a2p_brand", tier: "B", owner: "client", title: "Register your business for text messaging (A2P brand)", confidence: "guess" },
];

export interface Mapped {
  title: string;
  type: string;
  tier: StepTier;
  owner: StepOwner;
  confidence: StepConfidence;
}

export function mapLine(rawLine: string): Mapped {
  const line = rawLine.trim();
  for (const r of RULES) {
    if (r.test.test(line)) {
      return { title: r.title, type: r.type, tier: r.tier, owner: r.owner, confidence: r.confidence };
    }
  }
  // No catalog hit → custom manual step, keep the user's words
  return { title: line, type: "custom_manual", tier: "A", owner: "client", confidence: "guess" };
}

export function mapChecklistToJourney(raw: string): Journey {
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const steps: Step[] = lines.map((line, idx) => {
    const m = mapLine(line);
    return {
      id: "s" + String(idx + 1).padStart(2, "0"),
      order: idx + 1,
      title: m.title,
      type: m.type,
      tier: m.tier,
      owner: m.owner,
      state: "not_started",
      slaHours: 24,
      dependencies: [],
      mapping: { confidence: m.confidence, source: "paste" },
    };
  });

  return {
    id: newDraftId(),
    name: "Untitled journey",
    status: "draft",
    version: 1,
    targetDays: 14,
    clientCount: 0,
    steps,
  };
}
