import { NextRequest, NextResponse } from "next/server";
import { fetchTxLineSnapshot, getTxLineConfig } from "@/lib/txline/server";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) { const fixtureId = request.nextUrl.searchParams.get("fixtureId"); if (!fixtureId) return NextResponse.json({ error: "fixtureId is required" }, { status: 400 }); if (!getTxLineConfig()) return NextResponse.json({ error: "TxLINE credentials are not configured", configured: false }, { status: 503 }); try { return NextResponse.json(await fetchTxLineSnapshot(fixtureId)); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "TxLINE request failed" }, { status: 502 }); } }
