export const DEVNET_TXLINE_ORIGIN = "https://txline-dev.txodds.com";
export const TXLINE_API_TOKEN_COOKIE = "varguard_txline_api_token";
export const TXLINE_GUEST_JWT_COOKIE = "varguard_txline_guest_jwt";
export const MIN_DEVNET_SOL = 0.002;
export type TxLineActivationState = "disconnected" | "connected" | "insufficient-sol" | "subscribing" | "awaiting-signature" | "activating" | "activated" | "error";
export interface ActivationSession { jwt: string; network: "devnet"; }
export interface ActivationRequest { txSig: string; walletSignature: string; }
export function activationMessage(txSig: string, jwt: string) { return `${txSig}::${jwt}`; }
export function shortenPublicKey(key: string) { return `${key.slice(0, 4)}…${key.slice(-4)}`; }
export function activationError(error: unknown) { const message = error instanceof Error ? error.message : ""; const normalized = message.toLowerCase(); if (normalized.includes("rejected") || normalized.includes("declined") || normalized.includes("cancelled")) return "Wallet approval was cancelled. You can activate the free data feed again."; if (normalized.includes("insufficient")) return "Your wallet needs Devnet SOL for the free-tier transaction fee and account rent."; if (normalized.includes("rpc") || normalized.includes("fetch")) return "Could not reach Solana Devnet. Check the network and try again."; return message || "TxLINE activation could not be completed. Please try again."; }
