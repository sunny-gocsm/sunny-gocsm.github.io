import { useMemo, useState } from "react";
import {
  Badge,
  Card,
  Button,
  Icon,
  Mono,
  OnboardingStep,
  StageProgress,
  ConfTag,
} from "@gocsm/design-system";
import type { Account, AccountOnboarding } from "@/fixtures";

// The standard 8-step journey shape. Real per-step states are derived from
// `steps_done`, `current_step`, and `current_step_state`.
const STANDARD_STEPS: { key: string; title: string; why: string; agencyOnly?: boolean }[] = [
  { key: "Account",   title: "Account created",       why: "We need a workspace before anything else." },
  { key: "Domain",    title: "Connect your domain",   why: "So emails and pages come from your brand." },
  { key: "Phone",     title: "Add a phone number",    why: "Lets you text and call from inside the app." },
  { key: "A2P",       title: "Register for texting",  why: "Carriers need to approve you before SMS goes out." },
  { key: "Imports",   title: "Bring in your contacts", why: "Your list is the foundation of everything else." },
  { key: "Funnel",    title: "Publish your first funnel", why: "Gives leads a place to land." },
  { key: "Workflow",  title: "Turn on a workflow",     why: "Automates the first follow-up so nothing slips." },
  { key: "Launch",    title: "Go live",                why: "You're ready to send real campaigns." },
];

type StepState =
  | "not_started"
  | "locked"
  | "in_progress"
  | "verifying"
  | "waiting_on_agency"
  | "needs_attention"
  | "done"
  | "skipped"
  | "stalled";

function deriveSteps(onb: AccountOnboarding) {
  const currentIdx = (() => {
    const i = STANDARD_STEPS.findIndex((s) => s.key === onb.current_step || s.title === onb.current_step);
    if (i >= 0) return i;
    return Math.min(onb.steps_done, STANDARD_STEPS.length - 1);
  })();
  return STANDARD_STEPS.map((s, i) => {
    let state: StepState;
    if (i < currentIdx) state = "done";
    else if (i === currentIdx) state = onb.current_step_state as StepState;
    else state = "not_started";
    return { ...s, state, isCurrent: i === currentIdx };
  });
}

const AGENCY_SUB: Partial<Record<StepState, string>> = {
  in_progress: "Owner is working through this step.",
  verifying: "We're checking the result — siblings continue.",
  waiting_on_agency: "Action required from the agency.",
  needs_attention: "Stuck — needs a nudge.",
  done: "Verified complete.",
  skipped: "Marked not applicable.",
  not_started: "Not started yet.",
  locked: "Unlocks after the previous step.",
};

const CLIENT_SUB: Partial<Record<StepState, string>> = {
  in_progress: "You're on this one now.",
  verifying: "We're checking — you can move on to the next one.",
  waiting_on_agency: "Your account manager is finishing this for you.",
  needs_attention: "A small tweak and you're through — open the step.",
  done: "All set.",
  skipped: "Skipped — doesn't apply to you.",
  not_started: "Coming up next.",
  locked: "Unlocks once the one above is done.",
};

const AGENCY_STAGES = [
  "onboarding",
  "activated",
  "established",
  "lapsing",
  "dormant",
  "churned",
] as const;

export function OnboardingTab({ account }: { account: Account }) {
  const onb = account.onboarding;
  const steps = useMemo(() => deriveSteps(onb), [onb]);
  const slaBreached = onb.days_on_current_step > onb.sla_days;
  const slaDue = !slaBreached && onb.days_on_current_step >= onb.sla_days - 1;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-5)" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) minmax(280px, 380px)",
          gap: "var(--s-5)",
          alignItems: "flex-start",
        }}
      >
        <AgencyView
          account={account}
          steps={steps}
          slaBreached={slaBreached}
          slaDue={slaDue}
        />
        <ClientDoerPreview account={account} steps={steps} />
      </div>
    </div>
  );
}

// ============================================================
// AGENCY VIEW — factual, dense, includes stalled flag
// ============================================================

function AgencyView({
  account,
  steps,
  slaBreached,
  slaDue,
}: {
  account: Account;
  steps: ReturnType<typeof deriveSteps>;
  slaBreached: boolean;
  slaDue: boolean;
}) {
  const onb = account.onboarding;
  const current = steps.find((s) => s.isCurrent);

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: "var(--s-4)" }}>
      <header style={{ display: "flex", flexDirection: "column", gap: "var(--s-2)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--s-2)", flexWrap: "wrap" }}>
          <h3 style={{ font: "var(--t-h3)", margin: 0 }}>Onboarding journey</h3>
          <Badge variant="neutral" dot={false}>
            {onb.journeyName} · {onb.journeyVersion}
          </Badge>
          {onb.stalled ? (
            <Badge variant="danger" dot>
              Stalled · operator only
            </Badge>
          ) : null}
        </div>
        <p style={{ font: "var(--t-body)", color: "var(--text-3, var(--text))", margin: 0 }}>
          The agency view of where this account is in setup. Factual, full detail.
        </p>
      </header>

      {/* Progress + metrics */}
      <Card padded>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-3)" }}>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              gap: "var(--s-3)",
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", alignItems: "baseline", gap: "var(--s-2)" }}>
              <span style={{ font: "var(--t-h2)" }}>
                <Mono>{onb.pct_complete}%</Mono>
              </span>
              <span style={{ font: "var(--t-meta)", color: "var(--text-3, var(--text))" }}>
                <Mono>{onb.steps_done}</Mono>/<Mono>{onb.steps_total}</Mono> steps · started{" "}
                <Mono>{onb.journey_started_days_ago}d</Mono> ago
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--s-2)", flexWrap: "wrap" }}>
              {onb.blocked_by ? (
                <Badge variant={onb.blocked_by === "client" ? "warn" : "blue"} dot>
                  Blocked by {onb.blocked_by}
                </Badge>
              ) : null}
              <Badge
                variant={slaBreached ? "danger" : slaDue ? "warn" : "pos"}
                dot
                title="Time on current step vs SLA"
              >
                SLA <Mono>{onb.days_on_current_step}d</Mono>/<Mono>{onb.sla_days}d</Mono>
                {slaBreached ? " · breached" : slaDue ? " · due" : " · on track"}
              </Badge>
            </div>
          </div>

          {/* Progress bar */}
          <div
            role="img"
            aria-label={`Onboarding ${onb.pct_complete}% complete`}
            style={{
              height: 8,
              borderRadius: 4,
              background: "var(--surface-2)",
              overflow: "hidden",
            }}
          >
            <span
              style={{
                display: "block",
                width: `${onb.pct_complete}%`,
                height: "100%",
                background: slaBreached ? "var(--viz-3)" : "var(--viz-2)",
              }}
            />
          </div>

          {current ? (
            <div style={{ font: "var(--t-meta)", color: "var(--text-3, var(--text))" }}>
              Current step: <strong style={{ color: "var(--text)" }}>{current.title}</strong> ·{" "}
              <Mono>{onb.days_on_current_step}d</Mono> on step
            </div>
          ) : null}

          <StageProgress stage={account.lifecycle.stage} stages={[...AGENCY_STAGES]} />
        </div>
      </Card>

      {/* Last intervention */}
      {onb.last_intervention ? (
        <Card padded>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-1)" }}>
            <span style={{ font: "var(--t-meta)", textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--text-3, var(--text))" }}>
              Last intervention
            </span>
            <div style={{ font: "var(--t-body)" }}>
              <Badge variant="blue" dot={false}>{onb.last_intervention.type}</Badge>
              <span style={{ marginInline: "var(--s-2)" }}>·</span>
              <Mono>{onb.last_intervention.days_ago}d</Mono> ago
              <span style={{ marginInline: "var(--s-2)" }}>·</span>
              <span style={{ color: "var(--text-3, var(--text))" }}>
                outcome: <strong style={{ color: "var(--text)" }}>{onb.last_intervention.outcome}</strong>
              </span>
            </div>
          </div>
        </Card>
      ) : null}

      {/* Step list */}
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-2)" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <h4 style={{ font: "var(--t-h4)", margin: 0 }}>Steps</h4>
          <ConfTag basis="fact" />
        </div>
        <Card padded>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-1)" }}>
            {steps.map((s) => (
              <OnboardingStep
                key={s.key}
                state={s.state}
                title={s.title}
                sub={AGENCY_SUB[s.state] ?? ""}
                affix={
                  s.state === "done"
                    ? account.onboarding.completionSource === "agency_verified"
                      ? "agency verified"
                      : account.onboarding.completionSource === "manual"
                      ? "marked done"
                      : "verified"
                    : undefined
                }
              />
            ))}
          </div>
        </Card>
      </div>
    </section>
  );
}

// ============================================================
// CLIENT DOER PREVIEW — calm, blame-free, no GoCSM brand
// ============================================================

function ClientDoerPreview({
  account,
  steps,
}: {
  account: Account;
  steps: ReturnType<typeof deriveSteps>;
}) {
  const onb = account.onboarding;
  const current = steps.find((s) => s.isCurrent) ?? steps[0];
  const [doneOverride, setDoneOverride] = useState<Record<string, boolean>>({});

  const isDone = (key: string, state: StepState) => state === "done" || !!doneOverride[key];
  const doneSteps = steps.filter((s) => isDone(s.key, s.state));
  const totalSteps = steps.length;
  const donePct = Math.round((doneSteps.length / totalSteps) * 100);

  // Doer carries the agency accent only — no health-band colors.
  const accent = "var(--accent, var(--brand, #1f6fd6))";

  return (
    <aside
      aria-label="Client Doer preview"
      style={{
        position: "sticky",
        top: "var(--s-4)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--s-2)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--s-2)" }}>
        <span
          style={{
            font: "var(--t-meta)",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            color: "var(--text-3, var(--text))",
          }}
        >
          Client preview · Doer
        </span>
        <Badge variant="neutral" dot={false} title="What the client sees in their portal">
          Their view
        </Badge>
      </div>

      <div
        style={{
          borderRadius: 14,
          border: "1px solid var(--border)",
          background: "var(--surface)",
          padding: "var(--s-5)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--s-4)",
          // No GoCSM brand on client surface — neutral chrome.
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-1)" }}>
          <h4 style={{ font: "var(--t-h4)", margin: 0 }}>Your setup checklist</h4>
          <p style={{ font: "var(--t-body)", color: "var(--text-3, var(--text))", margin: 0 }}>
            A few things to set up so {account.identity.name} is ready to go.
          </p>
        </div>

        {/* Progress */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-1)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", font: "var(--t-meta)", color: "var(--text-3, var(--text))" }}>
            <span>
              <Mono>{doneSteps.length}</Mono> of <Mono>{totalSteps}</Mono> done
            </span>
            <span><Mono>{donePct}%</Mono></span>
          </div>
          <div
            role="img"
            aria-label={`${donePct} percent complete`}
            style={{ height: 6, borderRadius: 3, background: "var(--surface-2)", overflow: "hidden" }}
          >
            <span
              style={{
                display: "block",
                width: `${donePct}%`,
                height: "100%",
                background: accent,
              }}
            />
          </div>
        </div>

        {/* Current step hero */}
        {current && current.state !== "done" ? (
          <div
            style={{
              borderRadius: 10,
              border: `1px solid ${accent}`,
              padding: "var(--s-4)",
              display: "flex",
              flexDirection: "column",
              gap: "var(--s-2)",
              background: "var(--surface-2)",
            }}
          >
            <span style={{ font: "var(--t-meta)", color: "var(--text-3, var(--text))", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Up next
            </span>
            <div style={{ font: "var(--t-h4)" }}>{current.title}</div>
            <p style={{ font: "var(--t-body)", color: "var(--text-2, var(--text))", margin: 0 }}>
              {current.why}
            </p>
            {current.state === "verifying" ? (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <ConfTag basis="projection" detail="we're checking" />
                <span style={{ font: "var(--t-meta)", color: "var(--text-3, var(--text))" }}>
                  You can keep going while we confirm.
                </span>
              </div>
            ) : current.state === "waiting_on_agency" ? (
              <span style={{ font: "var(--t-meta)", color: "var(--text-3, var(--text))" }}>
                Your account manager is wrapping this up for you.
              </span>
            ) : null}
            <div style={{ display: "flex", gap: "var(--s-2)", alignItems: "center", flexWrap: "wrap" }}>
              <Button variant="primary" size="sm">
                Take me there <Icon name="arrow-right" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDoneOverride((d) => ({ ...d, [current.key]: true }))}
              >
                I've completed this
              </Button>
            </div>
          </div>
        ) : (
          <div
            style={{
              borderRadius: 10,
              border: "1px solid var(--border)",
              padding: "var(--s-4)",
              background: "var(--surface-2)",
              font: "var(--t-body)",
            }}
          >
            You're all set — nice work.
          </div>
        )}

        {/* Done group */}
        {doneSteps.length ? (
          <details>
            <summary
              style={{
                cursor: "pointer",
                font: "var(--t-meta)",
                color: "var(--text-3, var(--text))",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              Done · <Mono>{doneSteps.length}</Mono>
            </summary>
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: "var(--s-2) 0 0",
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              {doneSteps.map((s) => (
                <li
                  key={s.key}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    font: "var(--t-body)",
                    color: "var(--text-2, var(--text))",
                  }}
                >
                  <span aria-hidden style={{ color: accent }}>
                    <Icon name="check" />
                  </span>
                  <span>{s.title}</span>
                </li>
              ))}
            </ul>
          </details>
        ) : null}

        {/* Upcoming, no jargon */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span
            style={{
              font: "var(--t-meta)",
              color: "var(--text-3, var(--text))",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            Coming up
          </span>
          {steps
            .filter((s) => !isDone(s.key, s.state) && !s.isCurrent)
            .slice(0, 3)
            .map((s) => (
              <div
                key={s.key}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                  padding: "var(--s-2) 0",
                  borderTop: "1px solid var(--border)",
                }}
              >
                <span style={{ font: "var(--t-body)" }}>{s.title}</span>
                <span style={{ font: "var(--t-meta)", color: "var(--text-3, var(--text))" }}>
                  {CLIENT_SUB[s.state] ?? ""}
                </span>
              </div>
            ))}
        </div>
      </div>

      <span style={{ font: "var(--t-meta)", color: "var(--text-3, var(--text))" }}>
        Faithful preview · production widget ships from the Onboarding project. Operator-only
        signals (like “stalled”) never appear here.
        {onb.stalled ? " (Stalled flag hidden from client.)" : ""}
      </span>
    </aside>
  );
}
