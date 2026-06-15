Switch for a live binary setting (Auto-balance, Auto-track, role visibility) — distinct from a checkbox, which is for selection. When a setting is enforced, use `locked` (shows a lock glyph) rather than disabling/dimming, which reads as broken.

```jsx
<Toggle on={auto} onChange={setAuto} label="Auto-balance weights" />
<Toggle on locked label="Owner visibility (enforced by plan)" />
```

Controlled via `on` + `onChange(next)`. Never tween the color change — it snaps.
