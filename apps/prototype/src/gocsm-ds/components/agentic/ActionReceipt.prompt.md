The Reversible Action primitive — the bridge from advisor to agent. Renders inline where the action was triggered and persists (never an ephemeral toast). The `blastRadius` line is **required** — it's the single line that separates a trusted agent from a feared one.

```jsx
<ActionReceipt
  state="pending"
  title="Setup workflow triggered for Tailored Wellbeing"
  scope="Sends the setup guide to taylor@… and books a check-in."
  blastRadius="Nothing is sent to the account's own clients."
  graceSeconds={5}
  reportBack="GoCSM will report when setup completes"
  onUndo={cancel}
/>
```

Lifecycle: `pending` (grace countdown ≥5s, undoable — the job has not fired) → `sent` (committed, report-back promised) → `stopped` (undone, truly nothing sent). Undo within grace cancels the queued job; never fire-then-compensate. Reduced-motion shows the countdown as text.
