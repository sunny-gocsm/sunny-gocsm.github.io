import { useMemo, useState } from "react";
import { Badge, Card, PlaybookCard, Tabs, ConfTag, Icon, Mono } from "@/gocsm-ds";
import {
  playbooks,
  matchCount,
  type Playbook,
  type PlaybookState,
} from "@/fixtures/playbooks";

type TabId = "library" | "triggers" | "outcomes";

const TABS = [
  { id: "library", label: "Library" },
  { id: "triggers", label: "Triggers" },
  { id: "outcomes", label: "Outcomes" },
];

type Filter = "all" | "save" | "retention" | "billing" | "adoption" | "onboarding" | "expansion";
const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "save", label: "Save plays" },
  { id: "retention", label: "Retention" },
  { id: "billing", label: "Billing" },
  { id: "adoption", label: "Adoption" },
  { id: "onboarding", label: "Onboarding" },
  { id: "expansion", label: "Expansion" },
];

const STATE_LABEL: Record<PlaybookState, string> = {
  off: "Off",
  ranonce: "Ran once",
  on: "On · autopilot",
  paused: "Paused",
};

const STATE_VARIANT: Record<PlaybookState, "neutral" | "warn" | "pos" | "blue"> = {
  off: "neutral",
  ranonce: "warn",
  on: "pos",
  paused: "blue",
};

function activateLabel(state: PlaybookState): string {
  switch (state) {
    case "off": return "Run it once";
    case "ranonce": return "Keep it running";
    case "on": return "Manage";
    case "paused": return "Resume";
  }
}

export default function PlaybooksPage() {
  const [tab, setTab] = useState<TabId>("library");
  const [filter, setFilter] = useState<Filter>("all");
  const [overrides, setOverrides] = useState<Record<string, PlaybookState>>({});

  const enriched = useMemo(
    () =>
      playbooks.map((p) => ({
        ...p,
        state: overrides[p.id] ?? p.state,
        count: matchCount(p),
      })),
    [overrides],
  );

  const filtered = enriched.filter((p) => filter === "all" || p.kind === filter);

  const totalMatches = enriched.reduce((s, p) => s + p.count, 0);
  const onCount = enriched.filter((p) => p.state === "on").length;
  const saveCount = enriched.filter((p) => p.kind === "save").length;

  const advance = (p: Playbook & { state: PlaybookState }) => {
    setOverrides((o) => {
      const next: PlaybookState =
        p.state === "off" ? "ranonce" : p.state === "ranonce" ? "on" : p.state === "paused" ? "on" : "paused";
      return { ...o, [p.id]: next };
    });
  };

  return (
    <main
      style={{
        padding: "var(--s-7) var(--s-6)",
        maxWidth: 1280,
        margin: "0 auto",
        color: "var(--text)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--s-5)",
      }}
    >
      <header style={{ display: "flex", flexDirection: "column", gap: "var(--s-2)" }}>
        <h1 style={{ font: "var(--t-h2)", margin: 0 }}>Playbooks</h1>
        <p style={{ font: "var(--t-body)", color: "var(--text-3, var(--text))", margin: 0 }}>
          One situation, one playbook. Every play is grounded in a Signal — counts are live.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--s-3)", font: "var(--t-meta)", color: "var(--text-3, var(--text))" }}>
          <span><Mono>{enriched.length}</Mono> plays</span>
          <span>·</span>
          <span><Mono>{onCount}</Mono> on autopilot</span>
          <span>·</span>
          <span><Mono>{saveCount}</Mono> Save plays</span>
          <span>·</span>
          <span><Mono>{totalMatches}</Mono> total matches today</span>
        </div>
      </header>

      <Tabs tabs={TABS} active={tab} onChange={(id) => setTab(id as TabId)} />

      {tab === "library" ? (
        <>
          {/* Filter chips */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--s-2)", alignItems: "center" }}>
            <span style={{ font: "var(--t-meta)", color: "var(--text-3, var(--text))" }}>Filter</span>
            {FILTERS.map((f) => (
              <Badge
                key={f.id}
                variant={filter === f.id ? "blue" : "neutral"}
                dot={false}
                onClick={() => setFilter(f.id)}
                style={{ cursor: "pointer" }}
              >
                {f.label}
              </Badge>
            ))}
            <span style={{ marginLeft: "auto" }}>
              <ConfTag basis="projection" detail="seed catalog — pending workflow snapshot" />
            </span>
          </div>

          {/* Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: "var(--s-4)",
            }}
          >
            {filtered.map((p) => (
              <div
                key={p.id}
                style={{ display: "flex", flexDirection: "column", gap: "var(--s-2)", cursor: "pointer" }}
                onClick={() => navigate(`/playbooks/${p.id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") navigate(`/playbooks/${p.id}`);
                }}
              >
                <PlaybookCard
                  state={p.state}
                  icon={p.icon}
                  title={p.title}
                  subtitle={p.subtitle}
                  matchCount={p.count}
                  problem={p.problem}
                  does={p.does}
                  outcome={p.outcome}
                  activateLabel={activateLabel(p.state)}
                  onActivate={() => advance(p)}
                />
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "var(--s-2)",
                    paddingInline: "var(--s-2)",
                  }}
                >
                  <Badge variant={STATE_VARIANT[p.state]} dot>
                    {STATE_LABEL[p.state]}
                  </Badge>
                  <span style={{ font: "var(--t-meta)", color: "var(--text-3, var(--text))" }}>
                    <Mono>{p.count}</Mono> account{p.count === 1 ? "" : "s"} match today
                  </span>
                </div>
              </div>
            ))}
            {filtered.length === 0 ? (
              <Card padded>
                <span style={{ font: "var(--t-body)", color: "var(--text-3, var(--text))" }}>
                  No plays in this filter.
                </span>
              </Card>
            ) : null}
          </div>
        </>
      ) : (
        <Card padded>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-2)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--s-2)" }}>
              <Icon name="wrench" />
              <h3 style={{ font: "var(--t-h3)", margin: 0 }}>
                {tab === "triggers" ? "Triggers" : "Outcomes"}
              </h3>
            </div>
            <p style={{ font: "var(--t-body)", color: "var(--text-3, var(--text))", margin: 0 }}>
              {tab === "triggers"
                ? "Trigger explorer ships in P14 — the page that shows every Signal a play watches for."
                : "Outcome reporting ships in P14 — who matched, who acted, what changed."}
            </p>
          </div>
        </Card>
      )}
    </main>
  );
}
