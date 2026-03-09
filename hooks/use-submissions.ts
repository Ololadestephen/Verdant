"use client";

import { useQuery } from "@tanstack/react-query";

import { useAppStore } from "@/hooks/use-app-store";

export type SubmissionListItem = {
  id: string;
  image_path: string;
  captured_at: string;
  submitted_at: string;
  ai_confidence: number | null;
  ai_labels: string[];
  verification_status: "pending" | "approved" | "rejected";
  rejection_reason: string | null;
  reward_amount: number;
};

export function useSubmissions() {
  const walletAddress = useAppStore((state) => state.walletAddress);

  return useQuery({
    queryKey: ["submissions", walletAddress],
    enabled: Boolean(walletAddress),
    queryFn: async () => {
      const response = await fetch(`/api/submissions/list?walletAddress=${walletAddress}`, { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Failed to load submissions.");
      }
      return response.json() as Promise<SubmissionListItem[]>;
    }
  });
}
