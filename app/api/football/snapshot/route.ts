import { NextResponse } from "next/server";
import { normalizePublicFootballSnapshot } from "@/lib/football/public";

const SCOREBOARD_URL = "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard";
export const revalidate = 30;
export const runtime = "nodejs";

export async function GET() {
  try {
    const response = await fetch(SCOREBOARD_URL, { next: { revalidate: 30 }, signal: AbortSignal.timeout(5_000) });
    if (!response.ok) throw new Error(`Scoreboard returned ${response.status}`);
    return NextResponse.json(normalizePublicFootballSnapshot(await response.json()), { headers: { "Cache-Control": "public, max-age=30, s-maxage=30" } });
  } catch { return NextResponse.json({ error: "Public football scoreboard is temporarily unavailable" }, { status: 503 }); }
}
