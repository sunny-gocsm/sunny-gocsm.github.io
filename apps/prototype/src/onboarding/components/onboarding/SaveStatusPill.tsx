import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";

export type SaveStatus = "idle" | "saving" | "saved" | "published";

function relTime(ts: number, now: number): string {
  const s = Math.max(0, Math.round((now - ts) / 1000));
  if (s < 5) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  return `${h}h ago`;
}

export function SaveStatusPill({
  status,
  lastSavedAt,
}: {
  status: SaveStatus;
  lastSavedAt: number | null;
}) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (status !== "saved" || lastSavedAt == null) return;
    const id = window.setInterval(() => setNow(Date.now()), 15000);
    return () => window.clearInterval(id);
  }, [status, lastSavedAt]);

  if (status === "idle" || lastSavedAt == null) return null;

  let icon: React.ReactNode;
  let text: string;
  let color = "var(--text-3)";

  if (status === "saving") {
    icon = (
      <Loader2
        size={12}
        aria-hidden
        style={{
          color: "var(--text-3)",
          animation: "spin 900ms linear infinite",
        }}
      />
    );
    text = "Saving…";
  } else if (status === "published") {
    icon = <Check size={12} aria-hidden style={{ color: "var(--pos-7)" }} />;
    text = "Published";
    color = "var(--pos-9)";
  } else {
    icon = <Check size={12} aria-hidden style={{ color: "var(--pos-7)" }} />;
    text = `Saved · ${relTime(lastSavedAt, now)}`;
  }

  return (
    <span
      aria-live="polite"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontSize: 12,
        color,
        fontFamily: "var(--font-ui)",
      }}
    >
      {icon}
      {text}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </span>
  );
}
