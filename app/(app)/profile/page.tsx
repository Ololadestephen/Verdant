"use client";

import { NftMilestones } from "@/components/gamification/nft-milestones";
import { ClaimNftButton } from "@/components/gamification/claim-nft-button";
import { useProfileNfts } from "@/hooks/use-profile-nfts";
import { useProfileSummary } from "@/hooks/use-profile-summary";

export default function ProfilePage() {
  const { data } = useProfileSummary();
  const { data: nfts } = useProfileNfts();

  return (
    <div className="space-y-4">
      <section className="tg-card">
        <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Player Sheet</p>
        <h1 className="text-3xl font-semibold">Profile</h1>
      </section>
      <section className="tg-card">
        <h2 className="text-xl font-semibold">Stats</h2>
        <p className="mt-2 text-sm text-muted-foreground">Wallet: {data?.profile.wallet_address ?? "Connect wallet"}</p>
        <p className="mt-1 text-sm text-muted-foreground">Total earned: {Number(data?.profile.total_earned ?? 0).toFixed(2)} STRK</p>
        <p className="mt-1 text-sm text-muted-foreground">Verified submissions: {data?.profile.total_verified_submissions ?? 0}</p>
      </section>
      <NftMilestones minted={(nfts ?? []).filter((nft) => nft.status === "minted" || nft.status === "pending").map((nft) => nft.milestone_day)} />
      <section className="tg-card">
        <h2 className="text-lg font-semibold">NFT Mint Activity</h2>
        <div className="mt-3 space-y-2 text-sm">
          {(nfts ?? []).map((nft) => (
            <div key={nft.milestone_day} className="rounded-xl border border-border bg-white/80 px-3 py-2">
              Milestone {nft.milestone_day}d: {nft.status}
              {nft.token_id ? ` (Token ${nft.token_id})` : ""}
              {nft.status === "pending" ? (
                <div className="mt-2">
                  <ClaimNftButton milestoneDay={nft.milestone_day as 7 | 30 | 100} />
                </div>
              ) : null}
            </div>
          ))}
          {(nfts ?? []).length === 0 ? <p className="text-muted-foreground">No milestone records yet.</p> : null}
        </div>
      </section>
    </div>
  );
}
