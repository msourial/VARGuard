# VARGuard

Autonomous risk protection for simulated live football prediction markets.

## Demo

VARGuard replays a match-changing football sequence. A naive market maker leaves stale quotes open and suffers an adverse-selection fill; VARGuard deterministically suspends the market, cancels quotes, reprices on fresh odds, and records an audit receipt.

The app runs entirely with replay data: no wallet, API key, real money, deposits, or trading are involved.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000 and select **Start replay**. Use the speed control to compress the demo.

## Architecture

- `lib/varguard/replay.ts`: deterministic match-event fixture
- `lib/varguard/engine.ts`: pure simulation and VARGuard policy engine
- `lib/varguard/types.ts`: market, quote, action, receipt, and metric types
- `app/page.tsx`: replay dashboard and audit-receipt interface

TxLINE live data, AI explanations, and database persistence are intentionally deferred until the deterministic demo loop is complete.
