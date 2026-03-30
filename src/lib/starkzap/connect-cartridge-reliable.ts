"use client";

import { RpcProvider } from "starknet";
import {
  CartridgeWallet,
  type CartridgeWalletOptions,
} from "starkzap/cartridge";
import {
  fromAddress,
  getChainId,
  getStakingPreset,
  sepolia,
  type CartridgeWalletInterface,
} from "starkzap";

/**
 * StarkZap's Cartridge integration only waits 10s for `controller.isReady()`.
 * The keychain iframe often needs longer; Cartridge's own `connect()` uses up to 50s.
 * This mirrors `CartridgeWallet.create` with a longer wait and dev-friendly options.
 */
const MAX_CONTROLLER_WAIT_MS = 55_000;
const INITIAL_POLL_MS = 100;
const MAX_POLL_MS = 1000;

function assertHttpUrl(url: string, label: string): string {
  const u = new URL(url);
  if (u.protocol !== "http:" && u.protocol !== "https:") {
    throw new Error(`${label} must be an http(s) URL`);
  }
  return u.toString();
}

function isCartridgeWalletAccount(value: unknown): value is {
  address: string;
  execute: (...args: unknown[]) => unknown;
  executePaymasterTransaction: (...args: unknown[]) => unknown;
  signMessage: (...args: unknown[]) => unknown;
  simulateTransaction: (...args: unknown[]) => unknown;
  estimateInvokeFee: (...args: unknown[]) => unknown;
} {
  if (!value || typeof value !== "object") return false;
  const a = value as Record<string, unknown>;
  return (
    typeof a.address === "string" &&
    typeof a.execute === "function" &&
    typeof a.executePaymasterTransaction === "function" &&
    typeof a.signMessage === "function" &&
    typeof a.simulateTransaction === "function" &&
    typeof a.estimateInvokeFee === "function"
  );
}

async function loadCartridgeControllerModule() {
  try {
    return await import("@cartridge/controller");
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(
      `Cartridge requires '@cartridge/controller'. ${msg}`,
    );
  }
}

/**
 * Connect Cartridge Controller for the same network as {@link sepolia} preset.
 */
export async function connectCartridgeReliable(
  overrides: Partial<CartridgeWalletOptions> = {},
): Promise<CartridgeWalletInterface> {
  const { default: Controller, toSessionPolicies } =
    await loadCartridgeControllerModule();

  const chainId = sepolia.chainId;
  const rpcUrl = assertHttpUrl(sepolia.rpcUrl, "Cartridge RPC URL");
  const staking = getStakingPreset(chainId);

  const options: CartridgeWalletOptions = {
    rpcUrl,
    chainId,
    explorer: { baseUrl: sepolia.explorerUrl },
    feeMode: "sponsored",
    ...overrides,
  };

  const controllerOptions: Record<string, unknown> = {
    defaultChainId: chainId.toFelt252(),
    chains: [{ rpcUrl }],
  };

  if (options.policies?.length) {
    controllerOptions.policies = toSessionPolicies(options.policies);
  }
  const preset = process.env.NEXT_PUBLIC_CARTRIDGE_PRESET?.trim();
  if (preset) {
    controllerOptions.preset = preset;
  }
  if (options.preset) {
    controllerOptions.preset = options.preset;
  }
  if (options.url) {
    controllerOptions.url = assertHttpUrl(options.url, "Cartridge controller URL");
  }

  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") {
      controllerOptions.webauthnPopup = true;
    }
  }

  const controller = new Controller(
    controllerOptions as ConstructorParameters<typeof Controller>[0],
  );

  let waited = 0;
  let poll = INITIAL_POLL_MS;
  while (!controller.isReady() && waited < MAX_CONTROLLER_WAIT_MS) {
    const step = Math.min(poll, MAX_CONTROLLER_WAIT_MS - waited);
    await new Promise((r) => setTimeout(r, step));
    waited += step;
    poll = Math.min(poll * 2, MAX_POLL_MS);
  }

  if (!controller.isReady()) {
    throw new Error(
      "Cartridge Controller did not become ready in time. Allow third-party cookies / popups, disable blockers, or try again.",
    );
  }

  const connectedAccount = await controller.connect();
  if (!isCartridgeWalletAccount(connectedAccount)) {
    throw new Error(
      "Cartridge connection failed. Allow popups and complete the login window.",
    );
  }

  const nodeUrl = assertHttpUrl(
    options.rpcUrl ?? controller.rpcUrl(),
    "Cartridge RPC URL",
  );
  const provider = new RpcProvider({ nodeUrl });
  let classHash = "0x0";
  try {
    classHash = await provider.getClassHashAt(
      fromAddress(connectedAccount.address),
    );
  } catch {
    /* undeployed */
  }
  const resolvedChainId = options.chainId ?? (await getChainId(provider));

  const WalletCtor = CartridgeWallet as unknown as new (
    ...args: [
      unknown,
      unknown,
      RpcProvider,
      import("starkzap").ChainId,
      string,
      import("starkzap").StakingConfig,
      import("starkzap").BridgingConfig | undefined,
      CartridgeWalletOptions,
    ]
  ) => CartridgeWalletInterface;

  return new WalletCtor(
    controller,
    connectedAccount,
    provider,
    resolvedChainId,
    classHash,
    staking,
    undefined,
    options,
  );
}
