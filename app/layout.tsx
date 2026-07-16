import type { Metadata } from "next";
import "./globals.css";
import { WalletProvider } from "./components/WalletProvider";

export const metadata: Metadata = {
  title: "VARGuard | Live Market Risk Control",
  description: "Deterministic market-risk protection for international tournament-style simulated prediction markets.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><WalletProvider>{children}</WalletProvider></body></html>;
}
