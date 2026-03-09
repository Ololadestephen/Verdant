"use client";

import { useQuery } from "@tanstack/react-query";

import { useAppStore } from "@/hooks/use-app-store";

type NftRow = {
  milestone_day: number;
  token_id: string | null;
  mint_tx_hash: string | null;
  status: "pending" | "minted" | "failed";
};

export function useProfileNfts() {
  const walletAddress = useAppStore((state) => state.walletAddress);

  return useQuery({
    queryKey: ["profile-nfts", walletAddress],
    enabled: Boolean(walletAddress),
    queryFn: async () => {
      const response = await fetch(`/api/profile/nfts?walletAddress=${walletAddress}`, { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Failed to load NFTs.");
      }
      return response.json() as Promise<NftRow[]>;
    }
  });
}
