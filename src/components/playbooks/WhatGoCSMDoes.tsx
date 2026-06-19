// Reusable "What GoCSM does" surface.
// Used both as the one-time Fix-it run step and as the actions step inside
// the autopilot setup. Renders the play's actions as channels grouped by
// audience ("Tell your team" / "Reach the client"), each a Toggle row with a
// plain label, audience tag, and (client-facing) "needs your OK" Badge.
//
// Each enabled channel reveals a READ-ONLY message preview (subject + one-line
// snippet for email; first line of body for SMS/internal/task) plus an
// "Edit in HighLevel" action. GoCSM does NOT ship an inline editor here —
// preview only. Real editing happens in HighLevel's own editor.

import { useEffect, useMemo, useState } from "react";
import { Badge, Button, Icon, Toggle } from "@/gocsm-ds";
import { toast } from "sonner";
import type { Playbook } from "@/fixtures/playbooks";

export type ChannelId =
  | "notify-me"
  | "notify-teammate"
  | "slack"
  | "task"
  | "email"
  | "sms";

export type ChannelGroup = "team" | "client";

interface ChannelPreview {
  subject?: string;
  body: string;
}

export interface Channel {
  id: ChannelId;
  group: ChannelGroup;
  label: string;
  icon: string;
  preview: ChannelPreview;
}

const ALL_CHANNELS: Omit<Channel, "preview">[] = [
  { id: "notify-me", group: "team", label: "Notify me", icon: "bell" },
  { id: "notify-teammate", group: "team", label: "Notify a teammate", icon: "user" },
  { id: "slack", group: "team", label: "Post to Slack", icon: "message-square" },
  { id: "task", group: "team", label: "Create a task", icon: "check-square" },
  { id: "email", group: "client", label: "Email the account owner", icon: "mail" },
  { id: "sms", group: "client", label: "SMS the account owner", icon: "smartphone" },
];

// Per-play defaults: sensible "core action ON, the rest OFF".
const DEFAULTS: Record<string, ChannelId[]> = {
  "pb-save-domain":       ["notify-me", "email"],
  "pb-save-a2p":          ["notify-me", "email"],
  "pb-save-integration":  ["notify-me", "email"],
  "pb-payment-failed":    ["notify-me", "email"],
  "pb-no-login":          ["notify-me", "email"],
  "pb-onboarding-stalled":["notify-me", "task"],
  "pb-plan-downgrade":    ["notify-me", "task"],
  "pb-feature-drop":      ["notify-me", "email"],
  "pb-expansion-ready":   ["notify-me", "task"],
};

// Per-play, per-channel previews. Each preview is short, plain English.
// Email = subject + one-line snippet. SMS / internal / task = first line of body.
const PREVIEWS: Record<string, Partial<Record<ChannelId, ChannelPreview>>> = {
  "pb-save-domain": {
    "notify-me":       { body: "Heads up: {account} just disconnected their custom domain — likely leaving signal." },
    "notify-teammate": { body: "@teammate — {account} just disconnected their domain. Can you reach out?" },
    "slack":           { body: "🚨 {account} disconnected their domain (a sticky-setup reverse). Owner alerted." },
    "task":            { body: "Reconnect domain with {account} — white-glove offer, this week." },
    "email":           { subject: "We noticed your domain just disconnected", body: "Hi {first_name} — we saw your custom domain just disconnected. Want us to help reconnect it today?" },
    "sms":             { body: "Hi {first_name} — quick note: your custom domain just disconnected. We can help reconnect — reply YES." },
  },
  "pb-save-a2p": {
    "notify-me":       { body: "{account} just lost A2P registration — SMS is going dark." },
    "notify-teammate": { body: "@teammate — {account} lost A2P. Can you help them re-register?" },
    "slack":           { body: "🚨 {account} lost A2P — SMS paused until re-registration." },
    "task":            { body: "Help {account} re-register A2P — white-glove this week." },
    "email":           { subject: "Your A2P registration lapsed — let's fix it", body: "Hi {first_name} — your A2P registration just lapsed, which means your SMS will stop sending. We can help re-register today." },
    "sms":             { body: "Hi {first_name} — heads up: your A2P just lapsed. We can help re-register — reply YES." },
  },
  "pb-save-integration": {
    "notify-me":       { body: "{account} just removed a sticky integration." },
    "notify-teammate": { body: "@teammate — {account} removed a key integration. Worth a check-in?" },
    "slack":           { body: "{account} removed a sticky integration. Owner alerted." },
    "task":            { body: "Root-cause check with {account} on the removed integration." },
    "email":           { subject: "Did something break with your integration?", body: "Hi {first_name} — we saw you just removed one of your integrations. Want help getting it back in place?" },
    "sms":             { body: "Hi {first_name} — quick check: you just removed a key integration. Anything we can help with?" },
  },
  "pb-payment-failed": {
    "notify-me":       { body: "{account} — payment just failed. Dunning in progress." },
    "notify-teammate": { body: "@teammate — {account}'s payment just failed. Can you flag the owner?" },
    "slack":           { body: "💳 {account} payment failed — dunning started, outbound risk plays paused." },
    "task":            { body: "Dunning follow-up with {account} — confirm card update." },
    "email":           { subject: "Your last payment didn't go through", body: "Hi {first_name} — your last payment didn't go through. Most of the time it's just an expired card." },
    "sms":             { body: "Hi {first_name} — your last payment failed. Update your card here to keep things running." },
  },
  "pb-no-login": {
    "notify-me":       { body: "{account} hasn't logged in for 21+ days." },
    "notify-teammate": { body: "@teammate — can you do a check-in call with {account}? No login for 21+ days." },
    "slack":           { body: "{account} quiet for 21+ days — warm check-in queued." },
    "task":            { body: "Follow-up call with {account} — warm check-in." },
    "email":           { subject: "Haven't seen you in a couple of weeks", body: "Hi {first_name} — noticed it's been a while since you logged in. Anything we can help unblock?" },
    "sms":             { body: "Hi {first_name} — checking in. Anything we can help with this week?" },
  },
  "pb-onboarding-stalled": {
    "notify-me":       { body: "{account} stalled in onboarding past SLA." },
    "notify-teammate": { body: "@teammate — {account} is stuck on a setup step. Can you unblock?" },
    "slack":           { body: "{account} onboarding stalled — 10-min unblock call offered." },
    "task":            { body: "10-min unblock call with {account} — current setup step." },
    "email":           { subject: "Want a hand finishing setup?", body: "Hi {first_name} — looks like setup is stuck. Happy to jump on a 10-minute call to unblock you." },
    "sms":             { body: "Hi {first_name} — want a quick 10-min call to finish setup together?" },
  },
  "pb-plan-downgrade": {
    "notify-me":       { body: "{account} just downgraded or dropped an add-on." },
    "notify-teammate": { body: "@teammate — {account} downgraded. Time for a value-check call?" },
    "slack":           { body: "{account} downgraded — value-check call queued." },
    "task":            { body: "Book value-check call with {account} — surface 3 unused features." },
    "email":           { subject: "Quick value check?", body: "Hi {first_name} — saw the plan change. Want to jump on a quick call so we can make sure you're getting full value?" },
    "sms":             { body: "Hi {first_name} — quick chat this week? Want to make sure you're getting full value." },
  },
  "pb-feature-drop": {
    "notify-me":       { body: "{account} — core feature usage just dropped 30%+." },
    "notify-teammate": { body: "@teammate — {account}'s usage dropped sharply. Worth a nudge?" },
    "slack":           { body: "{account} core feature usage -30% MoM." },
    "task":            { body: "Re-anchor adoption with {account} — share short how-to." },
    "email":           { subject: "A quick how-to to get back on track", body: "Hi {first_name} — noticed usage dropped a bit. Here's a 2-minute how-to to get back into the flow." },
    "sms":             { body: "Hi {first_name} — short how-to coming your way to get back into the flow." },
  },
  "pb-expansion-ready": {
    "notify-me":       { body: "{account} looks expansion-ready — thriving + established." },
    "notify-teammate": { body: "@teammate — {account} is expansion-ready. Time for a roadmap call?" },
    "slack":           { body: "🎉 {account} expansion-ready. Roadmap call queued." },
    "task":            { body: "Roadmap call with {account} — upsell-ready summary attached." },
    "email":           { subject: "You're crushing it — let's plan what's next", body: "Hi {first_name} — you're getting real momentum. Want to jump on a roadmap call to plan what's next?" },
    "sms":             { body: "Hi {first_name} — you're crushing it. Quick roadmap call this week?" },
  },
};

function genericPreview(p: Playbook, id: ChannelId): ChannelPreview {
  const problem = p.problem.replace(/^The /, "the ").replace(/\.$/, "");
  switch (id) {
    case "notify-me":       return { body: `{account} — ${problem}.` };
    case "notify-teammate": return { body: `@teammate — heads up on {account}: ${problem}.` };
    case "slack":           return { body: `Heads up: {account} — ${problem}.` };
    case "task":            return { body: `Follow up with {account} about ${problem}.` };
    case "email":           return { subject: `A quick note from our team`, body: `Hi {first_name} — quick note about ${problem}. Want us to help sort it out?` };
    case "sms":             return { body: `Hi {first_name} — quick note about ${problem}. Reply YES if we can help.` };
  }
}

export function getChannelsForPlay(p: Playbook): Channel[] {
  const byId = PREVIEWS[p.id] ?? {};
  return ALL_CHANNELS.map((c) => ({
    ...c,
    preview: byId[c.id] ?? genericPreview(p, c.id),
  }));
}

export function defaultEnabledFor(p: Playbook): Record<ChannelId, boolean> {
  const on = new Set<ChannelId>(DEFAULTS[p.id] ?? ["notify-me"]);
  const out = {} as Record<ChannelId, boolean>;
  ALL_CHANNELS.forEach((c) => (out[c.id] = on.has(c.id)));
  return out;
}

interface Props {
  playbook: Playbook;
  /** Lifts the labels of currently-enabled channels (used by the autopilot summary). */
  onEnabledChange?: (labels: string[]) => void;
  /** Lifts the ids of channels the owner edited in HighLevel (used by the summary). */
  onEditedChange?: (editedIds: ChannelId[]) => void;
}

export function WhatGoCSMDoes({ playbook, onEnabledChange, onEditedChange }: Props) {
  const channels = useMemo(() => getChannelsForPlay(playbook), [playbook]);
  const [enabled, setEnabled] = useState<Record<ChannelId, boolean>>(() => defaultEnabledFor(playbook));
  // Channels whose message the owner has "edited in HighLevel" (simulated return).
  const [edited, setEdited] = useState<Record<ChannelId, boolean>>(() => ({} as Record<ChannelId, boolean>));
  // Which row currently has the handoff panel open (only one at a time).
  const [handoffOpen, setHandoffOpen] = useState<ChannelId | null>(null);

  // Re-init defaults when the playbook changes (e.g. picking a different play).
  useEffect(() => {
    setEnabled(defaultEnabledFor(playbook));
    setEdited({} as Record<ChannelId, boolean>);
    setHandoffOpen(null);
  }, [playbook]);

  useEffect(() => {
    const labels = channels.filter((c) => enabled[c.id]).map((c) => c.label);
    onEnabledChange?.(labels);
  }, [enabled, channels, onEnabledChange]);

  useEffect(() => {
    const ids = channels.filter((c) => edited[c.id]).map((c) => c.id);
    onEditedChange?.(ids);
  }, [edited, channels, onEditedChange]);

  const team = channels.filter((c) => c.group === "team");
  const client = channels.filter((c) => c.group === "client");

  // What HighLevel editor this channel hands off to. Email/SMS map to HL's
  // "Send Email" / "Send SMS" workflow actions. Other channels hand off to
  // their nearest HL equivalent.
  const editorName = (c: Channel): string => {
    switch (c.id) {
      case "email": return "email";
      case "sms": return "SMS";
      case "slack": return "Slack message";
      case "task": return "task template";
      case "notify-me":
      case "notify-teammate":
      default: return "internal notification";
    }
  };

  const openInHighLevel = (c: Channel) => {
    toast(`Launching HighLevel's ${editorName(c)} editor`, {
      description: "In production this carries your session to HighLevel. (Simulated here.)",
      duration: 2000,
    });
  };

  const markEdited = (c: Channel) => {
    setEdited((p) => ({ ...p, [c.id]: true }));
    setHandoffOpen(null);
    toast.success(`${c.label} — edited in HighLevel`, {
      description: "Your edits live in HighLevel and will be used on the next run.",
      duration: 2000,
    });
  };

  const renderHandoff = (c: Channel) => {
    const isClient = c.group === "client";
    const editor = editorName(c);
    return (
      <div
        role="dialog"
        aria-label={`Open HighLevel ${editor} editor`}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--s-3)",
          padding: "var(--s-3)",
          borderRadius: "var(--r-md)",
          background: "var(--surface)",
          border: "1px solid var(--info-7, var(--blue-7))",
          boxShadow: "var(--elev-2, 0 4px 16px rgba(0,0,0,0.08))",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "var(--s-2)" }}>
          <span className="icon-chip info" aria-hidden>
            <Icon name="external-link" />
          </span>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
            <strong style={{ font: "var(--t-body)", color: "var(--text)", fontWeight: 600 }}>
              Opening HighLevel's {editor} editor for {playbook.title}.
            </strong>
            <span style={{ font: "var(--t-meta)", color: "var(--text-3, var(--text))", fontStyle: "italic" }}>
              In production this opens HighLevel's own editor (the Send {c.id === "sms" ? "SMS" : c.id === "email" ? "Email" : editor} action) carrying your session; your edits save in HighLevel.
            </span>
          </div>
          {isClient ? <Badge variant="warn" dot={false}>needs your OK</Badge> : null}
        </div>

        {/* Read-only preview of what they're about to edit */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--s-2)",
            padding: "var(--s-3)",
            borderRadius: "var(--r-sm)",
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
          }}
        >
          <span style={{ font: "var(--t-meta)", textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--text-3, var(--text))" }}>
            Current message · read-only
          </span>
          {c.preview.subject ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ font: "var(--t-meta)", color: "var(--text-3, var(--text))" }}>Subject</span>
              <span style={{ font: "var(--t-body-sm)", fontWeight: 600, color: "var(--text)" }}>
                {c.preview.subject}
              </span>
            </div>
          ) : null}
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ font: "var(--t-meta)", color: "var(--text-3, var(--text))" }}>Body</span>
            <span style={{ font: "var(--t-body-sm)", color: "var(--text-2, var(--text))", whiteSpace: "pre-wrap" }}>
              {c.preview.body}
            </span>
          </div>
        </div>

        {isClient ? (
          <p style={{ margin: 0, font: "var(--t-meta)", color: "var(--text-2, var(--text))" }}>
            This won't send to the client until you publish / hit Run.
          </p>
        ) : null}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "var(--s-2)" }}>
          <Button variant="ghost" size="sm" onClick={() => setHandoffOpen(null)}>
            Cancel
          </Button>
          <div style={{ display: "flex", gap: "var(--s-2)" }}>
            <Button variant="ghost" size="sm" onClick={() => markEdited(c)} icon={<Icon name="check" />}>
              Mark as edited (simulated)
            </Button>
            <Button variant="primary" size="sm" onClick={() => openInHighLevel(c)} icon={<Icon name="external-link" />}>
              Open the HighLevel editor
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderRow = (c: Channel) => {
    const on = !!enabled[c.id];
    const wasEdited = !!edited[c.id];
    const handoff = handoffOpen === c.id;
    return (
      <li
        key={c.id}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--s-2)",
          padding: "var(--s-3)",
          borderRadius: "var(--r-md)",
          background: "var(--surface-2)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "var(--s-2)" }}>
          <Toggle on={on} onChange={(next) => setEnabled((p) => ({ ...p, [c.id]: next }))} />
          <Icon name={c.icon} />
          <span style={{ flex: 1, font: "var(--t-body)", color: "var(--text)" }}>{c.label}</span>
          {wasEdited ? (
            <Badge variant="pos" dot={false}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                <Icon name="check" /> edited in HighLevel
              </span>
            </Badge>
          ) : null}
          <Badge variant="neutral" dot={false}>{c.group === "client" ? "client" : "internal"}</Badge>
          {c.group === "client" ? <Badge variant="warn" dot={false}>needs your OK</Badge> : null}
        </div>

        {on && !handoff ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--s-2)",
              padding: "var(--s-3)",
              borderRadius: "var(--r-sm)",
              background: "var(--surface)",
              border: "1px solid var(--border)",
            }}
          >
            {c.preview.subject ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ font: "var(--t-meta)", textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--text-3, var(--text))" }}>
                  Subject
                </span>
                <span style={{ font: "var(--t-body-sm)", fontWeight: 600, color: "var(--text)" }}>
                  {c.preview.subject}
                </span>
              </div>
            ) : null}
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ font: "var(--t-meta)", textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--text-3, var(--text))" }}>
                {c.preview.subject ? "Snippet" : "First line"}
              </span>
              <span style={{ font: "var(--t-body-sm)", color: "var(--text-2, var(--text))" }}>
                {c.preview.body}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setHandoffOpen(c.id)}
                icon={<Icon name="external-link" />}
              >
                Edit in HighLevel
              </Button>
            </div>
          </div>
        ) : null}

        {on && handoff ? renderHandoff(c) : null}
      </li>

    );
  };

  const Section = ({ title, items }: { title: string; items: Channel[] }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-2)" }}>
      <span
        style={{
          font: "var(--t-meta)",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          color: "var(--text-3, var(--text))",
        }}
      >
        {title}
      </span>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "var(--s-2)" }}>
        {items.map(renderRow)}
      </ul>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-4)" }}>
      <p style={{ margin: 0, font: "var(--t-body-sm)", color: "var(--text-2, var(--text))" }}>
        Everything's off except what this play needs. Switch on anything else, and edit any message in HighLevel.
      </p>
      <Section title="Tell your team" items={team} />
      <Section title="Reach the client" items={client} />
    </div>
  );
}
