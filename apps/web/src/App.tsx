import { Button, Card } from "@gocsm/design-system";

/**
 * Production GoCSM web app — starter shell.
 *
 * This proves the design-system wiring end to end: the components and styles
 * below come straight from packages/design-system/src via the workspace alias.
 * Replace this with the real app (or subtree an existing production repo into
 * apps/web — see the monorepo README).
 */
export default function App() {
  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px" }}>
      <Card>
        <h1 style={{ fontSize: "var(--t-display-lg)", margin: 0 }}>GoCSM</h1>
        <p style={{ marginTop: 8, color: "var(--text-secondary)" }}>
          Production app shell, wired to <code>@gocsm/design-system</code>.
        </p>
        <div style={{ marginTop: 20, display: "flex", gap: 12 }}>
          <Button variant="primary">Get started</Button>
          <Button variant="secondary">Learn more</Button>
        </div>
      </Card>
    </div>
  );
}
