import { describe, expect, it } from "vitest";
import { normalizeTxLineSnapshot, parseTxLineSnapshotResponse } from "./server";

describe("TxLINE snapshot normalizer", () => {
  it("maps score and decimal odds without exposing credentials", () => {
    const snapshot = normalizeTxLineSnapshot("18237038", [{ HomeScore: 2, AwayScore: 1, GameState: "H2", ts: "2026-07-14T19:30:00Z" }], [{ DecimalOdds: 2 }]);
    expect(snapshot).toMatchObject({ fixtureId: "18237038", score: "2–1", gameState: "H2", fairProbability: 0.5, source: "TXLINE" });
  });

  it("parses ordinary JSON snapshot responses", async () => {
    const payload = await parseTxLineSnapshotResponse(new Response('{"DecimalOdds":2}', { headers: { "content-type": "application/json" } }), "odds");
    expect(payload).toEqual({ DecimalOdds: 2 });
  });

  it("accepts a completed SSE score update", async () => {
    const payload = await parseTxLineSnapshotResponse(new Response('data: {"HomeScore":0,"AwayScore":1,"GameState":"H1"}\n\n', { headers: { "content-type": "text/event-stream" } }), "scores");
    expect(payload).toEqual({ HomeScore: 0, AwayScore: 1, GameState: "H1" });
  });

  it("uses the latest valid SSE event", async () => {
    const payload = await parseTxLineSnapshotResponse(new Response('data: {"HomeScore":0,"AwayScore":0}\n\ndata: not-json\n\ndata: {"HomeScore":0,"AwayScore":1}\n\n'), "scores");
    expect(payload).toEqual({ HomeScore: 0, AwayScore: 1 });
  });

  it("rejects malformed or empty SSE payloads with a controlled error", async () => {
    await expect(parseTxLineSnapshotResponse(new Response("data: not-json\n\n", { headers: { "content-type": "text/event-stream" } }), "scores")).rejects.toThrow("TxLINE returned an invalid scores snapshot response");
    await expect(parseTxLineSnapshotResponse(new Response("", { headers: { "content-type": "text/event-stream" } }), "odds")).rejects.toThrow("TxLINE returned an invalid odds snapshot response");
  });
});
