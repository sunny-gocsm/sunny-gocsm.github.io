The Confidence primitive — a pill that declares an AI claim's **basis**. No AI claim is allowed to ship without one. Basis is shown by icon + label (colorblind-safe), never color alone.

```jsx
<ConfTag basis="fact" />
<ConfTag basis="projection" detail="6 days of data" />
<ConfTag basis="guess" detail="confirm before acting" />
```

`fact` = confirmed direct read (no hedge, no detail). `projection` = inferred from limited data (detail required, hedged copy). `guess` = low data — confirm before acting (detail required). Pair with provenance (`.prov-toggle`/`.prov-box`) for any projection/guess. Never render a guess at the same visual weight as a fact.
