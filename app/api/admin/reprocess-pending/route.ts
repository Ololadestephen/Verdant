import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

// POST /api/admin/reprocess-pending
// Re-invokes the verify-submission edge function for all submissions stuck in 'pending' state.
export async function POST() {
  try {
    // Find all submissions stuck in pending state
    const { data: pending, error } = await supabaseAdmin
      .from("submissions")
      .select("id, profile_id, session_id")
      .eq("verification_status", "pending");

    if (error) throw error;
    if (!pending || pending.length === 0) {
      return NextResponse.json({ message: "No pending submissions found.", reprocessed: 0 });
    }

    // Re-invoke edge function for each, grabbing the wallet address from profiles
    const results = await Promise.allSettled(
      pending.map(async (sub) => {
        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("wallet_address")
          .eq("id", sub.profile_id)
          .single();

        // Also get coordinates from the session submission record
        const { data: fullSub } = await supabaseAdmin
          .from("submissions")
          .select("location")
          .eq("id", sub.id)
          .single();

        // Try to parse location as GeoJSON
        let latitude = 0, longitude = 0;
        try {
          const loc = (fullSub as { location?: { coordinates?: number[] } } | null)?.location;
          if (loc?.coordinates && Array.isArray(loc.coordinates)) {
            longitude = loc.coordinates[0];
            latitude = loc.coordinates[1];
          }
        } catch { /* ignore */ }

        return supabaseAdmin.functions.invoke("verify-submission", {
          body: {
            submissionId: sub.id,
            walletAddress: profile?.wallet_address ?? "",
            latitude,
            longitude
          }
        });
      })
    );

    const succeeded = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    return NextResponse.json({
      message: `Reprocessed ${pending.length} submission(s).`,
      succeeded,
      failed
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Reprocess failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
