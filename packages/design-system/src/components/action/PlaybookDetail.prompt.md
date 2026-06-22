The full **view-and-customize** panel for one Playbook, laid out as the canonical anatomy: **Situation → What it watches for (Trigger) → What it does (Actions, toggleable + editable) → Who it affects (Proof: match count + drafts + Preview) → How it works (video)**. Owner language throughout; the AI-vs-workflow choice is GoCSM's and appears only as a quiet `watch.via` line.

```jsx
<PlaybookDetail
  state="off"
  title="Win back a customer who stopped logging in"
  problem="…" does="…" outcome="Bring them back before renewal."
  watch={{ summary: "A customer hasn't logged in for 30 days", cadence: "Checks nightly", via: "Runs as an AI watch" }}
  actions={[
    { icon: "bell", title: "Alert my team", desc: "Slack + in-app", on: true, supervised: false, onToggle: fn },
    { icon: "mail", title: "Email the customer", desc: "friendly nudge", on: true, supervised: true, onEdit: fn, onToggle: fn },
  ]}
  proof={{ matchCount: 12, drafts: [{ channel: "Email", icon: "mail", preview: "We noticed you've been away…" }], }}
  onPreview={fn}
  videoLabel="Watch a 2-min walkthrough"
  onRun={run}
/>
```

Per-action `supervised` → "Needs your OK" vs "Automatic". `limits` renders a quiet guardrails line. `video` takes a node (an iframe/poster); omit it and pass `videoLabel` for a play-button placeholder.
