import { cookies } from "next/headers";
import {
  DEVNET_TXLINE_ORIGIN,
  TXLINE_API_TOKEN_COOKIE,
  TXLINE_GUEST_JWT_COOKIE,
} from "./activation";
import { getTxLineConfig } from "./server";
import type { TxLineConfig } from "./types";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export async function sessionTxLineConfig(): Promise<TxLineConfig | null> {
  const store = await cookies();
  const apiToken = store.get(TXLINE_API_TOKEN_COOKIE)?.value;
  if (apiToken) {
    return {
      origin: DEVNET_TXLINE_ORIGIN,
      apiToken,
      jwt: store.get(TXLINE_GUEST_JWT_COOKIE)?.value,
    };
  }
  return getTxLineConfig();
}

export async function activationSessionJwt() {
  return (await cookies()).get(TXLINE_GUEST_JWT_COOKIE)?.value;
}

export async function storeGuestJwt(jwt: string) {
  (await cookies()).set(TXLINE_GUEST_JWT_COOKIE, jwt, {
    ...cookieOptions,
    maxAge: 30 * 60,
  });
}

export async function storeApiToken(token: string) {
  (await cookies()).set(TXLINE_API_TOKEN_COOKIE, token, {
    ...cookieOptions,
    maxAge: 12 * 60 * 60,
  });
}

export async function clearTxLineSession() {
  const store = await cookies();
  store.delete(TXLINE_GUEST_JWT_COOKIE);
  store.delete(TXLINE_API_TOKEN_COOKIE);
}
