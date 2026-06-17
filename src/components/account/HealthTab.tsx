import { useState } from "react";
import {
  Card,
  Button,
  Icon,
  Mono,
  ScoreRing,
  Delta,
  PillarBar,
  WhyCard,
  ConfTag,
  HealthScoreEvidence,
  MethodologyExplainer,
} from "@/gocsm-ds";
import type { Account, HealthBand } from "@/fixtures";

type PillarKey = "productAdoption" | "revenue" | "login" | "sentiment";
type TargetTab = "adoption" | "revenue" | "login" | "feedback";

const PILLAR_META: Record<
  PillarKey,
  { label: string; tab: TargetTab; weight: number; weightKey: "pas" | "revenue" | "login" | "feedback" }
> = {
  productAdoption: { label: "Product Adoption", tab: "adoption", weight: 30, weightKey: "pas" },
  revenue: { label: "Revenue", tab: "revenue", weight: 25, weightKey: "revenue" },
  login: { label: "Login", tab: "login", weight: 25, weightKey: "login" },
  sentiment: { label: "Feedback", tab: "feedback", weight: 20, weightKey: "feedback" },
};

const scoreBand = (n: number): HealthBand =>
  n >= 80 ? "thriving" : n >= 60 ? "healthy" : n >= 40 ? "watch" : "atrisk";

const bandSeverity = (b: HealthBand): number =>
  b === "atrisk" ? 3 : b === "watch" ? 2 : b === "healthy" ? 1 : 0;

const pillarLine = (key: PillarKey, score: number): string => {
  const b = scoreBand(score);
  switch (key) {
    case "productAdoption":
      return b === "atrisk"
        ? "Few core features in use — adoption stalled."
        : b === "watch"
        ? "Adoption uneven across the workspace."
        : b === "healthy"
        ? "Most core features in regular use."
        : "Deep adoption across the workspace.";
    case "revenue":
      return b === "atrisk"
        ? "Payment or plan health is degrading."
        : b === "watch"
        ? "MRR softening or invoice friction."
        : b === "healthy"
        ? "Billing steady, no payment friction."
        : "Expansion-ready — over plan cap.";
    case "login":
      return b === "atrisk"
        ? "Key users have gone quiet."
        : b === "watch"
        ? "Logins thinning out."
        : b === "healthy"
        ? "Owner and team logging in weekly."
        : "Daily activity across the team.";
    case "sentiment":
      return b === "atrisk"
        ? "Negative or no feedback in 90 days."
        : b === "watch"
        ? "Mixed signals from recent surveys."
        : b === "healthy"
        ? "Positive recent feedback."
        : "Promoters and testimonial ready.";
  }
};

// Tiny inline sparkline using the band color via CSS var.
function Sparkline({ values, band }: { values: number[]; band: HealthBand }) {
  if (!values.length) return null;
  const w = 220;
  const h = 44;
  const max = Math.max(...values, 100);
  const min = Math.min(...values, 0);
  const range = Math.max(1, max - min);
  const step = w / Math.max(1, values.length - 1);
  const pts = values
    .map((v, i) => `${(i * step).toFixed(1)},${(h - ((v - min) / range) * h).toFixed(1)}`)
    .join(" ");
  const stroke =
    band === "atrisk"
      ? "var(--band-atrisk, #d6336c)"
      : band === "watch"
      ? "var(--band-watch, #d99100)"
      : band === "healthy"
      ? "var(--band-healthy, #2f9e44)"
      : "var(--band-thriving, #1971c2)";
  return (
    <svg width={w} height={h} role="img" aria-label="90-day health trend" style={{ display: "block" }}>
      <polyline fill="none" stroke={stroke} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" points={pts} />
    </svg>
  );
}

// Routes a free-text driver to the right tab by keyword match.
function tabForDriver(text: string): TargetTab {
  const t = text.toLowerCase();
  if (/(login|inactiv|quiet|ghost|dorman)/.test(t)) return "login";
  if (/(payment|card|dunning|mrr|invoice|cancel|plan)/.test(t)) return "revenue";
  if (/(nps|survey|feedback|testimonial|complain)/.test(t)) return "feedback";
  return "adoption";
}

const severityForDriver = (text: string): "high" | "med" | "pos" => {
  const t = text.toLowerCase();
  if (/(collaps|declin|cancel|disconnect|lapsed|stall)/.test(t)) return "high";
  return "med";
};

interface Props {
  account: Account;
  onNavigateTab: (tab: TargetTab) => void;
}

export function HealthTab({ account, onNavigateTab }: Props) {
  const { health, identity, onboarding, lifecycle } = account;
  const [methodOpen, setMethodOpen] = useState(false);

  const pillars: PillarKey[] = ["productAdoption", "revenue", "login", "sentiment"];
  const weights = {
    pas: PILLAR_META.productAdoption.weight,
    revenue: PILLAR_META.revenue.weight,
    login: PILLAR_META.login.weight,
    feedback: PILLAR_META.sentiment.weight,
  };

  // Low-data heuristic: a pillar score of 0 with no signals → projection.
  const lowDataPillar = (key: PillarKey) => {
    const v = health.pillarScores[key];
    if (key === "sentiment" && v <= 30) return true;
    if (v === 0) return true;
    return false;
  };

  const riskDrivers = (health.riskSignals ?? []).map((s) => ({
    title: s,
    desc: `Routes to ${PILLAR_META[
      (["login", "revenue", "sentiment", "productAdoption"] as PillarKey[]).find((k) =>
        tabForDriver(s) === PILLAR_META[k].tab,
      ) ?? "productAdoption"
    ].label}`,
    severity: severityForDriver(s),
    action: (
      <Button variant="ghost" size="sm" onClick={() => onNavigateTab(tabForDriver(s))}>
        Open {tabForDriver(s)} <Icon name="arrow-up-right" />
      </Button>
    ),
  }));

  const oppDrivers = (health.opportunities ?? []).map((s) => ({
    title: s,
    desc: "Opportunity to act now.",
    severity: "pos" as const,
    action: (
      <Button variant="ghost" size="sm" onClick={() => onNavigateTab(tabForDriver(s))}>
        Open {tabForDriver(s)} <Icon name="arrow-up-right" />
      </Button>
    ),
  }));

  // Determine the single worst pillar: lowest score, ties broken by band severity.
  const worstPillar = useMemo(() => {
    const scored = pillars.map((k) => ({
      key: k,
      score: health.pillarScores[k],
      band: scoreBand(health.pillarScores[k]),
    }));
    scored.sort((a, b) => {
      if (a.score !== b.score) return a.score - b.score;
      return bandSeverity(b.band) - bandSeverity(a.band);
    });
    return scored[0]?.key ?? null;
  }, [health.pillarScores]);

  // Health slip: onboarding 100% but lifecycle regressed.
  const showHealthSlip =
    onboarding.pct_complete === 100 &&
    (lifecycle.stage === "lapsing" || lifecycle.stage === "dormant" || lifecycle.stage === "churned");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-5)" }}>
      {/* Top: ring + trend + delta */}
      <Card padded>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--s-6)", alignItems: "center" }}>
          <ScoreRing score={health.score} band={health.band} size={144} />
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-2)", minWidth: 220 }}>
            <span style={{ font: "var(--t-meta)", textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--text-3, var(--text))" }}>
              90-day trend
            </span>
            <Sparkline values={health.trend90d} band={health.band} />
            <div style={{ display: "flex", alignItems: "center", gap: "var(--s-2)" }}>
              <Delta
                value={`${health.delta > 0 ? "+" : ""}${health.delta}`}
                direction={health.delta > 0 ? "up" : health.delta < 0 ? "down" : "flat"}
                context="vs 90d ago"
              />
            </div>
          </div>
          {showHealthSlip ? (
            <div style={{ flex: 1, minWidth: 280 }}>
              <p style={{ font: "var(--t-body)", color: "var(--text-2)", margin: 0 }}>
                Setup&apos;s done — this is a health slip, not a setup problem.
              </p>
            </div>
          ) : null}
        </div>
      </Card>

      {/* What's impacting health — pillars */}
      <section style={{ display: "flex", flexDirection: "column", gap: "var(--s-3)" }}>
        <header style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "var(--s-3)" }}>
          <div>
            <h3 style={{ font: "var(--t-h3)", margin: 0 }}>What&apos;s impacting health</h3>
            <p style={{ font: "var(--t-body)", color: "var(--text-3, var(--text))", margin: "var(--s-1) 0 0" }}>
              Four pillars roll up to one score. Click a pillar to see the detail.
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setMethodOpen((v) => !v)}>
            How is this calculated? <Icon name={methodOpen ? "chevron-up" : "chevron-down"} />
          </Button>
        </header>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "var(--s-3)",
          }}
        >
          {pillars.map((key) => {
            const score = health.pillarScores[key];
            const band = scoreBand(score);
            const meta = PILLAR_META[key];
            const isWorst = worstPillar === key;
            const cls = `pillar-card ${band}${isWorst ? " worst" : ""}`;
            return (
              <button
                key={key}
                type="button"
                onClick={() => onNavigateTab(meta.tab)}
                className={cls}
                style={{ textAlign: "left", padding: 0, border: 0, background: "transparent", cursor: "pointer" }}
              >
                <span className="p-label">{meta.label}</span>
                <span className="p-score">{score}</span>
                <span className="p-bar">
                  <i style={{ width: `${score}%` }} />
                </span>
                <span style={{ font: "var(--t-meta)", color: "var(--text-3, var(--text))", marginTop: 2 }}>
                  {pillarLine(key, score)}
                </span>
                {lowDataPillar(key) ? (
                  <span style={{ marginTop: 2 }}>
                    <ConfTag basis="projection" detail="low data" />
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        <Card padded>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-2)" }}>
            <span style={{ font: "var(--t-meta)", textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--text-3, var(--text))" }}>
              Agency weights
            </span>
            <PillarBar weights={weights} />
          </div>
        </Card>

        {methodOpen ? (
          <Card padded>
            <MethodologyExplainer
              lede="Health is a triage instrument — it routes attention. Signals direct action. Weights are agency-configurable."
              pillars={weights}
              factors={[
                ...(health.riskSignals ?? []).map((t) => ({ text: t, pillar: PILLAR_META[
                  (["login", "revenue", "sentiment", "productAdoption"] as PillarKey[]).find(
                    (k) => tabForDriver(t) === PILLAR_META[k].tab,
                  ) ?? "productAdoption"
                ].label, dir: "down" as const })),
                ...(health.opportunities ?? []).map((t) => ({ text: t, pillar: "Opportunity", dir: "up" as const })),
              ]}
            />
          </Card>
        ) : null}
      </section>

      {/* Risk + Opportunity */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "var(--s-4)",
        }}
      >
        <WhyCard kind="risk" title="Risk signals" drivers={riskDrivers.length ? riskDrivers : [{ title: "No active risk signals", desc: "GoCSM is watching.", severity: "pos" }]} />
        <WhyCard kind="opp" title="Opportunities" drivers={oppDrivers.length ? oppDrivers : [{ title: "No opportunities flagged yet", desc: "GoCSM will surface them as they appear.", severity: "pos" }]} />
      </section>

      {/* Evidence — kept calm, below */}
      <HealthScoreEvidence
        score={health.score}
        band={health.band}
        tag="Triage instrument"
        trend={`${health.delta > 0 ? "+" : ""}${health.delta}`}
        onHowScored={() => setMethodOpen(true)}
      />
    </div>
  );
}

