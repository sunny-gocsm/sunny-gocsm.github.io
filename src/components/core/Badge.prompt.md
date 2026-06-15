Compact status pill for non-health state (synced, pending, draft, AI-authored). For the four-band customer-health signal use `HealthBadge` instead — never overload a badge with band colors.

```jsx
<Badge variant="pos">Synced</Badge>
<Badge variant="warn">Pending</Badge>
<Badge variant="ai" dot={false}>AI draft</Badge>
```

Variants: `neutral` · `blue` · `pos` (success/green) · `warn` (amber) · `danger` (red) · `ai` (indigo). Height 22–24px, pill radius. `dot={false}` hides the leading status dot.
