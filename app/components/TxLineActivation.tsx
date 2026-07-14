"use client";

import { useEffect, useState } from "react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import {
  activationError,
  activationMessage,
  MIN_DEVNET_SOL,
  shortenPublicKey,
  type ActivationSession,
  type TxLineActivationState,
} from "@/lib/txline/activation";
import { subscribeToTxLineDevnet } from "@/lib/txline/subscribe";

const copy: Record<TxLineActivationState, string> = {
  disconnected: "Connect Phantom or Solflare on Solana Devnet to activate the free data feed.",
  connected: "Free tier: no subscription payment. Devnet SOL is used only for the transaction fee and token-account rent.",
  "insufficient-sol": "This wallet needs at least 0.002 Devnet SOL for the free-tier transaction fee and account rent.",
  subscribing: "Preparing the TxLINE free-tier devnet subscription…",
  "awaiting-signature": "Subscription confirmed. Approve the TxLINE activation message in your wallet.",
  activating: "Verifying the subscription and securing this browser session…",
  activated: "Free data access is active in this browser. Connect the read-only fixture feed above.",
  error: "Activation did not complete. Your replay demo remains available.",
};

function base64(bytes: Uint8Array) {
  let value = "";
  bytes.forEach(byte => { value += String.fromCharCode(byte); });
  return btoa(value);
}

export function TxLineActivation() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const { setVisible } = useWalletModal();
  const [state, setState] = useState<TxLineActivationState>("disconnected");
  const [message, setMessage] = useState(copy.disconnected);
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    if (!wallet.publicKey) {
      setState("disconnected");
      setMessage(copy.disconnected);
      setBalance(null);
      return;
    }
    void connection.getBalance(wallet.publicKey, "confirmed").then(lamports => {
      if (!active) return;
      const sol = lamports / LAMPORTS_PER_SOL;
      setBalance(sol);
      const next = sol < MIN_DEVNET_SOL ? "insufficient-sol" : "connected";
      setState(next);
      setMessage(copy[next]);
    }).catch(() => {
      if (!active) return;
      setState("error");
      setMessage("Could not check the Devnet balance. Confirm the wallet is on Devnet and try again.");
    });
    return () => { active = false; };
  }, [connection, wallet.publicKey?.toBase58()]);

  const activate = async () => {
    if (!wallet.publicKey || !wallet.signMessage) {
      setVisible(true);
      return;
    }
    if (balance !== null && balance < MIN_DEVNET_SOL) {
      setState("insufficient-sol");
      setMessage(copy["insufficient-sol"]);
      return;
    }
    try {
      const sessionResponse = await fetch("/api/txline/activation-session", { method: "POST" });
      const session = (await sessionResponse.json()) as ActivationSession & { error?: string };
      if (!sessionResponse.ok || !session.jwt) throw new Error(session.error ?? "Could not start the TxLINE activation session.");
      setState("subscribing");
      setMessage(copy.subscribing);
      const txSig = await subscribeToTxLineDevnet(wallet, connection);
      setState("awaiting-signature");
      setMessage(copy["awaiting-signature"]);
      const walletSignature = await wallet.signMessage(new TextEncoder().encode(activationMessage(txSig, session.jwt)));
      setState("activating");
      setMessage(copy.activating);
      const activationResponse = await fetch("/api/txline/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ txSig, walletSignature: base64(walletSignature) }),
      });
      const result = (await activationResponse.json()) as { error?: string };
      if (!activationResponse.ok) throw new Error(result.error ?? "TxLINE activation was rejected.");
      setState("activated");
      setMessage(copy.activated);
    } catch (error) {
      setState("error");
      setMessage(activationError(error));
    }
  };

  const disconnect = async () => {
    await fetch("/api/txline/disconnect", { method: "POST" }).catch(() => undefined);
    await wallet.disconnect().catch(() => undefined);
    setState("disconnected");
    setMessage(copy.disconnected);
  };

  const walletKey = wallet.publicKey?.toBase58();
  const busy = state === "subscribing" || state === "awaiting-signature" || state === "activating";
  return <section className="activation-card">
    <div className="activation-heading">
      <div><p className="eyebrow">OPTIONAL DEVNET ACCESS</p><h2>Activate TxLINE Free Data</h2></div>
      <span className={`activation-status ${state}`}>{state.replaceAll("-", " ")}</span>
    </div>
    <p>{message}</p>
    <div className="activation-detail">
      <span>Network <b>Solana Devnet</b></span>
      {walletKey && <span>Wallet <b>{shortenPublicKey(walletKey)}</b></span>}
      {balance !== null && <span>Devnet SOL <b>{balance.toFixed(4)}</b></span>}
    </div>
    <div className="activation-actions">
      {!walletKey ? <button onClick={() => setVisible(true)}>Connect wallet</button> : <>
        {state !== "activated" && <button onClick={() => void activate()} disabled={busy}>{busy ? "Activating…" : "Activate free data"}</button>}
        <button className="secondary" onClick={() => void disconnect()}>Disconnect wallet</button>
      </>}
    </div>
    <small>Test SOL only. This feature does not support payments, trading, transfers, custody, or mainnet.</small>
  </section>;
}
