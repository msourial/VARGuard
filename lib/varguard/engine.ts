import { replayEvents } from "./replay";
import type { AuditReceipt, DemoState, MarketState, Quote, RiskAction, RiskActionType } from "./types";

const baseQuotes = (fairProbability: number): Quote[] => [
  { id: "yes-bid", outcome: "YES", side: "BID", price: +(fairProbability - 0.01).toFixed(2), size: 100, status: "OPEN" },
  { id: "yes-ask", outcome: "YES", side: "ASK", price: +(fairProbability + 0.01).toFixed(2), size: 100, status: "OPEN" },
  { id: "no-bid", outcome: "NO", side: "BID", price: +(1 - fairProbability - 0.01).toFixed(2), size: 100, status: "OPEN" },
  { id: "no-ask", outcome: "NO", side: "ASK", price: +(1 - fairProbability + 0.01).toFixed(2), size: 100, status: "OPEN" },
];
const makeMarket = (name: MarketState["name"]): MarketState => ({ name, status: "OPEN", fairProbability: 0.52, quotes: baseQuotes(0.52), exposure: 0, cancelledQuotes: 0, loss: 0, staleFills: 0, preventedFills: 0 });

export function createDemoState(): DemoState { return { elapsedMs: 0, running: false, speed: 1, score: "0–0", feed: "REPLAY", naive: makeMarket("NAIVE"), guard: makeMarket("VARGUARD"), actions: [], receipts: [], timeline: [] }; }
const riskReason: Record<string, string> = { GOAL: "Goal event received while quotes were open. Quotes may be stale.", VAR_REVIEW_STARTED: "VAR review in progress. Result uncertainty is unresolved.", FEED_STALE: "Feed age exceeded threshold. Quotes cancelled to avoid trading on stale data." };

function action(state: DemoState, eventId: string, atMs: number, type: RiskActionType, reason: string, before: MarketState["status"], after: MarketState["status"], clock: string): RiskAction {
  const item = { id: `act-${state.actions.length + 1}`, eventId, atMs, type, reason, before, after, preventedNotional: type === "SUSPEND_MARKET" ? 100 : undefined };
  state.actions.push(item);
  state.receipts.push({ id: `rcpt-${state.receipts.length + 1}`, eventId, actionId: item.id, matchClock: clock, action: type, reason, verification: "DEMO_VERIFIED" });
  return item;
}
function suspendGuard(state: DemoState, event: (typeof replayEvents)[number], status: MarketState["status"]) {
  const before = state.guard.status;
  const open = state.guard.quotes.filter(q => q.status === "OPEN");
  open.forEach(q => { q.status = "CANCELLED"; });
  state.guard.cancelledQuotes += open.length;
  state.guard.status = status;
  state.guard.preventedFills += 1;
  action(state, event.id, event.atMs, "CANCEL_QUOTES", riskReason[event.type], before, status, event.matchClock);
  action(state, event.id, event.atMs, "SUSPEND_MARKET", riskReason[event.type], before, status, event.matchClock);
  if (state.timeToSuspendMs === undefined) state.timeToSuspendMs = 120;
}
function repriceGuard(state: DemoState, event: (typeof replayEvents)[number]) {
  const fair = event.payload?.fairProbability ?? state.guard.fairProbability;
  const before = state.guard.status;
  state.guard.status = "REPRICING";
  action(state, event.id, event.atMs, "REPRICE_MARKET", "Fresh odds received. Quotes repriced to current fair value.", before, "REPRICING", event.matchClock);
  state.guard.fairProbability = fair; state.guard.quotes = baseQuotes(fair); state.guard.status = "REOPENED";
  action(state, event.id, event.atMs, "REOPEN_MARKET", "Fresh odds confirmed. Market reopened with updated quotes.", "REPRICING", "REOPENED", event.matchClock);
}
function applyEvent(state: DemoState, event: (typeof replayEvents)[number]) {
  state.timeline.push(event); if (event.payload?.score) state.score = event.payload.score;
  if (event.type === "FEED_STALE") state.feed = "STALE";
  if (event.type === "FEED_RECOVERED") state.feed = "REPLAY";
  if (event.payload?.fairProbability !== undefined) { state.naive.fairProbability = event.payload.fairProbability; }
  if (event.type === "GOAL") {
    const stale = state.naive.quotes.find(q => q.outcome === "YES" && q.side === "ASK" && q.status === "OPEN");
    if (stale) { stale.status = "FILLED"; state.naive.staleFills += 1; state.naive.exposure += stale.size; state.naive.loss += +((event.payload!.fairProbability! - stale.price) * stale.size).toFixed(2); }
    suspendGuard(state, event, "SUSPENDED_EVENT_RISK");
  } else if (event.type === "VAR_REVIEW_STARTED") suspendGuard(state, event, "SUSPENDED_VAR_REVIEW");
  else if (event.type === "FEED_STALE") suspendGuard(state, event, "SUSPENDED_STALE_FEED");
  else if (event.type === "ODDS_UPDATE" && state.guard.status !== "OPEN" && state.guard.status !== "REOPENED") repriceGuard(state, event);
  else if (event.type === "FEED_RECOVERED") repriceGuard(state, event);
  else if (event.type === "FULLTIME") { state.guard.status = "SETTLED"; state.naive.status = "SETTLED"; action(state, event.id, event.atMs, "SETTLE_MARKET", "Replay complete. Simulated market settled.", "REOPENED", "SETTLED", event.matchClock); }
}
export function advanceDemo(previous: DemoState, elapsedMs: number): DemoState {
  const state: DemoState = structuredClone(previous); state.elapsedMs = elapsedMs;
  replayEvents.filter(e => e.atMs <= elapsedMs && !state.timeline.some(seen => seen.id === e.id)).forEach(e => applyEvent(state, e));
  return state;
}
