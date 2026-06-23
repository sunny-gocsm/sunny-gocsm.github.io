import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { AppShell, Rail } from "@gocsm/design-system";

// Embed mode (HighLevel custom-menu-link embeds): when the page is first loaded under
// /embed/* we render the SAME pages with NO left nav — so each link embeds as a bare page
// (no "menu inside a menu"). Evaluated once at load; each HighLevel menu link is its own
// iframe, so the flag stays fixed for that iframe even as the user navigates within it.
const IS_EMBED = typeof window !== "undefined" && window.location.pathname.startsWith("/embed");

const GROUPS = [
  {
    items: [
      { id: "today", label: "Attention", icon: "bell" },
      { id: "accounts", label: "Accounts", icon: "users" },
      { id: "playbooks", label: "Playbooks", icon: "book-open" },
      { id: "onboarding", label: "Onboarding", icon: "rocket" },
      { id: "money", label: "Money", icon: "wallet" },
      { id: "outcomes", label: "Outcomes", icon: "award" },
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
  outcomes: "/outcomes",
  insights: "/insights",
  configure: "/configure",
};


function activeId(pathname: string): string {
  if (pathname === "/" || pathname.startsWith("/today")) return "today";
  if (pathname.startsWith("/accounts")) return "accounts";
  if (pathname.startsWith("/playbooks")) return "playbooks";
  if (pathname.startsWith("/onboarding")) return "onboarding";
  if (pathname.startsWith("/money")) return "money";
  if (pathname.startsWith("/outcomes")) return "outcomes";
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

  // Bare page for embeds — no Rail, no mobile bar, just the brand stripe + the page.
  if (IS_EMBED) {
    return (
      <div className="embed-shell">
        <div className="topbar" />
        <Outlet />
      </div>
    );
  }

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
