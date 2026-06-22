The portfolio table behind **Accounts — the book**. Sortable columns, multi-select with select-all, a column chooser, custom cell renderers (drop a `HealthBadge` / `StageBadge` straight into a cell), row click → Account 360, sticky header, empty state. Sorting / selection / column visibility are uncontrolled by default; pass the controlled props to drive them yourself. Numbers go in `align:"right"`, `mono:true` columns.

```jsx
const columns = [
  { key: "name", header: "Account", sortable: true, field: "name" },
  { key: "health", header: "Health", sortable: true,
    sortAccessor: (r) => r.healthScore,
    render: (r) => <HealthBadge band={r.band} label={r.bandLabel} /> },
  { key: "stage", header: "Lifecycle", render: (r) => <StageBadge stage={r.stage} /> },
  { key: "mrr", header: "MRR", sortable: true, align: "right", mono: true,
    render: (r) => `$${r.mrr.toLocaleString()}` },
  { key: "lastLogin", header: "Last login", sortable: true, align: "right", mono: true,
    sortAccessor: (r) => r.lastLoginDays, render: (r) => `${r.lastLoginDays}d ago` },
  { key: "owner", header: "Owner", hideable: true, defaultHidden: true, field: "owner" },
];

<DataTable
  columns={columns}
  rows={accounts}
  getRowId={(r) => r.id}
  selectable
  defaultSort={{ key: "mrr", dir: "desc" }}
  onRowClick={(r) => openAccount360(r.id)}
  title="All accounts"
  toolbar={<FilterChips … />}
  selectionActions={<Button variant="primary">Apply a Playbook</Button>}
/>
```

- **Selection** drives the bulk flow: when rows are selected, `selectionActions` replaces the toolbar (put the "Apply a Playbook" button there) and `onSelectionChange(ids)` fires. Select-all shows an indeterminate state for a partial selection.
- **Sorting** is internal by default (set `sortAccessor` for computed values like a numeric health score or days-since-login). Pass `sort` + `onSortChange` + `manualSort` for server-side.
- **Column chooser** appears automatically for any `hideable` column; `defaultHidden` columns start off.
- Keep currency, counts, and dates in mono right-aligned columns; everything else left.
