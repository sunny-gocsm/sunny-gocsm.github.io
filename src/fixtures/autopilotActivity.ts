// Autopilot activity fixtures — what GoCSM (via HighLevel) sent on behalf of
// the owner overnight, and what's waiting for their OK when oversight is
// heavier than the default "send automatically" mode.
//
// Mock data only. Approval of CONTENT happens once in HighLevel at setup; this
// is the ongoing transparency + reversal surface.

export interface AutopilotEmail {
  id: string;
  accountId: string;
  accountName: string;
  playbookId: string;
  subject: string;
  snippet: string;
  whenLabel: string;
}

// Sent overnight by autopilot — always visible in the Today recap.
export const autopilotSentEmails: AutopilotEmail[] = [
  {
    id: "ae-1",
    accountId: "acc-bright-dental",
    accountName: "Bright Dental",
    playbookId: "pb-save-domain",
    subject: "Quick fix for your domain",
    snippet: "Hi Sara — looks like your domain disconnected last night. Here's the 2-minute fix…",
    whenLabel: "2:14 AM",
  },
  {
    id: "ae-2",
    accountId: "acc-northgate-law",
    accountName: "Northgate Law",
    playbookId: "pb-no-login",
    subject: "Haven't seen you in a bit",
    snippet: "It's been a few weeks — want a quick walkthrough of what's new?",
    whenLabel: "3:02 AM",
  },
  {
    id: "ae-3",
    accountId: "acc-pivotal-fitness",
    accountName: "Pivotal Fitness",
    playbookId: "pb-payment-failed",
    subject: "Your card didn't go through",
    snippet: "We tried twice — update your card in one click here…",
    whenLabel: "3:48 AM",
  },
  {
    id: "ae-4",
    accountId: "acc-mason-realty",
    accountName: "Mason Realty",
    playbookId: "pb-no-login",
    subject: "Anything we can help unstick?",
    snippet: "Saw you haven't logged in lately — happy to jump on a quick call.",
    whenLabel: "4:11 AM",
  },
];

// Pending — only ever shown for plays that picked "Ease in" or "Review every
// send" oversight. Empty when every on-autopilot play is "Send automatically".
export const autopilotPendingEmails: AutopilotEmail[] = [
  {
    id: "pe-1",
    accountId: "acc-cedar-clinic",
    accountName: "Cedar Clinic",
    playbookId: "pb-no-login",
    subject: "Haven't seen you in a bit",
    snippet: "It's been a few weeks — want a quick walkthrough of what's new?",
    whenLabel: "Queued · 6:02 AM",
  },
  {
    id: "pe-2",
    accountId: "acc-harbor-co",
    accountName: "Harbor & Co.",
    playbookId: "pb-no-login",
    subject: "Haven't seen you in a bit",
    snippet: "It's been a few weeks — want a quick walkthrough of what's new?",
    whenLabel: "Queued · 6:02 AM",
  },
  {
    id: "pe-3",
    accountId: "acc-orchid-spa",
    accountName: "Orchid Spa",
    playbookId: "pb-save-domain",
    subject: "Quick fix for your domain",
    snippet: "Hi — looks like your domain disconnected. Here's the 2-minute fix…",
    whenLabel: "Queued · 6:14 AM",
  },
];

export function sentEmailsForOnPlaybooks(onIds: string[]): AutopilotEmail[] {
  const set = new Set(onIds);
  return autopilotSentEmails.filter((e) => set.has(e.playbookId));
}

export function pendingEmailsForPlaybooks(
  playbookIds: string[],
): AutopilotEmail[] {
  const set = new Set(playbookIds);
  return autopilotPendingEmails.filter((e) => set.has(e.playbookId));
}
