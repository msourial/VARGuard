import type { TxLineConfig, TxLineFeed, TxLineLiveSnapshot } from "./types";
let guestJwt: string | undefined;
export function getTxLineConfig(): TxLineConfig | null { const apiToken = process.env.TXLINE_API_TOKEN; return apiToken ? { origin: process.env.TXLINE_API_ORIGIN ?? "https://txline.txodds.com", jwt: process.env.TXLINE_JWT, apiToken } : null; }
async function resolveJwt(config: TxLineConfig, renew = false) { if (!renew && (config.jwt ?? guestJwt)) return config.jwt ?? guestJwt!; const response = await fetch(`${config.origin}/auth/guest/start`, { method: "POST", cache: "no-store" }); if (!response.ok) throw new Error(`TxLINE guest authentication failed: ${response.status}`); const data = await response.json() as { token?: string }; if (!data.token) throw new Error("TxLINE guest authentication did not return a token"); guestJwt = data.token; return guestJwt; }
export async function txLineHeaders(config: TxLineConfig, renew = false): Promise<HeadersInit> { return { Authorization: `Bearer ${await resolveJwt(config, renew)}`, "X-Api-Token": config.apiToken, Accept: "application/json" }; }
const rec = (x: unknown): Record<string, unknown> => x && typeof x === "object" ? x as Record<string, unknown> : {};
const last = (x: unknown) => Array.isArray(x) ? rec(x.at(-1)) : rec(x);
const num = (x: unknown) => { const value = typeof x === "number" ? x : Number(x); return Number.isFinite(value) ? value : undefined; };

/**
 * TxLINE score updates can be returned either as JSON or as a completed
 * server-sent-event response. Keep that transport detail on the server so
 * the browser always receives one normalized JSON snapshot.
 */
export async function parseTxLineSnapshotResponse(response: Response, label: "scores" | "odds"): Promise<unknown> {
  const text = await response.text();
  const contentType = response.headers.get("content-type") ?? "";
  const looksLikeSse = contentType.includes("text/event-stream") || /^\s*data:/m.test(text);

  if (!looksLikeSse) {
    try {
      return JSON.parse(text) as unknown;
    } catch {
      throw new Error(`TxLINE returned an invalid ${label} snapshot response`);
    }
  }

  const events = text.split(/\r?\n\r?\n/);
  const payloads: unknown[] = [];
  for (const event of events) {
    const data = event
      .split(/\r?\n/)
      .filter(line => line.startsWith("data:"))
      .map(line => line.slice(5).trimStart())
      .join("\n")
      .trim();
    if (!data || data === "[DONE]") continue;
    try {
      payloads.push(JSON.parse(data) as unknown);
    } catch {
      // A heartbeat or malformed event must not make a later valid event unusable.
    }
  }
  if (!payloads.length) throw new Error(`TxLINE returned an invalid ${label} snapshot response`);
  return payloads.at(-1);
}

export function normalizeTxLineSnapshot(fixtureId: string, scores: unknown, odds: unknown): TxLineLiveSnapshot { const score = last(scores), price = last(odds); const home = num(score.HomeScore ?? score.homeScore ?? score.Participant1Score), away = num(score.AwayScore ?? score.awayScore ?? score.Participant2Score); const direct = num(price.FairProbability ?? price.fairProbability ?? price.Probability), decimal = num(price.DecimalOdds ?? price.decimalOdds ?? price.Odds); const probability = direct === undefined ? (decimal && decimal > 1 ? 1 / decimal : undefined) : direct > 1 ? direct / 100 : direct; return { fixtureId, score: home !== undefined && away !== undefined ? `${home}–${away}` : undefined, gameState: typeof (score.GameState ?? score.gameState) === "string" ? String(score.GameState ?? score.gameState) : undefined, fairProbability: probability, updatedAt: String(score.Ts ?? score.ts ?? price.Ts ?? price.ts ?? new Date().toISOString()), source: "TXLINE", raw: { scores, odds } }; }
export async function fetchTxLineSnapshot(fixtureId: string, configured?: TxLineConfig | null) { const config = configured ?? getTxLineConfig(); if (!config) throw new Error("TxLINE is not configured. Activate devnet data or set TXLINE_API_TOKEN on the server."); const request = async (renew = false) => Promise.all([fetch(`${config.origin}/api/scores/updates/${encodeURIComponent(fixtureId)}`, { headers: await txLineHeaders(config, renew), cache: "no-store" }), fetch(`${config.origin}/api/odds/snapshot/${encodeURIComponent(fixtureId)}`, { headers: await txLineHeaders(config, renew), cache: "no-store" })]); let [scores, odds] = await request(); if (scores.status === 401 || odds.status === 401) [scores, odds] = await request(true); if (!scores.ok || !odds.ok) throw new Error(`TxLINE snapshot failed: scores ${scores.status}, odds ${odds.status}`); return normalizeTxLineSnapshot(fixtureId, await parseTxLineSnapshotResponse(scores, "scores"), await parseTxLineSnapshotResponse(odds, "odds")); }
export function streamUrl(config: TxLineConfig, feed: TxLineFeed) { return `${config.origin}/api/${feed}/stream`; }
