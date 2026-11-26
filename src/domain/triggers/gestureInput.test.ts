import { describe, expect, it } from "vitest";
import { parseGestureInput } from "./gestureInput";
import { parseScreenInput, SCREEN_ZONES } from "./screen";
import { parseMouseInput } from "./mouse";

describe("gesture input boundaries", () => {
  it.each(["R,🡣,🡢", "R, 🡣, 🡢", "R🡣🡢"])("accepts equivalent spacing: %s", (raw) => {
    expect(parseMouseInput(raw)).toEqual({ trigger: "R", steps: ["D", "R"], error: null });
  });

  it("keeps adjacent arrows separate from a diagonal code", () => {
    expect(parseMouseInput("R🡣🡢").steps).toEqual(["D", "R"]);
    expect(parseMouseInput("R, DR").steps).toEqual(["DR"]);
  });

  it.each(["", "滾輪", "R, 滾輪", "R, garbage", "R,,🡡", "R, 🡡,", "R+R", "R+", "R, 🡡, , 🡣", "R, D+", "R, D:"])("rejects incomplete or unknown input: %s", (raw) => {
    expect(parseGestureInput(raw).error).not.toBeNull();
  });

  it("rejects an unknown fallback instead of treating it as a mouse button", () => {
    expect(parseMouseInput("🡣", "Insert").error).toBe("invalidStroke");
  });

  it("accepts all screen labels in both languages and raw symbols", () => {
    for (const [trigger, zone] of Object.entries(SCREEN_ZONES)) {
      const steps = trigger.startsWith("Edge") ? ["WU"] : [];
      const suffix = steps.length ? ", Wheel↑" : "";
      for (const label of [zone.symbol, `${zone.symbol} ${zone.en}`, `${zone.symbol} ${zone.zh}`, trigger]) {
        expect(parseGestureInput(label + suffix)).toEqual({ trigger, steps, error: null });
      }
    }
  });

  it("rejects incorrect labels and incomplete edges", () => {
    expect(parseScreenInput("⬒ Bottom edge, Wheel↑", "EdgeTop").error).toBe("invalidStroke");
    expect(parseScreenInput("⬒ Edge TL", "EdgeTop").error).toBe("invalidStroke");
    expect(parseScreenInput("⬒", "EdgeTop").error).toBe("invalidStroke");
    expect(parseScreenInput("◰ 左上角, 滾輪", "CornerTL").error).toBe("invalidStroke");
  });
});
