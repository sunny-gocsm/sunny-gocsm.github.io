import { Button, Icon } from "@/gocsm-ds";
import type { Playbook } from "@/fixtures/playbooks";

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

  const steps = [
    "Turn on the steps you want",
    "Check the messages",
    mode === "onetime" ? "Run it" : "Publish",
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-4)" }}>
      {/* Prominent explainer video */}
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
      <p
        style={{
          margin: 0,
          font: "var(--t-meta)",
          color: "var(--text-3, var(--text))",
          fontStyle: "italic",
        }}
      >
        Placeholder video — the real recording for this play lands later.
      </p>

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
      </div>

      {/* 3-step checklist */}
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
