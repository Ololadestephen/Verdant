import { NextResponse } from "next/server";

import { stakeSchema } from "@/types/domain";

export async function POST(request: Request) {
  try {
    const payload = stakeSchema.parse(await request.json());
    return NextResponse.json({
      ok: true,
      walletAddress: payload.walletAddress,
      amount: payload.amount
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid stake payload.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
