import { useState } from "react";
import { Mono, Icon, ConfTag, StackedBar, AccountRow } from "@gocsm/design-system";
import { allAccounts } from "@/fixtures";
import {
  matchAccounts,
  composition,
  forecast7d,
  describeSet,
  INVENTORY_FLOOR,
  type CriteriaSet,
  type ForecastEntry,
} from "@/fixtures/criteriaMatch";

// ---------------------------------------------------------------------------
// MatchWall — the live "who matches" preview. Matching accounts render as a scannable
// list of ROWS (monogram · health pill · full name · right-aligned MRR) — never a tile
// grid that truncates names. A big live count + a breadth meter ("too broad → focused →
// too narrow") convey the shrinking wall; a confidence-gated 7-day forecast shows who's
// about to qualify as faded ghost rows below a divider.
// ---------------------------------------------------------------------------

const fmtMoney = (n: number) => "$" + Math.round(n).toLocaleString();
const liveTotal = allAccounts().filter((a) => a.status.enabled === "Enabled" && a.lifecycle.stage !== "churned").length;

const HEALTH_LABEL: Record<string, string> = { atrisk: "At-Risk", watch: "Watch", healthy: "Healthy", thriving: "Thriving" };

// Breadth verdict — the Meta-style "is this the right size?" signal layered on the count.
function BreadthMeter({ count }: { count: number }) {
  const ratio = liveTotal > 0 ? count / liveTotal : 0;
  const verdict = count === 0 ? "Empty" : count <= INVENTORY_FLOOR ? "Too narrow" : ratio > 0.66 ? "Too broad" : "Focused";
  const tone = verdict === "Focused" ? "pos" : verdict === "Too broad" ? "warn" : "neg";
  const pos = Math.max(2, Math.min(98, ratio * 100));
  return (
    <div className="bm">
      <div className="bm-track">
        <span className="bm-zone narrow" />
        <span className="bm-zone focused" />
        <span className="bm-zone broad" />
        <span className="bm-marker" style={{ left: `${pos}%` }} />
      </div>
      <div className="bm-labels">
        <span className="bm-anchor">Narrow</span>
        <span className={["bm-verdict", tone].join(" ")}>{verdict}</span>
        <span className="bm-anchor">Broad</span>
      </div>
    </div>
  );
}

function SectionHead({ label, count }: { label: string; count: number }) {
  return (
    <div className="mw-sec-head">
      <span className="mw-sec-label">{label}</span>
      <span className="mw-sec-count"><Mono>{count}</Mono></span>
    </div>
  );
}

function ForecastRows({ entries }: { entries: ForecastEntry[] }) {
  const high = entries.filter((e) => e.confidence === "high");
  const lowOnly = entries.length > 0 && high.length === 0;
  const shown = (high.length > 0 ? high : entries).slice(0, 6);

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: "var(--s-2)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--s-2)" }}>
        <SectionHead label="Likely to qualify this week" count={entries.length} />
        {lowOnly ? <ConfTag basis="guess" detail="early movement" /> : null}
      </div>
      {entries.length === 0 ? (
        <span style={{ fontSize: "var(--t-caption)", color: "var(--text-3, var(--text))", fontStyle: "italic" }}>
          Not enough trend data yet to forecast — we'll show this as accounts start moving.
        </span>
      ) : (
        <div className="mw-rows">
          {shown.map((e) => (
            <AccountRow
              key={e.account.identity.id}
              muted
              name={e.account.identity.name}
              band={e.account.health.band}
              bandLabel={HEALTH_LABEL[e.account.health.band]}
              value={fmtMoney(e.account.revenue.mrr)}
              trailing={<span className="soon-badge"><Icon name="clock" />~{e.etaDays}d</span>}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export function MatchWall({ set }: { set: CriteriaSet }) {
  const matched = matchAccounts(set);
  const forecast = forecast7d(set);
  const n = matched.length;
  const overFloor = n > 0 && n <= INVENTORY_FLOOR;
  const sorted = [...matched].sort((a, b) => b.revenue.mrr - a.revenue.mrr);
  const VISIBLE = 12;
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? sorted : sorted.slice(0, VISIBLE);
  const moreCount = sorted.length - visible.length;
  const healthBar = composition(matched)[0]; // the action-relevant Health distribution

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-5)" }}>
      {/* Live count + breadth verdict */}
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-3)" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "var(--s-2)" }}>
          <span style={{ fontSize: "var(--t-display-lg)", fontWeight: 700, lineHeight: 1, color: "var(--text)" }}>
            <Mono>{n}</Mono>
          </span>
          <span style={{ fontSize: "var(--t-body)", color: "var(--text-2, var(--text))" }}>
            account{n === 1 ? "" : "s"} match now
          </span>
        </div>
        <BreadthMeter count={n} />
        {healthBar ? (
          <div style={{ display: "flex", alignItems: "center", gap: "var(--s-2)" }}>
            <span style={{ fontSize: "var(--t-caption)", color: "var(--text-3, var(--text))", width: 48, flex: "0 0 auto" }}>Health</span>
            <div style={{ flex: 1 }}>
              <StackedBar segments={healthBar.parts.map((p) => ({ pct: p.pct, tone: p.tone, label: p.label }))} />
            </div>
            <span style={{ fontSize: "var(--t-caption)", color: "var(--text-3, var(--text))" }}>
              {healthBar.parts[0] ? `${healthBar.parts[0].pct}% ${healthBar.parts[0].label}` : ""}
            </span>
          </div>
        ) : null}
      </div>

      {/* Matches now — rows */}
      {n === 0 ? (
        <div style={{ padding: "var(--s-5)", borderRadius: "var(--r-md)", background: "var(--surface-2, #f4f6fa)", textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: "var(--t-body)", color: "var(--text-2, var(--text))" }}>
            No accounts match — your filters are too tight. Loosen the last one to bring the list back.
          </p>
        </div>
      ) : (
        <section style={{ display: "flex", flexDirection: "column", gap: "var(--s-2)" }}>
          <SectionHead label="Matches now" count={n} />
          <div className="mw-rows">
            {visible.map((a) => (
              <AccountRow
                key={a.identity.id}
                name={a.identity.name}
                band={a.health.band}
                bandLabel={HEALTH_LABEL[a.health.band]}
                value={fmtMoney(a.revenue.mrr)}
              />
            ))}
            {moreCount > 0 ? (
              <button type="button" className="mw-more" onClick={() => setShowAll(true)}>
                View all {sorted.length} <Icon name="chevron-down" />
              </button>
            ) : null}
          </div>
          {overFloor ? (
            <div style={{ display: "flex", alignItems: "center", gap: "var(--s-2)", fontSize: "var(--t-caption)", color: "var(--warn-7, #b8860b)" }}>
              <Icon name="alert-triangle" />
              <span>Only {n} left — narrowing further risks an empty list.</span>
            </div>
          ) : null}
        </section>
      )}

      {/* 7-day forecast — ghost rows */}
      <div style={{ borderTop: "1px solid var(--border)", paddingTop: "var(--s-4)" }}>
        <ForecastRows entries={forecast} />
      </div>

      {/* Plain-English summary */}
      <p style={{ margin: 0, fontSize: "var(--t-caption)", color: "var(--text-3, var(--text))", fontStyle: "italic" }}>
        {describeSet(set)}.
      </p>
    </div>
  );
}
