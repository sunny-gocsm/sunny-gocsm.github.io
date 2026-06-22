One **Situation**, bundled — the Library card. Shows the problem it solves, what it does, the outcome, and what's included, with an always-visible **state** (Off → Ran once → On · autopilot) and a live **"N accounts match today."** State drives the primary action, in the owner's language.

```jsx
<PlaybookCard
  state="off"
  title="Win back a customer who stopped logging in"
  problem="The silent customer is the one about to churn — quietly."
  does="Watches for 30 days of no logins, then runs a friendly win-back."
  outcome="Bring them back before renewal."
  matchCount={12}
  bundle={[
    { icon: "workflow", title: "1 automation", desc: "pre-built" },
    { kind: "ai", title: "3 drafted emails", desc: "yours to edit" },
    { icon: "bell", title: "3 internal alerts", live: true },
  ]}
  onActivate={run}
/>
```

State → default CTA: `off` → **Run it**, `ranonce` → **Keep it running**, `on` → **Manage**, `paused` → **Resume**. Never "Activate" or "Configure." `matchCount` is the activation hook; `receipts` / `inPlay` show on the `on` state.
