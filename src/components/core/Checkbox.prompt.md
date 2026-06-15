16px checkbox, blue fill with a white check when on. Pass `label` for the inline-label pattern, or render bare for table/row use.

```jsx
<Checkbox label="Auto-track new sub-accounts" defaultChecked />
<Checkbox checked={sel} onChange={e => setSel(e.target.checked)} />
```

For a binary on/off setting (Auto-balance, role visibility) use `Toggle` instead — a checkbox is for selection, a toggle is for a live setting.
