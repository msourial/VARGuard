import type { DemoState, HedgeRecommendationType } from "./types";

export interface HedgeAdvisorBrief {
  riskDetected: string;
  exposureConcern: string;
  recommendedMoves: Array<{ type: HedgeRecommendationType; label: string }>;
  reason: string;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  source: "DETERMINISTIC_RECEIPT";
  mode: "TEMPLATE_FALLBACK" | "AI";
}

export function projectHedgeAdvisor(state: DemoState): HedgeAdvisorBrief | null {
  const firstAdvisoryTick = state.scenarioId === "full-incident" ? 5 : 7;
  if (state.tick < firstAdvisoryTick || state.receipts.length === 0) return null;
  const receipt = state.receipts.at(-1);
  const full = state.scenarioId === "full-incident";
  return {
    riskDetected: full ? `Latest protected incident: ${receipt?.reason ?? "risk event detected"}` : "Argentina comeback goal detected while Egypt-win exposure is elevated.",
    exposureConcern: full ? `${state.guard.preventedFills} stale fills have been prevented while Naive Market has accumulated ${state.naive.loss.toFixed(2)} test units of loss.` : "Naive quotes remained open after the score shock and absorbed stale flow.",
    recommendedMoves: [
      { type: "CANCEL_RISK_QUOTES", label: "Cancel Egypt-win quotes" },
      { type: "REDUCE_ORDER_SIZE", label: "Reduce max order size to 25 test units" },
      { type: "WIDEN_SPREAD", label: "Widen spread by 3%" },
      { type: "QUOTE_RISK_REDUCING_SIDE_ONLY", label: "Quote only risk-reducing Argentina/Draw exposure" },
      { type: "HOLD_UNTIL_VAR_RESOLUTION", label: "Hold until VAR resolution" },
      ...(state.tick >= 19 ? [{ type: "REOPEN_WITH_LOWER_LIMITS" as const, label: "Reopen with lower limits" }] : []),
    ],
    reason: `Latest completed receipt ${receipt?.id ?? "unavailable"}: ${receipt?.reason ?? "The deterministic circuit breaker has already protected the market."} These are operator recommendations only.`,
    confidence: "HIGH",
    source: "DETERMINISTIC_RECEIPT",
    mode: "TEMPLATE_FALLBACK",
  };
}
