The customer **lifecycle** stage as an inline chip — a structural, cool-slate axis kept deliberately distinct from the four health bands. The glyph carries the meaning; color is a quiet reinforcement; Health stays the only vivid signal. This is NOT a health badge — use `HealthBadge` for the four-band customer-health signal.

```jsx
<StageBadge stage="onboarding" />
<StageBadge stage="established" />
<StageBadge stage="lapsing" />
<StageBadge stage="dormant" />
<StageBadge stage="churned" />
<StageBadge stage="activated" reactivated />
```

The journey: `onboarding` → `activated` → `established`, then the decline tail `lapsing` → `dormant` → `churned`. Tone deepens forward and fades on decline; `churned` is struck through and `dormant` muted. `reactivated` adds a transient win affix for an account that resumed activity — a badge, never a persistent stage color. Sits cleanly beside a `HealthBadge` in a table row without the two color systems competing.
