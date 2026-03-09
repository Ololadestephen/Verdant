"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAppStore } from "@/hooks/use-app-store";
import { mintMilestoneNft } from "@/lib/starknet/wallet";

export function ClaimNftButton({ milestoneDay }: { milestoneDay: 7 | 30 | 100 }) {
  const queryClient = useQueryClient();
  const { walletAddress, walletType } = useAppStore();

  const claim = useMutation({
    mutationFn: async () => {
      if (!walletAddress || !walletType) throw new Error("Connect wallet to mint milestone NFT.");

      const mintTxHash = await mintMilestoneNft(walletAddress, milestoneDay, walletType);
      const tokenId = mintTxHash;

      const response = await fetch("/api/profile/nfts/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress,
          milestoneDay,
          mintTxHash,
          tokenId
        })
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }
      return response.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["profile-nfts", walletAddress] });
    }
  });

  return (
    <button
      type="button"
      onClick={() => claim.mutate()}
      disabled={claim.isPending}
      className="tg-button-ghost px-3 py-1.5 text-xs disabled:opacity-60"
    >
      {claim.isPending ? "Minting..." : `Mint ${milestoneDay}d NFT`}
    </button>
  );
}
