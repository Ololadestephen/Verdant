"use client";

import {
  createWalletClient,
  custom,
  createPublicClient,
  http,
  getAddress,
  type EIP1193Provider
} from "viem";
import { botChain } from "./config";

export interface EVMAccount {
  address: `0x${string}`;
}

export function getPublicClient() {
  return createPublicClient({
    chain: botChain,
    transport: http(botChain.rpcUrls.default.http[0])
  });
}

export function getEthereumProvider(): EIP1193Provider | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as unknown as { ethereum?: EIP1193Provider }).ethereum;
}

export async function ensureBotChainNetwork(provider: EIP1193Provider): Promise<void> {
  const chainIdHex = "0x" + botChain.id.toString(16);

  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: chainIdHex }]
    });
  } catch (switchError: unknown) {
    const err = switchError as { code?: number; message?: string };
    // 4902 indicates chain has not been added to wallet
    if (err?.code === 4902 || err?.message?.includes("Unrecognized chain ID")) {
      await provider.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: chainIdHex,
            chainName: botChain.name,
            nativeCurrency: botChain.nativeCurrency,
            rpcUrls: botChain.rpcUrls.default.http,
            blockExplorerUrls: [botChain.blockExplorers.default.url]
          }
        ]
      });
    } else {
      throw switchError;
    }
  }
}

export async function connectEVMWallet(): Promise<{ address: `0x${string}`; token: string }> {
  const provider = getEthereumProvider();
  if (!provider) {
    throw new Error("No EVM wallet detected. Please install MetaMask, Rabby, or another Ethereum-compatible wallet.");
  }

  // 1. Ensure network is BOT Chain
  await ensureBotChainNetwork(provider);

  // 2. Request accounts
  const client = createWalletClient({
    chain: botChain,
    transport: custom(provider)
  });

  const [rawAddress] = await client.requestAddresses();
  if (!rawAddress) {
    throw new Error("No accounts found in connected wallet.");
  }
  const address = getAddress(rawAddress);

  // 3. Request auth challenge from server
  const challengeRes = await fetch("/api/auth/challenge", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address })
  });

  if (!challengeRes.ok) {
    const err = await challengeRes.json().catch(() => ({ error: "Challenge failed" }));
    throw new Error(err.error || "Failed to obtain auth challenge from server.");
  }

  const { message } = await challengeRes.json();

  // 4. Prompt user to sign challenge message
  const signature = await client.signMessage({
    account: address,
    message
  });

  // 5. Verify signature server-side
  const verifyRes = await fetch("/api/auth/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, signature })
  });

  if (!verifyRes.ok) {
    const err = await verifyRes.json().catch(() => ({ error: "Verification failed" }));
    throw new Error(err.error || "Server signature verification failed.");
  }

  const data = await verifyRes.json();
  return { address, token: data.token };
}

// Contract ABI for checkIn and view functions
export const VERDANT_CHECKIN_ABI = [
  {
    type: "function",
    name: "checkIn",
    inputs: [
      {
        name: "claim",
        type: "tuple",
        components: [
          { name: "recipient", type: "address" },
          { name: "submissionRef", type: "bytes32" },
          { name: "utcDay", type: "uint256" },
          { name: "milestone", type: "uint256" },
          { name: "expiry", type: "uint256" },
          { name: "nonce", type: "bytes32" }
        ]
      },
      { name: "signature", type: "bytes" }
    ],
    outputs: [{ name: "awardedTokenId", type: "uint256" }],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "streak",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "lastCheckInUtcDay",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "totalCheckIns",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "hasMilestoneBadge",
    inputs: [
      { name: "account", type: "address" },
      { name: "milestone", type: "uint256" }
    ],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view"
  }
] as const;

export async function submitCheckInTransaction(params: {
  contractAddress: `0x${string}`;
  claim: {
    recipient: `0x${string}`;
    submissionRef: `0x${string}`;
    utcDay: string;
    milestone: string;
    expiry: string;
    nonce: `0x${string}`;
  };
  signature: `0x${string}`;
}): Promise<{ txHash: `0x${string}` }> {
  const provider = getEthereumProvider();
  if (!provider) {
    throw new Error("No EVM wallet detected.");
  }

  await ensureBotChainNetwork(provider);

  const client = createWalletClient({
    chain: botChain,
    transport: custom(provider)
  });

  const [account] = await client.requestAddresses();
  if (!account) throw new Error("No connected account.");

  const publicClient = getPublicClient();

  const txHash = await client.writeContract({
    account,
    address: params.contractAddress,
    abi: VERDANT_CHECKIN_ABI,
    functionName: "checkIn",
    args: [
      {
        recipient: params.claim.recipient,
        submissionRef: params.claim.submissionRef,
        utcDay: BigInt(params.claim.utcDay),
        milestone: BigInt(params.claim.milestone),
        expiry: BigInt(params.claim.expiry),
        nonce: params.claim.nonce
      },
      params.signature
    ]
  });

  // Wait for receipt
  await publicClient.waitForTransactionReceipt({ hash: txHash });

  return { txHash };
}
