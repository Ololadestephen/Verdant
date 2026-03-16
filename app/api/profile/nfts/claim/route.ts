import { NextResponse } from "next/server";
import { z } from "zod";

import { getOrCreateProfile } from "@/lib/supabase/repositories";
import { supabaseAdmin } from "@/lib/supabase/admin";

const claimSchema = z.object({
  walletAddress: z.string().startsWith("0x").min(10),
  milestoneDay: z.union([z.literal(7), z.literal(30), z.literal(100)])
});


export async function POST(request: Request) {
  try {
    const payload = claimSchema.parse(await request.json());
    const profile = await getOrCreateProfile(payload.walletAddress.toLowerCase());

    // 1. Verify eligibility (must have a pending record in the database)
    const { data: nftRecord, error: nftError } = await supabaseAdmin
      .from("nfts")
      .select("*")
      .eq("profile_id", profile.id)
      .eq("milestone_day", payload.milestoneDay)
      .eq("status", "pending")
      .single();

    if (nftError || !nftRecord) {
      throw new Error("Milestone NFT not found or already minted.");
    }

    // 2. Perform on-chain minting using admin account
    const { getServerAdminAccount } = await import("@/lib/starknet/admin-account");
    const { publicEnv } = await import("@/lib/public-env");
    const adminAccount = getServerAdminAccount();

    const mintCall = {
      contractAddress: publicEnv.NEXT_PUBLIC_STARKNET_NFT_CONTRACT,
      entrypoint: "mint_milestone",
      calldata: [payload.walletAddress, payload.milestoneDay.toString(), "0"]
    };

    const { transaction_hash } = await adminAccount.execute(mintCall);

    // 3. Update database with mint result
    // Note: In a production app, we might wait for confirmation or use a background sync,
    // but for this MVP, we update immediately so the user sees progress.
    const { error: updateError } = await supabaseAdmin
      .from("nfts")
      .update({
        mint_tx_hash: transaction_hash,
        status: "minted",
        // Token ID will be emitted in events, we can estimate or leave for sync
        // Using tx_hash as placeholder if token_id is not yet known
        token_id: transaction_hash 
      })
      .eq("id", nftRecord.id);

    if (updateError) throw updateError;

    return NextResponse.json({ ok: true, txHash: transaction_hash });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to claim milestone NFT.";
    console.error("NFT Claim Error:", error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

