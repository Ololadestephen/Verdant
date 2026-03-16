import { StarkSDK } from "starkzap";
import { publicEnv } from "@/lib/public-env";
import { patchProvider } from "./wallet";

export const starkzap = new StarkSDK({
  network: publicEnv.NEXT_PUBLIC_STARKNET_NETWORK as "sepolia" | "mainnet",
  rpcUrl: publicEnv.NEXT_PUBLIC_STARKNET_RPC_URL,
});


// Patch the internal provider used by the SDK
patchProvider(starkzap.getProvider());

