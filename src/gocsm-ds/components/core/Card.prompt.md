Neutral in-flow surface for grouping content. Resting elevation only — never use sheet shadows on an in-flow card (those are for floating panels). Content never touches the edge; default padding is on.

```jsx
<Card>
  <div className="t-subheading">Portfolio health</div>
  <p className="t-body-sm">142 sub-accounts tracked.</p>
</Card>

<Card hover>Clickable card with hover elevation</Card>
```

Props: `hover` (adds hover elevation + pointer), `padded` (default true; set false to control padding yourself). For the summary-metric tile pattern use `MetricCard`.
