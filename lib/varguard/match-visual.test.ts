import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { advanceReplayTick, createDemoState } from "./engine";
import { projectMatchVisual } from "./match-visual";
import { EGYPT_ARGENTINA_FULL_INCIDENT_REPLAY, EGYPT_ARGENTINA_SHOCK_REPLAY } from "./fixtures";

const at = (tick: number) => Array.from({ length: tick }).reduce(state => advanceReplayTick(state), createDemoState(EGYPT_ARGENTINA_SHOCK_REPLAY));

describe("synthetic match visual projection", () => {
  it("uses a landscape pitch with scaled positions, not non-uniform SVG transforms", () => {
    const component = readFileSync(new URL("../../app/components/MatchReplayPanel.tsx", import.meta.url), "utf8");
    expect(component).toContain('viewBox="0 0 160 100"');
    expect(component).toContain("const fieldX = (x: number) => x * SCALE_X");
    expect(component).toContain("M80 1V99");
    expect(component).not.toContain('transform="scale(1.6 1)"');
  });
  it("starts with confirmed Egypt lead and normal play", () => {
    const visual = projectMatchVisual(at(0));
    expect(visual.phase).toBe("NORMAL_PLAY");
    expect(visual.score).toBe("2–0");
    expect(visual.scoreStatus).toBe("CONFIRMED");
    expect(visual.ball).toEqual({ x: 50, y: 50 });
    expect(visual.egyptPlayers).toHaveLength(11);
    expect(visual.argentinaPlayers).toHaveLength(11);
    expect(visual.egyptPlayers.filter(player => player.role === "GOALKEEPER")).toHaveLength(1);
    expect(visual.argentinaPlayers.filter(player => player.role === "GOALKEEPER")).toHaveLength(1);
    expect(visual.naiveOverlay).toBe("NONE");
    expect(visual.guardOverlay).toBe("NONE");
  });

  it("maps the deterministic risk boundaries onto the pitch", () => {
    expect(projectMatchVisual(at(6))).toMatchObject({ phase: "GOAL_DETECTED", score: "2–1", callout: "GOAL DETECTED" });
    expect(projectMatchVisual(at(6))).toMatchObject({ ball: { x: 9, y: 50 }, attackTeam: "ARGENTINA", attackDirection: "LEFT", riskWindow: true });
    expect(projectMatchVisual(at(7))).toMatchObject({ phase: "MARKET_DIVERGENCE", naiveOverlay: "STILL_OPEN", guardOverlay: "FROZEN", riskWindow: true });
    expect(projectMatchVisual(at(12))).toMatchObject({ phase: "VAR_REVIEW", scoreStatus: "PROVISIONAL", guardOverlay: "FROZEN" });
    expect(projectMatchVisual(at(18))).toMatchObject({ phase: "GOAL_OVERTURNED", score: "2–0", guardOverlay: "REPRICING", riskWindow: false });
    expect(projectMatchVisual(at(19))).toMatchObject({ phase: "MARKET_REOPENED", guardOverlay: "REOPENED" });
    expect(projectMatchVisual(at(20))).toMatchObject({ phase: "MARKET_REOPENED", score: "2–0", progress: 1 });
  });

  it("returns to the identical visual state after reset", () => {
    expect(projectMatchVisual(createDemoState(EGYPT_ARGENTINA_SHOCK_REPLAY))).toEqual(projectMatchVisual(at(0)));
  });

  it("choreographs every supplied Full-replay incident without reading video media", () => {
    const fullAt = (tick: number) => Array.from({ length: tick }).reduce(state => advanceReplayTick(state), createDemoState(EGYPT_ARGENTINA_FULL_INCIDENT_REPLAY));
    expect(fullAt(0).fixture).toMatchObject({ homeTeam: "Argentina", awayTeam: "Egypt" });
    expect(projectMatchVisual(fullAt(0))).toMatchObject({ ballLane: "CENTER", egyptShape: "BALANCED", argentinaShape: "BALANCED" });
    expect(projectMatchVisual(fullAt(5))).toMatchObject({ callout: "DANGEROUS CROSS", attackTeam: "EGYPT", attackDirection: "RIGHT", ballLane: "RIGHT_WING", riskAnchor: "ARGENTINA_GOAL" });
    expect(projectMatchVisual(fullAt(6))).toMatchObject({ score: "0–1", callout: "EGYPT GOAL", ballLane: "RIGHT_GOAL", egyptShape: "ATTACKING_RIGHT", argentinaShape: "DEEP_RIGHT_BLOCK" });
    expect(projectMatchVisual(fullAt(13))).toMatchObject({ callout: "ARGENTINA PENALTY", attackTeam: "ARGENTINA", attackDirection: "LEFT", ballLane: "LEFT_GOAL", riskAnchor: "EGYPT_GOAL" });
    expect(projectMatchVisual(fullAt(18))).toMatchObject({ callout: "PENALTY SAVED", ballLane: "EGYPT_GOALKEEPER", guardOverlay: "FROZEN" });
    expect(projectMatchVisual(fullAt(29))).toMatchObject({ callout: "ARGENTINA PRESSURE", ballLane: "LEFT_BOX", argentinaShape: "ATTACKING_LEFT", guardOverlay: "REOPENED" });
    expect(projectMatchVisual(fullAt(37))).toMatchObject({ callout: "MIDFIELD RESET", ballLane: "CENTER", egyptShape: "COMPACT_MIDFIELD", argentinaShape: "COMPACT_MIDFIELD" });
    expect(projectMatchVisual(fullAt(45))).toMatchObject({ callout: "EGYPT COUNTER BUILD", ballLane: "RIGHT_WING", egyptShape: "TRANSITION_RIGHT" });
    expect(projectMatchVisual(fullAt(54))).toMatchObject({ callout: "EGYPT COUNTER DETECTED", ballLane: "RIGHT_GOAL", riskAnchor: "ARGENTINA_GOAL" });
    expect(projectMatchVisual(fullAt(56))).toMatchObject({ score: "0–1", scoreStatus: "PROVISIONAL", callout: "GOAL DISALLOWED · VAR HOLD", riskWindow: true });
    expect(projectMatchVisual(fullAt(61))).toMatchObject({ callout: "FREE KICK · RESTART", ballLane: "RIGHT_WING", guardOverlay: "REOPENED" });
    expect(projectMatchVisual(fullAt(64))).toMatchObject({ score: "0–2", callout: "CONFIRMED EGYPT GOAL", attackTeam: "EGYPT" });
    expect(projectMatchVisual(fullAt(73))).toMatchObject({ score: "1–2", callout: "ARGENTINA COMEBACK", ballLane: "LEFT_BOX", argentinaShape: "ATTACKING_LEFT" });
    expect(projectMatchVisual(fullAt(85))).toMatchObject({ score: "2–2", callout: "ARGENTINA EQUALIZER", ballLane: "LEFT_GOAL", riskWindow: true });
    expect(projectMatchVisual(fullAt(96))).toMatchObject({ score: "3–2", callout: "ARGENTINA WINNER", ballLane: "LEFT_GOAL", riskWindow: true });
    expect(projectMatchVisual(fullAt(98))).toMatchObject({ attackTeam: "NONE", ballLane: "CENTER", egyptShape: "GAME_MANAGEMENT", riskWindow: false });
    expect(projectMatchVisual(fullAt(130))).toMatchObject({ score: "3–2", phase: "MARKET_REOPENED", guardOverlay: "REOPENED", argentinaShape: "GAME_MANAGEMENT" });
  });
});
