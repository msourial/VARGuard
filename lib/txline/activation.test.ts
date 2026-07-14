import { describe, expect, it } from "vitest";
import {
  activationError,
  activationMessage,
  MIN_DEVNET_SOL,
  shortenPublicKey,
} from "./activation";

describe("TxLINE devnet activation helpers", () => {
  it("constructs the documented transaction activation preimage", () => {
    expect(activationMessage("5Ntx", "guest-jwt")).toBe("5Ntx::guest-jwt");
  });

  it("uses a small non-zero Devnet SOL preflight threshold", () => {
    expect(MIN_DEVNET_SOL).toBeGreaterThan(0);
    expect(MIN_DEVNET_SOL).toBeLessThan(0.01);
  });

  it("keeps the connected wallet display compact", () => {
    expect(shortenPublicKey("123456789ABCDEFGH")).toBe("1234…EFGH");
  });

  it("turns wallet rejection and fee failures into recoverable guidance", () => {
    expect(activationError(new Error("User rejected the request"))).toContain("cancelled");
    expect(activationError(new Error("insufficient funds"))).toContain("Devnet SOL");
  });
});
