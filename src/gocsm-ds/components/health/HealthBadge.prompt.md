The single source of customer-health band rendering — soft tint + ink text, with a leading dot. The locked spectrum is **Thriving (green) · Healthy (blue) · Watch (amber) · At-Risk (red)**; 'Steady' is deprecated.

```jsx
<HealthBadge band="thriving" />
<HealthBadge band="atrisk" />
<HealthBadge band="watch" label="Needs review" />
```

Healthy is blue (not a second green) on purpose — blue-vs-green separates instantly in dense lists. Never use a band color for a non-health purpose, and never use a status/interactive color as a band. For a numeric score use `ScoreRing`.
