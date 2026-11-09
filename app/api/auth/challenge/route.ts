import { NextResponse } from "next/server";
import { z } from "zod";
import { createChallenge } from "@/lib/evm/auth";

const challengeSchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid EVM wallet address")
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { address } = challengeSchema.parse(body);

    const origin = request.headers.get("origin") || "https://verdant.botchain.ai";
    const { challenge, message } = createChallenge(address, origin);

    return NextResponse.json({ challenge, message });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create authentication challenge.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
