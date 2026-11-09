"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Award, ExternalLink } from "lucide-react";
import { useAppStore } from "@/hooks/use-app-store";
import { submitCheckInTransaction } from "@/lib/evm/wallet";
import { publicEnv } from "@/lib/public-env";

export function ClaimNftButton({
  submissionId,
  milestoneDay
}: {
  submissionId?: string;
  milestoneDay?: number;
}) {
  const queryClient = useQueryClient();
  const { walletAddress } = useAppStore();
  const [txHash, setTxHash] = useState<string | null>(null);

  const claim = useMutation({
    mutationFn: async () => {
      if (!walletAddress) {
        throw new Error("Connect and authenticate your EVM wallet first.");
      }

      let targetSubId = submissionId;

      // If no submissionId was passed directly, fetch latest approved submission
      if (!targetSubId) {
        const subRes = await fetch(`/api/submissions/list?walletAddress=${walletAddress}`);
        if (subRes.ok) {
          const list = await subRes.json();
          const approved = (list.submissions || list || []).find(
            (s: { verification_status: string }) => s.verification_status === "approved"
          );
          if (approved) targetSubId = approved.id;
        }
      }

      if (!targetSubId) {
        throw new Error("No approved outdoor photo submission found to claim.");
      }

      toast.info("Requesting approved claim signature from server...");

      const approvalRes = await fetch("/api/claim/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId: targetSubId })
      });

      if (!approvalRes.ok) {
        const err = await approvalRes.json().catch(() => ({ error: "Approval failed" }));
        throw new Error(err.error || "Server could not approve claim.");
      }

      const { claim, signature, contractAddress } = await approvalRes.json();

      toast.info("Submitting check-in claim to BOT Chain from your wallet...");

      const { txHash: submittedHash } = await submitCheckInTransaction({
        contractAddress: contractAddress as `0x${string}`,
        claim,
        signature
      });

      return { txHash: submittedHash };
    },
    onSuccess: (data) => {
      setTxHash(data.txHash);
      toast.success("Check-in and milestone badge confirmed on BOT Chain! 🌿");
      queryClient.invalidateQueries({ queryKey: ["profile-nfts", walletAddress] });
      queryClient.invalidateQueries({ queryKey: ["profile-summary", walletAddress] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-overview", walletAddress] });
      queryClient.invalidateQueries({ queryKey: ["submissions", walletAddress] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Claim transaction failed.");
    }
  });

  if (txHash) {
    return (
      <a
        href={`${publicEnv.NEXT_PUBLIC_BOT_EXPLORER_URL}/tx/${txHash}`}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1.5 text-xs text-emerald-600 font-semibold underline hover:text-emerald-700"
      >
        <span>View on BotScan</span>
        <ExternalLink className="h-3 w-3" />
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={() => claim.mutate()}
      disabled={claim.isPending}
      className="tg-button px-3 py-1.5 text-xs gap-1.5 h-8 disabled:opacity-60"
    >
      {claim.isPending ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span>Claiming on BOT...</span>
        </>
      ) : (
        <>
          <Award className="h-3.5 w-3.5" />
          <span>Claim {milestoneDay ? `${milestoneDay}d ` : ""}Badge</span>
        </>
      )}
    </button>
  );
}
