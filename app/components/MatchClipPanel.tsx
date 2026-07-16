"use client";

import { useEffect, useRef, useState } from "react";
import { clipPlaybackRate, clipTargetTime, shouldSeekClip } from "@/lib/varguard/clip-sync";

// The uploaded MP4 is the reliable local demo asset. Keep WebM as an optional
// secondary source for future exports, but never let a missing WebM hide the
// working MP4 clip.
export const localClipSources = ["/demo/egypt-argentina-synthetic.mp4", "/demo/egypt-argentina-synthetic.webm"] as const;

export function MatchClipPanel({ tick, isRunning, speed, finalTick, videoDurationSeconds, accelerated, onVideoUnavailable }: { tick: number; isRunning: boolean; speed: number; finalTick: number; videoDurationSeconds: number; accelerated: boolean; onVideoUnavailable?: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [unavailable, setUnavailable] = useState(false);
  const markUnavailable = () => { if (!unavailable) { setUnavailable(true); onVideoUnavailable?.(); } };

  useEffect(() => {
    const video = videoRef.current;
    if (!video || unavailable) return;
    const targetTime = clipTargetTime(tick, finalTick, videoDurationSeconds);
    video.playbackRate = clipPlaybackRate(speed, finalTick);
    if (shouldSeekClip(video.currentTime, tick, isRunning, finalTick, videoDurationSeconds)) video.currentTime = targetTime;
    if (isRunning) void video.play().catch(() => undefined);
    else video.pause();
  }, [tick, isRunning, speed, finalTick, videoDurationSeconds, unavailable]);

  return <section className="match-clip-panel" aria-label="Synthetic match clip"><p className="eyebrow">SYNTHETIC MATCH CLIP · NO BROADCAST FOOTAGE</p><p className="clip-mode">{accelerated ? "Smooth 1.5× visual aid · replay state remains authoritative" : "Video and state synchronized · simulated test-unit risk controls"}</p>{unavailable ? <div className="clip-fallback" role="status">Synthetic clip unavailable — using tactical replay only.</div> : <video ref={videoRef} muted playsInline preload="metadata" aria-label="Synthetic Egypt versus Argentina match clip" onError={markUnavailable}><source src={localClipSources[0]} type="video/mp4" /><source src={localClipSources[1]} type="video/webm" />Your browser cannot play this local synthetic clip.</video>}</section>;
}
