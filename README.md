# VARGuard

VARGuard is an autonomous risk-control demo for live football prediction markets. It shows a simple, high-stakes failure mode: a match shock hits, old prices stay open, and a naive market gets picked off. VARGuard detects the event, cancels exposed quotes, freezes the market, validates the match state, reprices, and safely reopens with an audit trail.

**Live MVP:** https://varguard-demo.vercel.app/

**Repository:** https://github.com/msourial/VARGuard

**Status:** Simulated, test-unit only, no real money.

VARGuard does not execute trades, custody funds, accept deposits, process withdrawals, or submit replay actions to mainnet.

## Project pitch

Live sports markets can change faster than normal market-making systems can safely react. A goal, penalty, VAR review, red card, stale feed, or odds shock can leave quotes open for a few seconds after the true match state has changed. Those few seconds are enough for informed traders or bots to fill stale prices and transfer loss to market makers and liquidity providers.

VARGuard is a circuit-breaker and audit layer for that moment. It watches match telemetry and odds state, detects dangerous event risk, removes exposed quotes, pauses settlement/reopening, and records why the decision happened. The MVP uses deterministic replay scenarios so judges can see the exact difference between an unprotected market and a protected one.

## Problem we are solving

Prediction markets and sports trading products need trust at the exact moment when data is most uncertain. During live incidents, three things can go wrong at once:

- prices become stale before the UI or matching engine updates;
- operators need to know whether to suspend, settle, or wait for review;
- users and liquidity providers need an audit trail explaining why the market moved.

In the VARGuard demo, the naive market keeps quoting through match shocks and accumulates loss. VARGuard cancels quotes, freezes the market, validates the incident, reprices, and reopens. The point is not to predict the match winner; the point is to prevent stale-price loss while the match state is uncertain.

## Addressable market

VARGuard targets infrastructure teams building or operating:

- sports prediction markets;
- market-making and risk systems;
- live odds and trading dashboards;
- exchange/liquidity-provider tooling;
- event-driven settlement and audit systems.

The broader opportunity is live-event financial infrastructure: any market where a real-world event can invalidate prices before the matching layer catches up. Sports is the clearest wedge because goals, VAR reviews, penalties, red cards, and feed delays are visible and easy to explain.

## Demo experience

The default dashboard is the **Full incident replay**, a 130-tick synthetic Argentina vs Egypt sequence aligned to a local visual clip. It demonstrates multiple protection moments: cross, Egypt goal, penalty save, disallowed goal review, confirmed goal, Argentina comeback, final winner, and safe reopen.

Final full-replay outcome:

- Naive Market: **22 stale fills** and **2,800.00 test units** lost.
- VARGuard: **22 bad trades stopped** and **2,800.00 test units** protected.
- Policy sequence: **Detect -> Cancel -> Validate -> Reprice -> Reopen**.

The **Fast judge demo** is a one-click 20-second summary:

1. A comeback-goal event makes old quotes dangerous.
2. Naive Market accepts 5 bad trades and loses **600.00 test units**.
3. VARGuard blocks the same 5 trades and avoids **600.00 test units** of loss.
4. VAR review resolves; the market reprices and reopens with protected limits.

All match incidents, score changes, market actions, logs, tactical visuals, receipts, and advisor text derive from deterministic replay state. The local clip is a visual aid only and never controls product logic.

## Key features

- **Outcome-first dashboard** showing the loss avoided before users scroll.
- **Deterministic risk engine** with Fast and Full replay fixtures.
- **Side-by-side market comparison** between Naive Market and VARGuard.
- **State-driven tactical replay** with no video analysis, OCR, frame extraction, or media-derived logic.
- **Autonomous policy log** projected from replay ticks.
- **Demo telemetry receipt drawer** using a Solana Devnet-style format, clearly marked display-only.
- **AI Hedge Advisor** that explains recommended protective actions after the deterministic engine acts. It never controls market state.
- **Optional TxLINE Devnet access** for authenticated score-and-odds verification.
- **Wallet-free core demo**: replay works without wallet, TxLINE, network data, API key, model provider, or video asset.

## TxLINE and Solana Devnet

The top-right **Devnet data · optional** control is a secondary hackathon integration. It proves authenticated data access without making wallet connection part of the core judge path.

Flow:

1. Connect Phantom or Solflare on **Solana Devnet**.
2. Keep at least `0.002` Devnet SOL for the optional free-tier transaction fee and token-account rent.
3. Approve the TxLINE service-level-1 subscription and activation-message signature.
4. Click **Verify live TxLINE feed** to request an authenticated score-and-odds snapshot.
5. The UI shows **LIVE** only after a normalized authenticated snapshot is received.

The activated credential is stored in an HttpOnly browser session cookie and is never exposed to client JavaScript. TxLINE feed status never changes replay state; the deterministic engine remains the source of truth for the demo.

## Technical architecture

- `app/page.tsx` - main dashboard, replay controls, proof cards, logs, telemetry drawer, and TxLINE live-feed state.
- `app/components/DevnetDataControl.tsx` - optional Devnet access drawer.
- `app/components/TxLineActivation.tsx` - Phantom/Solflare activation and live-feed verification UI.
- `app/components/MatchClipPanel.tsx` - local clip playback synced from replay tick only.
- `app/components/MatchReplayPanel.tsx` - tactical SVG replay.
- `app/api/txline/*` - server routes for activation, authenticated snapshot, stream proxy, and disconnect.
- `lib/varguard/engine.ts` - pure deterministic replay reducer and risk policy state.
- `lib/varguard/fixtures.ts` - Fast and Full synthetic scenario fixtures.
- `lib/varguard/match-visual.ts` - state-driven tactical projection.
- `lib/varguard/agent-log.ts` - deterministic terminal-style decision log.
- `lib/varguard/mock-ledger.ts` - display-only telemetry receipt projection.
- `lib/txline/server.ts` - TxLINE server integration, including JSON/SSE snapshot compatibility.

## Stack

- Next.js 16
- React 19
- TypeScript
- Vitest
- Solana wallet adapter
- Solana Web3.js / SPL Token
- TxLINE-style authenticated data access
- Vercel deployment

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

For the port used during development:

```bash
npm run dev -- --port 3002
```

Verify:

```bash
npm run test
npm run build
```

## Environment variables

The deterministic replay needs no environment variables.

Optional TxLINE/server configuration may use:

```bash
TXLINE_API_ORIGIN=
TXLINE_API_TOKEN=
```

The Devnet activation flow can also create a browser-scoped HttpOnly credential session after the user approves the optional wallet flow.

## Safety boundaries

VARGuard is a simulated hackathon MVP:

- no real-money trading;
- no custody;
- no deposits or withdrawals;
- no mainnet support;
- no automatic execution of hedge recommendations;
- no video-to-state logic;
- no claim that demo telemetry receipts are real submitted transactions.

The receipt drawer uses the label **Demo telemetry receipt · Solana Devnet-style format** and includes a display-only disclaimer.

## TxLINE API experience

TxLINE gave the project a credible authenticated sports-data layer. The best part was being able to show a Devnet-gated data path beside a wallet-free deterministic replay, which helped separate “working demo” from “optional integration proof.”

The main friction was response-shape clarity. Some score responses arrived as ordinary JSON while others used SSE-style `data: {...}` payloads. VARGuard now normalizes both formats server-side before returning browser-safe JSON. Clearer docs for snapshot vs stream endpoints, expected response formats, and recommended Devnet verification flows would make the developer experience smoother.

## Recording outline

For a short submission video:

1. Open the live MVP and show the outcome card: Naive loses 2,800; VARGuard protects 2,800.
2. Start the Full incident replay or click **Watch 20-sec judge demo** for the quick version.
3. Show the comparison cards as stale fills accumulate.
4. Open the policy log and Advanced details drawer to show deterministic receipts.
5. Optionally open Devnet data and verify the TxLINE feed.

## License and disclaimer

This repository is a hackathon MVP. Match scenarios are synthetic and descriptive. The app uses simulated test units and does not provide financial advice, execute trades, custody assets, or submit real replay actions on-chain.
