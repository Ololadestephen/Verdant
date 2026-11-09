import { useQuery } from "@tanstack/react-query";
import { formatEther } from "viem";
import { useAppStore } from "@/hooks/use-app-store";
import { getPublicClient } from "@/lib/evm/wallet";

export function useWalletBalance() {
  const { walletAddress } = useAppStore();

  return useQuery({
    queryKey: ["wallet-balance", walletAddress],
    enabled: Boolean(walletAddress && walletAddress.startsWith("0x")),
    queryFn: async () => {
      if (!walletAddress || !walletAddress.startsWith("0x")) return null;

      try {
        const publicClient = getPublicClient();
        const balanceWei = await publicClient.getBalance({
          address: walletAddress as `0x${string}`
        });

        const formattedEther = formatEther(balanceWei);
        const num = parseFloat(formattedEther);

        return {
          formatted: `${num.toFixed(4)} BOT`,
          value: balanceWei.toString(),
          symbol: "BOT"
        };
      } catch (err) {
        console.warn("Failed to query BOT balance:", err);
        return null;
      }
    },
    refetchInterval: 15000 // Every 15 seconds
  });
}
