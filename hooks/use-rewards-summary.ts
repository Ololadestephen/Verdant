"use client";

import { useQuery } from "@tanstack/react-query";

import { useAppStore } from "@/hooks/use-app-store";

type RewardsSummary = {
  lifetime: number;
  last7Days: number;
  last30Days: number;
  approvedCount: number;
};

export function useRewardsSummary() {
  const walletAddress = useAppStore((state) => state.walletAddress);

  return useQuery({
    queryKey: ["rewards-summary", walletAddress],
    enabled: Boolean(walletAddress),
    queryFn: async () => {
      const response = await fetch(`/api/rewards/summary?walletAddress=${walletAddress}`, { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Failed to load rewards summary.");
      }
      return response.json() as Promise<RewardsSummary>;
    }
  });
}
