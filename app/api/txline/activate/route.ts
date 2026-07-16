import { NextRequest, NextResponse } from "next/server";
import { activationTokenFromResponse, DEVNET_TXLINE_ORIGIN } from "@/lib/txline/activation";
import { activationSessionJwt, clearTxLineSession, storeApiToken } from "@/lib/txline/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { txSig?: unknown; walletSignature?: unknown } | null;
  if (!body || typeof body.txSig !== "string" || typeof body.walletSignature !== "string" || !body.txSig || !body.walletSignature) {
    return NextResponse.json({ error: "A transaction signature and wallet signature are required" }, { status: 400 });
  }
  const jwt = await activationSessionJwt();
  if (!jwt) return NextResponse.json({ error: "Activation session expired. Start activation again." }, { status: 401 });
  try {
    const response = await fetch(`${DEVNET_TXLINE_ORIGIN}/api/token/activate`, {
      method: "POST",
      headers: { Authorization: `Bearer ${jwt}`, "Content-Type": "application/json" },
      body: JSON.stringify({ txSig: body.txSig, walletSignature: body.walletSignature, leagues: [] }),
      cache: "no-store",
    });
    const payloadText = await response.text();
    const token = activationTokenFromResponse(payloadText);
    if (!response.ok || !token) {
      await clearTxLineSession();
      let detail = "";
      try {
        const payload = JSON.parse(payloadText) as { error?: unknown; message?: unknown };
        detail = typeof payload.error === "string" ? payload.error : typeof payload.message === "string" ? payload.message : "";
      } catch {
        detail = payloadText.trim();
      }
      return NextResponse.json({ error: detail || `TxLINE activation was rejected (${response.status})` }, { status: 502 });
    }
    await storeApiToken(token);
    return NextResponse.json({ activated: true });
  } catch {
    await clearTxLineSession();
    return NextResponse.json({ error: "Unable to complete TxLINE activation" }, { status: 502 });
  }
}
