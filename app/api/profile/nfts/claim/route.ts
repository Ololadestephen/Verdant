import { NextResponse } from "next/server";
import { z } from "zod";

import { getOrCreateProfile } from "@/lib/supabase/repositories";
import { supabaseAdmin } from "@/lib/supabase/admin";

const claimSchema = z.object({
  walletAddress: z.string().startsWith("0x").min(10),
  milestoneDay: z.union([z.literal(7), z.literal(30), z.literal(100)]),
  mintTxHash: z.string().startsWith("0x").min(10),
  tokenId: z.string().min(1)
});

export async function POST(request: Request) {
  try {
    const payload = claimSchema.parse(await request.json());
    const profile = await getOrCreateProfile(payload.walletAddress.toLowerCase());

    const { error } = await supabaseAdmin
      .from("nfts")
      .upsert(
        {
          profile_id: profile.id,
          milestone_day: payload.milestoneDay,
          mint_tx_hash: payload.mintTxHash,
          token_id: payload.tokenId,
          status: "minted"
        },
        { onConflict: "profile_id,milestone_day" }
      );

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to claim milestone NFT.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
