import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Button, Icon, Mono, Badge, FixItCard, ConfTag, SegmentedControl, Toggle } from "@gocsm/design-system";
import { autopilotStore, useAutopilotVersion } from "@/state/autopilot";
import { useHealthConfigured, healthConfigStore } from "@/state/healthConfig";
import { hasDraft } from "@/state/workflowDrafts";
import { useNotifyConfig, notifyStore, type NotifyChannel, type NotifyCadence } from "@/state/notifyConfig";
import { recommendedPlays, matchesToday, playbooks, mrrKind, MRR_KIND_NOUN, type Playbook, type RecommendedPlay } from "@/fixtures/playbooks";
import { triedButFailed, triedUnconfirmed, type Attempt } from "@/fixtures/attempts";

// AttentionPage (/today, /embed/attention) — the ACTION layer, redesigned (design-loop 2026-06-25).
// ONE adaptive page that drives playbook ACTIVATION first, then recedes into daily triage:
//   • Hero — the two stakes numbers (who needs me · $ at risk), each with a plain subtext.
//   • "Start here today" — a deterministically-ranked top 2–3 plays to turn on now, each an
//     URGENT card ($ at risk · named accounts · one-line reason · one-click "Turn it on").
//     The score is transparent (at-risk MRR × accounts); AI does the words, not the verdict.
//     This is the page's focal job; it RECEDES to a slim banner once ≥3 plays are live.
//   • "Step in" — accounts a play ran on but didn't fix, plus a "Notify me" escalation config
//     (Slack/Email/Asana · daily digest vs each · loop in the owner) so Mo isn't tied to /today.
//   • "More plays for your accounts" — the rest of the ranked list, quiet, → browse all 57.
// Phase-1 safe: recommendations exclude health-framed plays until Health is configured.

const fmtMoney = (n: number) => "$" + Math.round(n).toLocaleString();

// Named accounts behind a play (top by MRR) — "Acme, Bright LLC +2".
function namesFor(p: Playbook): string {
  const accts = [...matchesToday(p)].sort((a, b) => b.revenue.mrr - a.revenue.mrr);
  const shown = accts.slice(0, 2).map((a) => a.identity.name);
  const more = accts.length - shown.length;
  return shown.join(", ") + (more > 0 ? ` +${more} more` : "");
}

// ───────────────────────── Start here today ─────────────────────────
function StartHereCard({ rank, rec, focal, onActivate }: { rank: number; rec: RecommendedPlay; focal: boolean; onActivate: (id: string) => void }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  const { p, impact } = rec;
  const draft = hasDraft(p.id);
  const kind = mrrKind(p); // "risk" | "grow" | "renewal" — so we never call a milestone/renewal "at risk"
  return (
    <Card
      padded
      className={`sh-card${focal ? " focal" : ""}`}
      data-clickable="true"
      role="button"
      tabIndex={0}
      onClick={() => onActivate(p.id)}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onActivate(p.id)}
    >
      <div className="sh-card-top">
        <span className="sh-rank" aria-hidden>{rank}</span>
        {impact.mrr > 0 ? (
          <span className={`sh-stake ${kind}`}><Mono>{fmtMoney(impact.mrr)}</Mono> {MRR_KIND_NOUN[kind]}</span>
        ) : (
          <span className="sh-stake-soft"><Mono>{impact.count}</Mono> account{impact.count === 1 ? "" : "s"} now</span>
        )}
        <button type="button" className="sh-dismiss" aria-label="Not now" onClick={(e) => { e.stopPropagation(); setDismissed(true); }}>
          Not now
        </button>
      </div>
      <h3 className="sh-card-title">{p.title}</h3>
      <p className="sh-card-reason">{p.problem}</p>
      <p className="sh-card-accts"><Icon name="users" /> {impact.count} account{impact.count === 1 ? "" : "s"} · {namesFor(p)}</p>
      {focal ? (
        <p className="sh-why"><Icon name="award" /> Why it’s #1 — it’s the largest block of revenue any single playbook can act on today.</p>
      ) : null}
      <div className="sh-card-foot">
        <Button
          variant={focal ? "primary" : "ghost"}
          className={focal ? undefined : "btn-accent"}
          size="sm"
          iconRight={<Icon name="arrow-right" />}
          onClick={(e: React.MouseEvent) => { e.stopPropagation(); onActivate(p.id); }}
        >
          {draft ? "Resume setup" : "Turn it on"}
        </Button>
      </div>
    </Card>
  );
}

function StartHere({ recs, liveCount, totalAtRisk, onActivate, onBrowse }: { recs: RecommendedPlay[]; liveCount: number; totalAtRisk: number; onActivate: (id: string) => void; onBrowse: () => void }) {
  const top = recs.slice(0, 3);
  // $ these top plays cover — the union of their accounts (each counted once), so the
  // figure reads as a clean SUBSET of the hero total rather than an unexplained sum.
  const covered = useMemo(() => {
    const seen = new Set<string>();
    let m = 0;
    for (const r of top) for (const a of matchesToday(r.p)) { if (seen.has(a.identity.id)) continue; seen.add(a.identity.id); m += a.revenue.mrr; }
    return m;
  }, [top]);
  const heading = liveCount === 0 ? "Start here today" : "Turn on a couple more";
  const coversAll = covered >= totalAtRisk - 1;
  const [hero, rest] = [top[0], top.slice(1)];
  return (
    <section className="sh">
      <div className="sh-head">
        <span className="sh-eyebrow"><Icon name="target" /> {liveCount === 0 ? "Recommended · activate first" : "Recommended · next best"}</span>
        <h2 className="sh-title">{heading}</h2>
        <p className="sh-sub">
          {coversAll ? (
            <>Turn these on to cover all <span className="at-risk"><Mono>{fmtMoney(totalAtRisk)}</Mono></span> at risk — then they run automatically.</>
          ) : (
            <>Turn these on first — they cover <span className="at-risk"><Mono>{fmtMoney(covered)}</Mono></span> of your <Mono>{fmtMoney(totalAtRisk)}</Mono> at risk, then run automatically.</>
          )}
        </p>
      </div>
      <div className="sh-grid">
        {hero ? <StartHereCard key={hero.p.id} rank={1} rec={hero} focal onActivate={onActivate} /> : null}
        {rest.length > 0 ? (
          <div className="sh-grid-rest">
            {rest.map((r, i) => (
              <StartHereCard key={r.p.id} rank={i + 2} rec={r} focal={false} onActivate={onActivate} />
            ))}
          </div>
        ) : null}
      </div>
      <button type="button" className="sh-browse" onClick={onBrowse}>Browse all {playbooks.length} playbooks <Icon name="arrow-right" /></button>
    </section>
  );
}

function GraduatedBanner({ liveCount, remaining, onBrowse }: { liveCount: number; remaining: number; onBrowse: () => void }) {
  return (
    <div className="sh-graduated">
      <span className="sh-grad-l"><Icon name="check-circle" /> You're live — <Mono>{liveCount}</Mono> playbook{liveCount === 1 ? "" : "s"} running. Check back here for the accounts that still need you.</span>
      {remaining > 0 ? (
        <button type="button" className="sh-grad-more" onClick={onBrowse}>
          <Mono>{remaining}</Mono> more playbook{remaining === 1 ? "" : "s"} ready when you are <Icon name="arrow-right" />
        </button>
      ) : null}
    </div>
  );
}

// ───────────────────────── Step in (Job-B) + Notify ─────────────────────────
function ContactActions({ name }: { name: string }) {
  return (
    <span className="ai-actions">
      <a className="ai-act" href="tel:+15555550100"><Icon name="phone" /> Call</a>
      <a className="ai-act" href={`mailto:owner@example.com?subject=${encodeURIComponent(`Checking in — ${name}`)}`}><Icon name="mail" /> Email</a>
      <a className="ai-act" href="sms:+15555550100"><Icon name="message-square" /> SMS</a>
    </span>
  );
}

function JobBCard({ attempt, onOpen, healthConfigured }: { attempt: Attempt; onOpen: (id: string) => void; healthConfigured: boolean }) {
  const high = attempt.confidence === "high";
  const reason = high
    ? healthConfigured
      ? `${attempt.targetPillarLabel} still ${attempt.status === "worse" ? "falling" : "flat"} ${attempt.ranDaysAgo} day${attempt.ranDaysAgo === 1 ? "" : "s"} after “${attempt.playbookTitle}” ran.`
      : `“${attempt.playbookTitle}” ran ${attempt.ranDaysAgo} day${attempt.ranDaysAgo === 1 ? "" : "s"} ago — the issue is still open.`
    : `“${attempt.playbookTitle}” ran ${attempt.ranDaysAgo} day${attempt.ranDaysAgo === 1 ? "" : "s"} ago — outcome not yet confirmed.`;
  return (
    <Card padded className={high ? "accent-t risk" : undefined}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "var(--s-3)" }}>
        <span className={["icon-chip", high ? "risk" : "info"].join(" ")} aria-hidden>
          <Icon name={high ? "alert-triangle" : "clock"} />
        </span>
        <div style={{ flex: 1, minWidth: 220, display: "flex", flexDirection: "column", gap: 2 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--s-2)", flexWrap: "wrap" }}>
            <button type="button" onClick={() => onOpen(attempt.accountId)}
              style={{ border: 0, background: "transparent", padding: 0, cursor: "pointer", fontSize: "var(--t-body-lg)", fontWeight: 700, color: "var(--text)" }}>
              {attempt.accountName}
            </button>
            {high ? null : <ConfTag basis="guess" detail="unverified" />}
          </div>
          <span style={{ fontSize: "var(--t-body-sm)", color: "var(--text-2, var(--text))" }}>{reason}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--s-3)", flexWrap: "wrap" }}>
          <ContactActions name={attempt.accountName} />
          <Button variant="ghost" size="sm" iconRight={<Icon name="arrow-right" />} onClick={() => onOpen(attempt.accountId)}>
            Why
          </Button>
        </div>
      </div>
    </Card>
  );
}

const NOTIFY_CHANNELS: { id: NotifyChannel; label: string; icon: string; needsConnect: boolean }[] = [
  { id: "slack", label: "Slack", icon: "message-square", needsConnect: true },
  { id: "email", label: "Email", icon: "mail", needsConnect: false },
  { id: "asana", label: "Asana task", icon: "check-square", needsConnect: true },
];

function NotifyConfigCard({ digestCount }: { digestCount: number }) {
  const cfg = useNotifyConfig();
  const [open, setOpen] = useState(false);
  const chanNames = cfg.channels.map((c) => (c === "asana" ? "Asana" : c[0].toUpperCase() + c.slice(1)));
  const summary = cfg.channels.length
    ? `${cfg.cadence === "digest" ? `Daily digest at ${cfg.digestTime}` : "The moment it happens"} → ${chanNames.join(", ")}${cfg.notifyOwner ? " · owner looped in" : ""}`
    : "Off — you'll only see these here";
  return (
    <Card padded className="notify">
      <button type="button" className="notify-toggle" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <span className="notify-toggle-l"><Icon name="bell" /> Tell me when an account needs me</span>
        <span className="notify-summary">{summary} <Icon name={open ? "chevron-up" : "chevron-down"} /></span>
      </button>
      {open ? (
        <div className="notify-body">
          <div className="notify-row">
            <span className="notify-label">Send to</span>
            <div className="notify-chips">
              {NOTIFY_CHANNELS.map((ch) => {
                const on = cfg.channels.includes(ch.id);
                const connected = ch.needsConnect ? cfg.connected[ch.id as "slack" | "asana"] : true;
                return (
                  <button
                    key={ch.id}
                    type="button"
                    className={`notify-chip${on ? " on" : ""}${connected ? "" : " locked"}`}
                    onClick={() => (connected ? notifyStore.toggleChannel(ch.id) : notifyStore.connect(ch.id as "slack" | "asana"))}
                  >
                    <Icon name={ch.icon} /> {ch.label}
                    {connected ? (on ? <Icon name="check" /> : null) : <span className="notify-connect">Connect</span>}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="notify-row">
            <span className="notify-label">How often</span>
            <SegmentedControl
              options={[{ value: "digest", label: `Daily digest · ${cfg.digestTime}` }, { value: "each", label: "Each one" }]}
              value={cfg.cadence}
              onChange={(v: string) => notifyStore.set({ cadence: v as NotifyCadence })}
            />
          </div>
          <label className="notify-owner">
            <Toggle on={cfg.notifyOwner} onChange={(v: boolean) => notifyStore.set({ notifyOwner: v })} />
            <span>Also notify the account's owner <span className="notify-owner-chip">→ the account's owner</span></span>
          </label>
          {cfg.cadence === "digest" && cfg.channels.length > 0 ? (
            <div className="notify-preview"><Icon name="mail" /> You'll get: “Your daily Step-in digest — {digestCount} account{digestCount === 1 ? "" : "s"} automation couldn't fix.”</div>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}

// ───────────────────────── Page ─────────────────────────
export default function AttentionPage() {
  const navigate = useNavigate();
  const healthConfigured = useHealthConfigured();
  useAutopilotVersion(); // re-render when a play is activated / paused

  const live = autopilotStore.listOn();
  const recs = useMemo(
    () => recommendedPlays({ healthConfigured, isLive: (id) => autopilotStore.status(id) === "on" }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [healthConfigured, live.length],
  );

  // Stakes — unique sub-accounts that have an un-activated play matching them, and their MRR.
  const { needing, mrrAtRisk } = useMemo(() => {
    const seen = new Set<string>();
    let mrr = 0;
    for (const r of recs) for (const a of matchesToday(r.p)) { if (seen.has(a.identity.id)) continue; seen.add(a.identity.id); mrr += a.revenue.mrr; }
    return { needing: seen.size, mrrAtRisk: mrr };
  }, [recs]);

  const failed = useMemo(() => triedButFailed(), []);
  const unconfirmed = useMemo(() => triedUnconfirmed(), []);
  const jobB = [...failed, ...unconfirmed];

  const top = recs.slice(0, 3);
  const more = recs.slice(3, 3 + 6);
  const activation = live.length < 3 && top.length > 0;
  const onActivate = (id: string) => navigate(`/playbooks/${id}`);
  const onBrowse = () => navigate("/playbooks");

  return (
    <main className="today-main" style={{ maxWidth: 1080, margin: "0 auto", color: "var(--text)", display: "flex", flexDirection: "column" }}>
      {/* Hero — the page's thesis + the two stakes numbers. */}
      <header style={{ display: "flex", flexDirection: "column", gap: "var(--s-4)" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-2)" }}>
          <h1 style={{ fontSize: "var(--t-display-xl)", fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.05, margin: 0 }}>Needs attention</h1>
          <p style={{ margin: 0, fontSize: "var(--t-body-lg)", color: "var(--text-2, var(--text))", maxWidth: 640 }}>
            What’s happening across your sub-accounts right now — turn on a playbook to handle each one automatically.
          </p>
        </div>
        {needing > 0 ? (
          <div style={{ display: "flex", gap: "var(--s-8)", flexWrap: "wrap" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ fontSize: "var(--t-display-lg)", fontWeight: 750, lineHeight: 1, letterSpacing: "-0.01em" }}><Mono>{needing}</Mono></span>
              <span style={{ fontSize: "var(--t-body-sm)", color: "var(--text-3, var(--text))" }}>sub-account{needing === 1 ? "" : "s"} need attention</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span className="at-risk" style={{ fontSize: "var(--t-display-lg)", fontWeight: 750, lineHeight: 1, letterSpacing: "-0.01em" }}><Mono>{fmtMoney(mrrAtRisk)}</Mono></span>
              <span style={{ fontSize: "var(--t-body-sm)", color: "var(--text-3, var(--text))" }}>MRR at risk</span>
            </div>
          </div>
        ) : null}
      </header>

      {/* Start here today — the focal activation module; recedes to a slim banner once ≥3 are live. */}
      {top.length > 0 ? (
        <div style={{ marginTop: "var(--s-9)" }}>
          {activation ? (
            <StartHere recs={recs} liveCount={live.length} totalAtRisk={mrrAtRisk} onActivate={onActivate} onBrowse={onBrowse} />
          ) : (
            <GraduatedBanner liveCount={live.length} remaining={recs.length} onBrowse={onBrowse} />
          )}
        </div>
      ) : null}

      {/* Step in — a playbook ran but the account still needs a human. + how to be told. */}
      {jobB.length > 0 ? (
        <section style={{ marginTop: "var(--s-10)", display: "flex", flexDirection: "column", gap: "var(--s-4)" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <h2 style={{ fontSize: "var(--t-heading)", fontWeight: 700, margin: 0 }}>Step in — automation couldn’t fix this</h2>
            <p style={{ margin: 0, fontSize: "var(--t-body-sm)", color: "var(--text-3, var(--text))" }}>
              A playbook ran but the account still needs you. Reach them directly — or get told where you work, below.
            </p>
          </div>
          <NotifyConfigCard digestCount={jobB.length} />
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-2)" }}>
            {jobB.map((a) => (
              <JobBCard key={a.id} attempt={a} onOpen={(id) => navigate(`/accounts/${id}`)} healthConfigured={healthConfigured} />
            ))}
          </div>
        </section>
      ) : null}

      {/* More plays for your accounts — the rest of the ranked list, quiet. */}
      {!activation && top.length > 0 ? null : more.length > 0 ? (
        <section style={{ marginTop: "var(--s-10)", display: "flex", flexDirection: "column", gap: "var(--s-4)" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <h2 style={{ fontSize: "var(--t-heading)", fontWeight: 700, margin: 0 }}>More playbooks for your accounts</h2>
            <p style={{ margin: 0, fontSize: "var(--t-body-sm)", color: "var(--text-3, var(--text))" }}>Lower-stakes, but still worth turning on. Or browse the full library.</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-2)" }}>
            {more.map(({ p, impact }) => (
              <FixItCard
                key={p.id}
                icon={p.icon}
                tag={null}
                title={p.title}
                meta={p.problem}
                note={impact.mrr > 0 ? `${impact.count} account${impact.count === 1 ? "" : "s"} · ${fmtMoney(impact.mrr)} ${MRR_KIND_NOUN[mrrKind(p)]}` : `${impact.count} account${impact.count === 1 ? "" : "s"} now`}
                badge={hasDraft(p.id) ? <Badge variant="warn" dot={false}>Draft</Badge> : undefined}
                data-clickable="true"
                onClick={() => onActivate(p.id)}
                action={
                  <Button variant="ghost" size="sm" iconRight={<Icon name="arrow-right" />} onClick={(e: React.MouseEvent) => { e.stopPropagation(); onActivate(p.id); }}>
                    {hasDraft(p.id) ? "Resume" : "Set up"}
                  </Button>
                }
              />
            ))}
          </div>
        </section>
      ) : null}

      {/* Empty state — nothing matches today. */}
      {top.length === 0 && jobB.length === 0 ? (
        <Card padded style={{ marginTop: "var(--s-9)" }}>
          <p style={{ margin: 0, fontSize: "var(--t-body)", color: "var(--text-2, var(--text))" }}>Nothing needs attention right now — GoCSM is watching your sub-accounts.</p>
        </Card>
      ) : null}

      {/* Prototype-only control — flips Health Config (Phase 1 ⇆ Phase 2). Not customer-facing. */}
      <div style={{ marginTop: "var(--s-10)", paddingTop: "var(--s-4)", borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "var(--s-3)", flexWrap: "wrap" }}>
        <span style={{ fontSize: "var(--t-caption)", textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--text-3, var(--text))", fontWeight: 600 }}>Prototype preview</span>
        <span style={{ fontSize: "var(--t-body-sm)", color: "var(--text-2, var(--text))" }}>Health Config is {healthConfigured ? "on (Phase 2)" : "off (Phase 1)"}.</span>
        <Button variant="ghost" size="sm" icon={<Icon name={healthConfigured ? "toggle-right" : "toggle-left"} />} onClick={() => healthConfigStore.toggle()}>
          {healthConfigured ? "Turn Health off" : "Preview with Health on"}
        </Button>
      </div>
    </main>
  );
}
