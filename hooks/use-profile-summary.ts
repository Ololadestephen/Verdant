"use client";

import { useQuery } from "@tanstack/react-query";

import { useAppStore } from "@/hooks/use-app-store";
import type { ProfileRow } from "@/types/domain";

type SummaryResponse = {
  profile: ProfileRow;
  rank: number | null;
  activeSession: {
    id: string;
    status: string;
    started_at: string;
    expires_at: string;
  } | null;
  dailySubmissionCount: number;
};


export function useProfileSummary() {
  const walletAddress = useAppStore((state) => state.walletAddress);

  return useQuery({
    queryKey: ["profile-summary", walletAddress],
    enabled: Boolean(walletAddress),
    queryFn: async () => {
      const response = await fetch(`/api/profile/summary?walletAddress=${walletAddress}`, { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Failed to load profile summary.");
      }
      return response.json() as Promise<SummaryResponse>;
    },
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
  });
}
