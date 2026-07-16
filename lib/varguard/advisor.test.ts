import { describe, expect, it } from "vitest";
import { projectHedgeAdvisor } from "./advisor";
import { advanceReplayTick, createDemoState } from "./engine";
import { EGYPT_ARGENTINA_SHOCK_REPLAY } from "./fixtures";

const at = (tick: number) => Array.from({ length: tick }).reduce(state => advanceReplayTick(state), createDemoState(EGYPT_ARGENTINA_SHOCK_REPLAY));

describe("deterministic AI Hedge Advisor fallback", () => {
  it("does not appear before a completed risk event", () => {
    expect(projectHedgeAdvisor(at(6))).toBeNull();
  });

  it("recommends protective moves without controlling the engine", () => {
    const brief = projectHedgeAdvisor(at(7));
    expect(brief?.mode).toBe("TEMPLATE_FALLBACK");
    expect(brief?.source).toBe("DETERMINISTIC_RECEIPT");
    expect(brief?.recommendedMoves.map(move => move.type)).toEqual([
      "CANCEL_RISK_QUOTES", "REDUCE_ORDER_SIZE", "WIDEN_SPREAD",
      "QUOTE_RISK_REDUCING_SIDE_ONLY", "HOLD_UNTIL_VAR_RESOLUTION",
    ]);
    expect(brief?.riskDetected).toContain("Argentina comeback goal");
  });

  it("adds lower-limit reopening guidance after the market reopens", () => {
    expect(projectHedgeAdvisor(at(20))?.recommendedMoves.at(-1)?.type).toBe("REOPEN_WITH_LOWER_LIMITS");
  });
});
