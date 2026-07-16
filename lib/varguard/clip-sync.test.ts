import { describe, expect, it } from "vitest";
import { CLIP_DRIFT_THRESHOLD_SECONDS, clipPlaybackRate, clipTargetTime, shouldCorrectClipDrift, shouldSeekClip } from "./clip-sync";

describe("local clip synchronization", () => {
  it("keeps the fast demo on a smooth 1.5x visual-aid timeline and full mode exact", () => {
    expect(clipTargetTime(0)).toBe(0);
    expect(clipTargetTime(6)).toBe(9);
    expect(clipTargetTime(7)).toBe(10.5);
    expect(clipTargetTime(12)).toBe(18);
    expect(clipTargetTime(18)).toBe(27);
    expect(clipTargetTime(20)).toBe(30);
    expect(clipTargetTime(0, 130, 130)).toBe(0);
    expect(clipTargetTime(64, 130, 130)).toBe(64);
    expect(clipTargetTime(96, 130, 130)).toBe(96);
    expect(clipTargetTime(130, 130, 130)).toBe(130);
  });

  it("uses tick time as the authority and only corrects meaningful drift", () => {
    expect(shouldCorrectClipDrift(8.5, 6)).toBe(false);
    expect(shouldCorrectClipDrift(8.49, 6)).toBe(true);
    expect(CLIP_DRIFT_THRESHOLD_SECONDS).toBe(0.5);
  });

  it("always seeks to zero on reset", () => {
    expect(shouldSeekClip(0.1, 0, false)).toBe(true);
    expect(shouldSeekClip(0.1, 0, true)).toBe(false);
  });

  it("adjusts playback as a convenience for replay speed", () => {
    expect(clipPlaybackRate(1)).toBe(1.5);
    expect(clipPlaybackRate(3)).toBe(4.5);
    expect(clipPlaybackRate(5)).toBe(7.5);
    expect(clipPlaybackRate(1, 130)).toBe(1);
    expect(clipPlaybackRate(3, 130)).toBe(3);
    expect(clipPlaybackRate(5, 130)).toBe(5);
  });
});
