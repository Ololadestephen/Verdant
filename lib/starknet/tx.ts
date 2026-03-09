import { RpcProvider } from "starknet";

import { publicEnv } from "@/lib/public-env";

export async function waitForTransaction(txHash: string, timeoutMs = 120_000): Promise<void> {
  const provider = new RpcProvider({ nodeUrl: publicEnv.NEXT_PUBLIC_STARKNET_RPC_URL });
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    const receipt = await provider.getTransactionReceipt(txHash).catch(() => null);
    if (receipt && "finality_status" in receipt && (receipt.finality_status === "ACCEPTED_ON_L2" || receipt.finality_status === "ACCEPTED_ON_L1")) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 3_000));
  }

  throw new Error("Transaction confirmation timed out.");
}
