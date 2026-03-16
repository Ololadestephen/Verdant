import { useQuery } from "@tanstack/react-query";
import { useAppStore } from "@/hooks/use-app-store";

export function useWalletBalance() {
  const { walletAddress, walletType } = useAppStore();

  return useQuery({
    queryKey: ["wallet-balance", walletAddress, walletType],
    enabled: Boolean(walletAddress && walletType === "cartridge"),
    queryFn: async () => {
      const { starkzap } = await import("@/lib/starknet/starkzap");
      const { OnboardStrategy, sepoliaTokens } = await import("starkzap");
      
      const result = await starkzap.onboard({ strategy: OnboardStrategy.Cartridge });
      const balance = await result.wallet.balanceOf(sepoliaTokens.STRK);
      
      return {
        formatted: balance.toFormatted(),
        value: balance.toBase().toString(),
        symbol: "STRK"
      };

    },
    refetchInterval: 30000, // Every 30 seconds
  });
}
