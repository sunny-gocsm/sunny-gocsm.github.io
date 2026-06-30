// Agency snapshot sub-accounts + the assets (workflows / funnels) inside them.
// STUB: stands in for a real HighLevel snapshot read. When an agency configures
// a "specific" asset step, they pick a snapshot sub-account here and GoCSM
// "fetches" its assets so they can select the exact ones to activate.

export interface SnapshotAccount {
  id: string;
  name: string;
}

export const SNAPSHOT_ACCOUNTS: SnapshotAccount[] = [
  { id: "master", name: "Master snapshot" },
  { id: "summit", name: "Summit Digital (template account)" },
  { id: "localsvc", name: "Local Services snapshot" },
  { id: "leadgen", name: "Lead-Gen snapshot" },
];

// Per-account, per-asset-type asset names. Deterministic stub.
const WORKFLOWS: Record<string, string[]> = {
  master: [
    "Lead nurture — new inquiry",
    "Missed-call text-back",
    "Appointment reminders",
    "Review request",
    "Long-term nurture (90-day)",
    "Reactivation — cold leads",
    "Post-purchase thank-you",
  ],
  summit: [
    "Lead nurture — new inquiry",
    "Missed-call text-back",
    "Review request",
    "Birthday / anniversary",
  ],
  localsvc: [
    "Missed-call text-back",
    "Booking confirmation + reminders",
    "Google review request",
    "Reactivation — past customers",
  ],
  leadgen: [
    "Lead nurture — new inquiry",
    "Webinar follow-up",
    "Long-term nurture (90-day)",
    "Sales handoff alert",
  ],
};

const FUNNELS: Record<string, string[]> = {
  master: ["Main lead-gen funnel", "Booking / scheduling funnel", "Lead magnet opt-in"],
  summit: ["Main lead-gen funnel", "Booking / scheduling funnel"],
  localsvc: ["Quote-request funnel", "Booking funnel"],
  leadgen: ["Webinar registration", "Lead magnet opt-in", "Survey / quiz funnel"],
};

const FORMS: Record<string, string[]> = {
  master: ["Contact form", "Quote request", "Book a consult", "Get a callback", "Newsletter signup", "Free audit request"],
  summit: ["Contact form", "Quote request", "Newsletter signup"],
  localsvc: ["Quote request", "Book a service", "Get a callback"],
  leadgen: ["Lead magnet download", "Webinar registration", "Free audit request"],
};

const PIPELINES: Record<string, string[]> = {
  master: ["Sales pipeline", "Onboarding pipeline", "Renewal pipeline"],
  summit: ["Sales pipeline", "Onboarding pipeline"],
  localsvc: ["Jobs pipeline", "Estimates pipeline"],
  leadgen: ["Sales pipeline", "Webinar pipeline", "Nurture pipeline"],
};

// Maps an asset-type step to the snapshot collection it draws from.
const ASSET_TABLES: Record<string, Record<string, string[]>> = {
  snapshot_workflows: WORKFLOWS,
  funnel_publish: FUNNELS,
  form_create: FORMS,
  pipeline_setup: PIPELINES,
};

/** "Fetch" the relevant assets of an asset type from a snapshot sub-account. */
export function fetchSnapshotAssets(accountId: string, type: string): string[] {
  const table = ASSET_TABLES[type] ?? WORKFLOWS;
  return table[accountId] ?? table.master;
}

export function snapshotAccountName(id?: string): string {
  return SNAPSHOT_ACCOUNTS.find((a) => a.id === id)?.name ?? "";
}

// An agency has ONE snapshot — the same one feeds every asset step. So we only
// ask which sub-account the first time and remember it, pre-selecting it for
// every later asset step (the agency can still override per step).
const REMEMBER_KEY = "gocsm.onb.snapshot.v1";

export function rememberedSnapshotId(): string {
  try {
    return localStorage.getItem(REMEMBER_KEY) ?? "";
  } catch {
    return "";
  }
}

export function rememberSnapshotId(id: string): void {
  try {
    if (id) localStorage.setItem(REMEMBER_KEY, id);
  } catch {
    /* non-fatal: remembering is a convenience, not a requirement */
  }
}
