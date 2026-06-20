import { useState } from "react";
import { Button, Card, Icon } from "@/gocsm-ds";
import { MatchWall } from "@/components/attention/MatchWall";
import { RECIPES } from "@/fixtures/recipes";
import { describeCriterion, type Criterion, type CriteriaSet } from "@/fixtures/criteriaMatch";

// Scratch dev surface for auditing MatchWall in isolation (build step 2). Not linked
// in nav; reachable at /attention-lab. Removed before the macro loop.

const EXTRA: Criterion[] = [
  { id: "x-mrr", fieldId: "account.mrr", op: "gt", value: 1000 },
  { id: "x-quiet", fieldId: "user.lastLoginDaysAgo", op: "gt", value: 14 },
  { id: "x-atrisk", fieldId: "health.band", op: "is", value: "atrisk" },
  { id: "x-pas", fieldId: "health.productAdoption", op: "lt", value: 30 },
];

export default function AttentionLab() {
  const [set, setSet] = useState<CriteriaSet>(RECIPES[2].set);

  const addCriterion = (c: Criterion) => {
    if (set.criteria.some((x) => x.id === c.id)) return;
    setSet((s) => ({ ...s, criteria: [...s.criteria, c] }));
  };
  const removeLast = () => setSet((s) => ({ ...s, criteria: s.criteria.slice(0, -1) }));

  return (
    <main style={{ maxWidth: 1080, margin: "0 auto", padding: "var(--s-7) var(--s-6)", display: "flex", flexDirection: "column", gap: "var(--s-5)", color: "var(--text)" }}>
      <h1 style={{ fontSize: "var(--t-display-lg)", fontWeight: 700, margin: 0 }}>MatchWall lab</h1>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--s-2)" }}>
        {RECIPES.map((r) => (
          <Button key={r.id} variant="ghost" className="btn-accent" size="sm" icon={<Icon name={r.icon} />} onClick={() => setSet(r.set)}>
            {r.label}
          </Button>
        ))}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--s-2)", alignItems: "center" }}>
        <span style={{ fontSize: "var(--t-caption)", color: "var(--text-3, var(--text))" }}>Add narrowing criterion:</span>
        {EXTRA.map((c) => (
          <Button key={c.id} variant="secondary" size="sm" onClick={() => addCriterion(c)}>
            + {describeCriterion(c)}
          </Button>
        ))}
        <Button variant="ghost" size="sm" icon={<Icon name="corner-up-left" />} onClick={removeLast}>
          Remove last
        </Button>
      </div>

      <Card padded>
        <MatchWall set={set} />
      </Card>
    </main>
  );
}
