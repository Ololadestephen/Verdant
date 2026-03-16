import { addMinutes } from "@/lib/time";
import { SESSION_TTL_MINUTES } from "@/types/domain";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Database } from "@/types/supabase";

export async function getOrCreateProfile(walletAddress: string): Promise<Database["public"]["Tables"]["profiles"]["Row"]> {
  const normalized = walletAddress.toLowerCase();
  const { data: existingRows, error: existingError } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .ilike("wallet_address", walletAddress)
    .limit(1);

  if (existingError) {
    throw existingError;
  }
  if (existingRows && existingRows.length > 0) {
    const existing = existingRows[0];
    if (existing.wallet_address !== normalized) {
      await supabaseAdmin.from("profiles").update({ wallet_address: normalized }).eq("id", existing.id);
    }
    return existing;
  }

  const { data: created, error: createError } = await supabaseAdmin
    .from("profiles")
    .insert({ wallet_address: normalized })
    .select("*")
    .single();

  if (createError || !created) {
    throw createError ?? new Error("Failed to create profile.");
  }

  return created;
}

export async function findActiveSession(profileId: string) {
  const { data, error } = await supabaseAdmin
    .from("sessions")
    .select("*")
    .eq("profile_id", profileId)
    .in("status", ["active", "pending_verification"])
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function createSession(input: {
  profileId: string;
  stakeAmount: number;
  stakeTxHash: string;
}) {
  const active = await findActiveSession(input.profileId);
  if (active) {
    throw new Error("An active session already exists.");
  }

  const expiresAt = addMinutes(new Date(), SESSION_TTL_MINUTES).toISOString();

  const { data, error } = await supabaseAdmin
    .from("sessions")
    .insert({
      profile_id: input.profileId,
      stake_amount: input.stakeAmount,
      stake_tx_hash: input.stakeTxHash,
      status: "active",
      expires_at: expiresAt
    })
    .select("*")
    .single();

  if (error || !data) {
    throw error ?? new Error("Failed to start session.");
  }

  return data;
}

export async function createSubmission(input: {
  profileId: string;
  sessionId: string;
  imagePath: string;
  imageSha256: string;
  capturedAt: string;
  latitude: number;
  longitude: number;
}) {
  const { data: session, error: sessionError } = await supabaseAdmin
    .from("sessions")
    .select("id, status")
    .eq("id", input.sessionId)
    .eq("profile_id", input.profileId)
    .single();

  if (sessionError || !session) {
    throw sessionError ?? new Error("Session not found.");
  }

  if (session.status !== "active") {
    throw new Error("Session is not active.");
  }

  const location = `POINT(${input.longitude} ${input.latitude})`;

  const { data, error } = await supabaseAdmin
    .from("submissions")
    .insert({
      profile_id: input.profileId,
      session_id: input.sessionId,
      image_path: input.imagePath,
      image_sha256: input.imageSha256,
      captured_at: input.capturedAt,
      location
    })
    .select("id")
    .single();

  if (error || !data) {
    throw error ?? new Error("Failed to create submission.");
  }

  await supabaseAdmin
    .from("sessions")
    .update({ status: "pending_verification" })
    .eq("id", input.sessionId);

  return data;
}

export async function getLeaderboard() {
  const { data, error } = await supabaseAdmin
    .from("leaderboard")
    .select("*")
    .order("total_earned", { ascending: false })
    .limit(100);

  if (error) throw error;
  return data;
}

export async function getSessionHistory(profileId: string, limit = 20) {
  const { data, error } = await supabaseAdmin
    .from("sessions")
    .select("id, stake_amount, status, started_at, completed_at, expires_at")
    .eq("profile_id", profileId)
    .order("started_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

export async function getSubmissionsByProfile(profileId: string, limit = 50) {
  const { data, error } = await supabaseAdmin
    .from("submissions")
    .select("id, image_path, captured_at, submitted_at, ai_confidence, ai_labels, verification_status, rejection_reason, reward_amount")
    .eq("profile_id", profileId)
    .order("submitted_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

export async function getNftsByProfile(profileId: string) {
  const { data, error } = await supabaseAdmin
    .from("nfts")
    .select("id, milestone_day, token_id, mint_tx_hash, status, created_at")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getRewardsSummary(profileId: string) {
  const submissions = await getSubmissionsByProfile(profileId, 500);
  const approved = submissions.filter((row) => row.verification_status === "approved");

  const now = Date.now();
  const sevenDayMs = 7 * 86_400_000;
  const thirtyDayMs = 30 * 86_400_000;

  const result = approved.reduce(
    (acc, row) => {
      const reward = Number(row.reward_amount ?? 0);
      const ts = new Date(row.submitted_at).getTime();
      acc.lifetime += reward;
      if (now - ts <= sevenDayMs) acc.last7Days += reward;
      if (now - ts <= thirtyDayMs) acc.last30Days += reward;
      return acc;
    },
    { lifetime: 0, last7Days: 0, last30Days: 0, approvedCount: approved.length }
  );

  return {
    lifetime: Number(result.lifetime.toFixed(8)),
    last7Days: Number(result.last7Days.toFixed(8)),
    last30Days: Number(result.last30Days.toFixed(8)),
    approvedCount: result.approvedCount
  };
}
