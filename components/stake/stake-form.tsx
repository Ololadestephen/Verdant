"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck, ArrowUpRight, Loader2, Compass } from "lucide-react";
import { toast } from "sonner";
import { useEffect } from "react";

import { useAppStore } from "@/hooks/use-app-store";
import { useProfileSummary } from "@/hooks/use-profile-summary";

export function StakeForm() {
  const { walletAddress, activeSessionId, setActiveSessionId } = useAppStore();
  const { data, isFetched } = useProfileSummary();
  const queryClient = useQueryClient();

  const startSession = useMutation({
    mutationFn: async () => {
      if (!walletAddress) {
        throw new Error("Connect your EVM wallet first.");
      }

      toast.info("Starting outdoor check-in session...");

      const response = await fetch("/api/session/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress,
          stakeAmount: 0,
          stakeTxHash: "bot_checkin"
        })
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: "Failed to start session" }));
        throw new Error(err.error || "Unable to start session.");
      }

      return response.json() as Promise<{ sessionId: string }>;
    },
    onSuccess: (responseData) => {
      setActiveSessionId(responseData.sessionId);
      queryClient.invalidateQueries({ queryKey: ["profile-summary", walletAddress] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-overview", walletAddress] });
      toast.success("Outdoor session started! Capture your photo. 🌿");
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const isServerActive = Boolean(data?.activeSession?.id);
  const isCheckingSession = !isFetched && !!activeSessionId;
  const isSessionActive = isFetched ? isServerActive : !!activeSessionId;

  // Clear local state if the server confirms no active session
  useEffect(() => {
    if (isFetched && !isServerActive && activeSessionId) {
      setActiveSessionId(null);
    }
  }, [isFetched, isServerActive, activeSessionId, setActiveSessionId]);

  return (
    <section className="tg-card relative overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold">Initiate Session</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Free daily outdoor check-ins on BOT Chain.
          </p>
        </div>
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Compass className="h-6 w-6 text-primary" />
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-2xl border border-border bg-white/5 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground">Session Status</span>
            {isSessionActive ? (
              <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                Active Session
              </span>
            ) : (
              <span className="rounded-full bg-secondary/50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Idle
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {isSessionActive
              ? "Your session is live. Proceed below to capture your outdoor photo proof and submit for verification."
              : "No staking required. Start a daily check-in session to capture and verify outdoor activity."}
          </p>
        </div>

        <button
          type="button"
          onClick={() => startSession.mutate()}
          disabled={startSession.isPending || isSessionActive || isCheckingSession || !walletAddress}
          className="tg-button w-full h-14 group"
        >
          {startSession.isPending ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Starting Session...</span>
            </div>
          ) : isCheckingSession ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Checking Session...</span>
            </div>
          ) : isSessionActive ? (
            <div className="flex items-center gap-2">
              <span>Session In Progress</span>
              <ShieldCheck className="h-5 w-5 text-emerald-500" />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span>Start Daily Check-In</span>
              <ArrowUpRight className="h-5 w-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </div>
          )}
        </button>

        {startSession.error ? (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-[10px] font-medium text-red-500 flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-red-500" />
            {startSession.error.message}
          </div>
        ) : null}
      </div>

      <p className="mt-6 text-[10px] text-center text-muted-foreground leading-relaxed">
        One verified outdoor check-in per wallet per UTC day. <br />
        Maintain consecutive days to advance your on-chain streak and earn milestone badges.
      </p>
    </section>
  );
}
