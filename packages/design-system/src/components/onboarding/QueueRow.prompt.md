The queue row — the second backbone for operating surfaces (Onboarding Dashboard, future triage). Sort rows by impact × time; each carries one inline action and its intervention memory.

```jsx
<QueueRow
  subject="Tailored Wellbeing — email domain unverified"
  impact="$1.2K"
  blockedBy="client"
  sla="6d / 3d SLA" slaBreach
  memory="Nudged 2d ago — no movement"
  action={<button className="btn btn-primary btn-sm">Send reminder</button>}
/>
```

Owner-aware: `blockedBy="client"` rows offer outreach; `blockedBy="agency"` rows offer **internal** actions only — never client-nudge a row the agency is blocking, and frame the agency's own bottleneck as a factual mirror, never shaming. An action should render an `ActionReceipt` in place (intervention memory). A queue that can't show "did my last action work?" is just a report.
