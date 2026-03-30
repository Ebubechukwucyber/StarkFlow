"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Copy, Plus, Wallet } from "lucide-react";
import { sepoliaTokens } from "starkzap";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { MainShell } from "@/components/layout/main-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useStarkflow } from "@/hooks/use-starkflow";
import { MOCK_VAULTS, mockTotals } from "@/lib/mock/vaults";

function fmtUsd(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

export function DashboardView() {
  const { walletAddress, balances, deployed, deployAccount, refreshBalances, logoutAndClear } =
    useStarkflow();
  const totals = mockTotals();
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  useEffect(() => {
    void refreshBalances();
  }, [refreshBalances]);

  const shortAddress = walletAddress
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : null;
  const cards = useMemo(
    () => [
      { label: "Total saved", value: fmtUsd(totals.totalSaved) },
      { label: "Yield this week", value: `+${fmtUsd(totals.yieldWeek)}` },
      { label: "Vaults", value: String(totals.vaultCount) },
    ],
    [totals.totalSaved, totals.yieldWeek, totals.vaultCount],
  );

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
              Network: Sepolia · Primary token: {sepoliaTokens.USDC.symbol}
            </p>
            {shortAddress ? (
              <div className="mt-1 flex items-center gap-2">
                <p className="truncate text-xs text-muted-foreground">
                  Wallet: {shortAddress}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
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
                  }}
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
                {Number(balances.strk).toFixed(2)} STRK
              </p>
            ) : null}
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => void logoutAndClear()}>
              Disconnect
            </Button>
            {deployed === false ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => void deployAccount()}
                title="Deploy account contract (needs STRK unless paymastered)"
              >
                Deploy account
              </Button>
            ) : null}
            <Button size="sm" asChild>
              <Link href="/vaults/v1">
                <Plus className="mr-1.5 h-4 w-4" />
                Quick Deposit
              </Link>
            </Button>
          </div>
        </div>

        {deployed === false ? (
          <Card className="mb-4 border-primary/25">
            <CardContent className="p-5 text-sm text-muted-foreground">
              Your demo wallet isn’t deployed yet. To deploy, fund it with Sepolia STRK then click{" "}
              <span className="text-foreground">Deploy account</span>.
              <div className="mt-2 flex flex-wrap gap-3">
                <a
                  className="text-primary underline underline-offset-4"
                  href="https://starknet-faucet.vercel.app/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Get STRK (Starknet faucet)
                </a>
                <a
                  className="text-primary underline underline-offset-4"
                  href="https://faucet.circle.com/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Get USDC (Circle faucet)
                </a>
              </div>
            </CardContent>
          </Card>
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
                <p className="font-display text-2xl font-semibold">{card.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-6 grid gap-4">
          {MOCK_VAULTS.map((vault) => {
            const progress = Math.min(
              100,
              Math.round((vault.savedUsdc / vault.goalUsdc) * 100),
            );
            return (
              <Card key={vault.id} className="border-border/70">
                <CardContent className="flex items-center justify-between gap-3 p-5">
                  <div>
                    <p className="font-display text-lg">{vault.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {vault.type} · {progress}% to goal · {fmtUsd(vault.savedUsdc)} /{" "}
                      {fmtUsd(vault.goalUsdc)}
                    </p>
                    <p className="text-xs text-muted-foreground">{vault.dcaLabel}</p>
                  </div>
                  <Button asChild>
                    <Link href={`/vaults/${vault.id}`}>
                      Open
                      <ArrowUpRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
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
    </MainShell>
    </ProtectedRoute>
  );
}
