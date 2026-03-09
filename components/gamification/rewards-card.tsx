"use client";

import { Wallet, TrendingUp, Info } from "lucide-react";

export function RewardsCard({ totalEarned, rank }: { totalEarned: number; rank: number | null }) {
  return (
    <section className="tg-card group relative overflow-hidden">
      {/* Decorative Background Element */}
      <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-primary/5 blur-2xl group-hover:bg-primary/10 transition-colors" />

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Protocol Rewards</h2>
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Wallet className="h-4 w-4 text-primary" />
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex items-baseline gap-2">
          <p className="text-4xl font-bold tracking-tight">{totalEarned.toFixed(2)}</p>
          <p className="text-sm font-bold text-primary">STRK</p>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-green-500 font-bold uppercase tracking-wider">
          <TrendingUp className="h-3 w-3" />
          <span>+2.4% from yesterday</span>
        </div>
      </div>

      <div className="mt-8 pt-4 border-t border-border/50 flex items-center justify-between">
        <div>
          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest leading-none mb-1">Global Rank</p>
          <p className="text-lg font-bold">#{rank ?? "Unranked"}</p>
        </div>
        <button className="h-8 w-8 rounded-full hover:bg-secondary/50 flex items-center justify-center transition-colors">
          <Info className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
    </section>
  );
}
