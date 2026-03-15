import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId");

  if (!sessionId) {
    return NextResponse.json({ error: "sessionId required" }, { status: 400 });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("sessions")
      .select("id, status")
      .eq("id", sessionId)
      .single();

    if (error || !data) {
      return NextResponse.json({ status: "not_found" });
    }

    return NextResponse.json({ status: data.status });
  } catch {
    return NextResponse.json({ status: "not_found" });
  }
}
