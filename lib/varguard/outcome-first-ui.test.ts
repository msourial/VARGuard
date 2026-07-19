import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const page = () => readFileSync(new URL("../../app/page.tsx", import.meta.url), "utf8");

describe("outcome-first landing page", () => {
  it("leads with the outcome proof and keeps the incident replay below it", () => {
    const source = page();
    expect(source).toContain("A match shock hits. VARGuard stops the stale-price loss.");
    expect(source).toContain("PROJECTED REPLAY OUTCOME");
    expect(source.indexOf("first-proof comparison")).toBeLessThan(source.indexOf("incident-replay"));
  });

  it("keeps the full replay CTA primary and starts the fast judge path in one click", () => {
    const source = page();
    expect(source).toContain("Start full replay");
    expect(source).toContain("Watch 20-sec judge demo");
    expect(source).toContain('startScenario("fast-judge")');
  });

  it("keeps the policy sequence explicit and accessible", () => {
    const source = page();
    expect(source).toContain('aria-label="VARGuard policy sequence"');
    for (const step of ["Detect", "Cancel", "Validate", "Reprice", "Reopen"]) {
      expect(source).toContain(`<li>${step}</li>`);
    }
  });
});
