"use client";

import { useMemo, type ComponentType, type ReactNode } from "react";
import { ConnectionProvider, WalletProvider as SolanaWalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { SolflareWalletAdapter } from "@solana/wallet-adapter-solflare";

export const DEVNET_RPC = "https://api.devnet.solana.com";
export function WalletProvider({ children }: { children: ReactNode }) {
  const wallets = useMemo(() => [new PhantomWalletAdapter(), new SolflareWalletAdapter()], []);
  // Current wallet-adapter declarations target React 18; the runtime is React 19-compatible.
  const Connection = ConnectionProvider as unknown as ComponentType<{ endpoint: string; children: ReactNode }>;
  const Wallet = SolanaWalletProvider as unknown as ComponentType<{ wallets: typeof wallets; autoConnect: boolean; children: ReactNode }>;
  const Modal = WalletModalProvider as unknown as ComponentType<{ children: ReactNode }>;
  return <Connection endpoint={DEVNET_RPC}><Wallet wallets={wallets} autoConnect={false}><Modal>{children}</Modal></Wallet></Connection>;
}
