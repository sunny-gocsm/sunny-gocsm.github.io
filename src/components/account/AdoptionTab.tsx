import { useMemo, useState } from "react";
import { Badge, Card, DataTable, MetricCard, Mono, Tabs, ConfTag, Icon } from "@/gocsm-ds";
import type { Account, AdoptionFeature, AssetType } from "@/fixtures";

const ALL_ASSET_TYPES: AssetType[] = [
  "Workflow",
  "Calendar",
  "Opportunity",
  "BusinessProfile",
  "Phone",
  "Email",
  "WebsiteFunnel",
  "Dashboard",
  "Course",
  "Community",
  "Facebook",
  "Reputation",
  "Payment",
  "CustomMenuLink",
];

const engagementBand = (e: number): "pos" | "blue" | "warn" | "danger" =>
  e >= 70 ? "pos" : e >= 50 ? "blue" : e >= 30 ? "warn" : "danger";

const engagementLabel = (e: number): string =>
  e >= 70 ? "Strong" : e >= 50 ? "Steady" : e >= 30 ? "Underused" : "Dormant";

const fmtMins = (m: number) => (m >= 60 ? `${Math.round(m / 60)}h` : `${Math.round(m)}m`);

interface FeatureRow extends AdoptionFeature {
  id: string;
  adoption: number; // activeAssetCount / assetCount
}

interface AssetRow {
  id: string;
  type: AssetType;
  total: number;
  active: number;
  accounts: number;
  users: number;
  adoption: number;
}

export function AdoptionTab({ account }: { account: Account }) {
  const [sub, setSub] = useState<"features" | "assets">("features");
  const { adoption } = account;

  const featureRows: FeatureRow[] = useMemo(
    () =>
      adoption.features.map((f, i) => ({
        ...f,
        id: `${account.identity.id}-f-${i}`,
        adoption: f.assetCount ? Math.round((f.activeAssetCount / f.assetCount) * 100) : 0,
      })),
    [adoption.features, account.identity.id],
  );

  // Derive asset rows from feature engagement when seed assets are empty.
  const assetRows: AssetRow[] = useMemo(() => {
    if (adoption.assets.length) {
      return adoption.assets.map((a, i) => ({
        id: `${account.identity.id}-a-${i}`,
        type: a.type,
        total: 1,
        active: 1,
        accounts: a.accounts.length,
        users: a.users.length,
        adoption: 100,
      }));
    }
    return ALL_ASSET_TYPES.map((type) => {
      const f = adoption.features.find((x) => x.name === type);
      const total = f ? f.assetCount : Math.round(2 + (type.length % 5));
      const active = f ? f.activeAssetCount : Math.round(total * 0.2);
      return {
        id: `${account.identity.id}-at-${type}`,
        type,
        total,
        active,
        accounts: f ? 1 : 0,
        users: f ? Math.max(1, Math.round(f.engagement / 25)) : 0,
        adoption: total ? Math.round((active / total) * 100) : 0,
      };
    });
  }, [adoption, account.identity.id]);

  const top = featureRows
    .filter((f) => adoption.topFeatures.includes(f.name) || f.engagement >= 70)
    .sort((a, b) => b.engagement - a.engagement);
  const under = featureRows
    .filter((f) => adoption.underutilizedFeatures.includes(f.name) || f.engagement < 35)
    .sort((a, b) => a.engagement - b.engagement);

  const totalFeatures = featureRows.length;
  const activeFeatures = featureRows.filter((f) => f.engagement >= 40).length;
  const totalAssets = assetRows.reduce((s, r) => s + r.total, 0);
  const activeAssets = assetRows.reduce((s, r) => s + r.active, 0);
  const adoptionPct = totalAssets ? Math.round((activeAssets / totalAssets) * 100) : 0;

  const lowData = totalFeatures < 3;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-5)" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "var(--s-3)",
        }}
      >
        <MetricCard
          label="Features in use"
          value={
            <span>
              <Mono>{activeFeatures}</Mono> / <Mono>{totalFeatures}</Mono>
            </span>
          }
          icon={<Icon name="layers" />}
          iconTone="info"
        />
        <MetricCard
          label="Assets active"
          value={
            <span>
              <Mono>{activeAssets}</Mono> / <Mono>{totalAssets}</Mono>
            </span>
          }
          icon={<Icon name="box" />}
          iconTone="info"
        />
        <MetricCard
          label="Adoption"
          value={<Mono>{adoptionPct}%</Mono>}
          icon={<Icon name="bar-chart-2" />}
          iconTone={adoptionPct >= 50 ? "pos" : adoptionPct >= 25 ? "warn" : "neg"}
          accent={adoptionPct < 25 ? "neg" : null}
        />
      </div>

      <Tabs
        tabs={[
          { id: "features", label: "Features" },
          { id: "assets", label: "Assets" },
        ]}
        active={sub}
        onChange={(id) => setSub(id as "features" | "assets")}
      />

      {sub === "features" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-4)" }}>
          {/* Top + Underutilized strips */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "var(--s-3)",
            }}
          >
            <Card padded>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-2)" }}>
                <span style={{ font: "var(--t-meta)", textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--text-3, var(--text))" }}>
                  Top features
                </span>
                {top.length ? (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--s-2)" }}>
                    {top.map((f) => (
                      <Badge key={f.name} variant="pos" dot>
                        {f.name} · <Mono>{f.engagement}</Mono>
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <span style={{ font: "var(--t-body)", color: "var(--text-2, var(--text))" }}>
                    No standouts yet — usage is still finding its shape.
                  </span>
                )}
              </div>
            </Card>
            <Card padded>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-2)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--s-2)" }}>
                  <span style={{ font: "var(--t-meta)", textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--text-3, var(--text))" }}>
                    Underutilized features
                  </span>
                  <ConfTag basis="projection" detail="adoption gap" />
                </div>
                {under.length ? (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--s-2)" }}>
                    {under.map((f) => (
                      <Badge key={f.name} variant="warn" dot>
                        {f.name} · <Mono>{f.engagement}</Mono>
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <span style={{ font: "var(--t-body)", color: "var(--pos-7)" }}>
                    ✓ Nothing underutilized — adoption is even.
                  </span>
                )}
                <span style={{ font: "var(--t-meta)", color: "var(--text-3, var(--text))" }}>
                  Feeds the adoption-gap Playbook.
                </span>
              </div>
            </Card>
          </div>

          <DataTable<FeatureRow>
            rows={featureRows}
            stickyHeader
            defaultSort={{ key: "engagement", dir: "desc" }}
            columns={[
              { key: "name", header: "Feature", sortable: true },
              {
                key: "assetCount",
                header: "Assets",
                sortable: true,
                mono: true,
                align: "right",
                render: (r) => (
                  <Mono>
                    {r.activeAssetCount}/{r.assetCount}
                  </Mono>
                ),
              },
              {
                key: "engagement",
                header: "Engagement",
                sortable: true,
                mono: true,
                align: "right",
                render: (r) => <Mono>{r.engagement}</Mono>,
              },
              {
                key: "adoption",
                header: "Adoption",
                sortable: true,
                render: (r) => (
                  <Badge variant={engagementBand(r.engagement)} dot>
                    {engagementLabel(r.engagement)}
                  </Badge>
                ),
              },
              {
                key: "timeSpent",
                header: "Time · 30d",
                sortable: true,
                mono: true,
                align: "right",
                render: (r) => <Mono>{fmtMins(r.timeSpent)}</Mono>,
              },
            ]}
            empty={
              <span style={{ color: "var(--text-2, var(--text))" }}>
                No feature usage yet — once they start clicking around, you'll see it here.
              </span>
            }
          />
          {lowData ? (
            <span style={{ font: "var(--t-meta)", color: "var(--text-3, var(--text))" }}>
              <ConfTag basis="projection" detail={`${totalFeatures} feature(s) sampled`} /> Limited data — figures may shift as more usage lands.
            </span>
          ) : null}
        </div>
      ) : (
        <DataTable<AssetRow>
          rows={assetRows}
          stickyHeader
          defaultSort={{ key: "active", dir: "desc" }}
          columns={[
            { key: "type", header: "Asset type", sortable: true },
            {
              key: "active",
              header: "Active",
              sortable: true,
              mono: true,
              align: "right",
              render: (r) => (
                <Mono>
                  {r.active}/{r.total}
                </Mono>
              ),
            },
            {
              key: "adoption",
              header: "Adoption",
              sortable: true,
              render: (r) => (
                <Badge variant={engagementBand(r.adoption)} dot>
                  <Mono>{r.adoption}%</Mono>
                </Badge>
              ),
            },
            {
              key: "users",
              header: "Users",
              sortable: true,
              mono: true,
              align: "right",
              render: (r) => <Mono>{r.users}</Mono>,
            },
            {
              key: "accounts",
              header: "Workspaces",
              sortable: true,
              mono: true,
              align: "right",
              render: (r) => <Mono>{r.accounts}</Mono>,
            },
          ]}
          empty={
            <span style={{ color: "var(--text-3, var(--text))" }}>
              No assets recorded yet.
            </span>
          }
        />
      )}
    </div>
  );
}
