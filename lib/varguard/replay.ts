import type { MatchEvent } from "./types";

export const REPLAY_DURATION_MS = 70_000;
export const replayEvents: MatchEvent[] = [
  { id: "evt-001", type: "MATCH_STARTED", atMs: 0, matchClock: "12:00", payload: { fairProbability: 0.52, score: "0–0" } },
  { id: "evt-010", type: "ODDS_UPDATE", atMs: 8_000, matchClock: "15:42", payload: { fairProbability: 0.52 } },
  { id: "evt-020", type: "GOAL", atMs: 18_000, matchClock: "16:21", payload: { fairProbability: 0.73, score: "1–0" } },
  { id: "evt-021", type: "VAR_REVIEW_STARTED", atMs: 24_000, matchClock: "16:27" },
  { id: "evt-022", type: "VAR_GOAL_OVERTURNED", atMs: 37_000, matchClock: "17:04", payload: { fairProbability: 0.47, score: "0–0" } },
  { id: "evt-023", type: "ODDS_UPDATE", atMs: 45_000, matchClock: "17:12", payload: { fairProbability: 0.47 } },
  { id: "evt-024", type: "FEED_STALE", atMs: 55_000, matchClock: "18:02" },
  { id: "evt-025", type: "FEED_RECOVERED", atMs: 61_000, matchClock: "18:08", payload: { fairProbability: 0.48 } },
  { id: "evt-030", type: "FULLTIME", atMs: 70_000, matchClock: "90:00", payload: { score: "0–0" } },
];
