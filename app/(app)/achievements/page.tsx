"use client";

import { NftMilestones } from "@/components/gamification/nft-milestones";
import { ClaimNftButton } from "@/components/gamification/claim-nft-button";
import { useProfileNfts } from "@/hooks/use-profile-nfts";

export default function AchievementsPage() {
  const { data } = useProfileNfts();

  return (
    <div className="space-y-4">
      <section className="tg-card">
        <h1 className="text-3xl font-semibold">Achievements</h1>
        <p className="mt-1 text-sm text-muted-foreground">Milestone NFTs and mint status.</p>
      </section>

      <NftMilestones minted={(data ?? []).filter((nft) => nft.status === "minted" || nft.status === "pending").map((nft) => nft.milestone_day)} />

      <section className="tg-card">
        <h2 className="text-lg font-semibold">Mint Queue</h2>
        <div className="mt-3 space-y-2 text-sm">
          {(data ?? []).map((nft) => (
            <div key={nft.milestone_day} className="rounded-xl border border-border bg-white/80 px-3 py-2">
              Milestone {nft.milestone_day}d: {nft.status}
              {nft.status === "pending" ? (
                <div className="mt-2">
                  <ClaimNftButton milestoneDay={nft.milestone_day as 7 | 30 | 100} />
                </div>
              ) : null}
            </div>
          ))}
          {(data ?? []).length === 0 ? <p className="text-muted-foreground">No achievement records yet.</p> : null}
        </div>
      </section>
    </div>
  );
}
