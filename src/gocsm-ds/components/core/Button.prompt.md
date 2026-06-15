Primary interactive control — use for any clickable command; the `primary` variant is the page's single most important action.

```jsx
<Button variant="primary" icon={<PlusIcon />}>New journey</Button>
<Button variant="secondary">Cancel</Button>
<Button variant="ai" icon={<SparkIcon />}>Ask AI</Button>
<Button variant="danger" size="sm">Stop tracking</Button>
```

Variants: `primary` (blue CTA gradient — one per view), `secondary` (neutral surface + border), `ghost` (text-only), `danger` (destructive red), `ai` (indigo, AI-authored actions ONLY). Sizes: `sm` 28px · `md` 36px · `lg` 44px. Pass outline icons (16px, 1.75 stroke, currentColor) via `icon` / `iconRight`. Never use the AI variant on non-AI actions; never use health-band colors on a button.
