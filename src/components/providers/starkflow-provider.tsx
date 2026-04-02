"use client";

import { StarkZap, StarkSigner, OnboardStrategy, accountPresets, sepoliaTokens, type OnboardResult } from "starkzap";
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
  ensureReady: (options?: unknown) => Promise<void>;
  deploy: (options?: unknown) => Promise<{ hash: string; wait: () => Promise<void> }>;
  isDeployed: () => Promise<boolean>;
  disconnect?: () => Promise<void>;
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
  toast: string | null;
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

const STARK_CURVE_N =
  3618502788666131213697322783095070105526743751716087489154079457884512865583n;

function bytesToBigInt(bytes: Uint8Array): bigint {
  let v = 0n;
  for (const b of bytes) v = (v << 8n) + BigInt(b);
  return v;
}

function generateValidStarknetPrivateKeyHex(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const raw = bytesToBigInt(bytes);
  const k = (raw % (STARK_CURVE_N - 1n)) + 1n;
  return `0x${k.toString(16)}`;
}

function readMode(): Mode {
  if (typeof window === "undefined") return null;
  const v = localStorage.getItem(LS_MODE) as Mode | null;
  return v === "signer" ? v : null;
}

function readDemoPrivateKey(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(LS_DEMO_PK);
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
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  }, []);

  const getSdk = useCallback(() => {
    if (!sdkRef.current) {
      const paymasterUrl =
        typeof window === "undefined"
          ? "http://localhost:3000/api/paymaster"
          : new URL("/api/paymaster", window.location.origin).toString();
      sdkRef.current = new StarkZap({
        network: "sepolia",
        paymaster: { nodeUrl: paymasterUrl },
      });
    }
    return sdkRef.current;
  }, []);

  const applyWallet = useCallback(async (w: StarkflowWallet) => {
    setWallet(w);
    const addr = w.address.toString();
    setWalletAddress(addr);
    try {
      setDeployed(await w.isDeployed());
    } catch {
      setDeployed(null);
    }
    try {
      const [usdcBal, strkBal] = await Promise.all([
        w.balanceOf(sepoliaTokens.USDC),
        w.balanceOf(sepoliaTokens.STRK),
      ]);
      setBalances({ usdc: usdcBal.toUnit(), strk: strkBal.toUnit() });
    } catch {
      setBalances({ usdc: "0", strk: "0" });
    }
    setReady(true);
  }, []);

  const onboardWithSigner = useCallback(
    async (privateKey: string) => {
      setError(null);
      setLoading(true);
      try {
        const sdk = getSdk();
        const onboard: OnboardResult = await sdk.onboard({
          strategy: OnboardStrategy.Signer,
          account: { signer: new StarkSigner(privateKey) },
          accountPreset: accountPresets.openzeppelin,
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
    let pk = localStorage.getItem(LS_DEMO_PK);
    if (!pk) {
      pk = generateValidStarknetPrivateKeyHex();
      localStorage.setItem(LS_DEMO_PK, pk);
    }
    return await onboardWithSigner(pk);
  }, [onboardWithSigner]);

  const refreshBalances = useCallback(async () => {
    if (!wallet) return;
    try {
      setDeployed(await wallet.isDeployed());
    } catch { /* ignore */ }
    try {
      const [usdcBal, strkBal] = await Promise.all([
        wallet.balanceOf(sepoliaTokens.USDC),
        wallet.balanceOf(sepoliaTokens.STRK),
      ]);
      setBalances({ usdc: usdcBal.toUnit(), strk: strkBal.toUnit() });
    } catch { /* ignore */ }
  }, [wallet]);

  const deployAccount = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      if (!wallet) throw new Error("No wallet session. Please onboard first.");

      const alreadyDeployed = await wallet.isDeployed();
      if (alreadyDeployed) {
        setDeployed(true);
        showToast("✅ Account is already deployed!");
        return true;
      }

      // Try sponsored first (no STRK needed), fall back to user_pays
      let feeMode: "sponsored" | "user_pays" = "sponsored";
      try {
        const healthRes = await fetch("/api/paymaster/health");
        const health = (await healthRes.json()) as { ok: boolean };
        if (!health.ok) feeMode = "user_pays";
      } catch {
        feeMode = "sponsored";
      }

      // Call ensureReady directly on wallet object (preserves `this` context)
      await wallet.ensureReady({ deploy: "if_needed", feeMode });

      const nowDeployed = await wallet.isDeployed();
      setDeployed(nowDeployed);
      await refreshBalances();

      if (nowDeployed) {
        showToast("🎉 Account deployed! You can now deposit gaslessly.");
      } else {
        throw new Error(
          feeMode === "user_pays"
            ? "Deploy failed. Make sure your wallet has Sepolia STRK, then try again."
            : "Deploy failed. Please try again or get tokens from the faucet.",
        );
      }
      return true;
    } catch (e) {
      const raw = e instanceof Error ? e.message : "Deploy failed.";
      const message = raw.includes("max fee")
        ? "Not enough STRK to pay deploy fee. Get STRK from the faucet first."
        : raw.includes("rejected")
          ? "Transaction rejected. Check your STRK balance and try again."
          : raw.includes("timeout") || raw.includes("network")
            ? "Network timeout. Sepolia can be slow — please try again."
            : raw;
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [wallet, refreshBalances, showToast]);

  const logoutAndClear = useCallback(async () => {
    try {
      await wallet?.disconnect?.();
    } catch { /* ignore */ }
    setWallet(null);
    setWalletAddress(null);
    setBalances(null);
    setDeployed(null);
    setError(null);
    setToast(null);
    setReady(false);
    if (typeof window !== "undefined") {
      localStorage.removeItem(LS_MODE);
    }
  }, [wallet]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const mode = readMode();
        if (mode === "signer") {
          const pk = readDemoPrivateKey();
          if (pk) await onboardWithSigner(pk);
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => { cancelled = true; };
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
      toast,
      onboardDemo,
      onboardWithSigner,
      deployAccount,
      logoutAndClear,
      refreshBalances,
    }),
    [wallet, walletAddress, balances, ready, deployed, loading, error, toast,
     onboardDemo, onboardWithSigner, deployAccount, logoutAndClear, refreshBalances, getSdk],
  );

  return (
    <StarkflowContext.Provider value={value}>
      {children}
    </StarkflowContext.Provider>
  );
}

export function useStarkflow() {
  const context = useContext(StarkflowContext);
  if (!context) throw new Error("useStarkflow must be used within StarkflowProvider");
  return context;
}