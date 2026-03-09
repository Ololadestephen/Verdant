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

    const [{ data: leaderboardRow }, { data: activeSession }] = await Promise.all([
      supabaseAdmin.from("leaderboard").select("rank").eq("id", profile.id).maybeSingle(),
      supabaseAdmin
        .from("sessions")
        .select("id, status, started_at, expires_at")
        .eq("profile_id", profile.id)
        .in("status", ["active", "pending_verification"])
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle()
    ]);

    return NextResponse.json({
      profile,
      rank: leaderboardRow?.rank ?? null,
      activeSession: activeSession ?? null
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load profile summary.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
