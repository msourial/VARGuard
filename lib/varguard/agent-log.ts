import type { DemoState } from "./types";

export type AgentLogLevel = "MONITOR" | "SHIELD" | "FREEZE" | "PROTECTED" | "REOPENED";

export interface DecisionLogEntry {
  id: string;
  tick: number;
  level: AgentLogLevel;
  message: string;
}

/**
 * Deterministic policy telemetry for the demo. It is deliberately keyed to
 * DemoState.tick rather than any media callback or external feed.
 */
export function projectDecisionLog(state: DemoState): DecisionLogEntry[] {
  const entries: DecisionLogEntry[] = [];
  const push = (tick: number, level: AgentLogLevel, message: string) => {
    if (state.tick >= tick) entries.push({ id: `${state.scenarioId}-decision-${tick}`, tick, level, message });
  };

  if (state.scenarioId === "full-incident") {
    push(5, "MONITOR", "🤖 [AGENT] TxLINE-style match telemetry active. Monitoring cross velocity, score, feed freshness, and exposure thresholds.");
    push(6, "SHIELD", "🚨 [SHIELD ACTIVE] Egypt goal signal detected. Circuit breaker tripped; exposed quotes canceled before stale prices could be filled.");
    push(13, "FREEZE", "⚠️ [RISK FREEZE] In-play penalty marker active. Volatility limits exceeded; liability pools remain frozen.");
    push(18, "PROTECTED", "✅ [LOSS PREVENTED] Penalty save confirmed. VARGuard retained protected limits through the adverse-selection window.");
    push(54, "SHIELD", "🚨 [SHIELD ACTIVE] Egypt counter event detected. Quote engine suspended while the apparent goal is validated.");
    push(56, "FREEZE", "⏸️ [VAR FREEZE] Score event flagged UNDER_REVIEW. Halting simulated settlement protocols to protect market makers from false parameters.");
    push(61, "REOPENED", "🟢 [REOPENED] Free-kick state confirmed. Clean 0–1 price published with protected limits.");
    push(64, "SHIELD", "🚨 [SHIELD ACTIVE] Confirmed Egypt goal received. Quotes canceled before the 0–2 repricing cycle.");
    push(73, "PROTECTED", "✅ [LOSS PREVENTED] Argentina comeback signal protected. Risk limits tightened before repricing.");
    push(85, "SHIELD", "🚨 [SHIELD ACTIVE] Argentina equalizer detected. Market frozen before stale prices could be exploited.");
    push(96, "PROTECTED", "✅ [REPRICE] Argentina winner confirmed. Fresh protected price prepared with lower limits.");
    push(130, "REOPENED", "🟢 [REOPENED] Final state confirmed. Market safely reopened with all protection metrics retained.");
    return entries;
  }

  push(5, "MONITOR", "🤖 [AGENT] TxLINE-style match telemetry active. Monitoring score, odds, feed freshness, and exposure thresholds.");
  push(6, "SHIELD", "🚨 [SHIELD ACTIVE] Goal signal detected. Circuit breaker tripped. Quotes cancelled and market frozen before stale prices could be filled.");
  push(7, "PROTECTED", "✅ [LOSS PREVENTED] Naive market accepted 5 bad trades. VARGuard blocked 5 bad trades and avoided 600.00 test units of loss.");
  push(12, "FREEZE", "⏸️ [VAR FREEZE] Event under review. Settlement and reopening are paused until the match state is resolved.");
  push(18, "PROTECTED", "🔄 [REPRICE] Goal overturned. Score returned to 2–0. Fair probability reset and quotes prepared for reopening.");
  push(20, "REOPENED", "🟢 [REOPENED] Fresh state confirmed. Market reopened with protected limits.");
  return entries;
}

/** Backward-compatible alias for callers that previously imported the agent projection. */
export const projectAgentLog = projectDecisionLog;
