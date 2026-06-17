The customer **lifecycle** journey as a horizontal track, with the account's current stage emphasized. Forward stages (`onboarding → activated → established`) read solid; the decline tail (`lapsing → dormant → churned`) reads dashed. Structural cool-slate tones — never the health bands — so it never competes with the health signal. Use it in the Account 360 header to show where an account sits in its journey.

```jsx
<StageProgress stage="established" />
<StageProgress stage="lapsing" />
<StageProgress stage="onboarding" compact />
```

`stage` is the current position. `stages` lets you pass an ordered subset. `compact` shows only the current label (dots for the rest) — good for tight headers; full mode labels every node.
