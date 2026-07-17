"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { shortenPublicKey } from "@/lib/txline/activation";
import { TxLineActivation } from "./TxLineActivation";
import type { TxLineFeedConnection } from "@/lib/txline/types";

export function DevnetDataControl({ onActivationChange, feed, onVerifyFeed, onDisconnectFeed }: { onActivationChange: (active: boolean) => void; feed: TxLineFeedConnection; onVerifyFeed: () => void; onDisconnectFeed: () => void }) {
  const { publicKey } = useWallet();
  const [open, setOpen] = useState(false), [activated, setActivated] = useState(false);
  const handleActivation = (active: boolean) => { setActivated(active); onActivationChange(active); };
  const label = feed.status === "live" && publicKey ? `● LIVE · ${shortenPublicKey(publicKey.toBase58())}` : activated && publicKey ? `Devnet active · ${shortenPublicKey(publicKey.toBase58())}` : "Devnet data · optional";
  return <div className="devnet-control"><button className={`devnet-button ${activated ? "active" : ""}`} onClick={() => setOpen(true)}>{label}</button>{open && <div className="drawer-backdrop" role="presentation" onClick={() => setOpen(false)}><aside className="wallet-drawer devnet-drawer" role="dialog" aria-modal="true" aria-label="Optional Devnet data access" onClick={event => event.stopPropagation()}><button className="close" onClick={() => setOpen(false)}>×</button><p className="eyebrow">OPTIONAL HACKATHON INTEGRATION</p><h2>Devnet data access</h2><p>Solana Devnet · test SOL only. The replay works without a wallet.</p><TxLineActivation initialActivated={activated} onActivationChange={handleActivation} feed={feed} onVerifyFeed={onVerifyFeed} onDisconnectFeed={onDisconnectFeed} /></aside></div>}</div>;
}
