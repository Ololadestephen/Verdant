"use client";

import { Account, RpcProvider, uint256 } from "starknet";
import type { AccountInterface } from "starknet";

import { publicEnv } from "@/lib/public-env";

export type SupportedWallet = "argentX" | "braavos";

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

export function getReadProvider(): RpcProvider {
  return new RpcProvider({ nodeUrl: publicEnv.NEXT_PUBLIC_STARKNET_RPC_URL });
}

export async function submitStake(amount: number, wallet: SupportedWallet): Promise<string> {
  const walletProvider = getProvider(wallet);
  if (!walletProvider) {
    throw new Error("Wallet not connected. Please reconnect your wallet and try again.");
  }

  // Re-enable to ensure we have a fresh account reference
  await walletProvider.enable({ starknetVersion: "v5" }).catch(() => null);

  const walletAccount = walletProvider.account;
  const address = walletProvider.selectedAddress ?? walletProvider.account?.address;

  if (!walletAccount || !address) {
    throw new Error("Wallet not connected. Please reconnect your wallet and try again.");
  }

  const amountWei = uint256.bnToUint256(BigInt(Math.floor(amount * 1e18)));
  const contractAddress = publicEnv.NEXT_PUBLIC_STARKNET_STAKING_CONTRACT;

  // Build call with proper calldata encoding for u256
  const call = {
    contractAddress,
    entrypoint: "stake",
    calldata: [amountWei.low.toString(), amountWei.high.toString()]
  };

  let tx: { transaction_hash: string };
  try {
    // Pass explicit maxFee so Braavos skips internal fee estimation.
    // Braavos shows "Missing RPC node for sepolia-alpha" when it tries to estimate fees internally.
    // 0.001 STRK (1e15 wei) is a safe upper bound for Sepolia staking transactions.
    const maxFee = BigInt("1000000000000000"); // 0.001 STRK in wei
    tx = await walletAccount.execute(call, undefined, { maxFee });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (
      message.toLowerCase().includes("user abort") ||
      message.toLowerCase().includes("user rejected") ||
      message.toLowerCase().includes("cancelled") ||
      message.toLowerCase().includes("denied")
    ) {
      throw new Error("Transaction was rejected. Please try again and approve in your wallet.");
    }
    throw new Error(`Transaction failed: ${message}`);
  }

  if (!tx?.transaction_hash) {
    throw new Error("No transaction hash returned from wallet.");
  }

  return tx.transaction_hash;
}

export async function mintMilestoneNft(recipient: string, milestone: number, wallet: SupportedWallet): Promise<string> {
  const walletProvider = getProvider(wallet);
  const account = walletProvider?.account;
  if (!walletProvider || !account) {
    throw new Error("Wallet not connected.");
  }

  const rpcProvider = getReadProvider();
  const address = walletProvider.selectedAddress ?? account.address;
  if (!address) throw new Error("Wallet address unavailable.");

  const connectedAccount = new Account(rpcProvider, address, account as unknown as string);
  const calldata = [recipient, milestone.toString(), "0"];
  const tx = await connectedAccount.execute({
    contractAddress: publicEnv.NEXT_PUBLIC_STARKNET_NFT_CONTRACT,
    entrypoint: "mint_milestone",
    calldata
  });
  return tx.transaction_hash;
}

