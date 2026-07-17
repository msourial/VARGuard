export type TxLineFeed = "scores" | "odds";
export interface TxLineLiveSnapshot { fixtureId: string; score?: string; gameState?: string; fairProbability?: number; updatedAt: string; source: "TXLINE"; raw: unknown; }
export interface TxLineConfig { origin: string; jwt?: string; apiToken: string; }
export type TxLineLiveStatus = "waiting" | "verifying" | "live" | "unavailable" | "disconnected";
export interface TxLineFeedConnection {
  status: TxLineLiveStatus;
  fixtureId: string;
  snapshot: TxLineLiveSnapshot | null;
  message: string;
  verifiedAt: string | null;
}
