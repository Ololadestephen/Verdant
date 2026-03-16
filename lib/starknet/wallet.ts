"use client";

import { RpcProvider, uint256 } from "starknet";
import type { AccountInterface } from "starknet";

import { publicEnv } from "@/lib/public-env";

export type SupportedWallet = "argentX" | "braavos" | "cartridge";

type WalletProvider = {
  enable: (options?: { starknetVersion?: string }) => Promise<string[]>;
  isConnected: boolean;
  selectedAddress?: string;
  selectedAccount?: string;
  account?: AccountInterface & { address?: string };
  provider?: { chainId?: string };
};

type StarknetWindow = Window & {
  starknet_argentX?: WalletProvider;
  starknet_braavos?: WalletProvider;
  starknet?: WalletProvider;
};


function getProvider(name: SupportedWallet): WalletProvider | undefined {
  if (typeof window === "undefined") return undefined;
  const typedWindow = window as StarknetWindow;
  if (name === "argentX") {
    return typedWindow.starknet_argentX ?? typedWindow.starknet;
  }
  return typedWindow.starknet_braavos ?? typedWindow.starknet;
}

function resolveAddress(provider: WalletProvider, enableResult: unknown): string | undefined {
  if (provider.selectedAddress) return provider.selectedAddress;
  if (provider.selectedAccount) return provider.selectedAccount;
  if (provider.account?.address) return provider.account.address;

  if (typeof enableResult === "string") return enableResult;
  if (Array.isArray(enableResult) && typeof enableResult[0] === "string") return enableResult[0];
  if (enableResult && typeof enableResult === "object") {
    const obj = enableResult as Record<string, unknown>;
    const direct = obj.selectedAddress ?? obj.selectedAccount ?? obj.address;
    if (typeof direct === "string") return direct;
    if (obj.account && typeof obj.account === "object") {
      const accountAddress = (obj.account as { address?: unknown }).address;
      if (typeof accountAddress === "string") return accountAddress;
    }
  }

  return undefined;
}

export async function connectWallet(name: SupportedWallet): Promise<{ address: string; wallet: SupportedWallet }> {
  const provider = getProvider(name);
  if (!provider) {
    throw new Error(`${name} wallet extension is unavailable.`);
  }
  // Pass starknetVersion to ensure Braavos uses the correct network/RPC
  const enableResult = await provider.enable({ starknetVersion: "v5" });
  const address = resolveAddress(provider, enableResult);
  if (!address) {
    throw new Error(`Unable to read ${name} wallet address.`);
  }
  return { address: address.toLowerCase(), wallet: name };
}

// --- Global RPC Compatibility Fix for Alchemy ---
// Alchemy does not support block_id: "pending" for several RPC methods.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
if (typeof window !== "undefined" && !(window as any).__rpcInterceptorInstalled) {
  const originalFetch = window.fetch;
  window.fetch = async function (input: RequestInfo | URL, init?: RequestInit) {
    const isPost = init?.method === "POST";
    
    if (!isPost || !init?.body) return originalFetch(input, init);

    // Filter for JSON-RPC requests
    const bodyStr = typeof init.body === "string" ? init.body : "";
    if (!bodyStr.includes("jsonrpc")) return originalFetch(input, init);

    try {
      const response = await originalFetch(input, init);
      if (!response.ok) return response;
      
      const clonedResponse = response.clone();
      const result = await clonedResponse.json().catch(() => null);
      
      if (result?.error) {
        const message = (result.error.message || "").toLowerCase();
        const code = result.error.code;
        const isAlchemyError = message.includes("invalid block id") || message.includes("invalid params") || code === -32602 || code === -32600;
        
        if (isAlchemyError && bodyStr.includes('"pending"')) {
          console.warn(`[Alchemy-Fix] Caught ${result.error.message}. Retrying with "latest"...`);
          const newBody = bodyStr.replace(/"pending"/g, '"latest"');
          return originalFetch(input, { ...init, body: newBody });
        }
      }
      
      return response;
    } catch {
      return originalFetch(input, init);
    }
  };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).__rpcInterceptorInstalled = true;
    console.log("[Alchemy-Fix] Global Network Interceptor Active");
}


/** 
 * No-op helper for backwards compatibility in other modules. 
 * The fetch interceptor handles everything now.
 */
export function patchProvider<T>(provider: T): T {
  return provider;
}

export function getReadProvider(): RpcProvider {
  return new RpcProvider({ nodeUrl: publicEnv.NEXT_PUBLIC_STARKNET_RPC_URL });
}






export async function submitStake(amount: number, wallet: SupportedWallet): Promise<string> {
  const amountWei = uint256.bnToUint256(BigInt(Math.floor(amount * 1e18)));
  const contractAddress = publicEnv.NEXT_PUBLIC_STARKNET_STAKING_CONTRACT;

  if (wallet === "cartridge") {
    const { getOnboardedWallet } = await import("@/lib/starknet/starkzap");
    const result = await getOnboardedWallet();
    
    // Defensive patch for Cartridge/SDK internal provider
    patchProvider(result.wallet.getProvider());

    const tx = await result.wallet.execute([
      {
        contractAddress,
        entrypoint: "stake",
        calldata: [amountWei.low.toString(), amountWei.high.toString()],
      },
    ], { feeMode: "sponsored" });

    return tx.hash;
  } else {
    // For extension wallets, we use their native account implementation directly
    const walletProvider = getProvider(wallet);
    if (!walletProvider || !walletProvider.account) {
      throw new Error(`Wallet ${wallet} not connected.`);
    }

    const { transaction_hash } = await walletProvider.account.execute([
      {
        contractAddress,
        entrypoint: "stake",
        calldata: [amountWei.low.toString(), amountWei.high.toString()],
      },
    ]);
    return transaction_hash;
  }
}










