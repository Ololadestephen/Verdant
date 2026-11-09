import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error: "Legacy Starknet admin mint endpoint has been retired. Please use /api/claim/approve and submit your check-in claim directly to BOT Chain."
    },
    { status: 410 }
  );
}
