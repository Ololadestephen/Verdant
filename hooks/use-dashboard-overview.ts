"use client";

import { useQuery } from "@tanstack/react-query";

import { useAppStore } from "@/hooks/use-app-store";

type SessionHistoryRow = {
  id: string;
  stake_amount: number;
  status: "active" | "pending_verification" | "completed" | "failed" | "expired";
  started_at: string;
  completed_at: string | null;
  expires_at: string;
};

type SubmissionRow = {
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

type ActivityRow = {
  type: "session" | "submission" | "nft";
  at: string;
  message: string;
};

type DashboardOverview = {
  sessions: SessionHistoryRow[];
  submissions: SubmissionRow[];
  activity: ActivityRow[];
};

export function useDashboardOverview() {
  const walletAddress = useAppStore((state) => state.walletAddress);

  return useQuery({
    queryKey: ["dashboard-overview", walletAddress],
    enabled: Boolean(walletAddress),
    queryFn: async () => {
      const response = await fetch(`/api/dashboard/overview?walletAddress=${walletAddress}`, { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Failed to load dashboard overview.");
      }
      return response.json() as Promise<DashboardOverview>;
    }
  });
}
