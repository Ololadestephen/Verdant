"use client";

import { NftMilestones } from "@/components/gamification/nft-milestones";
import { ClaimNftButton } from "@/components/gamification/claim-nft-button";
import { useWalletBalance } from "@/hooks/use-wallet-balance";
import { useProfileNfts } from "@/hooks/use-profile-nfts";
import { useProfileSummary } from "@/hooks/use-profile-summary";

export default function ProfilePage() {
  const { data: summary } = useProfileSummary();
  const { data: nfts } = useProfileNfts();
  const { data: balance } = useWalletBalance();

  return (
    <div className="space-y-4">
      <section className="tg-card">
        <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Player Sheet</p>
        <h1 className="text-3xl font-semibold">Profile</h1>
      </section>
      <section className="tg-card">
        <h2 className="text-xl font-semibold">Stats</h2>
        <p className="mt-2 text-sm text-muted-foreground">Wallet: {summary?.profile.wallet_address ?? "Connect wallet"}</p>
        <p className="mt-1 text-sm text-muted-foreground">Total Activity Points: {Math.floor(Number(summary?.profile.total_earned ?? 0) * 10)} PTS</p>
        <p className="mt-1 text-sm text-muted-foreground">Verified submissions: {summary?.profile.total_verified_submissions ?? 0}</p>
        {balance && (
          <p className="mt-1 text-sm text-primary font-bold">
            BOT Chain Balance: {balance.formatted}
          </p>
        )}
      </section>

      <NftMilestones minted={(nfts ?? []).filter((nft) => nft.status === "minted" || nft.status === "pending").map((nft) => nft.milestone_day)} />
      <section className="tg-card">
        <h2 className="text-lg font-semibold">Milestone Badge Activity</h2>
        <div className="mt-3 space-y-2 text-sm">
          {(nfts ?? []).map((nft) => (
            <div key={nft.milestone_day} className="rounded-xl border border-border bg-white/80 px-3 py-2 flex items-center justify-between">
              <div>
                <span className="font-semibold">Milestone {nft.milestone_day}d:</span> {nft.status}
                {nft.token_id ? ` (Token #${nft.token_id})` : ""}
              </div>
              {nft.status === "pending" ? (
                <div>
                  <ClaimNftButton milestoneDay={nft.milestone_day} />
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
