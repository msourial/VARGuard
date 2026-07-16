export const CLIP_DURATION_SECONDS = 140;
export const CLIP_DRIFT_THRESHOLD_SECONDS = 0.5;

/** Deterministic replay state, never media events, determines the target clip time. */
/** Fast mode follows the first incident smoothly; full mode maps each tick to its matching second. */
export const clipTargetTime = (tick: number, finalTick = 20, videoDurationSeconds = CLIP_DURATION_SECONDS) => finalTick === 20 ? tick * 1.5 : tick / finalTick * videoDurationSeconds;
export const clipPlaybackRate = (replaySpeed: number, finalTick = 20) => (finalTick === 20 ? 1.5 : 1) * replaySpeed;
export const shouldCorrectClipDrift = (currentTime: number, tick: number, finalTick = 20, videoDurationSeconds = CLIP_DURATION_SECONDS) => Math.abs(currentTime - clipTargetTime(tick, finalTick, videoDurationSeconds)) > CLIP_DRIFT_THRESHOLD_SECONDS;
export const shouldSeekClip = (currentTime: number, tick: number, isRunning: boolean, finalTick = 20, videoDurationSeconds = CLIP_DURATION_SECONDS) => tick === 0 && !isRunning || shouldCorrectClipDrift(currentTime, tick, finalTick, videoDurationSeconds);
