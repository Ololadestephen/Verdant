"use client";

import { useEffect } from "react";
import { History, Activity, Zap, TrendingUp, Award } from "lucide-react";

import { CameraCapture } from "@/components/capture/camera-capture";
import { RewardsCard } from "@/components/gamification/rewards-card";
import { StreakCard } from "@/components/gamification/streak-card";
import { StakeForm } from "@/components/stake/stake-form";
import { SubmitCapture } from "@/components/verification/submit-capture";
import { useAppStore } from "@/hooks/use-app-store";
import { useDashboardOverview } from "@/hooks/use-dashboard-overview";
import { useProfileSummary } from "@/hooks/use-profile-summary";

export default function DashboardPage() {
  const setActiveSessionId = useAppStore((state) => state.setActiveSessionId);
  const { data } = useProfileSummary();
  const { data: overview } = useDashboardOverview();

  useEffect(() => {
    if (data !== undefined) {
      setActiveSessionId(data?.activeSession?.id ?? null);
    }
  }, [data, setActiveSessionId]);

  return (
    <div className="space-y-8 max-w-6xl mx-auto px-4">
      {/* Header Section */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary mb-1">
            <Zap className="h-4 w-4 fill-current" />
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold">Active Protocol</span>
          </div>
          <h1 className="text-4xl font-bold">Command Center</h1>
          <p className="text-muted-foreground mt-1">Manage your stakes and verify outdoor activity.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-12 px-4 rounded-xl border border-border bg-card/50 backdrop-blur-md flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm font-medium">Starknet Sepolia</span>
          </div>
        </div>
      </section>

      {/* Main Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <StakeForm />
        <StreakCard streak={data?.profile.current_streak ?? 0} bestStreak={data?.profile.best_streak ?? 0} />
        <RewardsCard totalEarned={Number(data?.profile.total_earned ?? 0)} rank={data?.rank ?? null} />
      </div>

      {/* Verification Actions */}
      <div className="grid gap-6 md:grid-cols-2">
        <CameraCapture />
        <SubmitCapture />
      </div>

      {/* Detailed Activity & History */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="tg-card">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold">Session History</h2>
            </div>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </div>

          <div className="space-y-3">
            {(overview?.sessions ?? []).slice(0, 5).map((session) => (
              <div key={session.id} className="group relative flex items-center justify-between p-4 rounded-xl border border-border/50 bg-white/5 hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Zap className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-bold underline md:no-underline">{Number(session.stake_amount).toFixed(2)} STRK</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                      {new Date(session.started_at).toLocaleDateString()} • {session.status}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-mono text-muted-foreground">ID: {session.id.slice(0, 8)}...</p>
                </div>
              </div>
            ))}
            {(overview?.sessions ?? []).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-sm text-muted-foreground">No sessions initiated yet.</p>
              </div>
            ) : null}
          </div>
        </section>

        <section className="tg-card">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-accent-foreground" />
              <h2 className="text-xl font-bold">Activity Feed</h2>
            </div>
            <Award className="h-4 w-4 text-muted-foreground" />
          </div>

          <div className="space-y-3">
            {(overview?.activity ?? []).map((item, index) => (
              <div key={`${item.type}-${item.at}-${index}`} className="flex items-start gap-3 p-4 rounded-xl border border-border/50 bg-white/5">
                <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm leading-relaxed">{item.message}</p>
                  <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">
                    {new Date(item.at).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
            {(overview?.activity ?? []).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-sm text-muted-foreground">System telemetry waiting for activity.</p>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
