"use client";

import { useEffect, useRef, useState } from "react";
import { advanceDemo, createDemoState } from "@/lib/varguard/engine";
import { REPLAY_DURATION_MS } from "@/lib/varguard/replay";
import type { AuditReceipt, DemoState, MarketState } from "@/lib/varguard/types";
import { LiveTxLine } from "./components/LiveTxLine";

function money(value: number) { return `${value.toFixed(2)} test units`; }
function statusLabel(value: string) { return value.replaceAll("_", " "); }

function QuoteBoard({ market }: { market: MarketState }) {
  return <div className="quotes">{market.quotes.map(quote => <div className={`quote ${quote.status.toLowerCase()}`} key={quote.id}><span>{quote.outcome} · {quote.side}</span><strong>{quote.price.toFixed(2)}</strong><span>{quote.size}u</span><em>{quote.status}</em></div>)}</div>;
}

function MarketPanel({ market, protectedMarket }: { market: MarketState; protectedMarket?: boolean }) {
  return <section className={`market-panel ${protectedMarket ? "protected" : "naive"}`}>
    <div className="panel-head"><div><p className="eyebrow">{protectedMarket ? "Protected execution" : "Unprotected baseline"}</p><h2>{protectedMarket ? "VARGuard" : "Naive Market Maker"}</h2></div><span className={`status ${market.status.toLowerCase()}`}>{statusLabel(market.status)}</span></div>
    <div className="stat-grid"><div><small>Fair probability</small><b>{(market.fairProbability * 100).toFixed(0)}%</b></div><div><small>Exposure</small><b>{market.exposure}u</b></div><div><small>{protectedMarket ? "Prevented fills" : "Stale fills"}</small><b>{protectedMarket ? market.preventedFills : market.staleFills}</b></div><div><small>{protectedMarket ? "Protected loss" : "Adverse loss"}</small><b className={protectedMarket ? "success" : "danger"}>{money(market.loss)}</b></div></div>
    <p className="quote-label">Live quote board</p><QuoteBoard market={market} />
    {protectedMarket && <p className="guard-note">Circuit breaker cancels vulnerable quotes before the simulated trader can fill them.</p>}
  </section>;
}

function ReceiptDrawer({ receipt, onClose }: { receipt: AuditReceipt; onClose: () => void }) {
  return <div className="modal-backdrop" role="presentation" onClick={onClose}><aside className="receipt" role="dialog" aria-modal="true" aria-label="Audit receipt" onClick={e => e.stopPropagation()}><button className="close" onClick={onClose}>×</button><p className="eyebrow">DEMO-VERIFIED AUDIT RECEIPT</p><h2>{receipt.id}</h2><dl><div><dt>Match clock</dt><dd>{receipt.matchClock}</dd></div><div><dt>Source event</dt><dd>{receipt.eventId}</dd></div><div><dt>Action</dt><dd>{statusLabel(receipt.action)}</dd></div><div><dt>Verification</dt><dd className="success">{receipt.verification}</dd></div></dl><p>{receipt.reason}</p><footer>TxLINE-compatible replay · no real trading or funds</footer></aside></div>;
}

export default function Home() {
  const [state, setState] = useState<DemoState>(() => createDemoState());
  const [selectedReceipt, setSelectedReceipt] = useState<AuditReceipt | null>(null);
  const startedAt = useRef<number | null>(null); const elapsedBeforePlay = useRef(0);
  useEffect(() => {
    if (!state.running) return;
    let frame = 0;
    const tick = (now: number) => { if (startedAt.current === null) startedAt.current = now; const elapsed = Math.min(REPLAY_DURATION_MS, elapsedBeforePlay.current + (now - startedAt.current) * state.speed); setState(current => ({ ...advanceDemo(current, elapsed), running: elapsed < REPLAY_DURATION_MS, speed: current.speed })); if (elapsed < REPLAY_DURATION_MS) frame = requestAnimationFrame(tick); };
    frame = requestAnimationFrame(tick); return () => cancelAnimationFrame(frame);
  }, [state.running, state.speed]);
  const start = () => { elapsedBeforePlay.current = state.elapsedMs; startedAt.current = null; setState(s => ({ ...s, running: true })); };
  const pause = () => { elapsedBeforePlay.current = state.elapsedMs; setState(s => ({ ...s, running: false })); };
  const reset = () => { startedAt.current = null; elapsedBeforePlay.current = 0; setSelectedReceipt(null); setState(createDemoState()); };
  const setSpeed = (speed: number) => { elapsedBeforePlay.current = state.elapsedMs; startedAt.current = null; setState(s => ({ ...s, speed })); };
  const avoided = Math.max(0, state.naive.loss - state.guard.loss);
  const progress = (state.elapsedMs / REPLAY_DURATION_MS) * 100;
  return <main>
    <nav><div className="brand"><span>V</span><strong>VARGuard</strong></div><p>Autonomous risk protection for live prediction markets</p><span className="demo-pill">SIMULATED · NO REAL MONEY</span></nav>
    <section className="hero"><div><p className="eyebrow">REPLAY DEMO · TXLINE-COMPATIBLE</p><h1>When the match changes, stale quotes become someone else’s profit.</h1><p className="lede">VARGuard detects event risk, suspends the simulated market, cancels quotes, and leaves an auditable decision trail.</p></div><div className="hero-metric"><small>AVOIDED LOSS</small><b>{money(avoided)}</b><span>{state.guard.preventedFills} vulnerable fill{state.guard.preventedFills === 1 ? "" : "s"} prevented</span></div></section>
    <section className="controlbar"><div><span className="feed-dot" /> <strong>{state.feed}</strong><span>TEAM A vs TEAM B</span><span>Clock {state.timeline.at(-1)?.matchClock ?? "12:00"}</span><span>Score {state.score}</span></div><div className="controls"><button onClick={state.running ? pause : start}>{state.running ? "Pause" : state.elapsedMs >= REPLAY_DURATION_MS ? "Replay again" : "Start replay"}</button><button className="secondary" onClick={reset}>Reset</button><select aria-label="Replay speed" value={state.speed} onChange={e => setSpeed(Number(e.target.value))}><option value={1}>1×</option><option value={3}>3×</option><option value={5}>5×</option></select></div></section>
    <div className="progress"><i style={{ width: `${progress}%` }} /></div>
    <LiveTxLine />
    <section className="comparison"><MarketPanel market={state.naive} /><MarketPanel market={state.guard} protectedMarket /></section>
    <section className="bottom-grid"><div className="log-card"><div className="section-title"><div><p className="eyebrow">EVENT STREAM</p><h2>Match timeline</h2></div><span>{state.timeline.length} events</span></div>{state.timeline.length === 0 ? <p className="empty">Start the replay to watch the event stream arrive.</p> : <ol>{state.timeline.map(event => <li key={event.id}><time>{event.matchClock}</time><b>{statusLabel(event.type)}</b><span>{event.type === "GOAL" ? "Probability jumps; stale quote is filled on naive side." : event.type === "VAR_REVIEW_STARTED" ? "Outcome is unresolved; VARGuard remains frozen." : event.type === "ODDS_UPDATE" ? "Fresh reference price received." : "Replay source event received."}</span></li>)}</ol>}</div>
      <div className="log-card"><div className="section-title"><div><p className="eyebrow">DETERMINISTIC POLICY</p><h2>VARGuard decisions</h2></div><span>{state.actions.length} actions</span></div>{state.actions.length === 0 ? <p className="empty">Policy actions will appear here with verifiable receipts.</p> : <ol>{state.actions.map(action => <li key={action.id}><time>{Math.round(action.atMs / 1000)}s</time><b>{statusLabel(action.type)}</b><span>{action.reason}</span></li>)}</ol>}</div></section>
    <section className="receipts"><div className="section-title"><div><p className="eyebrow">AUDIT TRAIL</p><h2>Decision receipts</h2></div><span>{state.receipts.length} verified</span></div><div className="receipt-list">{state.receipts.length === 0 ? <p className="empty">Every major market action will create a receipt here.</p> : state.receipts.map(receipt => <button key={receipt.id} onClick={() => setSelectedReceipt(receipt)}><span className="verified">✓ VERIFIED</span><b>{receipt.id}</b><span>{statusLabel(receipt.action)}</span><span>{receipt.matchClock}</span><i>View →</i></button>)}</div></section>
    <footer className="app-footer">VARGuard uses deterministic policies and simulated test units. It does not execute trades, custody funds, or accept deposits.</footer>
    {selectedReceipt && <ReceiptDrawer receipt={selectedReceipt} onClose={() => setSelectedReceipt(null)} />}
  </main>;
}
