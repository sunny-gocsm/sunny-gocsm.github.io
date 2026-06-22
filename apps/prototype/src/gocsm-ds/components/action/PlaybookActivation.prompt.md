The **contextual activation drawer** — surfaced at the point of need (a live Situation in Today). It shows the **Proof** (who matches, the drafts, Preview), then climbs the ladder: **Off → Run it once (supervised) → "Keep it running?" → On (autopilot)**. Owner language only; always reversible. A focused sheet — for the full editor use `PlaybookDetail`.

```jsx
<PlaybookActivation
  state="off"
  title="Win back a customer who stopped logging in"
  situation="Organize Your Online Biz has gone dark 32 days — renewal in 14."
  proof={{ matchCount: 12, drafts: [{ channel: "Email", icon: "mail", preview: "We noticed you've been away…" }] }}
  onRunOnce={runOnce}
  onPreview={preview}
/>

// after the run:
<PlaybookActivation state="ranonce" ranCount={12} title="…" onAutopilot={turnOn} />
// once on:
<PlaybookActivation state="on" title="…" onTurnOff={turnOff} />
```

`busy` disables the button and shows "Running…". The two-step ladder (run once, *then* autopilot) is deliberate — it lets the owner feel the value once, with a hand on the wheel, before granting unattended action.
