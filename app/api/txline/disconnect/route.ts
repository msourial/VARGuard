import { NextResponse } from "next/server";
import { clearTxLineSession } from "@/lib/txline/session";

export async function POST() {
  await clearTxLineSession();
  return NextResponse.json({ disconnected: true });
}
