import type { Metadata } from "next";
import "./globals.css";
import "./live.css";

export const metadata: Metadata = {
  title: "VARGuard | Live Market Risk Control",
  description: "Deterministic risk protection for simulated live football prediction markets.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
