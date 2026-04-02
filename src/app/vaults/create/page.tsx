"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, CheckCircle } from "lucide-react";
import Link from "next/link";

import { MainShell } from "@/components/layout/main-shell";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { addVault, getVaults } from "@/lib/mock/vaults";

export default function NewVaultPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [type, setType] = useState<"personal" | "shared">("personal");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [createdName, setCreatedName] = useState("");

  const isDuplicate =
    name.trim().length > 0 &&
    getVaults().some(
      (v) => v.name.toLowerCase() === name.trim().toLowerCase(),
    );

  const handleCreate = () => {
    setError(null);
    const parsedGoal = parseFloat(goal);
    if (!name.trim()) {
      setError("Please enter a vault name.");
      return;
    }
    if (isDuplicate) {
      setError(`A vault named "${name.trim()}" already exists.`);
      return;
    }
    if (isNaN(parsedGoal) || parsedGoal <= 0) {
      setError("Please enter a valid goal amount.");
      return;
    }
    setSaving(true);
    try {
      const newVault = addVault({
        name: name.trim(),
        type,
        vaultAddress: `0x${Array.from(crypto.getRandomValues(new Uint8Array(31)))
  .map((b) => b.toString(16).padStart(2, "0"))
  .join("")}`,
        goalUsdc: parsedGoal,
        savedUsdc: 0,
        yieldUsdThisWeek: 0,
        dcaEnabled: false,
        dcaLabel: "Off · enable in vault",
        members: [{ id: "u1", display: "You", role: "owner" }],
      });
      setCreatedName(newVault.name);
      setSuccess(true);
      setTimeout(() => {
        router.push(`/vaults/${newVault.id}`);
      }, 2000);
    } catch {
      setError("Failed to create vault. Please try again.");
      setSaving(false);
    }
  };

  if (success) {
    return (
      <ProtectedRoute>
        <MainShell>
          <div className="mx-auto max-w-lg px-4 py-24 sm:px-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15">
              <CheckCircle className="h-8 w-8 text-emerald-400" />
            </div>
            <h2 className="font-display text-2xl font-semibold text-foreground">
              Vault created!
            </h2>
            <p className="mt-2 text-muted-foreground">
              <span className="font-medium text-foreground">{createdName}</span>{" "}
              is ready. Taking you there now...
            </p>
          </div>
        </MainShell>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <MainShell>
        <div className="mx-auto max-w-lg px-4 py-12 sm:px-6">
          <div className="mb-6 flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="mr-1 h-4 w-4" />
                Back
              </Link>
            </Button>
            <h1 className="font-display text-2xl font-semibold tracking-tight">
              Create a new vault
            </h1>
          </div>

          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg">Vault details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">

              <div>
                <label className="mb-1 block text-sm text-muted-foreground">
                  Vault name
                </label>
                <input
                  className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
                  placeholder="e.g. Emergency fund, Holiday trip..."
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setError(null);
                  }}
                />
                {isDuplicate ? (
                  <p className="mt-1 text-xs text-amber-400">
                    A vault with this name already exists.
                  </p>
                ) : null}
              </div>

              <div>
                <label className="mb-1 block text-sm text-muted-foreground">
                  Goal amount (STRK)
                </label>
                <input
                  className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
                  placeholder="e.g. 1000"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  inputMode="decimal"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-muted-foreground">
                  Vault type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={type === "personal" ? "default" : "secondary"}
                    onClick={() => setType("personal")}
                  >
                    Personal
                  </Button>
                  <Button
                    variant={type === "shared" ? "default" : "secondary"}
                    onClick={() => setType("shared")}
                  >
                    Shared
                  </Button>
                </div>
              </div>

              <div className="rounded-xl border border-border/60 bg-card/30 p-3">
                <p className="mb-2 text-xs font-medium text-muted-foreground">
                  Your existing vaults
                </p>
                {getVaults().length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No vaults yet.
                  </p>
                ) : (
                  <ul className="space-y-1">
                    {getVaults().map((v) => (
                      <li
                        key={v.id}
                        className="flex items-center justify-between text-xs text-muted-foreground"
                      >
                        <span>{v.name}</span>
                        <span className="text-primary">{v.type}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {error ? (
                <p className="text-sm text-rose-300">{error}</p>
              ) : null}

              <Button
                className="w-full"
                disabled={saving || isDuplicate}
                onClick={handleCreate}
              >
                {saving ? "Creating..." : "Create vault"}
              </Button>

            </CardContent>
          </Card>
        </div>
      </MainShell>
    </ProtectedRoute>
  );
}