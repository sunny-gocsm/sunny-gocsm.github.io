The Liveness primitive — the felt difference between a page you visit and a system that is watching. Replaces passive staleness with active presence.

```jsx
<LiveStatus state="fresh" watchingCount={2162} />
<LiveStatus state="stale" />
<LiveStatus state="error" />
```

States derive from `now − syncedAt`: `fresh` (<5m, green pulse), `recent` (<24h, neutral dot), `stale` (>24h, amber — honest, never hidden), `error` (sync failed, red, actionable copy). The pulse animation runs **only** in fresh (no perpetual motion); reduced-motion makes it a static dot. Never fake `fresh` — show `recent`/`stale` honestly.
