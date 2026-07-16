"use client";

import { useEffect, useState } from "react";
import type { PublicFootballSnapshot as Snapshot } from "@/lib/football/public";

const time = (value?: string) => value ? new Date(value).toLocaleString([], { weekday: "short", hour: "numeric", minute: "2-digit" }) : "—";

export function PublicFootballSnapshot() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  useEffect(() => {
    let active = true;
    const refresh = async () => { try { const response = await fetch("/api/football/snapshot", { cache: "no-store" }); if (!response.ok) throw new Error("unavailable"); const next = await response.json() as Snapshot; if (active) { setSnapshot(next); setUnavailable(false); } } catch { if (active && !snapshot) setUnavailable(true); } };
    void refresh(); const timer = window.setInterval(() => void refresh(), 30_000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);
  const content = unavailable ? <><strong>Tournament scoreboard temporarily unavailable</strong><span>Replay remains fully available.</span></> : !snapshot ? <><strong>Loading tournament snapshot…</strong><span>Public scoreboard · no wallet required</span></> : !snapshot.available ? <><strong>No live tournament fixture right now</strong><span>Replay remains fully available.</span></> : <><p className="match-state">{snapshot.state}</p><h2>{snapshot.homeTeam} <b>{snapshot.score}</b> {snapshot.awayTeam}</h2><span>{snapshot.round ?? "International tournament match"} · {snapshot.venue ?? time(snapshot.startTime)}</span><span>{time(snapshot.startTime)}</span></>;
  return <section className="live-snapshot"><div className="stage-label"><span className="feed-dot" /> INTERNATIONAL TOURNAMENT SNAPSHOT</div>{content}<small>PUBLIC TOURNAMENT SCOREBOARD · INFORMATIONAL ONLY</small></section>;
}
