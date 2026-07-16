import { describe, expect, it } from "vitest";
import { createDemoState } from "./engine";
import { projectReplayNarrative } from "./narrative";
import { advanceReplayTick } from "./engine";
import { EGYPT_ARGENTINA_SHOCK_REPLAY } from "./fixtures";

const at = (tick: number) => Array.from({ length: tick }).reduce(state => advanceReplayTick(state as ReturnType<typeof createDemoState>), createDemoState(EGYPT_ARGENTINA_SHOCK_REPLAY));
describe("replay narrative projection", () => {
  it("narrates the key banner and result boundaries", () => {
    expect(projectReplayNarrative(at(0)).bannerTitle).toBe("Ready to replay");
    expect(projectReplayNarrative(at(5)).bannerTitle).toBe("Normal trading");
    expect(projectReplayNarrative(at(6)).bannerTitle).toBe("ARGENTINA GOAL DETECTED");
    expect(projectReplayNarrative(at(7)).result).toContain("Winner: VARGuard");
    expect(projectReplayNarrative(at(12)).bannerTitle).toBe("VAR REVIEW");
    expect(projectReplayNarrative(at(18)).bannerTitle).toBe("GOAL OVERTURNED");
    expect(projectReplayNarrative(at(20)).bannerTitle).toBe("MARKET REOPENED");
  });
  it("keeps the six-step story chronological", () => {
    const narrative = projectReplayNarrative(at(20));
    expect(narrative.steps).toHaveLength(6);
    expect(narrative.steps.map(item => item.tick)).toEqual([1, 6, 7, 7, 12, 20]);
    expect(narrative.decisions).toEqual(["Goal detected. VARGuard cancelled quotes and suspended the market.", "Prevented 5 stale fills worth 600.00 test units.", "VAR review started. Market remains frozen.", "Goal overturned. Probability reset to 72%.", "Fresh price available. Market reopened with lower limits."]);
  });

  it("projects the plain-language outcome for non-traders", () => {
    expect(projectReplayNarrative(at(5)).result).toBe("Both markets are open. No loss yet.");
    expect(projectReplayNarrative(at(7)).result).toContain("Winner: VARGuard");
    expect(projectReplayNarrative(at(20)).result).toContain("VARGuard avoided 600.00 test units");
  });
});
