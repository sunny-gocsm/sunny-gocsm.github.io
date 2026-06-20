// Tiny inline video affordance for a Playbook.
// - Renders a "Watch (1 min)" button (composed from DS primitives).
// - Opens a modal with a poster + native <video> for that specific play.
// - Non-blocking: clicking outside or the close button dismisses it.

import { useState } from "react";
import { Button, Icon } from "@/gocsm-ds";
import type { Playbook } from "@/fixtures/playbooks";

interface Props {
  playbook: Playbook;
  label?: string;
  size?: "sm" | "md";
}

export function PlayVideoButton({ playbook, label = "Watch (1 min)", size = "sm" }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size={size}
        icon={<Icon name="play-circle" />}
        onClick={(e: React.MouseEvent) => {
          e.stopPropagation();
          setOpen(true);
        }}
      >
        {label}
      </Button>

      {open ? (
        <div
          role="dialog"
          aria-modal
          aria-label={`${playbook.title} — explainer video`}
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(8, 14, 28, 0.65)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 60,
            padding: "var(--s-4)",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(720px, 100%)",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--r-lg, var(--r-md))",
              overflow: "hidden",
              color: "var(--text)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <header
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--s-2)",
                padding: "var(--s-3) var(--s-4)",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <Icon name={playbook.icon} />
              <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
                <strong style={{ font: "var(--t-body)", fontWeight: 600 }}>
                  {playbook.title}
                </strong>
                <span style={{ font: "var(--t-meta)", color: "var(--text-3, var(--text))" }}>
                  What this play does · ~1 min
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
                Close <Icon name="x" />
              </Button>
            </header>

            <div style={{ background: "#000" }}>
              <video
                key={playbook.id}
                src={playbook.videoUrl}
                poster={playbook.videoPoster}
                controls
                autoPlay
                playsInline
                style={{ width: "100%", display: "block", aspectRatio: "16 / 9" }}
              />
            </div>

            <footer
              style={{
                padding: "var(--s-3) var(--s-4)",
                font: "var(--t-meta)",
                color: "var(--text-3, var(--text))",
                fontStyle: "italic",
              }}
            >
              Walkthrough video — coming soon.
            </footer>
          </div>
        </div>
      ) : null}
    </>
  );
}
