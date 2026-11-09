import { randomBytes } from "crypto";
import { getAddress } from "viem";
import {
  computeSubmissionRef,
  getCurrentUtcDay,
  signCheckInClaim,
  type CheckInClaimData
} from "./claim";

export interface SubmissionRecord {
  id: string;
  profile_id: string;
  image_sha256: string;
  verification_status: "pending" | "approved" | "rejected";
  submitted_at: string;
}

export interface ProfileRecord {
  id: string;
  wallet_address: string;
  current_streak: number;
  last_submission_date: string | null;
}

export interface ApproveClaimInput {
  authenticatedWallet: `0x${string}`;
  submission: SubmissionRecord;
  profile: ProfileRecord;
  hasClaimedWelcomeBadge: boolean;
  alreadyCheckedInUtcDay: boolean;
  verifierPrivateKey: `0x${string}`;
  contractAddress: `0x${string}`;
  expirySeconds?: number;
}

export async function approveClaim(input: ApproveClaimInput): Promise<{
  claim: CheckInClaimData;
  signature: `0x${string}`;
}> {
  const normalizedWallet = getAddress(input.authenticatedWallet);
  const profileWallet = getAddress(input.profile.wallet_address);

  // 1. Cross-wallet protection: Submission owner must match authenticated wallet
  if (normalizedWallet !== profileWallet) {
    throw new Error("Unauthorized: Cross-wallet submission access is strictly forbidden.");
  }

  // 2. Submission verification status
  if (input.submission.verification_status !== "approved") {
    throw new Error(`Submission cannot be claimed because its verification status is "${input.submission.verification_status}".`);
  }

  // 3. Daily UTC Check-in limit
  if (input.alreadyCheckedInUtcDay) {
    throw new Error("Already checked in today. Only one check-in per UTC day is permitted.");
  }

  // 4. Milestone determination
  // Milestone 1 = Welcome badge (first check-in)
  // Milestone 7, 30, 100 = streak milestones
  let milestone = 0n;
  if (!input.hasClaimedWelcomeBadge) {
    milestone = 1n; // Welcome badge on first confirmed check-in
  } else if ([7, 30, 100].includes(input.profile.current_streak)) {
    milestone = BigInt(input.profile.current_streak);
  }

  const currentUtcDay = getCurrentUtcDay();
  const submissionRef = computeSubmissionRef(input.submission.id, input.submission.image_sha256);
  const expirySeconds = input.expirySeconds ?? 3600;
  const expiry = BigInt(Math.floor(Date.now() / 1000) + expirySeconds);
  const nonce = ("0x" + randomBytes(32).toString("hex")) as `0x${string}`;

  const claim: CheckInClaimData = {
    recipient: normalizedWallet,
    submissionRef,
    utcDay: currentUtcDay,
    milestone,
    expiry,
    nonce
  };

  const signature = await signCheckInClaim({
    verifierPrivateKey: input.verifierPrivateKey,
    contractAddress: input.contractAddress,
    claim
  });

  return { claim, signature };
}
