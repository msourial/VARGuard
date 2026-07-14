import { NextRequest, NextResponse } from "next/server";
import { fetchTxLineSnapshot } from "@/lib/txline/server";
import { sessionTxLineConfig } from "@/lib/txline/session";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) { const fixtureId = request.nextUrl.searchParams.get("fixtureId"); if (!fixtureId) return NextResponse.json({ error: "fixtureId is required" }, { status: 400 }); const config = await sessionTxLineConfig(); if (!config) return NextResponse.json({ error: "Activate TxLINE devnet data or configure server credentials", configured: false }, { status: 503 }); try { return NextResponse.json(await fetchTxLineSnapshot(fixtureId, config)); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "TxLINE request failed" }, { status: 502 }); } }
