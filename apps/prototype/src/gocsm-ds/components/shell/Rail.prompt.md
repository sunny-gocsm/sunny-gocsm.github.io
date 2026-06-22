The standard operator app sidebar — 244px, logo top-left, four nav groups (Insights / Configurations / Resources / HighLevel CRM). Every GoCSM operator surface renders inside this shell; never a bare standalone canvas.

```jsx
<Rail
  logo={<img src="/assets/logo-lockup.svg" alt="GoCSM" height={20} />}
  active="health"
  onNavigate={go}
  groups={[
    { label: "Insights", items: [
      { id: "health", label: "Account Health", icon: "activity" },
      { id: "onboarding", label: "Onboarding", icon: "rocket" },
    ]},
    { label: "Configurations", items: [
      { id: "tracking", label: "Account Tracking", icon: "list-checks" },
    ]},
  ]}
/>
```

The active item uses the interactive blue, never a health-band color. The logo lives here only — and **never** on a client surface. The 3px brand stripe is a separate element above the page content, not inside the rail.
