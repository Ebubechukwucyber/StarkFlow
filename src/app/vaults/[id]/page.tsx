"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { VaultDetail } from "@/components/vault/vault-detail";
import { getVaultById } from "@/lib/mock/vaults";
import type { MockVault } from "@/lib/mock/vaults";

export default function VaultPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const [vault, setVault] = useState<MockVault | null | undefined>(undefined);

  useEffect(() => {
    const found = getVaultById(id);
    setVault(found);
  }, [id]);

  if (vault === undefined) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted-foreground">
        Loading vault...
      </div>
    );
  }

  if (vault === null) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted-foreground">
        Vault not found.
      </div>
    );
  }

  return <VaultDetail vault={vault} />;
}