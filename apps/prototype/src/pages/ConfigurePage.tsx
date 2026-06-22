// Configure — admin surface. All sections are real and edit local state.
// Sticky-setup edits drive Save-play arming + the Today Setup-lost cohort.

import { useMemo, useState } from "react";
import {
  AssignmentRuleEditor,
  AutonomyDial,
  Badge,
  Button,
  Card,
  DataTable,
  Field,
  Icon,
  Input,
  MetricCard,
  Mono,
  Tabs,
  TeamPulseStrip,
  Toggle,
} from "@gocsm/design-system";
import { allAccounts, type Account } from "@/fixtures";

type Weight = "high" | "med" | "low" | "off";

const WEIGHT_VAL: Record<Weight, number> = { high: 3, med: 2, low: 1, off: 0 };
const WEIGHT_LABEL: Record<Weight, string> = { high: "High", med: "Med", low: "Low", off: "Off" };

const accounts = allAccounts();
const live = accounts.filter(
  (a) => a.status.enabled === "Enabled" && a.lifecycle.stage !== "churned",
);

// ============================================================================
// Page shell
// ============================================================================
export default function ConfigurePage() {
  const [tab, setTab] = useState("scoring");

  return (
    <div style={{ padding: "var(--s-5)", display: "flex", flexDirection: "column", gap: "var(--s-4)" }}>
      <header>
        <span className="t-label" style={{ color: "var(--text-muted)" }}>Setup</span>
        <h1 style={{ font: "var(--t-h1)", margin: "var(--s-1) 0 0 0" }}>Configure</h1>
        <p style={{ font: "var(--t-body)", color: "var(--text-muted)", margin: "var(--s-1) 0 0 0" }}>
          Health scoring, lifecycle rules, tracking, widgets, team, autonomy, AI.
        </p>
      </header>

      <Tabs
        tabs={[
          { id: "scoring", label: "Health scoring" },
          { id: "lifecycle", label: "Lifecycle & signals" },
          { id: "tracking", label: "Account tracking" },
          { id: "widgets", label: "Widget visibility" },
          { id: "team", label: "Team" },
          { id: "autonomy", label: "Autonomy" },
          { id: "ai", label: "AI" },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === "scoring" && <HealthScoringSection />}
      {tab === "lifecycle" && <LifecycleSection />}
      {tab === "tracking" && <TrackingSection />}
      {tab === "widgets" && <WidgetsSection />}
      {tab === "team" && <TeamSection />}
      {tab === "autonomy" && <AutonomySection />}
      {tab === "ai" && <AISection />}
    </div>
  );
}

// ============================================================================
// Health scoring — 9 features, segmented High/Med/Low/Off, Contacts locked
// ============================================================================
const FEATURES: { key: string; label: string; locked?: boolean; default: Weight; hint: string }[] = [
  { key: "contacts", label: "Contacts", locked: true, default: "high", hint: "Locked. Foundation of every workflow — always High." },
  { key: "domain", label: "Domain", default: "high", hint: "DNS + sending domain." },
  { key: "phone", label: "Phone / A2P", default: "high", hint: "Numbers provisioned + A2P approved." },
  { key: "funnels", label: "Funnels & sites", default: "high", hint: "Live published funnel or website." },
  { key: "workflows", label: "Workflows", default: "med", hint: "Automations actively running." },
  { key: "calendars", label: "Calendars", default: "med", hint: "Bookings flowing." },
  { key: "payments", label: "Payments", default: "med", hint: "Successful charges + wallet usage." },
  { key: "reputation", label: "Reputation", default: "low", hint: "Review requests + responses." },
  { key: "courses", label: "Courses & community", default: "off", hint: "Optional — turn on for membership-led agencies." },
];

function HealthScoringSection() {
  const [weights, setWeights] = useState<Record<string, Weight>>(
    () => Object.fromEntries(FEATURES.map((f) => [f.key, f.default])),
  );

  const summary = useMemo(() => {
    const counts: Record<Weight, number> = { high: 0, med: 0, low: 0, off: 0 };
    for (const f of FEATURES) counts[weights[f.key]] += 1;
    return counts;
  }, [weights]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-4)" }}>
      <Card padded>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "var(--s-3)" }}>
          <div>
            <h3 style={{ font: "var(--t-h3)", margin: 0 }}>Feature weights</h3>
            <p style={{ font: "var(--t-caption)", color: "var(--text-muted)", margin: "var(--s-1) 0 0 0" }}>
              How much each feature swings the health score.
            </p>
          </div>
          <div style={{ display: "flex", gap: "var(--s-2)" }}>
            <Badge variant="pos"><Mono>{summary.high}</Mono> High</Badge>
            <Badge variant="blue"><Mono>{summary.med}</Mono> Med</Badge>
            <Badge variant="neutral"><Mono>{summary.low}</Mono> Low</Badge>
            <Badge variant="neutral" dot={false}><Mono>{summary.off}</Mono> Off</Badge>
          </div>
        </header>

        <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-2)" }}>
          {FEATURES.map((f) => (
            <div key={f.key} style={{ display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center", padding: "var(--s-2)", border: "1px solid var(--border)", borderRadius: 8, background: "var(--surface)" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--s-1)", font: "var(--t-body-strong)" }}>
                  {f.label}
                  {f.locked && <Icon name="lock" />}
                </div>
                <div style={{ font: "var(--t-caption)", color: "var(--text-muted)" }}>{f.hint}</div>
              </div>
              <Segmented
                value={weights[f.key]}
                disabled={f.locked}
                onChange={(v) => setWeights((w) => ({ ...w, [f.key]: v }))}
              />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function Segmented({ value, onChange, disabled }: { value: Weight; onChange: (v: Weight) => void; disabled?: boolean }) {
  const items: Weight[] = ["high", "med", "low", "off"];
  return (
    <div style={{ display: "inline-flex", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden", opacity: disabled ? 0.7 : 1 }}>
      {items.map((k) => {
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
              font: "var(--t-caption-strong, var(--t-caption))",
              cursor: disabled ? "not-allowed" : "pointer",
              borderRight: k !== "off" ? "1px solid var(--border)" : "none",
            }}
          >
            {WEIGHT_LABEL[k]}
          </button>
        );
      })}
    </div>
  );
}

// ============================================================================
// Lifecycle & signals — stage thresholds + sticky-setup editor with Save-play arming
// ============================================================================
const DEFAULT_STAGES = [
  { id: "onboarding", label: "Onboarding", days: 0, hint: "First days; setups in flight." },
  { id: "activated", label: "Activated", days: 30, hint: "Sticky setups complete." },
  { id: "established", label: "Established", days: 90, hint: "Regular usage rhythm." },
  { id: "lapsing", label: "Lapsing", days: 180, hint: "Login + usage cooling." },
  { id: "dormant", label: "Dormant", days: 365, hint: "No meaningful activity." },
];

const DEFAULT_STICKY = [
  { id: "domain", subject: "Domain", label: "Domain connected", sticky: true, savePlay: true },
  { id: "phone", subject: "Phone", label: "Phone provisioned", sticky: true, savePlay: true },
  { id: "a2p", subject: "A2P", label: "A2P approved", sticky: true, savePlay: true },
  { id: "funnel", subject: "Funnel", label: "Funnel published", sticky: true, savePlay: true },
  { id: "workflow", subject: "Workflow", label: "Core workflow live", sticky: true, savePlay: false },
  { id: "payment", subject: "Payment", label: "Payments connected", sticky: false, savePlay: false },
];

function LifecycleSection() {
  const [stages, setStages] = useState(DEFAULT_STAGES);
  const [sticky, setSticky] = useState(DEFAULT_STICKY);

  const armed = sticky.filter((s) => s.sticky && s.savePlay).length;
  const stickyCount = sticky.filter((s) => s.sticky).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-4)" }}>
      <Card padded>
        <h3 style={{ font: "var(--t-h3)", margin: 0, marginBottom: "var(--s-3)" }}>Lifecycle stage thresholds</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-2)" }}>
          {stages.map((s, i) => (
            <div key={s.id} style={{ display: "grid", gridTemplateColumns: "180px 120px 1fr", alignItems: "center", gap: "var(--s-3)" }}>
              <div style={{ font: "var(--t-body-strong)" }}>{s.label}</div>
              <Input
                type="number"
                value={s.days}
                onChange={(e) => {
                  const days = Number(e.target.value);
                  setStages((prev) => prev.map((p, j) => (j === i ? { ...p, days } : p)));
                }}
              />
              <div style={{ font: "var(--t-caption)", color: "var(--text-muted)" }}>{s.hint} — enters at {s.days}d.</div>
            </div>
          ))}
        </div>
      </Card>

      <Card padded>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "var(--s-3)" }}>
          <div>
            <h3 style={{ font: "var(--t-h3)", margin: 0 }}>Sticky setups — the defection set</h3>
            <p style={{ font: "var(--t-caption)", color: "var(--text-muted)", margin: "var(--s-1) 0 0 0" }}>
              When one of these is lost, the account joins the Today “Setup lost” cohort. Arm a Save-play to react automatically (supervised).
            </p>
          </div>
          <div style={{ display: "flex", gap: "var(--s-2)" }}>
            <Badge variant="blue"><Mono>{stickyCount}</Mono> sticky</Badge>
            <Badge variant="ai"><Mono>{armed}</Mono> Save-plays armed</Badge>
          </div>
        </header>

        <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-2)" }}>
          {sticky.map((s, i) => (
            <div key={s.id} style={{ display: "grid", gridTemplateColumns: "1fr auto auto", alignItems: "center", gap: "var(--s-3)", padding: "var(--s-2)", border: "1px solid var(--border)", borderRadius: 8 }}>
              <div>
                <div style={{ font: "var(--t-body-strong)" }}>{s.label}</div>
                <div style={{ font: "var(--t-caption)", color: "var(--text-muted)" }}>Subject: {s.subject}</div>
              </div>
              <Toggle
                on={s.sticky}
                label="Sticky"
                onChange={(v) => setSticky((prev) => prev.map((p, j) => (j === i ? { ...p, sticky: v, savePlay: v ? p.savePlay : false } : p)))}
              />
              <Toggle
                on={s.savePlay}
                label="Arm Save-play"
                onChange={(v) => setSticky((prev) => prev.map((p, j) => (j === i ? { ...p, savePlay: v } : p)))}
              />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ============================================================================
// Account tracking — bulk enable/disable
// ============================================================================
function TrackingSection() {
  type Row = { id: string; name: string; enabled: boolean; tracked: boolean; previouslyTracked: boolean; pendingStop: boolean; mrr: number };
  const initial: Row[] = accounts.map((a) => ({
    id: a.identity.id,
    name: a.identity.name,
    enabled: a.status.enabled === "Enabled",
    tracked: a.status.tracked,
    previouslyTracked: a.status.previouslyTracked,
    pendingStop: a.status.pendingStop,
    mrr: a.revenue.mrr,
  }));
  const [rows, setRows] = useState<Row[]>(initial);
  const [selected, setSelected] = useState<(string | number)[]>([]);

  const tracked = rows.filter((r) => r.tracked).length;
  const pending = rows.filter((r) => r.pendingStop).length;
  const disabled = rows.filter((r) => !r.enabled).length;

  const apply = (patch: Partial<Row>) => {
    setRows((prev) => prev.map((r) => (selected.includes(r.id) ? { ...r, ...patch } : r)));
    setSelected([]);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-4)" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "var(--s-3)" }}>
        <MetricCard label="Tracked" icon={<Icon name="check" />} value={<Mono>{tracked}</Mono>} />
        <MetricCard label="Previously tracked" icon={<Icon name="history" />} value={<Mono>{rows.filter((r) => r.previouslyTracked).length}</Mono>} />
        <MetricCard label="Pending stop" icon={<Icon name="pause" />} iconTone="warn" value={<Mono>{pending}</Mono>} />
        <MetricCard label="Disabled" icon={<Icon name="ban" />} iconTone="neg" value={<Mono>{disabled}</Mono>} />
      </div>

      <DataTable
        title="Account tracking"
        rows={rows}
        selectable
        selectedIds={selected}
        onSelectionChange={setSelected}
        columns={[
          { key: "name", header: "Account", sortable: true },
          { key: "enabled", header: "Enabled", render: (r) => <Badge variant={r.enabled ? "pos" : "danger"}>{r.enabled ? "Enabled" : "Disabled"}</Badge> },
          { key: "tracked", header: "Tracked", render: (r) => <Badge variant={r.tracked ? "blue" : "neutral"}>{r.tracked ? "On" : "Off"}</Badge> },
          { key: "previouslyTracked", header: "Was tracked", render: (r) => (r.previouslyTracked ? <Badge variant="neutral">Yes</Badge> : <span style={{ color: "var(--text-muted)" }}>—</span>) },
          { key: "pendingStop", header: "Pending stop", render: (r) => (r.pendingStop ? <Badge variant="warn">Pending</Badge> : <span style={{ color: "var(--text-muted)" }}>—</span>) },
          { key: "mrr", header: "MRR", mono: true, align: "right", sortable: true, render: (r) => <Mono>${Math.round(r.mrr).toLocaleString()}</Mono> },
        ]}
        selectionActions={
          <div style={{ display: "flex", gap: "var(--s-2)", alignItems: "center" }}>
            <span style={{ color: "var(--text-muted)", font: "var(--t-caption)" }}>{selected.length} selected</span>
            <Button size="sm" variant="secondary" onClick={() => apply({ tracked: true, pendingStop: false })}>Track</Button>
            <Button size="sm" variant="secondary" onClick={() => apply({ tracked: false, previouslyTracked: true })}>Untrack</Button>
            <Button size="sm" variant="secondary" onClick={() => apply({ enabled: true })}>Enable</Button>
            <Button size="sm" variant="secondary" onClick={() => apply({ enabled: false, pendingStop: false })}>Disable</Button>
          </div>
        }
      />
    </div>
  );
}

// ============================================================================
// Widget visibility — role + user controls + placement
// ============================================================================
const WIDGETS = [
  { id: "doer", label: "Onboarding Doer", placement: "in-app, top-right", desc: "Client-facing setup checklist." },
  { id: "health-snapshot", label: "Health snapshot", placement: "dashboard tile", desc: "Plain-language status for the client." },
  { id: "nps", label: "Feedback widget", placement: "in-app prompt", desc: "Triggers NPS at the right moment." },
  { id: "billing-banner", label: "Billing alert", placement: "top banner", desc: "Card declined / wallet low." },
  { id: "wins", label: "Wins reel", placement: "dashboard tile", desc: "Verified outcomes the client can share." },
];
const ROLES = ["owner", "admin", "user"] as const;

function WidgetsSection() {
  const [vis, setVis] = useState(() => {
    const map: Record<string, { roles: Record<string, boolean>; placement: string }> = {};
    for (const w of WIDGETS) map[w.id] = { roles: { owner: true, admin: true, user: w.id !== "billing-banner" }, placement: w.placement };
    return map;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-3)" }}>
      {WIDGETS.map((w) => (
        <Card key={w.id} padded>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "var(--s-3)", alignItems: "start" }}>
            <div>
              <div style={{ font: "var(--t-body-strong)" }}>{w.label}</div>
              <div style={{ font: "var(--t-caption)", color: "var(--text-muted)" }}>{w.desc}</div>
            </div>
            <Field label="Placement">
              <Input
                value={vis[w.id].placement}
                onChange={(e) => setVis((v) => ({ ...v, [w.id]: { ...v[w.id], placement: e.target.value } }))}
              />
            </Field>
          </div>
          <div style={{ display: "flex", gap: "var(--s-3)", marginTop: "var(--s-3)" }}>
            {ROLES.map((role) => (
              <Toggle
                key={role}
                on={vis[w.id].roles[role]}
                label={`Visible to ${role}`}
                onChange={(next) =>
                  setVis((v) => ({ ...v, [w.id]: { ...v[w.id], roles: { ...v[w.id].roles, [role]: next } } }))
                }
              />
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}

// ============================================================================
// Team — assignments, roster, leaderboard, pulse
// ============================================================================
function TeamSection() {
  const owners = useMemo(() => {
    const map = new Map<string, { name: string; accounts: Account[]; mrr: number }>();
    for (const a of live) {
      const name = a.ownership.assignedCSM || a.ownership.owner || "Unassigned";
      const m = map.get(name) ?? { name, accounts: [], mrr: 0 };
      m.accounts.push(a);
      m.mrr += a.revenue.mrr;
      map.set(name, m);
    }
    return Array.from(map.values()).sort((a, b) => b.accounts.length - a.accounts.length);
  }, []);

  const [mode, setMode] = useState("by-rule");
  const [rules, setRules] = useState([
    { when: "Health band", is: "At risk", to: owners[0]?.name ?? "Account owner" },
    { when: "MRR", is: ">= $1,500", to: owners[1]?.name ?? "Account owner" },
    { when: "Lifecycle", is: "Onboarding", to: owners[2]?.name ?? "Account owner" },
  ]);

  const totalAtRisk = live.filter((a) => a.health.band === "atrisk").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-4)" }}>
      <AssignmentRuleEditor
        mode={mode}
        rules={rules}
        onModeChange={setMode}
        onAddRule={() => setRules((r) => [...r, { when: "Plan", is: "Pro", to: owners[0]?.name ?? "Account owner" }])}
        onRemoveRule={(i: number) => setRules((r) => r.filter((_, j) => j !== i))}
      />

      <TeamPulseStrip
        title="Team pulse"
        sub="Today’s SLA and routing"
        load={{ open: live.length, due: Math.round(live.length * 0.18), breach: totalAtRisk }}
        members={owners.slice(0, 6).map((o) => ({
          name: o.name,
          stats: [
            { v: o.accounts.length, l: "accts" },
            { v: `$${Math.round(o.mrr / 1000)}k`, l: "MRR" },
            { v: o.accounts.filter((a) => a.health.band === "atrisk").length, l: "at risk", tone: "warn" },
          ],
        }))}
        escalations={[
          { text: `${totalAtRisk} at-risk accounts unrouted by rule — falling to owner.` },
        ]}
      />

      <Card padded>
        <h3 style={{ font: "var(--t-h3)", margin: 0, marginBottom: "var(--s-3)" }}>Leaderboard</h3>
        <DataTable
          rows={owners.map((o, i) => ({
            id: o.name,
            rank: i + 1,
            name: o.name,
            accounts: o.accounts.length,
            mrr: o.mrr,
            atRisk: o.accounts.filter((a) => a.health.band === "atrisk").length,
            thriving: o.accounts.filter((a) => a.health.band === "thriving").length,
          }))}
          columns={[
            { key: "rank", header: "#", mono: true, align: "right", width: 60 },
            { key: "name", header: "CSM" },
            { key: "accounts", header: "Accounts", mono: true, align: "right", sortable: true },
            { key: "mrr", header: "MRR", mono: true, align: "right", sortable: true, render: (r) => <Mono>${Math.round(r.mrr).toLocaleString()}</Mono> },
            { key: "thriving", header: "Thriving", mono: true, align: "right", sortable: true, render: (r) => <Badge variant="pos"><Mono>{r.thriving}</Mono></Badge> },
            { key: "atRisk", header: "At risk", mono: true, align: "right", sortable: true, render: (r) => <Badge variant="danger"><Mono>{r.atRisk}</Mono></Badge> },
          ]}
        />
      </Card>
    </div>
  );
}

// ============================================================================
// Autonomy — risk-set dial; client-facing always supervised
// ============================================================================
const RISK_SETS = [
  { id: "low", label: "Low-risk · internal alerts", default: "auto", desc: "Notify the team, queue a row in Today.", locked: false },
  { id: "medium", label: "Medium-risk · internal changes", default: "approve", desc: "Pause workflows, re-route a calendar.", locked: false },
  { id: "client-comms", label: "Client-facing comms", default: "draft", desc: "Email, SMS, WhatsApp. Always supervised — auto is disabled.", locked: true },
  { id: "billing", label: "Billing actions", default: "approve", desc: "Retry charges, dunning sequences.", locked: false },
  { id: "destructive", label: "Destructive changes", default: "watch", desc: "Anything irreversible. Always Watch by default.", locked: true },
];

function AutonomySection() {
  const [levels, setLevels] = useState<Record<string, string>>(
    () => Object.fromEntries(RISK_SETS.map((r) => [r.id, r.default])),
  );

  const dial = ["watch", "draft", "approve", "auto"] as const;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-3)" }}>
      <Card padded>
        <h3 style={{ font: "var(--t-h3)", margin: 0 }}>Autonomy by risk set</h3>
        <p style={{ font: "var(--t-caption)", color: "var(--text-muted)", margin: "var(--s-1) 0 0 0" }}>
          Climb each set independently. Client-facing comms stay supervised — owners turn on autopilot per playbook, never globally.
        </p>
      </Card>

      {RISK_SETS.map((rs) => (
        <Card key={rs.id} padded>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "var(--s-3)", alignItems: "center" }}>
            <div>
              <div style={{ font: "var(--t-body-strong)", display: "flex", alignItems: "center", gap: "var(--s-1)" }}>
                {rs.label}
                {rs.locked && <Icon name="lock" />}
              </div>
              <div style={{ font: "var(--t-caption)", color: "var(--text-muted)" }}>{rs.desc}</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "var(--s-2)" }}>
              <AutonomyDial value={levels[rs.id]} locked={rs.locked} />
              <div style={{ display: "flex", gap: 4 }}>
                {dial.map((d) => (
                  <Button
                    key={d}
                    size="sm"
                    variant={levels[rs.id] === d ? "primary" : "ghost"}
                    disabled={rs.locked || (rs.id === "client-comms" && d === "auto")}
                    onClick={() => setLevels((l) => ({ ...l, [rs.id]: d }))}
                  >
                    {d}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

// ============================================================================
// AI — connector + rationing
// ============================================================================
function AISection() {
  const [mode, setMode] = useState<"bundled" | "byok">("bundled");
  const [key, setKey] = useState("");
  const [budget, setBudget] = useState(50);
  const [rationing, setRationing] = useState(true);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-3)" }}>
      <Card padded>
        <h3 style={{ font: "var(--t-h3)", margin: 0 }}>AI provider</h3>
        <p style={{ font: "var(--t-caption)", color: "var(--text-muted)", margin: "var(--s-1) 0 var(--s-3) 0" }}>
          Use GoCSM-bundled models at-cost, or bring your own key.
        </p>
        <div style={{ display: "flex", gap: "var(--s-2)" }}>
          <Button variant={mode === "bundled" ? "primary" : "secondary"} onClick={() => setMode("bundled")}>
            Bundled · at-cost
          </Button>
          <Button variant={mode === "byok" ? "primary" : "secondary"} onClick={() => setMode("byok")}>
            BYOK
          </Button>
        </div>

        {mode === "byok" && (
          <div style={{ marginTop: "var(--s-3)", maxWidth: 480 }}>
            <Field label="Provider API key" hint="Stored encrypted. Used only for your account.">
              <Input value={key} onChange={(e) => setKey(e.target.value)} placeholder="sk-..." type="password" />
            </Field>
          </div>
        )}
      </Card>

      <Card padded>
        <h3 style={{ font: "var(--t-h3)", margin: 0 }}>Model rationing</h3>
        <p style={{ font: "var(--t-caption)", color: "var(--text-muted)", margin: "var(--s-1) 0 var(--s-3) 0" }}>
          GoCSM picks the cheapest model that meets the task. Drafts use small models; explainers use frontier only on demand. You set the cap.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "var(--s-3)", alignItems: "center" }}>
          <Field label="Monthly budget (USD)">
            <Input type="number" value={budget} onChange={(e) => setBudget(Number(e.target.value))} />
          </Field>
          <Toggle on={rationing} label="Auto-ration when 80% spent" onChange={setRationing} />
        </div>
      </Card>
    </div>
  );
}
