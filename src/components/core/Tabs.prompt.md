The live page tab row — also the Account Health Hub lens switcher (Health / Product Adoption / Revenue / Login / Feedback / Onboarding). Underline-active in brand blue, no zebra, no filled pills.

```jsx
const [tab, setTab] = React.useState("overview");
<Tabs tab={tab} active={tab} onChange={setTab}
  tabs={[{id:"overview",label:"Overview"},{id:"subs",label:"Sub-Accounts"},{id:"config",label:"Configure"}]} />
```

Controlled via `active` + `onChange`. Keep labels short; tabs sit on the page header rule.
