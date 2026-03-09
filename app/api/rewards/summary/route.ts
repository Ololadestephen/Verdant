import { NextResponse } from "next/server";

import { getOrCreateProfile, getRewardsSummary } from "@/lib/supabase/repositories";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get("walletAddress")?.toLowerCase();
    if (!walletAddress) {
      return NextResponse.json({ error: "walletAddress is required." }, { status: 400 });
    }

    const profile = await getOrCreateProfile(walletAddress);
    const summary = await getRewardsSummary(profile.id);

    return NextResponse.json(summary);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load rewards summary.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
