import { notFound } from "next/navigation";

import { VaultDetail } from "@/components/vault/vault-detail";
import { getVaultById } from "@/lib/mock/vaults";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function VaultPage({ params }: Props) {
  const { id } = await params;
  const vault = getVaultById(id);
  if (!vault) {
    notFound();
  }

  return <VaultDetail vault={vault} />;
}
