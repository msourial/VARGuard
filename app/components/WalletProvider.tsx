"use client";

import { useMemo, type ComponentType, type ReactNode } from "react";
import { ConnectionProvider, WalletProvider as SolanaWalletProvider } from "@solana/wallet-adapter-react";

export const DEVNET_RPC = "https://api.devnet.solana.com";
export function WalletProvider({ children }: { children: ReactNode }) {
  // Phantom and Solflare register through Wallet Standard. Supplying legacy adapters as
  // well creates duplicate wallets and noisy duplicate-registration warnings.
  const wallets = useMemo(() => [], []);
  const Connection = ConnectionProvider as unknown as ComponentType<{ endpoint: string; children: ReactNode }>;
  const Wallet = SolanaWalletProvider as unknown as ComponentType<{ wallets: typeof wallets; autoConnect: boolean; children: ReactNode }>;
  return <Connection endpoint={DEVNET_RPC}><Wallet wallets={wallets} autoConnect={false}>{children}</Wallet></Connection>;
}
