"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";
import type { LeaderboardRow } from "@/types/domain";

const QUERY_KEY = ["leaderboard"];

async function fetchLeaderboard(): Promise<LeaderboardRow[]> {
  const response = await fetch("/api/leaderboard/live", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Failed to load leaderboard.");
  }
  return response.json() as Promise<LeaderboardRow[]>;
}

export function useLeaderboard() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchLeaderboard,
    staleTime: 15_000
  });

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("leaderboard:profiles")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => {
        void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return query;
}
