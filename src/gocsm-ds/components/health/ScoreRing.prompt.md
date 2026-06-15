The donut health-score ring — the agency portfolio score and per-account scores. Rounded-cap arc in the band color with a mono integer in the center. This replaces the removed conic `.gauge` everywhere.

```jsx
<ScoreRing score={48} band="watch" />
<ScoreRing score={82} band="thriving" size={96} />
```

Score is an integer 0–100; pick the `band` to match (the arc and label take the band's strong color). Score numbers may count up at `--d-slow` on first paint, but the band color never tweens. For a label-only signal use `HealthBadge`.
