import type { Metadata, Viewport } from "next";
import { DM_Sans, Outfit } from "next/font/google";

import { Providers } from "@/components/providers/Providers";

import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "StarkFlow · Save globally. Grow automatically.",
    template: "%s · StarkFlow",
  },
  description:
    "Flow Vaults on Starknet Sepolia — gasless USDC, DCA, yield, optional private transfers. Powered by Starkzap.",
};

export const viewport: Viewport = {
  themeColor: "#0c0c0f",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${outfit.variable} ${dmSans.variable} min-h-screen font-sans`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
