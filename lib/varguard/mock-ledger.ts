import type { DemoState } from "./types";

/** A display-only receipt payload for the offline demo; it is never submitted on-chain. */
export function projectDemoTelemetryReceipt(state: DemoState) {
  const receipt = state.receipts.at(-1);
  const action = state.actions.at(-1);
  const event = state.timeline.at(-1);
  const avoidedLoss = Math.max(0, state.naive.loss - state.guard.loss);
  return {
    receipt_type: "DEMO_TELEMETRY_RECEIPT",
    network: "solana-devnet-style",
    transaction_signature: "demo_5vNx_8pZaQ",
    slot: 284910284 + state.tick,
    program_id: "TxLINE11111111111111111111111111111111",
    fixture: {
      id: state.fixture.id,
      mode: state.scenarioId === "fast-judge" ? "fast-judge-demo" : "full-incident-replay",
      source: "synthetic replay",
    },
    event: {
      tick: state.tick,
      sequence_id: 2088 + state.tick,
      type: event?.type ?? "MATCH_STATE_MONITORING",
      asserted_state: state.phase,
    },
    agent_action: {
      policy: action?.type === "REPRICE_MARKET" ? "REPRICE_AFTER_VERIFICATION" : "GOAL_CIRCUIT_BREAKER",
      action: action?.type ?? "MONITOR_MARKET_STATE",
      quotes_cancelled: state.guard.cancelledQuotes,
      prevented_fills: state.guard.preventedFills,
      estimated_loss_avoided: `${avoidedLoss.toFixed(2)} test units`,
    },
    verification: {
      verifiable_merkle_root: "demo_0x7f83b1a2c3d4e5f6",
      agent_policy_hash: "demo_0x3a99f1",
      status: "demo_only_not_submitted_onchain",
    },
    latest_receipt: receipt?.id ?? "NO_RECEIPT_YET",
  };
}

export const projectMockDevnetLedger = projectDemoTelemetryReceipt;
