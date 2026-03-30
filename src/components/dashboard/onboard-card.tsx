"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Key, Sparkles, Wand2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useStarkflow } from "@/hooks/use-starkflow";

export function OnboardCard() {
  const router = useRouter();
  const { walletAddress, loading, error, onboardWithSigner } = useStarkflow();

  const [privateKey, setPrivateKey] = useState<string>("");

  const demoKeyLabel = useMemo(() => {
    if (!privateKey) return "Demo private key";
    return `Demo key: ${privateKey.slice(0, 6)}...${privateKey.slice(-4)}`;
  }, [privateKey]);

  useEffect(() => {
    if (walletAddress) {
      router.push("/dashboard");
    }
  }, [router, walletAddress]);

  useEffect(() => {
    // Optional: auto-load a previously generated demo key.
    if (typeof window === "undefined") return;
    const existing = localStorage.getItem("starkflow_demo_private_key");
    if (existing && typeof existing === "string") {
      setPrivateKey(existing);
    }
  }, []);

  const generatePrivateKey = () => {
    // Starknet elliptic curve order (must satisfy 1 <= k < n)
    const STARK_CURVE_N =
      3618502788666131213697322783095070105526743751716087489154079457884512865583n;
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    let raw = 0n;
    for (const b of bytes) raw = (raw << 8n) + BigInt(b);
    const k = (raw % (STARK_CURVE_N - 1n)) + 1n;
    const pk = `0x${k.toString(16)}`;
    setPrivateKey(pk);
    localStorage.setItem("starkflow_demo_private_key", pk);
  };

  const onUseSigner = () => {
    if (!privateKey) return;
    void onboardWithSigner(privateKey).then((ok) => {
      if (ok) router.push("/dashboard");
    });
  };

  return (
    <Card className="border-primary/20 shadow-glow-sm">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          <Sparkles className="h-7 w-7" aria-hidden />
        </div>
        <CardTitle className="font-display text-2xl">Connect to Starkflow</CardTitle>
        <CardDescription className="text-base">
          Demo onboarding using StarkSigner (Sepolia only). This is for hackathon
          demos — do not use on mainnet.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 pb-8">
        <div className="mt-2 rounded-xl border border-border/60 bg-card/30 p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Key className="h-4 w-4 text-primary" aria-hidden />
            Demo StarkSigner (testnet)
          </div>

          <p className="mt-2 text-xs text-muted-foreground">
            This uses a locally generated demo private key for Sepolia only.
            The key is stored in your browser localStorage.
          </p>

          <label className="mt-3 block text-xs text-muted-foreground">
            Private key (0x...)
          </label>
          <input
            className="mt-1 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
            value={privateKey}
            onChange={(e) => setPrivateKey(e.target.value)}
            placeholder="0x..."
            spellCheck={false}
            autoCapitalize="off"
          />

          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button
              variant="secondary"
              onClick={generatePrivateKey}
              disabled={loading}
            >
              <Wand2 className="mr-1.5 h-4 w-4" />
              Generate
            </Button>
            <Button onClick={onUseSigner} disabled={loading || !privateKey}>
              Use key
            </Button>
          </div>

          <p className="mt-2 text-xs text-muted-foreground">{demoKeyLabel}</p>
        </div>

        {error ? <p className="text-xs text-rose-300">{error}</p> : null}
        <Button variant="ghost" size="sm" asChild>
          <Link href="/">Back to home</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
