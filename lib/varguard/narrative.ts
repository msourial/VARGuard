import type { DemoState, ReplayPhase } from "./types";

export interface NarrativeStep { id: string; tick: number; title: string; detail: string; state: "upcoming" | "active" | "complete"; }
export interface ReplayNarrative { bannerTitle: string; bannerSubtitle: string; result: string; naiveResponse: string; guardResponse: string; steps: NarrativeStep[]; decisions: string[]; }

const step = (id: string, tick: number, title: string, detail: string, current: number): NarrativeStep => ({ id, tick, title, detail, state: current < tick ? "upcoming" : current === tick ? "active" : "complete" });

export function replayPhaseLabel(phase: ReplayPhase) {
  if (phase === "DIVERGENCE") return "SUSPENDED · STALE FILL EVENT";
  if (phase === "GOAL_OVERTURNED") return "GOAL OVERTURNED · REPRICING";
  if (phase === "STABLE_OPEN") return "OPEN";
  return phase.replaceAll("_", " ");
}

export function projectReplayNarrative(state: DemoState): ReplayNarrative {
  if (state.scenarioId === "full-incident") return projectFullIncidentNarrative(state);
  const tick = state.tick;
  let bannerTitle = "Ready to replay", bannerSubtitle = `Both markets start open with ${state.fixture.homeTeam} leading ${state.fixture.halftimeScore}.`, naiveResponse = "Waiting", guardResponse = "Monitoring";
  if (tick >= 1 && tick <= 5) { bannerTitle = "Normal trading"; bannerSubtitle = "Both systems are open. No stale fills yet."; }
  if (tick >= 6) { bannerTitle = "ARGENTINA GOAL DETECTED"; bannerSubtitle = `Score changes to ${state.fixture.eventScore}. Old prices are now dangerous.`; naiveResponse = "Did nothing"; guardResponse = "Trading paused"; }
  if (tick >= 7) { bannerTitle = "NAIVE MARKET EXPLOITED"; bannerSubtitle = "Naive Market stays open and takes 5 bad trades at old prices."; }
  if (tick >= 12) { bannerTitle = "VAR REVIEW"; bannerSubtitle = "VARGuard keeps the market frozen until the event is resolved."; guardResponse = "Market frozen"; }
  if (tick >= 18) { bannerTitle = "GOAL OVERTURNED"; bannerSubtitle = `Score returns to ${state.fixture.resolvedScore}. VARGuard reprices before reopening.`; guardResponse = "Repricing"; }
  if (tick >= 20) { bannerTitle = "MARKET REOPENED"; bannerSubtitle = "Replay complete. VARGuard avoided 600 test units of loss."; guardResponse = "Reopened safely"; }
  const result = tick >= 20 ? "Replay complete: Naive lost 600.00. VARGuard lost 0.00. VARGuard avoided 600.00 test units." : tick >= 7 ? "Winner: VARGuard — 5 bad trades stopped, 600.00 test units saved." : "Both markets are open. No loss yet.";
  const steps = [
    step("normal", 1, "Normal trading", "Both markets open", tick),
    step("goal", 6, "Comeback goal detected", `Score moves to ${state.fixture.eventScore}`, tick),
    step("naive", 7, "Naive exploited", "5 bad trades · 600 loss", tick),
    step("suspend", 7, "VARGuard freezes trading", "Old prices removed · market frozen", tick),
    step("review", 12, "VAR review", "Market remains frozen", tick),
    step("reopen", 20, "Goal resolved / market reopened", "Fair probability reset · fresh price", tick),
  ];
  const decisions: string[] = [];
  if (tick >= 6) decisions.push("Goal detected. VARGuard cancelled quotes and suspended the market.");
  if (tick >= 7) decisions.push("Prevented 5 stale fills worth 600.00 test units.");
  if (tick >= 12) decisions.push("VAR review started. Market remains frozen.");
  if (tick >= 18) decisions.push(`Goal overturned. Probability reset to ${Math.round(state.fixture.initialFairProbability * 100)}%.`);
  if (tick >= 19) decisions.push("Fresh price available. Market reopened with lower limits.");
  return { bannerTitle, bannerSubtitle, result, naiveResponse, guardResponse, steps, decisions };
}

function projectFullIncidentNarrative(state: DemoState): ReplayNarrative {
  const tick = state.tick;
  let bannerTitle = "Ready for the full incident replay", bannerSubtitle = "A long-form synthetic sequence with multiple protected market shocks.", naiveResponse = "Monitoring", guardResponse = "Monitoring";
  if (tick >= 5) { bannerTitle = "DANGEROUS CROSS DETECTED"; bannerSubtitle = "VARGuard removes exposed quotes before the incident develops."; naiveResponse = "Still quoting"; guardResponse = "Trading paused"; }
  if (tick >= 6) { bannerTitle = "EGYPT GOAL DETECTED"; bannerSubtitle = "The first score shock creates a stale-quote window."; naiveResponse = "Old prices open"; guardResponse = "Protection active"; }
  if (tick >= 13) { bannerTitle = "PENALTY INCIDENT"; bannerSubtitle = "VARGuard keeps the market frozen through the kick and save."; guardResponse = "Market frozen"; }
  if (tick >= 29) { bannerTitle = "NORMAL PLAY RESUMED"; bannerSubtitle = "Fresh prices return only after the incident is resolved."; naiveResponse = "Open"; guardResponse = "Reopened safely"; }
  if (tick >= 54) { bannerTitle = "COUNTER-EVENT DETECTED"; bannerSubtitle = "VARGuard suspends again while the apparent goal is validated."; naiveResponse = "Still quoting"; guardResponse = "Trading paused"; }
  if (tick >= 56) { bannerTitle = "GOAL DISALLOWED · VAR HOLD"; bannerSubtitle = "Naive pricing risks a bad settlement; VARGuard holds until the data is clean."; naiveResponse = "Critical error"; guardResponse = "VAR hold"; }
  if (tick >= 64) { bannerTitle = "SECOND EGYPT GOAL"; bannerSubtitle = "The market shock returns; VARGuard protects before repricing."; }
  if (tick >= 73) { bannerTitle = "ARGENTINA COMEBACK"; bannerSubtitle = "Each comeback goal is independently suspended and repriced."; }
  if (tick >= 96) { bannerTitle = "ARGENTINA WINNER"; bannerSubtitle = "The final comeback shock is protected before the market reopens."; }
  if (tick >= 130) { bannerTitle = "MARKET REOPENED"; bannerSubtitle = "Replay complete. VARGuard retained protection through every major incident."; naiveResponse = "2,800 lost"; guardResponse = "2,800 protected"; }
  const result = tick >= 130 ? "Replay complete: Naive lost 2,800.00. VARGuard lost 0.00. VARGuard avoided 2,800.00 test units." : tick >= 6 ? `VARGuard has protected ${state.guard.preventedFills} bad trades and ${state.naive.loss.toFixed(2)} test units so far.` : "The long-form replay is ready. Start when you want the advanced proof.";
  const steps = [
    step("cross", 5, "Dangerous cross", "VARGuard pauses before the incident", tick),
    step("goal-one", 6, "Egypt goal", "First stale-quote shock", tick),
    step("penalty", 13, "Penalty incident", "Market held through the save", tick),
    step("disallowed", 56, "Disallowed goal", "VARGuard waits through validation", tick),
    step("goal-two", 64, "Second Egypt goal", "New protection cycle", tick),
    step("comeback", 73, "Argentina comeback", "Goals reprice through the finish", tick),
    step("winner", 96, "Argentina winner", "Final stale-fill protection", tick),
    step("reopen", 130, "Safe reopen", "All protection metrics retained", tick),
  ];
  const decisions = state.actions.filter(action => action.type !== "LOG_WARNING").slice(-6).map(action => action.reason);
  return { bannerTitle, bannerSubtitle, result, naiveResponse, guardResponse, steps, decisions };
}
