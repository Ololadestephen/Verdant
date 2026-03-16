import { StarkSDK, ChainId } from "starkzap";
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

// Patch the internal provider used by the SDK 
// Note: StarkSDK.getProvider() returns a patched one already if we're careful, 
// but we re-patch to be sure of our Alchemy fix.
try {
  patchProvider(starkzap.getProvider());
} catch (e) {
  console.warn("Starkzap provider patch failed:", e);
}
