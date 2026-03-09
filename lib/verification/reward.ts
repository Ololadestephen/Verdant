import { DAILY_BASE_REWARD, DAILY_REWARD_CAP, MILESTONE_DAYS, type MilestoneDay } from "@/types/domain";

export function computeStreakMultiplier(streak: number): number {
  if (streak >= 100) return 2;
  if (streak >= 30) return 1.5;
  if (streak >= 7) return 1.25;
  return 1;
}

export function calculateReward(stakeAmount: number, streak: number): number {
  const multiplier = computeStreakMultiplier(streak);
  const rawReward = DAILY_BASE_REWARD + stakeAmount * 0.005 * multiplier;
  return Math.min(Number(rawReward.toFixed(8)), DAILY_REWARD_CAP);
}

export function resolveMilestone(streak: number, mintedMilestones: number[]): MilestoneDay | undefined {
  const minted = new Set(mintedMilestones);
  return MILESTONE_DAYS.find((day) => streak >= day && !minted.has(day));
}

export function nextStreak(lastSubmissionDate: string | null, now: Date): number {
  if (!lastSubmissionDate) return 1;

  const lastDate = new Date(`${lastSubmissionDate}T00:00:00.000Z`);
  const currentDate = new Date(now.toISOString().slice(0, 10) + "T00:00:00.000Z");
  const msDiff = currentDate.getTime() - lastDate.getTime();
  const dayDiff = Math.floor(msDiff / 86_400_000);

  if (dayDiff <= 0) return 0;
  if (dayDiff === 1) return -1;
  return 1;
}
