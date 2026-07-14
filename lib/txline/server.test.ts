import { describe, expect, it } from "vitest";
import { normalizeTxLineSnapshot } from "./server";

describe("TxLINE snapshot normalizer", () => {
  it("maps score and decimal odds without exposing credentials", () => {
    const snapshot = normalizeTxLineSnapshot("18237038", [{ HomeScore: 2, AwayScore: 1, GameState: "H2", ts: "2026-07-14T19:30:00Z" }], [{ DecimalOdds: 2 }]);
    expect(snapshot).toMatchObject({ fixtureId: "18237038", score: "2–1", gameState: "H2", fairProbability: 0.5, source: "TXLINE" });
  });
});
