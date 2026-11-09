import { NextResponse } from "next/server";
import { z } from "zod";
import { createSession, getOrCreateProfile } from "@/lib/supabase/repositories";
import { getAuthenticatedWalletFromRequest } from "@/lib/evm/auth";

const startSessionInputSchema = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid EVM wallet address").optional(),
  stakeAmount: z.number().optional().default(0),
  stakeTxHash: z.string().optional().default("bot_checkin")
});

export async function POST(request: Request) {
  try {
    const authenticatedWallet = getAuthenticatedWalletFromRequest(request);
    if (!authenticatedWallet) {
      return NextResponse.json(
        { error: "Authentication required. Please sign in with your EVM wallet." },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const payload = startSessionInputSchema.parse(body);

    // If client supplied walletAddress, verify it matches the authenticated session
    if (payload.walletAddress && payload.walletAddress.toLowerCase() !== authenticatedWallet.toLowerCase()) {
      return NextResponse.json(
        { error: "Forbidden: Wallet address does not match authenticated session." },
        { status: 403 }
      );
    }

    const walletAddress = authenticatedWallet.toLowerCase();
    const profile = await getOrCreateProfile(walletAddress);
    const session = await createSession({
      profileId: profile.id,
      stakeAmount: payload.stakeAmount || 0,
      stakeTxHash: payload.stakeTxHash || "bot_checkin"
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to start session.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
