"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Copy, Plus, Trash2, Wallet } from "lucide-react";
import { sepoliaTokens } from "starkzap";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { MainShell } from "@/components/layout/main-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useStarkflow } from "@/hooks/use-starkflow";
import { getVaults, mockTotals, deleteVault } from "@/lib/mock/vaults";

function fmtUsd(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function isNewVault(createdAt: number): boolean {
  const oneDayMs = 1000 * 60 * 60 * 24;
  return Date.now() - createdAt < oneDayMs;
}

export function DashboardView() {
  const {
    walletAddress,
    balances,
    deployed,
    deployAccount,
    refreshBalances,
    logoutAndClear,
    loading,
    toast,
  } = useStarkflow();

  const [vaults, setVaults] = useState(getVaults());
  const totals = useMemo(() => mockTotals(), [vaults]);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    void refreshBalances();
  }, [refreshBalances]);

  // Refresh vault list when component mounts
  useEffect(() => {
    setVaults(getVaults());
  }, []);

  const shortAddress = walletAddress
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : null;

  const cards = useMemo(
    () => [
      { label: "Total saved", value: fmtUsd(totals.totalSaved) },
      { label: "Yield this week", value: `+${fmtUsd(totals.yieldWeek)}` },
      { label: "Vaults", value: String(totals.vaultCount) },
    ],
    [totals],
  );

  const handleCopy = () => {
    if (!walletAddress) return;
    const text = walletAddress;
    const doFallbackCopy = () => {
      try {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.setAttribute("readonly", "true");
        ta.style.position = "absolute";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand("copy");
        document.body.removeChild(ta);
        return ok;
      } catch {
        return false;
      }
    };
    void (async () => {
      try {
        if (
          typeof navigator !== "undefined" &&
          navigator.clipboard &&
          typeof navigator.clipboard.writeText === "function"
        ) {
          await navigator.clipboard.writeText(text);
          setCopyStatus("Copied");
          return;
        }
        const ok = doFallbackCopy();
        setCopyStatus(ok ? "Copied" : "Copy failed");
      } catch {
        const ok = doFallbackCopy();
        setCopyStatus(ok ? "Copied" : "Copy failed");
      } finally {
        window.setTimeout(() => setCopyStatus(null), 1200);
      }
    })();
  };

  const handleDelete = (id: string, name: string) => {
    setDeleteError(null);
    const ok = deleteVault(id);
    if (ok) {
      setVaults(getVaults());
    } else {
      setDeleteError(
        `Cannot delete "${name}" — it has funds inside. Withdraw first.`,
      );
      setTimeout(() => setDeleteError(null), 4000);
    }
  };

  return (
    <ProtectedRoute>
      <MainShell>
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">

          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                My Vaults
              </h1>
              <p className="text-sm text-muted-foreground">
                Network: Sepolia · Primary token: {sepoliaTokens.STRK.symbol}
              </p>
              {shortAddress ? (
                <div className="mt-1 flex items-center gap-2">
                  <p className="truncate text-xs text-muted-foreground">
                    Wallet: {shortAddress}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopy}
                    className="h-8 px-2"
                    disabled={!walletAddress}
                    aria-label="Copy wallet address"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              ) : null}
              {copyStatus ? (
                <p className="mt-1 text-xs text-primary">{copyStatus}</p>
              ) : null}
              {balances ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  Balances: {Number(balances.usdc).toFixed(2)} USDC ·{" "}
                  {Number(balances.strk).toFixed(4)} STRK
                </p>
              ) : null}
            </div>

            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => void logoutAndClear()}
              >
                Disconnect
              </Button>
              {deployed === false ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => void deployAccount()}
                  disabled={loading}
                >
                  {loading ? "Deploying..." : "Deploy account"}
                </Button>
              ) : null}
              <Button size="sm" asChild>
                <Link href="vaults/create">
                  <Plus className="mr-1.5 h-4 w-4" />
                  New Vault
                </Link>
              </Button>
            </div>
          </div>

          {deployed === false ? (
            <Card className="mb-4 border-primary/25">
              <CardContent className="p-5 text-sm text-muted-foreground">
                <p>
                  Your demo wallet is not deployed yet. Click{" "}
                  <span className="font-medium text-foreground">
                    Deploy account
                  </span>{" "}
                  above. Deployment is sponsored (free) if paymaster is
                  configured, otherwise fund with Sepolia STRK first.
                </p>
                <div className="mt-3 flex flex-wrap gap-3">
                  <Link
                    className="text-primary underline underline-offset-4"
                    href="https://starknet-faucet.vercel.app/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Get STRK (Starknet faucet)
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {deployed === true ? (
            <div className="mb-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-400">
              Account deployed on Sepolia - Ready for deposits
            </div>
          ) : null}

          {deleteError ? (
            <div className="mb-4 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-2 text-sm text-rose-400">
              {deleteError}
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-3">
            {cards.map((card) => (
              <Card key={card.label}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">
                    {card.label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="font-display text-2xl font-semibold">
                    {card.value}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-6 grid gap-4">
            {vaults.map((vault) => {
              const progress = Math.min(
                100,
                Math.round((vault.savedUsdc / vault.goalUsdc) * 100),
              );
              const isNew = isNewVault(vault.createdAt);
              const hasFunds = vault.savedUsdc > 0 || vault.yieldUsdThisWeek > 0;

              return (
                <Card key={vault.id} className="border-border/70">
                  <CardContent className="flex items-center justify-between gap-3 p-5">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-display text-lg">{vault.name}</p>
                        {isNew ? (
                          <span className="rounded-full bg-primary/20 px-2 py-0.5 text-xs font-medium text-primary">
                            New
                          </span>
                        ) : null}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {vault.type} · {progress}% to goal ·{" "}
                        {fmtUsd(vault.savedUsdc)} / {fmtUsd(vault.goalUsdc)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {vault.dcaLabel}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {!hasFunds ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-rose-400"
                          title="Delete vault (empty vaults only)"
                          onClick={() => handleDelete(vault.id, vault.name)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      ) : null}
                      <Button asChild>
                        <Link href={`/vaults/${vault.id}`}>
                          Open
                          <ArrowUpRight className="ml-1 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card className="mt-6">
            <CardContent className="flex items-center gap-3 p-5 text-sm text-muted-foreground">
              <Wallet className="h-4 w-4 text-primary" />
              Transaction history with explorer links appears on each vault page.
            </CardContent>
          </Card>

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