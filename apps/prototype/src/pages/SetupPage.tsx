// First-run Setup — agency activation flow. Distinct from client onboarding journeys.
// Install → Select accounts → Tracking → Sync → Prioritize features → Activate → Hero account reveal.

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Badge,
  Button,
  Card,
  Icon,
  LiveStatus,
  Mono,
  OnboardingStep,
  QueueRow,
  ScoreRing,
} from "@gocsm/design-system";
import { allAccounts, atRiskByUrgency, bandLabel, daysUntil } from "@/fixtures";

type StepKey = "install" | "select" | "tracking" | "sync" | "prioritize" | "activate" | "hero";

const STEPS: { key: StepKey; title: string; sub: string }[] = [
  { key: "install", title: "Connect HighLevel", sub: "One OAuth — we never store your password." },
  { key: "select", title: "Choose accounts to bring in", sub: "Pick the sub-accounts GoCSM should watch." },
  { key: "tracking", title: "Set tracking", sub: "Tracked accounts get scored and surfaced. The rest stay quiet." },
  { key: "sync", title: "First sync", sub: "We pull signals from HighLevel. This takes a minute." },
  { key: "prioritize", title: "Prioritize features", sub: "Weight the 9 features so health reflects your business." },
  { key: "activate", title: "Activate", sub: "Open Today with your hero account ready." },
  { key: "hero", title: "Your first win", sub: "The account that needs you most — and the play to run." },
];

type Weight = "high" | "med" | "low" | "off";
const WEIGHT_LABEL: Record<Weight, string> = { high: "High", med: "Med", low: "Low", off: "Off" };
const FEATURES: { key: string; label: string; locked?: boolean; default: Weight }[] = [
  { key: "contacts", label: "Contacts", locked: true, default: "high" },
  { key: "domain", label: "Domain", default: "high" },
  { key: "phone", label: "Phone / A2P", default: "high" },
  { key: "funnels", label: "Funnels & sites", default: "high" },
  { key: "workflows", label: "Workflows", default: "med" },
  { key: "calendars", label: "Calendars", default: "med" },
  { key: "payments", label: "Payments", default: "med" },
  { key: "reputation", label: "Reputation", default: "low" },
  { key: "courses", label: "Courses & community", default: "off" },
];

const accounts = allAccounts();

export default function SetupPage() {
  const navigate = useNavigate();
  const [stepIdx, setStepIdx] = useState(0);
  const step = STEPS[stepIdx].key;

  // Selections
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(accounts.filter((a) => a.status.enabled === "Enabled").map((a) => a.identity.id)),
  );
  const [tracked, setTracked] = useState<Set<string>>(
    () => new Set(accounts.filter((a) => a.status.tracked).map((a) => a.identity.id)),
  );
  const [weights, setWeights] = useState<Record<string, Weight>>(
    () => Object.fromEntries(FEATURES.map((f) => [f.key, f.default])),
  );

  // Hero pick = most-urgent at-risk among selected+tracked
  const hero = useMemo(() => {
    const pool = atRiskByUrgency().filter((a) => selected.has(a.identity.id) && tracked.has(a.identity.id));
    return pool[0] ?? atRiskByUrgency()[0] ?? accounts[0];
  }, [selected, tracked]);

  const next = () => setStepIdx((i) => Math.min(STEPS.length - 1, i + 1));
  const back = () => setStepIdx((i) => Math.max(0, i - 1));

  return (
    <div style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "300px 1fr", background: "var(--bg)" }}>
      {/* Left rail — sequence */}
      <aside style={{ borderRight: "1px solid var(--border)", padding: "var(--s-5)", background: "var(--surface)" }}>
        <div style={{ font: "var(--t-h5)", marginBottom: "var(--s-1)" }}>GoCSM setup</div>
        <div style={{ font: "var(--t-caption)", color: "var(--text-muted)", marginBottom: "var(--s-4)" }}>
          Seven steps · about 4 minutes
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-1)" }}>
          {STEPS.map((s, i) => (
            <OnboardingStep
              key={s.key}
              title={s.title}
              sub={i === stepIdx ? s.sub : undefined}
              state={i < stepIdx ? "done" : i === stepIdx ? "in_progress" : "not_started"}
              affix={i < stepIdx ? "done" : undefined}
            />
          ))}
        </div>
      </aside>

      {/* Right pane — current step */}
      <main style={{ padding: "var(--s-6)", maxWidth: 880, width: "100%" }}>
        <header style={{ marginBottom: "var(--s-4)" }}>
          <span className="t-label" style={{ color: "var(--text-muted)" }}>Step {stepIdx + 1} of {STEPS.length}</span>
          <h1 style={{ font: "var(--t-h1)", margin: "var(--s-1) 0 var(--s-1) 0" }}>{STEPS[stepIdx].title}</h1>
          <p style={{ font: "var(--t-body)", color: "var(--text-muted)", margin: 0 }}>{STEPS[stepIdx].sub}</p>
        </header>

        {step === "install" && <InstallStep />}
        {step === "select" && <SelectStep selected={selected} setSelected={setSelected} />}
        {step === "tracking" && <TrackingStep selected={selected} tracked={tracked} setTracked={setTracked} />}
        {step === "sync" && <SyncStep onDone={next} count={selected.size} />}
        {step === "prioritize" && <PrioritizeStep weights={weights} setWeights={setWeights} />}
        {step === "activate" && <ActivateStep onActivate={next} selected={selected.size} tracked={tracked.size} />}
        {step === "hero" && <HeroStep hero={hero} onTake={() => navigate("/today")} />}

        {step !== "sync" && step !== "hero" && (
          <footer style={{ display: "flex", justifyContent: "space-between", marginTop: "var(--s-5)" }}>
            <Button variant="ghost" onClick={back} disabled={stepIdx === 0}>← Back</Button>
            <Button variant="primary" onClick={next}>
              {step === "activate" ? "Activate GoCSM" : "Continue →"}
            </Button>
          </footer>
        )}
      </main>
    </div>
  );
}

// --------------------------------------------------------------------------
function InstallStep() {
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);

  return (
    <Card padded>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--s-3)", marginBottom: "var(--s-3)" }}>
        <div style={{ width: 56, height: 56, borderRadius: 12, background: "var(--surface-2)", display: "grid", placeItems: "center" }}>
          <Icon name="plug" />
        </div>
        <div>
          <div style={{ font: "var(--t-h3)" }}>HighLevel</div>
          <div style={{ font: "var(--t-caption)", color: "var(--text-muted)" }}>Read-only OAuth · scoped to sub-accounts you pick</div>
        </div>
      </div>
      {connected ? (
        <Badge variant="pos">Connected — {accounts.length} sub-accounts visible</Badge>
      ) : (
        <Button
          variant="primary"
          onClick={() => {
            setConnecting(true);
            setTimeout(() => { setConnecting(false); setConnected(true); }, 900);
          }}
          disabled={connecting}
        >
          {connecting ? "Opening HighLevel…" : "Connect HighLevel"}
        </Button>
      )}
    </Card>
  );
}

// --------------------------------------------------------------------------
function SelectStep({ selected, setSelected }: { selected: Set<string>; setSelected: (s: Set<string>) => void }) {
  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  };
  return (
    <Card padded>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "var(--s-3)" }}>
        <div style={{ font: "var(--t-body-strong)" }}>
          <Mono>{selected.size}</Mono> of <Mono>{accounts.length}</Mono> selected
        </div>
        <div style={{ display: "flex", gap: "var(--s-2)" }}>
          <Button size="sm" variant="ghost" onClick={() => setSelected(new Set(accounts.map((a) => a.identity.id)))}>Select all</Button>
          <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Clear</Button>
        </div>
      </header>
      <div style={{ maxHeight: 420, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
        {accounts.map((a) => {
          const on = selected.has(a.identity.id);
          return (
            <label key={a.identity.id} style={{ display: "flex", alignItems: "center", gap: "var(--s-2)", padding: "var(--s-2)", border: "1px solid var(--border)", borderRadius: 8, cursor: "pointer", background: on ? "var(--surface-2)" : "transparent" }}>
              <input type="checkbox" checked={on} onChange={() => toggle(a.identity.id)} />
              <span style={{ flex: 1, font: "var(--t-body-strong)" }}>{a.identity.name}</span>
              <span style={{ font: "var(--t-caption)", color: "var(--text-muted)" }}>{a.identity.plan}</span>
              <Mono>${Math.round(a.revenue.mrr).toLocaleString()}</Mono>
            </label>
          );
        })}
      </div>
    </Card>
  );
}

// --------------------------------------------------------------------------
function TrackingStep({ selected, tracked, setTracked }: { selected: Set<string>; tracked: Set<string>; setTracked: (s: Set<string>) => void }) {
  const pool = accounts.filter((a) => selected.has(a.identity.id));
  const toggle = (id: string) => {
    const next = new Set(tracked);
    if (next.has(id)) next.delete(id); else next.add(id);
    setTracked(next);
  };
  return (
    <Card padded>
      <p style={{ font: "var(--t-caption)", color: "var(--text-muted)", margin: "0 0 var(--s-3) 0" }}>
        Tracked accounts contribute to portfolio metrics and surface in Today. Untracked accounts stay visible but won’t be scored.
      </p>
      <header style={{ display: "flex", gap: "var(--s-2)", marginBottom: "var(--s-3)" }}>
        <Badge variant="blue"><Mono>{tracked.size}</Mono> tracked</Badge>
        <Badge variant="neutral"><Mono>{pool.length - tracked.size}</Mono> untracked</Badge>
        <span style={{ flex: 1 }} />
        <Button size="sm" variant="ghost" onClick={() => setTracked(new Set(pool.map((a) => a.identity.id)))}>Track all</Button>
        <Button size="sm" variant="ghost" onClick={() => setTracked(new Set())}>Untrack all</Button>
      </header>
      <div style={{ maxHeight: 400, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
        {pool.map((a) => {
          const on = tracked.has(a.identity.id);
          return (
            <div key={a.identity.id} style={{ display: "flex", alignItems: "center", gap: "var(--s-2)", padding: "var(--s-2)", border: "1px solid var(--border)", borderRadius: 8 }}>
              <span style={{ flex: 1, font: "var(--t-body-strong)" }}>{a.identity.name}</span>
              <Badge variant={on ? "pos" : "neutral"}>{on ? "Tracked" : "Untracked"}</Badge>
              <Button size="sm" variant="secondary" onClick={() => toggle(a.identity.id)}>{on ? "Untrack" : "Track"}</Button>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// --------------------------------------------------------------------------
function SyncStep({ onDone, count }: { onDone: () => void; count: number }) {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    if (pct >= 100) { const t = setTimeout(onDone, 600); return () => clearTimeout(t); }
    const t = setTimeout(() => setPct((p) => Math.min(100, p + 7 + Math.random() * 9)), 220);
    return () => clearTimeout(t);
  }, [pct, onDone]);

  const phase = pct < 30 ? "Pulling sub-accounts" : pct < 60 ? "Reading signals" : pct < 90 ? "Scoring health" : "Wrapping up";

  return (
    <Card padded>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--s-3)" }}>
        <div style={{ font: "var(--t-h3)" }}>{phase}…</div>
        {count === 1 ? (
          <LiveStatus state="fresh" label="watching 1 account" />
        ) : (
          <LiveStatus state="fresh" watchingCount={count} />
        )}
      </div>
      <div style={{ height: 8, background: "var(--surface-2)", borderRadius: 999, overflow: "hidden", marginBottom: "var(--s-3)" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: "var(--brand)", transition: "width 200ms ease" }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-1)" }}>
        <OnboardingStep title="Sub-accounts" state={pct > 30 ? "done" : "in_progress"} affix={pct > 30 ? "verified" : undefined} />
        <OnboardingStep title="Signals (login, domain, A2P, payments…)" state={pct > 60 ? "done" : pct > 30 ? "in_progress" : "not_started"} />
        <OnboardingStep title="Health scoring" state={pct > 90 ? "done" : pct > 60 ? "in_progress" : "not_started"} />
      </div>
    </Card>
  );
}

// --------------------------------------------------------------------------
function PrioritizeStep({ weights, setWeights }: { weights: Record<string, Weight>; setWeights: (w: Record<string, Weight>) => void }) {
  const summary = useMemo(() => {
    const c: Record<Weight, number> = { high: 0, med: 0, low: 0, off: 0 };
    for (const f of FEATURES) c[weights[f.key]] += 1;
    return c;
  }, [weights]);
  return (
    <Card padded>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "var(--s-3)" }}>
        <div style={{ font: "var(--t-caption)", color: "var(--text-muted)" }}>
          You can refine this later in Configure. Contacts is locked — it’s the foundation.
        </div>
        <div style={{ display: "flex", gap: "var(--s-1)" }}>
          <Badge variant="pos"><Mono>{summary.high}</Mono> High</Badge>
          <Badge variant="blue"><Mono>{summary.med}</Mono> Med</Badge>
          <Badge variant="neutral"><Mono>{summary.low}</Mono> Low</Badge>
          <Badge variant="neutral" dot={false}><Mono>{summary.off}</Mono> Off</Badge>
        </div>
      </header>

      <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-2)" }}>
        {FEATURES.map((f) => (
          <div key={f.key} style={{ display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center", padding: "var(--s-2)", border: "1px solid var(--border)", borderRadius: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--s-1)", font: "var(--t-body-strong)" }}>
              {f.label}
              {f.locked && <Icon name="lock" />}
            </div>
            <WeightSeg
              value={weights[f.key]}
              disabled={f.locked}
              onChange={(v) => setWeights({ ...weights, [f.key]: v })}
            />
          </div>
        ))}
      </div>
    </Card>
  );
}

function WeightSeg({ value, onChange, disabled }: { value: Weight; onChange: (v: Weight) => void; disabled?: boolean }) {
  const items: Weight[] = ["high", "med", "low", "off"];
  return (
    <div style={{ display: "inline-flex", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden", opacity: disabled ? 0.7 : 1 }}>
      {items.map((k, i) => {
        const sel = value === k;
        return (
          <button
            key={k}
            type="button"
            disabled={disabled}
            onClick={() => !disabled && onChange(k)}
            style={{
              padding: "6px 12px",
              border: "none",
              background: sel ? "var(--text)" : "transparent",
              color: sel ? "var(--surface)" : "var(--text)",
              cursor: disabled ? "not-allowed" : "pointer",
              borderRight: i < items.length - 1 ? "1px solid var(--border)" : "none",
              font: "var(--t-caption)",
            }}
          >
            {WEIGHT_LABEL[k]}
          </button>
        );
      })}
    </div>
  );
}

// --------------------------------------------------------------------------
function ActivateStep({ onActivate, selected, tracked }: { onActivate: () => void; selected: number; tracked: number }) {
  return (
    <Card padded>
      <h3 style={{ font: "var(--t-h3)", margin: 0 }}>You’re ready.</h3>
      <p style={{ font: "var(--t-body)", color: "var(--text-muted)", margin: "var(--s-2) 0 var(--s-3) 0" }}>
        We’ll open Today and surface your hero account — the one that needs you most right now.
      </p>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "var(--s-1)" }}>
        <li>· <Mono>{selected}</Mono> sub-accounts brought in</li>
        <li>· <Mono>{tracked}</Mono> tracked and being scored</li>
        <li>· 9 feature weights set — refine anytime in Configure</li>
      </ul>
      <div style={{ marginTop: "var(--s-4)" }}>
        <Button variant="primary" onClick={onActivate}>Activate GoCSM →</Button>
      </div>
    </Card>
  );
}

// --------------------------------------------------------------------------
function HeroStep({ hero, onTake }: { hero: ReturnType<typeof allAccounts>[number]; onTake: () => void }) {
  const days = daysUntil(hero.revenue.renewalDate);
  const isLost = hero.health.band === "atrisk";
  const playTitle = isLost ? "Save the renewal" : "Re-engage and re-onboard";
  const playSub = isLost
    ? `Renewal in ${days}d · drafted owner outreach + internal alert (supervised).`
    : "Drafted check-in + tailored quick wins (supervised).";

  return (
    <Card padded>
      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "var(--s-4)", alignItems: "center" }}>
        <ScoreRing score={hero.health.score} band={hero.health.band} size={160} />
        <div>
          <span className="t-label" style={{ color: "var(--text-muted)" }}>Your first win</span>
          <h2 style={{ font: "var(--t-h2)", margin: "var(--s-1) 0" }}>{hero.identity.name}</h2>
          <p style={{ font: "var(--t-body)", color: "var(--text-muted)", margin: 0 }}>
            {bandLabel(hero.health.band)} — {hero.identity.plan} · <Mono>${Math.round(hero.revenue.mrr).toLocaleString()}</Mono>/mo.
            {days > 0 ? <> Renews in {days}d.</> : <> Renewal overdue.</>}
          </p>
        </div>
      </div>

      <div style={{ marginTop: "var(--s-4)" }}>
        <QueueRow
          subject={<span style={{ font: "var(--t-body-strong)" }}>{playTitle}</span>}
          impact={<Mono>${Math.round(hero.revenue.mrr).toLocaleString()}</Mono>}
          blockedBy="agency"
          sla={`Renews in ${Math.max(days, 0)}d`}
          slaBreach={days < 7}
          memory={playSub}
          action={<Button variant="primary" size="sm" onClick={onTake}>Open in Today →</Button>}
        />
      </div>

      <p style={{ font: "var(--t-caption)", color: "var(--text-muted)", marginTop: "var(--s-4)" }}>
        Tip: Today ranks every alert by impact × time. Your hero will sit at the top until you act.
      </p>
    </Card>
  );
}
