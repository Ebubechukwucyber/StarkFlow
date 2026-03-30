"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useStarkflow } from "@/hooks/use-starkflow";

type Props = {
  children: React.ReactNode;
};

export function ProtectedRoute({ children }: Props) {
  const router = useRouter();
  const { ready, loading, walletAddress } = useStarkflow();

  useEffect(() => {
    if (ready && !loading && !walletAddress) {
      router.replace("/");
    }
  }, [ready, loading, walletAddress, router]);

  if (!ready || loading || !walletAddress) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted-foreground">
        Loading secured workspace...
      </div>
    );
  }

  return <>{children}</>;
}
