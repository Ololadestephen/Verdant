"use client";

import { NftMilestones } from "@/components/gamification/nft-milestones";
import { ClaimNftButton } from "@/components/gamification/claim-nft-button";
import { useProfileNfts } from "@/hooks/use-profile-nfts";

export default function AchievementsPage() {
  const { data } = useProfileNfts();

  return (
    <div className="space-y-4">
      <section className="tg-card">
        <h1 className="text-3xl font-semibold">Milestone Badges</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Soulbound milestone badges on BOT Chain. Awarded on your first check-in and consecutive streaks.
        </p>
      </section>

      <NftMilestones minted={(data ?? []).filter((nft) => nft.status === "minted" || nft.status === "pending").map((nft) => nft.milestone_day)} />

      <section className="tg-card">
        <h2 className="text-lg font-semibold">Badge Claim Queue</h2>
        <div className="mt-3 space-y-2 text-sm">
          {(data ?? []).map((nft) => (
            <div key={nft.milestone_day} className="rounded-xl border border-border bg-white/80 px-4 py-3 flex items-center justify-between">
              <div>
                <p className="font-semibold text-foreground">
                  {nft.milestone_day === 1 ? "Welcome Badge (Day 1)" : `${nft.milestone_day}-Day Streak Badge`}
                </p>
                <p className="text-xs text-muted-foreground capitalize">Status: {nft.status}</p>
              </div>
              {nft.status === "pending" ? (
                <div>
                  <ClaimNftButton milestoneDay={nft.milestone_day} />
                </div>
              ) : (
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
                  Awarded
                </span>
              )}
            </div>
          ))}
          {(data ?? []).length === 0 ? (
            <p className="text-muted-foreground py-4 text-center">
              Complete your daily check-in to unlock the Welcome Badge and streak achievements!
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
