import { describe, expect, it } from "vitest";
import { advanceReplayTick, createDemoState } from "./engine";
import { EGYPT_ARGENTINA_FULL_INCIDENT_REPLAY, EGYPT_ARGENTINA_SHOCK_REPLAY } from "./fixtures";
import { projectDecisionLog } from "./agent-log";
import { projectDemoTelemetryReceipt } from "./mock-ledger";

const fullAt = (tick: number) => Array.from({ length: tick }).reduce(state => advanceReplayTick(state), createDemoState(EGYPT_ARGENTINA_FULL_INCIDENT_REPLAY));
const fastAt = (tick: number) => Array.from({ length: tick }).reduce(state => advanceReplayTick(state), createDemoState(EGYPT_ARGENTINA_SHOCK_REPLAY));

describe("deterministic autonomous policy telemetry", () => {
  it("adds the required Fast decision entries from replay ticks", () => {
    expect(projectDecisionLog(fastAt(0))).toEqual([]);
    expect(projectDecisionLog(fastAt(5)).at(-1)?.message).toContain("TxLINE-style match telemetry active");
    expect(projectDecisionLog(fastAt(6)).at(-1)?.message).toContain("Circuit breaker tripped");
    expect(projectDecisionLog(fastAt(7)).at(-1)?.message).toContain("avoided 600.00 test units");
    expect(projectDecisionLog(fastAt(12)).at(-1)?.message).toContain("Settlement and reopening are paused");
    expect(projectDecisionLog(fastAt(18)).at(-1)?.message).toContain("Score returned to 2–0");
    expect(projectDecisionLog(fastAt(20)).at(-1)?.message).toContain("Market reopened with protected limits");
  });

  it("adds every Full incident entry once with stable IDs", () => {
    const entries = projectDecisionLog(fullAt(130));
    expect(entries.map(entry => entry.tick)).toEqual([5, 6, 13, 18, 54, 56, 61, 64, 73, 85, 96, 130]);
    expect(new Set(entries.map(entry => entry.id)).size).toBe(entries.length);
    expect(projectDecisionLog(fullAt(130))).toEqual(entries);
  });

  it("projects the latest demo-only telemetry receipt from the replay", () => {
    const atGoal = projectDemoTelemetryReceipt(fullAt(6));
    expect(atGoal).toMatchObject({ receipt_type: "DEMO_TELEMETRY_RECEIPT", network: "solana-devnet-style", transaction_signature: "demo_5vNx_8pZaQ" });
    expect(atGoal.event).toMatchObject({ tick: 6, sequence_id: 2094 });
    expect(atGoal.agent_action.estimated_loss_avoided).toBe("600.00 test units");
    expect(projectDemoTelemetryReceipt(fullAt(56)).event).toMatchObject({ tick: 56, asserted_state: "VAR_REVIEW" });
    const final = projectDemoTelemetryReceipt(fullAt(130));
    expect(final.agent_action).toMatchObject({ prevented_fills: 22, estimated_loss_avoided: "2800.00 test units" });
    expect(final.verification.status).toBe("demo_only_not_submitted_onchain");
  });
});
