"use client";

import { useEffect, useState } from "react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import type { WalletName } from "@solana/wallet-adapter-base";
import { activationError, activationMessage, MIN_DEVNET_SOL, shortenPublicKey, type ActivationSession, type TxLineActivationState } from "@/lib/txline/activation";
import { subscribeToTxLineDevnet } from "@/lib/txline/subscribe";
import type { TxLineFeedConnection } from "@/lib/txline/types";

const copy: Record<TxLineActivationState, string> = {
  disconnected: "Optional only: connect Phantom or Solflare to activate read-only TxLINE Devnet data.",
  connected: "Wallet connected. Devnet SOL is used only for the optional free-data transaction fee and account rent.",
  "insufficient-sol": "Switch to Solana Devnet and add at least 0.002 test SOL before optional activation.",
  subscribing: "Preparing the optional TxLINE Devnet subscription…",
  "awaiting-signature": "Subscription confirmed. Approve the TxLINE activation message in your wallet.",
  activating: "Securing this browser’s TxLINE data session…",
  activated: "TxLINE Devnet data is active in this browser.",
  error: "Optional activation did not complete. The replay demo is unaffected.",
};
const base64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));

export function TxLineActivation({ onActivationChange, initialActivated = false, feed, onVerifyFeed, onDisconnectFeed }: { onActivationChange?: (active: boolean) => void; initialActivated?: boolean; feed: TxLineFeedConnection; onVerifyFeed: () => void; onDisconnectFeed: () => void }) {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [pickerOpen, setPickerOpen] = useState(false), [pendingWallet, setPendingWallet] = useState<WalletName | null>(null);
  const [state, setState] = useState<TxLineActivationState>(initialActivated ? "activated" : "disconnected"), [message, setMessage] = useState(initialActivated ? copy.activated : copy.disconnected), [balance, setBalance] = useState<number | null>(null);
  useEffect(() => {
    let active = true;
    if (!wallet.publicKey) { setState("disconnected"); setMessage(copy.disconnected); setBalance(null); onActivationChange?.(false); return; }
    void connection.getBalance(wallet.publicKey, "confirmed").then(lamports => {
      if (!active) return;
      const sol = lamports / LAMPORTS_PER_SOL, next = sol < MIN_DEVNET_SOL ? "insufficient-sol" : "connected";
      setBalance(sol); setState(current => current === "activated" ? current : next); setMessage(current => current === copy.activated ? current : copy[next]);
    }).catch(() => { if (active) { setState("error"); setMessage("Could not check the Devnet balance. The replay demo is unaffected."); } });
    return () => { active = false; };
  }, [connection, wallet.publicKey?.toBase58()]);
  useEffect(() => {
    if (!pendingWallet || wallet.connected || wallet.connecting || wallet.wallet?.adapter.name !== pendingWallet) return;
    void wallet.connect().catch(error => { setState("error"); setMessage(activationError(error)); }).finally(() => setPendingWallet(null));
  }, [pendingWallet, wallet, wallet.connected, wallet.connecting, wallet.wallet?.adapter.name]);
  const supportedWallets = wallet.wallets.filter(item => item.adapter.name === "Phantom" || item.adapter.name === "Solflare");
  const chooseWallet = (name: WalletName) => { setPickerOpen(false); setPendingWallet(name); wallet.select(name); };
  const activate = async () => {
    if (!wallet.publicKey || !wallet.signMessage) { setPickerOpen(true); return; }
    if (balance === null || balance < MIN_DEVNET_SOL) { setState("insufficient-sol"); setMessage(copy["insufficient-sol"]); return; }
    try {
      const sessionResponse = await fetch("/api/txline/activation-session", { method: "POST" }), session = await sessionResponse.json() as ActivationSession & { error?: string };
      if (!sessionResponse.ok || !session.jwt) throw new Error(session.error ?? "Could not start the TxLINE activation session.");
      setState("subscribing"); setMessage(copy.subscribing);
      const txSig = await subscribeToTxLineDevnet(wallet, connection);
      setState("awaiting-signature"); setMessage(copy["awaiting-signature"]);
      const walletSignature = await wallet.signMessage(new TextEncoder().encode(activationMessage(txSig, session.jwt)));
      setState("activating"); setMessage(copy.activating);
      const response = await fetch("/api/txline/activate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ txSig, walletSignature: base64(walletSignature) }) }), result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "TxLINE activation was rejected.");
      setState("activated"); setMessage(copy.activated); onActivationChange?.(true);
    } catch (error) { setState("error"); setMessage(activationError(error)); onActivationChange?.(false); }
  };
  const disconnect = async () => { onDisconnectFeed(); await fetch("/api/txline/disconnect", { method: "POST" }).catch(() => undefined); await wallet.disconnect().catch(() => undefined); setState("disconnected"); setMessage(copy.disconnected); onActivationChange?.(false); };
  const key = wallet.publicKey?.toBase58(), busy = ["subscribing", "awaiting-signature", "activating"].includes(state);
  const activated = state === "activated";
  const feedLabel = feed.status === "live" ? "● LIVE · authenticated feed connected" : feed.status === "verifying" ? "● Verifying authenticated score and odds…" : feed.status === "unavailable" ? "● Feed unavailable · replay remains active" : "● Waiting for live-feed verification";
  return <section className="activation-panel"><p className="eyebrow">OPTIONAL DEVNET ACCESS</p><h2>Activate TxLINE data</h2><p>{message}</p><div className="access-details"><span>Network <b>Solana Devnet</b></span>{key && <span>Wallet <b>{shortenPublicKey(key)}</b></span>}{balance !== null && <span>Test SOL <b>{balance.toFixed(4)}</b></span>}</div>{activated && <div className={`feed-confirmation ${feed.status}`}><b>{feedLabel}</b>{feed.status === "live" ? <span>Fixture {feed.fixtureId} · {feed.snapshot?.score ?? "—"} · {feed.snapshot?.gameState ?? "—"} · {feed.snapshot?.fairProbability ? `${(feed.snapshot.fairProbability * 100).toFixed(1)}%` : "—"}{feed.verifiedAt ? ` · verified ${new Date(feed.verifiedAt).toLocaleTimeString()}` : ""}</span> : feed.status === "unavailable" ? <span>{feed.message}</span> : null}</div>}{!key ? <button onClick={() => setPickerOpen(true)}>Connect optional wallet</button> : <div className="access-actions">{!activated && <button onClick={() => void activate()} disabled={busy}>{busy ? "Activating…" : "Activate TxLINE data"}</button>}{activated && <button onClick={onVerifyFeed} disabled={feed.status === "verifying"}>{feed.status === "verifying" ? "Verifying…" : "Verify live TxLINE feed"}</button>}<button className="secondary" onClick={() => void disconnect()}>Disconnect</button></div>}{pickerOpen && <div className="drawer-backdrop" onClick={() => setPickerOpen(false)} role="presentation"><aside className="wallet-picker" role="dialog" aria-modal="true" aria-label="Choose a Solana wallet" onClick={event => event.stopPropagation()}><button className="close" onClick={() => setPickerOpen(false)}>×</button><p className="eyebrow">OPTIONAL DEVNET ACCESS</p><h2>Choose a wallet</h2><p>Phantom and Solflare are only needed for optional TxLINE data.</p>{supportedWallets.length ? supportedWallets.map(item => <button key={item.adapter.name} onClick={() => chooseWallet(item.adapter.name)}><b>{item.adapter.name}</b><span>{item.readyState === "Installed" ? "Detected" : "Available"}</span></button>) : <p className="picker-empty">Install or enable Phantom or Solflare, then reload this page.</p>}</aside></div>}</section>;
}
