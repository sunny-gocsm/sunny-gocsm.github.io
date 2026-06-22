import { useMemo, useState } from "react";
import { Badge, DataTable, MetricCard, Mono, ConfTag, Icon } from "@/gocsm-ds";
import type { Account, LoginUser, ActivityStatus } from "@/fixtures";
import { daysSince, TODAY } from "@/fixtures";

type UserActivity = ActivityStatus; // highly|moderately|low|ghosting

const ACTIVITY_VARIANT: Record<UserActivity, "pos" | "blue" | "warn" | "danger"> = {
  highly: "pos",
  moderately: "blue",
  low: "warn",
  ghosting: "danger",
};

const ACTIVITY_LABEL: Record<UserActivity, string> = {
  highly: "Highly active",
  moderately: "Moderately active",
  low: "Low activity",
  ghosting: "Ghosting",
};

function userActivity(u: LoginUser): UserActivity {
  const d = daysSince(u.lastLogin);
  if (d <= 3 && u.timeSpent >= 60) return "highly";
  if (d <= 10) return "moderately";
  if (d <= 30) return "low";
  return "ghosting";
}

// Derive a 12-week mini login history from lastLogin + timeSpent.
function deriveHistory(u: LoginUser): number[] {
  if (u.history && u.history.length) return u.history.map((h) => h.minutes);
  const avg = Math.max(1, Math.round(u.timeSpent / 4));
  const d = daysSince(u.lastLogin);
  const decay = d > 21 ? 0.35 : d > 10 ? 0.7 : 1;
  return Array.from({ length: 12 }, (_, i) => {
    const noise = ((i * 7) % 5) - 2;
    return Math.max(0, Math.round(avg * decay + noise));
  });
}

function MiniSpark({ values }: { values: number[] }) {
  if (!values.length) return null;
  const w = 80;
  const h = 22;
  const max = Math.max(...values, 1);
  const step = w / Math.max(1, values.length - 1);
  const pts = values
    .map((v, i) => `${(i * step).toFixed(1)},${(h - (v / max) * h).toFixed(1)}`)
    .join(" ");
  return (
    <svg width={w} height={h} role="img" aria-label="Login history" style={{ display: "block" }}>
      <polyline
        fill="none"
        stroke="var(--text-3, currentColor)"
        strokeOpacity={0.7}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        points={pts}
      />
    </svg>
  );
}

const fmtMins = (m: number) => (m >= 60 ? `${Math.round(m / 60)}h` : `${Math.round(m)}m`);
const fmtDays = (d: number) => (d <= 0 ? "Today" : d === 1 ? "1d ago" : `${d}d ago`);

interface UserRow extends LoginUser {
  id: string;
  activity: UserActivity;
  lastLoginDays: number;
  historyValues: number[];
}

export function LoginTab({ account }: { account: Account }) {
  const { login } = account;
  const [roleFilter, setRoleFilter] = useState<"all" | "owner" | "admin" | "user">("all");
  const [keyOnly, setKeyOnly] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | UserActivity>("all");
  const [selected, setSelected] = useState<(string | number)[]>([]);

  const rows: UserRow[] = useMemo(
    () =>
      login.users.map((u, i) => ({
        ...u,
        id: `${account.identity.id}-u-${i}`,
        activity: userActivity(u),
        lastLoginDays: daysSince(u.lastLogin),
        historyValues: deriveHistory(u),
      })),
    [login.users, account.identity.id],
  );

  const filtered = rows.filter(
    (r) =>
      (roleFilter === "all" || r.role === roleFilter) &&
      (!keyOnly || r.keyUser) &&
      (statusFilter === "all" || r.activity === statusFilter),
  );

  const overallVariant: "pos" | "blue" | "warn" | "danger" = ACTIVITY_VARIANT[login.activityStatus];
  const lowData = login.users.length <= 1;

  // Single worst metric per tab (R8).
  type WorstKey = "lastLogin" | "active" | "time" | null;
  const worst: WorstKey =
    login.lastLoginDaysAgo > 30
      ? "lastLogin"
      : login.activeUsers <= 1
      ? "active"
      : login.totalLoggedInTime < 60
      ? "time"
      : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-5)" }}>
      {/* Summary metrics */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "var(--s-3)",
        }}
      >
        <MetricCard
          label="Active users"
          value={<Mono>{login.activeUsers}</Mono>}
          icon={<Icon name="users" />}
          iconTone={login.activeUsers <= 1 ? "warn" : "info"}
          accent={worst === "active" ? "neg" : null}
        />
        <MetricCard
          label="Total logged-in time · 30d"
          value={<Mono>{fmtMins(login.totalLoggedInTime)}</Mono>}
          icon={<Icon name="clock" />}
          iconTone={login.totalLoggedInTime < 60 ? "warn" : "info"}
          accent={worst === "time" ? "neg" : null}
        />
        <MetricCard
          label="Last login"
          value={<span>{fmtDays(login.lastLoginDaysAgo)}</span>}
          icon={<Icon name="log-in" />}
          iconTone={login.lastLoginDaysAgo > 30 ? "neg" : login.lastLoginDaysAgo > 10 ? "warn" : "info"}
          accent={worst === "lastLogin" ? "neg" : null}
        />
      </div>

      {/* Account-level activity status */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--s-3)",
          flexWrap: "wrap",
        }}
      >
        <span style={{ font: "var(--t-meta)", textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--text-3, var(--text))" }}>
          Activity status
        </span>
        <Badge variant={overallVariant} dot>
          {ACTIVITY_LABEL[login.activityStatus]}
        </Badge>
        {lowData ? <ConfTag basis="projection" detail="single-user sample" /> : null}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", alignItems: "center", gap: "var(--s-2)", flexWrap: "wrap" }}>
        <span style={{ font: "var(--t-meta)", color: "var(--text-3, var(--text))" }}>Role</span>
        {(["all", "owner", "admin", "user"] as const).map((r) => (
          <Badge
            key={r}
            variant={roleFilter === r ? "blue" : "neutral"}
            dot={false}
            onClick={() => setRoleFilter(r)}
            style={{ cursor: "pointer" }}
          >
            {r === "all" ? "All" : r}
          </Badge>
        ))}
        <span style={{ width: 1, height: 18, background: "var(--border)", margin: "0 var(--s-2)" }} />
        <Badge
          variant={keyOnly ? "warn" : "neutral"}
          dot={false}
          onClick={() => setKeyOnly((v) => !v)}
          style={{ cursor: "pointer" }}
        >
          ★ Key users only
        </Badge>
        <span style={{ width: 1, height: 18, background: "var(--border)", margin: "0 var(--s-2)" }} />
        <span style={{ font: "var(--t-meta)", color: "var(--text-3, var(--text))" }}>Status</span>
        {(["all", "highly", "moderately", "low", "ghosting"] as const).map((s) => (
          <Badge
            key={s}
            variant={statusFilter === s ? "blue" : "neutral"}
            dot={false}
            onClick={() => setStatusFilter(s)}
            style={{ cursor: "pointer" }}
          >
            {s === "all" ? "All" : s}
          </Badge>
        ))}
      </div>

      <DataTable<UserRow>
        rows={filtered}
        selectable
        selectedIds={selected}
        onSelectionChange={setSelected}
        stickyHeader
        defaultSort={{ key: "lastLoginDays", dir: "asc" }}
        columns={[
          { key: "name", header: "User", sortable: true },
          {
            key: "role",
            header: "Role",
            sortable: true,
            render: (r) => <Badge variant="neutral" dot={false}>{r.role}</Badge>,
          },
          {
            key: "keyUser",
            header: "Key",
            sortAccessor: (r) => (r.keyUser ? 1 : 0),
            sortable: true,
            align: "center",
            render: (r) => (r.keyUser ? <span title="Key user">★</span> : <span style={{ opacity: 0.3 }}>·</span>),
          },
          {
            key: "lastLoginDays",
            header: "Last login",
            sortable: true,
            align: "right",
            render: (r) => <span>{fmtDays(r.lastLoginDays)}</span>,
          },
          {
            key: "timeSpent",
            header: "Time · 30d",
            sortable: true,
            mono: true,
            align: "right",
            render: (r) => <Mono>{fmtMins(r.timeSpent)}</Mono>,
          },
          {
            key: "activity",
            header: "Status",
            sortable: true,
            render: (r) => (
              <Badge variant={ACTIVITY_VARIANT[r.activity]} dot>
                {ACTIVITY_LABEL[r.activity]}
              </Badge>
            ),
          },
          {
            key: "history",
            header: "History",
            render: (r) => <MiniSpark values={r.historyValues} />,
          },
        ]}
        empty={
          <span style={{ color: "var(--text-2, var(--text))" }}>
            No users in this slice — try a wider filter to see the whole team.
          </span>
        }
      />
      <span style={{ font: "var(--t-meta)", color: "var(--text-3, var(--text))" }}>
        Anchored to <Mono>{TODAY.toISOString().slice(0, 10)}</Mono>.
      </span>
    </div>
  );
}
