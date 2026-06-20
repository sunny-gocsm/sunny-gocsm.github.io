import { useEffect, useRef, useState } from "react";
import { Mono, Icon, ConfTag } from "@/gocsm-ds";
import type { Account } from "@/fixtures";
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
// MatchWall — the narrowing-as-guidance mechanic. The matching accounts render as
// a literal wall of tiles; as the criteria tighten, excluded tiles physically fade
// and collapse out (the motion is the lesson, not a ticking count). A composition
// strip shows what's in the set right now (re-skews as it shrinks → cues the next
// filter), and a confidence-gated 7-day forecast shows who's about to qualify.
//
// App prototype; promoted to the design system once the interaction is locked.
// ---------------------------------------------------------------------------

type WallTile = { a: Account; exiting: boolean };

/** Keep removed tiles around briefly so they animate out before unmounting. */
function useAnimatedWall(matched: Account[]): WallTile[] {
  const [display, setDisplay] = useState<WallTile[]>(() => matched.map((a) => ({ a, exiting: false })));
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const key = matched.map((a) => a.identity.id).join(",");

  useEffect(() => {
    const nextIds = new Set(matched.map((a) => a.identity.id));
    setDisplay((prev) => {
      const present = prev.filter((t) => !t.exiting);
      const removed = present
        .filter((t) => !nextIds.has(t.a.identity.id))
        .map((t) => ({ a: t.a, exiting: true }));
      const staying: WallTile[] = matched.map((a) => ({ a, exiting: false }));
      return [...staying, ...removed];
    });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setDisplay((prev) => prev.filter((t) => !t.exiting)), 360);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return display;
}

const bandDot: Record<string, string> = {
  atrisk: "var(--neg-7, #c0392b)",
  watch: "var(--warn-7, #b8860b)",
  healthy: "var(--pos-7, #1e874b)",
  thriving: "var(--pos-7, #1e874b)",
};
const fmtMoney = (n: number) => "$" + Math.round(n).toLocaleString();

function AccountTile({ a, exiting }: WallTile) {
  const atRisk = a.health.band === "atrisk";
  return (
    <div
      className="mw-tile"
      data-exiting={exiting ? "true" : undefined}
      style={{
        borderLeft: `3px solid ${bandDot[a.health.band] ?? "var(--border)"}`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
        <span
          aria-hidden
          style={{ width: 7, height: 7, borderRadius: "50%", background: bandDot[a.health.band], flex: "0 0 auto" }}
        />
        <span
          style={{
            fontSize: "var(--t-body-sm)",
            fontWeight: 600,
            color: "var(--text)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {a.identity.name}
        </span>
      </div>
      <span style={{ fontSize: "var(--t-caption)", color: atRisk && a.revenue.mrr > 0 ? "var(--neg-7)" : "var(--text-3, var(--text))" }}>
        {fmtMoney(a.revenue.mrr)}
      </span>
    </div>
  );
}

function CompositionStrip({ accounts }: { accounts: Account[] }) {
  const bars = composition(accounts);
  if (bars.length === 0) return null;
  const toneColor: Record<string, string> = {
    neg: "var(--neg-6, #e07a6a)",
    warn: "var(--warn-6, #e0c067)",
    pos: "var(--pos-6, #6cc090)",
    neutral: "var(--blue-4, #9db8e0)",
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-2)" }}>
      {bars.map((bar) => (
        <div key={bar.dim} style={{ display: "flex", alignItems: "center", gap: "var(--s-2)" }}>
          <span style={{ fontSize: "var(--t-caption)", color: "var(--text-3, var(--text))", width: 52, flex: "0 0 auto" }}>
            {bar.dim}
          </span>
          <div style={{ display: "flex", flex: 1, height: 8, borderRadius: 999, overflow: "hidden", background: "var(--surface-2, #eef1f6)" }}>
            {bar.parts.map((p, i) => (
              <div
                key={i}
                title={`${p.label} · ${p.pct}%`}
                style={{ width: `${p.pct}%`, background: toneColor[p.tone], transition: "width 360ms cubic-bezier(0.2,0.7,0.2,1)" }}
              />
            ))}
          </div>
          <span style={{ fontSize: "var(--t-caption)", color: "var(--text-3, var(--text))", minWidth: 0 }}>
            {bar.parts[0] ? `${bar.parts[0].pct}% ${bar.parts[0].label}` : ""}
          </span>
        </div>
      ))}
    </div>
  );
}

function ForecastStrip({ entries }: { entries: ForecastEntry[] }) {
  const high = entries.filter((e) => e.confidence === "high");
  const lowOnly = entries.length > 0 && high.length === 0;
  const shown = (high.length > 0 ? high : entries).slice(0, 6);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-2)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--s-2)" }}>
        <span style={{ fontSize: "var(--t-caption)", letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--text-3, var(--text))" }}>
          Likely to qualify · next 7 days
        </span>
        {lowOnly ? <ConfTag basis="guess" detail="early movement" /> : null}
      </div>
      {entries.length === 0 ? (
        <span style={{ fontSize: "var(--t-caption)", color: "var(--text-3, var(--text))", fontStyle: "italic" }}>
          Not enough trend data yet to forecast — we'll show this as accounts start moving.
        </span>
      ) : (
        <div className="mw-grid">
          {shown.map((e) => (
            <div key={e.account.identity.id} className="mw-tile mw-ghost">
              <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                <Icon name="trending-down" />
                <span style={{ fontSize: "var(--t-body-sm)", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {e.account.identity.name}
                </span>
              </div>
              <span style={{ fontSize: "var(--t-caption)", color: "var(--text-3, var(--text))" }}>~{e.etaDays}d</span>
            </div>
          ))}
        </div>
      )}
      {lowOnly ? (
        <span style={{ fontSize: "var(--t-caption)", color: "var(--text-3, var(--text))", fontStyle: "italic" }}>
          Low confidence — based on limited recent movement.
        </span>
      ) : null}
    </div>
  );
}

export function MatchWall({ set }: { set: CriteriaSet }) {
  const matched = matchAccounts(set);
  const tiles = useAnimatedWall(matched);
  const forecast = forecast7d(set);
  const n = matched.length;
  const overFloor = n > 0 && n <= INVENTORY_FLOOR;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-4)" }}>
      {/* Now header + composition */}
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-3)" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "var(--s-2)" }}>
          <span style={{ fontSize: "var(--t-display-lg)", fontWeight: 700, lineHeight: 1, color: "var(--text)" }}>
            <Mono>{n}</Mono>
          </span>
          <span style={{ fontSize: "var(--t-body)", color: "var(--text-2, var(--text))" }}>
            account{n === 1 ? "" : "s"} match now
          </span>
        </div>
        <CompositionStrip accounts={matched} />
      </div>

      {/* The wall */}
      {n === 0 ? (
        <div style={{ padding: "var(--s-5)", borderRadius: "var(--r-md)", background: "var(--surface-2, #f4f6fa)", textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: "var(--t-body)", color: "var(--text-2, var(--text))" }}>
            No accounts match — your filters are too tight. Remove the last one to bring the wall back.
          </p>
        </div>
      ) : (
        <div className="mw-grid">
          {tiles.map((t) => (
            <AccountTile key={t.a.identity.id} a={t.a} exiting={t.exiting} />
          ))}
        </div>
      )}

      {overFloor ? (
        <div style={{ display: "flex", alignItems: "center", gap: "var(--s-2)", fontSize: "var(--t-caption)", color: "var(--warn-7, #b8860b)" }}>
          <Icon name="alert-triangle" />
          <span>Only {n} left — narrowing further risks an empty list.</span>
        </div>
      ) : null}

      {/* 7-day forecast */}
      <div style={{ borderTop: "1px solid var(--border)", paddingTop: "var(--s-3)" }}>
        <ForecastStrip entries={forecast} />
      </div>

      {/* Plain-English summary (HubSpot Breeze pattern) */}
      <p style={{ margin: 0, fontSize: "var(--t-caption)", color: "var(--text-3, var(--text))", fontStyle: "italic" }}>
        {describeSet(set)}.
      </p>
    </div>
  );
}
