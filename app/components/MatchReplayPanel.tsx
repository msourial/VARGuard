import { projectMatchVisual } from "@/lib/varguard/match-visual";
import type { VisualPlayer } from "@/lib/varguard/match-visual";
import type { DemoState } from "@/lib/varguard/types";

const SCALE_X = 1.6;
const fieldX = (x: number) => x * SCALE_X;
const marker = (player: VisualPlayer, key: string, team: "egypt" | "argentina") => <circle key={key} className={`pitch-player ${team} ${player.role.toLowerCase()}`} cx={fieldX(player.x)} cy={player.y} r={player.role === "GOALKEEPER" ? "4" : "3.2"} />;
const teamCode = (team: string) => team === "Argentina" ? "ARG" : team === "Egypt" ? "EGY" : team.slice(0, 3).toUpperCase();

export function MatchReplayPanel({ state }: { state: DemoState }) {
  const visual = projectMatchVisual(state);
  const provisional = visual.scoreStatus === "PROVISIONAL";
  const homeCode = teamCode(state.fixture.homeTeam);
  const awayCode = teamCode(state.fixture.awayTeam);
  return <section className={`match-replay phase-${visual.phase.toLowerCase()}`} aria-label="Synthetic tactical match replay">
    <div className="match-replay-head"><div><p className="eyebrow">TACTICAL REPLAY · DRIVEN BY VARGUARD STATE</p><h2>{state.fixture.homeTeam} vs {state.fixture.awayTeam} incident replay</h2></div><div className="score-bug"><small>{provisional ? "UNDER REVIEW" : "SCORE"}</small><b>{homeCode} {visual.score} {awayCode}</b></div></div>
    <div className="pitch-wrap tactical-pitch"><svg className="pitch" viewBox="0 0 160 100" role="img" aria-label={`${visual.callout}. ${visual.cue}. ${state.fixture.homeTeam} ${visual.score} ${state.fixture.awayTeam}.`}><defs><marker id="attack-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" className="attack-arrow-head" /></marker></defs><rect className="pitch-grass" x="1" y="1" width="158" height="98" rx="4" /><path className="pitch-lines" d="M80 1V99M1 50H159M1 30H22V70H1M159 30H138V70H159M1 39H11V61H1M159 39H149V61H159" /><circle className="pitch-lines" cx="80" cy="50" r="13" fill="none" />{visual.riskWindow && <circle className="risk-window" cx={fieldX(visual.ball.x)} cy={visual.ball.y} r="12" />}{visual.attackDirection === "LEFT" && <path className="attack-arrow" d="M62.4 50H20.8" markerEnd="url(#attack-arrow)" />}{visual.attackDirection === "RIGHT" && <path className="attack-arrow" d="M97.6 50H139.2" markerEnd="url(#attack-arrow)" />}{visual.egyptPlayers.map((player, index) => marker(player, `egypt-${index}`, "egypt"))}{visual.argentinaPlayers.map((player, index) => marker(player, `argentina-${index}`, "argentina"))}<circle className="pitch-ball" cx={fieldX(visual.ball.x)} cy={visual.ball.y} r="2.1" /></svg><div className="pitch-callout">{visual.callout}</div>{visual.riskWindow && <div className="risk-label">RISK WINDOW</div>}{visual.naiveOverlay !== "NONE" && <div className="pitch-market naive-market">Naive: quotes still open</div>}{visual.guardOverlay !== "NONE" && <div className="pitch-market guard-market">VARGuard: {visual.guardOverlay === "FROZEN" ? "quotes cancelled · frozen" : visual.guardOverlay.toLowerCase()}</div>}</div>
    <p className="tactical-cue">{visual.cue}</p><div className="match-replay-footer"><div className="pitch-progress" aria-label={`Visual progress ${Math.round(visual.progress * 100)} percent`}><i style={{ width: `${visual.progress * 100}%` }} /></div><div className="pitch-legend"><span><i className="legend-red" />old prices still open</span><span><i className="legend-green" />trading safely frozen</span></div></div>
  </section>;
}
