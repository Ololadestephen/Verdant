import { z } from "zod";

export const SESSION_TTL_MINUTES = 30;
export const VERIFICATION_FRESHNESS_MINUTES = 10;
export const DAILY_BASE_REWARD = 1;
export const DAILY_REWARD_CAP = 25;
export const MILESTONE_DAYS = [7, 30, 100] as const;

export type MilestoneDay = (typeof MILESTONE_DAYS)[number];

export const stakeSchema = z.object({
  walletAddress: z.string().startsWith("0x").min(10),
  amount: z.number().positive().max(1_000_000)
});

export const startSessionSchema = z.object({
  walletAddress: z.string().startsWith("0x").min(10),
  stakeAmount: z.number().positive(),
  stakeTxHash: z.string().startsWith("0x").min(10)
});

export const createSubmissionSchema = z.object({
  walletAddress: z.string().startsWith("0x").min(10),
  sessionId: z.string().uuid(),
  imagePath: z.string().min(1),
  imageSha256: z.string().regex(/^[a-f0-9]{64}$/),
  capturedAt: z.string().datetime(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180)
});

export type StakeInput = z.infer<typeof stakeSchema>;
export type StartSessionInput = z.infer<typeof startSessionSchema>;
export type CreateSubmissionInput = z.infer<typeof createSubmissionSchema>;

export type VerificationOutcome = {
  approved: boolean;
  reason: string | null;
  confidence: number;
  labels: string[];
  reward: number;
  streak: number;
  milestone?: MilestoneDay;
};

export type ProfileRow = {
  id: string;
  wallet_address: string;
  username: string | null;
  avatar_url: string | null;
  current_streak: number;
  best_streak: number;
  total_earned: number;
  total_verified_submissions: number;
  last_submission_date: string | null;
};

export type LeaderboardRow = {
  id: string;
  wallet_address: string;
  username: string | null;
  avatar_url: string | null;
  current_streak: number;
  best_streak: number;
  total_earned: number;
  total_verified_submissions: number;
  rank: number;
};
