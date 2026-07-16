export const PUBLIC_FOOTBALL_SOURCE = "Public international tournament scoreboard";

export interface PublicFootballSnapshot {
  available: boolean;
  match?: string;
  homeTeam?: string;
  awayTeam?: string;
  score?: string;
  state?: string;
  round?: string;
  venue?: string;
  startTime?: string;
  updatedAt: string;
  source: typeof PUBLIC_FOOTBALL_SOURCE;
}

type Value = Record<string, unknown>;
const record = (value: unknown): Value => value && typeof value === "object" ? value as Value : {};
const text = (value: unknown) => typeof value === "string" && value.trim() ? value : undefined;
const records = (value: unknown): Value[] => Array.isArray(value) ? value.map(record) : [];
const competitor = (competition: Value, side: "home" | "away") => records(competition.competitors).find(item => item.homeAway === side) ?? {};
const label = (item: Value) => { const team = record(item.team); return text(team.displayName) ?? text(team.shortDisplayName) ?? text(team.name) ?? "TBD"; };
const rank = (event: Value) => { const state = record(record(event.status).type).state; return state === "in" ? 0 : state === "pre" ? 1 : state === "post" ? 2 : 3; };
const neutralRound = (value: unknown) => {
  const label = text(value)?.toLowerCase() ?? "";
  if (label.includes("semi")) return "Semifinal";
  if (label.includes("quarter")) return "Quarterfinal";
  if (label.includes("round of 16") || label.includes("rd of 16")) return "Round of 16";
  if (label.includes("round of 32")) return "Round of 32";
  if (label.includes("group")) return "Group stage";
  if (label.includes("final")) return "Final";
  return "International tournament match";
};

export function normalizePublicFootballSnapshot(payload: unknown, now = new Date().toISOString()): PublicFootballSnapshot {
  const events = records(record(payload).events);
  const event = [...events].sort((a, b) => rank(a) - rank(b))[0];
  if (!event) return { available: false, updatedAt: now, source: PUBLIC_FOOTBALL_SOURCE };
  const competition = records(event.competitions)[0] ?? {};
  const home = competitor(competition, "home"), away = competitor(competition, "away");
  const homeName = label(home), awayName = label(away), status = record(record(event.status).type);
  const venue = record(competition.venue);
  return { available: true, match: text(event.name) ?? `${homeName} vs ${awayName}`, homeTeam: homeName, awayTeam: awayName, score: `${text(home.score) ?? "–"}–${text(away.score) ?? "–"}`, state: text(status.shortDetail) ?? text(status.description) ?? text(status.state) ?? "Scheduled", round: neutralRound(text(competition.altGameNote) ?? text(record(event.season).slug)), venue: text(venue.fullName), startTime: text(event.date), updatedAt: now, source: PUBLIC_FOOTBALL_SOURCE };
}
