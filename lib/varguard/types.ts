export type EventType = "MATCH_STARTED" | "ODDS_UPDATE" | "GOAL" | "STALE_QUOTES_EXPLOITED" | "VAR_REVIEW_STARTED" | "VAR_GOAL_OVERTURNED" | "FEED_STALE" | "FEED_RECOVERED" | "FULLTIME";
export type MarketStatus = "OPEN" | "SUSPENDED_EVENT_RISK" | "SUSPENDED_VAR_REVIEW" | "SUSPENDED_STALE_FEED" | "REPRICING" | "REOPENED" | "SETTLED";
export type QuoteStatus = "OPEN" | "CANCELLED" | "FILLED";
export type RiskActionType = "CANCEL_QUOTES" | "SUSPEND_MARKET" | "REPRICE_MARKET" | "REOPEN_MARKET" | "SETTLE_MARKET" | "LOG_WARNING";
export type HedgeRecommendationType = "CANCEL_RISK_QUOTES" | "REDUCE_ORDER_SIZE" | "WIDEN_SPREAD" | "QUOTE_RISK_REDUCING_SIDE_ONLY" | "HOLD_UNTIL_VAR_RESOLUTION" | "REOPEN_WITH_LOWER_LIMITS";
export type ReplayPhase = "OPEN" | "GOAL_DETECTED" | "DIVERGENCE" | "VAR_REVIEW" | "SUSPENDED" | "GOAL_OVERTURNED" | "REPRICING" | "REOPENED" | "STABLE_OPEN";

export interface MatchEvent { id: string; type: EventType; atMs: number; matchClock: string; payload?: { fairProbability?: number; score?: string }; }
export interface Quote { id: string; outcome: "YES" | "NO"; side: "BID" | "ASK"; price: number; size: number; status: QuoteStatus; }
export interface MarketState { name: "NAIVE" | "VARGUARD"; status: MarketStatus; fairProbability: number; quotes: Quote[]; exposure: number; cancelledQuotes: number; loss: number; staleFills: number; preventedFills: number; }
export interface RiskAction { id: string; eventId: string; type: RiskActionType; atMs: number; reason: string; before: MarketStatus; after: MarketStatus; preventedNotional?: number; }
export interface AuditReceipt { id: string; eventId: string; actionId: string; matchClock: string; action: RiskActionType; reason: string; verification: "DEMO_VERIFIED"; }
import type { SyntheticReplayFixture } from "./fixtures";
export interface DemoState { tick: number; phase: ReplayPhase; running: boolean; speed: number; score: string; feed: "REPLAY" | "STALE"; scenarioId: SyntheticReplayFixture["scenarioId"]; fixture: SyntheticReplayFixture; naive: MarketState; guard: MarketState; actions: RiskAction[]; receipts: AuditReceipt[]; timeline: MatchEvent[]; timeToSuspendMs?: number; }
