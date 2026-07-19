import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const componentSource = () => readFileSync(new URL("../../app/components/MatchClipPanel.tsx", import.meta.url), "utf8");

describe("MatchClipPanel UI contract", () => {
  it("uses local demo assets only", () => {
    const source = componentSource();
    expect(source).toContain('"/demo/egypt-argentina-synthetic.webm"');
    expect(source).toContain('"/demo/egypt-argentina-synthetic.mp4"');
    expect(source).not.toContain("http://");
    expect(source).not.toContain("https://");
  });

  it("declares accessibility, fallback, and no independent clock", () => {
    const source = componentSource();
    expect(source).toContain("muted playsInline preload=\"metadata\"");
    expect(source).not.toContain("autoPlay");
    expect(source).toContain("Synthetic clip unavailable — using tactical replay only.");
    expect(source).not.toContain("requestAnimationFrame");
    expect(source).not.toContain("setInterval");
  });

  it("places the incident replay before the market comparison", () => {
    const page = readFileSync(new URL("../../app/page.tsx", import.meta.url), "utf8");
    expect(page.indexOf("first-proof comparison")).toBeLessThan(page.indexOf("incident-replay"));
  });
});
