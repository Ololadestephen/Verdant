import { describe, expect, it } from "vitest";

import { isFreshCapture, isLikelyIndoor, isValidGps } from "@/lib/verification/validators";

describe("verification validators", () => {
  it("checks freshness windows", () => {
    const now = new Date("2026-03-05T12:00:00.000Z");
    expect(isFreshCapture("2026-03-05T11:55:00.000Z", now)).toBe(true);
    expect(isFreshCapture("2026-03-05T11:30:00.000Z", now)).toBe(false);
  });

  it("validates gps ranges", () => {
    expect(isValidGps(6.43, 3.42)).toBe(true);
    expect(isValidGps(100, 3)).toBe(false);
    expect(isValidGps(0, -200)).toBe(false);
  });

  it("detects likely indoor labels", () => {
    expect(isLikelyIndoor(["green grass", "outdoor"])).toBe(false);
    expect(isLikelyIndoor(["office room", "plant"])).toBe(true);
  });
});
