import { NextResponse } from "next/server";
import { findActiveSession, getOrCreateProfile } from "@/lib/supabase/repositories";
import { getAuthenticatedWalletFromRequest } from "@/lib/evm/auth";

export async function GET(request: Request) {
  try {
    const authenticated = getAuthenticatedWalletFromRequest(request);
    const { searchParams } = new URL(request.url);
    const requestedWallet = searchParams.get("walletAddress")?.toLowerCase();

    const walletAddress = authenticated ? authenticated.toLowerCase() : requestedWallet;
    if (!walletAddress) {
      return NextResponse.json({ error: "walletAddress is required." }, { status: 400 });
    }

    if (authenticated && requestedWallet && requestedWallet !== authenticated.toLowerCase()) {
      return NextResponse.json({ error: "Forbidden: Cross-wallet query." }, { status: 403 });
    }

    const profile = await getOrCreateProfile(walletAddress);
    const session = await findActiveSession(profile.id);

    return NextResponse.json({ session });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to fetch active session.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
