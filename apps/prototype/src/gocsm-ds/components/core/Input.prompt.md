36px text controls with a blue focus ring. Wrap in `Field` for the label + hint + spacing pattern. The same component renders input, textarea, or select via `as`.

```jsx
<Field label="Account name" hint="Shown to the agency only">
  <Input placeholder="Tailored Wellbeing" />
</Field>

<Field label="SLA tier">
  <Input as="select"><option>Standard</option><option>Priority</option></Input>
</Field>

<Field label="Notes"><Input as="textarea" rows={3} /></Field>
```

Focus always shows the blue ring (never removed). Numbers typed into inputs should still read in the UI font — use mono only for displayed metrics.
