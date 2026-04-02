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
  createdAt: number;
  members: { id: string; display: string; role: "owner" | "member" }[];
};

const DEFAULT_VAULTS: MockVault[] = [
  {
    id: "v1",
    name: "Emergency fund",
    type: "personal",
    vaultAddress: "0x049124b7f2c915f72093324ccfe3e8b5eb50d50f66fe64f4b7d09f6af35fa120",
    goalUsdc: 10_000,
    savedUsdc: 0,
    yieldUsdThisWeek: 0,
    dcaEnabled: true,
    dcaLabel: "100 STRK / week · Ekubo",
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
    members: [{ id: "u1", display: "You", role: "owner" }],
  },
  {
    id: "v2",
    name: "NYC trip",
    type: "shared",
    vaultAddress: "0x01ad3ca0b5bb8cd33d2de9c1908f5f7e79ec15f7866506c3d4c07ef710b53391",
    goalUsdc: 3_500,
    savedUsdc: 0,
    yieldUsdThisWeek: 0,
    dcaEnabled: false,
    dcaLabel: "Off · enable in vault",
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 7,
    members: [
      { id: "u1", display: "You", role: "owner" },
      { id: "u2", display: "Sam", role: "member" },
      { id: "u3", display: "Jordan", role: "member" },
    ],
  },
];

const LS_KEY = "starkflow_vaults";

function loadVaults(): MockVault[] {
  if (typeof window === "undefined") return DEFAULT_VAULTS;
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) {
      localStorage.setItem(LS_KEY, JSON.stringify(DEFAULT_VAULTS));
      return DEFAULT_VAULTS;
    }
    return JSON.parse(raw) as MockVault[];
  } catch {
    return DEFAULT_VAULTS;
  }
}

function saveVaults(vaults: MockVault[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LS_KEY, JSON.stringify(vaults));
}

export function getVaults(): MockVault[] {
  return loadVaults();
}

export function getVaultById(id: string): MockVault | null {
  return loadVaults().find((v) => v.id === id) ?? null;
}

export function addVault(vault: Omit<MockVault, "id" | "createdAt">): MockVault {
  const vaults = loadVaults();
  const id = `v${Date.now()}`;
  const newVault: MockVault = { ...vault, id, createdAt: Date.now() };
  saveVaults([newVault, ...vaults]);
  return newVault;
}

export function deleteVault(id: string): boolean {
  const vaults = loadVaults();
  const vault = vaults.find((v) => v.id === id);
  if (!vault) return false;
  // Block delete if any funds — check both savedUsdc and yieldUsdThisWeek
  if (vault.savedUsdc > 0 || vault.yieldUsdThisWeek > 0) return false;
  saveVaults(vaults.filter((v) => v.id !== id));
  return true;
}

export function updateVaultSaved(id: string, addAmount: number): void {
  const vaults = loadVaults();
  saveVaults(
    vaults.map((v) =>
      v.id === id
        ? {
            ...v,
            savedUsdc: v.savedUsdc + addAmount,
            yieldUsdThisWeek: parseFloat(
              (v.yieldUsdThisWeek + addAmount * 0.002).toFixed(2),
            ),
          }
        : v,
    ),
  );
}

export function mockTotals() {
  const vaults = getVaults();
  const totalSaved = vaults.reduce((s, v) => s + v.savedUsdc, 0);
  const yieldWeek = vaults.reduce((s, v) => s + v.yieldUsdThisWeek, 0);
  return { totalSaved, yieldWeek, vaultCount: vaults.length };
}

export function vaultYieldSeries(id: string) {
  const vault = getVaultById(id);
  const baseline = vault ? Math.max(10, vault.savedUsdc * 0.01) : 10;
  return [
    { day: "Mon", value: parseFloat((baseline + 1).toFixed(2)) },
    { day: "Tue", value: parseFloat((baseline + 2.5).toFixed(2)) },
    { day: "Wed", value: parseFloat((baseline + 3.2).toFixed(2)) },
    { day: "Thu", value: parseFloat((baseline + 4.1).toFixed(2)) },
    { day: "Fri", value: parseFloat((baseline + 5.5).toFixed(2)) },
    { day: "Sat", value: parseFloat((baseline + 6.3).toFixed(2)) },
    { day: "Sun", value: parseFloat((baseline + 7.9).toFixed(2)) },
  ];
}

export const MOCK_VAULTS = DEFAULT_VAULTS;