"use client";

import { StarkZap } from "starkzap";

/** Sepolia testnet SDK instance — use from the browser after the wallet session is ready. */
export function createStarkZapSepoliaClient(): StarkZap {
  const paymasterUrl =
    typeof window === "undefined"
      ? "http://localhost:3000/api/paymaster"
      : new URL("/api/paymaster", window.location.origin).toString();

  // Proxy AVNU Paymaster via Next.js API to keep AVNU_API_KEY server-side.
  return new StarkZap({
    network: "sepolia",
    paymaster: {
      nodeUrl: paymasterUrl,
    },
  });
}
