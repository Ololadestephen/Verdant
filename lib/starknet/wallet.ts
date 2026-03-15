"use client";

import { AccountInterface, Contract, RpcProvider, uint256 } from "starknet";

import { publicEnv } from "@/lib/public-env";

export type SupportedWallet = "argentX" | "braavos";

type WalletProvider = {
  enable: () => Promise<unknown>;
  isConnected: boolean;
  selectedAddress?: string;
  selectedAccount?: string;
  account?: AccountInterface & { address?: string };
};

type StarknetWindow = Window & {
  starknet_argentX?: WalletProvider;
  starknet_braavos?: WalletProvider;
  starknet?: WalletProvider;
};

const STAKE_ABI = [
  {
    type: "function",
    name: "stake",
    inputs: [{ name: "amount", type: "core::integer::u256" }],
    outputs: []
  }
] as const;

const NFT_ABI = [
  {
    type: "function",
    name: "mint_milestone",
    inputs: [
      { name: "to", type: "core::starknet::contract_address::ContractAddress" },
      { name: "milestone", type: "core::integer::u32" }
    ],
    outputs: [{ name: "token_id", type: "core::integer::u256" }]
  }
] as const;

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
  const enableResult = await provider.enable();
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
  const provider = getProvider(wallet);
  const account = provider?.account;
  if (!provider || !account) {
    throw new Error("Wallet not connected. Please reconnect your wallet and try again.");
  }

  const amountWei = uint256.bnToUint256(BigInt(Math.floor(amount * 1e18)));
  const contractAddress = publicEnv.NEXT_PUBLIC_STARKNET_STAKING_CONTRACT;

  // Build call directly without Contract.populate to avoid any serialisation issues
  const call = {
    contractAddress,
    entrypoint: "stake",
    calldata: [amountWei.low.toString(), amountWei.high.toString()]
  };

  let tx: { transaction_hash: string };
  try {
    tx = await account.execute(call);
  } catch (err: unknown) {
    // Wallet popup was dismissed or user rejected
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
  const provider = getProvider(wallet);
  const account = provider?.account;
  if (!provider || !account) {
    throw new Error("Wallet not connected.");
  }

  const contract = new Contract(NFT_ABI, publicEnv.NEXT_PUBLIC_STARKNET_NFT_CONTRACT, account);
  const call = await contract.populate("mint_milestone", {
    to: recipient,
    milestone
  });
  const tx = await account.execute(call);
  return tx.transaction_hash;
}
