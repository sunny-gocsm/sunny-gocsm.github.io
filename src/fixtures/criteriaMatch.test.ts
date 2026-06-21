import { describe, it, expect } from "vitest";
import { RECIPES } from "./recipes";
import { matchAccounts, candidateDelta, composition, forecast7d, describeSet } from "./criteriaMatch";
import { triedButFailed, triedUnconfirmed } from "./attempts";

describe("criteria matching engine", () => {
  it("every starter recipe matches a non-empty population", () => {
    for (const r of RECIPES) {
      const n = matchAccounts(r.set).length;
      expect(n, `recipe ${r.id} should match >0 accounts`).toBeGreaterThan(0);
    }
  });

  it("describeSet renders plain English for each recipe", () => {
    for (const r of RECIPES) {
      expect(describeSet(r.set).toLowerCase()).toContain("accounts with");
    }
  });

  it("candidateDelta is ≤ 0 when narrowing an existing set (AND match)", () => {
    const base = RECIPES.find((r) => r.id === "rec-renew-risk")!;
    const single = { ...base.set, criteria: base.set.criteria.slice(0, 1) };
    const delta = candidateDelta(single, base.set.criteria[1]);
    expect(delta).toBeLessThanOrEqual(0);
  });

  it("composition returns at least a Health distribution bar", () => {
    const accs = matchAccounts(RECIPES[2].set);
    const bars = composition(accs);
    expect(bars.length).toBeGreaterThan(0);
    expect(bars[0].dim).toBe("Health");
    const total = bars[0].parts.reduce((s, p) => s + p.pct, 0);
    expect(total).toBeGreaterThan(80); // ~100% (rounding)
  });

  it("forecast7d runs and entries are confidence-tagged within the 7-day window", () => {
    const fc = forecast7d(RECIPES[0].set);
    for (const e of fc) {
      expect(e.etaDays).toBeGreaterThanOrEqual(1);
      expect(e.etaDays).toBeLessThanOrEqual(7);
      expect(["high", "low"]).toContain(e.confidence);
    }
  });

  it("job (b): both a high-confidence failure set and a low-confidence fallback set exist", () => {
    expect(triedButFailed().length).toBeGreaterThan(0);
    expect(triedUnconfirmed().length).toBeGreaterThan(0);
    // never claim failure on low-confidence
    for (const t of triedButFailed()) expect(t.confidence).toBe("high");
  });
});
