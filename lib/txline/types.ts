export type TxLineFeed = "scores" | "odds";
export interface TxLineLiveSnapshot { fixtureId: string; score?: string; gameState?: string; fairProbability?: number; updatedAt: string; source: "TXLINE"; raw: unknown; }
export interface TxLineConfig { origin: string; jwt: string; apiToken: string; }
