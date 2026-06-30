import { useState } from "react";
import { Icon } from "@gocsm/design-system";
import { healthConfigStore } from "@/state/healthConfig";

// Phase-1-only, dismissible prompt to set up Health scoring (unlocks Phase 2). Slim and quiet
// by design — it must not compete with the tiles or the queue. Dismissal persists. Hidden
// entirely in Phase 2 (the page that renders it only mounts it when Health is unconfigured).

const KEY = "gocsm.today.healthNudge.v1";
const loadDismissed = (): boolean => {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
};

export default function HealthNudge() {
  const [dismissed, setDismissed] = useState(loadDismissed);
  if (dismissed) return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="today-nudge" role="note">
      <span className="today-nudge-ico" aria-hidden>
        <Icon name="sparkles" />
      </span>
      <p className="today-nudge-text">
        Set up Health scoring to unlock health bands, revenue-at-risk and sentiment across your book.
      </p>
      <button type="button" className="today-nudge-cta" onClick={() => healthConfigStore.set(true)}>
        Set up Health
      </button>
      <button type="button" className="today-nudge-x" aria-label="Dismiss" onClick={dismiss}>
        <Icon name="x" />
      </button>
    </div>
  );
}
