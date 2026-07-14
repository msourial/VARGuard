# VARGuard

## Optional TxLINE Devnet data activation

The replay is fully deterministic and does not require a wallet, API key, or network connection. For an optional read-only live fixture feed, use **Activate TxLINE Free Data** beneath the TxLINE panel:

1. Connect Phantom or Solflare on **Solana Devnet**.
2. Keep at least `0.002` Devnet SOL for the free-tier transaction fee and token-account rent.
3. Approve the free TxLINE service-level-1 subscription and its activation-message signature.
4. Select **Connect TxLINE** in the fixture panel.

The resulting TxLINE API credential is stored in an HttpOnly browser session cookie and is never returned to client JavaScript. This feature supports no payments, trading, custody, transfers, or mainnet usage.

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

## TxLINE live data

The dashboard now proxies real authenticated TxLINE score and StablePrice odds data through server-side routes, keeping credentials out of the browser. Activate the TxLINE World Cup free tier, then set `TXLINE_API_TOKEN` in `.env.local` with its matching `TXLINE_API_ORIGIN`. VARGuard requests and renews the short-lived guest JWT automatically; `TXLINE_JWT` is optional. Select **Connect TxLINE** and enter a covered fixture ID from the TxLINE schedule.

When credentials are missing, expired, or the data stream is unavailable, the app makes the fallback explicit and keeps the deterministic replay fully available. AI explanations and database persistence remain deferred.
