import { describe, it, expect } from "vitest";
import {
  outcomeEvents,
  eventsInWindow,
  reportCard,
  filterEvents,
  loggedAccounts,
  playbookScorecard,
  impactSummary,
  impactVerdict,
  channelBreakdown,
} from "./outcomeLog";

describe("outcome log", () => {
  it("generates a rich, time-distributed event set", () => {
    expect(outcomeEvents.length).toBeGreaterThan(30);
    expect(eventsInWindow("7d").length).toBeGreaterThan(0);
    expect(eventsInWindow("30d").length).toBeGreaterThan(eventsInWindow("7d").length - 1);
    expect(eventsInWindow("lifetime").length).toBe(outcomeEvents.length);
  });

  it("report card has value and category breakdown across windows", () => {
    for (const w of ["7d", "30d", "lifetime"] as const) {
      const rc = reportCard(w);
      expect(rc.byCategory.length).toBe(5);
      expect(rc.totalValue).toBeGreaterThanOrEqual(0);
      // total equals sum of category values
      expect(rc.byCategory.reduce((s, c) => s + c.value, 0)).toBe(rc.totalValue);
    }
    expect(reportCard("lifetime").totalValue).toBeGreaterThan(0);
  });

  it("HONESTY: each customer's saved revenue is counted once — no account appears in two categories", () => {
    // The double-count bug fix: an account can only be 'worked' in one category, so its MRR
    // is never summed twice into the hero total.
    const worked = outcomeEvents.filter((e) => e.result === "worked");
    const catByAccount = new Map<string, Set<string>>();
    for (const e of worked) {
      const s = catByAccount.get(e.accountId) ?? new Set<string>();
      s.add(e.category);
      catByAccount.set(e.accountId, s);
    }
    for (const [, cats] of catByAccount) expect(cats.size).toBe(1);
    // and the impact total equals the sum over distinct worked accounts (each once)
    const once = new Map<string, number>();
    for (const e of worked) once.set(e.accountId, (once.get(e.accountId) ?? 0) + e.amount);
    const expected = Array.from(once.values()).reduce((s, v) => s + v, 0);
    expect(impactSummary("lifetime").totalValue).toBe(expected);
  });

  it("counts each $ once — at most one worked event per account+category, and only worked carries value", () => {
    const worked = outcomeEvents.filter((e) => e.result === "worked");
    const keys = worked.map((e) => `${e.accountId}|${e.category}`);
    expect(new Set(keys).size).toBe(keys.length); // no duplicate worked episode for an account+category
    expect(outcomeEvents.filter((e) => e.amount > 0).every((e) => e.result === "worked")).toBe(true);
  });

  it("playbook scorecard: one row per fired playbook, honest success rate, derived verdict", () => {
    const sc = playbookScorecard("lifetime");
    expect(sc.length).toBeGreaterThan(0);
    for (const r of sc) {
      expect(r.fired).toBe(r.worked + r.noChange + r.failed + r.pending);
      expect(r.resolved).toBe(r.worked + r.noChange + r.failed);
      const rate = r.resolved ? r.worked / r.resolved : 0;
      expect(r.successRate).toBeCloseTo(rate, 5);
      // a confident "working" verdict only on enough resolved fires
      if (r.verdict === "working") expect(r.resolved).toBeGreaterThanOrEqual(3);
    }
    // sorted by value, descending
    for (let i = 1; i < sc.length; i++) expect(sc[i - 1].value).toBeGreaterThanOrEqual(sc[i].value);
  });

  it("impact: ROI multiple derives from value over GoCSM cost; verdict never invents a number", () => {
    const s = impactSummary("lifetime");
    expect(s.roiMultiple).toBeCloseTo(s.totalValue / s.gocsmCost, 5);
    const v = impactVerdict("lifetime");
    // every figure in the sentence is one we computed (no hallucinated numbers)
    expect(v.line).toContain(String(s.customersKept));
    expect(v.stamp).toMatch(/wording is AI/);
  });

  it("channel breakdown sums back to the event set", () => {
    const ch = channelBreakdown("lifetime");
    const sent = ch.reduce((s, c) => s + c.sent, 0);
    expect(sent).toBe(outcomeEvents.length);
  });

  it("filters compose (customer · channel · action · result · search)", () => {
    const some = loggedAccounts()[0];
    expect(filterEvents({ window: "lifetime", accountId: some.id }).every((e) => e.accountId === some.id)).toBe(true);
    expect(filterEvents({ window: "lifetime", action: "email" }).every((e) => e.action === "email")).toBe(true);
    expect(filterEvents({ window: "lifetime", channel: "Email" }).every((e) => e.channel === "Email")).toBe(true);
    expect(filterEvents({ window: "lifetime", result: "worked" }).every((e) => e.result === "worked")).toBe(true);
    expect(
      filterEvents({ window: "lifetime", query: some.name }).every(
        (e) => e.accountName.includes(some.name) || e.summary.includes(some.name),
      ),
    ).toBe(true);
  });
});
