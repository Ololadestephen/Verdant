import { NextResponse } from "next/server";
import { z } from "zod";
import { verifySignatureAndConsumeChallenge, generateSessionToken } from "@/lib/evm/auth";
import { getOrCreateProfile } from "@/lib/supabase/repositories";

const verifySchema = z.object({
  message: z.string().min(1),
  signature: z.string().regex(/^0x[a-fA-F0-9]+$/) as z.ZodType<`0x${string}`>
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message, signature } = verifySchema.parse(body);

    const result = await verifySignatureAndConsumeChallenge({
      message,
      signature
    });

    if (!result.verified || !result.address) {
      return NextResponse.json(
        { error: result.error || "Authentication failed." },
        { status: 401 }
      );
    }

    // Upsert profile in Supabase for verified EVM address
    await getOrCreateProfile(result.address.toLowerCase());

    const token = generateSessionToken(result.address);

    const response = NextResponse.json({
      ok: true,
      address: result.address,
      token
    });

    // Set secure HTTP-only cookie for session persistence
    response.cookies.set("verdant_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60, // 24 hours
      path: "/"
    });

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Authentication failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
