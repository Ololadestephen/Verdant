import { NextResponse } from "next/server";

import { createSession, getOrCreateProfile } from "@/lib/supabase/repositories";
import { startSessionSchema } from "@/types/domain";

export async function POST(request: Request) {
  try {
    const payload = startSessionSchema.parse(await request.json());
    const profile = await getOrCreateProfile(payload.walletAddress);
    const session = await createSession({
      profileId: profile.id,
      stakeAmount: payload.stakeAmount,
      stakeTxHash: payload.stakeTxHash
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to start session.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
