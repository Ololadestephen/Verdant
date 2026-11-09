import { getAddress, keccak256, encodePacked } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { botChain } from "./config";

export const CLAIM_TYPES = {
  CheckInClaim: [
    { name: "recipient", type: "address" },
    { name: "submissionRef", type: "bytes32" },
    { name: "utcDay", type: "uint256" },
    { name: "milestone", type: "uint256" },
    { name: "expiry", type: "uint256" },
    { name: "nonce", type: "bytes32" }
  ]
} as const;

export function getClaimDomain(contractAddress: `0x${string}`) {
  return {
    name: "VerdantCheckIn",
    version: "1",
    chainId: BigInt(botChain.id),
    verifyingContract: getAddress(contractAddress)
  } as const;
}

export interface CheckInClaimData {
  recipient: `0x${string}`;
  submissionRef: `0x${string}`;
  utcDay: bigint;
  milestone: bigint;
  expiry: bigint;
  nonce: `0x${string}`;
}

export function computeSubmissionRef(submissionId: string, imageSha256: string): `0x${string}` {
  return keccak256(
    encodePacked(
      ["string", "string"],
      [submissionId, imageSha256]
    )
  );
}

export function getCurrentUtcDay(timestampMs: number = Date.now()): bigint {
  return BigInt(Math.floor(timestampMs / 86_400_000));
}

export async function signCheckInClaim(params: {
  verifierPrivateKey: `0x${string}`;
  contractAddress: `0x${string}`;
  claim: CheckInClaimData;
}): Promise<`0x${string}`> {
  const account = privateKeyToAccount(params.verifierPrivateKey);
  const domain = getClaimDomain(params.contractAddress);

  const signature = await account.signTypedData({
    domain,
    types: CLAIM_TYPES,
    primaryType: "CheckInClaim",
    message: {
      recipient: params.claim.recipient,
      submissionRef: params.claim.submissionRef,
      utcDay: params.claim.utcDay,
      milestone: params.claim.milestone,
      expiry: params.claim.expiry,
      nonce: params.claim.nonce
    }
  });

  return signature;
}
