The pastel band-distribution card — render four in a row on the Health Overview to show how the portfolio splits across the spectrum.

```jsx
<div className="health-dist">
  <HealthTile band="thriving" count={48} pct="34%" />
  <HealthTile band="healthy"  count={61} pct="43%" />
  <HealthTile band="watch"    count={22} pct="15%" />
  <HealthTile band="atrisk"   count={11} pct="8%" />
</div>
```

Wrap the four in a `.health-dist` grid. Counts are mono; keep all four visible together — the distribution *is* the insight.
