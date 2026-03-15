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
      .select("id, status, expires_at")
      .eq("id", sessionId)
      .single();

    if (error || !data) {
      return NextResponse.json({ status: "not_found" });
    }

    // Treat session as expired if expires_at is in the past (even if status is still 'active')
    const isExpired = data.expires_at && new Date(data.expires_at) < new Date();
    if (isExpired && (data.status === "active" || data.status === "pending_verification")) {
      return NextResponse.json({ status: "expired" });
    }

    return NextResponse.json({ status: data.status });
  } catch {
    return NextResponse.json({ status: "not_found" });
  }
}

