import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { AppShell, Rail } from "@/gocsm-ds";

const GROUPS = [
  {
    items: [
      { id: "today", label: "Attention", icon: "bell" },
      { id: "accounts", label: "Accounts", icon: "users" },
      { id: "playbooks", label: "Playbooks", icon: "book-open" },
      { id: "onboarding", label: "Onboarding", icon: "rocket" },
      { id: "money", label: "Money", icon: "wallet" },
    ],
  },
  {
    label: "Insights",
    items: [
      { id: "insights", label: "Insights", icon: "bar-chart-2" },
    ],
  },
  {
    label: "Setup",
    items: [{ id: "configure", label: "Configure", icon: "settings" }],
  },
];

const PATH_FOR: Record<string, string> = {
  today: "/today",
  accounts: "/accounts",
  playbooks: "/playbooks",
  onboarding: "/onboarding",
  money: "/money",
  insights: "/insights",
  configure: "/configure",
};


function activeId(pathname: string): string {
  if (pathname === "/" || pathname.startsWith("/today")) return "today";
  if (pathname.startsWith("/accounts")) return "accounts";
  if (pathname.startsWith("/playbooks")) return "playbooks";
  if (pathname.startsWith("/onboarding")) return "onboarding";
  if (pathname.startsWith("/money")) return "money";
  if (pathname.startsWith("/insights")) return "insights";
  if (pathname.startsWith("/configure")) return "configure";
  return "today";
}


const Logo = (
  <span
    style={{
      font: "var(--t-h6)",
      letterSpacing: "0.02em",
      color: "var(--text)",
    }}
  >
    GoCSM
  </span>
);

export default function AppLayout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const active = activeId(pathname);

  return (
    <AppShell
      logo={Logo}
      rail={
        <Rail
          groups={GROUPS}
          active={active}
          onNavigate={(id: string) => navigate(PATH_FOR[id] ?? "/")}
          logo={Logo}
        />
      }
    >
      <Outlet />
    </AppShell>
  );
}
