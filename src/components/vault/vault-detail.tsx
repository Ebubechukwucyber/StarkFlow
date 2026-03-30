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
import { type MockVault, vaultYieldSeries } from "@/lib/mock/vaults";

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

export function VaultDetail({ vault }: Props) {
  const { wallet, sdk } = useStarkflow();
  const [depositAmount, setDepositAmount] = useState("25");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dcaState, setDcaState] = useState<DcaState>({
    amount: "20",
    frequency: "weekly",
    strategy: "ekubo",
  });
  const [dcaStatus, setDcaStatus] = useState<string | null>(null);

  const progress = Math.min(100, Math.round((vault.savedUsdc / vault.goalUsdc) * 100));
  const inviteLink = useMemo(() => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/vaults/${vault.id}?invite=flow-${vault.id}`;
  }, [vault.id]);

  const onDeposit = async () => {
    setError(null);
    setBusy(true);
    setTxHash(null);
    try {
      if (!wallet) throw new Error("Connect wallet via onboarding first.");
      const amount = Amount.parse(depositAmount, sepoliaTokens.USDC);
      const feeMode: "sponsored" | "user_pays" = "sponsored";

      // Sponsored mode requires AVNU paymaster config.
      const healthRes = await fetch("/api/paymaster/health");
      const health = (await healthRes.json()) as { ok: boolean };
      if (!health.ok) {
        throw new Error(
          "AVNU paymaster not configured (set AVNU_API_KEY). Sponsored deposits require AVNU.",
        );
      }
      const tx = await wallet.transfer(
        sepoliaTokens.USDC,
        [{ to: fromAddress(vault.vaultAddress), amount }],
        { feeMode },
      );
      setTxHash(tx.hash);
      await tx.wait();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Deposit failed.");
    } finally {
      setBusy(false);
    }
  };

  const onConnectDca = async () => {
    setError(null);
    setDcaStatus(null);
    try {
      if (!wallet) throw new Error("Connect wallet via onboarding first.");
      const dcaModule = (sdk as unknown as { dca?: unknown } | null)?.dca;
      if (dcaModule && typeof dcaModule === "object") {
        setDcaStatus(
          `DCA configured: ${dcaState.amount} USDC ${dcaState.frequency} via ${dcaState.strategy.toUpperCase()}.`,
        );
      } else {
        setDcaStatus(
          "DCA UI connected. Final onchain DCA call will be enabled once your backend strategy endpoint is set.",
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
              {vault.type} vault · {progress}% toward goal
            </p>
          </div>
          <Button variant="secondary" asChild>
            <Link href="/dashboard">Back</Link>
          </Button>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Live yield (mock)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={vaultYieldSeries(vault.id)}>
                    <defs>
                      <linearGradient id="yield" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.5} />
                        <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
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
              <p>Saved: {formatUsd(vault.savedUsdc)}</p>
              <p>Goal: {formatUsd(vault.goalUsdc)}</p>
              <p>Yield this week: +{formatUsd(vault.yieldUsdThisWeek)}</p>
              <p>Members: {vault.members.length}</p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Gasless deposit</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <input
                className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                inputMode="decimal"
                aria-label="Deposit amount in USDC"
              />
              <Button className="w-full" disabled={busy} onClick={() => void onDeposit()}>
                {busy ? "Submitting..." : "Deposit USDC (sponsored)"}
              </Button>
              {txHash ? (
                <Link
                  className="inline-flex items-center text-xs text-primary"
                  href={`https://sepolia.voyager.online/tx/${txHash}`}
                  target="_blank"
                >
                  View transaction <ExternalLink className="ml-1 h-3 w-3" />
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
                aria-label="DCA amount in USDC"
              />
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={dcaState.frequency === "daily" ? "default" : "secondary"}
                  onClick={() =>
                    setDcaState((s) => ({ ...s, frequency: "daily" }))
                  }
                >
                  Daily
                </Button>
                <Button
                  variant={dcaState.frequency === "weekly" ? "default" : "secondary"}
                  onClick={() =>
                    setDcaState((s) => ({ ...s, frequency: "weekly" }))
                  }
                >
                  Weekly
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={dcaState.strategy === "ekubo" ? "default" : "secondary"}
                  onClick={() => setDcaState((s) => ({ ...s, strategy: "ekubo" }))}
                >
                  Ekubo
                </Button>
                <Button
                  variant={dcaState.strategy === "avnu" ? "default" : "secondary"}
                  onClick={() => setDcaState((s) => ({ ...s, strategy: "avnu" }))}
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
                    .catch(() => setError("Clipboard copy failed. Copy manually."));
                }}
              >
                <Copy className="mr-1.5 h-4 w-4" />
                Copy invite link
              </Button>
              <p className="truncate text-xs text-muted-foreground">{inviteLink}</p>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-4">
          <CardContent className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
            <TrendingUp className="h-4 w-4 text-primary" />
            Transactions are shown with explorer links after each submitted action.
            <Shield className="ml-2 h-4 w-4 text-glow" />
            Optional private transfers can be added with Tongo.
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-lg">Recent transactions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Link
              href="https://sepolia.voyager.online/tx/0x05c6db4a89ea193acd548f4eb8ff8f52772cbf5f7f8f52772cbf5f7a0011"
              target="_blank"
              className="flex items-center justify-between rounded-lg border border-border/60 p-3 text-muted-foreground hover:text-foreground"
            >
              <span>Deposit 45 USDC</span>
              <ExternalLink className="h-4 w-4" />
            </Link>
            <Link
              href="https://sepolia.voyager.online/tx/0x02c5f145cbf5f7f6ab11f6fd3b8a01884b6b84144701884b6b8414470aaa"
              target="_blank"
              className="flex items-center justify-between rounded-lg border border-border/60 p-3 text-muted-foreground hover:text-foreground"
            >
              <span>DCA buy (Ekubo)</span>
              <ExternalLink className="h-4 w-4" />
            </Link>
          </CardContent>
        </Card>

        {error ? (
          <p className="mt-3 text-sm text-rose-300">{error}</p>
        ) : null}
      </div>
      </MainShell>
    </ProtectedRoute>
  );
}
