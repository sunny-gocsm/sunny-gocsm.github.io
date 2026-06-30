import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Icon, Mono, Monogram, SegmentedControl, Toggle } from "@gocsm/design-system";
import { autopilotStore, useAutopilotVersion } from "@/state/autopilot";
import { useHealthConfigured, healthConfigStore } from "@/state/healthConfig";
import { hasDraft } from "@/state/workflowDrafts";
import { useNotifyConfig, notifyStore, type NotifyChannel, type NotifyCadence } from "@/state/notifyConfig";
import { recommendedPlays, playbookImpact, matchesToday, playbooks, mrrKind, type RecommendedPlay, type Playbook, type MrrKind } from "@/fixtures/playbooks";
import { triedButFailed, triedUnconfirmed, type Attempt } from "@/fixtures/attempts";
import type { Account } from "@/fixtures";
import { computeOrientation } from "@/fixtures/orientation";
import TodayHeadline from "@/components/today/TodayHeadline";
import PortfolioTiles from "@/components/today/PortfolioTiles";
import HealthNudge from "@/components/today/HealthNudge";

// AttentionPage (/today, /embed/attention) — the ACTION layer, redesigned for a state-driven
// LIFECYCLE (design-loop pass 3, 2026-06-25 — ui-ux-pro-max + frontend-design).
//
// The page is LIVE: at every point in the account lifecycle it pushes the ONE next product goal,
// in Karthik's exact priority order:
//   0 live        → activate the FIRST playbook (the single most urgent, by $ at stake).
//   1–2 live      → activate enough to reach 3 ("you're 2 of 3").
//   3 live, no report → set up the DAILY REPORT (so failures get reviewed without checking here).
//   report on + failures → surface the ISSUES (accounts a playbook couldn't fix) → call them.
//   always (3+)   → a quiet standing nudge to activate MORE playbooks.
//
// Signature: every playbook reads PROBLEM-FIRST — a coloured urgency rail + the money & accounts
// at stake (JetBrains Mono) as the eyebrow, the PROBLEM as the headline, a one-line elaboration
// beneath, one CTA. A dev "lifecycle" switcher (footer) simulates every state. Phase-1 safe.

const fmtMoney = (n: number) => "$" + Math.round(n).toLocaleString();
const acctsNeedYou = (n: number) => `${n} account${n === 1 ? "" : "s"} ${n === 1 ? "needs" : "need"} you`;
const STAKE_NOUN: Record<MrrKind, string> = { risk: "at risk", grow: "to grow", renewal: "up for renewal" };

function accountsFor(p: Playbook): Account[] {
  return [...matchesToday(p)].sort((a, b) => b.revenue.mrr - a.revenue.mrr);
}

// ───────────────────────── Dev lifecycle switcher ─────────────────────────
type SimId = "live" | "new" | "one" | "two" | "act" | "ready" | "issues" | "allset";
const SCENARIOS: { id: SimId; label: string; liveCount: number; digestOn: boolean; failures: number }[] = [
  { id: "live", label: "Live (real account state)", liveCount: -1, digestOn: false, failures: -1 },
  { id: "new", label: "① Brand new — 0 playbooks on", liveCount: 0, digestOn: false, failures: 0 },
  { id: "one", label: "② 1 on — first one live", liveCount: 1, digestOn: false, failures: 0 },
  { id: "two", label: "③ 2 on — building up", liveCount: 2, digestOn: false, failures: 0 },
  { id: "act", label: "④ An account needs you (report off)", liveCount: 2, digestOn: false, failures: 1 },
  { id: "ready", label: "⑤ 3 on — set up the daily report", liveCount: 3, digestOn: false, failures: 0 },
  { id: "issues", label: "⑥ Report on — accounts need you", liveCount: 3, digestOn: true, failures: 4 },
  { id: "allset", label: "⑦ All caught up", liveCount: 3, digestOn: true, failures: 0 },
];
const SIM_KEY = "gocsm.attn.sim.v1";
const loadSim = (): SimId => {
  try {
    return (localStorage.getItem(SIM_KEY) as SimId) || "new";
  } catch {
    return "new";
  }
};

// ───────────────────────── Logos (identity, low-text) ─────────────────────────
function LogoCluster({ accts, max = 4 }: { accts: Account[]; max?: number }) {
  const shown = accts.slice(0, max);
  const lead = accts.slice(0, 2).map((a) => a.identity.name).join(", ");
  const more = accts.length - Math.min(2, accts.length);
  return (
    <span className="at-who">
      <span className="at-logos" aria-hidden>
        {shown.map((a) => <Monogram key={a.identity.id} name={a.identity.name} size={22} className="at-logo" />)}
      </span>
      <span className="at-who-names">{lead}{more > 0 ? ` +${more} more` : ""}</span>
    </span>
  );
}

// ───────────────────────── Problem-first playbook card ─────────────────────────
function PlaybookCard({ rec, primary, live = false, onActivate }: { rec: RecommendedPlay; primary: boolean; live?: boolean; onActivate: (id: string) => void }) {
  const { p, impact } = rec;
  const draft = hasDraft(p.id);
  const kind = mrrKind(p);
  const accts = useMemo(() => accountsFor(p), [p]);
  return (
    <article
      className={`pb-card ${kind}${primary ? " primary" : ""}`}
      data-clickable="true"
      role="button"
      tabIndex={0}
      onClick={() => onActivate(p.id)}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onActivate(p.id)}
    >
      <div className="pb-eyebrow">
        <span className="pb-ico" aria-hidden><Icon name={p.icon} /></span>
        {impact.mrr > 0 ? (
          <span className="pb-stake">
            <strong className={`pb-money ${kind}`}><Mono>{fmtMoney(impact.mrr)}</Mono>/mo {STAKE_NOUN[kind]}</strong>
            <span className="pb-dot">·</span> <Mono>{impact.count}</Mono> account{impact.count === 1 ? "" : "s"}
          </span>
        ) : (
          <span className="pb-stake"><Mono>{impact.count}</Mono> account{impact.count === 1 ? "" : "s"} waiting</span>
        )}
      </div>
      <h3 className="pb-problem">{p.title}</h3>
      <p className="pb-elab">{p.problem}</p>
      <div className="pb-foot">
        <LogoCluster accts={accts} />
        {live ? (
          // Already activated — show it's live (the only permitted card-state change); no CTA.
          <span className="pb-live"><Icon name="check-circle" /> Live</span>
        ) : primary ? (
          <Button variant="primary" size="sm" iconRight={<Icon name="arrow-right" />}
            onClick={(e: React.MouseEvent) => { e.stopPropagation(); onActivate(p.id); }}>
            {draft ? "Resume setup" : "Turn it on"}
          </Button>
        ) : (
          // Secondary cards keep their full details but a quiet link, so only the hero holds the
          // single solid-blue action (the whole card is clickable anyway).
          <button type="button" className="pb-go" onClick={(e) => { e.stopPropagation(); onActivate(p.id); }}>
            {draft ? "Resume setup" : "Turn it on"} <Icon name="arrow-right" />
          </button>
        )}
      </div>
    </article>
  );
}

// ───────────────────────── Daily report (digest) ─────────────────────────
const NOTIFY_CHANNELS: { id: NotifyChannel; label: string; icon: string; needsConnect: boolean }[] = [
  { id: "email", label: "Email", icon: "mail", needsConnect: false },
  { id: "slack", label: "Slack", icon: "message-square", needsConnect: true },
  { id: "asana", label: "Asana", icon: "check-square", needsConnect: true },
];

function ReportOptions() {
  const cfg = useNotifyConfig();
  return (
    <div className="at-report-opts">
      <div className="at-opt-row">
        <span className="at-opt-label">Send to</span>
        <div className="at-chips">
          {NOTIFY_CHANNELS.map((ch) => {
            const on = cfg.channels.includes(ch.id);
            const connected = ch.needsConnect ? cfg.connected[ch.id as "slack" | "asana"] : true;
            return (
              <button key={ch.id} type="button" className={`at-chip${on ? " on" : ""}`}
                onClick={() => (connected ? notifyStore.toggleChannel(ch.id) : notifyStore.connect(ch.id as "slack" | "asana"))}>
                <Icon name={ch.icon} /> {ch.label}
                {connected ? (on ? <Icon name="check" /> : null) : <span className="at-chip-connect">Connect</span>}
              </button>
            );
          })}
        </div>
      </div>
      <div className="at-opt-row">
        <span className="at-opt-label">How often</span>
        <SegmentedControl
          options={[{ value: "digest", label: `Daily · ${cfg.digestTime}` }, { value: "each", label: "The moment it happens" }]}
          value={cfg.cadence}
          onChange={(v: string) => notifyStore.set({ cadence: v as NotifyCadence })}
        />
      </div>
      <label className="at-opt-owner">
        <Toggle on={cfg.notifyOwner} onChange={(v: boolean) => notifyStore.set({ notifyOwner: v })} />
        <span>Also notify the account’s owner</span>
      </label>
    </div>
  );
}

function ReportHero({ failures, onTurnOn }: { failures: number; onTurnOn: () => void }) {
  const [opts, setOpts] = useState(false);
  return (
    <article className="rep-card primary">
      <div className="pb-eyebrow">
        <span className="pb-ico report" aria-hidden><Icon name="bell" /></span>
        <span className="pb-stake report">Daily report · skip checking this page</span>
      </div>
      <h3 className="pb-problem">Get the accounts that need you, every morning</h3>
      <p className="pb-elab">
        We’ll email you each morning with the accounts that still need you — and only message you sooner if something can’t wait.
        {failures > 0 ? <> <span className="rep-count">{failures} already need{failures === 1 ? "s" : ""} a look.</span></> : null}
      </p>
      <div className="pb-foot">
        <div className="rep-actions">
          <Button variant="primary" size="sm" iconRight={<Icon name="arrow-right" />} onClick={onTurnOn}>Turn on daily report</Button>
          <button type="button" className="at-textlink" onClick={() => setOpts((o) => !o)}>More options <Icon name={opts ? "chevron-up" : "chevron-down"} /></button>
        </div>
      </div>
      {opts ? <ReportOptions /> : null}
    </article>
  );
}

function ReportConfirm() {
  const cfg = useNotifyConfig();
  const [edit, setEdit] = useState(false);
  const where = cfg.cadence === "digest" ? `every morning at ${cfg.digestTime}` : "the moment it happens";
  return (
    <div className="at-report-on">
      <div className="at-report-on-row">
        <span className="at-report-on-l"><Icon name="check-circle" /> Daily report on — {where}</span>
        <span className="at-report-on-r">
          <button type="button" className="at-textlink" onClick={() => setEdit((e) => !e)}>Edit <Icon name={edit ? "chevron-up" : "chevron-down"} /></button>
          <button type="button" className="at-textlink quiet" onClick={() => notifyStore.turnOff()}>Turn off</button>
        </span>
      </div>
      {edit ? <ReportOptions /> : null}
    </div>
  );
}

// ───────────────────────── Issues (a playbook ran, still needs a human) ─────────────────────────
function statusFor(a: Attempt): { label: string; tone: "risk" | "soft" } {
  if (a.confidence !== "high") return { label: "Checking results", tone: "soft" };
  return { label: a.status === "worse" ? "Getting worse" : "Not improving", tone: "risk" };
}

function IssueRow({ attempt, onOpen, healthConfigured }: { attempt: Attempt; onOpen: (id: string) => void; healthConfigured: boolean }) {
  const high = attempt.confidence === "high";
  const chip = statusFor(attempt);
  const days = `${attempt.ranDaysAgo} day${attempt.ranDaysAgo === 1 ? "" : "s"} ago`;
  const why = high
    ? healthConfigured
      ? `${attempt.targetPillarLabel} still ${attempt.status === "worse" ? "slipping" : "flat"} — GoCSM reached out ${days}`
      : attempt.status === "worse"
        ? `GoCSM reached out ${days} — and it’s getting worse`
        : `GoCSM reached out ${days} — still no change`
    : `GoCSM reached out ${days} — waiting to see if it worked`;
  return (
    <div className="iss-row">
      <Monogram name={attempt.accountName} size={34} />
      <div className="iss-body">
        <div className="iss-top">
          <span className="iss-name">{attempt.accountName}</span>
          <span className={`at-status ${chip.tone}`}>{chip.label}</span>
        </div>
        <span className="iss-why">{why}</span>
      </div>
      <div className="iss-actions">
        <a className="iss-call" href="tel:+15555550100" onClick={(e) => e.stopPropagation()}><Icon name="phone" /> Call</a>
        <button type="button" className="at-row-act" onClick={() => onOpen(attempt.accountId)}>Open <Icon name="arrow-right" /></button>
      </div>
    </div>
  );
}

// ───────────────────────── Section heading (used sparingly) ─────────────────────────
function SecHead({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="at-sec-head">
      <h2 className="at-sec-title">{title}</h2>
      {sub ? <p className="at-sec-sub">{sub}</p> : null}
    </div>
  );
}

// ───────────────────────── Page ─────────────────────────
export default function AttentionPage() {
  const navigate = useNavigate();
  const healthConfigured = useHealthConfigured();
  useAutopilotVersion();
  const cfg = useNotifyConfig();

  // Orientation layer data (the "book of business" + the day's problems). Computed here once and
  // shared by the headline + tiles. Wrapped so a compute failure degrades to fallbacks, not a
  // blank page. Phase-aware: Phase 2 fields (health/sentiment) only populate when configured.
  const orientation = useMemo(() => {
    try {
      return computeOrientation(healthConfigured);
    } catch {
      return null;
    }
  }, [healthConfigured]);

  const [sim, setSimRaw] = useState<SimId>(loadSim);
  const setSim = (s: SimId) => { setSimRaw(s); try { localStorage.setItem(SIM_KEY, s); } catch { /* ignore */ } };
  const scenario = SCENARIOS.find((s) => s.id === sim) ?? SCENARIOS[1];

  const recs = useMemo(
    () => recommendedPlays({ healthConfigured, isLive: (id) => autopilotStore.status(id) === "on" }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [healthConfigured, autopilotStore.listOn().length],
  );
  const jobBAll = useMemo(() => [...triedButFailed(), ...triedUnconfirmed()], []);

  // Effective lifecycle state — from the dev scenario, or the real stores in "live" mode.
  const digestOn = sim === "live" ? cfg.configured : scenario.digestOn;
  const failures = sim === "live" ? jobBAll : jobBAll.slice(0, Math.max(0, scenario.failures));

  // Split the plays into what's already LIVE vs the next to turn on. In "live" mode the live ones
  // come from the autopilot store (recs already excludes them); in a sim we treat the top-N
  // most-impactful recs as live.
  const livePlays: RecommendedPlay[] = sim === "live"
    ? autopilotStore.listOn()
        .map((id) => playbooks.find((p) => p.id === id))
        .filter((p): p is Playbook => !!p)
        .map((p) => ({ p, impact: playbookImpact(p) }))
    : recs.slice(0, Math.max(0, scenario.liveCount));
  const turnOnPlays: RecommendedPlay[] = sim === "live" ? recs : recs.slice(Math.max(0, scenario.liveCount));
  const liveCount = livePlays.length;

  const onActivate = (id: string) => navigate(`/playbooks/${id}`);
  const onBrowse = () => navigate("/playbooks");
  const onOpen = (id: string) => navigate(`/accounts/${id}`);
  const onTurnOnReport = () => { notifyStore.turnOn(); if (sim !== "live") setSim(failures.length > 0 ? "issues" : "allset"); };

  // Precedence (top → bottom): a manual action the user must take always wins, and if the daily
  // report isn't set up yet that nudge sits ABOVE the action list (so they never miss one). The
  // activation only LEADS while still reaching 3 with nothing more urgent in play.
  const needsAction = failures.length > 0;
  const showReportSetup = !digestOn && (needsAction || liveCount >= 3);
  const showIssues = needsAction;
  const activationLeads = liveCount < 3 && !showReportSetup && !showIssues;
  const allCaughtUp = liveCount >= 3 && digestOn && !needsAction;

  const goal = showReportSetup
    ? needsAction
      ? `${acctsNeedYou(failures.length)} — set up your daily report so you never miss one.`
      : "Your playbooks are running. Set up your daily report so you never miss an account that needs you."
    : showIssues
      ? `${acctsNeedYou(failures.length)} today — a playbook ran but couldn’t fix them.`
      : allCaughtUp
        ? "You’re all caught up. GoCSM is watching every account."
        : liveCount === 0
          ? "Turn on your first playbook — GoCSM starts protecting these accounts automatically."
          : `You’re ${liveCount} of 3. Turn on ${3 - liveCount} more and GoCSM runs your book for you.`;

  const explore = <button type="button" className="at-textlink" onClick={onBrowse}>Explore all {playbooks.length} playbooks <Icon name="arrow-right" /></button>;

  // Activation block. While still reaching 3 (and nothing more urgent), it's the focal stack: the
  // live ones (shown as Live) + the next to turn on (the hero) — the path to 3. Otherwise it recedes
  // to a quiet "Turn on a few more" (always the next 2 once 3+ are live, per Karthik's rule).
  let activation: React.ReactNode = null;
  if (activationLeads) {
    const toTurnOn = turnOnPlays.slice(0, 3 - liveCount);
    activation = (
      <section className="at-mod">
        <div className="pb-stack">
          {livePlays.map((r) => <PlaybookCard key={r.p.id} rec={r} primary={false} live onActivate={onActivate} />)}
          {toTurnOn.map((r, i) => <PlaybookCard key={r.p.id} rec={r} primary={i === 0} onActivate={onActivate} />)}
        </div>
        {explore}
      </section>
    );
  } else {
    const toTurnOn = turnOnPlays.slice(0, liveCount < 3 ? 3 - liveCount : 2);
    if (toTurnOn.length > 0) {
      activation = (
        <section className="at-mod">
          <SecHead title="Turn on a few more" sub="Each one handles another group of accounts for you." />
          <div className="pb-stack">
            {toTurnOn.map((r) => <PlaybookCard key={r.p.id} rec={r} primary={false} onActivate={onActivate} />)}
          </div>
          {explore}
        </section>
      );
    }
  }

  return (
    <main className="at-page">
      {/* Layer 0 — the daily landing + AI orientation headline (book of business + the problems
          that matter). The headline streams in async; tiles + queue render immediately. */}
      <header className="at-header">
        <h1 className="at-h1">Today</h1>
        {orientation ? <TodayHeadline data={orientation} /> : null}
      </header>

      {/* Layer 1 — "Your book of business": the KPI tiles that give the queue a denominator. */}
      <PortfolioTiles data={orientation} />

      {/* Phase-1 only: one quiet, dismissible nudge to set up Health (unlocks Phase 2). */}
      {!healthConfigured ? <HealthNudge /> : null}

      {/* Layer 2 — the existing state-driven Needs-attention queue, now below the orientation. */}
      <section className="at-queue">
        <SecHead title="Needs attention" sub={allCaughtUp ? undefined : goal} />
        <div className="at-stack">
        {/* 1 — set up the daily report so the user never misses an action. Tops the page whenever
            there's an action to take (and it's not set up), and once 3+ playbooks are live. */}
        {showReportSetup ? <section className="at-mod"><ReportHero failures={failures.length} onTurnOn={onTurnOnReport} /></section> : null}

        {/* 2 — the manual actions the user must take. */}
        {showIssues ? (
          <section className="at-mod">
            <SecHead title="Accounts that need you" sub="A playbook already ran on these — but they still need you. Reach out directly." />
            <div className="iss-list">
              {failures.map((a) => <IssueRow key={a.id} attempt={a} onOpen={onOpen} healthConfigured={healthConfigured} />)}
            </div>
          </section>
        ) : null}

        {/* 3 — rewarded "all caught up" (nothing urgent, report on). */}
        {allCaughtUp ? (
          <article className="at-allset">
            <span className="at-allset-ico" aria-hidden><Icon name="check-circle" /></span>
            <h2 className="at-allset-title">You’re all caught up</h2>
            <p className="at-allset-sub">Nothing needs you right now.</p>
          </article>
        ) : null}

        {/* 4 — activation: leads while reaching 3, else the standing "turn on a few more". */}
        {activation}

        {/* 5 — daily report on: slim confirm at the bottom. */}
        {digestOn && !showReportSetup ? <ReportConfirm /> : null}
        </div>
      </section>

      {/* Prototype-only controls — lifecycle switcher + Health phase toggle. Not customer-facing. */}
      <div className="at-dev">
        <span className="at-dev-tag">Preview</span>
        <label className="at-dev-field">
          <span>Lifecycle state</span>
          <select className="at-dev-select" value={sim} onChange={(e) => setSim(e.target.value as SimId)}>
            {SCENARIOS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </label>
        <Button variant="ghost" size="sm" icon={<Icon name={healthConfigured ? "toggle-right" : "toggle-left"} />} onClick={() => healthConfigStore.toggle()}>
          Health {healthConfigured ? "on" : "off"}
        </Button>
      </div>
    </main>
  );
}
