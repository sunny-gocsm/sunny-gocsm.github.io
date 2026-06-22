The one trend-chip format. Direction is encoded by **arrow + color together**, never color alone. Critically: for inverted metrics (churn, cost, dormant accounts, lost revenue) an *increase is bad* — use `bad-up` so it reads red even though the number went up.

```jsx
<Delta value="+2.1%" direction="up" context="vs last quarter" />
<Delta value="+8.0%" direction="bad-up" context="churn" />   {/* red ↑ */}
<Delta value="-$1,200" direction="good-down" />               {/* green ↓ */}
<Delta value="0" direction="flat" />
```

Always set `direction` deliberately by the metric's meaning — never infer good/bad from the sign of the number.
