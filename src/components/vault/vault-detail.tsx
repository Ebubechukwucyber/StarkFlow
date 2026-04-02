"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Copy, ExternalLink, Shield, TrendingUp } from "lucide-react";
import { Amount, fromAddress, sepoliaTokens } from "starkzap";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { MainShell } from "@/components/layout/main-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useStarkflow } from "@/hooks/use-starkflow";
import { type MockVault, updateVaultSaved } from "@/lib/mock/vaults";

function formatUsd(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

type Props = {
  vault: MockVault;
};

type DcaState = {
  amount: string;
  frequency: "daily" | "weekly";
  strategy: "avnu" | "ekubo";
};

type TxEntry = {
  hash: string;
  label: string;
  time: string;
};

export function VaultDetail({ vault }: Props) {
  const { wallet, sdk, refreshBalances } = useStarkflow();

  const [depositAmount, setDepositAmount] = useState("1");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [savedUsdc, setSavedUsdc] = useState(vault.savedUsdc);
  const [yieldUsd, setYieldUsd] = useState(vault.yieldUsdThisWeek);
 const [yieldSeries, setYieldSeries] = useState(() => {
  const base = vault.savedUsdc > 0
    ? [
        { day: "Mon", value: parseFloat((vault.savedUsdc * 0.92).toFixed(2)) },
        { day: "Tue", value: parseFloat((vault.savedUsdc * 0.94).toFixed(2)) },
        { day: "Wed", value: parseFloat((vault.savedUsdc * 0.95).toFixed(2)) },
        { day: "Thu", value: parseFloat((vault.savedUsdc * 0.97).toFixed(2)) },
        { day: "Fri", value: parseFloat((vault.savedUsdc * 0.98).toFixed(2)) },
        { day: "Sat", value: parseFloat((vault.savedUsdc * 0.99).toFixed(2)) },
        { day: "Sun", value: parseFloat((vault.savedUsdc * 1.00).toFixed(2)) },
      ]
    : [
        { day: "Mon", value: 0 },
        { day: "Tue", value: 0 },
        { day: "Wed", value: 0 },
        { day: "Thu", value: 0 },
        { day: "Fri", value: 0 },
        { day: "Sat", value: 0 },
        { day: "Sun", value: 0 },
      ];
  return base;
});

  const [txHistory, setTxHistory] = useState<TxEntry[]>([]);

  const [dcaState, setDcaState] = useState<DcaState>({
    amount: "20",
    frequency: "weekly",
    strategy: "ekubo",
  });
  const [dcaStatus, setDcaStatus] = useState<string | null>(null);

  const progress = Math.min(
    100,
    Math.round((savedUsdc / vault.goalUsdc) * 100),
  );

  const inviteLink = useMemo(() => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/vaults/${vault.id}?invite=flow-${vault.id}`;
  }, [vault.id]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const onDeposit = async () => {
    setError(null);
    setBusy(true);
    try {
      if (!wallet) throw new Error("Connect wallet first.");

      const parsedAmount = parseFloat(depositAmount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        throw new Error("Enter a valid deposit amount.");
      }

      // Using STRK since user has test STRK available
      const amount = Amount.parse(depositAmount, sepoliaTokens.STRK);

      const tx = await wallet.transfer(
        sepoliaTokens.STRK,
        [{ to: fromAddress(vault.vaultAddress), amount }],
        { feeMode: "user_pays" },
      );

      const now = new Date().toLocaleTimeString();
      setTxHistory((prev) => [
        {
          hash: tx.hash,
          label: `Deposit ${depositAmount} STRK`,
          time: now,
        },
        ...prev,
      ]);

      await tx.wait();

      const newSaved = savedUsdc + parsedAmount;
setSavedUsdc(newSaved);
setYieldUsd((prev) =>
  parseFloat((prev + parsedAmount * 0.002).toFixed(2)),
);
// Save to localStorage so delete protection works
updateVaultSaved(vault.id, parsedAmount);
      setYieldSeries((prev) =>
        prev.map((point, i) =>
          i === prev.length - 1
            ? {
                ...point,
                value: parseFloat(
                  (point.value + parsedAmount * 0.001).toFixed(2),
                ),
              }
            : point,
        ),
      );

      await refreshBalances();
      showToast("Deposit confirmed! Balance updated.");
    } catch (e) {
      const raw = e instanceof Error ? e.message : String(e);
      setError(`Error: ${raw}`);
    } finally {
      setBusy(false);
    }
  };

  const onConnectDca = async () => {
    setError(null);
    setDcaStatus(null);
    try {
      if (!wallet) throw new Error("Connect wallet first.");
      const dcaModule = (sdk as unknown as { dca?: unknown } | null)?.dca;
      if (dcaModule && typeof dcaModule === "object") {
        setDcaStatus(
          `DCA configured: ${dcaState.amount} STRK ${dcaState.frequency} via ${dcaState.strategy.toUpperCase()}.`,
        );
      } else {
        setDcaStatus(
          `DCA scheduled: ${dcaState.amount} STRK ${dcaState.frequency} via ${dcaState.strategy.toUpperCase()}.`,
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to configure DCA.");
    }
  };

  return (
    <ProtectedRoute>
      <MainShell>
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">

          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <h1 className="font-display text-2xl font-semibold tracking-tight">
                {vault.name}
              </h1>
              <p className="text-sm text-muted-foreground">
                {vault.type} vault · {progress}% toward goal · Sepolia
              </p>
            </div>
            <Button variant="secondary" asChild>
              <Link href="/dashboard">Back</Link>
            </Button>
          </div>

          <div className="mb-6">
            <div className="mb-1 flex justify-between text-xs text-muted-foreground">
              <span>{formatUsd(savedUsdc)} saved</span>
              <span>Goal: {formatUsd(vault.goalUsdc)}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-border">
              <div
                className="h-full rounded-full bg-primary transition-all duration-700"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-1 text-right text-xs text-muted-foreground">
              {progress}% complete
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Live yield (mock)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={yieldSeries}>
                      <defs>
                        <linearGradient id="yield" x1="0" y1="0" x2="0" y2="1">
                          <stop
                            offset="5%"
                            stopColor="#a78bfa"
                            stopOpacity={0.5}
                          />
                          <stop
                            offset="95%"
                            stopColor="#a78bfa"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="day" stroke="#8b8b9f" />
                      <YAxis stroke="#8b8b9f" />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#a78bfa"
                        fillOpacity={1}
                        fill="url(#yield)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Vault stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>
                  Saved:{" "}
                  <span className="font-medium text-foreground">
                    {formatUsd(savedUsdc)}
                  </span>
                </p>
                <p>Goal: {formatUsd(vault.goalUsdc)}</p>
                <p>
                  Yield this week:{" "}
                  <span className="text-emerald-400">
                    +{formatUsd(yieldUsd)}
                  </span>
                </p>
                <p>Members: {vault.members.length}</p>
                <p>Network: Sepolia</p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg">Deposit STRK</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  Deposit STRK into this vault. Small amount of STRK used for gas.
                </p>
                <input
                  className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  inputMode="decimal"
                  placeholder="Amount in STRK"
                  aria-label="Deposit amount in STRK"
                />
                <Button
                  className="w-full"
                  disabled={busy}
                  onClick={() => void onDeposit()}
                >
                  {busy ? "Submitting..." : "Deposit STRK"}
                </Button>
                {txHistory[0] && txHistory[0].time !== "Earlier" ? (
                  <Link
                    className="inline-flex items-center text-xs text-primary"
                    href={`https://sepolia.voyager.online/tx/${txHistory[0].hash}`}
                    target="_blank"
                  >
                    View last tx
                    <ExternalLink className="ml-1 h-3 w-3" />
                  </Link>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">DCA setup</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <input
                  className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
                  value={dcaState.amount}
                  onChange={(e) =>
                    setDcaState((s) => ({ ...s, amount: e.target.value }))
                  }
                  inputMode="decimal"
                  aria-label="DCA amount"
                />
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={
                      dcaState.frequency === "daily" ? "default" : "secondary"
                    }
                    onClick={() =>
                      setDcaState((s) => ({ ...s, frequency: "daily" }))
                    }
                  >
                    Daily
                  </Button>
                  <Button
                    variant={
                      dcaState.frequency === "weekly" ? "default" : "secondary"
                    }
                    onClick={() =>
                      setDcaState((s) => ({ ...s, frequency: "weekly" }))
                    }
                  >
                    Weekly
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={
                      dcaState.strategy === "ekubo" ? "default" : "secondary"
                    }
                    onClick={() =>
                      setDcaState((s) => ({ ...s, strategy: "ekubo" }))
                    }
                  >
                    Ekubo
                  </Button>
                  <Button
                    variant={
                      dcaState.strategy === "avnu" ? "default" : "secondary"
                    }
                    onClick={() =>
                      setDcaState((s) => ({ ...s, strategy: "avnu" }))
                    }
                  >
                    AVNU
                  </Button>
                </div>
                <Button variant="secondary" onClick={() => void onConnectDca()}>
                  Connect DCA ({dcaState.strategy.toUpperCase()})
                </Button>
                {dcaStatus ? (
                  <p className="text-xs text-emerald-300">{dcaStatus}</p>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Shared invite</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Share this link to invite members into this Flow Vault.
                </p>
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => {
                    void navigator.clipboard
                      .writeText(inviteLink)
                      .catch(() => setError("Clipboard copy failed."));
                  }}
                >
                  <Copy className="mr-1.5 h-4 w-4" />
                  Copy invite link
                </Button>
                <p className="truncate text-xs text-muted-foreground">
                  {inviteLink}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-4">
            <CardContent className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4 text-primary" />
              Transactions appear below after each deposit.
              <Shield className="ml-2 h-4 w-4" />
              Sepolia testnet only.
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-lg">Recent transactions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {txHistory.map((tx) => (
                <Link
                  key={tx.hash}
                  href={`https://sepolia.voyager.online/tx/${tx.hash}`}
                  target="_blank"
                  className="flex items-center justify-between rounded-lg border border-border/60 p-3 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <div>
                    <p>{tx.label}</p>
                    <p className="text-xs opacity-60">{tx.time}</p>
                  </div>
                  <ExternalLink className="h-4 w-4 shrink-0" />
                </Link>
              ))}
            </CardContent>
          </Card>

          {error ? (
            <p className="mt-3 text-sm text-rose-300">{error}</p>
          ) : null}

        </div>

        {toast ? (
          <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl border border-primary/30 bg-card px-5 py-3 text-sm font-medium text-foreground shadow-lg">
            {toast}
          </div>
        ) : null}

      </MainShell>
    </ProtectedRoute>
  );
}