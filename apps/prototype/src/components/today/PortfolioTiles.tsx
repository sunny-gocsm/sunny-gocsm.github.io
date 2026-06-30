import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { StatCard, Icon, Mono } from "@gocsm/design-system";
import { bandLabel } from "@/fixtures";
import type { OrientationData } from "@/fixtures/orientation";

// Layer 1 — "Your book of business". A scannable grid of KPI tiles that give the day's
// problems a denominator. Each tile drills into the Insights page that owns the detail.
//
// Phase 1 tiles use HL-native signals only (no Health vocabulary). Phase 2 ADDS a health
// distribution bar, revenue-at-risk and sentiment — the Phase 1 tiles are unchanged.
//
// WoW deltas are deliberately SUPPRESSED: the prototype's fixtures hold no prior-period
// snapshot, and the prompt is explicit — show a delta only when real prior data exists, never
// fabricate one (AccountsPage's hardcoded "+4%" is exactly what we avoid here).

const money = (n: number): string => "$" + Math.round(n).toLocaleString();

type Tone = "neutral" | "pos" | "neg" | "warn" | "brand";

/** One KPI tile with built-in error isolation: a non-finite primary value degrades ONLY this
 *  tile to an "unavailable" card, never the whole layer. (Skeleton state is wired too, for when
 *  a tile is fed from a future async source — fixtures resolve synchronously, so it's unused now.) */
function Tile(props: {
  label: string;
  icon: string;
  primary: number; // raw number used for the health check
  value: ReactNode;
  caption?: ReactNode;
  secondary?: ReactNode;
  tone?: Tone;
  to: string;
  state?: "ok" | "loading";
}) {
  const navigate = useNavigate();
  const { label, icon, primary, value, caption, secondary, tone = "neutral", to, state = "ok" } = props;

  if (state === "loading") {
    return (
      <div className="stat-card td-tile-sk" aria-hidden>
        <span className="skeleton" style={{ height: 12, width: "60%" }} />
        <span className="skeleton" style={{ height: 26, width: "45%" }} />
        <span className="skeleton" style={{ height: 12, width: "70%" }} />
      </div>
    );
  }
  if (!Number.isFinite(primary)) {
    return (
      <div className="stat-card td-tile-error">
        <span className="sc-label">
          <Icon name={icon} /> {label}
        </span>
        <span className="sc-value td-muted">—</span>
        <span className="sc-caption">Couldn’t load — open the report</span>
      </div>
    );
  }
  return (
    <StatCard
      label={label}
      icon={icon}
      value={value}
      caption={caption}
      secondary={secondary}
      tone={tone}
      onClick={() => navigate(to)}
    />
  );
}

function HealthDistro({ data, onClick }: { data: NonNullable<OrientationData["health"]>; onClick: () => void }) {
  const total = data.distribution.reduce((s, d) => s + d.count, 0) || 1;
  return (
    <button type="button" className="stat-card clickable td-distro" onClick={onClick}>
      <span className="sc-label">
        <Icon name="activity" /> Health distribution
      </span>
      <div className="td-distro-bar" role="img" aria-label="Accounts by health band">
        {data.distribution.map((d) =>
          d.count > 0 ? (
            <span
              key={d.band}
              className={`td-seg band-${d.band}`}
              style={{ width: `${(d.count / total) * 100}%` }}
              title={`${bandLabel(d.band)} · ${d.count}`}
            />
          ) : null,
        )}
      </div>
      <div className="td-distro-legend">
        {data.distribution.map((d) => (
          <span key={d.band} className="td-leg">
            <span className={`td-dot band-${d.band}`} aria-hidden />
            {bandLabel(d.band)} <Mono>{d.count}</Mono>
          </span>
        ))}
      </div>
    </button>
  );
}

export default function PortfolioTiles({ data }: { data: OrientationData | null }) {
  const navigate = useNavigate();

  // Whole-layer fallback — the compute threw upstream.
  if (!data) {
    return (
      <section className="today-tiles" aria-label="Your book of business">
        <div className="stat-card td-tile-error">
          <span className="sc-value td-muted">—</span>
          <span className="sc-caption">Your book of business is unavailable right now.</span>
        </div>
      </section>
    );
  }

  // Brand-new agency / nothing tracked yet — route to setup rather than render empty tiles.
  if (data.accounts.live === 0) {
    return (
      <section className="today-tiles" aria-label="Your book of business">
        <button type="button" className="stat-card clickable td-brandnew" onClick={() => navigate("/configure")}>
          <span className="sc-label">
            <Icon name="rocket" /> Get started
          </span>
          <span className="sc-value" style={{ fontSize: "var(--t-subheading)" }}>
            Connect your sub-accounts
          </span>
          <span className="sc-caption">
            Once GoCSM is tracking accounts, your book of business shows up here.
          </span>
        </button>
      </section>
    );
  }

  const t = data;
  const noPayments = t.payments.count === 0;

  return (
    <section className="today-tiles" aria-label="Your book of business">
      <span className="today-tiles-label">Your book of business</span>

      {t.phase2 && t.health ? <HealthDistro data={t.health} onClick={() => navigate("/accounts")} /> : null}

      <div className="today-tiles-grid">
        <Tile
          label="MRR under management"
          icon="wallet"
          primary={t.mrr}
          value={<Mono>{money(t.mrr)}</Mono>}
          caption={`across ${t.accounts.live} live accounts`}
          to="/money"
        />
        <Tile
          label="Accounts"
          icon="users"
          primary={t.accounts.tracked}
          value={<Mono>{t.accounts.tracked}</Mono>}
          secondary={
            t.accounts.tracked < t.accounts.total ? (
              <>of <Mono>{t.accounts.total}</Mono> total</>
            ) : (
              "all tracked"
            )
          }
          to="/accounts"
        />
        <Tile
          label="Active users · 30d"
          icon="user-check"
          primary={t.activeUsers.active}
          value={<Mono>{t.activeUsers.active}</Mono>}
          secondary={
            t.activeUsers.active < t.activeUsers.total ? (
              <>of <Mono>{t.activeUsers.total}</Mono> total</>
            ) : (
              "all active"
            )
          }
          to="/insights/login"
        />
        <Tile
          label="Login health"
          icon="log-in"
          primary={t.loginAccounts.active}
          value={<Mono>{t.loginAccounts.active}</Mono>}
          caption="accounts active in 30d"
          secondary={<><Mono>{t.loginAccounts.dormant}</Mono> dormant</>}
          to="/insights/login"
        />
        <Tile
          label="Payment issues"
          icon={noPayments ? "check-circle" : "alert-triangle"}
          primary={t.payments.count}
          value={<Mono>{t.payments.count}</Mono>}
          tone={noPayments ? "pos" : "neg"}
          secondary={noPayments ? "All payments current" : <>{money(t.payments.pastDue)} past due</>}
          to="/money"
        />
        <Tile
          label="Renewals · 90d"
          icon="calendar-clock"
          primary={t.renewals.count}
          value={<Mono>{t.renewals.count}</Mono>}
          secondary={<>{money(t.renewals.value)} value</>}
          to="/money"
        />

        {t.phase2 && t.health ? (
          <Tile
            label="Revenue at risk"
            icon="alert-triangle"
            primary={t.health.revenueAtRisk}
            value={<Mono>{money(t.health.revenueAtRisk)}</Mono>}
            tone="neg"
            secondary={<><Mono>{t.health.revenueAtRiskCount}</Mono> accounts</>}
            to="/accounts"
          />
        ) : null}
        {t.phase2 && t.sentiment ? (
          <Tile
            label="Sentiment · NPS"
            icon="smile"
            primary={t.sentiment.nps}
            value={<Mono>{t.sentiment.nps}</Mono>}
            tone={t.sentiment.nps >= 0 ? "pos" : "neg"}
            secondary={
              t.sentiment.negativeCount > 0 ? (
                <><Mono>{t.sentiment.negativeCount}</Mono> recent negative</>
              ) : (
                "no recent negatives"
              )
            }
            to="/insights/feedback"
          />
        ) : null}
      </div>
    </section>
  );
}
