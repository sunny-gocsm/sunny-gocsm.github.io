import { useMemo } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Button } from "@gocsm/design-system";
import { AttentionActivation } from "@/components/attention/AttentionActivation";
import { recipeForPlaybook, type Recipe } from "@/fixtures/recipes";
import { playbookById } from "@/fixtures/playbooks";

// Clicking a playbook — from the catalog OR from an Attention card — lands here and goes
// straight into the ONE unified setup flow (AttentionActivation), starting at "What it does".
// No separate detail interface: the hero video, what-it-does, social proof, trigger config,
// and review all live inside that single reused wizard.
export default function PlaybookDetailPage() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const playbook = useMemo(() => playbookById(id), [id]);

  if (!playbook) {
    return (
      <main style={{ padding: "var(--s-8) var(--s-6)", maxWidth: 800, margin: "0 auto", color: "var(--text)" }}>
        <h1 style={{ fontSize: "var(--t-display-lg)", fontWeight: 700, margin: 0 }}>Playbook not found</h1>
        <div style={{ marginTop: "var(--s-3)" }}>
          <Button variant="secondary" size="sm" onClick={() => navigate("/playbooks")}>Back to Playbooks</Button>
        </div>
      </main>
    );
  }

  const recipe: Recipe = {
    id: playbook.id,
    icon: playbook.icon,
    label: playbook.title,
    blurb: playbook.subtitle,
    set: recipeForPlaybook(playbook.id)?.set ?? { match: "all", criteria: [] },
    playbookId: playbook.id,
  };

  // Return to wherever they came from (Playbooks catalog or the Attention queue). location.key
  // is "default" only on a cold/deep-link entry with no in-app history → fall back to /playbooks.
  const back = () => (location.key !== "default" ? navigate(-1) : navigate("/playbooks"));
  return <AttentionActivation recipe={recipe} backLabel="Back" onClose={back} />;
}
