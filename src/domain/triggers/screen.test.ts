import { describe, expect, it } from "vitest";
import { compareScreenTriggers, SCREEN_ZONES } from "./screen";

describe("screen trigger ordering", () => {
  it("places corners before whole edges and then half edges", () => {
    const triggers = Object.keys(SCREEN_ZONES).reverse().map((trigger) => ({ trigger, steps: [] }));
    expect(triggers.sort(compareScreenTriggers).map((item) => item.trigger))
      .toEqual([
        "CornerTL", "CornerBL", "CornerBR", "CornerTR",
        "EdgeTop", "EdgeBottom", "EdgeLeft", "EdgeRight",
        "EdgeTopLeftHalf", "EdgeTopRightHalf",
        "EdgeBottomLeftHalf", "EdgeBottomRightHalf",
        "EdgeLeftTopHalf", "EdgeLeftBottomHalf",
        "EdgeRightTopHalf", "EdgeRightBottomHalf",
      ]);
  });
  it("keeps wheel up before down within each half edge", () => {
    const triggers = [
      { trigger: "EdgeTopRightHalf", steps: ["WD"] },
      { trigger: "EdgeTopLeftHalf", steps: ["WD"] },
      { trigger: "EdgeTopRightHalf", steps: ["WU"] },
      { trigger: "EdgeTopLeftHalf", steps: ["WU"] },
    ];
    expect(triggers.sort(compareScreenTriggers).map((item) => [item.trigger, item.steps[0]]))
      .toEqual([
        ["EdgeTopLeftHalf", "WU"], ["EdgeTopLeftHalf", "WD"],
        ["EdgeTopRightHalf", "WU"], ["EdgeTopRightHalf", "WD"],
      ]);
  });
});
