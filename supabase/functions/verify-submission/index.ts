import { createClient } from "npm:@supabase/supabase-js@2.50.2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const GEMINI_MODEL = Deno.env.get("GEMINI_MODEL") ?? "gemini-2.5-flash";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !GEMINI_API_KEY) {
  throw new Error("Missing required environment variables (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GEMINI_API_KEY).");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const VERIFICATION_FRESHNESS_MINUTES = 1440; // 24 hours for testing
const MILESTONE_DAYS = [7, 30, 100] as const;

function isFresh(capturedAt: string): boolean {
  const captured = new Date(capturedAt).getTime();
  const now = Date.now();
  if (Number.isNaN(captured) || captured > now) return false;
  // Allow captured timestamps from up to 24 hours ago for easier testing
  return now - captured <= VERIFICATION_FRESHNESS_MINUTES * 60_000;
}

function isValidGps(lat: number, lng: number): boolean {
  // Relaxed for testing: allow 0,0 as it's our desktop fallback
  if (lat === 0 && lng === 0) return true;
  return Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

function calculateReward(stakeAmount: number, streak: number): number {
  const multiplier = streak >= 100 ? 2 : streak >= 30 ? 1.5 : streak >= 7 ? 1.25 : 1;
  const value = 1 + stakeAmount * 0.005 * multiplier;
  return Math.min(25, Number(value.toFixed(8)));
}

function classifyVisionPayload(text: string): { grass: boolean; outdoor: boolean; indoor: boolean; labels: string[]; confidence: number } {
  try {
    const parsed = JSON.parse(text) as {
      grass: boolean;
      outdoor: boolean;
      indoor: boolean;
      labels: string[];
      confidence: number;
    };
    return {
      grass: Boolean(parsed.grass),
      outdoor: Boolean(parsed.outdoor),
      indoor: Boolean(parsed.indoor),
      labels: Array.isArray(parsed.labels) ? parsed.labels.slice(0, 15) : [],
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0
    };
  } catch {
    return { grass: false, outdoor: false, indoor: true, labels: [], confidence: 0 };
  }
}

async function analyzeImage(publicUrl: string) {
  // Fetch the image and convert to base64 for Gemini inline_data
  const imgRes = await fetch(publicUrl);
  if (!imgRes.ok) throw new Error(`Failed to fetch image: ${imgRes.status}`);
  const imgBuffer = await imgRes.arrayBuffer();
  const uint8 = new Uint8Array(imgBuffer);

  let binary = "";
  const chunkSize = 16384;
  for (let i = 0; i < uint8.length; i += chunkSize) {
    const chunk = uint8.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...Array.from(chunk));
  }
  const imgBase64 = btoa(binary);



  const mimeType = imgRes.headers.get("content-type") ?? "image/jpeg";


  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

  const body = {
    contents: [{
      parts: [
        {
          text: "You are an image verifier for a touch-grass outdoor game. Analyse the photo and return ONLY valid JSON with exactly these keys: grass (boolean - true if real grass/vegetation is clearly visible), outdoor (boolean - true if clearly outdoors), indoor (boolean - true if indoors), labels (array of up to 10 string tags describing what you see), confidence (number 0.0-1.0 how confident the person is genuinely outdoors). No markdown, just raw JSON."
        },
        {
          inline_data: { mime_type: mimeType, data: imgBase64 }
        }
      ]
    }],
    generationConfig: { temperature: 0.1, maxOutputTokens: 1024 }
  };

  const res = await fetch(geminiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${errText}`);
  }

  const json = await res.json() as any;
  console.log("Full Gemini JSON:", JSON.stringify(json));
  
  const text = json.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("") ?? "{}";
  // Strip markdown code fences if present
  const cleaned = text.replace(/^```(?:json)?\n?|\n?```$/g, "").trim();
  console.log("Gemini cleaned response:", cleaned);
  return { vision: classifyVisionPayload(cleaned), rawText: text };

}

async function rejectSubmission(params: {
  submissionId: string;
  sessionId: string;
  reason: string;
  labels?: string[];
  confidence?: number;
}) {
  await supabase
    .from("submissions")
    .update({
      verification_status: "rejected",
      rejection_reason: params.reason,
      ai_labels: params.labels ?? [],
      ai_confidence: params.confidence ?? 0,
      verifier_version: "verify-submission@1"
    })
    .eq("id", params.submissionId);

  await supabase.from("sessions").update({ status: "failed", completed_at: new Date().toISOString() }).eq("id", params.sessionId);
}

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const body = (await request.json()) as { submissionId?: string; latitude?: number; longitude?: number };
    const { submissionId } = body;
    // Coords passed directly from submission create route — avoids PostGIS re-parsing
    const payloadLat = typeof body.latitude === "number" ? body.latitude : NaN;
    const payloadLng = typeof body.longitude === "number" ? body.longitude : NaN;

    if (!submissionId) {
      return new Response(JSON.stringify({ error: "submissionId is required" }), { status: 400 });
    }

    const { data: submission, error: submissionError } = await supabase
      .from("submissions")
      .select("id, session_id, profile_id, image_path, image_sha256, captured_at, submitted_at, verification_status")
      .eq("id", submissionId)
      .single();

    if (submissionError || !submission) {
      return new Response(JSON.stringify({ error: "Submission not found" }), { status: 404 });
    }

    if (submission.verification_status !== "pending") {
      return new Response(JSON.stringify({ status: "already_processed" }), { status: 200 });
    }

    const { data: duplicateByHash } = await supabase
      .from("submissions")
      .select("id")
      .eq("profile_id", submission.profile_id)
      .eq("image_sha256", submission.image_sha256)
      .neq("id", submission.id)
      .limit(1);

    if ((duplicateByHash ?? []).length > 0) {
      await rejectSubmission({ submissionId: submission.id, sessionId: submission.session_id, reason: "Duplicate image hash detected." });
      return new Response(JSON.stringify({ status: "rejected", reason: "duplicate_hash" }), { status: 200 });
    }

    // Use coordinates passed directly from the API route (avoids PostGIS GeoJSON parsing issues)
    const latitude = payloadLat;
    const longitude = payloadLng;

    if (!isFresh(submission.captured_at)) {
      await rejectSubmission({ submissionId: submission.id, sessionId: submission.session_id, reason: "Capture is older than freshness window." });
      return new Response(JSON.stringify({ status: "rejected", reason: "stale_capture" }), { status: 200 });
    }

    if (!isValidGps(latitude, longitude)) {
      await rejectSubmission({ submissionId: submission.id, sessionId: submission.session_id, reason: `Invalid or missing GPS coordinates. Got: lat=${latitude}, lng=${longitude}` });
      return new Response(JSON.stringify({ status: "rejected", reason: "invalid_gps" }), { status: 200 });
    }


    console.log(`Creating signed URL for path: ${submission.image_path}`);
    const { data: signed, error: signedError } = await supabase.storage
      .from("grass-photos")
      .createSignedUrl(submission.image_path, 60);

    if (signedError || !signed?.signedUrl) {
      console.error("Storage Error:", signedError);
      await rejectSubmission({ submissionId: submission.id, sessionId: submission.session_id, reason: "Unable to fetch uploaded image." });
      return new Response(JSON.stringify({ status: "rejected", reason: "image_fetch_failed" }), { status: 200 });
    }
    console.log("Signed URL created successfully");


    const { vision } = await analyzeImage(signed.signedUrl);

    if (!vision.grass || !vision.outdoor || vision.indoor || vision.confidence < 0.6) {
      await rejectSubmission({
        submissionId: submission.id,
        sessionId: submission.session_id,
        reason: "Image does not pass outdoor grass verification.",
        labels: vision.labels,
        confidence: vision.confidence
      });
      return new Response(JSON.stringify({ status: "rejected", reason: "vision_failed", vision }), { status: 200 });
    }



    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, current_streak, best_streak, total_earned, total_verified_submissions, last_submission_date")
      .eq("id", submission.profile_id)
      .single();

    if (profileError || !profile) {
      throw new Error("Profile not found for submission.");
    }

    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .select("id, stake_amount")
      .eq("id", submission.session_id)
      .single();

    if (sessionError || !session) {
      throw new Error("Session not found for submission.");
    }

    const now = new Date();
    const todayDate = now.toISOString().slice(0, 10);
    const lastDate = profile.last_submission_date;
    let nextStreak = 1;
    if (lastDate) {
      const diffDays = Math.floor((new Date(`${todayDate}T00:00:00Z`).getTime() - new Date(`${lastDate}T00:00:00Z`).getTime()) / 86_400_000);
      if (diffDays === 0) {
        await rejectSubmission({ submissionId: submission.id, sessionId: submission.session_id, reason: "Already submitted for today." });
        return new Response(JSON.stringify({ status: "rejected", reason: "already_submitted_today" }), { status: 200 });
      }
      nextStreak = diffDays === 1 ? profile.current_streak + 1 : 1;
    }

    const reward = calculateReward(Number(session.stake_amount), nextStreak);

    const { data: mintedNfts } = await supabase.from("nfts").select("milestone_day").eq("profile_id", profile.id).eq("status", "minted");
    const mintedDays = (mintedNfts ?? []).map((item) => Number(item.milestone_day));
    const milestone = MILESTONE_DAYS.find((day) => nextStreak >= day && !mintedDays.includes(day));

    await supabase
      .from("submissions")
      .update({
        verification_status: "approved",
        rejection_reason: null,
        ai_confidence: vision.confidence,
        ai_labels: vision.labels,
        reward_amount: reward,
        verifier_version: "verify-submission@1"
      })
      .eq("id", submission.id);

    await supabase
      .from("profiles")
      .update({
        current_streak: nextStreak,
        best_streak: Math.max(profile.best_streak, nextStreak),
        total_earned: Number(profile.total_earned) + reward,
        total_verified_submissions: profile.total_verified_submissions + 1,
        last_submission_date: todayDate
      })
      .eq("id", profile.id);

    await supabase.from("sessions").update({ status: "completed", completed_at: now.toISOString() }).eq("id", submission.session_id);

    if (milestone) {
      await supabase
        .from("nfts")
        .upsert(
          {
            profile_id: profile.id,
            milestone_day: milestone,
            status: "pending"
          },
          { onConflict: "profile_id,milestone_day" }
        );
    }

    return new Response(
      JSON.stringify({
        status: "approved",
        reward,
        streak: nextStreak,
        milestone: milestone ?? null
      }),
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected verification failure";
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
});
