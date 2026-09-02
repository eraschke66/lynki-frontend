import { describe, expect, it } from "vitest";
import { getGardenStatus, getScoreSummary } from "./garden";

describe("getGardenStatus", () => {
  it.each([
    [0, "Needs Water"],
    [39, "Needs Water"],
    [40, "Sprouting"],
    [54, "Sprouting"],
    [55, "Growing"],
    [69, "Growing"],
    [70, "Blooming"],
    [84, "Blooming"],
    [85, "Thriving"],
    [100, "Thriving"],
  ])("labels %i%% as %s", (percentage, label) => {
    expect(getGardenStatus(percentage).label).toBe(label);
  });
});

describe("getScoreSummary", () => {
  it("handles zero total without dividing by zero", () => {
    expect(getScoreSummary(0, 0)).toContain("0 of 0");
  });

  it("reports the raw correct/total counts regardless of tier", () => {
    expect(getScoreSummary(8, 10)).toContain("8 of 10");
  });
});
