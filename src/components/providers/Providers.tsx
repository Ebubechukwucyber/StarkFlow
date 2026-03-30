"use client";

import { StarkflowProvider } from "@/components/providers/starkflow-provider";

type Props = { children: React.ReactNode };

export function Providers({ children }: Props) {
  return <StarkflowProvider>{children}</StarkflowProvider>;
}

