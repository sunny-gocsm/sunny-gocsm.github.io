import { Link } from "react-router-dom";
import { ActivityLog, Badge } from "@gocsm/design-system";
import { activityLog, type ActivityMode } from "./briefing.fixtures";

const MODE_LABEL: Record<ActivityMode, string> = {
  auto: "Auto",
  approved: "Approved",
  manual: "Manual",
};

const MODE_VARIANT: Record<ActivityMode, "ai" | "pos" | "neutral"> = {
  auto: "ai",
  approved: "pos",
  manual: "neutral",
};

export default function Activity() {
  const rows = activityLog.map((e) => ({
    time: e.time,
    actor: e.mode === "manual" ? "You" : "GoCSM",
    line: (
      <span className="flex flex-wrap items-center gap-2">
        <span style={{ color: "var(--text)" }}>{e.account}</span>
        <span style={{ color: "var(--text-3, var(--text))" }}>·</span>
        <span style={{ color: "var(--text-2, var(--text))" }}>{e.action}</span>
        <Badge variant={MODE_VARIANT[e.mode]}>{MODE_LABEL[e.mode]}</Badge>
      </span>
    ),
    outcome: <span style={{ color: "var(--text-2, var(--text))" }}>{e.outcome}</span>,
  }));

  return (
    <main
      className="min-h-screen"
      style={{ background: "var(--bg)", color: "var(--text)" }}
    >
      <div
        className="mx-auto flex flex-col gap-6"
        style={{
          maxWidth: 960,
          padding: "var(--s-8) var(--s-6)",
        }}
      >
        <header className="flex flex-col gap-2">
          <Link
            to="/"
            className="text-sm"
            style={{ color: "var(--blue-7)", width: "fit-content" }}
          >
            ← Back to briefing
          </Link>
          <h1 className="text-2xl" style={{ margin: 0, color: "var(--text)" }}>
            Activity
          </h1>
          <p
            className="text-sm"
            style={{ color: "var(--text-3, var(--text))", margin: 0 }}
          >
            Every action GoCSM ran for you, in order. Plain record, not a dashboard.
          </p>
        </header>

        <ActivityLog
          days={[
            { label: "Today", count: activityLog.length, rows },
          ]}
        />
      </div>
    </main>
  );
}
