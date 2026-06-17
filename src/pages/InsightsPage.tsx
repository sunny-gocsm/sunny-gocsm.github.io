// Insights — secondary analytics surface.
// Four sub-views: Login, Adoption, Feedback (pillar portfolio dashboards)
// plus Signals (activation funnel, time-to-activate, decay, lifecycle flow).
// All charts use --viz tokens; numbers render in Mono.

import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Badge,
  Button,
  Card,
  ConfTag,
  DataTable,
  Delta,
  HealthTile,
  Icon,
  MetricCard,
  Mono,
  Tabs,
} from "@/gocsm-ds";
import {
  TODAY,
  allAccounts,
  daysSince,
  dormantGrowth,
  lostStickySetups,
  signals,
  type Account,
  type Signal,
} from "@/fixtures";

type View = "login" | "adoption" | "feedback" | "signals";

const VIEW_LABEL: Record<View, string> = {
  login: "Login",
  adoption: "Adoption",
  feedback: "Feedback",
  signals: "Signals",
};

const accounts = allAccounts();
const live = accounts.filter(
  (a) => a.status.enabled === "Enabled" && a.lifecycle.stage !== "churned",
);

const fmtNum = (n: number) => Math.round(n).toLocaleString();
const fmtPct = (n: number) => `${Math.round(n)}%`;

// ===========================================================================
// Shell — secondary nav-aware page wrapper
// ===========================================================================
export default function InsightsPage() {
  const { view } = useParams();
  const navigate = useNavigate();
  const active: View = (["login", "adoption", "feedback", "signals"].includes(view ?? "")
    ? (view as View)
    : "login");

  return (
    <div style={{ padding: "var(--s-5)", display: "flex", flexDirection: "column", gap: "var(--s-4)" }}>
      <header style={{ display: "flex", flexDirection: "column", gap: "var(--s-1)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--s-2)" }}>
          <span className="t-label" style={{ color: "var(--text-muted)" }}>Insights</span>
          <Badge variant="neutral">Secondary</Badge>
        </div>
        <h1 style={{ font: "var(--t-h1)", margin: 0 }}>{VIEW_LABEL[active]} analytics</h1>
        <p style={{ font: "var(--t-body)", color: "var(--text-muted)", margin: 0 }}>
          Portfolio-wide breakdowns power users open directly. All figures from fixtures.
        </p>
      </header>

      <Tabs
        tabs={[
          { id: "login", label: "Login" },
          { id: "adoption", label: "Adoption" },
          { id: "feedback", label: "Feedback" },
          { id: "signals", label: "Signals" },
        ]}
        active={active}
        onChange={(id) => navigate(`/insights/${id}`)}
      />

      {active === "login" && <LoginView />}
      {active === "adoption" && <AdoptionView />}
      {active === "feedback" && <FeedbackView />}
      {active === "signals" && <SignalsView />}
    </div>
  );
}

// ===========================================================================
// LOGIN
// ===========================================================================
function LoginView() {
  const totalUsers = live.reduce((s, a) => s + a.login.activeUsers, 0);
  const totalMin = live.reduce((s, a) => s + a.login.totalLoggedInTime, 0);
  const ghosting = live.filter((a) => a.login.activityStatus === "ghosting").length;
  const noLogin30 = live.filter((a) => a.login.lastLoginDaysAgo >= 30).length;
  const medianDaysSince = median(live.map((a) => a.login.lastLoginDaysAgo));

  const statusBreak = (["highly", "moderately", "low", "ghosting"] as const).map((k) => ({
    status: k,
    count: live.filter((a) => a.login.activityStatus === k).length,
  }));

  const rows = live
    .slice()
    .sort((a, b) => a.login.lastLoginDaysAgo - b.login.lastLoginDaysAgo)
    .map((a) => ({
      id: a.identity.id,
      name: a.identity.name,
      users: a.login.activeUsers,
      minutes: a.login.totalLoggedInTime,
      days: a.login.lastLoginDaysAgo,
      status: a.login.activityStatus,
      mrr: a.revenue.mrr,
    }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-4)" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "var(--s-3)" }}>
        <MetricCard label="Active users" icon={<Icon name="users" />} value={<Mono>{fmtNum(totalUsers)}</Mono>} delta={<Delta value="+4%" direction="up" />} context="across live accounts" />
        <MetricCard label="Time spent · 30d" icon={<Icon name="clock" />} value={<Mono>{fmtNum(totalMin / 60)}h</Mono>} delta={<Delta value="+2%" direction="up" />} context="logged-in minutes" />
        <MetricCard label="Ghosting accounts" icon={<Icon name="moon" />} iconTone="neg" accent="neg" value={<Mono>{fmtNum(ghosting)}</Mono>} delta={<Delta value={`${noLogin30} no login 30d+`} direction="bad-up" />} context="needs nudge" />
        <MetricCard label="Median days since login" icon={<Icon name="calendar" />} value={<Mono>{fmtNum(medianDaysSince)}d</Mono>} delta={<Delta value="flat" direction="flat" />} context="portfolio median" />
      </div>

      <Card padded>
        <header style={{ marginBottom: "var(--s-2)" }}>
          <h3 style={{ font: "var(--t-h3)", margin: 0 }}>Login activity distribution</h3>
        </header>
        <div style={{ width: "100%", height: 220 }}>
          <ResponsiveContainer>
            <BarChart data={statusBreak} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
              <CartesianGrid stroke="var(--viz-grid)" vertical={false} />
              <XAxis dataKey="status" stroke="var(--viz-axis)" fontSize={11} />
              <YAxis stroke="var(--viz-axis)" fontSize={11} width={40} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {statusBreak.map((_, i) => (
                  <Cell key={i} fill={`var(--viz-${(i % 5) + 1})`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <DataTable
        title="Sub-account login breakdown"
        rows={rows}
        columns={[
          { key: "name", header: "Account", sortable: true },
          { key: "users", header: "Active users", mono: true, align: "right", sortable: true },
          { key: "minutes", header: "Minutes 30d", mono: true, align: "right", sortable: true, render: (r) => <Mono>{fmtNum(r.minutes)}</Mono> },
          { key: "days", header: "Last login", mono: true, align: "right", sortable: true, render: (r) => <Mono>{r.days}d ago</Mono> },
          { key: "status", header: "Status", render: (r) => <Badge variant={r.status === "ghosting" ? "danger" : r.status === "low" ? "warn" : "pos"}>{r.status}</Badge> },
          { key: "mrr", header: "MRR", mono: true, align: "right", sortable: true, render: (r) => <Mono>${fmtNum(r.mrr)}</Mono> },
        ]}
      />
    </div>
  );
}

// ===========================================================================
// ADOPTION
// ===========================================================================
function AdoptionView() {
  const featureMap = new Map<string, { name: string; assets: number; active: number; engagement: number; accts: number }>();
  for (const a of live) {
    for (const f of a.adoption.features) {
      const m = featureMap.get(f.name) ?? { name: f.name, assets: 0, active: 0, engagement: 0, accts: 0 };
      m.assets += f.assetCount;
      m.active += f.activeAssetCount;
      m.engagement += f.engagement;
      m.accts += 1;
      featureMap.set(f.name, m);
    }
  }
  const features = Array.from(featureMap.values())
    .map((f) => ({ ...f, engagement: f.accts ? Math.round(f.engagement / f.accts) : 0 }))
    .sort((a, b) => b.engagement - a.engagement);

  const totalAssets = features.reduce((s, f) => s + f.assets, 0);
  const totalActive = features.reduce((s, f) => s + f.active, 0);
  const avgEngagement = features.length ? Math.round(features.reduce((s, f) => s + f.engagement, 0) / features.length) : 0;
  const underutilized = features.filter((f) => f.engagement < 40).length;

  const rows = live
    .slice()
    .sort((a, b) => avgEng(b) - avgEng(a))
    .map((a) => ({
      id: a.identity.id,
      name: a.identity.name,
      features: a.adoption.features.length,
      assets: a.adoption.features.reduce((s, f) => s + f.assetCount, 0),
      active: a.adoption.features.reduce((s, f) => s + f.activeAssetCount, 0),
      engagement: avgEng(a),
      top: a.adoption.topFeatures[0] ?? "—",
    }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-4)" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "var(--s-3)" }}>
        <MetricCard label="Assets tracked" icon={<Icon name="package" />} value={<Mono>{fmtNum(totalAssets)}</Mono>} delta={<Delta value="+12" direction="up" />} context="across features" />
        <MetricCard label="Active assets" icon={<Icon name="zap" />} value={<Mono>{fmtNum(totalActive)}</Mono>} delta={<Delta value={fmtPct((totalActive / Math.max(1, totalAssets)) * 100)} direction="flat" />} context="of total" />
        <MetricCard label="Avg engagement" icon={<Icon name="activity" />} value={<Mono>{avgEngagement}%</Mono>} delta={<Delta value="+3%" direction="up" />} context="feature mean" />
        <MetricCard label="Underutilized features" icon={<Icon name="alert-triangle" />} iconTone="warn" accent="neg" value={<Mono>{underutilized}</Mono>} delta={<Delta value="watch" direction="bad-up" />} context="<40% engagement" />
      </div>

      <Card padded>
        <header style={{ marginBottom: "var(--s-2)", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <h3 style={{ font: "var(--t-h3)", margin: 0 }}>Feature engagement — portfolio</h3>
          <ConfTag basis="fact" detail="adoption fixtures" />
        </header>
        <div style={{ width: "100%", height: 280 }}>
          <ResponsiveContainer>
            <BarChart layout="vertical" data={features} margin={{ top: 8, right: 12, bottom: 0, left: 24 }}>
              <CartesianGrid stroke="var(--viz-grid)" horizontal={false} />
              <XAxis type="number" stroke="var(--viz-axis)" fontSize={11} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
              <YAxis type="category" dataKey="name" stroke="var(--viz-axis)" fontSize={11} width={150} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `${v}%`} />
              <Bar dataKey="engagement" radius={[0, 6, 6, 0]}>
                {features.map((_, i) => (
                  <Cell key={i} fill={`var(--viz-${(i % 5) + 1})`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <DataTable
        title="Sub-account adoption breakdown"
        rows={rows}
        columns={[
          { key: "name", header: "Account", sortable: true },
          { key: "features", header: "Features", mono: true, align: "right", sortable: true },
          { key: "assets", header: "Assets", mono: true, align: "right", sortable: true },
          { key: "active", header: "Active", mono: true, align: "right", sortable: true },
          { key: "engagement", header: "Engagement", mono: true, align: "right", sortable: true, render: (r) => <Mono>{r.engagement}%</Mono> },
          { key: "top", header: "Top feature" },
        ]}
      />
    </div>
  );
}

function avgEng(a: Account): number {
  const fs = a.adoption.features;
  return fs.length ? Math.round(fs.reduce((s, f) => s + f.engagement, 0) / fs.length) : 0;
}

// ===========================================================================
// FEEDBACK
// ===========================================================================
function FeedbackView() {
  const withScore = live.filter((a) => a.feedback.npsScore != null && !Number.isNaN(a.feedback.npsScore));
  const promoters = withScore.reduce((s, a) => s + a.feedback.promoters, 0);
  const passives = withScore.reduce((s, a) => s + a.feedback.passives, 0);
  const detractors = withScore.reduce((s, a) => s + a.feedback.detractors, 0);
  const responses = promoters + passives + detractors;
  const nps = responses ? Math.round(((promoters - detractors) / responses) * 100) : 0;
  const widgetOn = live.filter((a) => a.feedback.widgetEnabled).length;
  const detractorAccts = live.filter((a) => a.feedback.sentiment === "negative").length;

  const sentimentBreak = [
    { sentiment: "positive", count: live.filter((a) => a.feedback.sentiment === "positive").length },
    { sentiment: "neutral", count: live.filter((a) => a.feedback.sentiment === "neutral").length },
    { sentiment: "negative", count: live.filter((a) => a.feedback.sentiment === "negative").length },
  ];

  const rows = live
    .slice()
    .sort((a, b) => a.feedback.npsScore - b.feedback.npsScore)
    .map((a) => ({
      id: a.identity.id,
      name: a.identity.name,
      nps: a.feedback.npsScore,
      sentiment: a.feedback.sentiment,
      promoters: a.feedback.promoters,
      detractors: a.feedback.detractors,
      last: a.feedback.lastFeedbackDate,
      widget: a.feedback.widgetEnabled,
    }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-4)" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "var(--s-3)" }}>
        <MetricCard label="NPS · portfolio" icon={<Icon name="message-circle" />} value={<Mono>{nps}</Mono>} delta={<Delta value="+4" direction="up" />} context="rolling" />
        <MetricCard label="Responses" icon={<Icon name="inbox" />} value={<Mono>{fmtNum(responses)}</Mono>} delta={<Delta value={`${promoters} promoters`} direction="up" />} context="all-time" />
        <MetricCard label="Detractor accounts" icon={<Icon name="frown" />} iconTone="neg" accent="neg" value={<Mono>{detractorAccts}</Mono>} delta={<Delta value={`${detractors} responses`} direction="bad-up" />} context="needs follow-up" />
        <MetricCard label="Widget enabled" icon={<Icon name="toggle-right" />} value={<Mono>{widgetOn}/{live.length}</Mono>} delta={<Delta value={fmtPct((widgetOn / Math.max(1, live.length)) * 100)} direction="flat" />} context="capture rate" />
      </div>

      <Card padded>
        <header style={{ marginBottom: "var(--s-2)" }}>
          <h3 style={{ font: "var(--t-h3)", margin: 0 }}>Sentiment distribution</h3>
        </header>
        <div style={{ width: "100%", height: 220 }}>
          <ResponsiveContainer>
            <BarChart data={sentimentBreak} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
              <CartesianGrid stroke="var(--viz-grid)" vertical={false} />
              <XAxis dataKey="sentiment" stroke="var(--viz-axis)" fontSize={11} />
              <YAxis stroke="var(--viz-axis)" fontSize={11} width={40} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {sentimentBreak.map((_, i) => (
                  <Cell key={i} fill={`var(--viz-${(i % 5) + 1})`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <DataTable
        title="Sub-account feedback breakdown"
        rows={rows}
        columns={[
          { key: "name", header: "Account", sortable: true },
          { key: "nps", header: "NPS", mono: true, align: "right", sortable: true },
          { key: "sentiment", header: "Sentiment", render: (r) => <Badge variant={r.sentiment === "negative" ? "danger" : r.sentiment === "positive" ? "pos" : "neutral"}>{r.sentiment}</Badge> },
          { key: "promoters", header: "Promoters", mono: true, align: "right", sortable: true },
          { key: "detractors", header: "Detractors", mono: true, align: "right", sortable: true },
          { key: "last", header: "Last response", render: (r) => r.last ? new Date(r.last).toISOString().slice(0, 10) : "—" },
          { key: "widget", header: "Widget", render: (r) => <Badge variant={r.widget ? "pos" : "neutral"}>{r.widget ? "on" : "off"}</Badge> },
        ]}
      />
    </div>
  );
}

// ===========================================================================
// SIGNALS — activation funnels, time-to-value, decay, lifecycle flow
// ===========================================================================
function SignalsView() {
  const navigate = useNavigate();

  // Activation funnel: % live who've completed each sticky setup (forward)
  const subjects: { key: string; label: string }[] = [
    { key: "Domain", label: "Domain connected" },
    { key: "A2P", label: "A2P approved" },
    { key: "Phone", label: "Phone provisioned" },
    { key: "Funnel", label: "Funnel published" },
    { key: "Workflow", label: "First workflow live" },
  ];

  const funnel = subjects.map((s) => {
    const completed = new Set(
      signals
        .filter((sig) => sig.subject === s.key && sig.sticky && sig.direction === "forward" && sig.type === "setup")
        .map((sig) => sig.accountId),
    );
    const reversed = new Set(
      signals
        .filter((sig) => sig.subject === s.key && sig.sticky && sig.direction === "reverse" && sig.type === "setup")
        .map((sig) => sig.accountId),
    );
    const stillForward = [...completed].filter((id) => !reversed.has(id));
    const pct = Math.round((stillForward.length / Math.max(1, live.length)) * 100);
    return { name: s.label, pct, completed: stillForward.length };
  });

  // Time-to-activate by lifecycle (proxy: activeDays for activated accounts)
  const activatedDays = live
    .filter((a) => a.lifecycle.stage === "activated")
    .map((a) => a.identity.activeDays);
  const ttv = median(activatedDays);
  const ttvP90 = percentile(activatedDays, 0.9);

  // Decay / reversal rates
  const lost = lostStickySetups();
  const fwdSticky = signals.filter((s) => s.sticky && s.direction === "forward" && s.type === "setup");
  const revSticky = signals.filter((s) => s.sticky && s.direction === "reverse" && s.type === "setup");
  const decayRate = fwdSticky.length ? Math.round((revSticky.length / fwdSticky.length) * 100) : 0;

  // Lifecycle / growth flow (Amplitude-style)
  const stages = ["onboarding", "activated", "established", "lapsing", "dormant", "churned"] as const;
  const lifecycleFlow = stages.map((stage) => ({
    stage,
    count: accounts.filter((a) => a.lifecycle.stage === stage).length,
    reactivated: accounts.filter((a) => a.lifecycle.stage === stage && a.lifecycle.reactivated).length,
  }));

  // 12-week reversal trend (sticky reverse signals bucketed weekly)
  const weeks: { week: string; lost: number; gained: number }[] = [];
  for (let w = 11; w >= 0; w--) {
    const start = w * 7;
    const end = (w - 1) * 7;
    const lostW = signals.filter(
      (s) => s.sticky && s.direction === "reverse" && s.type === "setup" && daysSince(s.detectedAt) > end && daysSince(s.detectedAt) <= start,
    ).length;
    const gainedW = signals.filter(
      (s) => s.sticky && s.direction === "forward" && s.type === "setup" && daysSince(s.detectedAt) > end && daysSince(s.detectedAt) <= start,
    ).length;
    weeks.push({ week: `W-${w}`, lost: lostW, gained: gainedW });
  }

  const dormantGrew = dormantGrowth();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-4)" }}>
      {/* Headline alarms */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "var(--s-3)" }}>
        <MetricCard label="Sticky setups lost · 30d" icon={<Icon name="unplug" />} iconTone="neg" accent="neg" value={<Mono>{lost.length}</Mono>} delta={<Delta value={`${revSticky.length} all-time`} direction="bad-up" />} context="alarm" />
        <MetricCard label="Decay rate" icon={<Icon name="trending-down" />} accent="neg" value={<Mono>{decayRate}%</Mono>} delta={<Delta value="reversal share" direction="bad-up" />} context="of forward sticky setups" />
        <MetricCard label="Dormant — growing" icon={<Icon name="bell" />} iconTone="warn" value={<Mono>{dormantGrew.length}</Mono>} delta={<Delta value="resurrection signal" direction="up" />} context="dormant accts with rising health" />
        <MetricCard label="Median time-to-activate" icon={<Icon name="rocket" />} value={<Mono>{fmtNum(ttv)}d</Mono>} delta={<Delta value={`p90 ${fmtNum(ttvP90)}d`} direction="flat" />} context="activated cohort" />
      </div>

      {/* Activation funnel */}
      <Card padded>
        <header style={{ marginBottom: "var(--s-2)", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <h3 style={{ font: "var(--t-h3)", margin: 0 }}>Activation funnel — % of clients with each sticky setup live</h3>
          <ConfTag basis="fact" detail="from signals fixture" />
        </header>
        <div style={{ width: "100%", height: 260 }}>
          <ResponsiveContainer>
            <BarChart layout="vertical" data={funnel} margin={{ top: 8, right: 12, bottom: 0, left: 24 }}>
              <CartesianGrid stroke="var(--viz-grid)" horizontal={false} />
              <XAxis type="number" stroke="var(--viz-axis)" fontSize={11} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
              <YAxis type="category" dataKey="name" stroke="var(--viz-axis)" fontSize={11} width={170} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `${v}%`} />
              <Bar dataKey="pct" radius={[0, 6, 6, 0]}>
                {funnel.map((_, i) => (
                  <Cell key={i} fill={`var(--viz-${(i % 5) + 1})`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Decay over time */}
      <Card padded>
        <header style={{ marginBottom: "var(--s-2)" }}>
          <h3 style={{ font: "var(--t-h3)", margin: 0 }}>Sticky setups — gained vs lost (12w)</h3>
        </header>
        <div style={{ width: "100%", height: 240 }}>
          <ResponsiveContainer>
            <AreaChart data={weeks} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="gainedFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--viz-2)" stopOpacity={0.30} />
                  <stop offset="100%" stopColor="var(--viz-2)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="lostFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--viz-4)" stopOpacity={0.30} />
                  <stop offset="100%" stopColor="var(--viz-4)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--viz-grid)" vertical={false} />
              <XAxis dataKey="week" stroke="var(--viz-axis)" fontSize={11} />
              <YAxis stroke="var(--viz-axis)" fontSize={11} width={40} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area dataKey="gained" stroke="var(--viz-2)" fill="url(#gainedFill)" strokeWidth={2} />
              <Area dataKey="lost" stroke="var(--viz-4)" fill="url(#lostFill)" strokeWidth={2} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Lifecycle / growth flow */}
      <Card padded>
        <header style={{ marginBottom: "var(--s-2)", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <h3 style={{ font: "var(--t-h3)", margin: 0 }}>Lifecycle / growth flow</h3>
          <ConfTag basis="fact" detail="new · resurrected · dormant" />
        </header>
        <div style={{ width: "100%", height: 240 }}>
          <ResponsiveContainer>
            <BarChart data={lifecycleFlow} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
              <CartesianGrid stroke="var(--viz-grid)" vertical={false} />
              <XAxis dataKey="stage" stroke="var(--viz-axis)" fontSize={11} />
              <YAxis stroke="var(--viz-axis)" fontSize={11} width={40} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="count" fill="var(--viz-1)" radius={[6, 6, 0, 0]} name="accounts" />
              <Bar dataKey="reactivated" fill="var(--viz-3)" radius={[6, 6, 0, 0]} name="resurrected" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Lost setups list */}
      <Card padded>
        <header style={{ marginBottom: "var(--s-2)", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <h3 style={{ font: "var(--t-h3)", margin: 0 }}>Accounts that lost a sticky setup · 30d</h3>
          <Button variant="ghost" onClick={() => navigate("/today")}>Send to Today →</Button>
        </header>
        {lost.length === 0 ? (
          <p style={{ color: "var(--text-muted)", margin: 0 }}>No reversals in window.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "var(--s-2)" }}>
            {lost.map((a) => {
              const sig = signals.find(
                (s) => s.accountId === a.identity.id && s.sticky && s.direction === "reverse" && s.type === "setup",
              );
              return (
                <li key={a.identity.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "var(--s-2)", border: "1px solid var(--border)", borderRadius: 8 }}>
                  <div>
                    <div style={{ font: "var(--t-body-strong)" }}>{a.identity.name}</div>
                    <div style={{ font: "var(--t-caption)", color: "var(--text-muted)" }}>
                      {sig?.label ?? "sticky setup lost"} · <Mono>${fmtNum(a.revenue.mrr)}</Mono>/mo
                    </div>
                  </div>
                  <Badge variant="danger">{sig ? `${daysSince(sig.detectedAt)}d ago` : "recent"}</Badge>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}

// ===========================================================================
// Helpers
// ===========================================================================
const tooltipStyle = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  color: "var(--text)",
  fontSize: 12,
} as const;

function median(nums: number[]): number {
  if (!nums.length) return 0;
  const sorted = nums.slice().sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

function percentile(nums: number[], p: number): number {
  if (!nums.length) return 0;
  const sorted = nums.slice().sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor(p * sorted.length));
  return sorted[idx];
}
