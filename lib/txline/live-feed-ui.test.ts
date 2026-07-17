import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

describe("TxLINE live-feed confirmation UI", () => {
  it("only labels the feed live after a successful snapshot state", () => {
    const source = read("../../app/components/LiveTxLine.tsx");
    expect(source).toContain('feed.status === "live" ? "● LIVE · AUTHENTICATED FEED CONNECTED"');
    expect(source).toContain("● WAITING FOR VERIFICATION");
    expect(source).toContain("● FEED UNAVAILABLE");
  });

  it("shares verification controls between the drawer and advanced details", () => {
    const drawer = read("../../app/components/TxLineActivation.tsx");
    const page = read("../../app/page.tsx");
    expect(drawer).toContain("Verify live TxLINE feed");
    expect(page).toContain("verifyTxLineFeed");
    expect(page).toContain("Authenticated TxLINE score and odds connected.");
    expect(page).toContain("/api/txline/snapshot");
  });

  it("does not tie the deterministic replay to the live feed", () => {
    const page = read("../../app/page.tsx");
    expect(page).not.toContain("advanceReplayTick(txLine");
    expect(page).toContain("advanceReplayTick(stateRef.current)");
  });
});
