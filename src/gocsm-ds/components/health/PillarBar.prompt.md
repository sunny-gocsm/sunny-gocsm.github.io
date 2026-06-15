The four-pillar health-weight breakdown — Product Adoption (PAS) / Revenue / Login / Feedback — as a stacked bar + legend. Uses the pillar viz colors, **never** health-band colors.

```jsx
<PillarBar weights={{ pas: 40, revenue: 30, login: 15, feedback: 15 }} />
```

Pillar **weights are agency-configurable** — any weights you show are sample data, never a hardcoded truth. Keep the legend on so the colors are decoded; the segments must sum to ~100.
