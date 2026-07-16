import type { DemoState } from "./types";

export type MatchVisualPhase = "NORMAL_PLAY" | "GOAL_DETECTED" | "MARKET_DIVERGENCE" | "DANGER_HELD" | "VAR_REVIEW" | "GOAL_OVERTURNED" | "MARKET_REOPENED";
export interface VisualPlayer { x: number; y: number; role: "GOALKEEPER" | "OUTFIELD"; }
export type TacticalShape = "BALANCED" | "ATTACKING_RIGHT" | "ATTACKING_LEFT" | "DEEP_RIGHT_BLOCK" | "DEEP_LEFT_BLOCK" | "COMPACT_MIDFIELD" | "TRANSITION_RIGHT" | "GAME_MANAGEMENT";
export type BallLane = "CENTER" | "LEFT_GOAL" | "LEFT_BOX" | "RIGHT_WING" | "RIGHT_BOX" | "RIGHT_GOAL" | "EGYPT_GOALKEEPER";

export interface MatchVisual {
  phase: MatchVisualPhase;
  score: string;
  scoreStatus: "CONFIRMED" | "PROVISIONAL";
  callout: string;
  cue: string;
  ball: { x: number; y: number };
  ballLane: BallLane;
  riskAnchor: "NONE" | "EGYPT_GOAL" | "ARGENTINA_GOAL";
  egyptPlayers: VisualPlayer[];
  argentinaPlayers: VisualPlayer[];
  egyptShape: TacticalShape;
  argentinaShape: TacticalShape;
  attackTeam: "NONE" | "EGYPT" | "ARGENTINA";
  attackDirection: "NONE" | "LEFT" | "RIGHT";
  riskWindow: boolean;
  naiveOverlay: "NONE" | "STILL_OPEN";
  guardOverlay: "NONE" | "FROZEN" | "REPRICING" | "REOPENED";
  progress: number;
}

const formation = (positions: Array<[number, number]>): VisualPlayer[] => positions.map(([x, y], index) => ({ x, y, role: index === 0 ? "GOALKEEPER" : "OUTFIELD" }));
const egyptPlayers = formation([[7, 50], [19, 18], [20, 39], [20, 61], [19, 82], [34, 28], [35, 50], [34, 72], [47, 23], [48, 50], [47, 77]]);
const argentinaBase = formation([[93, 50], [81, 18], [80, 39], [80, 61], [81, 82], [66, 28], [65, 50], [66, 72], [53, 23], [52, 50], [53, 77]]);
const argentinaAttack = formation([[93, 50], [74, 18], [73, 39], [73, 61], [74, 82], [57, 28], [56, 50], [57, 72], [37, 23], [31, 50], [37, 77]]);
const mirrorFormation = (players: VisualPlayer[]): VisualPlayer[] => players.map(player => ({ ...player, x: 100 - player.x }));
const egyptAttack = mirrorFormation(argentinaAttack);
const argentinaDeepRight = formation([[93, 50], [86, 19], [84, 39], [84, 61], [86, 81], [74, 28], [73, 50], [74, 72], [62, 28], [64, 50], [62, 72]]);
const egyptDeepLeft = mirrorFormation(argentinaDeepRight);
const compactEgypt = formation([[7, 50], [30, 25], [29, 42], [29, 58], [30, 75], [42, 34], [43, 50], [42, 66], [48, 39], [49, 50], [48, 61]]);
const compactArgentina = mirrorFormation(compactEgypt);
const egyptTransitionRight = formation([[7, 50], [24, 22], [24, 40], [24, 60], [24, 78], [42, 30], [43, 50], [42, 70], [59, 26], [64, 50], [59, 74]]);
const argentinaPressLeft = formation([[93, 50], [76, 22], [76, 40], [76, 60], [76, 78], [58, 30], [57, 50], [58, 70], [41, 26], [36, 50], [41, 74]]);

const normal = (state: DemoState): MatchVisual => ({ phase: "NORMAL_PLAY", score: state.fixture.halftimeScore, scoreStatus: "CONFIRMED", callout: "NORMAL PLAY", cue: "Synthetic tactical visual · event state from VARGuard replay", ball: { x: 50, y: 50 }, ballLane: "CENTER", riskAnchor: "NONE", egyptPlayers, argentinaPlayers: argentinaBase, egyptShape: "BALANCED", argentinaShape: "BALANCED", attackTeam: "NONE", attackDirection: "NONE", riskWindow: false, naiveOverlay: "NONE", guardOverlay: "NONE", progress: state.tick / state.fixture.durationTicks });

export function projectMatchVisual(state: DemoState): MatchVisual {
  if (state.scenarioId === "full-incident") return projectFullIncidentVisual(state);
  const base = normal(state);
  const progress = state.tick / state.fixture.durationTicks;
  if (state.tick <= 5) return base;
  if (state.tick === 6) return { ...base, phase: "GOAL_DETECTED", score: state.fixture.eventScore, callout: "GOAL DETECTED", cue: "Argentina attack reaches the goal · stale quote risk begins", ball: { x: 9, y: 50 }, argentinaPlayers: argentinaAttack, attackTeam: "ARGENTINA", attackDirection: "LEFT", riskWindow: true, progress };
  if (state.tick <= 11) return { ...base, phase: state.tick === 7 ? "MARKET_DIVERGENCE" : "DANGER_HELD", score: state.fixture.eventScore, callout: state.tick === 7 ? "RISK WINDOW · QUOTES CANCELLED" : "TRADING SAFELY FROZEN", cue: "Naive quotes remain open while VARGuard freezes the market", ball: { x: 9, y: 50 }, argentinaPlayers: argentinaAttack, attackTeam: "ARGENTINA", attackDirection: "LEFT", riskWindow: true, naiveOverlay: "STILL_OPEN", guardOverlay: "FROZEN", progress };
  if (state.tick <= 17) return { ...base, phase: "VAR_REVIEW", score: state.fixture.eventScore, scoreStatus: "PROVISIONAL", callout: "VAR REVIEW", cue: "Score is provisional · VARGuard holds through verification", ball: { x: 9, y: 50 }, argentinaPlayers: argentinaAttack, attackTeam: "ARGENTINA", attackDirection: "LEFT", riskWindow: true, naiveOverlay: "STILL_OPEN", guardOverlay: "FROZEN", progress };
  if (state.tick === 18) return { ...base, phase: "GOAL_OVERTURNED", score: state.fixture.resolvedScore, callout: "GOAL OVERTURNED · REPRICING", cue: "Risk cleared · fair probability is recalculated", ball: { x: 50, y: 50 }, naiveOverlay: "STILL_OPEN", guardOverlay: "REPRICING", progress };
  return { ...base, phase: "MARKET_REOPENED", score: state.fixture.resolvedScore, callout: "MARKET REOPENED", cue: "Fresh limits and quotes are available after protection", ball: { x: 50, y: 50 }, naiveOverlay: "STILL_OPEN", guardOverlay: "REOPENED", progress };
}

type FullTacticalStage = {
  attackTeam: "NONE" | "EGYPT" | "ARGENTINA";
  callout: string;
  cue: string;
  riskWindow: boolean;
  ball: { x: number; y: number };
  ballLane: BallLane;
  riskAnchor: "NONE" | "EGYPT_GOAL" | "ARGENTINA_GOAL";
  egyptPlayers: VisualPlayer[];
  argentinaPlayers: VisualPlayer[];
  egyptShape: TacticalShape;
  argentinaShape: TacticalShape;
  provisional?: boolean;
  reopened?: boolean;
};

function fullTacticalStage(tick: number): FullTacticalStage {
  const stage = (overrides: Partial<FullTacticalStage> = {}): FullTacticalStage => ({
    attackTeam: "NONE", callout: "NORMAL PLAY", cue: "Synthetic tactical visual · event state from VARGuard replay", riskWindow: false,
    ball: { x: 50, y: 50 }, ballLane: "CENTER", riskAnchor: "NONE", egyptPlayers, argentinaPlayers: argentinaBase,
    egyptShape: "BALANCED", argentinaShape: "BALANCED", ...overrides,
  });
  const egyptRight = (callout: string, cue: string, lane: BallLane, ball: { x: number; y: number }) => stage({ attackTeam: "EGYPT", callout, cue, riskWindow: true, ball, ballLane: lane, riskAnchor: "ARGENTINA_GOAL", egyptPlayers: egyptAttack, argentinaPlayers: argentinaDeepRight, egyptShape: "ATTACKING_RIGHT", argentinaShape: "DEEP_RIGHT_BLOCK" });
  const argentinaLeft = (callout: string, cue: string, lane: BallLane, ball: { x: number; y: number }) => stage({ attackTeam: "ARGENTINA", callout, cue, riskWindow: true, ball, ballLane: lane, riskAnchor: "EGYPT_GOAL", egyptPlayers: egyptDeepLeft, argentinaPlayers: argentinaAttack, egyptShape: "DEEP_LEFT_BLOCK", argentinaShape: "ATTACKING_LEFT" });

  if (tick >= 130) return stage({ callout: "MARKET REOPENED", cue: "Final score confirmed · protected market safely reopened", egyptPlayers: compactEgypt, argentinaPlayers: compactArgentina, egyptShape: "GAME_MANAGEMENT", argentinaShape: "GAME_MANAGEMENT", reopened: true });
  if (tick >= 98) return stage({ callout: "SCORE CONFIRMED", cue: "Argentina winner confirmed · compact game management retains protection metrics", egyptPlayers: compactEgypt, argentinaPlayers: compactArgentina, egyptShape: "GAME_MANAGEMENT", argentinaShape: "GAME_MANAGEMENT" });
  if (tick >= 96) return argentinaLeft("ARGENTINA WINNER", "Argentina attacks left for the winner · quotes cancelled before repricing", "LEFT_GOAL", { x: 9, y: 50 });
  if (tick >= 87) return stage({ callout: "ARGENTINA FINAL PUSH", cue: "Argentina stays advanced for the final push", ball: { x: 27, y: 50 }, ballLane: "LEFT_BOX", egyptPlayers: egyptDeepLeft, argentinaPlayers: argentinaPressLeft, egyptShape: "DEEP_LEFT_BLOCK", argentinaShape: "ATTACKING_LEFT" });
  if (tick >= 85) return argentinaLeft("ARGENTINA EQUALIZER", "Argentina attacks left · market frozen before the equalizer reprices", "LEFT_GOAL", { x: 9, y: 50 });
  if (tick >= 73) return stage({ attackTeam: "ARGENTINA", callout: "ARGENTINA COMEBACK", cue: "Argentina presses left after 1–2 · the ball advances toward Egypt's box", riskWindow: true, ball: { x: 28, y: 50 }, ballLane: "LEFT_BOX", riskAnchor: "EGYPT_GOAL", egyptPlayers: egyptDeepLeft, argentinaPlayers: argentinaPressLeft, egyptShape: "DEEP_LEFT_BLOCK", argentinaShape: "ATTACKING_LEFT" });
  if (tick >= 67) return stage({ callout: "NORMAL PLAY", cue: "Neutral restart after repricing", egyptPlayers: compactEgypt, argentinaPlayers: compactArgentina, egyptShape: "COMPACT_MIDFIELD", argentinaShape: "COMPACT_MIDFIELD", reopened: true });
  if (tick >= 64) return egyptRight("CONFIRMED EGYPT GOAL", "Egypt attacks right · quotes cancelled before repricing", "RIGHT_GOAL", { x: 91, y: 50 });
  if (tick >= 61) return stage({ attackTeam: "EGYPT", callout: "FREE KICK · RESTART", cue: "Free kick restarts the protected market from a neutral-to-right transition", ball: { x: 61, y: 50 }, ballLane: "RIGHT_WING", egyptPlayers: egyptTransitionRight, argentinaPlayers: argentinaBase, egyptShape: "TRANSITION_RIGHT", argentinaShape: "BALANCED", reopened: true });
  if (tick >= 56) return { ...egyptRight("GOAL DISALLOWED · VAR HOLD", "Egypt counter remains held at Argentina's goal while VAR validates the event", "RIGHT_GOAL", { x: 91, y: 50 }), provisional: true };
  if (tick >= 54) return egyptRight("EGYPT COUNTER DETECTED", "Egypt counter reaches Argentina's goal · apparent 0–2 triggers a protection hold", "RIGHT_GOAL", { x: 91, y: 50 });
  if (tick >= 45) return stage({ attackTeam: "EGYPT", callout: "EGYPT COUNTER BUILD", cue: "Egypt builds a rightward counter from midfield", ball: { x: 67, y: 58 }, ballLane: "RIGHT_WING", egyptPlayers: egyptTransitionRight, argentinaPlayers: argentinaBase, egyptShape: "TRANSITION_RIGHT", argentinaShape: "BALANCED" });
  if (tick >= 37) return stage({ callout: "MIDFIELD RESET", cue: "Both teams compact around midfield during the end-to-end window", egyptPlayers: compactEgypt, argentinaPlayers: compactArgentina, egyptShape: "COMPACT_MIDFIELD", argentinaShape: "COMPACT_MIDFIELD" });
  if (tick >= 29) return stage({ attackTeam: "ARGENTINA", callout: "ARGENTINA PRESSURE", cue: "Argentina presses left during normal play", ball: { x: 34, y: 42 }, ballLane: "LEFT_BOX", egyptPlayers: egyptDeepLeft, argentinaPlayers: argentinaPressLeft, egyptShape: "DEEP_LEFT_BLOCK", argentinaShape: "ATTACKING_LEFT", reopened: true });
  if (tick >= 18) return stage({ attackTeam: "ARGENTINA", callout: "PENALTY SAVED", cue: "Penalty saved · ball returns to Egypt's goalkeeper before a guarded transition", riskWindow: true, ball: { x: 9, y: 50 }, ballLane: "EGYPT_GOALKEEPER", riskAnchor: "EGYPT_GOAL", egyptPlayers: egyptDeepLeft, argentinaPlayers: argentinaAttack, egyptShape: "DEEP_LEFT_BLOCK", argentinaShape: "ATTACKING_LEFT" });
  if (tick >= 13) return argentinaLeft("ARGENTINA PENALTY", "Argentina attacks left · referee decision triggers a protection hold", "LEFT_GOAL", { x: 9, y: 50 });
  if (tick >= 6) return egyptRight("EGYPT GOAL", "Egypt remains advanced in Argentina's box after the 0–1 goal", "RIGHT_GOAL", { x: 91, y: 50 });
  if (tick >= 5) return egyptRight("DANGEROUS CROSS", "Egypt crosses from the right wing into Argentina's box · quotes suspended", "RIGHT_WING", { x: 82, y: 31 });
  return stage();
}

function projectFullIncidentVisual(state: DemoState): MatchVisual {
  const stage = fullTacticalStage(state.tick);
  const attackDirection = stage.attackTeam === "EGYPT" ? "RIGHT" : stage.attackTeam === "ARGENTINA" ? "LEFT" : "NONE";
  const isFrozen = stage.riskWindow && !stage.reopened;
  return {
    phase: stage.provisional ? "VAR_REVIEW" : stage.reopened ? "MARKET_REOPENED" : stage.riskWindow ? "DANGER_HELD" : "NORMAL_PLAY",
    score: state.score,
    scoreStatus: stage.provisional ? "PROVISIONAL" : "CONFIRMED",
    callout: stage.callout,
    cue: stage.cue,
    ball: stage.ball,
    ballLane: stage.ballLane,
    riskAnchor: stage.riskAnchor,
    egyptPlayers: stage.egyptPlayers,
    argentinaPlayers: stage.argentinaPlayers,
    egyptShape: stage.egyptShape,
    argentinaShape: stage.argentinaShape,
    attackTeam: stage.attackTeam,
    attackDirection,
    riskWindow: stage.riskWindow,
    naiveOverlay: state.naive.loss > 0 ? "STILL_OPEN" : "NONE",
    guardOverlay: stage.reopened ? "REOPENED" : stage.provisional || isFrozen ? "FROZEN" : "NONE",
    progress: state.tick / state.fixture.durationTicks,
  };
}
