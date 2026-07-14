import { NextRequest } from "next/server";
import { getTxLineConfig, streamUrl, txLineHeaders } from "@/lib/txline/server";
import type { TxLineFeed } from "@/lib/txline/types";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export async function GET(request: NextRequest) { const feed = request.nextUrl.searchParams.get("feed"); if (feed !== "scores" && feed !== "odds") return new Response("feed must be scores or odds", { status: 400 }); const config = getTxLineConfig(); if (!config) return new Response("TxLINE credentials are not configured", { status: 503 }); const upstream = await fetch(streamUrl(config, feed as TxLineFeed), { headers: { ...txLineHeaders(config), Accept: "text/event-stream", "Cache-Control": "no-cache" }, cache: "no-store" }); if (!upstream.ok || !upstream.body) return new Response(`TxLINE stream failed: ${upstream.status}`, { status: upstream.status || 502 }); return new Response(upstream.body, { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache, no-transform", Connection: "keep-alive" } }); }
