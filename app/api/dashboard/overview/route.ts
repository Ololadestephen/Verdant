import { NextResponse } from "next/server";

import { getNftsByProfile, getOrCreateProfile, getSessionHistory, getSubmissionsByProfile } from "@/lib/supabase/repositories";

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

    const [sessions, submissions, nfts] = await Promise.all([
      getSessionHistory(profile.id, 10),
      getSubmissionsByProfile(profile.id, 10),
      getNftsByProfile(profile.id)
    ]);

    const activity = [
      ...sessions.map((session) => ({
        type: "session",
        at: session.started_at,
        message: `Session ${session.status} with ${Number(session.stake_amount).toFixed(2)} STRK stake`
      })),
      ...submissions.map((submission) => ({
        type: "submission",
        at: submission.submitted_at,
        message:
          submission.verification_status === "approved"
            ? `Submission approved (+${Number(submission.reward_amount).toFixed(2)} STRK)`
            : `Submission ${submission.verification_status}`
      })),
      ...nfts.map((nft) => ({
        type: "nft",
        at: nft.created_at,
        message: `Milestone ${nft.milestone_day}d NFT ${nft.status}`
      }))
    ]
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
      .slice(0, 12);

    return NextResponse.json({ sessions, submissions, activity });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load dashboard overview.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
