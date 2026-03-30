"use client";

import {
  StarkZap,
  StarkSigner,
  OnboardStrategy,
  accountPresets,
  sepoliaTokens,
  type OnboardResult,
} from "starkzap";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type StarkflowWallet = {
  address: { toString: () => string };
  balanceOf: (token: unknown) => Promise<{ toUnit: () => string }>;
  ensureReady?: (options?: unknown) => Promise<void>;
  isDeployed?: () => Promise<boolean>;
  transfer: (
    token: unknown,
    transfers: Array<{ to: unknown; amount: unknown }>,
    options?: { feeMode?: "sponsored" | "user_pays" },
  ) => Promise<{ hash: string; wait: () => Promise<void> }>;
};

type Balances = { usdc: string; strk: string };

type StarkflowContextType = {
  sdk: StarkZap | null;
  wallet: StarkflowWallet | null;
  walletAddress: string | null;
  balances: Balances | null;
  ready: boolean;
  deployed: boolean | null;
  loading: boolean;
  error: string | null;
  /** Demo onboarding: generates/stores a Sepolia-only private key. */
  onboardDemo: () => Promise<boolean>;
  onboardWithSigner: (privateKey: string) => Promise<boolean>;
  deployAccount: () => Promise<boolean>;
  logoutAndClear: () => Promise<void>;
  refreshBalances: () => Promise<void>;
};

const StarkflowContext = createContext<StarkflowContextType | null>(null);

type ProviderProps = { children: React.ReactNode };

const LS_MODE = "starkflow_onboard_mode";
const LS_DEMO_PK = "starkflow_demo_private_key";
type Mode = "signer" | null;

// Starknet elliptic curve order (same as error message).
const STARK_CURVE_N =
  3618502788666131213697322783095070105526743751716087489154079457884512865583n;

function bytesToBigInt(bytes: Uint8Array): bigint {
  let v = 0n;
  for (const b of bytes) v = (v << 8n) + BigInt(b);
  return v;
}

function toHex(n: bigint): string {
  return n.toString(16);
}

function generateValidStarknetPrivateKeyHex(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const raw = bytesToBigInt(bytes);
  // Ensure 1 <= k < n
  const k = (raw % (STARK_CURVE_N - 1n)) + 1n;
  return `0x${toHex(k)}`;
}

function readMode(): Mode {
  if (typeof window === "undefined") return null;
  const v = localStorage.getItem(LS_MODE) as Mode | null;
  return v === "signer" ? v : null;
}

function readDemoPrivateKey(): string | null {
  if (typeof window === "undefined") return null;
  const v = localStorage.getItem(LS_DEMO_PK);
  if (!v) return null;
  return v;
}

export function StarkflowProvider({ children }: ProviderProps) {
  const sdkRef = useRef<StarkZap | null>(null);
  const [wallet, setWallet] = useState<StarkflowWallet | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [balances, setBalances] = useState<Balances | null>(null);
  const [deployed, setDeployed] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const getSdk = useCallback(() => {
    if (!sdkRef.current) {
      const paymasterUrl =
        typeof window === "undefined"
          ? "http://localhost:3000/api/paymaster"
          : new URL("/api/paymaster", window.location.origin).toString();

      sdkRef.current = new StarkZap({
        network: "sepolia",
        paymaster: {
          nodeUrl: paymasterUrl,
        },
      });
    }
    return sdkRef.current;
  }, []);

  const applyWallet = useCallback(async (w: StarkflowWallet) => {
    setWallet(w);
    const addr = w.address.toString();
    setWalletAddress(addr);
    if (typeof w.isDeployed === "function") {
      try {
        setDeployed(await w.isDeployed());
      } catch {
        setDeployed(null);
      }
    } else {
      setDeployed(null);
    }
    const [usdcBal, strkBal] = await Promise.all([
      w.balanceOf(sepoliaTokens.USDC),
      w.balanceOf(sepoliaTokens.STRK),
    ]);
    setBalances({ usdc: usdcBal.toUnit(), strk: strkBal.toUnit() });
    setReady(true);
  }, []);

  const onboardWithSigner = useCallback(
    async (privateKey: string) => {
      setError(null);
      setLoading(true);
      try {
        const sdk = getSdk();
        // Sponsored onboarding may require AVNU paymaster config. Deposit button
        // will still enforce sponsorship availability via /api/paymaster/health.
        const onboard: OnboardResult = await sdk.onboard({
          strategy: OnboardStrategy.Signer,
          account: { signer: new StarkSigner(privateKey) },
          accountPreset: accountPresets.argentXV050,
          // Demo-first UX: don't block onboarding on deployment (requires STRK unless paymastered).
          deploy: "never",
          feeMode: "user_pays",
        });
        await applyWallet(onboard.wallet as unknown as StarkflowWallet);
        if (typeof window !== "undefined") {
          localStorage.setItem(LS_MODE, "signer");
          localStorage.setItem(LS_DEMO_PK, privateKey);
        }
        return true;
      } catch (e) {
        const message = e instanceof Error ? e.message : "Signer onboarding failed.";
        setError(message);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [applyWallet, getSdk],
  );

  const onboardDemo = useCallback(async () => {
    if (typeof window === "undefined") return false;

    // Sepolia-only demo key. Never use this pattern on mainnet/production.
    let pk = localStorage.getItem(LS_DEMO_PK);
    if (!pk) {
      pk = generateValidStarknetPrivateKeyHex();
      localStorage.setItem(LS_DEMO_PK, pk);
    }
    return await onboardWithSigner(pk);
  }, [onboardWithSigner]);

  const refreshBalances = useCallback(async () => {
    if (!wallet) return;
    if (typeof wallet.isDeployed === "function") {
      try {
        setDeployed(await wallet.isDeployed());
      } catch {
        /* ignore */
      }
    }
    const [usdcBal, strkBal] = await Promise.all([
      wallet.balanceOf(sepoliaTokens.USDC),
      wallet.balanceOf(sepoliaTokens.STRK),
    ]);
    setBalances({ usdc: usdcBal.toUnit(), strk: strkBal.toUnit() });
  }, [wallet]);

  const deployAccount = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      if (!wallet) throw new Error("No wallet session.");
      const ensureReady = (wallet as unknown as { ensureReady?: (o?: unknown) => Promise<void> })
        ?.ensureReady;
      if (typeof ensureReady !== "function") {
        throw new Error("This wallet does not support ensureReady().");
      }

      // If AVNU paymaster is configured, deploy can be sponsored. Otherwise user pays (needs STRK).
      const healthRes = await fetch("/api/paymaster/health");
      const health = (await healthRes.json()) as { ok: boolean };
      const feeMode = health.ok ? "sponsored" : "user_pays";

      await ensureReady({ deploy: "if_needed", feeMode });
      if (typeof wallet.isDeployed === "function") {
        setDeployed(await wallet.isDeployed());
      }
      await refreshBalances();
      return true;
    } catch (e) {
      const message = e instanceof Error ? e.message : "Deploy failed.";
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [refreshBalances, wallet]);

  const logoutAndClear = useCallback(async () => {
    setWallet(null);
    setWalletAddress(null);
    setBalances(null);
    setDeployed(null);
    setError(null);
    setReady(false);

    if (typeof window !== "undefined") {
      localStorage.removeItem(LS_MODE);
      // Keep demo PK if you want to re-onboard quickly; remove if you prefer.
      // localStorage.removeItem(LS_DEMO_PK);
    }

    const maybeDisconnect = (wallet as unknown as { disconnect?: () => Promise<void> })
      ?.disconnect;
    if (typeof maybeDisconnect === "function") {
      await maybeDisconnect().catch(() => undefined);
    }
  }, [wallet]);

  // Auto re-onboard for signer mode if demo key exists.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const mode = readMode();
        if (mode === "signer") {
          const pk = readDemoPrivateKey();
          if (pk) {
            const ok = await onboardWithSigner(pk);
            if (!cancelled && !ok) {
              // Stay unauthenticated.
            }
          }
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [onboardWithSigner]);

  const value = useMemo<StarkflowContextType>(
    () => ({
      sdk: walletAddress ? getSdk() : null,
      wallet,
      walletAddress,
      balances,
      ready,
      deployed,
      loading,
      error,
      onboardDemo,
      onboardWithSigner,
      deployAccount,
      logoutAndClear,
      refreshBalances,
    }),
    [
      wallet,
      walletAddress,
      balances,
      ready,
      deployed,
      loading,
      error,
      onboardDemo,
      onboardWithSigner,
      deployAccount,
      logoutAndClear,
      refreshBalances,
      getSdk,
    ],
  );

  return <StarkflowContext.Provider value={value}>{children}</StarkflowContext.Provider>;
}

export function useStarkflow() {
  const context = useContext(StarkflowContext);
  if (!context) {
    throw new Error("useStarkflow must be used within StarkflowProvider");
  }
  return context;
}

