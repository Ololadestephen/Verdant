import { NextResponse } from "next/server";

import { getLeaderboard } from "@/lib/supabase/repositories";

export async function GET() {
  try {
    const rows = await getLeaderboard();
    return NextResponse.json(rows);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load leaderboard.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
