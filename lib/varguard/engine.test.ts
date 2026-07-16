import { describe, expect, it } from "vitest";
import { advanceReplayTick, createDemoState, FINAL_REPLAY_TICK, finalReplayTick, replayIntervalMs } from "./engine";
import { EGYPT_ARGENTINA_FULL_INCIDENT_REPLAY, EGYPT_ARGENTINA_SHOCK_REPLAY } from "./fixtures";

const toTick = (tick: number) => Array.from({ length: tick }, (_, index) => index).reduce(state => advanceReplayTick(state), createDemoState(EGYPT_ARGENTINA_SHOCK_REPLAY));
describe("VARGuard 20-tick deterministic replay", () => {
  it("starts at tick 0 with a clean open market", () => { const state = createDemoState(EGYPT_ARGENTINA_SHOCK_REPLAY); expect(state.tick).toBe(0); expect(state.phase).toBe("OPEN"); expect(state.naive.loss).toBe(0); expect(state.guard.preventedFills).toBe(0); });
  it("keeps both markets open through tick 5", () => { const state = toTick(5); expect(state.phase).toBe("OPEN"); expect(state.score).toBe("2–0"); expect(state.fixture.label).toContain("Synthetic"); expect(state.naive.fairProbability).toBe(0.72); expect(state.naive.status).toBe("OPEN"); expect(state.guard.status).toBe("OPEN"); });
  it("cancels protected quotes at tick 6", () => { const state = toTick(6); expect(state.phase).toBe("GOAL_DETECTED"); expect(state.score).toBe("2–1"); expect(state.guard.status).toBe("SUSPENDED_EVENT_RISK"); expect(state.guard.quotes.every(quote => quote.status === "CANCELLED")).toBe(true); expect(state.receipts).not.toHaveLength(0); });
  it("makes the divergence explicit at tick 7", () => { const state = toTick(7); expect(state.naive.staleFills).toBe(5); expect(state.naive.loss).toBe(600); expect(state.guard.preventedFills).toBe(5); expect(state.guard.loss).toBe(0); });
  it("freezes for VAR review at tick 12", () => { const state = toTick(12); expect(state.phase).toBe("VAR_REVIEW"); expect(state.guard.status).toBe("SUSPENDED_VAR_REVIEW"); });
  it("records the resolved-goal repricing phase at tick 18 and reopens at tick 19", () => { const repricing = toTick(18); expect(repricing.phase).toBe("GOAL_OVERTURNED"); expect(repricing.guard.status).toBe("REPRICING"); expect(repricing.timeline.at(-1)?.type).toBe("VAR_GOAL_OVERTURNED"); const state = toTick(19); expect(state.phase).toBe("REOPENED"); expect(state.guard.status).toBe("REOPENED"); expect(state.score).toBe("2–0"); });
  it("retains comparison metrics in stable open state", () => { const state = toTick(FINAL_REPLAY_TICK); expect(state.phase).toBe("STABLE_OPEN"); expect(state.naive.status).toBe("OPEN"); expect(state.guard.status).toBe("OPEN"); expect(state.naive.loss).toBe(600); expect(state.guard.preventedFills).toBe(5); });
  it("uses deterministic speed intervals", () => { expect(replayIntervalMs(1)).toBe(1000); expect(replayIntervalMs(3)).toBe(333); expect(replayIntervalMs(5)).toBe(200); });
});

describe("optional full incident replay", () => {
  const fullAt = (tick: number) => Array.from({ length: tick }, () => 0).reduce(state => advanceReplayTick(state), createDemoState(EGYPT_ARGENTINA_FULL_INCIDENT_REPLAY));
  it("is the default fixture while Fast remains available as a separate summary", () => {
    const full = createDemoState(EGYPT_ARGENTINA_FULL_INCIDENT_REPLAY);
    expect(createDemoState().scenarioId).toBe("full-incident");
    expect(full.scenarioId).toBe("full-incident");
    expect(finalReplayTick(full)).toBe(130);
    expect(full.score).toBe("0–0");
  });
  it("records major incidents and the final protected outcome", () => {
    expect(fullAt(6).naive.loss).toBe(600);
    expect(fullAt(18).naive.loss).toBe(950);
    expect(fullAt(56).guard.status).toBe("SUSPENDED_VAR_REVIEW");
    expect(fullAt(64)).toMatchObject({ score: "0–2" });
    expect(fullAt(64).naive.loss).toBe(1600);
    expect(fullAt(73).score).toBe("1–2");
    expect(fullAt(85)).toMatchObject({ score: "2–2" });
    expect(fullAt(85).naive.loss).toBe(2200);
    expect(fullAt(96)).toMatchObject({ score: "3–2" });
    const final = fullAt(130);
    expect(final.score).toBe("3–2");
    expect(final.naive.staleFills).toBe(22);
    expect(final.naive.loss).toBe(2800);
    expect(final.guard.preventedFills).toBe(22);
    expect(final.guard.status).toBe("OPEN");
    expect(final.phase).toBe("STABLE_OPEN");
    expect(final.receipts.length).toBeGreaterThan(0);
  });
});
