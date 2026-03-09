import { VERIFICATION_FRESHNESS_MINUTES } from "@/types/domain";

export function isFreshCapture(capturedAtISO: string, now: Date = new Date()): boolean {
  const capturedAt = new Date(capturedAtISO);
  const deltaMs = now.getTime() - capturedAt.getTime();
  if (Number.isNaN(deltaMs) || deltaMs < 0) return false;
  return deltaMs <= VERIFICATION_FRESHNESS_MINUTES * 60_000;
}

export function isValidGps(latitude: number, longitude: number): boolean {
  return Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180;
}

export function isLikelyIndoor(labels: string[]): boolean {
  const indoorSignals = ["indoor", "room", "ceiling", "desk", "floor", "office", "bedroom", "kitchen"];
  const normalized = labels.map((label) => label.toLowerCase());
  return indoorSignals.some((signal) => normalized.some((label) => label.includes(signal)));
}
