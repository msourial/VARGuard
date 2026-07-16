import type { AuditReceipt, DemoState, EventType, MarketState, Quote, ReplayPhase, RiskAction, RiskActionType } from "./types";
import { EGYPT_ARGENTINA_FULL_INCIDENT_REPLAY, EGYPT_ARGENTINA_SHOCK_REPLAY, type SyntheticReplayFixture } from "./fixtures";

/** Backwards-compatible fast-demo duration. Use finalReplayTick(state) for scenario-aware UI. */
export const FINAL_REPLAY_TICK = 20;
export const replayIntervalMs = (speed: number) => Math.round(1000 / speed);
export const finalReplayTick = (state: Pick<DemoState, "fixture">) => state.fixture.durationTicks;

const baseQuotes = (fairProbability: number): Quote[] => [
  { id: "yes-bid", outcome: "YES", side: "BID", price: +(fairProbability - 0.01).toFixed(2), size: 100, status: "OPEN" },
  { id: "yes-ask", outcome: "YES", side: "ASK", price: +(fairProbability + 0.01).toFixed(2), size: 100, status: "OPEN" },
  { id: "no-bid", outcome: "NO", side: "BID", price: +(1 - fairProbability - 0.01).toFixed(2), size: 100, status: "OPEN" },
  { id: "no-ask", outcome: "NO", side: "ASK", price: +(1 - fairProbability + 0.01).toFixed(2), size: 100, status: "OPEN" },
];
const market = (name: MarketState["name"], fairProbability: number): MarketState => ({ name, status: "OPEN", fairProbability, quotes: baseQuotes(fairProbability), exposure: 0, cancelledQuotes: 0, loss: 0, staleFills: 0, preventedFills: 0 });
const addEvent = (id: string, type: EventType, tick: number, matchClock: string, score?: string) => ({ id, type, atMs: tick * 1000, matchClock, payload: score ? { score } : undefined });

export function createDemoState(fixture: SyntheticReplayFixture = EGYPT_ARGENTINA_FULL_INCIDENT_REPLAY): DemoState {
  return { tick: 0, phase: "OPEN", running: false, speed: 1, score: fixture.halftimeScore, feed: "REPLAY", scenarioId: fixture.scenarioId, fixture, naive: market("NAIVE", fixture.initialFairProbability), guard: market("VARGUARD", fixture.initialFairProbability), actions: [], receipts: [], timeline: [] };
}

function log(state: DemoState, eventId: string, type: RiskActionType, reason: string, before: MarketState["status"], after: MarketState["status"], clock: string, receipt = false) {
  const item: RiskAction = { id: `act-${state.actions.length + 1}`, eventId, atMs: state.tick * 1000, type, reason, before, after, preventedNotional: type === "SUSPEND_MARKET" ? Math.max(600, state.naive.loss) : undefined };
  state.actions.push(item);
  if (receipt) state.receipts.push({ id: `rcpt-${state.receipts.length + 1}`, eventId, actionId: item.id, matchClock: clock, action: type, reason, verification: "DEMO_VERIFIED" });
}
const setPhase = (state: DemoState, phase: ReplayPhase) => { state.phase = phase; };

function suspendForRisk(state: DemoState, id: string, type: EventType, clock: string, reason: string, score?: string, phase: ReplayPhase = "GOAL_DETECTED") {
  state.timeline.push(addEvent(id, type, state.tick, clock, score));
  if (score) state.score = score;
  setPhase(state, phase);
  const before = state.guard.status;
  const open = state.guard.quotes.filter(quote => quote.status === "OPEN");
  open.forEach(quote => { quote.status = "CANCELLED"; });
  state.guard.cancelledQuotes += open.length;
  state.guard.status = "SUSPENDED_EVENT_RISK";
  state.timeToSuspendMs = 120;
  log(state, id, "CANCEL_QUOTES", reason, before, "SUSPENDED_EVENT_RISK", clock, true);
  log(state, id, "SUSPEND_MARKET", reason, before, "SUSPENDED_EVENT_RISK", clock, true);
}
function recordLoss(state: DemoState, id: string, clock: string, fills: number, loss: number, reason: string) {
  state.timeline.push(addEvent(id, "STALE_QUOTES_EXPLOITED", state.tick, clock));
  setPhase(state, "DIVERGENCE");
  state.naive.staleFills = fills;
  state.naive.loss = loss;
  state.naive.exposure = fills * 100;
  state.guard.preventedFills = fills;
  log(state, id, "LOG_WARNING", reason, state.guard.status, state.guard.status, clock);
}
function reopen(state: DemoState, id: string, clock: string, reason: string, final = false) {
  state.guard.quotes = baseQuotes(state.fixture.initialFairProbability);
  state.guard.status = final ? "OPEN" : "REOPENED";
  setPhase(state, final ? "STABLE_OPEN" : "REOPENED");
  log(state, id, "REOPEN_MARKET", reason, "REPRICING", state.guard.status, clock, true);
}

function advanceFastReplay(state: DemoState) {
  if (state.tick === 6) suspendForRisk(state, "evt-goal", "GOAL", "58:21", "Goal detected. Quotes cancelled. Market suspended to prevent stale fills.", state.fixture.eventScore);
  else if (state.tick === 7) recordLoss(state, "evt-stale-fills", "16:22", 5, 600, "Prevented 5 stale fills worth 600.00 test units.");
  else if (state.tick === 12) {
    const review = addEvent("evt-var-review", "VAR_REVIEW_STARTED", state.tick, "61:10");
    state.timeline.push(review); const before = state.guard.status; state.guard.status = "SUSPENDED_VAR_REVIEW"; setPhase(state, "VAR_REVIEW");
    log(state, review.id, "SUSPEND_MARKET", "Market frozen. Goal under VAR review. Circuit breaker engaged.", before, "SUSPENDED_VAR_REVIEW", review.matchClock, true);
  } else if (state.tick === 18) {
    const resolution = addEvent("evt-overturn", "VAR_GOAL_OVERTURNED", state.tick, "63:02", state.fixture.resolvedScore);
    state.timeline.push(resolution); state.score = state.fixture.resolvedScore; state.naive.fairProbability = state.fixture.initialFairProbability; state.guard.fairProbability = state.fixture.initialFairProbability; state.guard.status = "REPRICING"; setPhase(state, "GOAL_OVERTURNED");
    log(state, resolution.id, "REPRICE_MARKET", "Goal resolution received. Fair probability recalculated. Quotes repriced.", "SUSPENDED_VAR_REVIEW", "REPRICING", resolution.matchClock, true);
  } else if (state.tick === 19) reopen(state, "evt-overturn", "63:03", "Fresh price available. Market reopened with lower limits.");
  else if (state.tick >= 20) { state.naive.status = "OPEN"; state.guard.status = "OPEN"; setPhase(state, "STABLE_OPEN"); }
  else if (state.tick >= 8 && state.tick <= 11) setPhase(state, "SUSPENDED");
}

function advanceFullIncidentReplay(state: DemoState) {
  switch (state.tick) {
    case 5:
      suspendForRisk(state, "evt-cross", "ODDS_UPDATE", "00:05", "Dangerous cross detected. Quotes cancelled before the incident develops.", undefined, "SUSPENDED");
      break;
    case 6:
      suspendForRisk(state, "evt-egypt-goal-1", "GOAL", "00:06", "Egypt goal detected. Market remains suspended while the score updates.", "0–1");
      recordLoss(state, "evt-egypt-goal-1-fills", "00:06", 5, 600, "Prevented 5 stale fills worth 600.00 test units.");
      break;
    case 13:
      suspendForRisk(state, "evt-penalty", "ODDS_UPDATE", "00:13", "Penalty awarded. VARGuard freezes quotes before the kick.", undefined, "SUSPENDED");
      break;
    case 18:
      recordLoss(state, "evt-penalty-saved-fills", "00:18", 8, 950, "Penalty saved. VARGuard prevented a second stale-fill window.");
      break;
    case 29:
      reopen(state, "evt-normal-play", "00:29", "Normal play resumed. Fresh quotes reopened with lower limits.");
      state.naive.status = "OPEN";
      break;
    case 54:
      suspendForRisk(state, "evt-counter-goal", "GOAL", "00:54", "Counter-event detected. Quotes cancelled pending validation.", "0–2");
      break;
    case 56: {
      const review = addEvent("evt-disallowed-goal", "VAR_GOAL_OVERTURNED", state.tick, "00:56", "0–1");
      state.timeline.push(review); state.score = "0–1"; state.guard.status = "SUSPENDED_VAR_REVIEW"; setPhase(state, "VAR_REVIEW");
      recordLoss(state, "evt-disallowed-goal-error", "00:56", 11, 1300, "Naive market carried a bad settlement risk. VARGuard held through review.");
      state.guard.status = "SUSPENDED_VAR_REVIEW"; setPhase(state, "VAR_REVIEW");
      log(state, review.id, "SUSPEND_MARKET", "Goal disallowed. Market remains frozen until the data packet is validated.", "SUSPENDED_EVENT_RISK", "SUSPENDED_VAR_REVIEW", review.matchClock, true);
      break;
    }
    case 61:
      state.naive.fairProbability = 0.58; state.guard.fairProbability = 0.58;
      reopen(state, "evt-play-resumed", "01:01", "Free kick completed. Market repriced cleanly back to 0–1."); state.naive.status = "OPEN";
      break;
    case 64:
      suspendForRisk(state, "evt-egypt-goal-2", "GOAL", "01:04", "Confirmed Egypt goal detected. Quotes cancelled immediately.", "0–2");
      recordLoss(state, "evt-egypt-goal-2-fills", "01:04", 14, 1600, "Prevented 14 stale fills worth 1,600.00 test units.");
      break;
    case 66:
      reopen(state, "evt-egypt-goal-2-reopen", "01:06", "Fresh price available after the confirmed goal."); state.naive.status = "OPEN";
      break;
    case 73:
      suspendForRisk(state, "evt-argentina-goal-1", "GOAL", "01:13", "Argentina comeback goal detected. Quotes cancelled before repricing.", "1–2");
      break;
    case 75:
      reopen(state, "evt-argentina-goal-1-reopen", "01:15", "Confirmed score repriced with lower limits."); state.naive.status = "OPEN";
      break;
    case 85:
      suspendForRisk(state, "evt-argentina-goal-2", "GOAL", "01:25", "Argentina equalizer detected. VARGuard freezes the market.", "2–2");
      recordLoss(state, "evt-argentina-goal-2-fills", "01:25", 18, 2200, "Prevented 18 stale fills across the comeback sequence.");
      break;
    case 87:
      reopen(state, "evt-argentina-goal-2-reopen", "01:27", "Market repriced after the confirmed equalizer."); state.naive.status = "OPEN";
      break;
    case 96:
      suspendForRisk(state, "evt-argentina-goal-3", "GOAL", "01:36", "Argentina winner detected. Quotes cancelled before the market can be exploited.", "3–2");
      recordLoss(state, "evt-argentina-goal-3-fills", "01:36", 22, 2800, "Prevented 22 stale fills worth 2,800.00 test units.");
      break;
    case 98:
      reopen(state, "evt-argentina-goal-3-reopen", "01:38", "Market repriced after the confirmed winner."); state.naive.status = "OPEN";
      break;
    case 130:
      reopen(state, "evt-fulltime-reopen", "02:10", "Replay complete. Market safely reopened with all protection receipts retained.", true);
      state.naive.status = "OPEN";
      break;
  }
}

export function advanceReplayTick(previous: DemoState): DemoState {
  if (previous.tick >= finalReplayTick(previous)) return structuredClone(previous);
  const state = structuredClone(previous);
  state.tick += 1;
  if (state.scenarioId === "full-incident") advanceFullIncidentReplay(state);
  else advanceFastReplay(state);
  return state;
}
