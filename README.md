# VARGuard

VARGuard is a deterministic, simulated risk-control demo for live football prediction markets. It shows a simple premise: when a match event makes old quotes unsafe, a naive market stays open and loses; VARGuard cancels exposed quotes, freezes the market, produces an audit trail, then reprices and reopens safely.

**Simulated · no real money.** VARGuard does not execute trades, custody funds, accept deposits, or submit replay actions to Solana.

## Judge story

Use **Fast judge demo** for the shortest walkthrough:

1. Start the 20-second replay.
2. A comeback-goal event makes stale quotes dangerous.
3. Naive Market accepts 5 bad trades and loses **600.00 test units**.
4. VARGuard cancels quotes, freezes the market, prevents the same 5 trades, and avoids **600.00 test units** of loss.
5. VAR review resolves; the market reprices and reopens with protected limits.

The optional **Full incident replay** is a 130-tick synthetic Argentina–Egypt sequence with a cross, goals, a penalty save, a disallowed goal, and a comeback. It retains **22 prevented fills** and **2,800.00 test units avoided** at completion.

All match incidents, score changes, risk actions, logs, tactical visuals, telemetry receipts, and advisor text derive from the deterministic replay state. The local clip is a visual aid only and never controls product state.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). No wallet, API key, network connection, clip asset, or AI provider is required for either replay.

```bash
npm run test
npm run build
```

## Demo controls and proof

- **Fast judge demo** — 20-tick / 600-unit protection story.
- **Full incident replay** — 130-tick synthetic video-synced incident proof.
- **VARGuard actions** — deterministic terminal-style policy telemetry, keyed to replay ticks.
- **Advanced details** — quotes, policy receipts, and a `Demo telemetry receipt · Solana Devnet-style format` payload. It is display-only and is never submitted on-chain.
- **AI Hedge Advisor** — receipt-backed operator recommendations only. It never executes trades or controls market state.

## Optional TxLINE Devnet data

The top-right **Devnet data · optional** control is a secondary hackathon integration. The replay remains fully functional without it.

1. Open the control and connect Phantom or Solflare on **Solana Devnet**.
2. Keep at least `0.002` Devnet SOL for the free-tier transaction fee and token-account rent.
3. Approve the TxLINE service-level-1 subscription and activation-message signature.
4. Use the optional read-only TxLINE fixture feed.

The activated credential is stored in an HttpOnly browser session cookie and never exposed to client JavaScript. This path supports no payments, trading, custody, transfers, or mainnet usage.

## Recording outline

For a 45–60 second submission video:

1. Start with the Fast judge demo and say: “Naive markets leave stale quotes open.”
2. Start replay; show the goal, circuit-breaker state, and `600.00 test units` avoided.
3. Show the newest VARGuard action and open Advanced details to show the demo telemetry receipt.
4. End on `MARKET REOPENED` and the protected result.

## Architecture

- `lib/varguard/engine.ts` — pure replay reducer and risk policy engine.
- `lib/varguard/fixtures.ts` — Fast and Full synthetic scenario fixtures.
- `lib/varguard/match-visual.ts` — state-driven tactical replay projection.
- `lib/varguard/agent-log.ts` — deterministic terminal decision log.
- `lib/varguard/mock-ledger.ts` — display-only telemetry receipt projection.
- `app/page.tsx` — dashboard, controls, logs, and audit interface.
