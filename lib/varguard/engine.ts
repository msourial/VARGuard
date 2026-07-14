import type { AuditReceipt, DemoState, MarketState, Quote, ReplayPhase, RiskAction, RiskActionType } from "./types";

export const FINAL_REPLAY_TICK = 20;
export const replayIntervalMs = (speed: number) => Math.round(1000 / speed);

const baseQuotes = (fairProbability: number): Quote[] => [
  { id: "yes-bid", outcome: "YES", side: "BID", price: +(fairProbability - 0.01).toFixed(2), size: 100, status: "OPEN" },
  { id: "yes-ask", outcome: "YES", side: "ASK", price: +(fairProbability + 0.01).toFixed(2), size: 100, status: "OPEN" },
  { id: "no-bid", outcome: "NO", side: "BID", price: +(1 - fairProbability - 0.01).toFixed(2), size: 100, status: "OPEN" },
  { id: "no-ask", outcome: "NO", side: "ASK", price: +(1 - fairProbability + 0.01).toFixed(2), size: 100, status: "OPEN" },
];
const market = (name: MarketState["name"]): MarketState => ({ name, status: "OPEN", fairProbability: 0.52, quotes: baseQuotes(0.52), exposure: 0, cancelledQuotes: 0, loss: 0, staleFills: 0, preventedFills: 0 });
const event = (id: string, type: "GOAL" | "VAR_REVIEW_STARTED" | "VAR_GOAL_OVERTURNED", tick: number, matchClock: string, score?: string) => ({ id, type, atMs: tick * 1000, matchClock, payload: score ? { score } : undefined });

export function createDemoState(): DemoState { return { tick: 0, phase: "OPEN", running: false, speed: 1, score: "0–0", feed: "REPLAY", naive: market("NAIVE"), guard: market("VARGUARD"), actions: [], receipts: [], timeline: [] }; }
function log(state: DemoState, eventId: string, type: RiskActionType, reason: string, before: MarketState["status"], after: MarketState["status"], clock: string, receipt = false) {
  const item: RiskAction = { id: `act-${state.actions.length + 1}`, eventId, atMs: state.tick * 1000, type, reason, before, after, preventedNotional: type === "SUSPEND_MARKET" ? 600 : undefined };
  state.actions.push(item);
  if (receipt) { const audit: AuditReceipt = { id: `rcpt-${state.receipts.length + 1}`, eventId, actionId: item.id, matchClock: clock, action: type, reason, verification: "DEMO_VERIFIED" }; state.receipts.push(audit); }
}
function setPhase(state: DemoState, phase: ReplayPhase) { state.phase = phase; }
function goalDetected(state: DemoState) {
  const goal = event("evt-goal", "GOAL", state.tick, "16:21", "1–0"); state.timeline.push(goal); state.score = "1–0"; setPhase(state, "GOAL_DETECTED");
  const before = state.guard.status; const open = state.guard.quotes.filter(q => q.status === "OPEN"); open.forEach(q => { q.status = "CANCELLED"; }); state.guard.cancelledQuotes += open.length; state.guard.status = "SUSPENDED_EVENT_RISK"; state.timeToSuspendMs = 120;
  log(state, goal.id, "CANCEL_QUOTES", "Goal detected. Quotes cancelled. Market suspended to prevent stale fills.", before, "SUSPENDED_EVENT_RISK", goal.matchClock, true);
  log(state, goal.id, "SUSPEND_MARKET", "Goal detected. Quotes cancelled. Market suspended to prevent stale fills.", before, "SUSPENDED_EVENT_RISK", goal.matchClock, true);
}
function divergence(state: DemoState) { setPhase(state, "DIVERGENCE"); state.naive.staleFills = 5; state.naive.loss = 600; state.naive.exposure = 500; state.guard.preventedFills = 5; log(state, "evt-goal", "LOG_WARNING", "Prevented 5 stale fills worth 600.00 test units.", state.guard.status, state.guard.status, "16:22"); }
function varReview(state: DemoState) { const review = event("evt-var-review", "VAR_REVIEW_STARTED", state.tick, "17:10"); state.timeline.push(review); const before = state.guard.status; state.guard.status = "SUSPENDED_VAR_REVIEW"; setPhase(state, "VAR_REVIEW"); log(state, review.id, "SUSPEND_MARKET", "Market frozen. Goal under VAR review. Circuit breaker engaged.", before, "SUSPENDED_VAR_REVIEW", review.matchClock, true); }
function overturn(state: DemoState) { const resolution = event("evt-overturn", "VAR_GOAL_OVERTURNED", state.tick, "18:02", "0–0"); state.timeline.push(resolution); state.score = "0–0"; state.naive.fairProbability = 0.52; state.guard.fairProbability = 0.52; state.guard.status = "REPRICING"; setPhase(state, "REPRICING"); log(state, resolution.id, "REPRICE_MARKET", "Goal overturned. Fair probability reset. Quotes repriced. Market reopened.", "SUSPENDED_VAR_REVIEW", "REPRICING", resolution.matchClock, true); }
function reopen(state: DemoState) { state.guard.quotes = baseQuotes(0.52); state.guard.status = "REOPENED"; setPhase(state, "REOPENED"); log(state, "evt-overturn", "REOPEN_MARKET", "Goal overturned. Fair probability reset. Quotes repriced. Market reopened.", "REPRICING", "REOPENED", "18:03", true); }

export function advanceReplayTick(previous: DemoState): DemoState {
  if (previous.tick >= FINAL_REPLAY_TICK) return structuredClone(previous);
  const state = structuredClone(previous); state.tick += 1;
  if (state.tick === 6) goalDetected(state);
  else if (state.tick === 7) divergence(state);
  else if (state.tick === 12) varReview(state);
  else if (state.tick === 18) overturn(state);
  else if (state.tick === 19) reopen(state);
  else if (state.tick >= 20) { state.naive.status = "OPEN"; state.guard.status = "OPEN"; setPhase(state, "STABLE_OPEN"); }
  else if (state.tick >= 8 && state.tick <= 11) setPhase(state, "SUSPENDED");
  return state;
}
