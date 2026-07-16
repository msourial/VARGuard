import { describe, expect, it } from "vitest";
import { normalizePublicFootballSnapshot, PUBLIC_FOOTBALL_SOURCE } from "./public";

const fixture = (state = "in") => ({ events: [{ name: "France vs Spain", date: "2026-07-14T19:00:00Z", season: { slug: "semifinals" }, status: { type: { state, shortDetail: state === "in" ? "45'" : "Scheduled" } }, competitions: [{ altGameNote: "FIFA World Cup, Semifinals", venue: { fullName: "AT&T Stadium" }, competitors: [{ homeAway: "home", score: "2", team: { displayName: "France" } }, { homeAway: "away", score: "1", team: { displayName: "Spain" } }] }] }] });

describe("public football snapshot normalizer", () => {
  it("normalizes a live tournament fixture without official branding", () => expect(normalizePublicFootballSnapshot(fixture(), "2026-07-13T20:00:00Z")).toMatchObject({ available: true, match: "France vs Spain", score: "2–1", state: "45'", round: "Semifinal", venue: "AT&T Stadium", source: PUBLIC_FOOTBALL_SOURCE }));
  it("normalizes scheduled and completed fixtures", () => { expect(normalizePublicFootballSnapshot(fixture("pre")).state).toBe("Scheduled"); expect(normalizePublicFootballSnapshot(fixture("post")).score).toBe("2–1"); });
  it("returns an honest empty state for malformed or empty responses", () => { expect(normalizePublicFootballSnapshot({ events: [] }).available).toBe(false); expect(normalizePublicFootballSnapshot(null).available).toBe(false); });
});
