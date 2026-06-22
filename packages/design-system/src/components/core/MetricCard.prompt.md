The live summary KPI tile. Neutral surface — emphasis comes from the number, the delta chip, and the icon chip, never a saturated colored background (the red-bleed rule). One red element per card, max.

```jsx
<MetricCard
  label="Net revenue retention"
  value="104.2%"
  icon={<TrendIcon />}
  iconTone="pos"
  delta={<Delta value="+2.1%" direction="up" />}
  context="vs last quarter"
/>

<MetricCard label="At-risk MRR" value="$12,480" accent="neg"
  iconTone="neg" delta={<Delta value="+8.0%" direction="bad-up" />} />
```

Pass pre-formatted `value` strings (mono/tabular handled by the class). `accent="neg"` adds the thin left rule — never fill the whole card red. Inverted metrics (churn, cost) use `<Delta direction="bad-up" />` so an increase reads red.
