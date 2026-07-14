import { NextRequest } from "next/server";
import { streamUrl, txLineHeaders } from "@/lib/txline/server";
import { sessionTxLineConfig } from "@/lib/txline/session";
import type { TxLineFeed } from "@/lib/txline/types";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export async function GET(request: NextRequest) { const feed = request.nextUrl.searchParams.get("feed"); if (feed !== "scores" && feed !== "odds") return new Response("feed must be scores or odds", { status: 400 }); const config = await sessionTxLineConfig(); if (!config) return new Response("Activate TxLINE devnet data or configure server credentials", { status: 503 }); const open = async (renew = false) => fetch(streamUrl(config, feed as TxLineFeed), { headers: { ...(await txLineHeaders(config, renew)), Accept: "text/event-stream", "Cache-Control": "no-cache" }, cache: "no-store" }); let upstream = await open(); if (upstream.status === 401) upstream = await open(true); if (!upstream.ok || !upstream.body) return new Response(`TxLINE stream failed: ${upstream.status}`, { status: upstream.status || 502 }); return new Response(upstream.body, { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache, no-transform", Connection: "keep-alive" } }); }
