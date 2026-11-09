import { describe, expect, it } from "vitest";
import { privateKeyToAccount, generatePrivateKey } from "viem/accounts";
import { verifyTypedData } from "viem";
import {
  createChallenge,
  verifySignatureAndConsumeChallenge,
  generateSessionToken,
  verifySessionToken,
  getAuthenticatedWalletFromRequest
} from "@/lib/evm/auth";
import {
  signCheckInClaim,
  computeSubmissionRef,
  getCurrentUtcDay,
  getClaimDomain,
  CLAIM_TYPES,
  type CheckInClaimData
} from "@/lib/evm/claim";

describe("EVM Authentication Boundaries", () => {
  const aliceKey = generatePrivateKey();
  const alice = privateKeyToAccount(aliceKey);

  const bobKey = generatePrivateKey();
  const bob = privateKeyToAccount(bobKey);

  it("creates challenge bound to address, nonce, and BOT chain ID 677", () => {
    const { challenge, message } = createChallenge(alice.address);
    expect(challenge.address).toBe(alice.address);
    expect(challenge.chainId).toBe(677);
    expect(challenge.nonce).toBeDefined();
    expect(message).toContain(alice.address);
    expect(message).toContain("Chain ID: 677");
    expect(message).toContain(challenge.nonce);
  });

  it("verifies valid signature from the matching wallet and consumes the nonce", async () => {
    const { challenge, message } = createChallenge(alice.address);
    const signature = await alice.signMessage({ message });

    const result = await verifySignatureAndConsumeChallenge({
      message,
      signature
    });

    expect(result.verified).toBe(true);
    expect(result.address).toBe(alice.address);

    // Replay attack: trying to use the same challenge again must be rejected!
    const replayResult = await verifySignatureAndConsumeChallenge({
      message,
      signature
    });
    expect(replayResult.verified).toBe(false);
    expect(replayResult.error).toContain("already been used");
  });

  it("rejects impersonation when signature is made by a different wallet", async () => {
    // Challenge created for Alice
    const { message } = createChallenge(alice.address);

    // Bob tries to sign the message
    const bobSignature = await bob.signMessage({ message });

    const result = await verifySignatureAndConsumeChallenge({
      message,
      signature: bobSignature
    });

    // Bob's signature does not match Alice's address in the challenge message
    expect(result.verified).toBe(false);
    expect(result.error).toContain("verification failed");
  });

  it("rejects tampered challenge message", async () => {
    const { message } = createChallenge(alice.address);
    const signature = await alice.signMessage({ message });

    // Tamper with the chain ID or address in the message
    const tampered = message.replace("Chain ID: 677", "Chain ID: 1");

    const result = await verifySignatureAndConsumeChallenge({
      message: tampered,
      signature
    });

    expect(result.verified).toBe(false);
  });

  it("generates and verifies HMAC-bound session tokens", () => {
    const token = generateSessionToken(alice.address);
    const payload = verifySessionToken(token);
    expect(payload).not.toBeNull();
    expect(payload?.address).toBe(alice.address);

    // Tampered token must fail
    const tamperedToken = token + "xyz";
    expect(verifySessionToken(tamperedToken)).toBeNull();
  });

  it("extracts authenticated wallet from Request Bearer header", () => {
    const token = generateSessionToken(alice.address);
    const request = new Request("http://localhost/api/test", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const authenticatedAddress = getAuthenticatedWalletFromRequest(request);
    expect(authenticatedAddress).toBe(alice.address);

    // Request without token or with forged token
    const emptyRequest = new Request("http://localhost/api/test");
    expect(getAuthenticatedWalletFromRequest(emptyRequest)).toBeNull();

    const badRequest = new Request("http://localhost/api/test", {
      headers: { Authorization: "Bearer forged-token" }
    });
    expect(getAuthenticatedWalletFromRequest(badRequest)).toBeNull();
  });
});

describe("Approved-Claim Boundaries (EIP-712)", () => {
  const verifierKey = generatePrivateKey();
  const verifier = privateKeyToAccount(verifierKey);

  const contractAddress = "0x1234567890123456789012345678901234567890" as const;
  const aliceKey = generatePrivateKey();
  const alice = privateKeyToAccount(aliceKey);

  it("signs and verifies valid EIP-712 claim", async () => {
    const currentUtcDay = getCurrentUtcDay();
    const submissionRef = computeSubmissionRef("sub-uuid-1234", "a".repeat(64));

    const claim: CheckInClaimData = {
      recipient: alice.address,
      submissionRef,
      utcDay: currentUtcDay,
      milestone: 1n, // welcome badge
      expiry: BigInt(Math.floor(Date.now() / 1000) + 3600),
      nonce: "0x" + "11".repeat(32) as `0x${string}`
    };

    const signature = await signCheckInClaim({
      verifierPrivateKey: verifierKey,
      contractAddress,
      claim
    });

    expect(signature).toBeDefined();

    // Verify signature with viem verifyTypedData
    const isValid = await verifyTypedData({
      address: verifier.address,
      domain: getClaimDomain(contractAddress),
      types: CLAIM_TYPES,
      primaryType: "CheckInClaim",
      message: claim,
      signature
    });

    expect(isValid).toBe(true);
  });

  it("detects tampering with claim recipient (cross-wallet protection)", async () => {
    const currentUtcDay = getCurrentUtcDay();
    const submissionRef = computeSubmissionRef("sub-uuid-1234", "a".repeat(64));

    const claim: CheckInClaimData = {
      recipient: alice.address,
      submissionRef,
      utcDay: currentUtcDay,
      milestone: 1n,
      expiry: BigInt(Math.floor(Date.now() / 1000) + 3600),
      nonce: "0x" + "22".repeat(32) as `0x${string}`
    };

    const signature = await signCheckInClaim({
      verifierPrivateKey: verifierKey,
      contractAddress,
      claim
    });

    // Bob tries to replace recipient with his own address
    const bobAddress = "0x9999999999999999999999999999999999999999" as const;
    const tamperedClaim: CheckInClaimData = {
      ...claim,
      recipient: bobAddress
    };

    const isValid = await verifyTypedData({
      address: verifier.address,
      domain: getClaimDomain(contractAddress),
      types: CLAIM_TYPES,
      primaryType: "CheckInClaim",
      message: tamperedClaim,
      signature
    });

    expect(isValid).toBe(false);
  });

  it("detects tampering with milestone or UTC day", async () => {
    const currentUtcDay = getCurrentUtcDay();
    const submissionRef = computeSubmissionRef("sub-uuid-1234", "a".repeat(64));

    const claim: CheckInClaimData = {
      recipient: alice.address,
      submissionRef,
      utcDay: currentUtcDay,
      milestone: 1n,
      expiry: BigInt(Math.floor(Date.now() / 1000) + 3600),
      nonce: "0x" + "33".repeat(32) as `0x${string}`
    };

    const signature = await signCheckInClaim({
      verifierPrivateKey: verifierKey,
      contractAddress,
      claim
    });

    // Attacker tries to elevate milestone to 100
    const tamperedClaim: CheckInClaimData = {
      ...claim,
      milestone: 100n
    };

    const isValid = await verifyTypedData({
      address: verifier.address,
      domain: getClaimDomain(contractAddress),
      types: CLAIM_TYPES,
      primaryType: "CheckInClaim",
      message: tamperedClaim,
      signature
    });

    expect(isValid).toBe(false);
  });
});

describe("Server-Side Claim Approval Boundary (claim-service)", () => {
  const verifierKey = generatePrivateKey();
  const contractAddress = "0x1111111111111111111111111111111111111111" as const;

  const aliceKey = generatePrivateKey();
  const alice = privateKeyToAccount(aliceKey);

  const bobKey = generatePrivateKey();
  const bob = privateKeyToAccount(bobKey);

  const mockSubmission = {
    id: "sub-100",
    profile_id: "profile-alice",
    image_sha256: "b".repeat(64),
    verification_status: "approved" as const,
    submitted_at: new Date().toISOString()
  };

  const mockProfile = {
    id: "profile-alice",
    wallet_address: alice.address,
    current_streak: 1,
    last_submission_date: new Date().toISOString().slice(0, 10)
  };

  it("approves valid claim and assigns Welcome Badge (milestone 1) on first check-in", async () => {
    const { approveClaim } = await import("@/lib/evm/claim-service");
    const result = await approveClaim({
      authenticatedWallet: alice.address,
      submission: mockSubmission,
      profile: mockProfile,
      hasClaimedWelcomeBadge: false,
      alreadyCheckedInUtcDay: false,
      verifierPrivateKey: verifierKey,
      contractAddress
    });

    expect(result.claim.recipient).toBe(alice.address);
    expect(result.claim.milestone).toBe(1n);
    expect(result.signature).toBeDefined();
  });

  it("rejects cross-wallet claim attempts (Bob trying to claim Alice's submission)", async () => {
    const { approveClaim } = await import("@/lib/evm/claim-service");

    await expect(
      approveClaim({
        authenticatedWallet: bob.address, // Bob authenticated, but submission belongs to Alice
        submission: mockSubmission,
        profile: mockProfile,
        hasClaimedWelcomeBadge: false,
        alreadyCheckedInUtcDay: false,
        verifierPrivateKey: verifierKey,
        contractAddress
      })
    ).rejects.toThrow("Cross-wallet submission access is strictly forbidden");
  });

  it("rejects claim if submission is not approved", async () => {
    const { approveClaim } = await import("@/lib/evm/claim-service");

    await expect(
      approveClaim({
        authenticatedWallet: alice.address,
        submission: { ...mockSubmission, verification_status: "rejected" },
        profile: mockProfile,
        hasClaimedWelcomeBadge: false,
        alreadyCheckedInUtcDay: false,
        verifierPrivateKey: verifierKey,
        contractAddress
      })
    ).rejects.toThrow('verification status is "rejected"');
  });

  it("rejects claim if wallet has already checked in on the same UTC day", async () => {
    const { approveClaim } = await import("@/lib/evm/claim-service");

    await expect(
      approveClaim({
        authenticatedWallet: alice.address,
        submission: mockSubmission,
        profile: mockProfile,
        hasClaimedWelcomeBadge: true,
        alreadyCheckedInUtcDay: true, // Already checked in today!
        verifierPrivateKey: verifierKey,
        contractAddress
      })
    ).rejects.toThrow("Already checked in today");
  });
});

