import { Button, Icon } from "@gocsm/design-system";
import type { Playbook } from "@/fixtures/playbooks";

const ACTION_META: Record<string, { label: string; icon: string }> = {
  "customer-email": { label: "Customer email", icon: "mail" },
  "internal-email": { label: "Internal team email", icon: "users" },
  slack: { label: "Slack message", icon: "message-square" },
  task: { label: "Task", icon: "check-square" },
};

interface Props {
  playbook: Playbook;
  ctaLabel: string;
  onCta: () => void;
  onBack?: () => void;
  mode?: "onetime" | "autopilot";
  scopeLabel?: string;
}


export function HowThisPlayWorks({
  playbook,
  ctaLabel,
  onCta,
  onBack,
  mode = "autopilot",
  scopeLabel,
}: Props) {

  // HighLevel is setup-only. The user turns on the steps and checks the
  // messages here; the run (one-time) or publish (autopilot) happens back in
  // GoCSM after they confirm setup — so it is NOT a HighLevel step.
  const steps = [
    "Turn on the steps you want",
    "Check the messages",
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-4)" }}>
      {/* Explainer video — only when one is actually recorded. We deliberately
          render nothing (not an empty "coming soon" box) when there's no video,
          so the play title and "What GoCSM will send" lead the panel instead of
          a placeholder eating the top third of the drawer. */}
      {playbook.videoUrl ? (
        <div
          style={{
            borderRadius: "var(--r-md)",
            overflow: "hidden",
            background: "#000",
          }}
        >
          <video
            src={playbook.videoUrl}
            poster={playbook.videoPoster}
            controls
            playsInline
            preload="metadata"
            style={{
              width: "100%",
              display: "block",
              aspectRatio: "16 / 9",
            }}
          />
        </div>
      ) : null}

      {/* Title + plain summary */}
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-2)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--s-2)" }}>
          <span className="icon-chip info" aria-hidden>
            <Icon name={playbook.icon} />
          </span>
          <strong style={{ font: "var(--t-h4, var(--t-body))", fontWeight: 600 }}>
            {playbook.title}
          </strong>
        </div>
        <p style={{ margin: 0, font: "var(--t-body)", color: "var(--text-2, var(--text))" }}>
          {playbook.does}
        </p>
        {scopeLabel ? (
          <span style={{ font: "var(--t-meta)", color: "var(--text-3, var(--text))" }}>
            {scopeLabel}
          </span>
        ) : null}

      </div>

      {/* What GoCSM will send — reviewable action + template peeks */}
      {playbook.actions.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-2)" }}>
          <span style={{ font: "var(--t-meta)", fontWeight: 600, color: "var(--text)" }}>
            What GoCSM will send
          </span>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-2)" }}>
            {playbook.actions.map((a, i) => {
              const meta = ACTION_META[a.type] ?? { label: a.type, icon: "circle" };
              const peek = a.subject ?? a.preview;
              return (
                <details
                  key={i}
                  className="action-peek"
                  style={{
                    border: "1px solid var(--border-soft, var(--border))",
                    borderRadius: "var(--r-md)",
                    background: "var(--surface)",
                    padding: "var(--s-2) var(--s-3)",
                  }}
                >
                  <summary
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "var(--s-2)",
                      cursor: "pointer",
                      listStyle: "none",
                    }}
                  >
                    <Icon name={meta.icon} />
                    <span style={{ font: "var(--t-body-sm)", fontWeight: 600, color: "var(--text)", flexShrink: 0 }}>
                      {meta.label}
                    </span>
                    <span
                      style={{
                        font: "var(--t-body-sm)",
                        color: "var(--text-2, var(--text))",
                        flex: 1,
                        minWidth: 0,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {peek}
                    </span>
                    <Icon name="chevron-down" className="action-peek-chev" />
                  </summary>
                  <div
                    style={{
                      marginTop: "var(--s-2)",
                      paddingTop: "var(--s-2)",
                      borderTop: "1px solid var(--border-soft, var(--border))",
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                    }}
                  >
                    {a.subject ? (
                      <div style={{ font: "var(--t-body-sm)", color: "var(--text)" }}>
                        <span style={{ color: "var(--text-3, var(--text))" }}>Subject: </span>
                        {a.subject}
                      </div>
                    ) : null}
                    <p style={{ margin: 0, font: "var(--t-body-sm)", color: "var(--text-2, var(--text))" }}>
                      {a.body ?? a.preview}
                    </p>
                  </div>
                </details>
              );
            })}
          </div>
          <span
            style={{
              font: "var(--t-meta)",
              color: "var(--text-3, var(--text))",
              fontStyle: "italic",
            }}
          >
            Pre-written — you'll review and edit these in HighLevel.
          </span>
        </div>
      ) : null}

      {/* Setup checklist (HighLevel = setup only; the run happens in GoCSM next) */}
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-2)" }}>
        <span style={{ font: "var(--t-meta)", fontWeight: 600, color: "var(--text)" }}>
          Next, in HighLevel
        </span>
        <ol
          style={{
            margin: 0,
            padding: 0,
            listStyle: "none",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          {steps.map((item, i) => (
            <li
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--s-2)",
                font: "var(--t-body-sm)",
                color: "var(--text-2, var(--text))",
              }}
            >
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 22,
                  height: 22,
                  borderRadius: "999px",
                  background: "var(--info-7, var(--blue-7))",
                  color: "var(--on-accent, #fff)",
                  font: "var(--t-meta)",
                  fontWeight: 600,
                  fontSize: 11,
                  flexShrink: 0,
                }}
              >
                {i + 1}
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* CTA + Back */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "var(--s-2)",
        }}
      >
        {onBack ? (
          <Button variant="ghost" size="sm" onClick={onBack} icon={<Icon name="arrow-left" />}>
            Back
          </Button>
        ) : (
          <span />
        )}
        <Button variant="primary" onClick={onCta} icon={<Icon name="external-link" />}>
          {ctaLabel}
        </Button>
      </div>
    </div>
  );
}
