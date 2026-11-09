import { createHmac, randomBytes } from "crypto";
import { getAddress, verifyMessage } from "viem";
import { botChain } from "./config";

export interface AuthChallenge {
  address: `0x${string}`;
  nonce: string;
  issuedAt: string;
  expiresAt: string;
  uri: string;
  chainId: number;
  statement: string;
}

// In-memory nonce store for active challenges (TTL 10 mins)
interface StoredChallenge {
  address: `0x${string}`;
  nonce: string;
  expiresAt: number;
  used: boolean;
}

const activeChallenges = new Map<string, StoredChallenge>();

// Clean expired challenges periodically
function cleanupExpiredChallenges() {
  const now = Date.now();
  for (const [key, val] of activeChallenges.entries()) {
    if (val.expiresAt < now) {
      activeChallenges.delete(key);
    }
  }
}

const CHALLENGE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function getSecretKey(): string {
  // Use SUPABASE_SERVICE_ROLE_KEY or OPENAI_API_KEY as HMAC secret seed if AUTH_SECRET is not explicitly set
  return process.env.AUTH_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "verdant-auth-secret-key-fallback";
}

export function formatChallengeMessage(challenge: AuthChallenge): string {
  return [
    `Verdant Check-In wants you to sign in with your Ethereum account:`,
    `${challenge.address}`,
    ``,
    `${challenge.statement}`,
    ``,
    `URI: ${challenge.uri}`,
    `Version: 1`,
    `Chain ID: ${challenge.chainId}`,
    `Nonce: ${challenge.nonce}`,
    `Issued At: ${challenge.issuedAt}`,
    `Expiration Time: ${challenge.expiresAt}`
  ].join("\n");
}

export function parseChallengeMessage(message: string): Partial<AuthChallenge> | null {
  try {
    const lines = message.split("\n");
    const addressLine = lines[1]?.trim();
    const address = addressLine ? getAddress(addressLine) : undefined;
    const uriMatch = message.match(/URI:\s*(.+)/);
    const chainIdMatch = message.match(/Chain ID:\s*(\d+)/);
    const nonceMatch = message.match(/Nonce:\s*(.+)/);
    const issuedAtMatch = message.match(/Issued At:\s*(.+)/);
    const expiresAtMatch = message.match(/Expiration Time:\s*(.+)/);

    return {
      address,
      uri: uriMatch?.[1]?.trim(),
      chainId: chainIdMatch ? parseInt(chainIdMatch[1], 10) : undefined,
      nonce: nonceMatch?.[1]?.trim(),
      issuedAt: issuedAtMatch?.[1]?.trim(),
      expiresAt: expiresAtMatch?.[1]?.trim()
    };
  } catch {
    return null;
  }
}

export function createChallenge(rawAddress: string, origin: string = "https://verdant.botchain.ai"): { challenge: AuthChallenge; message: string } {
  cleanupExpiredChallenges();
  const address = getAddress(rawAddress);
  const nonce = randomBytes(16).toString("hex");
  const now = Date.now();
  const expiresAtMs = now + CHALLENGE_TTL_MS;

  const challenge: AuthChallenge = {
    address,
    nonce,
    issuedAt: new Date(now).toISOString(),
    expiresAt: new Date(expiresAtMs).toISOString(),
    uri: origin,
    chainId: botChain.id,
    statement: "Sign in to Verdant to verify outdoor photo check-ins and claim on-chain badges."
  };

  activeChallenges.set(nonce, {
    address,
    nonce,
    expiresAt: expiresAtMs,
    used: false
  });

  const message = formatChallengeMessage(challenge);
  return { challenge, message };
}

export async function verifySignatureAndConsumeChallenge(params: {
  message: string;
  signature: `0x${string}`;
  expectedOrigin?: string;
}): Promise<{ verified: boolean; address: `0x${string}`; error?: string }> {
  cleanupExpiredChallenges();
  const parsed = parseChallengeMessage(params.message);
  if (!parsed || !parsed.address || !parsed.nonce || !parsed.expiresAt) {
    return { verified: false, address: "0x0", error: "Malformed challenge message." };
  }

  // 1. Check challenge existence and replay
  const stored = activeChallenges.get(parsed.nonce);
  if (!stored) {
    return { verified: false, address: parsed.address, error: "Challenge nonce not found or expired." };
  }

  if (stored.used) {
    return { verified: false, address: parsed.address, error: "Challenge nonce has already been used." };
  }

  if (stored.address !== parsed.address) {
    return { verified: false, address: parsed.address, error: "Challenge address mismatch." };
  }

  // 2. Check expiration
  if (Date.now() > stored.expiresAt || Date.now() > new Date(parsed.expiresAt).getTime()) {
    activeChallenges.delete(parsed.nonce);
    return { verified: false, address: parsed.address, error: "Challenge has expired." };
  }

  // 3. Check chain ID
  if (parsed.chainId !== botChain.id) {
    return { verified: false, address: parsed.address, error: `Invalid chain ID. Expected ${botChain.id}.` };
  }

  // 4. Cryptographic signature check via viem
  try {
    const isValid = await verifyMessage({
      address: parsed.address,
      message: params.message,
      signature: params.signature
    });

    if (!isValid) {
      return { verified: false, address: parsed.address, error: "Cryptographic signature verification failed." };
    }

    // Mark nonce as used
    stored.used = true;

    return { verified: true, address: parsed.address };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Signature verification failed.";
    return { verified: false, address: parsed.address, error: msg };
  }
}

// --- Session Token Generation & Verification ---

export interface SessionPayload {
  address: `0x${string}`;
  issuedAt: number;
  expiresAt: number;
}

export function generateSessionToken(address: `0x${string}`): string {
  const normalized = getAddress(address);
  const now = Date.now();
  const payload: SessionPayload = {
    address: normalized,
    issuedAt: now,
    expiresAt: now + SESSION_TTL_MS
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", getSecretKey()).update(payloadB64).digest("base64url");
  return `${payloadB64}.${signature}`;
}

export function verifySessionToken(token: string): SessionPayload | null {
  if (!token || !token.includes(".")) return null;
  const [payloadB64, signature] = token.split(".");
  if (!payloadB64 || !signature) return null;

  const expectedSig = createHmac("sha256", getSecretKey()).update(payloadB64).digest("base64url");
  if (signature !== expectedSig) return null;

  try {
    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8")) as SessionPayload;
    if (Date.now() > payload.expiresAt) return null;
    return payload;
  } catch {
    return null;
  }
}

export function getAuthenticatedWalletFromRequest(request: Request): `0x${string}` | null {
  const authHeader = request.headers.get("authorization");
  let token: string | null = null;

  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.slice(7).trim();
  } else {
    // Check cookie
    const cookieHeader = request.headers.get("cookie");
    if (cookieHeader) {
      const match = cookieHeader.match(/verdant_session=([^;]+)/);
      if (match) token = match[1];
    }
  }

  if (!token) return null;
  const payload = verifySessionToken(token);
  return payload ? payload.address : null;
}
