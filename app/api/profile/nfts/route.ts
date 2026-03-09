import { NextResponse } from "next/server";

import { getOrCreateProfile } from "@/lib/supabase/repositories";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get("walletAddress")?.toLowerCase();
    if (!walletAddress) {
      return NextResponse.json({ error: "walletAddress is required." }, { status: 400 });
    }

    const profile = await getOrCreateProfile(walletAddress);
    const { data, error } = await supabaseAdmin
      .from("nfts")
      .select("milestone_day, token_id, mint_tx_hash, status")
      .eq("profile_id", profile.id)
      .order("milestone_day", { ascending: true });

    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load nfts.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
