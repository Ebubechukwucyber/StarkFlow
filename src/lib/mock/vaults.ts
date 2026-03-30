/** Demo data — replace with `wallet.balanceOf(sepoliaTokens.USDC)` and indexer reads. */

export type VaultType = "personal" | "shared";

export type MockVault = {
  id: string;
  name: string;
  type: VaultType;
  vaultAddress: string;
  goalUsdc: number;
  savedUsdc: number;
  yieldUsdThisWeek: number;
  dcaEnabled: boolean;
  dcaLabel: string;
  members: { id: string; display: string; role: "owner" | "member" }[];
};

export const MOCK_VAULTS: MockVault[] = [
  {
    id: "v1",
    name: "Emergency fund",
    type: "personal",
    vaultAddress: "0x049124b7f2c915f72093324ccfe3e8b5eb50d50f66fe64f4b7d09f6af35fa120",
    goalUsdc: 10_000,
    savedUsdc: 4_250,
    yieldUsdThisWeek: 12.4,
    dcaEnabled: true,
    dcaLabel: "100 USDC / week · Ekubo",
    members: [{ id: "u1", display: "You", role: "owner" }],
  },
  {
    id: "v2",
    name: "NYC trip",
    type: "shared",
    vaultAddress: "0x01ad3ca0b5bb8cd33d2de9c1908f5f7e79ec15f7866506c3d4c07ef710b53391",
    goalUsdc: 3_500,
    savedUsdc: 1_890,
    yieldUsdThisWeek: 6.85,
    dcaEnabled: false,
    dcaLabel: "Off · enable in vault",
    members: [
      { id: "u1", display: "You", role: "owner" },
      { id: "u2", display: "Sam", role: "member" },
      { id: "u3", display: "Jordan", role: "member" },
    ],
  },
];

export function mockTotals() {
  const totalSaved = MOCK_VAULTS.reduce((s, v) => s + v.savedUsdc, 0);
  const yieldWeek = MOCK_VAULTS.reduce((s, v) => s + v.yieldUsdThisWeek, 0);
  return { totalSaved, yieldWeek, vaultCount: MOCK_VAULTS.length };
}

export function getVaultById(id: string) {
  return MOCK_VAULTS.find((vault) => vault.id === id) ?? null;
}

export function vaultYieldSeries(id: string) {
  const baseline = id === "v2" ? 34 : 58;
  return [
    { day: "Mon", value: baseline + 1 },
    { day: "Tue", value: baseline + 2.5 },
    { day: "Wed", value: baseline + 3.2 },
    { day: "Thu", value: baseline + 4.1 },
    { day: "Fri", value: baseline + 5.5 },
    { day: "Sat", value: baseline + 6.3 },
    { day: "Sun", value: baseline + 7.9 },
  ];
}
