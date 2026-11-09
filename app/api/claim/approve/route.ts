import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedWalletFromRequest } from "@/lib/evm/auth";
import { approveClaim } from "@/lib/evm/claim-service";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { publicEnv } from "@/lib/public-env";
import { serverEnv } from "@/lib/server-env";

const approveSchema = z.object({
  submissionId: z.string().uuid()
});

// Fallback deterministic local verifier key for testing/dev when env var is not yet configured
const DEV_VERIFIER_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80" as const;

export async function POST(request: Request) {
  try {
    const authenticatedWallet = getAuthenticatedWalletFromRequest(request);
    if (!authenticatedWallet) {
      return NextResponse.json(
        { error: "Authentication required. Connect and verify your wallet first." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { submissionId } = approveSchema.parse(body);

    // 1. Fetch submission
    const { data: submission, error: subError } = await supabaseAdmin
      .from("submissions")
      .select("id, profile_id, image_sha256, verification_status, submitted_at")
      .eq("id", submissionId)
      .single();

    if (subError || !submission) {
      return NextResponse.json({ error: "Submission not found." }, { status: 404 });
    }

    // 2. Fetch profile and verify ownership
    const { data: profile, error: profError } = await supabaseAdmin
      .from("profiles")
      .select("id, wallet_address, current_streak, last_submission_date")
      .eq("id", submission.profile_id)
      .single();

    if (profError || !profile) {
      return NextResponse.json({ error: "Profile not found for submission." }, { status: 404 });
    }

    // Strict cross-wallet protection
    if (profile.wallet_address.toLowerCase() !== authenticatedWallet.toLowerCase()) {
      return NextResponse.json(
        { error: "Forbidden: You cannot claim another user's submission." },
        { status: 403 }
      );
    }

    // 3. Status check
    if (submission.verification_status !== "approved") {
      return NextResponse.json(
        { error: `Submission is ${submission.verification_status}. Only approved submissions can be claimed.` },
        { status: 400 }
      );
    }

    // 4. Check if user already claimed today
    const today = new Date().toISOString().slice(0, 10);
    // Check if on-chain NFT / check-in already recorded for today
    const { data: todayNft } = await supabaseAdmin
      .from("nfts")
      .select("id")
      .eq("profile_id", profile.id)
      .gte("created_at", `${today}T00:00:00Z`)
      .limit(1);

    const alreadyCheckedInUtcDay = Boolean(todayNft && todayNft.length > 0);

    // 5. Check if welcome badge (milestone 1) already claimed
    const { data: welcomeNft } = await supabaseAdmin
      .from("nfts")
      .select("id")
      .eq("profile_id", profile.id)
      .eq("milestone_day", 1)
      .eq("status", "minted")
      .limit(1);

    const hasClaimedWelcomeBadge = Boolean(welcomeNft && welcomeNft.length > 0);

    // 6. Sign EIP-712 Claim
    const verifierPrivateKey = (serverEnv.BOT_VERIFIER_PRIVATE_KEY || DEV_VERIFIER_KEY) as `0x${string}`;
    const contractAddress = (publicEnv.NEXT_PUBLIC_VERDANT_CHECKIN_CONTRACT || "0x0000000000000000000000000000000000000000") as `0x${string}`;

    const { claim, signature } = await approveClaim({
      authenticatedWallet,
      submission: {
        id: submission.id,
        profile_id: submission.profile_id,
        image_sha256: submission.image_sha256,
        verification_status: submission.verification_status,
        submitted_at: submission.submitted_at
      },
      profile: {
        id: profile.id,
        wallet_address: profile.wallet_address,
        current_streak: profile.current_streak,
        last_submission_date: profile.last_submission_date
      },
      hasClaimedWelcomeBadge,
      alreadyCheckedInUtcDay,
      verifierPrivateKey,
      contractAddress
    });

    return NextResponse.json({
      ok: true,
      claim: {
        recipient: claim.recipient,
        submissionRef: claim.submissionRef,
        utcDay: claim.utcDay.toString(),
        milestone: claim.milestone.toString(),
        expiry: claim.expiry.toString(),
        nonce: claim.nonce
      },
      signature,
      contractAddress,
      chainId: 677
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to approve claim.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
