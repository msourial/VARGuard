import { NextResponse } from "next/server";
import { DEVNET_TXLINE_ORIGIN } from "@/lib/txline/activation";
import { storeGuestJwt } from "@/lib/txline/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
  try {
    const response = await fetch(`${DEVNET_TXLINE_ORIGIN}/auth/guest/start`, {
      method: "POST",
      cache: "no-store",
    });
    const payload = (await response.json()) as { token?: string };
    if (!response.ok || !payload.token) {
      return NextResponse.json({ error: "TxLINE guest authentication failed" }, { status: 502 });
    }
    await storeGuestJwt(payload.token);
    return NextResponse.json({ jwt: payload.token, network: "devnet" });
  } catch {
    return NextResponse.json({ error: "Unable to reach TxLINE devnet" }, { status: 502 });
  }
}
