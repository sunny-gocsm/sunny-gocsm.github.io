Tier 1 of the Insight Hierarchy — the "why". Place two side by side in a `.why-grid`: a Risk column and an Opportunity column. The header rule carries the semantic color; the body stays neutral. **Every driver must carry a prescriptive `action` pointer** — a concrete next step, never vague advice.

```jsx
<div className="why-grid">
  <WhyCard kind="risk" drivers={[
    { title: "No login in 14 days", desc: "Owner hasn't returned since the trial ended.",
      severity: "high", action: "Send re-engagement workflow" },
    { title: "Setup 40% complete", desc: "Email domain and calendar still unverified.",
      severity: "med", action: "Open the setup checklist" },
  ]} />
  <WhyCard kind="opp" drivers={[
    { title: "High feedback score", desc: "Last NPS was 9 — a referral ask would land.",
      severity: "pos", action: "Request a testimonial" },
  ]} />
</div>
```

Drivers are plain language; the AI tag signals AI authorship. Drill-down beyond this is the `.impact` accordion (one nested level max).
