"use client";

import { Flame, Trophy } from "lucide-react";
import { MILESTONE_DAYS } from "@/types/domain";

export function StreakCard({ streak, bestStreak }: { streak: number; bestStreak: number }) {
  const nextMilestone = MILESTONE_DAYS.find((day) => streak < day) ?? MILESTONE_DAYS[MILESTONE_DAYS.length - 1];
  const progress = Math.min(100, Math.round((streak / nextMilestone) * 100));

  return (
    <section className="tg-card group">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Active Streak</h2>
        <div className="h-8 w-8 rounded-full bg-orange-500/10 flex items-center justify-center animate-pulse-subtle">
          <Flame className="h-4 w-4 text-orange-500 fill-current" />
        </div>
      </div>

      <div className="flex items-baseline gap-2">
        <p className="text-5xl font-bold tracking-tight">{streak}</p>
        <p className="text-sm font-medium text-muted-foreground">DAYS</p>
      </div>

      <div className="mt-6 space-y-4">
        <div>
          <div className="flex justify-between text-[10px] uppercase font-bold tracking-wider mb-2">
            <span className="text-muted-foreground">Next Milestone</span>
            <span>{streak} / {nextMilestone} Days</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-secondary/50 backdrop-blur-sm p-[1px]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-orange-500 via-primary to-emerald-400 transition-all duration-1000 ease-out shadow-[0_0_12px_rgba(251,146,60,0.4)]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <div className="h-8 w-8 rounded-lg bg-accent/20 flex items-center justify-center">
            <Trophy className="h-4 w-4 text-accent-foreground" />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest leading-none">Best Streak</p>
            <p className="text-sm font-bold">{bestStreak} Days</p>
          </div>
        </div>
      </div>
    </section>
  );
}
