import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Devnet header control contract", () => {
  const source = () => readFileSync(new URL("../../app/components/DevnetDataControl.tsx", import.meta.url), "utf8");

  it("keeps Devnet access optional and inside a drawer", () => {
    expect(source()).toContain("Devnet data · optional");
    expect(source()).toContain("Solana Devnet · test SOL only");
    expect(source()).toContain("<TxLineActivation initialActivated={activated} onActivationChange={handleActivation} />");
  });

  it("does not connect a wallet on page load", () => {
    expect(source()).not.toContain("wallet.connect(");
    expect(source()).not.toContain("autoConnect");
  });
});
