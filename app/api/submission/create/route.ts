import { NextResponse } from "next/server";
import { createHash } from "crypto";

import { createSubmission, getOrCreateProfile } from "@/lib/supabase/repositories";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const file = formData.get("file") as File | null;
    const walletAddress = formData.get("walletAddress") as string | null;
    const sessionId = formData.get("sessionId") as string | null;
    const capturedAt = formData.get("capturedAt") as string | null;
    const latitude = parseFloat(formData.get("latitude") as string ?? "0");
    const longitude = parseFloat(formData.get("longitude") as string ?? "0");

    if (!file || !walletAddress || !sessionId || !capturedAt) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    // Compute SHA256 server-side
    const arrayBuffer = await file.arrayBuffer();
    const imageSha256 = createHash("sha256").update(Buffer.from(arrayBuffer)).digest("hex");
    const ext = file.name.split(".").pop() ?? "jpg";
    const imagePath = `${walletAddress.toLowerCase()}/${sessionId}/${imageSha256}.${ext}`;

    // Upload to storage using admin client (bypasses RLS)
    const { error: uploadError } = await supabaseAdmin.storage
      .from("grass-photos")
      .upload(imagePath, Buffer.from(arrayBuffer), {
        upsert: true,
        contentType: file.type || "image/jpeg"
      });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const profile = await getOrCreateProfile(walletAddress);

    const submission = await createSubmission({
      profileId: profile.id,
      sessionId,
      imagePath,
      imageSha256,
      capturedAt,
      latitude,
      longitude
    });

    // Fire-and-forget edge function invocation — pass raw coords to avoid PostGIS re-parsing
    supabaseAdmin.functions.invoke("verify-submission", {
      body: { submissionId: submission.id, walletAddress, latitude, longitude }
    }).catch(console.error);


    return NextResponse.json({ submissionId: submission.id, status: "processing" }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create submission.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
