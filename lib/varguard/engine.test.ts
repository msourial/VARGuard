import { describe, expect, it } from "vitest";
import { advanceReplayTick, createDemoState, FINAL_REPLAY_TICK, replayIntervalMs } from "./engine";

const toTick = (tick: number) => Array.from({ length: tick }, (_, index) => index).reduce(state => advanceReplayTick(state), createDemoState());
describe("VARGuard 20-tick deterministic replay", () => {
  it("starts at tick 0 with a clean open market", () => { const state = createDemoState(); expect(state.tick).toBe(0); expect(state.phase).toBe("OPEN"); expect(state.naive.loss).toBe(0); expect(state.guard.preventedFills).toBe(0); });
  it("keeps both markets open through tick 5", () => { const state = toTick(5); expect(state.phase).toBe("OPEN"); expect(state.score).toBe("0–0"); expect(state.naive.status).toBe("OPEN"); expect(state.guard.status).toBe("OPEN"); });
  it("cancels protected quotes at tick 6", () => { const state = toTick(6); expect(state.phase).toBe("GOAL_DETECTED"); expect(state.score).toBe("1–0"); expect(state.guard.status).toBe("SUSPENDED_EVENT_RISK"); expect(state.guard.quotes.every(quote => quote.status === "CANCELLED")).toBe(true); expect(state.receipts).not.toHaveLength(0); });
  it("makes the divergence explicit at tick 7", () => { const state = toTick(7); expect(state.naive.staleFills).toBe(5); expect(state.naive.loss).toBe(600); expect(state.guard.preventedFills).toBe(5); expect(state.guard.loss).toBe(0); });
  it("freezes for VAR review at tick 12", () => { const state = toTick(12); expect(state.phase).toBe("VAR_REVIEW"); expect(state.guard.status).toBe("SUSPENDED_VAR_REVIEW"); });
  it("reprices at tick 18 and reopens at tick 19", () => { expect(toTick(18).guard.status).toBe("REPRICING"); const state = toTick(19); expect(state.phase).toBe("REOPENED"); expect(state.guard.status).toBe("REOPENED"); expect(state.score).toBe("0–0"); });
  it("retains comparison metrics in stable open state", () => { const state = toTick(FINAL_REPLAY_TICK); expect(state.phase).toBe("STABLE_OPEN"); expect(state.naive.status).toBe("OPEN"); expect(state.guard.status).toBe("OPEN"); expect(state.naive.loss).toBe(600); expect(state.guard.preventedFills).toBe(5); });
  it("uses deterministic speed intervals", () => { expect(replayIntervalMs(1)).toBe(1000); expect(replayIntervalMs(3)).toBe(333); expect(replayIntervalMs(5)).toBe(200); });
});
