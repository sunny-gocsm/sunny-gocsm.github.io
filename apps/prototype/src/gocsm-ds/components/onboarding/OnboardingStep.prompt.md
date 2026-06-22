The product-wide onboarding step-state row — one visual language across Builder preview, Doer, Dashboard, and the Hub lens. One step has exactly one state.

```jsx
<OnboardingStep state="done" title="Connect calendar" affix="verified" />
<OnboardingStep state="verifying" title="Verify email domain"
  sub="Checking DNS — this can take a few minutes." />
<OnboardingStep state="needs_attention" title="Add business address"
  sub="The address didn't match — re-enter it to continue." />
<OnboardingStep state="locked" title="Publish journey" sub="Complete setup first." />
```

States: `not_started · locked · in_progress · verifying · waiting_on_agency · needs_attention · done · skipped · stalled`. Hard rules: **health-band colors are never used here**; every state pairs color + a distinct glyph (never color-alone); state changes snap (never tween); `stalled` is operator-only and never shown to clients. The `affix` distinguishes auto "verified" from manual "marked done" — stay honest.
