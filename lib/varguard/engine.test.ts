import { describe, expect, it } from "vitest";
import { advanceDemo, createDemoState } from "./engine";

describe("VARGuard deterministic replay", () => {
  it("prevents the goal stale fill that hits the naive market", () => {
    const state = advanceDemo(createDemoState(), 18_000);
    expect(state.naive.staleFills).toBe(1); expect(state.naive.loss).toBeGreaterThan(0);
    expect(state.guard.preventedFills).toBe(1); expect(state.guard.status).toBe("SUSPENDED_EVENT_RISK");
    expect(state.guard.quotes.every(q => q.status === "CANCELLED")).toBe(true);
  });
  it("reprices and reopens only after fresh odds", () => {
    const state = advanceDemo(createDemoState(), 45_000);
    expect(state.guard.status).toBe("REOPENED"); expect(state.guard.fairProbability).toBe(0.47);
    expect(state.actions.some(a => a.type === "REPRICE_MARKET")).toBe(true);
  });
  it("is deterministic after reset", () => {
    expect(advanceDemo(createDemoState(), 70_000)).toEqual(advanceDemo(createDemoState(), 70_000));
  });
});
