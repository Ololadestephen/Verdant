import { NextResponse } from "next/server";

import { getOrCreateProfile, getSubmissionsByProfile } from "@/lib/supabase/repositories";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get("walletAddress")?.toLowerCase();
    if (!walletAddress) {
      return NextResponse.json({ error: "walletAddress is required." }, { status: 400 });
    }

    const profile = await getOrCreateProfile(walletAddress);
    const submissions = await getSubmissionsByProfile(profile.id, 100);
    return NextResponse.json(submissions);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load submissions.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
