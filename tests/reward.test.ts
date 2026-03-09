import { describe, expect, it } from "vitest";

import { calculateReward, resolveMilestone } from "@/lib/verification/reward";

describe("reward calculations", () => {
  it("applies base reward and multiplier", () => {
    expect(calculateReward(100, 1)).toBeGreaterThan(1);
    expect(calculateReward(100, 30)).toBeGreaterThan(calculateReward(100, 7));
  });

  it("caps reward at daily max", () => {
    expect(calculateReward(1_000_000, 100)).toBe(25);
  });

  it("resolves first unminted milestone", () => {
    expect(resolveMilestone(7, [])).toBe(7);
    expect(resolveMilestone(40, [7])).toBe(30);
    expect(resolveMilestone(120, [7, 30, 100])).toBeUndefined();
  });
});
