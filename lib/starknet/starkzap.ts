import { StarkSDK, ChainId, type OnboardResult } from "starkzap";
import { publicEnv } from "@/lib/public-env";
import { patchProvider } from "./wallet";

const network = publicEnv.NEXT_PUBLIC_STARKNET_NETWORK as string;
const chainId = network === "mainnet" ? ChainId.MAINNET : ChainId.SEPOLIA;

// Use Cartridge RPC for the SDK if on Sepolia for better Social Login stability
const rpcUrl = network === "sepolia" 
  ? "https://api.cartridge.gg/x/starknet/sepolia"
  : publicEnv.NEXT_PUBLIC_STARKNET_RPC_URL;

export const starkzap = new StarkSDK({
  chainId,
  rpcUrl,
});

// Cache the onboarded wallet to avoid Redundant Controller Initialization errors
let onboardCache: OnboardResult | null = null;

export async function getOnboardedWallet() {
  if (onboardCache) return onboardCache;
  
  const { OnboardStrategy } = await import("starkzap");
  
  onboardCache = await starkzap.onboard({ 
    strategy: OnboardStrategy.Cartridge,
    cartridge: {
      policies: [{
        target: publicEnv.NEXT_PUBLIC_STARKNET_STAKING_CONTRACT,
        method: "stake"
      }]
    }
  });

  return onboardCache;
}

export function clearOnboardCache() {
  onboardCache = null;
}

// Patch the internal provider used by the SDK 
try {
  patchProvider(starkzap.getProvider());
} catch (e) {
  console.warn("Starkzap provider patch failed:", e);
}
