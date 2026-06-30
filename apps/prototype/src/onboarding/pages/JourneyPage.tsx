import { useEffect, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { useNavigate, useRouterState } from "@onb/router-compat";
import { useSearchParams } from "react-router-dom";
import { PageHeader } from "@onb/components/shell/PageHeader";
import { JourneyEditor } from "@onb/components/onboarding/JourneyEditor";
import { SetupWizard } from "@onb/components/onboarding/SetupWizard";
import { JourneySummary } from "@onb/components/onboarding/JourneySummary";
import { cloneTemplate } from "@onb/lib/templates";
import {
  getCurrentJourney,
  STANDARD_GHL_JOURNEY,
  type Journey,
} from "@onb/lib/types";

// The journey builder. The WIZARD (SetupWizard) is the primary interface for
// brand-new users; a CONFIGURED user lands on JourneySummary and jumps into the
// wizard at any step to edit. A dev toggle flips between the two states so the
// new-vs-returning distinction can be demoed. The legacy JourneyEditor remains
// reachable as the "advanced editor" for power features.
type DevMode = "new" | "configured";
type View = "wizard" | "summary" | "advanced";
const DEV_KEY = "gocsm.onb.devmode.v1";

function loadDevMode(): DevMode {
  try {
    const v = localStorage.getItem(DEV_KEY);
    if (v === "new" || v === "configured") return v;
  } catch {
    /* ignore */
  }
  return "new";
}

const freshJourney = (): Journey => cloneTemplate("standard");
const configuredJourney = (): Journey => getCurrentJourney() ?? STANDARD_GHL_JOURNEY;

function JourneyTabPage() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [searchParams] = useSearchParams();
  // A ?step=<id> deep-link from the dashboard opens the advanced per-step editor.
  const stepParam = searchParams.get("step") ?? undefined;

  const [devMode, setDevMode] = useState<DevMode>(() => (stepParam ? "configured" : loadDevMode()));
  const [journey, setJourney] = useState<Journey>(() =>
    loadDevMode() === "new" && !stepParam ? freshJourney() : configuredJourney(),
  );
  const [view, setView] = useState<View>(() =>
    stepParam ? "advanced" : loadDevMode() === "new" ? "wizard" : "summary",
  );
  const [editingStep, setEditingStep] = useState(1);

  useEffect(() => {
    if (stepParam) navigate({ to: "/onboarding/journey", search: {}, replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function switchMode(m: DevMode) {
    setDevMode(m);
    try {
      localStorage.setItem(DEV_KEY, m);
    } catch {
      /* ignore */
    }
    setJourney(m === "new" ? freshJourney() : configuredJourney());
    setEditingStep(1);
    setView(m === "new" ? "wizard" : "summary");
  }

  const tabs = [
    {
      id: "overview",
      label: "Overview",
      active: pathname === "/onboarding",
      onClick: () => navigate({ to: "/onboarding" }),
    },
    {
      id: "journey",
      label: "Journey",
      active: pathname.startsWith("/onboarding/journey"),
      onClick: () => navigate({ to: "/onboarding/journey" }),
    },
  ];

  return (
    <>
      <PageHeader title="Onboarding" tabs={tabs} />
      <div style={{ marginTop: 16, paddingBottom: 56 }}>
        {view === "advanced" ? (
          <>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setView(devMode === "new" ? "wizard" : "summary")}
              style={{ color: "var(--text-2)", marginBottom: 12 }}
            >
              <ChevronLeft size={14} aria-hidden style={{ marginRight: 2 }} />
              Back
            </button>
            <JourneyEditor
              initialJourney={journey}
              initialStepId={stepParam}
              onRedoSetup={() => {
                setEditingStep(1);
                setView("wizard");
              }}
            />
          </>
        ) : view === "wizard" ? (
          <SetupWizard
            journey={journey}
            initialStep={editingStep}
            onChange={setJourney}
            onExit={devMode === "configured" ? () => setView("summary") : undefined}
            onPublished={(j) => {
              setJourney(j);
              setView("summary");
            }}
          />
        ) : (
          <JourneySummary
            journey={journey}
            onEdit={(s) => {
              setEditingStep(s);
              setView("wizard");
            }}
            onAdvanced={() => setView("advanced")}
          />
        )}
      </div>

      <DevBar mode={devMode} onChange={switchMode} />
    </>
  );
}

/* Dev-only state switcher — demo "brand-new user" vs "already configured". */
function DevBar({ mode, onChange }: { mode: DevMode; onChange: (m: DevMode) => void }) {
  const opts: { id: DevMode; label: string }[] = [
    { id: "new", label: "Brand-new user" },
    { id: "configured", label: "Configured user" },
  ];
  return (
    <div
      style={{
        position: "sticky",
        bottom: 0,
        marginTop: 16,
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "6px 8px 6px 10px",
          background: "var(--surface)",
          border: "1px solid var(--border-strong)",
          borderRadius: 999,
          boxShadow: "var(--sh-hover)",
        }}
      >
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: "var(--text-3)" }}>DEV</span>
        <div style={{ display: "inline-flex", background: "var(--bg-subtle)", borderRadius: 999, padding: 2 }}>
          {opts.map((o) => {
            const on = mode === o.id;
            return (
              <button
                key={o.id}
                type="button"
                onClick={() => onChange(o.id)}
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  fontFamily: "var(--font-ui)",
                  padding: "4px 12px",
                  borderRadius: 999,
                  border: "none",
                  cursor: "pointer",
                  background: on ? "var(--surface)" : "transparent",
                  color: on ? "var(--text)" : "var(--text-3)",
                  boxShadow: on ? "var(--sh-rest)" : "none",
                }}
              >
                {o.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default JourneyTabPage;
