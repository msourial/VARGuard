export interface SyntheticReplayFixture {
  id: string;
  scenarioId: "fast-judge" | "full-incident";
  homeTeam: string;
  awayTeam: string;
  label: string;
  helperText: string;
  durationTicks: number;
  videoDurationSeconds: number;
  halftimeScore: string;
  eventScore: string;
  resolvedScore: string;
  initialFairProbability: number;
  description: string;
  expectedMetrics: { staleFills: number; naiveLoss: number; preventedFills: number; avoidedLoss: number };
}

/** A fictional, offline replay inspired by an underdog shock scenario. */
export const EGYPT_ARGENTINA_SHOCK_REPLAY: SyntheticReplayFixture = {
  id: "egypt-argentina-shock-replay",
  scenarioId: "fast-judge",
  homeTeam: "Egypt",
  awayTeam: "Argentina",
  label: "Synthetic international tournament replay",
  helperText: "20-second summary of the core 600-unit protection story.",
  durationTicks: 20,
  videoDurationSeconds: 140,
  halftimeScore: "2–0",
  eventScore: "2–1",
  resolvedScore: "2–0",
  initialFairProbability: 0.72,
  description: "An offline match-changing event inspired by a dramatic underdog comeback scenario; not verified historical match data.",
  expectedMetrics: { staleFills: 5, naiveLoss: 600, preventedFills: 5, avoidedLoss: 600 },
};

/** A longer fictional incident sequence. It is deterministic, offline, and not historical match data. */
export const EGYPT_ARGENTINA_FULL_INCIDENT_REPLAY: SyntheticReplayFixture = {
  id: "egypt-argentina-full-incident-replay",
  scenarioId: "full-incident",
  // Full replay follows the supplied clip's visible home–away scoreboard order.
  homeTeam: "Argentina",
  awayTeam: "Egypt",
  label: "Full incident replay",
  helperText: "Complete synthetic video-synced incident replay.",
  durationTicks: 130,
  videoDurationSeconds: 130,
  halftimeScore: "0–0",
  eventScore: "0–1",
  resolvedScore: "3–2",
  initialFairProbability: 0.5,
  description: "A long-form synthetic incident replay based on supplied demo timing; not verified historical match data.",
  expectedMetrics: { staleFills: 22, naiveLoss: 2800, preventedFills: 22, avoidedLoss: 2800 },
};

export const REPLAY_SCENARIOS = [EGYPT_ARGENTINA_SHOCK_REPLAY, EGYPT_ARGENTINA_FULL_INCIDENT_REPLAY] as const;

export function replayScenarioById(scenarioId: SyntheticReplayFixture["scenarioId"]): SyntheticReplayFixture {
  return REPLAY_SCENARIOS.find(scenario => scenario.scenarioId === scenarioId) ?? EGYPT_ARGENTINA_SHOCK_REPLAY;
}
