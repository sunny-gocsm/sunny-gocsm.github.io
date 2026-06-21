import { describe, it, expect } from "vitest";
import { outcomeEvents, eventsInWindow, reportCard, filterEvents, loggedAccounts } from "./outcomeLog";

describe("outcome log", () => {
  it("generates a rich, time-distributed event set", () => {
    expect(outcomeEvents.length).toBeGreaterThan(40);
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

  it("filters compose (customer · action · result · search)", () => {
    const some = loggedAccounts()[0];
    expect(filterEvents({ window: "lifetime", accountId: some.id }).every((e) => e.accountId === some.id)).toBe(true);
    expect(filterEvents({ window: "lifetime", action: "email" }).every((e) => e.action === "email")).toBe(true);
    expect(filterEvents({ window: "lifetime", result: "worked" }).every((e) => e.result === "worked")).toBe(true);
    expect(filterEvents({ window: "lifetime", query: some.name }).every((e) => e.accountName.includes(some.name) || e.summary.includes(some.name))).toBe(true);
  });
});
