import { Account, RpcProvider } from "starknet";
import { serverEnv } from "@/lib/server-env";
import { publicEnv } from "@/lib/public-env";

export function getServerAdminAccount() {
  const address = serverEnv.STARKNET_ADMIN_ADDRESS;
  const privateKey = serverEnv.STARKNET_ADMIN_PRIVATE_KEY;

  if (!address || !privateKey) {
    throw new Error("STARKNET_ADMIN_ADDRESS or STARKNET_ADMIN_PRIVATE_KEY not configured on server.");
  }

  const provider = new RpcProvider({ nodeUrl: publicEnv.NEXT_PUBLIC_STARKNET_RPC_URL });
  return new Account(provider, address, privateKey);
}
